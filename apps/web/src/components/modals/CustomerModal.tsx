import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { Modal, InputField, SelectField, TextareaField, Button } from '../ui';
import { CustomerType, CustomerTypeLabels, getLabel } from '../../types/enums';
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../../types/interfaces';
import { customersService } from '../../services/customers.service';
import { toast } from 'sonner';
import { Save, X, User, Building2, Briefcase, PartyPopper } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSuccess: () => void;
}

interface FormData {
  email: string;
  password: string;
  name: string;
  phone: string;
  customerType: CustomerType;
  address: string;
  companyName: string;
  taxNumber: string;
  contactPerson: string;
  licenseNumber: string;
  consultingFirm: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
  customerType?: string;
  companyName?: string;
}

const customerTypeIcons = {
  INDIVIDUAL: User,
  CORPORATE: Building2,
  CONSULTANT: Briefcase,
  SPONSOR: PartyPopper,
};

export function CustomerModal({ isOpen, onClose, customer, onSuccess }: CustomerModalProps) {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';
  const isEditMode = !!customer;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    name: '',
    phone: '',
    customerType: CustomerType.INDIVIDUAL,
    address: '',
    companyName: '',
    taxNumber: '',
    contactPerson: '',
    licenseNumber: '',
    consultingFirm: '',
  });

  // Reset form when modal opens/closes or customer changes
  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setFormData({
          email: customer.email,
          password: '',
          name: customer.name,
          phone: customer.phone,
          customerType: customer.customerType,
          address: customer.address || '',
          companyName: customer.companyName || '',
          taxNumber: customer.taxNumber || '',
          contactPerson: customer.contactPerson || '',
          licenseNumber: customer.licenseNumber || '',
          consultingFirm: customer.consultingFirm || '',
        });
      } else {
        setFormData({
          email: '',
          password: '',
          name: '',
          phone: '',
          customerType: CustomerType.INDIVIDUAL,
          address: '',
          companyName: '',
          taxNumber: '',
          contactPerson: '',
          licenseNumber: '',
          consultingFirm: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, customer]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = t('validation.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.invalidEmail');
    }

    if (!isEditMode && !formData.password.trim()) {
      newErrors.password = t('validation.required');
    } else if (!isEditMode && formData.password.length < 6) {
      newErrors.password = t('validation.minLength', { min: 6 });
    }

    if (!formData.name.trim()) {
      newErrors.name = t('validation.required');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('validation.required');
    }

    // Corporate requires company name
    if (formData.customerType === CustomerType.CORPORATE && !formData.companyName.trim()) {
      newErrors.companyName = t('validation.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      if (isEditMode && customer) {
        const updateData: UpdateCustomerRequest = {
          name: formData.name,
          phone: formData.phone,
          customerType: formData.customerType,
          address: formData.address || undefined,
          companyName: formData.companyName || undefined,
          taxNumber: formData.taxNumber || undefined,
          contactPerson: formData.contactPerson || undefined,
          licenseNumber: formData.licenseNumber || undefined,
          consultingFirm: formData.consultingFirm || undefined,
        };
        await customersService.update(customer.id, updateData);
        toast.success(t('customers.updateSuccess'));
      } else {
        const createData: CreateCustomerRequest = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          customerType: formData.customerType,
          address: formData.address || undefined,
          companyName: formData.companyName || undefined,
          taxNumber: formData.taxNumber || undefined,
          contactPerson: formData.contactPerson || undefined,
          licenseNumber: formData.licenseNumber || undefined,
          consultingFirm: formData.consultingFirm || undefined,
        };
        await customersService.create(createData);
        toast.success(t('customers.createSuccess'));
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Failed to save customer:', error);
      const errorMessage = error instanceof Error ? error.message : t('common.error');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Determine which fields to show based on customer type
  const showCorporateFields = formData.customerType === CustomerType.CORPORATE;
  const showConsultantFields = formData.customerType === CustomerType.CONSULTANT;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t('customers.editCustomer') : t('customers.addCustomer')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Customer Type Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white/80">{t('customers.type')}</label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.values(CustomerType).map((type) => {
              const Icon = customerTypeIcons[type];
              const isSelected = formData.customerType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChange('customerType', type)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'border-[#f26522] bg-[#f26522]/10 text-[#f26522]'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium">
                    {getLabel(CustomerTypeLabels, type, language === 'ar' ? 'ar' : 'en')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label={t('customers.name')}
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            required
            placeholder={t('customers.namePlaceholder')}
          />

          <InputField
            label={t('customers.phone')}
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            error={errors.phone}
            required
            placeholder="01xxxxxxxxx"
            dir="ltr"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label={t('customers.email')}
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            required
            placeholder="example@domain.com"
            dir="ltr"
            disabled={isEditMode}
          />

          {!isEditMode && (
            <InputField
              label={t('customers.password')}
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              error={errors.password}
              required
              placeholder="••••••••"
              hint={t('customers.passwordHint')}
            />
          )}
        </div>

        <TextareaField
          label={t('customers.address')}
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder={t('customers.addressPlaceholder')}
        />

        {/* Corporate Fields */}
        {showCorporateFields && (
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="flex items-center gap-2 font-medium text-white">
              <Building2 className="h-5 w-5 text-[#f26522]" />
              {t('customers.companyInfo')}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label={t('customers.companyName')}
                type="text"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                error={errors.companyName}
                required
                placeholder={t('customers.companyNamePlaceholder')}
              />

              <InputField
                label={t('customers.taxNumber')}
                type="text"
                value={formData.taxNumber}
                onChange={(e) => handleChange('taxNumber', e.target.value)}
                placeholder={t('customers.taxNumberPlaceholder')}
                dir="ltr"
              />
            </div>

            <InputField
              label={t('customers.contactPerson')}
              type="text"
              value={formData.contactPerson}
              onChange={(e) => handleChange('contactPerson', e.target.value)}
              placeholder={t('customers.contactPersonPlaceholder')}
            />
          </div>
        )}

        {/* Consultant Fields */}
        {showConsultantFields && (
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="flex items-center gap-2 font-medium text-white">
              <Briefcase className="h-5 w-5 text-[#f26522]" />
              {t('customers.consultantInfo')}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label={t('customers.licenseNumber')}
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => handleChange('licenseNumber', e.target.value)}
                placeholder={t('customers.licenseNumberPlaceholder')}
                dir="ltr"
              />

              <InputField
                label={t('customers.consultingFirm')}
                type="text"
                value={formData.consultingFirm}
                onChange={(e) => handleChange('consultingFirm', e.target.value)}
                placeholder={t('customers.consultingFirmPlaceholder')}
              />
            </div>
          </div>
        )}

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
