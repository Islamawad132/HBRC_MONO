import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { Modal, InputField, TextareaField, CheckboxField, Button } from '../ui';
import type { Role, CreateRoleRequest, UpdateRoleRequest, Permission } from '../../types/interfaces';
import { rolesService } from '../../services/roles.service';
import { toast } from 'sonner';
import { Save, X, Shield, Check, ShieldAlert } from 'lucide-react';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role | null;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  nameAr: string;
  description: string;
  isAdmin: boolean;
  permissionIds: string[];
}

interface FormErrors {
  name?: string;
  nameAr?: string;
}

export function RoleModal({ isOpen, onClose, role, onSuccess }: RoleModalProps) {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';
  const isEditMode = !!role;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    nameAr: '',
    description: '',
    isAdmin: false,
    permissionIds: [],
  });

  // Fetch permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoadingPermissions(true);
        const response = await rolesService.getPermissions();
        setPermissions(response);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        toast.error(t('common.error'));
      } finally {
        setLoadingPermissions(false);
      }
    };

    if (isOpen) {
      fetchPermissions();
    }
  }, [isOpen, t]);

  useEffect(() => {
    if (isOpen) {
      if (role) {
        setFormData({
          name: role.name,
          nameAr: role.nameAr || '',
          description: role.description || '',
          isAdmin: role.isAdmin,
          permissionIds: role.permissions?.map((p) => p.id) || [],
        });
      } else {
        setFormData({
          name: '',
          nameAr: '',
          description: '',
          isAdmin: false,
          permissionIds: [],
        });
      }
      setErrors({});
    }
  }, [isOpen, role]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('validation.required');
    }

    if (!formData.nameAr.trim()) {
      newErrors.nameAr = t('validation.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      if (isEditMode && role) {
        const updateData: UpdateRoleRequest = {
          name: formData.name,
          nameAr: formData.nameAr,
          description: formData.description || undefined,
          isAdmin: formData.isAdmin,
          permissionIds: formData.isAdmin ? [] : formData.permissionIds,
        };
        await rolesService.update(role.id, updateData);
        toast.success(t('roles.updateSuccess'));
      } else {
        const createData: CreateRoleRequest = {
          name: formData.name,
          nameAr: formData.nameAr,
          description: formData.description || undefined,
          isAdmin: formData.isAdmin,
          permissionIds: formData.isAdmin ? [] : formData.permissionIds,
        };
        await rolesService.create(createData);
        toast.success(t('roles.createSuccess'));
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Failed to save role:', error);
      const errorMessage = error instanceof Error ? error.message : t('common.error');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  const toggleModulePermissions = (module: string) => {
    const modulePermissions = permissions.filter((p) => p.module === module);
    const modulePermissionIds = modulePermissions.map((p) => p.id);
    const allSelected = modulePermissionIds.every((id) => formData.permissionIds.includes(id));

    if (allSelected) {
      // Remove all module permissions
      setFormData((prev) => ({
        ...prev,
        permissionIds: prev.permissionIds.filter((id) => !modulePermissionIds.includes(id)),
      }));
    } else {
      // Add all module permissions
      setFormData((prev) => ({
        ...prev,
        permissionIds: [...new Set([...prev.permissionIds, ...modulePermissionIds])],
      }));
    }
  };

  // Group permissions by module
  const permissionsByModule = permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  const moduleTranslations: Record<string, { en: string; ar: string }> = {
    customers: { en: 'Customers', ar: 'العملاء' },
    employees: { en: 'Employees', ar: 'الموظفين' },
    services: { en: 'Services', ar: 'الخدمات' },
    requests: { en: 'Requests', ar: 'الطلبات' },
    invoices: { en: 'Invoices', ar: 'الفواتير' },
    payments: { en: 'Payments', ar: 'المدفوعات' },
    documents: { en: 'Documents', ar: 'المستندات' },
    roles: { en: 'Roles', ar: 'الأدوار' },
    reports: { en: 'Reports', ar: 'التقارير' },
    settings: { en: 'Settings', ar: 'الإعدادات' },
  };

  const actionTranslations: Record<string, { en: string; ar: string }> = {
    create: { en: 'Create', ar: 'إنشاء' },
    read: { en: 'View', ar: 'عرض' },
    update: { en: 'Edit', ar: 'تعديل' },
    delete: { en: 'Delete', ar: 'حذف' },
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t('roles.editRole') : t('roles.addRole')}
      size="xl"
    >
      {loadingPermissions ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#f26522]" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label={t('roles.nameEn')}
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              required
              placeholder="Role name in English"
              dir="ltr"
            />

            <InputField
              label={t('roles.nameAr')}
              type="text"
              value={formData.nameAr}
              onChange={(e) => handleChange('nameAr', e.target.value)}
              error={errors.nameAr}
              required
              placeholder="اسم الدور بالعربي"
              dir="rtl"
            />
          </div>

          <TextareaField
            label={t('roles.description')}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder={t('roles.descriptionPlaceholder')}
          />

          {/* Admin Toggle */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-amber-400" />
                <div>
                  <p className="font-medium text-white">{t('roles.adminRole')}</p>
                  <p className="text-sm text-white/60">{t('roles.adminRoleDescription')}</p>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={formData.isAdmin}
                  onChange={(e) => handleChange('isAdmin', e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full" />
              </label>
            </div>
          </div>

          {/* Permissions Grid */}
          {!formData.isAdmin && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-medium text-white">
                <Shield className="h-5 w-5 text-[#f26522]" />
                {t('roles.permissions')}
              </h3>

              <div className="max-h-[300px] space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-4">
                {Object.entries(permissionsByModule).map(([module, modulePermissions]) => {
                  const allSelected = modulePermissions.every((p) => formData.permissionIds.includes(p.id));
                  const someSelected = modulePermissions.some((p) => formData.permissionIds.includes(p.id));

                  return (
                    <div key={module} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      {/* Module Header */}
                      <div
                        className="flex cursor-pointer items-center justify-between"
                        onClick={() => toggleModulePermissions(module)}
                      >
                        <span className="font-medium text-white">
                          {moduleTranslations[module]?.[language === 'ar' ? 'ar' : 'en'] || module}
                        </span>
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border ${
                            allSelected
                              ? 'border-[#f26522] bg-[#f26522]'
                              : someSelected
                                ? 'border-[#f26522]/50 bg-[#f26522]/20'
                                : 'border-white/20 bg-white/5'
                          }`}
                        >
                          {allSelected && <Check className="h-3 w-3 text-white" />}
                          {someSelected && !allSelected && <div className="h-2 w-2 rounded-sm bg-[#f26522]" />}
                        </div>
                      </div>

                      {/* Module Permissions */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {modulePermissions.map((permission) => {
                          const isSelected = formData.permissionIds.includes(permission.id);
                          return (
                            <button
                              key={permission.id}
                              type="button"
                              onClick={() => togglePermission(permission.id)}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                                isSelected
                                  ? 'border-[#f26522] bg-[#f26522]/20 text-[#f26522]'
                                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                              }`}
                            >
                              {actionTranslations[permission.action]?.[language === 'ar' ? 'ar' : 'en'] ||
                                permission.action}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-sm text-white/40">
                {t('roles.selectedPermissions', { count: formData.permissionIds.length })}
              </p>
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
      )}
    </Modal>
  );
}
