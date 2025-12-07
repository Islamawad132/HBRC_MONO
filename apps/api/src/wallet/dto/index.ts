import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsPositive,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DepositPaymentMethod {
  CARD = 'card',
  WALLET = 'wallet',
  KIOSK = 'kiosk',
}

// DTO for initiating wallet top-up/deposit
export class InitiateDepositDto {
  @ApiProperty({
    example: 100,
    description: 'Amount to deposit in EGP',
    minimum: 10,
    maximum: 50000,
  })
  @IsNumber()
  @IsPositive()
  @Min(10)
  @Max(50000)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({
    enum: DepositPaymentMethod,
    example: 'card',
    description: 'Payment method for deposit',
  })
  @IsOptional()
  @IsEnum(DepositPaymentMethod)
  paymentMethod?: DepositPaymentMethod;
}

// DTO for wallet purchase (deduct from balance)
export class WalletPurchaseDto {
  @ApiProperty({
    example: 50,
    description: 'Amount to deduct from wallet',
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    example: 'publication_purchase',
    description: 'Type of purchase reference',
  })
  @IsString()
  referenceType: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the related entity',
  })
  @IsUUID()
  referenceId: string;

  @ApiPropertyOptional({
    example: 'Purchase of ECP-2024-001',
    description: 'Description in English',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'شراء كود ECP-2024-001',
    description: 'Description in Arabic',
  })
  @IsOptional()
  @IsString()
  descriptionAr?: string;
}

// DTO for admin wallet adjustment
export class WalletAdjustmentDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Customer ID',
  })
  @IsUUID()
  customerId: string;

  @ApiProperty({
    example: 100,
    description: 'Amount to add (positive) or subtract (negative)',
  })
  @IsNumber()
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    example: 'Manual balance correction',
    description: 'Reason for adjustment',
  })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    example: 'تعديل يدوي للرصيد',
    description: 'Reason in Arabic',
  })
  @IsOptional()
  @IsString()
  reasonAr?: string;
}

// Response DTOs
export class WalletResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  customerId: string;

  @ApiProperty({ example: 500.0 })
  balance: number;

  @ApiProperty({ example: 'EGP' })
  currency: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isFrozen: boolean;

  @ApiProperty({ example: 1500.0 })
  totalDeposits: number;

  @ApiProperty({ example: 0 })
  totalWithdrawals: number;

  @ApiProperty({ example: 1000.0 })
  totalPurchases: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;
}

export class WalletTransactionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'WTX-2024-001' })
  transactionNumber: string;

  @ApiProperty({ example: 'DEPOSIT' })
  type: string;

  @ApiProperty({ example: 'COMPLETED' })
  status: string;

  @ApiProperty({ example: 100.0 })
  amount: number;

  @ApiProperty({ example: 400.0 })
  balanceBefore: number;

  @ApiProperty({ example: 500.0 })
  balanceAfter: number;

  @ApiProperty({ example: 'EGP' })
  currency: string;

  @ApiPropertyOptional({ example: 'Wallet top-up via card' })
  description?: string;

  @ApiPropertyOptional({ example: 'شحن المحفظة عبر البطاقة' })
  descriptionAr?: string;

  @ApiPropertyOptional({ example: 'publication_purchase' })
  referenceType?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  referenceId?: string;

  @ApiPropertyOptional({ example: 'CREDIT_CARD' })
  paymentMethod?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;
}

export class DepositResponseDto {
  @ApiProperty({ example: 'WTX-2024-001' })
  transactionNumber: string;

  @ApiProperty({ example: 100.0 })
  amount: number;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiPropertyOptional({ example: 'https://accept.paymob.com/unifiedcheckout/...' })
  checkoutUrl?: string;

  @ApiPropertyOptional({ example: 'For card payments, redirect to this URL' })
  message?: string;
}

export class PurchaseResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'WTX-2024-002' })
  transactionNumber: string;

  @ApiProperty({ example: 50.0 })
  amount: number;

  @ApiProperty({ example: 450.0 })
  newBalance: number;

  @ApiPropertyOptional({ example: 'Insufficient balance' })
  errorMessage?: string;
}

// Query DTOs
export class TransactionQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Items per page',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 'DEPOSIT',
    description: 'Filter by transaction type',
    enum: ['DEPOSIT', 'WITHDRAWAL', 'PURCHASE', 'REFUND', 'ADJUSTMENT'],
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    example: 'COMPLETED',
    description: 'Filter by status',
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
  })
  @IsOptional()
  @IsString()
  status?: string;
}
