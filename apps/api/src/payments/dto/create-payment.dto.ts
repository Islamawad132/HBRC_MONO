import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsUrl,
  Min,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Invoice ID to create payment for',
  })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({
    example: 2850.0,
    description: 'Payment amount',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    example: 'EGP',
    description: 'Currency code',
    default: 'EGP',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER,
    description: 'Payment method',
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
    description: 'Payment status',
    default: PaymentStatus.PENDING,
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional({
    example: 'TXN123456789',
    description: 'External transaction ID from payment gateway',
  })
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiPropertyOptional({
    example: 'REF-2024-001',
    description: 'Internal reference number',
  })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Payment completion date',
  })
  @IsDateString()
  @IsOptional()
  paidAt?: string;

  @ApiPropertyOptional({
    example: 'Payment received via bank transfer',
    description: 'Additional notes (English)',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: 'تم استلام الدفع عبر التحويل البنكي',
    description: 'Additional notes (Arabic)',
  })
  @IsString()
  @IsOptional()
  notesAr?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/receipts/payment-001.pdf',
    description: 'URL to payment receipt',
  })
  @IsUrl()
  @IsOptional()
  receiptUrl?: string;
}
