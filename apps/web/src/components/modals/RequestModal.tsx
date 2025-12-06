import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { Modal, InputField, SelectField, TextareaField, Button } from '../ui';
import { RequestPriority, RequestPriorityLabels, getLabel } from '../../types/enums';
import type { ServiceRequest, CreateServiceRequestRequest, UpdateServiceRequestRequest, Service, Customer } from '../../types/interfaces';
import { requestsService } from '../../services/requests.service';
import { servicesService } from '../../services/services.service';
import { customersService } from '../../services/customers.service';
import { toast } from 'sonner';
import { Save, X, AlertTriangle, Clock } from 'lucide-react';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: ServiceRequest | null;
  onSuccess: () => void;
  customerId?: string; // Pre-selected customer (for customer portal)
}

interface FormData {
  customerId: string;
  serviceId: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  notes: string;
  notesAr: string;
  priority: RequestPriority;
  expectedDate: string;
}

interface FormErrors {
  customerId?: string;
  serviceId?: string;
  title?: string;
  titleAr?: string;
}

const priorityColors = {
  LOW: 'border-gray-500/50 bg-gray-500/10 text-gray-400',
  MEDIUM: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
  HIGH: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
  URGENT: 'border-red-500/50 bg-red-500/10 text-red-400',
};

export function RequestModal({ isOpen, onClose, request, onSuccess, customerId }: RequestModalProps) {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';
  const isEditMode = !!request;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    customerId: customerId || '',
    serviceId: '',
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    notes: '',
    notesAr: '',
    priority: RequestPriority.MEDIUM,
    expectedDate: '',
  });

  // Fetch services and customers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [servicesRes, customersRes] = await Promise.all([
          servicesService.getAll({ limit: 100 }),
          !customerId ? customersService.getAll({ limit: 100 }) : Promise.resolve({ data: [] }),
        ]);
        setServices(servicesRes.data.filter((s) => s.isActive));
        if (!customerId) {
          setCustomers(customersRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error(t('common.error'));
      } finally {
        setLoadingData(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, customerId, t]);

  useEffect(() => {
    if (isOpen) {
      if (request) {
        setFormData({
          customerId: request.customerId,
          serviceId: request.serviceId,
          title: request.title,
          titleAr: request.titleAr,
          description: request.description || '',
          descriptionAr: request.descriptionAr || '',
          notes: request.notes || '',
          notesAr: request.notesAr || '',
          priority: request.priority,
          expectedDate: request.expectedDate ? request.expectedDate.split('T')[0] : '',
        });
      } else {
        setFormData({
          customerId: customerId || '',
          serviceId: '',
          title: '',
          titleAr: '',
          description: '',
          descriptionAr: '',
          notes: '',
          notesAr: '',
          priority: RequestPriority.MEDIUM,
          expectedDate: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, request, customerId]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!customerId && !formData.customerId) {
      newErrors.customerId = t('validation.required');
    }

    if (!formData.serviceId) {
      newErrors.serviceId = t('validation.required');
    }

    if (!formData.title.trim()) {
      newErrors.title = t('validation.required');
    }

    if (!formData.titleAr.trim()) {
      newErrors.titleAr = t('validation.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      if (isEditMode && request) {
        const updateData: UpdateServiceRequestRequest = {
          title: formData.title,
          titleAr: formData.titleAr,
          description: formData.description || undefined,
          descriptionAr: formData.descriptionAr || undefined,
          notes: formData.notes || undefined,
          notesAr: formData.notesAr || undefined,
          priority: formData.priority,
          expectedDate: formData.expectedDate || undefined,
        };
        await requestsService.update(request.id, updateData);
        toast.success(t('requests.updateSuccess'));
      } else {
        const createData: CreateServiceRequestRequest = {
          serviceId: formData.serviceId,
          title: formData.title,
          titleAr: formData.titleAr,
          description: formData.description || undefined,
          descriptionAr: formData.descriptionAr || undefined,
          notes: formData.notes || undefined,
          notesAr: formData.notesAr || undefined,
          priority: formData.priority,
          expectedDate: formData.expectedDate || undefined,
        };
        // If customerId is provided, use customer-specific endpoint
        if (customerId) {
          await requestsService.createForCustomer(customerId, createData);
        } else {
          await requestsService.createForCustomer(formData.customerId, createData);
        }
        toast.success(t('requests.createSuccess'));
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Failed to save request:', error);
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

  // Get selected service for displaying price info
  const selectedService = services.find((s) => s.id === formData.serviceId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t('requests.editRequest') : t('requests.addRequest')}
      size="xl"
    >
      {loadingData ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#f26522]" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Customer Selection (if not pre-selected) */}
          {!customerId && (
            <SelectField
              label={t('requests.customer')}
              value={formData.customerId}
              onChange={(e) => handleChange('customerId', e.target.value)}
              error={errors.customerId}
              required
              disabled={isEditMode}
            >
              <option value="">{t('requests.selectCustomer')}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.email}
                </option>
              ))}
            </SelectField>
          )}

          {/* Service Selection */}
          <div className="space-y-2">
            <SelectField
              label={t('requests.service')}
              value={formData.serviceId}
              onChange={(e) => handleChange('serviceId', e.target.value)}
              error={errors.serviceId}
              required
              disabled={isEditMode}
            >
              <option value="">{t('requests.selectService')}</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {language === 'ar' ? service.nameAr : service.name} ({service.code})
                </option>
              ))}
            </SelectField>

            {/* Service Price Info */}
            {selectedService && (
              <div className="flex items-center gap-4 rounded-lg bg-white/5 p-3 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <Clock className="h-4 w-4" />
                  <span>
                    {selectedService.duration
                      ? `${selectedService.duration} ${t('requests.days')}`
                      : t('requests.durationTBD')}
                  </span>
                </div>
                <div className="text-white/60">
                  {selectedService.basePrice
                    ? `${selectedService.basePrice.toLocaleString()} ${selectedService.currency}`
                    : selectedService.minPrice && selectedService.maxPrice
                      ? `${selectedService.minPrice.toLocaleString()} - ${selectedService.maxPrice.toLocaleString()} ${selectedService.currency}`
                      : t('requests.priceTBD')}
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label={t('requests.titleEn')}
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              error={errors.title}
              required
              placeholder="Request title in English"
              dir="ltr"
            />

            <InputField
              label={t('requests.titleAr')}
              type="text"
              value={formData.titleAr}
              onChange={(e) => handleChange('titleAr', e.target.value)}
              error={errors.titleAr}
              required
              placeholder="عنوان الطلب بالعربي"
              dir="rtl"
            />
          </div>

          {/* Description */}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextareaField
              label={t('requests.descriptionEn')}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detailed description in English"
              dir="ltr"
            />

            <TextareaField
              label={t('requests.descriptionAr')}
              value={formData.descriptionAr}
              onChange={(e) => handleChange('descriptionAr', e.target.value)}
              placeholder="الوصف التفصيلي بالعربي"
              dir="rtl"
            />
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-white/80">{t('requests.priority')}</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.values(RequestPriority).map((priority) => {
                const isSelected = formData.priority === priority;
                return (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => handleChange('priority', priority)}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 transition-all ${
                      isSelected ? priorityColors[priority] : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {priority === 'URGENT' && <AlertTriangle className="h-4 w-4" />}
                    <span className="text-sm font-medium">
                      {getLabel(RequestPriorityLabels, priority, language === 'ar' ? 'ar' : 'en')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expected Date */}
          <InputField
            label={t('requests.expectedDate')}
            type="date"
            value={formData.expectedDate}
            onChange={(e) => handleChange('expectedDate', e.target.value)}
            hint={t('requests.expectedDateHint')}
            dir="ltr"
          />

          {/* Notes */}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextareaField
              label={t('requests.notesEn')}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes in English"
              dir="ltr"
            />

            <TextareaField
              label={t('requests.notesAr')}
              value={formData.notesAr}
              onChange={(e) => handleChange('notesAr', e.target.value)}
              placeholder="ملاحظات إضافية بالعربي"
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
