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
import { InvoicesService } from './invoices.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceResponseDto,
} from './dto';
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
import { InvoiceStatus } from '@prisma/client';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('invoices:create')
  @ApiOperation({
    summary: 'Create a new invoice',
    description: `
Create a new invoice for a service request.

**Required Permission:** \`invoices:create\`

**Notes:**
- Invoice will be created for a specific service request
- Invoice number is auto-generated (e.g., INV-2024-001)
- Tax amount and total are automatically calculated
- Default tax rate is 14% if not specified
- Each request can only have one invoice
    `,
  })
  @ApiBody({
    type: CreateInvoiceDto,
    description: 'Invoice creation data',
    examples: {
      basic: {
        summary: 'Basic invoice',
        description: 'Create invoice with minimal fields',
        value: {
          requestId: '550e8400-e29b-41d4-a716-446655440000',
          subtotal: 2500.0,
        },
      },
      full: {
        summary: 'Full invoice',
        description: 'Create invoice with all fields',
        value: {
          requestId: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Concrete Testing Invoice',
          titleAr: 'فاتورة اختبار الخرسانة',
          description: 'Invoice for concrete testing services',
          descriptionAr: 'فاتورة خدمات اختبار الخرسانة',
          subtotal: 2500.0,
          taxRate: 14.0,
          discount: 100.0,
          currency: 'EGP',
          status: 'DRAFT',
          dueDate: '2024-12-31T23:59:59.000Z',
          notes: 'Payment due within 30 days',
          notesAr: 'الدفع مستحق خلال 30 يوم',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Invoice created successfully',
    type: InvoiceResponseDto,
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
    description: 'Insufficient permissions (requires invoices:create)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service request not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Invoice already exists for this request',
    type: ConflictResponseDto,
  })
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  @RequirePermissions('invoices:read')
  @ApiOperation({
    summary: 'Get all invoices',
    description: `
Retrieve a list of all invoices with optional filters.

**Required Permission:** \`invoices:read\`

**Optional Filters:**
- Customer ID
- Status

**Returns:**
- Invoices ordered by creation date (newest first)
- Includes customer, request, and payment details
    `,
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    description: 'Filter by customer ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: InvoiceStatus,
    description: 'Filter by invoice status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoices list retrieved successfully',
    type: [InvoiceResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires invoices:read)',
    type: ForbiddenResponseDto,
  })
  findAll(
    @Query('customerId') customerId?: string,
    @Query('status') status?: InvoiceStatus,
  ) {
    return this.invoicesService.findAll({ customerId, status });
  }

  @Get('stats')
  @RequirePermissions('invoices:read')
  @ApiOperation({
    summary: 'Get invoice statistics',
    description: `
Retrieve statistical information about invoices.

**Required Permission:** \`invoices:read\`

**Returns:**
- Total number of invoices
- Invoices count by status
- Total amount across all invoices
- Paid amount
- Unpaid amount
- Overdue invoices count
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 125 },
        byStatus: {
          type: 'object',
          example: {
            DRAFT: 10,
            ISSUED: 30,
            SENT: 25,
            PAID: 50,
            OVERDUE: 8,
            CANCELLED: 2,
          },
        },
        totalAmount: { type: 'number', example: 350000.0 },
        paidAmount: { type: 'number', example: 250000.0 },
        unpaidAmount: { type: 'number', example: 100000.0 },
        overdueCount: { type: 'number', example: 8 },
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
    description: 'Insufficient permissions (requires invoices:read)',
    type: ForbiddenResponseDto,
  })
  getStats() {
    return this.invoicesService.getInvoiceStats();
  }

  @Get('number/:invoiceNumber')
  @RequirePermissions('invoices:read')
  @ApiOperation({
    summary: 'Get invoice by invoice number',
    description: `
Retrieve a specific invoice by its unique invoice number.

**Required Permission:** \`invoices:read\`
    `,
  })
  @ApiParam({
    name: 'invoiceNumber',
    description: 'Invoice number',
    example: 'INV-2024-0001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice retrieved successfully',
    type: InvoiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires invoices:read)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
    type: NotFoundResponseDto,
  })
  findByInvoiceNumber(@Param('invoiceNumber') invoiceNumber: string) {
    return this.invoicesService.findByInvoiceNumber(invoiceNumber);
  }

  @Get(':id')
  @RequirePermissions('invoices:read')
  @ApiOperation({
    summary: 'Get invoice by ID',
    description: `
Retrieve a specific invoice by its UUID.

**Required Permission:** \`invoices:read\`

**Includes:**
- Customer details
- Related service request
- All associated payments
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice retrieved successfully',
    type: InvoiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires invoices:read)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
    type: NotFoundResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('invoices:update')
  @ApiOperation({
    summary: 'Update an invoice',
    description: `
Update an existing invoice's information.

**Required Permission:** \`invoices:update\`

**Notes:**
- All fields are optional
- Only provided fields will be updated
- Tax amount and total are recalculated if financial fields change
- Status-specific timestamps are automatically set
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateInvoiceDto,
    description: 'Invoice update data',
    examples: {
      updateStatus: {
        summary: 'Update status',
        value: { status: 'ISSUED' },
      },
      updateAmount: {
        summary: 'Update financial details',
        value: {
          subtotal: 3000.0,
          discount: 200.0,
        },
      },
      updateDueDate: {
        summary: 'Update due date',
        value: {
          dueDate: '2024-12-31T23:59:59.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice updated successfully',
    type: InvoiceResponseDto,
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
    description: 'Insufficient permissions (requires invoices:update)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
    type: NotFoundResponseDto,
  })
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, updateInvoiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('invoices:delete')
  @ApiOperation({
    summary: 'Delete an invoice',
    description: `
Permanently delete an invoice from the system.

**Required Permission:** \`invoices:delete\`

**Warning:**
- This action is irreversible
- Cannot delete invoices with associated payments
- Consider changing status to CANCELLED instead
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice deleted successfully',
    type: DeleteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invoice has associated payments',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires invoices:delete)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
    type: NotFoundResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }
}
