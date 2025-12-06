import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { invoicesService } from '../../services/invoices.service';
import { paymentsService } from '../../services/payments.service';
import type { Invoice, CreatePaymentRequest } from '../../types/interfaces';
import { PaymentMethod, getLabel, PaymentMethodLabels, InvoiceStatusLabels } from '../../types/enums';
import { toast } from 'sonner';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CreditCard,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Building2,
  DollarSign,
  Calendar,
  Shield,
  Lock,
  Loader2,
  Receipt,
  Smartphone,
  Landmark,
  Banknote,
  Copy,
  Check,
  Info,
} from 'lucide-react';

// Payment method icons
const paymentMethodIcons: Record<string, React.ReactNode> = {
  CASH: <Banknote className="h-6 w-6" />,
  BANK_TRANSFER: <Landmark className="h-6 w-6" />,
  CREDIT_CARD: <CreditCard className="h-6 w-6" />,
  FAWRY: <Smartphone className="h-6 w-6" />,
  VODAFONE_CASH: <Smartphone className="h-6 w-6" />,
  OTHER: <DollarSign className="h-6 w-6" />,
};

// Payment method colors
const paymentMethodColors: Record<string, string> = {
  CASH: 'from-green-500 to-emerald-500',
  BANK_TRANSFER: 'from-blue-500 to-cyan-500',
  CREDIT_CARD: 'from-purple-500 to-pink-500',
  FAWRY: 'from-orange-500 to-amber-500',
  VODAFONE_CASH: 'from-red-500 to-rose-500',
  OTHER: 'from-gray-500 to-slate-500',
};

