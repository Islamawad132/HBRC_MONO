import { httpClient } from './httpclient';

export type WalletTransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'PURCHASE' | 'REFUND' | 'ADJUSTMENT';
export type WalletTransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type DepositPaymentMethod = 'card' | 'wallet' | 'kiosk';

export interface Wallet {
  id: string;
  customerId: string;
  balance: number;
  currency: string;
  isActive: boolean;
  isFrozen: boolean;
  frozenAt?: string;
  frozenReason?: string;
  totalDeposits: number;
  totalWithdrawals: number;
  totalPurchases: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  transactionNumber: string;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  description?: string;
  descriptionAr?: string;
  referenceType?: string;
  referenceId?: string;
  paymentMethod?: string;
  paymentGateway?: string;
  externalTransactionId?: string;
  processedAt?: string;
  failureReason?: string;
  createdAt: string;
}

export interface WalletWithCustomer extends Wallet {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export interface InitiateDepositRequest {
  amount: number;
  paymentMethod?: DepositPaymentMethod;
}

export interface DepositResponse {
  transactionNumber: string;
  amount: number;
  status: string;
  checkoutUrl?: string;
  message?: string;
}

export interface WalletPurchaseRequest {
  amount: number;
  referenceType: string;
  referenceId: string;
  description?: string;
  descriptionAr?: string;
}

export interface PurchaseResult {
  success: boolean;
  transactionNumber: string;
  amount: number;
  newBalance: number;
  errorMessage?: string;
}

export interface BalanceCheckResult {
  sufficient: boolean;
  currentBalance: number;
  requiredAmount: number;
  shortfall: number;
}

export interface TransactionQuery {
  page?: number;
  limit?: number;
  type?: WalletTransactionType;
  status?: WalletTransactionStatus;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const walletService = {
  // Customer endpoints
  async getMyWallet(): Promise<Wallet> {
    return httpClient.get<Wallet>('/wallet/my-wallet');
  },

  async getBalance(): Promise<{ balance: number; currency: string }> {
    return httpClient.get<{ balance: number; currency: string }>('/wallet/balance');
  },

  async initiateDeposit(data: InitiateDepositRequest): Promise<DepositResponse> {
    return httpClient.post<DepositResponse>('/wallet/deposit', data);
  },

  async processPurchase(data: WalletPurchaseRequest): Promise<PurchaseResult> {
    return httpClient.post<PurchaseResult>('/wallet/purchase', data);
  },

  async getTransactions(query: TransactionQuery = {}): Promise<PaginatedResponse<WalletTransaction>> {
    const params = new URLSearchParams();
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.type) params.append('type', query.type);
    if (query.status) params.append('status', query.status);
    
    return httpClient.get<PaginatedResponse<WalletTransaction>>(`/wallet/transactions?${params.toString()}`);
  },

  async checkBalance(amount: number): Promise<BalanceCheckResult> {
    return httpClient.get<BalanceCheckResult>(`/wallet/check-balance/${amount}`);
  },

  async syncTransaction(transactionId: string): Promise<{ message: string; status: string; newBalance?: number }> {
    return httpClient.post<{ message: string; status: string; newBalance?: number }>(`/wallet/transactions/${transactionId}/sync`);
  },

  // Admin endpoints
  async getAllWallets(page = 1, limit = 20): Promise<PaginatedResponse<WalletWithCustomer>> {
    return httpClient.get<PaginatedResponse<WalletWithCustomer>>(`/wallet/admin/all?page=${page}&limit=${limit}`);
  },

  async getCustomerWallet(customerId: string): Promise<Wallet> {
    return httpClient.get<Wallet>(`/wallet/admin/customer/${customerId}`);
  },

  async getCustomerTransactions(
    customerId: string,
    query: TransactionQuery = {}
  ): Promise<PaginatedResponse<WalletTransaction>> {
    const params = new URLSearchParams();
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.type) params.append('type', query.type);
    if (query.status) params.append('status', query.status);
    
    return httpClient.get<PaginatedResponse<WalletTransaction>>(`/wallet/admin/customer/${customerId}/transactions?${params.toString()}`);
  },

  async adjustBalance(
    customerId: string,
    amount: number,
    reason: string,
    reasonAr?: string
  ): Promise<{ transactionNumber: string; previousBalance: number; adjustment: number; newBalance: number }> {
    return httpClient.post<{ transactionNumber: string; previousBalance: number; adjustment: number; newBalance: number }>('/wallet/admin/adjust', {
      customerId,
      amount,
      reason,
      reasonAr,
    });
  },

  async freezeWallet(customerId: string, reason: string): Promise<void> {
    await httpClient.post(`/wallet/admin/freeze/${customerId}`, { reason });
  },

  async unfreezeWallet(customerId: string): Promise<void> {
    await httpClient.post(`/wallet/admin/unfreeze/${customerId}`);
  },

  // Helper functions
  getTransactionTypeLabel(type: WalletTransactionType, isRTL: boolean): string {
    const labels: Record<WalletTransactionType, { en: string; ar: string }> = {
      DEPOSIT: { en: 'Deposit', ar: 'إيداع' },
      WITHDRAWAL: { en: 'Withdrawal', ar: 'سحب' },
      PURCHASE: { en: 'Purchase', ar: 'شراء' },
      REFUND: { en: 'Refund', ar: 'استرداد' },
      ADJUSTMENT: { en: 'Adjustment', ar: 'تعديل' },
    };
    return isRTL ? labels[type].ar : labels[type].en;
  },

  getTransactionStatusLabel(status: WalletTransactionStatus, isRTL: boolean): string {
    const labels: Record<WalletTransactionStatus, { en: string; ar: string }> = {
      PENDING: { en: 'Pending', ar: 'قيد الانتظار' },
      COMPLETED: { en: 'Completed', ar: 'مكتملة' },
      FAILED: { en: 'Failed', ar: 'فشلت' },
      CANCELLED: { en: 'Cancelled', ar: 'ملغاة' },
    };
    return isRTL ? labels[status].ar : labels[status].en;
  },

  getPaymentMethodLabel(method: DepositPaymentMethod, isRTL: boolean): string {
    const labels: Record<DepositPaymentMethod, { en: string; ar: string }> = {
      card: { en: 'Credit/Debit Card', ar: 'بطاقة ائتمان/خصم' },
      wallet: { en: 'Mobile Wallet', ar: 'محفظة إلكترونية' },
      kiosk: { en: 'Kiosk (Aman/Masary)', ar: 'كشك (أمان/مصاري)' },
    };
    return isRTL ? labels[method].ar : labels[method].en;
  },

  getPaymentMethods(): { value: DepositPaymentMethod; labelEn: string; labelAr: string; icon: string }[] {
    return [
      { value: 'card', labelEn: 'Credit/Debit Card', labelAr: 'بطاقة ائتمان/خصم', icon: '💳' },
      { value: 'wallet', labelEn: 'Mobile Wallet', labelAr: 'محفظة إلكترونية (فودافون كاش)', icon: '📱' },
      { value: 'kiosk', labelEn: 'Kiosk (Aman/Masary)', labelAr: 'كشك (أمان/مصاري)', icon: '🏪' },
    ];
  },

  formatCurrency(amount: number, currency = 'EGP', locale?: string): string {
    return new Intl.NumberFormat(locale || 'en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  },
};

export default walletService;
