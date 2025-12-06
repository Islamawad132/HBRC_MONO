import { PartialType } from '@nestjs/swagger';
import { CreatePaymentDto } from './create-payment.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsString } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @ApiPropertyOptional({
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
    description: 'Update payment status',
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional({
    example: '2024-01-15T14:30:00.000Z',
    description: 'Payment failure date',
  })
  @IsDateString()
  @IsOptional()
  failedAt?: string;

  @ApiPropertyOptional({
    example: '2024-01-16T09:00:00.000Z',
    description: 'Refund date',
  })
  @IsDateString()
  @IsOptional()
  refundedAt?: string;

  @ApiPropertyOptional({
    example: 'Insufficient funds',
    description: 'Failure reason (English)',
  })
  @IsString()
  @IsOptional()
  failureReason?: string;

  @ApiPropertyOptional({
    example: 'رصيد غير كافٍ',
    description: 'Failure reason (Arabic)',
  })
  @IsString()
  @IsOptional()
  failureReasonAr?: string;
}
