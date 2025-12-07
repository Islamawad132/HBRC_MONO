import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import * as crypto from 'crypto';
import {
  CreatePaymentIntentionDto,
  PaymentIntentionResponseDto,
  PaymentMethod,
  TransactionStatusDto,
} from './dto';

@Injectable()
export class PaymobService {
  private readonly logger = new Logger(PaymobService.name);
  private readonly baseUrl = 'https://accept.paymob.com/v1';
  private readonly legacyBaseUrl = 'https://accept.paymob.com/api';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  private get secretKey(): string {
    return this.configService.get<string>('PAYMOB_SECRET_KEY') || '';
  }

  private get publicKey(): string {
    return this.configService.get<string>('PAYMOB_PUBLIC_KEY') || '';
  }

  private get hmacSecret(): string {
    return this.configService.get<string>('PAYMOB_HMAC_SECRET') || '';
  }

  private get cardIntegrationId(): string {
    return this.configService.get<string>('PAYMOB_CARD_INTEGRATION_ID') || '';
  }

  private get walletIntegrationId(): string {
    return this.configService.get<string>('PAYMOB_WALLET_INTEGRATION_ID') || '';
  }

  private get kioskIntegrationId(): string {
    return this.configService.get<string>('PAYMOB_KIOSK_INTEGRATION_ID') || '';
  }

