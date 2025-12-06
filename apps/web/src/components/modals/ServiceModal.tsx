import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { Modal, InputField, SelectField, TextareaField, Button } from '../ui';
import { ServiceCategory, ServiceCategoryLabels, PricingType, getLabel } from '../../types/enums';
import type { Service, CreateServiceRequest, UpdateServiceRequest } from '../../types/interfaces';
import { servicesService } from '../../services/services.service';
import { toast } from 'sonner';
import { Save, X, DollarSign } from 'lucide-react';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: Service | null;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  code: string;
  category: ServiceCategory;
  pricingType: PricingType;
  basePrice: string;
  minPrice: string;
  maxPrice: string;
  currency: string;
  duration: string;
  requirements: string;
  requirementsAr: string;
}

interface FormErrors {
  name?: string;
  nameAr?: string;
  code?: string;
  category?: string;
  basePrice?: string;
  minPrice?: string;
  maxPrice?: string;
}

export function ServiceModal({ isOpen, onClose, service, onSuccess }: ServiceModalProps) {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';
  const isEditMode = !!service;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    code: '',
    category: ServiceCategory.LAB_TESTS,
    pricingType: PricingType.FIXED,
    basePrice: '',
    minPrice: '',
    maxPrice: '',
    currency: 'EGP',
    duration: '',
    requirements: '',
    requirementsAr: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (service) {
        setFormData({
          name: service.name,
          nameAr: service.nameAr,
          description: service.description || '',
          descriptionAr: service.descriptionAr || '',
          code: service.code,
          category: service.category,
          pricingType: service.pricingType,
          basePrice: service.basePrice?.toString() || '',
          minPrice: service.minPrice?.toString() || '',
          maxPrice: service.maxPrice?.toString() || '',
          currency: service.currency,
          duration: service.duration?.toString() || '',
          requirements: service.requirements || '',
          requirementsAr: service.requirementsAr || '',
        });
      } else {
        setFormData({
          name: '',
          nameAr: '',
          description: '',
          descriptionAr: '',
          code: '',
          category: ServiceCategory.LAB_TESTS,
          pricingType: PricingType.FIXED,
          basePrice: '',
          minPrice: '',
          maxPrice: '',
          currency: 'EGP',
          duration: '',
          requirements: '',
          requirementsAr: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, service]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('validation.required');
    }

    if (!formData.nameAr.trim()) {
      newErrors.nameAr = t('validation.required');
    }

    if (!formData.code.trim()) {
      newErrors.code = t('validation.required');
    }

    // Validate pricing based on type
    if (formData.pricingType === PricingType.FIXED && !formData.basePrice) {
      newErrors.basePrice = t('validation.required');
    }

    if (formData.pricingType === PricingType.VARIABLE) {
      if (!formData.minPrice) {
        newErrors.minPrice = t('validation.required');
      }
      if (!formData.maxPrice) {
        newErrors.maxPrice = t('validation.required');
      }
      if (formData.minPrice && formData.maxPrice && parseFloat(formData.minPrice) > parseFloat(formData.maxPrice)) {
        newErrors.maxPrice = t('validation.maxLessThanMin');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      if (isEditMode && service) {
        const updateData: UpdateServiceRequest = {
          name: formData.name,
          nameAr: formData.nameAr,
          description: formData.description || undefined,
          descriptionAr: formData.descriptionAr || undefined,
          category: formData.category,
          pricingType: formData.pricingType,
          basePrice: formData.basePrice ? parseFloat(formData.basePrice) : undefined,
          minPrice: formData.minPrice ? parseFloat(formData.minPrice) : undefined,
          maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : undefined,
          currency: formData.currency,
          duration: formData.duration ? parseInt(formData.duration) : undefined,
          requirements: formData.requirements || undefined,
          requirementsAr: formData.requirementsAr || undefined,
        };
        await servicesService.update(service.id, updateData);
        toast.success(t('services.updateSuccess'));
      } else {
        const createData: CreateServiceRequest = {
          name: formData.name,
          nameAr: formData.nameAr,
          description: formData.description || undefined,
          descriptionAr: formData.descriptionAr || undefined,
          code: formData.code,
          category: formData.category,
          pricingType: formData.pricingType,
          basePrice: formData.basePrice ? parseFloat(formData.basePrice) : undefined,
          minPrice: formData.minPrice ? parseFloat(formData.minPrice) : undefined,
          maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : undefined,
          currency: formData.currency,
          duration: formData.duration ? parseInt(formData.duration) : undefined,
          requirements: formData.requirements || undefined,
          requirementsAr: formData.requirementsAr || undefined,
        };
        await servicesService.create(createData);
        toast.success(t('services.createSuccess'));
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Failed to save service:', error);
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
      title={isEditMode ? t('services.editService') : t('services.addService')}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Basic Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label={t('services.nameEn')}
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            required
            placeholder="Service name in English"
            dir="ltr"
          />

          <InputField
            label={t('services.nameAr')}
            type="text"
            value={formData.nameAr}
            onChange={(e) => handleChange('nameAr', e.target.value)}
            error={errors.nameAr}
            required
            placeholder="اسم الخدمة بالعربي"
            dir="rtl"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label={t('services.code')}
            type="text"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
            error={errors.code}
            required
            placeholder="SRV-001"
            dir="ltr"
            disabled={isEditMode}
          />

          <SelectField
            label={t('services.category')}
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            required
          >
            {Object.values(ServiceCategory).map((cat) => (
              <option key={cat} value={cat}>
                {getLabel(ServiceCategoryLabels, cat, language === 'ar' ? 'ar' : 'en')}
              </option>
            ))}
          </SelectField>
        </div>

        {/* Description */}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextareaField
            label={t('services.descriptionEn')}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Description in English"
            dir="ltr"
          />

          <TextareaField
            label={t('services.descriptionAr')}
            value={formData.descriptionAr}
            onChange={(e) => handleChange('descriptionAr', e.target.value)}
            placeholder="الوصف بالعربي"
            dir="rtl"
          />
        </div>

        {/* Pricing Section */}
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="flex items-center gap-2 font-medium text-white">
            <DollarSign className="h-5 w-5 text-[#f26522]" />
            {t('services.pricing')}
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              label={t('services.pricingType')}
              value={formData.pricingType}
              onChange={(e) => handleChange('pricingType', e.target.value)}
            >
              <option value={PricingType.FIXED}>{t('services.pricingTypes.fixed')}</option>
              <option value={PricingType.VARIABLE}>{t('services.pricingTypes.variable')}</option>
              <option value={PricingType.CUSTOM}>{t('services.pricingTypes.custom')}</option>
            </SelectField>

            <SelectField label={t('services.currency')} value={formData.currency} onChange={(e) => handleChange('currency', e.target.value)}>
              <option value="EGP">{t('services.currencies.EGP')}</option>
              <option value="USD">{t('services.currencies.USD')}</option>
              <option value="EUR">{t('services.currencies.EUR')}</option>
            </SelectField>

            <InputField
              label={t('services.duration')}
              type="number"
              value={formData.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
              placeholder="0"
              hint={t('services.durationHint')}
              dir="ltr"
            />
          </div>

          {formData.pricingType === PricingType.FIXED && (
            <InputField
              label={t('services.basePrice')}
              type="number"
              value={formData.basePrice}
              onChange={(e) => handleChange('basePrice', e.target.value)}
              error={errors.basePrice}
              required
              placeholder="0.00"
              dir="ltr"
            />
          )}

          {formData.pricingType === PricingType.VARIABLE && (
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label={t('services.minPrice')}
                type="number"
                value={formData.minPrice}
                onChange={(e) => handleChange('minPrice', e.target.value)}
                error={errors.minPrice}
                required
                placeholder="0.00"
                dir="ltr"
              />

              <InputField
                label={t('services.maxPrice')}
                type="number"
                value={formData.maxPrice}
                onChange={(e) => handleChange('maxPrice', e.target.value)}
                error={errors.maxPrice}
                required
                placeholder="0.00"
                dir="ltr"
              />
            </div>
          )}
        </div>

        {/* Requirements */}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextareaField
            label={t('services.requirementsEn')}
            value={formData.requirements}
            onChange={(e) => handleChange('requirements', e.target.value)}
            placeholder="Required documents and conditions in English"
            dir="ltr"
          />

          <TextareaField
            label={t('services.requirementsAr')}
            value={formData.requirementsAr}
            onChange={(e) => handleChange('requirementsAr', e.target.value)}
            placeholder="المستندات والشروط المطلوبة بالعربي"
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
    </Modal>
  );
}
