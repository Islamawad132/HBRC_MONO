import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator';

export enum PaymentMethod {
  CARD = 'card',
  WALLET = 'wallet',
  KIOSK = 'kiosk',
}

export class CreatePaymentIntentionDto {
  @ApiProperty({ description: 'Amount in EGP (will be converted to cents)' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ default: 'EGP' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Order reference ID from your system' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Description of what is being paid for' })
  @IsString()
  description: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Customer first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Customer last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Customer email' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Customer phone' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: 'Payment items' })
  @IsOptional()
  items?: PaymentItem[];

  @ApiPropertyOptional({ description: 'Return URL after payment' })
  @IsString()
  @IsOptional()
  returnUrl?: string;
}

export class PaymentItem {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

export class PaymobCallbackDto {
  @ApiProperty()
  @IsObject()
  obj: any;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  hmac?: string;
}

export class PaymentIntentionResponseDto {
  @ApiProperty({ description: 'Payment intention ID from Paymob' })
  intentionId: string;

  @ApiProperty({ description: 'Client secret for frontend' })
  clientSecret: string;

  @ApiProperty({ description: 'Checkout URL to redirect user' })
  checkoutUrl: string;

  @ApiProperty({ description: 'Order ID in Paymob' })
  paymobOrderId: string;
}

export class TransactionStatusDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  success: boolean;

  @ApiProperty()
  pending: boolean;

  @ApiProperty()
  amountCents: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional()
  errorMessage?: string;

  @ApiProperty()
  createdAt: string;
}

export class RefundDto {
  @ApiProperty({ description: 'Transaction ID to refund' })
  @IsString()
  transactionId: string;

  @ApiProperty({ description: 'Amount to refund in EGP' })
  @IsNumber()
  amount: number;
}