  private getIntegrationId(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.CARD:
        return this.cardIntegrationId;
      case PaymentMethod.WALLET:
        // Fall back to card if wallet integration not configured
        return this.walletIntegrationId || this.cardIntegrationId;
      case PaymentMethod.KIOSK:
        // Fall back to card if kiosk integration not configured
        return this.kioskIntegrationId || this.cardIntegrationId;
      default:
        return this.cardIntegrationId;
    }
  }

  /**
   * Create a payment intention using Paymob's Unified Intention API
   */
  async createPaymentIntention(dto: CreatePaymentIntentionDto): Promise<PaymentIntentionResponseDto> {
    try {
      const amountCents = Math.round(dto.amount * 100);
      const integrationId = this.getIntegrationId(dto.paymentMethod);

      const items = dto.items || [
        {
          name: dto.description,
          amount: amountCents,
          description: dto.description,
          quantity: 1,
        },
      ];

      const payload = {
        amount: amountCents,
        currency: dto.currency || 'EGP',
        payment_methods: [parseInt(integrationId, 10)],
        items: items.map((item) => ({
          name: item.name,
          amount: Math.round(item.amount * 100),
          description: item.description || item.name,
          quantity: item.quantity,
        })),
        billing_data: {
          apartment: 'NA',
          floor: 'NA',
          street: 'NA',
          building: 'NA',
          shipping_method: 'NA',
          postal_code: 'NA',
          city: 'NA',
          country: 'EG',
          email: dto.email,
          first_name: dto.firstName,
          last_name: dto.lastName,
          phone_number: (dto.phone || '').replace(/[^0-9+]/g, '').slice(0, 15) || 'NA',
          state: 'NA',
        },
        customer: {
          first_name: dto.firstName,
          last_name: dto.lastName,
          email: dto.email,
        },
        extras: {
          merchant_order_id: dto.orderId,
        },
        special_reference: dto.orderId,
        redirection_url: dto.returnUrl || this.configService.get<string>('PAYMOB_RETURN_URL'),
        notification_url: this.configService.get<string>('PAYMOB_WEBHOOK_URL'),
      };

      this.logger.debug(`Creating payment intention for order: ${dto.orderId}`);

      const response = await firstValueFrom(
        this.httpService.post<{ client_secret: string; id: string; payment_keys?: { order_id?: string }[] }>(
          `${this.baseUrl}/intention/`,
          payload,
          {
            headers: {
              'Authorization': `Token ${this.secretKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const { client_secret, id, payment_keys } = response.data;

      // Build checkout URL
      const checkoutUrl = `https://accept.paymob.com/unifiedcheckout/?publicKey=${this.publicKey}&clientSecret=${client_secret}`;

      this.logger.log(`Payment intention created: ${id} for order: ${dto.orderId}`);

      return {
        intentionId: id,
        clientSecret: client_secret,
        checkoutUrl,
        paymobOrderId: payment_keys?.[0]?.order_id || id,
      };
    } catch (error) {
      this.logger.error(`Failed to create payment intention: ${error.message}`, error.stack);
      if (error.response?.data) {
        this.logger.error(`Paymob error response: ${JSON.stringify(error.response.data)}`);
        const errorDetail = error.response.data.detail || error.response.data.message || error.response.data.merchant_order_id;
        throw new BadRequestException({
          message: 'Payment creation failed',
          messageAr: 'فشل في إنشاء عملية الدفع',
          detail: errorDetail,
        });
      }
      throw new InternalServerErrorException('Failed to create payment');
    }
  }

  /**
   * Verify HMAC signature from Paymob callback
   */
  verifyHmac(data: any, receivedHmac: string): boolean {
    if (!this.hmacSecret) {
      this.logger.warn('HMAC secret not configured, skipping verification');
      return true;
    }

    // HMAC calculation keys in lexicographical order (for processed callback)
    const hmacKeys = [
      'amount_cents',
      'created_at',
      'currency',
      'error_occured',
      'has_parent_transaction',
      'id',
      'integration_id',
      'is_3d_secure',
      'is_auth',
      'is_capture',
      'is_refunded',
      'is_standalone_payment',
      'is_voided',
      'order.id',
      'owner',
      'pending',
      'source_data.pan',
      'source_data.sub_type',
      'source_data.type',
      'success',
    ];

    // Concatenate values in order
    let concatenatedString = '';
    for (const key of hmacKeys) {
      const keys = key.split('.');
      let value = data;
      for (const k of keys) {
        value = value?.[k];
      }
      concatenatedString += value?.toString() || '';
    }
    
    this.logger.debug(`HMAC concat string: ${concatenatedString}`);

    // Calculate HMAC-SHA512
    const calculatedHmac = crypto
      .createHmac('sha512', this.hmacSecret)
      .update(concatenatedString)
      .digest('hex');

    return calculatedHmac === receivedHmac;
  }

  /**
   * Handle transaction callback from Paymob
   */
  async handleCallback(data: any): Promise<{ success: boolean; transactionId: string; orderId: string }> {
    const obj = data.obj || data;
    const transactionId = obj.id?.toString();
    const orderId = obj.order?.id?.toString() || obj.order?.toString();
    const merchantOrderId = obj.merchant_order_id || obj.order?.merchant_order_id;
    const success = obj.success === true;
    const pending = obj.pending === true;
    const amountCents = obj.amount_cents;

    this.logger.log(`Processing callback for transaction: ${transactionId}, order: ${orderId}, success: ${success}`);

    // Update relevant records based on merchant_order_id
    // This should update PublicationPurchase, Invoice, Payment, or WalletTransaction depending on the context
    if (merchantOrderId) {
      // Check if this is a wallet transaction (WTX-YYYY-NNNNNN format)
      if (merchantOrderId.startsWith('WTX-')) {
        const walletTransaction = await this.prisma.walletTransaction.findUnique({
          where: { transactionNumber: merchantOrderId },
          include: { wallet: true },
        });

        if (walletTransaction && walletTransaction.status === 'PENDING') {
          const amount = Number(walletTransaction.amount);
          const currentBalance = Number(walletTransaction.wallet.balance);
          const newBalance = success ? currentBalance + amount : currentBalance;

          await this.prisma.$transaction([
            this.prisma.walletTransaction.update({
              where: { id: walletTransaction.id },
              data: {
                status: success ? 'COMPLETED' : 'FAILED',
                balanceAfter: newBalance,
                externalTransactionId: transactionId,
                processedAt: new Date(),
                failureReason: success ? null : 'Payment failed',
              },
            }),
            ...(success ? [
              this.prisma.wallet.update({
                where: { id: walletTransaction.walletId },
                data: {
                  balance: { increment: amount },
                  totalDeposits: { increment: amount },
                },
              }),
            ] : []),
          ]);
          this.logger.log(`Updated wallet transaction ${merchantOrderId} status to ${success ? 'COMPLETED' : 'FAILED'}`);
        }
      }

      // Try to find and update publication purchase (PUB-YYYY-NNNNNN format)
      if (merchantOrderId.startsWith('PUB-')) {
        const purchase = await this.prisma.publicationPurchase.findFirst({
          where: { purchaseNumber: merchantOrderId },
        });

        if (purchase) {
          await this.prisma.publicationPurchase.update({
            where: { id: purchase.id },
            data: {
              status: success ? 'PAID' : (pending ? 'PENDING' : 'CANCELLED'),
              paymentId: transactionId,
              paidAt: success ? new Date() : null,
            },
          });
          this.logger.log(`Updated publication purchase ${purchase.id} status to ${success ? 'PAID' : 'CANCELLED'}`);
        }
      }

      // Try to find and update payment (for other types)
      const payment = await this.prisma.payment.findFirst({
        where: { referenceNumber: merchantOrderId },
      });

      if (payment) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: success ? 'PAID' : (pending ? 'PENDING' : 'FAILED'),
            transactionId,
            paidAt: success ? new Date() : null,
          },
        });
        this.logger.log(`Updated payment ${payment.id} status to ${success ? 'PAID' : 'FAILED'}`);

        // Update invoice if payment is linked
        if (payment.invoiceId && success) {
          await this.prisma.invoice.update({
            where: { id: payment.invoiceId },
            data: {
              status: 'PAID',
              paidAt: new Date(),
            },
          });
        }
      }
    }

    return {
      success,
      transactionId,
      orderId,
    };
  }

  /**
   * Get transaction status by ID
   */
  async getTransactionStatus(transactionId: string): Promise<TransactionStatusDto> {
    try {
      // First authenticate to get token
      const authResponse = await firstValueFrom(
        this.httpService.post<{ token: string }>(`${this.legacyBaseUrl}/auth/tokens`, {
          api_key: this.configService.get<string>('PAYMOB_API_KEY'),
        }),
      );

      const token = authResponse.data.token;

      // Get transaction
      const response = await firstValueFrom(
        this.httpService.get<any>(`${this.legacyBaseUrl}/acceptance/transactions/${transactionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
      );

      const tx = response.data;

      return {
        id: tx.id?.toString(),
        success: tx.success,
        pending: tx.pending,
        amountCents: tx.amount_cents,
        currency: tx.currency,
        errorMessage: tx.data?.message,
        createdAt: tx.created_at,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get transaction status: ${error.message}`);
      throw new BadRequestException('Failed to retrieve transaction status');
    }
  }

  /**
   * Refund a transaction
   */
  async refundTransaction(transactionId: string, amount: number): Promise<{ success: boolean; refundId: string }> {
    try {
      // Authenticate
      const authResponse = await firstValueFrom(
        this.httpService.post<{ token: string }>(`${this.legacyBaseUrl}/auth/tokens`, {
          api_key: this.configService.get<string>('PAYMOB_API_KEY'),
        }),
      );

      const token = authResponse.data.token;
      const amountCents = Math.round(amount * 100);

      // Refund
      const response = await firstValueFrom(
        this.httpService.post<{ success: boolean; id: number | string }>(
          `${this.legacyBaseUrl}/acceptance/void_refund/refund`,
          {
            auth_token: token,
            transaction_id: transactionId,
            amount_cents: amountCents,
          },
        ),
      );

      this.logger.log(`Refund processed for transaction ${transactionId}: ${response.data.id}`);

      return {
        success: response.data.success,
        refundId: response.data.id?.toString(),
      };
    } catch (error: any) {
      this.logger.error(`Failed to refund transaction: ${error.message}`);
      throw new BadRequestException('Failed to process refund');
    }
  }

  /**
   * Void a transaction (before settlement)
   */
  async voidTransaction(transactionId: string): Promise<{ success: boolean }> {
    try {
      // Authenticate
      const authResponse = await firstValueFrom(
        this.httpService.post<{ token: string }>(`${this.legacyBaseUrl}/auth/tokens`, {
          api_key: this.configService.get<string>('PAYMOB_API_KEY'),
        }),
      );

      const token = authResponse.data.token;

      // Void
      const response = await firstValueFrom(
        this.httpService.post<{ success: boolean }>(
          `${this.legacyBaseUrl}/acceptance/void_refund/void?token=${token}`,
          {
            transaction_id: transactionId,
          },
        ),
      );

      this.logger.log(`Transaction ${transactionId} voided`);

      return {
        success: response.data.success,
      };
    } catch (error: any) {
      this.logger.error(`Failed to void transaction: ${error.message}`);
      throw new BadRequestException('Failed to void transaction');
    }
  }
}
