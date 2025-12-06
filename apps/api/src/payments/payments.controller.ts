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
import { PaymentsService } from './payments.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentResponseDto,
} from './dto';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards';
import { RequirePermissions } from '../common/decorators';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  ErrorResponseDto,
  DeleteResponseDto,
} from '../common/dto';
import { PaymentStatus } from '@prisma/client';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('payments:create')
  @ApiOperation({
    summary: 'Create a new payment',
    description: `
Create a new payment for an invoice.

**Required Permission:** \`payments:create\`

**Notes:**
- Payment will be created for a specific invoice
- Payment number is auto-generated (e.g., PAY-2024-001)
- Customer ID is extracted from the invoice
- Payment amount cannot exceed remaining invoice balance
- Invoice status is automatically updated based on payment
- Cannot create payment for cancelled invoices
    `,
  })
  @ApiBody({
    type: CreatePaymentDto,
    description: 'Payment creation data',
    examples: {
      bankTransfer: {
        summary: 'Bank transfer payment',
        description: 'Payment via bank transfer',
        value: {
          invoiceId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 2850.0,
          method: 'BANK_TRANSFER',
          status: 'PAID',
          transactionId: 'TXN123456789',
          referenceNumber: 'REF-2024-001',
          paidAt: '2024-01-15T10:30:00.000Z',
          notes: 'Payment received via bank transfer',
          notesAr: 'تم استلام الدفع عبر التحويل البنكي',
        },
      },
      pending: {
        summary: 'Pending payment',
        description: 'Payment pending confirmation',
        value: {
          invoiceId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 2850.0,
          method: 'CREDIT_CARD',
          status: 'PENDING',
        },
      },
      cash: {
        summary: 'Cash payment',
        description: 'Cash payment received',
        value: {
          invoiceId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 2850.0,
          method: 'CASH',
          status: 'PAID',
          receiptUrl: 'https://example.com/receipts/payment-001.pdf',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment created successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or payment amount exceeds balance',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires payments:create)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
    type: NotFoundResponseDto,
  })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @RequirePermissions('payments:read')
  @ApiOperation({
    summary: 'Get all payments',
    description: `
Retrieve a list of all payments with optional filters.

**Required Permission:** \`payments:read\`

**Optional Filters:**
- Customer ID
- Invoice ID
- Status

**Returns:**
- Payments ordered by creation date (newest first)
- Includes customer and invoice details
    `,
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    description: 'Filter by customer ID',
  })
  @ApiQuery({
    name: 'invoiceId',
    required: false,
    description: 'Filter by invoice ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PaymentStatus,
    description: 'Filter by payment status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payments list retrieved successfully',
    type: [PaymentResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires payments:read)',
    type: ForbiddenResponseDto,
  })
  findAll(
    @Query('customerId') customerId?: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('status') status?: PaymentStatus,
  ) {
    return this.paymentsService.findAll({ customerId, invoiceId, status });
  }

  @Get('stats')
  @RequirePermissions('payments:read')
  @ApiOperation({
    summary: 'Get payment statistics',
    description: `
Retrieve statistical information about payments.

**Required Permission:** \`payments:read\`

**Returns:**
- Total number of payments
- Payments count by status
- Total payment amount
- Paid amount
- Pending amount
- Refunded amount
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
            PENDING: 20,
            PAID: 100,
            PARTIALLY_PAID: 10,
            FAILED: 5,
            REFUNDED: 10,
            CANCELLED: 5,
          },
        },
        totalAmount: { type: 'number', example: 400000.0 },
        paidAmount: { type: 'number', example: 350000.0 },
        pendingAmount: { type: 'number', example: 30000.0 },
        refundedAmount: { type: 'number', example: 20000.0 },
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
    description: 'Insufficient permissions (requires payments:read)',
    type: ForbiddenResponseDto,
  })
  getStats() {
    return this.paymentsService.getPaymentStats();
  }

  @Get('number/:paymentNumber')
  @RequirePermissions('payments:read')
  @ApiOperation({
    summary: 'Get payment by payment number',
    description: `
Retrieve a specific payment by its unique payment number.

**Required Permission:** \`payments:read\`
    `,
  })
  @ApiParam({
    name: 'paymentNumber',
    description: 'Payment number',
    example: 'PAY-2024-0001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment retrieved successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires payments:read)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
    type: NotFoundResponseDto,
  })
  findByPaymentNumber(@Param('paymentNumber') paymentNumber: string) {
    return this.paymentsService.findByPaymentNumber(paymentNumber);
  }

  @Get(':id')
  @RequirePermissions('payments:read')
  @ApiOperation({
    summary: 'Get payment by ID',
    description: `
Retrieve a specific payment by its UUID.

**Required Permission:** \`payments:read\`

**Includes:**
- Customer details
- Related invoice information
- Associated service request
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Payment UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment retrieved successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires payments:read)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
    type: NotFoundResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('payments:update')
  @ApiOperation({
    summary: 'Update a payment',
    description: `
Update an existing payment's information.

**Required Permission:** \`payments:update\`

**Notes:**
- All fields are optional
- Only provided fields will be updated
- Status-specific timestamps are automatically set
- Updating to PAID status will update invoice accordingly
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Payment UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdatePaymentDto,
    description: 'Payment update data',
    examples: {
      markAsPaid: {
        summary: 'Mark as paid',
        value: {
          status: 'PAID',
          transactionId: 'TXN123456789',
          paidAt: '2024-01-15T10:30:00.000Z',
        },
      },
      markAsFailed: {
        summary: 'Mark as failed',
        value: {
          status: 'FAILED',
          failureReason: 'Insufficient funds',
          failureReasonAr: 'رصيد غير كافٍ',
          failedAt: '2024-01-15T14:30:00.000Z',
        },
      },
      refund: {
        summary: 'Process refund',
        value: {
          status: 'REFUNDED',
          refundedAt: '2024-01-16T09:00:00.000Z',
          notes: 'Refund processed',
          notesAr: 'تم معالجة الاسترداد',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment updated successfully',
    type: PaymentResponseDto,
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
    description: 'Insufficient permissions (requires payments:update)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
    type: NotFoundResponseDto,
  })
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('payments:delete')
  @ApiOperation({
    summary: 'Delete a payment',
    description: `
Permanently delete a payment from the system.

**Required Permission:** \`payments:delete\`

**Warning:**
- This action is irreversible
- Cannot delete PAID payments (use refund instead)
- Consider changing status to CANCELLED instead
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Payment UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment deleted successfully',
    type: DeleteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete paid payment',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires payments:delete)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
    type: NotFoundResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }
}
