import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { Modal, InputField, SelectField, Button } from '../ui';
import type { Employee, CreateEmployeeRequest, UpdateEmployeeRequest, Role } from '../../types/interfaces';
import { employeesService } from '../../services/employees.service';
import { rolesService } from '../../services/roles.service';
import { toast } from 'sonner';
import { Save, X, UserCog, Shield } from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  onSuccess: () => void;
}

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  employeeId: string;
  department: string;
  position: string;
  institute: string;
  roleId: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  department?: string;
  position?: string;
  roleId?: string;
}

// Common departments at HBRC
const departments = [
  { en: 'Laboratory', ar: 'المعامل' },
  { en: 'Consulting', ar: 'الاستشارات' },
  { en: 'Technical Affairs', ar: 'الشؤون الفنية' },
  { en: 'Fire Safety', ar: 'السلامة من الحريق' },
  { en: 'Quality Control', ar: 'ضبط الجودة' },
  { en: 'Administration', ar: 'الإدارة' },
  { en: 'Finance', ar: 'المالية' },
  { en: 'IT', ar: 'تكنولوجيا المعلومات' },
  { en: 'Customer Service', ar: 'خدمة العملاء' },
];

export function EmployeeModal({ isOpen, onClose, employee, onSuccess }: EmployeeModalProps) {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';
  const isEditMode = !!employee;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    employeeId: '',
    department: '',
    position: '',
    institute: '',
    roleId: '',
  });

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        const response = await rolesService.getAll();
        setRoles(response.data);
      } catch (error) {
        console.error('Failed to fetch roles:', error);
        toast.error(t('common.error'));
      } finally {
        setLoadingRoles(false);
      }
    };

    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen, t]);

  useEffect(() => {
    if (isOpen) {
      if (employee) {
        setFormData({
          email: employee.email,
          password: '',
          firstName: employee.firstName,
          lastName: employee.lastName,
          phone: employee.phone || '',
          employeeId: employee.employeeId,
          department: employee.department,
          position: employee.position,
          institute: employee.institute || '',
          roleId: employee.roleId,
        });
      } else {
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          phone: '',
          employeeId: '',
          department: '',
          position: '',
          institute: '',
          roleId: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, employee]);

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

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('validation.required');
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t('validation.required');
    }

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = t('validation.required');
    }

    if (!formData.department) {
      newErrors.department = t('validation.required');
    }

    if (!formData.position.trim()) {
      newErrors.position = t('validation.required');
    }

    if (!formData.roleId) {
      newErrors.roleId = t('validation.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      if (isEditMode && employee) {
        const updateData: UpdateEmployeeRequest = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          department: formData.department,
          position: formData.position,
          institute: formData.institute || undefined,
          roleId: formData.roleId,
        };
        await employeesService.update(employee.id, updateData);
        toast.success(t('employees.updateSuccess'));
      } else {
        const createData: CreateEmployeeRequest = {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          employeeId: formData.employeeId,
          department: formData.department,
          position: formData.position,
          institute: formData.institute || undefined,
          roleId: formData.roleId,
        };
        await employeesService.create(createData);
        toast.success(t('employees.createSuccess'));
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Failed to save employee:', error);
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
      title={isEditMode ? t('employees.editEmployee') : t('employees.addEmployee')}
      size="lg"
    >
      {loadingRoles ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#f26522]" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Personal Info */}
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="flex items-center gap-2 font-medium text-white">
              <UserCog className="h-5 w-5 text-[#f26522]" />
              {t('employees.personalInfo')}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label={t('employees.firstName')}
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                error={errors.firstName}
                required
                placeholder={t('employees.firstNamePlaceholder')}
              />

              <InputField
                label={t('employees.lastName')}
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                error={errors.lastName}
                required
                placeholder={t('employees.lastNamePlaceholder')}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label={t('employees.email')}
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                required
                placeholder="employee@hbrc.gov.eg"
                dir="ltr"
                disabled={isEditMode}
              />

              <InputField
                label={t('employees.phone')}
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="01xxxxxxxxx"
                dir="ltr"
              />
            </div>

            {!isEditMode && (
              <InputField
                label={t('employees.password')}
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
                required
                placeholder="••••••••"
                hint={t('employees.passwordHint')}
              />
            )}
          </div>

          {/* Work Info */}
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="flex items-center gap-2 font-medium text-white">
              <Shield className="h-5 w-5 text-[#f26522]" />
              {t('employees.workInfo')}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label={t('employees.employeeId')}
                type="text"
                value={formData.employeeId}
                onChange={(e) => handleChange('employeeId', e.target.value)}
                error={errors.employeeId}
                required
                placeholder="EMP-001"
                dir="ltr"
                disabled={isEditMode}
              />

              <SelectField
                label={t('employees.department')}
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                error={errors.department}
                required
              >
                <option value="">{t('employees.selectDepartment')}</option>
                {departments.map((dept) => (
                  <option key={dept.en} value={dept.en}>
                    {language === 'ar' ? dept.ar : dept.en}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label={t('employees.position')}
                type="text"
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
                error={errors.position}
                required
                placeholder={t('employees.positionPlaceholder')}
              />

              <InputField
                label={t('employees.institute')}
                type="text"
                value={formData.institute}
                onChange={(e) => handleChange('institute', e.target.value)}
                placeholder={t('employees.institutePlaceholder')}
              />
            </div>

            <SelectField
              label={t('employees.role')}
              value={formData.roleId}
              onChange={(e) => handleChange('roleId', e.target.value)}
              error={errors.roleId}
              required
            >
              <option value="">{t('employees.selectRole')}</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {language === 'ar' && role.nameAr ? role.nameAr : role.name}
                  {role.isAdmin && ` (${t('employees.admin')})`}
                </option>
              ))}
            </SelectField>
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
