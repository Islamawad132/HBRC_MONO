import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { Modal, InputField, SelectField, TextareaField, Button } from '../ui';
import type { Invoice, CreateInvoiceRequest, UpdateInvoiceRequest, ServiceRequest } from '../../types/interfaces';
import { invoicesService } from '../../services/invoices.service';
import { requestsService } from '../../services/requests.service';
import { toast } from 'sonner';
import { Save, X, Receipt, Calculator, Percent } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: Invoice | null;
  onSuccess: () => void;
  requestId?: string; // Pre-selected request
}

interface FormData {
  requestId: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  subtotal: string;
  taxRate: string;
  discount: string;
  dueDate: string;
  notes: string;
  notesAr: string;
}

interface FormErrors {
  requestId?: string;
  title?: string;
  titleAr?: string;
  subtotal?: string;
}

export function InvoiceModal({ isOpen, onClose, invoice, onSuccess, requestId }: InvoiceModalProps) {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';
  const isEditMode = !!invoice;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    requestId: requestId || '',
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    subtotal: '',
    taxRate: '14',
    discount: '0',
    dueDate: '',
    notes: '',
    notesAr: '',
  });

  // Calculate totals
  const subtotal = parseFloat(formData.subtotal) || 0;
  const taxRate = parseFloat(formData.taxRate) || 0;
  const discount = parseFloat(formData.discount) || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount - discount;

  // Fetch requests that don't have invoices
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        // Get approved requests that might need invoices
        const response = await requestsService.getAll({ limit: 100 });
        // Filter to show only approved/in_progress/completed requests without invoices
        const eligibleRequests = response.data.filter((r) =>
          ['APPROVED', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED'].includes(r.status) && !r.invoice
        );
        setRequests(eligibleRequests);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
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
      if (invoice) {
        setFormData({
          requestId: invoice.requestId,
          title: invoice.title,
          titleAr: invoice.titleAr,
          description: invoice.description || '',
          descriptionAr: invoice.descriptionAr || '',
          subtotal: invoice.subtotal.toString(),
          taxRate: invoice.taxRate.toString(),
          discount: invoice.discount.toString(),
          dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
          notes: invoice.notes || '',
          notesAr: invoice.notesAr || '',
        });
      } else {
        // Set default due date to 30 days from now
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 30);

        setFormData({
          requestId: requestId || '',
          title: '',
          titleAr: '',
          description: '',
          descriptionAr: '',
          subtotal: '',
          taxRate: '14',
          discount: '0',
          dueDate: defaultDueDate.toISOString().split('T')[0],
          notes: '',
          notesAr: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, invoice, requestId]);

  // Auto-fill title from selected request
  useEffect(() => {
    if (formData.requestId && !isEditMode) {
      const selectedRequest = requests.find((r) => r.id === formData.requestId);
      if (selectedRequest) {
        setFormData((prev) => ({
          ...prev,
          title: `Invoice for ${selectedRequest.title}`,
          titleAr: `فاتورة ${selectedRequest.titleAr}`,
          subtotal: selectedRequest.finalPrice?.toString() || selectedRequest.estimatedPrice?.toString() || '',
        }));
      }
    }
  }, [formData.requestId, requests, isEditMode]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.requestId) {
      newErrors.requestId = t('validation.required');
    }

    if (!formData.title.trim()) {
      newErrors.title = t('validation.required');
    }

    if (!formData.titleAr.trim()) {
      newErrors.titleAr = t('validation.required');
    }

    if (!formData.subtotal || parseFloat(formData.subtotal) <= 0) {
      newErrors.subtotal = t('validation.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      if (isEditMode && invoice) {
        const updateData: UpdateInvoiceRequest = {
          title: formData.title,
          titleAr: formData.titleAr,
          description: formData.description || undefined,
          descriptionAr: formData.descriptionAr || undefined,
          subtotal: parseFloat(formData.subtotal),
          taxRate: parseFloat(formData.taxRate),
          discount: parseFloat(formData.discount),
          dueDate: formData.dueDate || undefined,
          notes: formData.notes || undefined,
          notesAr: formData.notesAr || undefined,
        };
        await invoicesService.update(invoice.id, updateData);
        toast.success(t('invoices.updateSuccess'));
      } else {
        const createData: CreateInvoiceRequest = {
          requestId: formData.requestId,
          title: formData.title,
          titleAr: formData.titleAr,
          description: formData.description || undefined,
          descriptionAr: formData.descriptionAr || undefined,
          subtotal: parseFloat(formData.subtotal),
          taxRate: parseFloat(formData.taxRate),
          discount: parseFloat(formData.discount),
          dueDate: formData.dueDate || undefined,
          notes: formData.notes || undefined,
          notesAr: formData.notesAr || undefined,
        };
        await invoicesService.create(createData);
        toast.success(t('invoices.createSuccess'));
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Failed to save invoice:', error);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t('invoices.editInvoice') : t('invoices.addInvoice')}
      size="xl"
    >
      {loadingData ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#f26522]" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Request Selection */}
          {!isEditMode && (
            <SelectField
              label={t('invoices.request')}
              value={formData.requestId}
              onChange={(e) => handleChange('requestId', e.target.value)}
              error={errors.requestId}
              required
            >
              <option value="">{t('invoices.selectRequest')}</option>
              {requests.map((request) => (
                <option key={request.id} value={request.id}>
                  {request.requestNumber} - {language === 'ar' ? request.titleAr : request.title}
                </option>
              ))}
            </SelectField>
          )}

          {/* Title */}
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label={t('invoices.titleEn')}
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              error={errors.title}
              required
              placeholder="Invoice title in English"
              dir="ltr"
            />

            <InputField
              label={t('invoices.titleAr')}
              type="text"
              value={formData.titleAr}
              onChange={(e) => handleChange('titleAr', e.target.value)}
              error={errors.titleAr}
              required
              placeholder="عنوان الفاتورة بالعربي"
              dir="rtl"
            />
          </div>

          {/* Description */}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextareaField
              label={t('invoices.descriptionEn')}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Invoice details in English"
              dir="ltr"
            />

            <TextareaField
              label={t('invoices.descriptionAr')}
              value={formData.descriptionAr}
              onChange={(e) => handleChange('descriptionAr', e.target.value)}
              placeholder="تفاصيل الفاتورة بالعربي"
              dir="rtl"
            />
          </div>

          {/* Pricing Section */}
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="flex items-center gap-2 font-medium text-white">
              <Calculator className="h-5 w-5 text-[#f26522]" />
              {t('invoices.pricing')}
            </h3>

            <div className="grid gap-4 sm:grid-cols-3">
              <InputField
                label={t('invoices.subtotal')}
                type="number"
                value={formData.subtotal}
                onChange={(e) => handleChange('subtotal', e.target.value)}
                error={errors.subtotal}
                required
                placeholder="0.00"
                dir="ltr"
              />

              <InputField
                label={t('invoices.taxRate')}
                type="number"
                value={formData.taxRate}
                onChange={(e) => handleChange('taxRate', e.target.value)}
                placeholder="14"
                hint="VAT %"
                dir="ltr"
              />

              <InputField
                label={t('invoices.discount')}
                type="number"
                value={formData.discount}
                onChange={(e) => handleChange('discount', e.target.value)}
                placeholder="0.00"
                dir="ltr"
              />
            </div>

            {/* Calculation Summary */}
            <div className="space-y-2 rounded-lg bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">{t('invoices.subtotal')}</span>
                <span className="text-white">{subtotal.toLocaleString()} EGP</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-white/60">
                  <Percent className="h-3 w-3" />
                  {t('invoices.tax')} ({taxRate}%)
                </span>
                <span className="text-white">{taxAmount.toLocaleString()} EGP</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">{t('invoices.discount')}</span>
                  <span className="text-red-400">-{discount.toLocaleString()} EGP</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{t('invoices.total')}</span>
                  <span className="text-lg font-bold text-[#f26522]">{total.toLocaleString()} EGP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Due Date */}
          <InputField
            label={t('invoices.dueDate')}
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleChange('dueDate', e.target.value)}
            dir="ltr"
          />

          {/* Notes */}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextareaField
              label={t('invoices.notesEn')}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Payment terms and conditions"
              dir="ltr"
            />

            <TextareaField
              label={t('invoices.notesAr')}
              value={formData.notesAr}
              onChange={(e) => handleChange('notesAr', e.target.value)}
              placeholder="شروط وأحكام الدفع"
              dir="rtl"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} icon={<X className="h-4 w-4" />}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={loading} icon={<Save className="h-4 w-4" />}>
              {isEditMode ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
