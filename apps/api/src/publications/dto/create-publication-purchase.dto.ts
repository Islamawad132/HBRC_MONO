import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { PurchaseType, PaymentMethod } from '@prisma/client';

export class CreatePublicationPurchaseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Publication ID to purchase',
  })
  @IsUUID()
  publicationId: string;

  @ApiProperty({
    enum: PurchaseType,
    example: PurchaseType.FULL_DOWNLOAD,
    description: 'Type of purchase',
  })
  @IsEnum(PurchaseType)
  purchaseType: PurchaseType;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
    description: 'Payment method',
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    example: '123 Main St, Cairo, Egypt',
    description: 'Shipping address for physical copies',
  })
  @IsString()
  @IsOptional()
  shippingAddress?: string;
}
