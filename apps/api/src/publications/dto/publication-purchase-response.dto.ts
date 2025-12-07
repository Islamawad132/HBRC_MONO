import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PurchaseType, PublicationPurchaseStatus, PaymentMethod } from '@prisma/client';
import { PublicationResponseDto } from './publication-response.dto';

export class PublicationPurchaseResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'PUB-2024-001' })
  purchaseNumber: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  customerId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  publicationId: string;

  @ApiPropertyOptional({ type: () => PublicationResponseDto })
  publication?: PublicationResponseDto;

  @ApiProperty({ enum: PurchaseType, example: PurchaseType.FULL_DOWNLOAD })
  purchaseType: PurchaseType;

  @ApiProperty({ enum: PublicationPurchaseStatus, example: PublicationPurchaseStatus.PAID })
  status: PublicationPurchaseStatus;

  @ApiProperty({ example: 500.0 })
  price: number;

  @ApiProperty({ example: 'EGP' })
  currency: string;

  @ApiPropertyOptional({ enum: PaymentMethod, example: PaymentMethod.CREDIT_CARD })
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: 'TXN-123456' })
  paymentId?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  paidAt?: Date;

  @ApiProperty({ example: 1 })
  downloadCount: number;

  @ApiProperty({ example: 3 })
  maxDownloads: number;

  @ApiPropertyOptional({ example: '2024-02-15T10:30:00.000Z' })
  expiresAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  lastAccessedAt?: Date;

  @ApiPropertyOptional({ example: '123 Main St, Cairo, Egypt' })
  shippingAddress?: string;

  @ApiPropertyOptional({ example: '2024-01-16T10:30:00.000Z' })
  shippedAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-18T10:30:00.000Z' })
  deliveredAt?: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}
