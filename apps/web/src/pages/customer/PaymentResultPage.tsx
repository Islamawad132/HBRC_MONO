import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { paymobService } from '../../services/paymob.service';
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Receipt,
  Home,
  RefreshCw,
} from 'lucide-react';

type PaymentStatus = 'loading' | 'success' | 'failed' | 'pending';

export function PaymentResultPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const txId = searchParams.get('transactionId');
    const order = searchParams.get('orderId');
    const success = searchParams.get('success');
    const pending = searchParams.get('pending');
    const amountCents = searchParams.get('amount_cents');

    setTransactionId(txId);
    setOrderId(order);
    if (amountCents) {
      setAmount(parseInt(amountCents, 10) / 100);
    }

    // Determine status from URL or fetch from API
    if (success === 'true') {
      setStatus('success');
    } else if (pending === 'true') {
      setStatus('pending');
    } else if (success === 'false') {
      setStatus('failed');
    } else if (txId) {
      // Fetch status from API
      fetchTransactionStatus(txId);
    } else {
      // Check path for status
      if (window.location.pathname.includes('success')) {
        setStatus('success');
      } else if (window.location.pathname.includes('pending')) {
        setStatus('pending');
      } else if (window.location.pathname.includes('failed')) {
        setStatus('failed');
      } else {
        setStatus('failed');
      }
    }
  }, [searchParams]);

  const fetchTransactionStatus = async (txId: string) => {
    try {
      const result = await paymobService.getTransactionStatus(txId);
      if (result.success) {
        setStatus('success');
      } else if (result.pending) {
        setStatus('pending');
      } else {
        setStatus('failed');
        setErrorMessage(result.errorMessage || null);
      }
      if (result.amountCents) {
        setAmount(result.amountCents / 100);
      }
    } catch (error) {
      console.error('Failed to fetch transaction status:', error);
      setStatus('failed');
    }
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const statusConfig = {
    loading: {
      icon: <Loader2 className="h-20 w-20 text-[#d4a84b] animate-spin" />,
      title: isRTL ? 'جاري التحقق...' : 'Verifying Payment...',
      subtitle: isRTL ? 'يرجى الانتظار' : 'Please wait',
      color: 'from-[#d4a84b] to-[#f26522]',
    },
    success: {
      icon: <CheckCircle className="h-20 w-20 text-green-400" />,
      title: isRTL ? 'تم الدفع بنجاح!' : 'Payment Successful!',
      subtitle: isRTL ? 'شكراً لك، تم استلام الدفعة' : 'Thank you, your payment has been received',
      color: 'from-green-500 to-emerald-500',
    },
    pending: {
      icon: <Clock className="h-20 w-20 text-yellow-400" />,
      title: isRTL ? 'الدفع قيد الانتظار' : 'Payment Pending',
      subtitle: isRTL ? 'سيتم تأكيد الدفعة قريباً' : 'Your payment will be confirmed shortly',
      color: 'from-yellow-500 to-orange-500',
    },
    failed: {
      icon: <XCircle className="h-20 w-20 text-red-400" />,
      title: isRTL ? 'فشل الدفع' : 'Payment Failed',
      subtitle: errorMessage || (isRTL ? 'حدث خطأ أثناء معالجة الدفع' : 'An error occurred while processing payment'),
      color: 'from-red-500 to-rose-500',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="glass-card w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${config.color} p-8 text-center`}>
          <div className="flex justify-center mb-4">
            {config.icon}
          </div>
          <h1 className="text-2xl font-bold text-white">{config.title}</h1>
          <p className="text-white/80 mt-2">{config.subtitle}</p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {transactionId && (
            <div className="flex justify-between items-center py-3 border-b border-theme-border">
              <span className="text-theme-muted">{isRTL ? 'رقم العملية' : 'Transaction ID'}</span>
              <span className="font-mono text-theme-primary">{transactionId}</span>
            </div>
          )}

          {orderId && (
            <div className="flex justify-between items-center py-3 border-b border-theme-border">
              <span className="text-theme-muted">{isRTL ? 'رقم الطلب' : 'Order ID'}</span>
              <span className="font-mono text-theme-primary">{orderId}</span>
            </div>
          )}

          {amount && (
            <div className="flex justify-between items-center py-3 border-b border-theme-border">
              <span className="text-theme-muted">{isRTL ? 'المبلغ' : 'Amount'}</span>
              <span className="text-xl font-bold text-[#d4a84b]">
                {new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', {
                  style: 'currency',
                  currency: 'EGP',
                }).format(amount)}
              </span>
            </div>
          )}

          {status === 'pending' && (
            <div className="glass-card-dark p-4 rounded-lg">
              <p className="text-sm text-theme-muted text-center">
                {isRTL
                  ? 'إذا اخترت الدفع عبر كشك، يرجى التوجه لأقرب كشك أمان أو مصاري وإدخال رقم المرجع لإتمام الدفع.'
                  : 'If you chose kiosk payment, please visit the nearest Aman or Masary kiosk and enter the reference number to complete payment.'}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 space-y-3">
          {status === 'success' && (
            <>
              <button
                onClick={() => navigate('/my-publications')}
                className="w-full btn-premium py-3 flex items-center justify-center gap-2"
              >
                <Receipt className="h-5 w-5" />
                {isRTL ? 'عرض مشترياتي' : 'View My Purchases'}
              </button>
              <button
                onClick={() => navigate('/publications-catalog')}
                className="w-full glass-button py-3 flex items-center justify-center gap-2"
              >
                {isRTL ? 'تصفح المزيد' : 'Browse More'}
                <ArrowIcon className="h-5 w-5" />
              </button>
            </>
          )}

          {status === 'pending' && (
            <>
              <button
                onClick={() => transactionId && fetchTransactionStatus(transactionId)}
                className="w-full btn-premium py-3 flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                {isRTL ? 'تحديث الحالة' : 'Refresh Status'}
              </button>
              <button
                onClick={() => navigate('/customer-dashboard')}
                className="w-full glass-button py-3 flex items-center justify-center gap-2"
              >
                <Home className="h-5 w-5" />
                {isRTL ? 'العودة للرئيسية' : 'Back to Dashboard'}
              </button>
            </>
          )}

          {status === 'failed' && (
            <>
              <button
                onClick={() => navigate(-1)}
                className="w-full btn-premium py-3 flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                {isRTL ? 'إعادة المحاولة' : 'Try Again'}
              </button>
              <button
                onClick={() => navigate('/customer-dashboard')}
                className="w-full glass-button py-3 flex items-center justify-center gap-2"
              >
                <Home className="h-5 w-5" />
                {isRTL ? 'العودة للرئيسية' : 'Back to Dashboard'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
