import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import {
  CreateRequestDto,
  UpdateRequestDto,
  UpdateStatusDto,
  AssignEmployeeDto,
  RequestResponseDto,
} from './dto';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards';
import { RequirePermissions, Public } from '../common/decorators';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  ErrorResponseDto,
  DeleteResponseDto,
} from '../common/dto';
import { RequestStatus, RequestPriority } from '@prisma/client';

@ApiTags('Service Requests')
@ApiBearerAuth()
@Controller('requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('requests:create')
  @ApiOperation({
    summary: 'Create a new service request',
    description: `
Create a new service request for a specific service.

**Required Permission:** \`requests:create\`

**Notes:**
- Request will be created in DRAFT status by default
- Request number is auto-generated (e.g., REQ-2024-001)
- Customer ID is extracted from JWT token
- Service must be active and available
    `,
  })
  @ApiBody({
    type: CreateRequestDto,
    description: 'Request creation data',
    examples: {
      concrete: {
        summary: 'Concrete Testing Request',
        value: {
          serviceId: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Concrete Compression Test',
          titleAr: 'اختبار مقاومة الخرسانة للضغط',
          description: 'Need testing for residential building project',
          descriptionAr: 'مطلوب اختبار لمشروع مبنى سكني',
          priority: 'MEDIUM',
          estimatedPrice: 2500.0,
          expectedDate: '2024-12-20T10:00:00.000Z',
        },
      },
      urgent: {
        summary: 'Urgent Consultancy Request',
        value: {
          serviceId: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Structural Review - Urgent',
          titleAr: 'مراجعة إنشائية - عاجل',
          priority: 'URGENT',
          notes: 'Project deadline approaching',
          notesAr: 'موعد المشروع يقترب',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Request created successfully',
    type: RequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or service not available',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires requests:create)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found',
    type: NotFoundResponseDto,
  })
  create(@Request() req, @Body() createRequestDto: CreateRequestDto) {
    const customerId = req.user.sub; // Extract customer ID from JWT
    return this.requestsService.create(customerId, createRequestDto);
  }

  @Get()
  @RequirePermissions('requests:read')
  @ApiOperation({
    summary: 'Get all service requests',
    description: `
Retrieve a list of all service requests with optional filters.

**Required Permission:** \`requests:read\`

**Optional Filters:**
- Customer ID
- Service ID
- Assigned Employee ID
- Status
- Priority

**Returns:**
- Requests ordered by creation date (newest first)
- Includes customer, service, and assigned employee details
    `,
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    description: 'Filter by customer ID',
  })
  @ApiQuery({
    name: 'serviceId',
    required: false,
    description: 'Filter by service ID',
  })
  @ApiQuery({
    name: 'assignedToId',
    required: false,
    description: 'Filter by assigned employee ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: RequestStatus,
    description: 'Filter by request status',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: RequestPriority,
    description: 'Filter by priority',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Requests list retrieved successfully',
    type: [RequestResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires requests:read)',
    type: ForbiddenResponseDto,
  })
  findAll(
    @Query('customerId') customerId?: string,
    @Query('serviceId') serviceId?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('status') status?: RequestStatus,
    @Query('priority') priority?: RequestPriority,
  ) {
    return this.requestsService.findAll({
      customerId,
      serviceId,
      assignedToId,
      status,
      priority,
    });
  }

  @Get('stats')
  @RequirePermissions('requests:read')
  @ApiOperation({
    summary: 'Get request statistics',
    description: `
Retrieve statistical information about service requests.

**Required Permission:** \`requests:read\`

**Returns:**
- Total number of requests
- Requests count by status
- Requests count by priority
- Assigned vs unassigned count
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 150 },
        byStatus: {
          type: 'object',
          example: {
            DRAFT: 10,
            SUBMITTED: 25,
            UNDER_REVIEW: 15,
            APPROVED: 20,
            IN_PROGRESS: 30,
            COMPLETED: 40,
            DELIVERED: 8,
            REJECTED: 2,
          },
        },
        byPriority: {
          type: 'object',
          example: {
            LOW: 30,
            MEDIUM: 80,
            HIGH: 35,
            URGENT: 5,
          },
        },
        assigned: { type: 'number', example: 120 },
        unassigned: { type: 'number', example: 30 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires requests:read)',
    type: ForbiddenResponseDto,
  })
  getStats() {
    return this.requestsService.getRequestStats();
  }

  @Get('number/:requestNumber')
  @RequirePermissions('requests:read')
  @ApiOperation({
    summary: 'Get request by request number',
    description: `
Retrieve a specific request by its unique request number.

**Required Permission:** \`requests:read\`
    `,
  })
  @ApiParam({
    name: 'requestNumber',
    description: 'Request number',
    example: 'REQ-2024-001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request retrieved successfully',
    type: RequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires requests:read)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Request not found',
    type: NotFoundResponseDto,
  })
  findByRequestNumber(@Param('requestNumber') requestNumber: string) {
    return this.requestsService.findByRequestNumber(requestNumber);
  }

  @Get(':id')
  @RequirePermissions('requests:read')
  @ApiOperation({
    summary: 'Get request by ID',
    description: `
Retrieve a specific request by its UUID.

**Required Permission:** \`requests:read\`

**Note:** This endpoint increments the view count automatically.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Request UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request retrieved successfully',
    type: RequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires requests:read)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Request not found',
    type: NotFoundResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('requests:update')
  @ApiOperation({
    summary: 'Update a request',
    description: `
Update an existing request's information.

**Required Permission:** \`requests:update\`

**Notes:**
- All fields are optional
- Only provided fields will be updated
- Use /requests/:id/status endpoint for status changes
- Use /requests/:id/assign endpoint for employee assignment
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Request UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateRequestDto,
    description: 'Request update data',
    examples: {
      updatePriority: {
        summary: 'Update priority',
        value: { priority: 'HIGH' },
      },
      updateDetails: {
        summary: 'Update details',
        value: {
          title: 'Updated Title',
          titleAr: 'عنوان محدث',
          notes: 'Additional information',
          notesAr: 'معلومات إضافية',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request updated successfully',
    type: RequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires requests:update)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Request not found',
    type: NotFoundResponseDto,
  })
  update(@Param('id') id: string, @Body() updateRequestDto: UpdateRequestDto) {
    return this.requestsService.update(id, updateRequestDto);
  }

  @Patch(':id/status')
  @RequirePermissions('requests:update-status')
  @ApiOperation({
    summary: 'Update request status',
    description: `
Update the status of a request following the status workflow.

**Required Permission:** \`requests:update-status\`

**Status Workflow:**
- DRAFT → SUBMITTED | CANCELLED
- SUBMITTED → UNDER_REVIEW | REJECTED | CANCELLED
- UNDER_REVIEW → APPROVED | REJECTED | ON_HOLD | CANCELLED
- APPROVED → IN_PROGRESS | CANCELLED
- IN_PROGRESS → COMPLETED | ON_HOLD | CANCELLED
- COMPLETED → DELIVERED
- ON_HOLD → IN_PROGRESS | UNDER_REVIEW | CANCELLED

**Notes:**
- Invalid transitions will be rejected with error
- REJECTED status requires rejection reason
- CANCELLED status requires cancellation reason
- COMPLETED status sets completedAt timestamp
- DELIVERED status sets deliveredAt timestamp
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Request UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateStatusDto,
    examples: {
      approve: {
        summary: 'Approve request',
        value: {
          status: 'APPROVED',
        },
      },
      reject: {
        summary: 'Reject request',
        value: {
          status: 'REJECTED',
          reason: 'Does not meet technical requirements',
          reasonAr: 'لا يستوفي المتطلبات الفنية',
        },
      },
      complete: {
        summary: 'Mark as completed',
        value: {
          status: 'COMPLETED',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status updated successfully',
    type: RequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires requests:update-status)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Request not found',
    type: NotFoundResponseDto,
  })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.requestsService.updateStatus(id, updateStatusDto);
  }

  @Patch(':id/assign')
  @RequirePermissions('requests:assign')
  @ApiOperation({
    summary: 'Assign employee to request',
    description: `
Assign a specific employee to handle this request.

**Required Permission:** \`requests:assign\`

**Notes:**
- Employee must exist and be active
- Sets assignedAt timestamp
- Can be reassigned to different employee
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Request UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: AssignEmployeeDto,
    examples: {
      assign: {
        summary: 'Assign to employee',
        value: {
          employeeId: '550e8400-e29b-41d4-a716-446655440001',
          notes: 'Assigned to senior engineer',
          notesAr: 'تم التعيين للمهندس الأول',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employee assigned successfully',
    type: RequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Employee is not active',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires requests:assign)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Request or employee not found',
    type: NotFoundResponseDto,
  })
  assignEmployee(
    @Param('id') id: string,
    @Body() assignEmployeeDto: AssignEmployeeDto,
  ) {
    return this.requestsService.assignEmployee(id, assignEmployeeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('requests:delete')
  @ApiOperation({
    summary: 'Delete a request',
    description: `
Permanently delete a request from the system.

**Required Permission:** \`requests:delete\`

**Warning:**
- This action is irreversible
- Consider changing status to CANCELLED instead
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Request UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request deleted successfully',
    type: DeleteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires requests:delete)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Request not found',
    type: NotFoundResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.requestsService.remove(id);
  }
}