export function PaymentPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const isRTL = language === 'ar';

  // State
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | ''>('');
  const [step, setStep] = useState<'select' | 'details' | 'confirm' | 'success'>('select');
  const [copied, setCopied] = useState(false);

  // Payment details form
  const [paymentDetails, setPaymentDetails] = useState({
    transactionId: '',
    referenceNumber: '',
    notesEn: '',
    notesAr: '',
    // Credit card fields (for UI only - actual processing would be handled by payment gateway)
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: '',
  });

  // Fetch invoice
  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) return;

    try {
      setLoading(true);
      const data = await invoicesService.getById(invoiceId);
      setInvoice(data);

      // Check if already paid
      if (data.status === 'PAID') {
        toast.info(isRTL ? 'هذه الفاتورة مدفوعة بالفعل' : 'This invoice is already paid');
        navigate('/my-invoices');
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      toast.error(t('common.error'));
      navigate('/my-invoices');
    } finally {
      setLoading(false);
    }
  }, [invoiceId, isRTL, t, navigate]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: invoice?.currency || 'EGP',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle payment method selection
  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setStep('details');
  };

  // Handle payment submission
  const handleSubmitPayment = async () => {
    if (!invoice || !selectedMethod) return;

    try {
      setProcessing(true);

      // Create payment request
      const paymentData: CreatePaymentRequest = {
        invoiceId: invoice.id,
        amount: invoice.total,
        method: selectedMethod as PaymentMethod,
        transactionId: paymentDetails.transactionId || undefined,
        referenceNumber: paymentDetails.referenceNumber || undefined,
        notes: paymentDetails.notesEn || undefined,
        notesAr: paymentDetails.notesAr || undefined,
      };

      await paymentsService.create(paymentData);
      setStep('success');
    } catch (error) {
      console.error('Failed to process payment:', error);
      toast.error(isRTL ? 'فشل في معالجة الدفع' : 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const BackArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#f26522]" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
        <Receipt className="mb-4 h-16 w-16 text-white/20" />
        <h3 className="text-lg font-medium text-white">
          {isRTL ? 'الفاتورة غير موجودة' : 'Invoice Not Found'}
        </h3>
        <Link to="/my-invoices" className="mt-4 text-[#f26522] hover:underline">
          {isRTL ? 'العودة إلى فواتيري' : 'Back to My Invoices'}
        </Link>
      </div>
    );
  }

  // Available payment methods
  const availableMethods: PaymentMethod[] = [
    'CREDIT_CARD',
    'BANK_TRANSFER',
    'FAWRY',
    'VODAFONE_CASH',
    'CASH',
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#a0592b] to-[#f26522]">
            <CreditCard className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isRTL ? 'الدفع الإلكتروني' : 'Payment'}
            </h1>
            <p className="text-sm text-white/60">
              {isRTL
                ? `فاتورة رقم #${invoice.invoiceNumber}`
                : `Invoice #${invoice.invoiceNumber}`}
            </p>
          </div>
        </div>
      </div>

      {/* Success Step */}
      {step === 'success' && (
        <div className="glass-card p-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">
            {isRTL ? 'تم الدفع بنجاح!' : 'Payment Successful!'}
          </h2>
          <p className="mb-6 text-white/60">
            {isRTL
              ? 'شكرًا لك. سيتم تحديث حالة الفاتورة قريبًا.'
              : 'Thank you. Your invoice status will be updated shortly.'}
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/my-invoices"
              className="glass-button px-6 py-3 text-white/70 hover:text-white"
            >
              {isRTL ? 'عرض الفواتير' : 'View Invoices'}
            </Link>
            <Link
              to="/customer-dashboard"
              className="rounded-xl bg-gradient-to-r from-[#a0592b] to-[#f26522] px-6 py-3 font-semibold text-white"
            >
              {isRTL ? 'الرئيسية' : 'Dashboard'}
            </Link>
          </div>
        </div>
      )}

      {step !== 'success' && (
        <>
          {/* Invoice Summary */}
          <div className="glass-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              {isRTL ? 'ملخص الفاتورة' : 'Invoice Summary'}
            </h2>
            <div className="space-y-3 rounded-lg bg-white/5 p-4">
              <div className="flex justify-between">
                <span className="text-white/60">{isRTL ? 'رقم الفاتورة' : 'Invoice #'}</span>
                <span className="font-mono text-white">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
                <span className="text-white">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/60">
                    {isRTL ? 'الضريبة' : 'Tax'} ({invoice.taxRate}%)
                  </span>
                  <span className="text-white">{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/60">{isRTL ? 'الخصم' : 'Discount'}</span>
                  <span className="text-emerald-400">-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/10 pt-3">
                <span className="font-semibold text-white">{isRTL ? 'الإجمالي' : 'Total'}</span>
                <span className="text-2xl font-bold text-[#f26522]">
                  {formatCurrency(invoice.total)}
                </span>
              </div>
              {invoice.dueDate && (
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {isRTL ? 'تاريخ الاستحقاق:' : 'Due:'} {formatDate(invoice.dueDate)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Step 1: Select Payment Method */}
          {step === 'select' && (
            <div className="glass-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">
                {isRTL ? 'اختر طريقة الدفع' : 'Select Payment Method'}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {availableMethods.map((method) => (
                  <button
                    key={method}
                    onClick={() => handleMethodSelect(method)}
                    className={`group flex items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                      selectedMethod === method
                        ? 'border-[#f26522] bg-[#f26522]/10'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${paymentMethodColors[method]}`}
                    >
                      {paymentMethodIcons[method]}
                    </div>
                    <div className="text-start">
                      <p className="font-medium text-white">
                        {getLabel(PaymentMethodLabels, method, language)}
                      </p>
                      <p className="text-xs text-white/60">
                        {method === 'CREDIT_CARD' && (isRTL ? 'فيزا، ماستركارد' : 'Visa, Mastercard')}
                        {method === 'BANK_TRANSFER' && (isRTL ? 'تحويل بنكي' : 'Direct bank transfer')}
                        {method === 'FAWRY' && (isRTL ? 'ادفع في أي فرع فوري' : 'Pay at any Fawry outlet')}
                        {method === 'VODAFONE_CASH' && (isRTL ? 'محفظة فودافون كاش' : 'Vodafone Cash wallet')}
                        {method === 'CASH' && (isRTL ? 'الدفع نقدًا في المركز' : 'Pay cash at the center')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Payment Details */}
          {step === 'details' && (
            <div className="glass-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {isRTL ? 'تفاصيل الدفع' : 'Payment Details'}
                </h2>
                <button
                  onClick={() => setStep('select')}
                  className="text-sm text-white/60 hover:text-white"
                >
                  {isRTL ? 'تغيير الطريقة' : 'Change method'}
                </button>
              </div>

              {/* Selected Method */}
              <div className="mb-6 flex items-center gap-4 rounded-lg bg-white/5 p-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${paymentMethodColors[selectedMethod]}`}
                >
                  {paymentMethodIcons[selectedMethod]}
                </div>
                <div>
                  <p className="font-medium text-white">
                    {selectedMethod && getLabel(PaymentMethodLabels, selectedMethod, language)}
                  </p>
                </div>
              </div>

              {/* Credit Card Form */}
              {selectedMethod === 'CREDIT_CARD' && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      {isRTL ? 'رقم البطاقة' : 'Card Number'}
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.cardNumber}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16),
                        })
                      }
                      placeholder="0000 0000 0000 0000"
                      className="glass-input w-full font-mono"
                      dir="ltr"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">
                        {isRTL ? 'تاريخ الانتهاء' : 'Expiry Date'}
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.cardExpiry}
                        onChange={(e) =>
                          setPaymentDetails({ ...paymentDetails, cardExpiry: e.target.value })
                        }
                        placeholder="MM/YY"
                        className="glass-input w-full font-mono"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">CVV</label>
                      <input
                        type="text"
                        value={paymentDetails.cardCvv}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            cardCvv: e.target.value.replace(/\D/g, '').slice(0, 4),
                          })
                        }
                        placeholder="***"
                        className="glass-input w-full font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      {isRTL ? 'الاسم على البطاقة' : 'Name on Card'}
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.cardName}
                      onChange={(e) =>
                        setPaymentDetails({ ...paymentDetails, cardName: e.target.value })
                      }
                      placeholder={isRTL ? 'الاسم كما يظهر على البطاقة' : 'Name as shown on card'}
                      className="glass-input w-full"
                    />
                  </div>
                </div>
              )}

              {/* Bank Transfer Details */}
              {selectedMethod === 'BANK_TRANSFER' && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-blue-500/10 p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-400">
                      <Info className="h-4 w-4" />
                      {isRTL ? 'تفاصيل الحساب البنكي' : 'Bank Account Details'}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">{isRTL ? 'البنك' : 'Bank'}</span>
                        <span className="text-white">
                          {isRTL ? 'البنك الأهلي المصري' : 'National Bank of Egypt'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">
                          {isRTL ? 'رقم الحساب' : 'Account Number'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white">1234567890123456</span>
                          <button
                            onClick={() => copyToClipboard('1234567890123456')}
                            className="text-white/60 hover:text-white"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">
                          {isRTL ? 'اسم الحساب' : 'Account Name'}
                        </span>
                        <span className="text-white">HBRC</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      {isRTL ? 'رقم التحويل' : 'Transfer Reference'}
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.transactionId}
                      onChange={(e) =>
                        setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })
                      }
                      placeholder={isRTL ? 'أدخل رقم التحويل' : 'Enter transfer reference'}
                      className="glass-input w-full"
                    />
                  </div>
                </div>
              )}

              {/* Fawry Details */}
              {selectedMethod === 'FAWRY' && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-orange-500/10 p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-orange-400">
                      <Info className="h-4 w-4" />
                      {isRTL ? 'كود الدفع' : 'Payment Code'}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xl text-white">
                        {Math.random().toString().slice(2, 16)}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(Math.random().toString().slice(2, 16))
                        }
                        className="glass-button p-2"
                      >
                        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-white/60">
                      {isRTL
                        ? 'استخدم هذا الكود للدفع في أي منفذ فوري'
                        : 'Use this code to pay at any Fawry outlet'}
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      {isRTL ? 'رقم إيصال فوري' : 'Fawry Receipt Number'}
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.referenceNumber}
                      onChange={(e) =>
                        setPaymentDetails({ ...paymentDetails, referenceNumber: e.target.value })
                      }
                      placeholder={isRTL ? 'أدخل رقم الإيصال بعد الدفع' : 'Enter receipt number after payment'}
                      className="glass-input w-full"
                    />
                  </div>
                </div>
              )}

              {/* Vodafone Cash Details */}
              {selectedMethod === 'VODAFONE_CASH' && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-red-500/10 p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-red-400">
                      <Info className="h-4 w-4" />
                      {isRTL ? 'رقم المحفظة' : 'Wallet Number'}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xl text-white">010 1234 5678</span>
                      <button
                        onClick={() => copyToClipboard('01012345678')}
                        className="glass-button p-2"
                      >
                        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-white/60">
                      {isRTL
                        ? 'حول المبلغ إلى هذا الرقم من محفظة فودافون كاش'
                        : 'Transfer the amount to this number from Vodafone Cash'}
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      {isRTL ? 'رقم التحويل' : 'Transfer Number'}
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.transactionId}
                      onChange={(e) =>
                        setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })
                      }
                      placeholder={isRTL ? 'أدخل رقم التحويل' : 'Enter transfer number'}
                      className="glass-input w-full"
                    />
                  </div>
                </div>
              )}

              {/* Cash Payment */}
              {selectedMethod === 'CASH' && (
                <div className="rounded-lg bg-green-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
                    <div>
                      <p className="text-white">
                        {isRTL
                          ? 'يمكنك الدفع نقدًا في مقر المركز القومي لبحوث الإسكان والبناء'
                          : 'You can pay cash at HBRC headquarters'}
                      </p>
                      <p className="mt-2 text-sm text-white/60">
                        {isRTL ? 'العنوان: ' : 'Address: '}
                        {isRTL
                          ? '1 شارع طارق بن زياد، الدقي، الجيزة'
                          : '1 Tarek Ibn Ziad St., Dokki, Giza'}
                      </p>
                      <p className="text-sm text-white/60">
                        {isRTL ? 'ساعات العمل: ' : 'Working hours: '}
                        {isRTL ? '9 ص - 3 م (الأحد - الخميس)' : '9 AM - 3 PM (Sun - Thu)'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-white/80">
                  {isRTL ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
                </label>
                <textarea
                  value={language === 'ar' ? paymentDetails.notesAr : paymentDetails.notesEn}
                  onChange={(e) =>
                    setPaymentDetails({
                      ...paymentDetails,
                      [language === 'ar' ? 'notesAr' : 'notesEn']: e.target.value,
                    })
                  }
                  placeholder={isRTL ? 'أي ملاحظات إضافية' : 'Any additional notes'}
                  className="glass-input min-h-[80px] w-full"
                />
              </div>

              {/* Security Note */}
              <div className="mt-4 flex items-center gap-2 text-sm text-white/60">
                <Lock className="h-4 w-4" />
                <span>
                  {isRTL
                    ? 'معاملتك محمية بتشفير SSL'
                    : 'Your transaction is protected with SSL encryption'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => setStep('select')}
                  className="glass-button flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white"
                >
                  <BackArrowIcon className="h-4 w-4" />
                  <span>{t('common.back')}</span>
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a0592b] to-[#f26522] px-6 py-3 font-semibold text-white transition-all hover:scale-105"
                >
                  <span>{isRTL ? 'متابعة' : 'Continue'}</span>
                  <ArrowIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <div className="glass-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">
                {isRTL ? 'تأكيد الدفع' : 'Confirm Payment'}
              </h2>

              {/* Summary */}
              <div className="mb-6 space-y-4 rounded-lg bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">{isRTL ? 'طريقة الدفع' : 'Payment Method'}</span>
                  <span className="text-white">
                    {selectedMethod && getLabel(PaymentMethodLabels, selectedMethod, language)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">{isRTL ? 'رقم الفاتورة' : 'Invoice #'}</span>
                  <span className="font-mono text-white">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="font-semibold text-white">{isRTL ? 'المبلغ' : 'Amount'}</span>
                  <span className="text-2xl font-bold text-[#f26522]">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
              </div>

              {/* Warning */}
              <div className="mb-6 flex items-start gap-3 rounded-lg bg-amber-500/10 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
                <p className="text-sm text-white">
                  {isRTL
                    ? 'بالضغط على تأكيد، فإنك توافق على المتابعة بهذا الدفع.'
                    : 'By clicking confirm, you agree to proceed with this payment.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep('details')}
                  className="glass-button flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white"
                >
                  <BackArrowIcon className="h-4 w-4" />
                  <span>{t('common.back')}</span>
                </button>
                <button
                  onClick={handleSubmitPayment}
                  disabled={processing}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a0592b] to-[#f26522] px-6 py-3 font-semibold text-white transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{isRTL ? 'جاري المعالجة...' : 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5" />
                      <span>{isRTL ? 'تأكيد الدفع' : 'Confirm Payment'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
