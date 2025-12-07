import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { walletService } from '../../services/wallet.service';
import { paymobService } from '../../services/paymob.service';
import type {
  Wallet,
  WalletTransaction,
  WalletTransactionType,
  WalletTransactionStatus,
  DepositPaymentMethod,
} from '../../services/wallet.service';
import { toast } from 'react-hot-toast';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Loader2,
  CreditCard,
  Smartphone,
  Store,
  ChevronLeft,
  ChevronRight,
  History,
} from 'lucide-react';
import { ComingSoon } from '../../components/ui';

export function WalletPage() {
  const [isPublished] = useState(false); // Set to true when ready to publish
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';

  if (!isPublished) {
    return <ComingSoon developPercentage="60%" />;
  }

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState<WalletTransactionType | ''>('');
  const [syncingTransactionId, setSyncingTransactionId] = useState<string | null>(null);

  useEffect(() => {
    loadWallet();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [page, typeFilter]);

  const loadWallet = async () => {
    try {
      const data = await walletService.getMyWallet();
      setWallet(data);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await walletService.getTransactions({
        page,
        limit: 10,
        type: typeFilter || undefined,
      });
      setTransactions(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleSyncTransaction = async (transactionId: string) => {
    setSyncingTransactionId(transactionId);
    try {
      const result = await walletService.syncTransaction(transactionId);
      if (result.status === 'COMPLETED') {
        toast.success(isRTL ? 'تم تأكيد الدفع وتحديث الرصيد!' : 'Payment confirmed and balance updated!');
        loadWallet();
        loadTransactions();
      } else if (result.status === 'FAILED') {
        toast.error(isRTL ? 'فشل الدفع' : 'Payment failed');
        loadTransactions();
      } else {
        toast.info(isRTL ? 'الدفع لا يزال قيد الانتظار' : 'Payment still pending');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || (isRTL ? 'فشل في التحقق من حالة الدفع' : 'Failed to verify payment status'));
    } finally {
      setSyncingTransactionId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: wallet?.currency || 'EGP',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: WalletTransactionType) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownCircle className="h-5 w-5 text-green-400" />;
      case 'PURCHASE':
        return <ArrowUpCircle className="h-5 w-5 text-red-400" />;
      case 'WITHDRAWAL':
        return <ArrowUpCircle className="h-5 w-5 text-orange-400" />;
      case 'REFUND':
        return <ArrowDownCircle className="h-5 w-5 text-blue-400" />;
      case 'ADJUSTMENT':
        return <RefreshCw className="h-5 w-5 text-purple-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: WalletTransactionStatus) => {
    const statusConfig = {
      COMPLETED: {
        icon: <CheckCircle className="h-3.5 w-3.5" />,
        text: isRTL ? 'مكتمل' : 'Completed',
        classes: 'bg-green-500/20 text-green-400 border-green-500/30',
      },
      PENDING: {
        icon: <Clock className="h-3.5 w-3.5" />,
        text: isRTL ? 'قيد الانتظار' : 'Pending',
        classes: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      },
      FAILED: {
        icon: <XCircle className="h-3.5 w-3.5" />,
        text: isRTL ? 'فشل' : 'Failed',
        classes: 'bg-red-500/20 text-red-400 border-red-500/30',
      },
      CANCELLED: {
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        text: isRTL ? 'ملغي' : 'Cancelled',
        classes: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const getAmountColor = (type: WalletTransactionType) => {
    if (type === 'DEPOSIT' || type === 'REFUND') return 'text-green-400';
    return 'text-red-400';
  };

  const getAmountPrefix = (type: WalletTransactionType) => {
    if (type === 'DEPOSIT' || type === 'REFUND') return '+';
    return '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4a84b]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-2">
            <WalletIcon className="h-7 w-7 text-[#d4a84b]" />
            {isRTL ? 'محفظتي' : 'My Wallet'}
          </h1>
          <p className="text-theme-muted mt-1">
            {isRTL ? 'إدارة رصيدك ومعاملاتك' : 'Manage your balance and transactions'}
          </p>
        </div>
        <button
          onClick={() => setShowDepositModal(true)}
          className="btn-premium px-4 py-2 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          {isRTL ? 'شحن الرصيد' : 'Top Up'}
        </button>
      </div>

      {/* Wallet Card */}
      <div className="glass-card overflow-hidden">
        <div className="bg-gradient-to-br from-[#d4a84b] via-[#f26522] to-[#1a5a4c] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">{isRTL ? 'الرصيد الحالي' : 'Current Balance'}</p>
              <p className="text-4xl font-bold text-white mt-1">
                {formatCurrency(wallet?.balance || 0)}
              </p>
            </div>
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
              <WalletIcon className="h-8 w-8 text-white" />
            </div>
          </div>

          {wallet?.isFrozen && (
            <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-white text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {isRTL ? 'المحفظة مجمدة' : 'Wallet is frozen'}
                {wallet.frozenReason && `: ${wallet.frozenReason}`}
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-theme-border">
          <div className="p-4 text-center">
            <p className="text-xs text-theme-muted">{isRTL ? 'إجمالي الإيداعات' : 'Total Deposits'}</p>
            <p className="text-lg font-bold text-green-400 mt-1">
              {formatCurrency(wallet?.totalDeposits || 0)}
            </p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-theme-muted">{isRTL ? 'إجمالي المشتريات' : 'Total Purchases'}</p>
            <p className="text-lg font-bold text-red-400 mt-1">
              {formatCurrency(wallet?.totalPurchases || 0)}
            </p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-theme-muted">{isRTL ? 'إجمالي السحوبات' : 'Total Withdrawals'}</p>
            <p className="text-lg font-bold text-orange-400 mt-1">
              {formatCurrency(wallet?.totalWithdrawals || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-theme-primary flex items-center gap-2">
            <History className="h-5 w-5 text-[#d4a84b]" />
            {isRTL ? 'سجل المعاملات' : 'Transaction History'}
          </h2>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as WalletTransactionType | '');
              setPage(1);
            }}
            className="glass-input px-3 py-1.5 text-sm"
          >
            <option value="">{isRTL ? 'جميع المعاملات' : 'All Transactions'}</option>
            <option value="DEPOSIT">{isRTL ? 'إيداعات' : 'Deposits'}</option>
            <option value="PURCHASE">{isRTL ? 'مشتريات' : 'Purchases'}</option>
            <option value="REFUND">{isRTL ? 'استرداد' : 'Refunds'}</option>
            <option value="ADJUSTMENT">{isRTL ? 'تعديلات' : 'Adjustments'}</option>
          </select>
        </div>

        {loadingTransactions ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#d4a84b]" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-theme-muted">
            {isRTL ? 'لا توجد معاملات' : 'No transactions yet'}
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="glass-card-dark p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {getTransactionIcon(tx.type)}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-theme-primary">
                        {walletService.getTransactionTypeLabel(tx.type, isRTL)}
                      </span>
                      {getStatusBadge(tx.status)}
                    </div>
                    <p className="text-xs text-theme-muted mt-1">
                      {isRTL ? tx.descriptionAr || tx.description : tx.description || tx.descriptionAr}
                    </p>
                    <p className="text-xs text-theme-muted">{formatDate(tx.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Sync button for pending transactions with external ID */}
                  {tx.status === 'PENDING' && tx.externalTransactionId && (
                    <button
                      onClick={() => handleSyncTransaction(tx.id)}
                      disabled={syncingTransactionId === tx.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-[#d4a84b]/20 text-[#d4a84b] hover:bg-[#d4a84b]/30 transition-colors disabled:opacity-50"
                      title={isRTL ? 'التحقق من حالة الدفع' : 'Verify payment status'}
                    >
                      {syncingTransactionId === tx.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      {isRTL ? 'تحقق' : 'Verify'}
                    </button>
                  )}
                  <div className="text-right">
                    <p className={`font-bold text-lg ${getAmountColor(tx.type)}`}>
                      {getAmountPrefix(tx.type)}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-theme-muted">
                      {isRTL ? 'الرصيد:' : 'Balance:'} {formatCurrency(tx.balanceAfter)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="glass-button p-2 disabled:opacity-50"
            >
              {isRTL ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <span className="text-theme-muted">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="glass-button p-2 disabled:opacity-50"
            >
              {isRTL ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <DepositModal
          isRTL={isRTL}
          onClose={() => setShowDepositModal(false)}
          onSuccess={() => {
            setShowDepositModal(false);
            loadWallet();
            loadTransactions();
          }}
        />
      )}
    </div>
  );
}

// Deposit Modal Component
function DepositModal({
  isRTL,
  onClose,
  onSuccess,
}: {
  isRTL: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<DepositPaymentMethod>('card');
  const [loading, setLoading] = useState(false);

  const quickAmounts = [50, 100, 200, 500, 1000];
  const paymentMethods = walletService.getPaymentMethods();

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 10) {
      toast.error(isRTL ? 'الحد الأدنى للشحن 10 جنيه' : 'Minimum deposit is 10 EGP');
      return;
    }

    if (numAmount > 50000) {
      toast.error(isRTL ? 'الحد الأقصى للشحن 50,000 جنيه' : 'Maximum deposit is 50,000 EGP');
      return;
    }

    setLoading(true);
    try {
      const response = await walletService.initiateDeposit({
        amount: numAmount,
        paymentMethod,
      });

      toast.success(isRTL ? 'جاري التحويل للدفع...' : 'Redirecting to payment...');
      
      if (response.checkoutUrl) {
        paymobService.openCheckout(response.checkoutUrl);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || (isRTL ? 'فشل في بدء عملية الشحن' : 'Failed to initiate deposit'));
      setLoading(false);
    }
  };

  const getMethodIcon = (method: DepositPaymentMethod) => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'wallet':
        return <Smartphone className="h-5 w-5" />;
      case 'kiosk':
        return <Store className="h-5 w-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-md">
        <div className="flex items-center justify-between border-b border-theme-border p-4">
          <h2 className="text-xl font-bold text-theme-primary flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#d4a84b]" />
            {isRTL ? 'شحن الرصيد' : 'Top Up Wallet'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-theme-primary">
              {isRTL ? 'المبلغ (ج.م)' : 'Amount (EGP)'}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={isRTL ? 'أدخل المبلغ' : 'Enter amount'}
              className="glass-input w-full text-2xl font-bold text-center"
              min="10"
              max="50000"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    amount === amt.toString()
                      ? 'bg-[#d4a84b] text-white'
                      : 'glass-button'
                  }`}
                >
                  {amt} {isRTL ? 'ج.م' : 'EGP'}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-theme-primary">
              {isRTL ? 'طريقة الدفع' : 'Payment Method'}
            </label>
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <label
                  key={method.value}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === method.value
                      ? 'bg-[#d4a84b]/20 border-2 border-[#d4a84b]'
                      : 'glass-card-dark hover:ring-2 hover:ring-[#d4a84b]/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={(e) => setPaymentMethod(e.target.value as DepositPaymentMethod)}
                    className="hidden"
                  />
                  <div className="text-[#d4a84b]">{getMethodIcon(method.value)}</div>
                  <span className="text-theme-primary">
                    {isRTL ? method.labelAr : method.labelEn}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <p className="text-xs text-theme-muted text-center">
            {isRTL
              ? 'سيتم تحويلك لصفحة الدفع الآمنة'
              : 'You will be redirected to secure payment page'}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-theme-border p-4">
          <button onClick={onClose} className="glass-button px-4 py-2" disabled={loading}>
            {isRTL ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !amount}
            className="btn-premium px-6 py-2 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isRTL ? 'شحن الآن' : 'Top Up Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
