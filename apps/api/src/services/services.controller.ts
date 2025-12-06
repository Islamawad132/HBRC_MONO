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
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto, ServiceResponseDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards';
import { RequirePermissions } from '../common/decorators';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  ConflictResponseDto,
  ErrorResponseDto,
  DeleteResponseDto,
} from '../common/dto';
import { ServiceCategory, ServiceStatus } from '@prisma/client';

@ApiTags('Services')
@ApiBearerAuth()
@Controller('services')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('services:create')
  @ApiOperation({
    summary: 'Create a new service',
    description: `
Create a new service in the HBRC service catalog.

**Required Permission:** \`services:create\`

**Notes:**
- Service code must be unique across all services
- Service name and nameAr (Arabic) are required
- Pricing type determines which price fields are relevant:
  - FIXED: Use basePrice only
  - VARIABLE: Use minPrice and maxPrice
  - CUSTOM: Price determined per request
- All text fields support bilingual (English/Arabic) content
    `,
  })
  @ApiBody({
    type: CreateServiceDto,
    description: 'Service creation data',
    examples: {
      concreteTest: {
        summary: 'Concrete Testing Service',
        description: 'Create a fixed-price concrete testing service',
        value: {
          name: 'Concrete Compression Test',
          nameAr: 'اختبار مقاومة الخرسانة للضغط',
          description: 'Comprehensive concrete compression strength testing',
          descriptionAr: 'اختبار شامل لمقاومة الخرسانة للضغط',
          category: 'CONCRETE_TESTING',
          code: 'CONC-001',
          pricingType: 'FIXED',
          basePrice: 500.0,
          currency: 'EGP',
          duration: 7,
          requirements: 'Concrete samples, Project specifications',
          requirementsAr: 'عينات خرسانة، مواصفات المشروع',
          status: 'ACTIVE',
          isActive: true,
        },
      },
      consultancy: {
        summary: 'Consultancy Service',
        description: 'Create a variable-price consultancy service',
        value: {
          name: 'Structural Engineering Consultation',
          nameAr: 'استشارات هندسية إنشائية',
          description: 'Professional structural engineering consultancy',
          descriptionAr: 'استشارات هندسية إنشائية احترافية',
          category: 'CONSULTANCY',
          code: 'CONS-001',
          pricingType: 'VARIABLE',
          minPrice: 2000.0,
          maxPrice: 10000.0,
          currency: 'EGP',
          duration: 14,
          requirements: 'Project drawings, Technical specifications',
          requirementsAr: 'رسومات المشروع، المواصفات الفنية',
          status: 'ACTIVE',
          isActive: true,
        },
      },
      custom: {
        summary: 'Custom Pricing Service',
        description: 'Create a service with custom pricing',
        value: {
          name: 'Large Scale Project Review',
          nameAr: 'مراجعة مشاريع كبيرة',
          category: 'STRUCTURAL_REVIEW',
          code: 'REV-001',
          pricingType: 'CUSTOM',
          status: 'ACTIVE',
          isActive: true,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Service created successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error - Invalid input data',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated - Valid JWT token required',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires services:create)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Service with the same code already exists',
    type: ConflictResponseDto,
  })
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  @RequirePermissions('services:read')
  @ApiOperation({
    summary: 'Get all services',
    description: `
Retrieve a list of all services in the catalog.

**Required Permission:** \`services:read\`

**Optional Filters:**
- Filter by category (e.g., LAB_TESTS, CONSULTANCY)
- Filter by status (ACTIVE, INACTIVE, ARCHIVED)
- Filter by availability (isActive: true/false)

**Returns:**
- List of services ordered by category and name
    `,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ServiceCategory,
    description: 'Filter by service category',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ServiceStatus,
    description: 'Filter by service status',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by availability (true = active only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Services list retrieved successfully',
    type: [ServiceResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires services:read)',
    type: ForbiddenResponseDto,
  })
  findAll(
    @Query('category') category?: ServiceCategory,
    @Query('status') status?: ServiceStatus,
    @Query('isActive') isActive?: string,
  ) {
    const filters: any = {};
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    return this.servicesService.findAll(filters);
  }

  @Get('stats')
  @RequirePermissions('services:read')
  @ApiOperation({
    summary: 'Get service statistics',
    description: `
Retrieve statistical information about services.

**Required Permission:** \`services:read\`

**Returns:**
- Total number of services
- Services count by category
- Services count by status
- Total active services
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 42 },
        byCategory: {
          type: 'object',
          example: {
            LAB_TESTS: 10,
            CONSULTANCY: 8,
            CONCRETE_TESTING: 15,
          },
        },
        byStatus: {
          type: 'object',
          example: {
            ACTIVE: 38,
            INACTIVE: 3,
            ARCHIVED: 1,
          },
        },
        totalActive: { type: 'number', example: 38 },
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
    description: 'Insufficient permissions (requires services:read)',
    type: ForbiddenResponseDto,
  })
  getStats() {
    return this.servicesService.getServiceStats();
  }

  @Get('category/:category')
  @RequirePermissions('services:read')
  @ApiOperation({
    summary: 'Get services by category',
    description: `
Retrieve all services in a specific category.

**Required Permission:** \`services:read\`
    `,
  })
  @ApiParam({
    name: 'category',
    enum: ServiceCategory,
    description: 'Service category',
    example: ServiceCategory.CONCRETE_TESTING,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Services retrieved successfully',
    type: [ServiceResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires services:read)',
    type: ForbiddenResponseDto,
  })
  findByCategory(@Param('category') category: ServiceCategory) {
    return this.servicesService.findByCategory(category);
  }

  @Get('code/:code')
  @RequirePermissions('services:read')
  @ApiOperation({
    summary: 'Get service by code',
    description: `
Retrieve a specific service by its unique code.

**Required Permission:** \`services:read\`
    `,
  })
  @ApiParam({
    name: 'code',
    description: 'Unique service code',
    example: 'CONC-001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service retrieved successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires services:read)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found',
    type: NotFoundResponseDto,
  })
  findByCode(@Param('code') code: string) {
    return this.servicesService.findByCode(code);
  }

  @Get(':id')
  @RequirePermissions('services:read')
  @ApiOperation({
    summary: 'Get service by ID',
    description: `
Retrieve a specific service by its UUID.

**Required Permission:** \`services:read\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Service UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service retrieved successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires services:read)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found',
    type: NotFoundResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('services:update')
  @ApiOperation({
    summary: 'Update a service',
    description: `
Update an existing service's information.

**Required Permission:** \`services:update\`

**Notes:**
- All fields are optional
- Only provided fields will be updated
- Service code must remain unique if changed
- Pricing type changes may require updating related price fields
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Service UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateServiceDto,
    description: 'Service update data',
    examples: {
      updatePrice: {
        summary: 'Update pricing',
        description: 'Update service base price',
        value: {
          basePrice: 750.0,
        },
      },
      updateStatus: {
        summary: 'Update status',
        description: 'Change service status',
        value: {
          status: 'INACTIVE',
          isActive: false,
        },
      },
      updateDetails: {
        summary: 'Update details',
        description: 'Update service description and requirements',
        value: {
          description: 'Updated service description',
          descriptionAr: 'وصف محدث للخدمة',
          duration: 10,
          requirements: 'Updated requirements list',
          requirementsAr: 'قائمة متطلبات محدثة',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service updated successfully',
    type: ServiceResponseDto,
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
    description: 'Insufficient permissions (requires services:update)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Service code already exists',
    type: ConflictResponseDto,
  })
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('services:delete')
  @ApiOperation({
    summary: 'Delete a service',
    description: `
Permanently delete a service from the catalog.

**Required Permission:** \`services:delete\`

**Warning:**
- This action is irreversible
- Consider setting status to ARCHIVED instead of deleting
- Deleting a service may affect related service requests
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Service UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service deleted successfully',
    type: DeleteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires services:delete)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found',
    type: NotFoundResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
