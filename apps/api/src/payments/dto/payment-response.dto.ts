import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class PaymentResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Payment unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'PAY-2024-0001',
    description: 'Payment number (auto-generated)',
  })
  paymentNumber: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Related invoice ID',
  })
  invoiceId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'Customer ID',
  })
  customerId: string;

  @ApiProperty({
    example: 2850.0,
    description: 'Payment amount',
  })
  amount: number;

  @ApiProperty({
    example: 'EGP',
    description: 'Currency code',
  })
  currency: string;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER,
    description: 'Payment method',
  })
  method: PaymentMethod;

  @ApiProperty({
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
    description: 'Payment status',
  })
  status: PaymentStatus;

  @ApiPropertyOptional({
    example: 'TXN123456789',
    description: 'External transaction ID',
  })
  transactionId?: string;

  @ApiPropertyOptional({
    example: 'REF-2024-001',
    description: 'Reference number',
  })
  referenceNumber?: string;

  @ApiPropertyOptional({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Payment completion date',
  })
  paidAt?: Date;

  @ApiPropertyOptional({
    example: '2024-01-15T14:30:00.000Z',
    description: 'Payment failure date',
  })
  failedAt?: Date;

  @ApiPropertyOptional({
    example: '2024-01-16T09:00:00.000Z',
    description: 'Refund date',
  })
  refundedAt?: Date;

  @ApiPropertyOptional({
    example: 'Payment received',
    description: 'Additional notes (English)',
  })
  notes?: string;

  @ApiPropertyOptional({
    example: 'تم استلام الدفع',
    description: 'Additional notes (Arabic)',
  })
  notesAr?: string;

  @ApiPropertyOptional({
    example: 'Insufficient funds',
    description: 'Failure reason (English)',
  })
  failureReason?: string;

  @ApiPropertyOptional({
    example: 'رصيد غير كافٍ',
    description: 'Failure reason (Arabic)',
  })
  failureReasonAr?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/receipts/payment-001.pdf',
    description: 'URL to payment receipt',
  })
  receiptUrl?: string;

  @ApiProperty({
    example: '2024-01-15T10:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Related invoice details',
  })
  invoice?: {
    id: string;
    invoiceNumber: string;
    total: number;
    status: string;
  };

  @ApiPropertyOptional({
    description: 'Customer details',
  })
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}
