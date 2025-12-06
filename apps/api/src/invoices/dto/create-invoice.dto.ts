import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { InvoiceStatus } from '@prisma/client';

export class CreateInvoiceDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Service request ID to create invoice for',
  })
  @IsUUID()
  requestId: string;

  @ApiPropertyOptional({
    example: 'Concrete Testing Services',
    description: 'Invoice title (English)',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'خدمات اختبار الخرسانة',
    description: 'Invoice title (Arabic)',
  })
  @IsString()
  @IsOptional()
  titleAr?: string;

  @ApiPropertyOptional({
    example: 'Comprehensive concrete testing for residential project',
    description: 'Invoice description (English)',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'اختبار شامل للخرسانة لمشروع سكني',
    description: 'Invoice description (Arabic)',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiProperty({
    example: 2500.0,
    description: 'Invoice subtotal before tax and discount',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({
    example: 14.0,
    description: 'Tax rate percentage (0-100)',
    default: 14.0,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  taxRate?: number;

  @ApiPropertyOptional({
    example: 100.0,
    description: 'Discount amount',
    default: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({
    example: 'EGP',
    description: 'Currency code',
    default: 'EGP',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    enum: InvoiceStatus,
    example: InvoiceStatus.DRAFT,
    description: 'Invoice status',
    default: InvoiceStatus.DRAFT,
  })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    description: 'Invoice due date',
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({
    example: 'Payment due within 30 days',
    description: 'Additional notes (English)',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: 'الدفع مستحق خلال 30 يوم',
    description: 'Additional notes (Arabic)',
  })
  @IsString()
  @IsOptional()
  notesAr?: string;
}
