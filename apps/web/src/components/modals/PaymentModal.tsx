import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { Modal, InputField, SelectField, TextareaField, Button } from '../ui';
import { PaymentMethod, PaymentMethodLabels, getLabel } from '../../types/enums';
import type { Payment, CreatePaymentRequest, UpdatePaymentRequest, Invoice } from '../../types/interfaces';
import { paymentsService } from '../../services/payments.service';
import { invoicesService } from '../../services/invoices.service';
import { toast } from 'sonner';
import { Save, X, CreditCard, Banknote, Smartphone, Building2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment?: Payment | null;
  onSuccess: () => void;
  invoiceId?: string; // Pre-selected invoice
}

interface FormData {
  invoiceId: string;
  amount: string;
  method: PaymentMethod;
  transactionId: string;
  referenceNumber: string;
  notes: string;
  notesAr: string;
}

interface FormErrors {
  invoiceId?: string;
  amount?: string;
  method?: string;
}

const paymentMethodIcons = {
  CASH: Banknote,
  BANK_TRANSFER: Building2,
  CREDIT_CARD: CreditCard,
  FAWRY: Smartphone,
  VODAFONE_CASH: Smartphone,
  OTHER: CreditCard,
};

export function PaymentModal({ isOpen, onClose, payment, onSuccess, invoiceId }: PaymentModalProps) {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';
  const isEditMode = !!payment;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    invoiceId: invoiceId || '',
    amount: '',
    method: PaymentMethod.BANK_TRANSFER,
    transactionId: '',
    referenceNumber: '',
    notes: '',
    notesAr: '',
  });

  // Fetch unpaid invoices
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const response = await invoicesService.getAll({ limit: 100 });
        // Filter to show only unpaid/partially paid invoices
        const eligibleInvoices = response.data.filter((inv) =>
          ['ISSUED', 'SENT', 'OVERDUE'].includes(inv.status)
        );
        setInvoices(eligibleInvoices);
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
        toast.error(t('common.error'));
      } finally {
        setLoadingData(false);
      }
    };

    if (isOpen && !isEditMode) {
      fetchData();
    } else {
      setLoadingData(false);
    }
  }, [isOpen, isEditMode, t]);

  useEffect(() => {
    if (isOpen) {
      if (payment) {
        setFormData({
          invoiceId: payment.invoiceId,
          amount: payment.amount.toString(),
          method: payment.method,
          transactionId: payment.transactionId || '',
          referenceNumber: payment.referenceNumber || '',
          notes: payment.notes || '',
          notesAr: payment.notesAr || '',
        });
      } else {
        setFormData({
          invoiceId: invoiceId || '',
          amount: '',
          method: PaymentMethod.BANK_TRANSFER,
          transactionId: '',
          referenceNumber: '',
          notes: '',
          notesAr: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, payment, invoiceId]);

  // Auto-fill amount from selected invoice
  useEffect(() => {
    if (formData.invoiceId && !isEditMode) {
      const selectedInvoice = invoices.find((inv) => inv.id === formData.invoiceId);
      if (selectedInvoice) {
        // Calculate remaining amount if there are existing payments
        const paidAmount = selectedInvoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const remainingAmount = selectedInvoice.total - paidAmount;
        setFormData((prev) => ({
          ...prev,
          amount: remainingAmount.toString(),
        }));
      }
    }
  }, [formData.invoiceId, invoices, isEditMode]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.invoiceId) {
      newErrors.invoiceId = t('validation.required');
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = t('validation.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      if (isEditMode && payment) {
        const updateData: UpdatePaymentRequest = {
          method: formData.method,
          transactionId: formData.transactionId || undefined,
          referenceNumber: formData.referenceNumber || undefined,
          notes: formData.notes || undefined,
          notesAr: formData.notesAr || undefined,
        };
        await paymentsService.update(payment.id, updateData);
        toast.success(t('payments.updateSuccess'));
      } else {
        const createData: CreatePaymentRequest = {
          invoiceId: formData.invoiceId,
          amount: parseFloat(formData.amount),
          method: formData.method,
          transactionId: formData.transactionId || undefined,
          referenceNumber: formData.referenceNumber || undefined,
          notes: formData.notes || undefined,
          notesAr: formData.notesAr || undefined,
        };
        await paymentsService.create(createData);
        toast.success(t('payments.createSuccess'));
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Failed to save payment:', error);
      const errorMessage = error instanceof Error ? error.message : t('common.error');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Get selected invoice for displaying info
  const selectedInvoice = invoices.find((inv) => inv.id === formData.invoiceId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t('payments.editPayment') : t('payments.addPayment')}
      size="lg"
    >
      {loadingData ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#f26522]" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Invoice Selection */}
          {!isEditMode && (
            <div className="space-y-2">
              <SelectField
                label={t('payments.invoice')}
                value={formData.invoiceId}
                onChange={(e) => handleChange('invoiceId', e.target.value)}
                error={errors.invoiceId}
                required
              >
                <option value="">{t('payments.selectInvoice')}</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} - {language === 'ar' ? invoice.titleAr : invoice.title} ({invoice.total.toLocaleString()} {invoice.currency})
                  </option>
                ))}
              </SelectField>

              {/* Invoice Info */}
              {selectedInvoice && (
                <div className="rounded-lg bg-white/5 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">{t('payments.invoiceTotal')}</span>
                    <span className="font-medium text-white">
                      {selectedInvoice.total.toLocaleString()} {selectedInvoice.currency}
                    </span>
                  </div>
                  {selectedInvoice.customer && (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-white/60">{t('payments.customer')}</span>
                      <span className="text-white">{selectedInvoice.customer.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-white/80">{t('payments.method')}</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Object.values(PaymentMethod).map((method) => {
                const Icon = paymentMethodIcons[method];
                const isSelected = formData.method === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => handleChange('method', method)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${
                      isSelected
                        ? 'border-[#f26522] bg-[#f26522]/10 text-[#f26522]'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">
                      {getLabel(PaymentMethodLabels, method, language === 'ar' ? 'ar' : 'en')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <InputField
            label={t('payments.amount')}
            type="number"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            error={errors.amount}
            required
            placeholder="0.00"
            dir="ltr"
            disabled={isEditMode}
          />

          {/* Transaction Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label={t('payments.transactionId')}
              type="text"
              value={formData.transactionId}
              onChange={(e) => handleChange('transactionId', e.target.value)}
              placeholder={t('payments.transactionIdPlaceholder')}
              dir="ltr"
            />

            <InputField
              label={t('payments.referenceNumber')}
              type="text"
              value={formData.referenceNumber}
              onChange={(e) => handleChange('referenceNumber', e.target.value)}
              placeholder={t('payments.referenceNumberPlaceholder')}
              dir="ltr"
            />
          </div>

          {/* Notes */}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextareaField
              label={t('payments.notesEn')}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Payment notes in English"
              dir="ltr"
            />

            <TextareaField
              label={t('payments.notesAr')}
              value={formData.notesAr}
              onChange={(e) => handleChange('notesAr', e.target.value)}
              placeholder="ملاحظات الدفع بالعربي"
              dir="rtl"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} icon={<X className="h-4 w-4" />}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={loading} icon={<Save className="h-4 w-4" />}>
              {isEditMode ? t('common.save') : t('payments.recordPayment')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
