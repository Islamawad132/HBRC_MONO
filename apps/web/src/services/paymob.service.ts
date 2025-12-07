import { httpClient } from './httpclient';

export type PaymentMethod = 'card' | 'wallet' | 'kiosk';

export interface CreatePaymentRequest {
  amount: number;
  currency?: string;
  orderId: string;
  description: string;
  paymentMethod: PaymentMethod;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  returnUrl?: string;
  items?: PaymentItem[];
}

export interface PaymentItem {
  name: string;
  description?: string;
  amount: number;
  quantity: number;
}

export interface PaymentIntentionResponse {
  intentionId: string;
  clientSecret: string;
  checkoutUrl: string;
  paymobOrderId: string;
}

export interface TransactionStatus {
  id: string;
  success: boolean;
  pending: boolean;
  amountCents: number;
  currency: string;
  errorMessage?: string;
  createdAt: string;
}

export interface RefundRequest {
  transactionId: string;
  amount: number;
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
}

const ENDPOINTS = {
  createPayment: '/paymob/create-payment',
  transaction: (id: string) => `/paymob/transaction/${id}`,
  refund: '/paymob/refund',
  void: (id: string) => `/paymob/void/${id}`,
};

class PaymobService {
  /**
   * Create a payment intention and get checkout URL
   */
  async createPayment(data: CreatePaymentRequest): Promise<PaymentIntentionResponse> {
    return httpClient.post<PaymentIntentionResponse>(ENDPOINTS.createPayment, data);
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    return httpClient.get<TransactionStatus>(ENDPOINTS.transaction(transactionId));
  }

  /**
   * Refund a transaction
   */
  async refundTransaction(data: RefundRequest): Promise<RefundResponse> {
    return httpClient.post<RefundResponse>(ENDPOINTS.refund, data);
  }

  /**
   * Void a transaction
   */
  async voidTransaction(transactionId: string): Promise<{ success: boolean }> {
    return httpClient.post<{ success: boolean }>(ENDPOINTS.void(transactionId));
  }

  /**
   * Open Paymob checkout in a new window or redirect
   */
  openCheckout(checkoutUrl: string, options?: { newWindow?: boolean }): void {
    if (options?.newWindow) {
      window.open(checkoutUrl, '_blank', 'width=600,height=700');
    } else {
      window.location.href = checkoutUrl;
    }
  }

  /**
   * Get payment method label
   */
  getPaymentMethodLabel(method: PaymentMethod, lang: 'en' | 'ar' = 'en'): string {
    const labels: Record<PaymentMethod, { en: string; ar: string }> = {
      card: { en: 'Credit/Debit Card', ar: 'بطاقة ائتمان/خصم' },
      wallet: { en: 'Mobile Wallet', ar: 'محفظة إلكترونية' },
      kiosk: { en: 'Aman/Masary Kiosk', ar: 'كشك أمان/مصاري' },
    };
    return labels[method]?.[lang] || method;
  }

  /**
   * Get available payment methods
   */
  getPaymentMethods(): { value: PaymentMethod; labelEn: string; labelAr: string; icon: string }[] {
    return [
      {
        value: 'card',
        labelEn: 'Credit/Debit Card',
        labelAr: 'بطاقة ائتمان/خصم',
        icon: '💳',
      },
      {
        value: 'wallet',
        labelEn: 'Mobile Wallet',
        labelAr: 'محفظة إلكترونية',
        icon: '📱',
      },
      {
        value: 'kiosk',
        labelEn: 'Aman/Masary Kiosk',
        labelAr: 'كشك أمان/مصاري',
        icon: '🏪',
      },
    ];
  }
}

export const paymobService = new PaymobService();
export default paymobService;
