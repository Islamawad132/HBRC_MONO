import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';

export class InvoiceResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Invoice unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'INV-2024-0001',
    description: 'Invoice number (auto-generated)',
  })
  invoiceNumber: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Related service request ID',
  })
  requestId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'Customer ID',
  })
  customerId: string;

  @ApiPropertyOptional({
    example: 'Concrete Testing Services',
    description: 'Invoice title (English)',
  })
  title?: string;

  @ApiPropertyOptional({
    example: 'خدمات اختبار الخرسانة',
    description: 'Invoice title (Arabic)',
  })
  titleAr?: string;

  @ApiPropertyOptional({
    example: 'Comprehensive concrete testing',
    description: 'Invoice description (English)',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'اختبار شامل للخرسانة',
    description: 'Invoice description (Arabic)',
  })
  descriptionAr?: string;

  @ApiProperty({
    example: 2500.0,
    description: 'Subtotal before tax',
  })
  subtotal: number;

  @ApiProperty({
    example: 14.0,
    description: 'Tax rate percentage',
  })
  taxRate: number;

  @ApiProperty({
    example: 350.0,
    description: 'Tax amount',
  })
  taxAmount: number;

  @ApiProperty({
    example: 0,
    description: 'Discount amount',
  })
  discount: number;

  @ApiProperty({
    example: 2850.0,
    description: 'Total amount to pay',
  })
  total: number;

  @ApiProperty({
    example: 'EGP',
    description: 'Currency code',
  })
  currency: string;

  @ApiProperty({
    enum: InvoiceStatus,
    example: InvoiceStatus.ISSUED,
    description: 'Invoice status',
  })
  status: InvoiceStatus;

  @ApiPropertyOptional({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Invoice issuance date',
  })
  issuedAt?: Date;

  @ApiPropertyOptional({
    example: '2024-01-15T14:20:00.000Z',
    description: 'Invoice sent date',
  })
  sentAt?: Date;

  @ApiPropertyOptional({
    example: '2024-02-15T23:59:59.000Z',
    description: 'Payment due date',
  })
  dueDate?: Date;

  @ApiPropertyOptional({
    example: '2024-02-10T09:15:00.000Z',
    description: 'Payment received date',
  })
  paidAt?: Date;

  @ApiPropertyOptional({
    example: 'Payment due within 30 days',
    description: 'Additional notes (English)',
  })
  notes?: string;

  @ApiPropertyOptional({
    example: 'الدفع مستحق خلال 30 يوم',
    description: 'Additional notes (Arabic)',
  })
  notesAr?: string;

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
    description: 'Related service request details',
  })
  request?: {
    id: string;
    requestNumber: string;
    title: string;
    titleAr?: string;
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

  @ApiPropertyOptional({
    description: 'Related payments',
    type: 'array',
  })
  payments?: Array<{
    id: string;
    paymentNumber: string;
    amount: number;
    method: string;
    status: string;
    paidAt?: Date;
  }>;
}
