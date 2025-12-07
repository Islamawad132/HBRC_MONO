import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { settingsService } from '../../services/settings.service';
import { rolesService } from '../../services/roles.service';
import type { SystemSetting, Role, Permission } from '../../types/interfaces';
import {
  Settings,
  Bell,
  Palette,
  Globe,
  Save,
  Moon,
  Sun,
  Monitor,
  Check,
  Cog,
  Edit2,
  Loader2,
  Search,
  RefreshCw,
  Shield,
  Key,
  Crown,
  Users,
  Plus,
  Trash2,
  Eye,
  Lock,
} from 'lucide-react';
import { RoleModal, DeleteConfirmModal } from '../../components/modals';
import { Modal, ModalFooter } from '../../components/ui/Modal';

type SettingsTab = 'appearance' | 'notifications' | 'system' | 'roles' | 'permissions';

// Group settings by category
interface SettingCategory {
  key: string;
  label: string;
  labelAr: string;
  settings: SystemSetting[];
}

export function SettingsPage() {
  const { t } = useTranslation();
  const { language, setLanguage, theme, setTheme } = useSettings();
  const { user } = useAuth();
  const isRTL = language === 'ar';
  const isAdmin = user?.isAdmin || user?.role?.isAdmin;

  // State
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [saving, setSaving] = useState(false);

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    requestUpdates: true,
    invoiceReminders: true,
    marketingEmails: false,
  });

  // System Settings state
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Roles state
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Permissions state
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsByModule, setPermissionsByModule] = useState<Record<string, Permission[]>>({});
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  // Build tabs based on user role
  const tabs = [
    { id: 'appearance' as SettingsTab, label: t('settingsPage.appearance'), icon: Palette },
    { id: 'notifications' as SettingsTab, label: t('settingsPage.notifications'), icon: Bell },
    // Only show admin tabs for admins
    ...(isAdmin ? [
      { id: 'system' as SettingsTab, label: t('settingsPage.systemSettings') || 'System Settings', icon: Cog },
      { id: 'roles' as SettingsTab, label: t('sidebar.roles') || 'Roles', icon: Shield },
      { id: 'permissions' as SettingsTab, label: t('settingsPage.permissions') || 'Permissions', icon: Key },
    ] : []),
  ];

  // Fetch system settings
  const fetchSystemSettings = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingSettings(true);
    try {
      const data = await settingsService.getSystemSettings();
      setSystemSettings(data);
    } catch (error) {
      console.error('Failed to fetch system settings:', error);
      toast.error(t('common.error'));
    } finally {
      setLoadingSettings(false);
    }
  }, [isAdmin, t]);

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingRoles(true);
    try {
      const data = await rolesService.getAllRoles();
      setRoles(data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error(t('common.error'));
    } finally {
      setLoadingRoles(false);
    }
  }, [isAdmin, t]);

  // Fetch permissions
  const fetchPermissions = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingPermissions(true);
    try {
      const [perms, groupedPerms] = await Promise.all([
        rolesService.getAllPermissions(),
        rolesService.getPermissionsByModule(),
      ]);
      setPermissions(perms);
      setPermissionsByModule(groupedPerms);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      toast.error(t('common.error'));
    } finally {
      setLoadingPermissions(false);
    }
  }, [isAdmin, t]);

  useEffect(() => {
    if (activeTab === 'system' && isAdmin) {
      fetchSystemSettings();
    } else if (activeTab === 'roles' && isAdmin) {
      fetchRoles();
      fetchPermissions();
    } else if (activeTab === 'permissions' && isAdmin) {
      fetchPermissions();
    }
  }, [activeTab, isAdmin, fetchSystemSettings, fetchRoles, fetchPermissions]);

  // Group settings by category
  const groupedSettings = useCallback((): SettingCategory[] => {
    const categories: Record<string, SystemSetting[]> = {};

    const filteredSettings = systemSettings.filter(setting => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        setting.key.toLowerCase().includes(query) ||
        setting.label.toLowerCase().includes(query) ||
        setting.labelAr.includes(query) ||
        setting.value.toLowerCase().includes(query)
      );
    });

    filteredSettings.forEach(setting => {
      const cat = setting.category || 'general';
      if (!categories[cat]) {
        categories[cat] = [];
      }
      categories[cat].push(setting);
    });

    const categoryLabels: Record<string, { label: string; labelAr: string }> = {
      files: { label: 'File Settings', labelAr: 'إعدادات الملفات' },
      company: { label: 'Company Information', labelAr: 'معلومات الشركة' },
      finance: { label: 'Finance Settings', labelAr: 'الإعدادات المالية' },
      payment: { label: 'Payment Settings', labelAr: 'إعدادات الدفع' },
      system: { label: 'System Settings', labelAr: 'إعدادات النظام' },
      general: { label: 'General Settings', labelAr: 'إعدادات عامة' },
    };

    return Object.entries(categories).map(([key, settings]) => ({
      key,
      label: categoryLabels[key]?.label || key,
      labelAr: categoryLabels[key]?.labelAr || key,
      settings,
    }));
  }, [systemSettings, searchQuery]);

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(t('settingsPage.notificationsUpdated'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditSetting = (setting: SystemSetting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
  };

  const handleSaveSetting = async (key: string) => {
    setSaving(true);
    try {
      await settingsService.updateSystemSetting(key, { value: editValue });
      toast.success(isRTL ? 'تم تحديث الإعداد بنجاح' : 'Setting updated successfully');
      setEditingKey(null);
      fetchSystemSettings();
    } catch (error) {
      console.error('Failed to update setting:', error);
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  // Role handlers
  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    try {
      await rolesService.deleteRole(selectedRole.id);
      toast.success(isRTL ? 'تم حذف الدور بنجاح' : 'Role deleted successfully');
      setShowDeleteModal(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (error) {
      console.error('Failed to delete role:', error);
      toast.error(t('common.error'));
    }
  };

  // Get module display name
  const getModuleDisplayName = (module: string): string => {
    const moduleNames: Record<string, { en: string; ar: string }> = {
      users: { en: 'Users', ar: 'المستخدمين' },
      customers: { en: 'Customers', ar: 'العملاء' },
      employees: { en: 'Employees', ar: 'الموظفين' },
      roles: { en: 'Roles', ar: 'الأدوار' },
      permissions: { en: 'Permissions', ar: 'الصلاحيات' },
      services: { en: 'Services', ar: 'الخدمات' },
      requests: { en: 'Requests', ar: 'الطلبات' },
      invoices: { en: 'Invoices', ar: 'الفواتير' },
      payments: { en: 'Payments', ar: 'المدفوعات' },
      documents: { en: 'Documents', ar: 'المستندات' },
      reports: { en: 'Reports', ar: 'التقارير' },
      dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
      settings: { en: 'Settings', ar: 'الإعدادات' },
      audit: { en: 'Audit', ar: 'التدقيق' },
      notifications: { en: 'Notifications', ar: 'الإشعارات' },
      'lab-tests': { en: 'Lab Tests', ar: 'الاختبارات المعملية' },
      stations: { en: 'Stations', ar: 'المحطات' },
      consultancy: { en: 'Consultancy', ar: 'الاستشارات' },
      'fire-safety': { en: 'Fire Safety', ar: 'السلامة من الحرائق' },
      publishing: { en: 'Publishing', ar: 'النشر' },
      'green-building': { en: 'Green Building', ar: 'المباني الخضراء' },
      'energy-efficiency': { en: 'Energy Efficiency', ar: 'كفاءة الطاقة' },
      'carbon-footprint': { en: 'Carbon Footprint', ar: 'البصمة الكربونية' },
      events: { en: 'Events', ar: 'الفعاليات' },
      marketing: { en: 'Marketing', ar: 'التسويق' },
      finance: { en: 'Finance', ar: 'المالية' },
      'customer-service': { en: 'Customer Service', ar: 'خدمة العملاء' },
      training: { en: 'Training', ar: 'التدريب' },
    };
    return moduleNames[module]?.[language === 'ar' ? 'ar' : 'en'] || module;
  };

  // Get action display name
  const getActionDisplayName = (action: string): string => {
    const actionNames: Record<string, { en: string; ar: string }> = {
      create: { en: 'Create', ar: 'إنشاء' },
      read: { en: 'Read', ar: 'قراءة' },
      update: { en: 'Update', ar: 'تعديل' },
      delete: { en: 'Delete', ar: 'حذف' },
      approve: { en: 'Approve', ar: 'موافقة' },
      assign: { en: 'Assign', ar: 'تعيين' },
      'update-status': { en: 'Update Status', ar: 'تحديث الحالة' },
      'read-all': { en: 'Read All', ar: 'قراءة الكل' },
      generate: { en: 'Generate', ar: 'إنشاء' },
      export: { en: 'Export', ar: 'تصدير' },
    };
    return actionNames[action]?.[language === 'ar' ? 'ar' : 'en'] || action;
  };

  const renderSettingInput = (setting: SystemSetting) => {
    if (editingKey !== setting.key) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-white/80 truncate max-w-xs">
            {setting.type === 'BOOLEAN'
              ? (setting.value === 'true' ? (isRTL ? 'نعم' : 'Yes') : (isRTL ? 'لا' : 'No'))
              : setting.value}
          </span>
          <button
            onClick={() => handleEditSetting(setting)}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        </div>
      );
    }

    // Editing mode
    if (setting.type === 'BOOLEAN' || setting.inputType === 'toggle') {
      return (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditValue(editValue === 'true' ? 'false' : 'true')}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              editValue === 'true'
                ? 'bg-gradient-to-r from-[#a0592b] to-[#f26522]'
                : 'bg-white/20'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                editValue === 'true'
                  ? isRTL ? 'left-0.5' : 'right-0.5'
                  : isRTL ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleSaveSetting(setting.key)}
              disabled={saving}
              className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRTL ? 'حفظ' : 'Save')}
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 text-sm"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <input
          type={setting.inputType === 'number' ? 'number' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="glass-input py-1.5 px-3 text-sm w-48"
          dir={setting.inputType === 'number' ? 'ltr' : undefined}
        />
        <button
          onClick={() => handleSaveSetting(setting.key)}
          disabled={saving}
          className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRTL ? 'حفظ' : 'Save')}
        </button>
        <button
          onClick={handleCancelEdit}
          className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 text-sm"
        >
          {isRTL ? 'إلغاء' : 'Cancel'}
        </button>
      </div>
    );
  };

  // Filtered roles
  const filteredRoles = roles.filter((role) => {
    if (!searchQuery) return true;
    return (
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Filtered permissions
  const filteredPermissionsByModule = Object.entries(permissionsByModule).reduce((acc, [module, perms]) => {
    if (!searchQuery) {
      acc[module] = perms;
      return acc;
    }
    const filtered = perms.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.action.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[module] = filtered;
    }
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b] to-[#f26522]">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('settingsPage.title')}</h1>
          <p className="text-sm text-white/60">{t('settingsPage.subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-card p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery('');
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#a0592b] to-[#f26522] text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="glass-card p-6">
              <h2 className="mb-6 text-lg font-semibold text-white">{t('settingsPage.notificationSettings')}</h2>

              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: t('settingsPage.emailNotifications'), desc: t('settingsPage.emailNotificationsDesc') },
                  { key: 'requestUpdates', label: t('settingsPage.requestUpdates'), desc: t('settingsPage.requestUpdatesDesc') },
                  { key: 'invoiceReminders', label: t('settingsPage.invoiceReminders'), desc: t('settingsPage.invoiceRemindersDesc') },
                  { key: 'marketingEmails', label: t('settingsPage.marketingEmails'), desc: t('settingsPage.marketingEmailsDesc') },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-lg bg-white/5 p-4"
                  >
                    <div>
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="text-sm text-white/60">{item.desc}</p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications({
                          ...notifications,
                          [item.key]: !notifications[item.key as keyof typeof notifications],
                        })
                      }
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        notifications[item.key as keyof typeof notifications]
                          ? 'bg-gradient-to-r from-[#a0592b] to-[#f26522]'
                          : 'bg-white/20'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                          notifications[item.key as keyof typeof notifications]
                            ? isRTL ? 'left-0.5' : 'right-0.5'
                            : isRTL ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="glass-button flex items-center gap-2 bg-gradient-to-r from-[#a0592b] to-[#f26522] px-6 py-2.5 text-white disabled:opacity-50"
                >
                  <Save className="h-5 w-5" />
                  <span>{saving ? t('common.loading') : t('common.save')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Language */}
              <div className="glass-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <Globe className="h-5 w-5" />
                  {t('settings.language')}
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`flex items-center justify-between rounded-lg border-2 p-4 transition-colors ${
                      language === 'en'
                        ? 'border-[#f26522] bg-[#f26522]/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇺🇸</span>
                      <span className="font-medium text-white">English</span>
                    </div>
                    {language === 'en' && <Check className="h-5 w-5 text-[#f26522]" />}
                  </button>

                  <button
                    onClick={() => setLanguage('ar')}
                    className={`flex items-center justify-between rounded-lg border-2 p-4 transition-colors ${
                      language === 'ar'
                        ? 'border-[#f26522] bg-[#f26522]/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇸🇦</span>
                      <span className="font-medium text-white">العربية</span>
                    </div>
                    {language === 'ar' && <Check className="h-5 w-5 text-[#f26522]" />}
                  </button>
                </div>
              </div>

              {/* Theme */}
              <div className="glass-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <Palette className="h-5 w-5" />
                  {t('settings.theme')}
                </h2>

                <div className="grid gap-4 sm:grid-cols-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                      theme === 'light'
                        ? 'border-[#f26522] bg-[#f26522]/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Sun className={`h-8 w-8 ${theme === 'light' ? 'text-[#f26522]' : 'text-white/60'}`} />
                    <span className="font-medium text-white">{t('settings.lightMode')}</span>
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                      theme === 'dark'
                        ? 'border-[#f26522] bg-[#f26522]/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Moon className={`h-8 w-8 ${theme === 'dark' ? 'text-[#f26522]' : 'text-white/60'}`} />
                    <span className="font-medium text-white">{t('settings.darkMode')}</span>
                  </button>

                  <button
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                      theme === 'system'
                        ? 'border-[#f26522] bg-[#f26522]/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Monitor className={`h-8 w-8 ${theme === 'system' ? 'text-[#f26522]' : 'text-white/60'}`} />
                    <span className="font-medium text-white">{t('settings.systemMode')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* System Settings Tab (Admin Only) */}
          {activeTab === 'system' && isAdmin && (
            <div className="space-y-6">
              {/* Search and Refresh */}
              <div className="glass-card p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 ${isRTL ? 'right-3' : 'left-3'}`} />
                    <input
                      type="text"
                      placeholder={isRTL ? 'بحث في الإعدادات...' : 'Search settings...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`glass-input w-full ${isRTL ? 'pr-10' : 'pl-10'}`}
                    />
                  </div>
                  <button
                    onClick={fetchSystemSettings}
                    disabled={loadingSettings}
                    className="glass-button flex items-center gap-2 px-4 py-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingSettings ? 'animate-spin' : ''}`} />
                    <span>{isRTL ? 'تحديث' : 'Refresh'}</span>
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {loadingSettings && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-[#f26522]" />
                </div>
              )}

              {/* Settings by Category */}
              {!loadingSettings && groupedSettings().map((category) => (
                <div key={category.key} className="glass-card overflow-hidden">
                  <div className="bg-white/5 px-6 py-4 border-b border-white/10">
                    <h3 className="font-semibold text-white">
                      {isRTL ? category.labelAr : category.label}
                    </h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {category.settings.map((setting) => (
                      <div key={setting.key} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white">
                            {isRTL ? setting.labelAr : setting.label}
                          </p>
                          <p className="text-sm text-white/50 truncate">
                            {setting.key}
                          </p>
                          {(setting.description || setting.descriptionAr) && (
                            <p className="text-xs text-white/40 mt-1">
                              {isRTL ? setting.descriptionAr : setting.description}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {renderSettingInput(setting)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {!loadingSettings && groupedSettings().length === 0 && (
                <div className="glass-card p-12 text-center">
                  <Cog className="h-16 w-16 mx-auto text-white/20" />
                  <p className="mt-4 text-white/60">
                    {searchQuery
                      ? (isRTL ? 'لا توجد إعدادات مطابقة' : 'No matching settings found')
                      : (isRTL ? 'لا توجد إعدادات' : 'No settings found')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Roles Tab (Admin Only) */}
          {activeTab === 'roles' && isAdmin && (
            <div className="space-y-6">
              {/* Header with Add Button */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 ${isRTL ? 'right-3' : 'left-3'}`} />
                  <input
                    type="text"
                    placeholder={isRTL ? 'بحث في الأدوار...' : 'Search roles...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`glass-input w-full ${isRTL ? 'pr-10' : 'pl-10'}`}
                  />
                </div>
                <button
                  onClick={() => {
                    setSelectedRole(null);
                    setShowRoleModal(true);
                  }}
                  className="glass-button flex items-center gap-2 bg-gradient-to-r from-[#a0592b] to-[#f26522] px-4 py-2.5 text-white"
                >
                  <Plus className="h-5 w-5" />
                  <span>{isRTL ? 'إضافة دور' : 'Add Role'}</span>
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-4 text-center">
                  <Shield className="h-8 w-8 mx-auto text-blue-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{roles.length}</p>
                  <p className="text-sm text-white/60">{isRTL ? 'إجمالي الأدوار' : 'Total Roles'}</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <Crown className="h-8 w-8 mx-auto text-amber-400 mb-2" />
                  <p className="text-2xl font-bold text-amber-400">{roles.filter(r => r.isAdmin).length}</p>
                  <p className="text-sm text-white/60">{isRTL ? 'أدوار المسؤول' : 'Admin Roles'}</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <Users className="h-8 w-8 mx-auto text-emerald-400 mb-2" />
                  <p className="text-2xl font-bold text-emerald-400">{roles.filter(r => !r.isAdmin).length}</p>
                  <p className="text-sm text-white/60">{isRTL ? 'أدوار عادية' : 'Regular Roles'}</p>
                </div>
              </div>

              {/* Loading State */}
              {loadingRoles && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-[#f26522]" />
                </div>
              )}

              {/* Roles List */}
              {!loadingRoles && (
                <div className="glass-card overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className={`p-4 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                          {isRTL ? 'اسم الدور' : 'Role Name'}
                        </th>
                        <th className={`p-4 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                          {isRTL ? 'الوصف' : 'Description'}
                        </th>
                        <th className={`p-4 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                          {isRTL ? 'الصلاحيات' : 'Permissions'}
                        </th>
                        <th className={`p-4 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                          {isRTL ? 'النوع' : 'Type'}
                        </th>
                        <th className={`p-4 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                          {isRTL ? 'الإجراءات' : 'Actions'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoles.map((role) => (
                        <tr key={role.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${role.isAdmin ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}>
                                {role.isAdmin ? <Crown className="h-5 w-5 text-amber-400" /> : <Shield className="h-5 w-5 text-blue-400" />}
                              </div>
                              <span className="font-medium text-white">{role.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-white/70">{role.description || '-'}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Key className="h-4 w-4 text-white/40" />
                              <span className="text-white/80">
                                {role.isAdmin
                                  ? (isRTL ? 'جميع الصلاحيات' : 'All permissions')
                                  : `${role.permissions?.length || 0}`}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            {role.isAdmin ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                                <Crown className="h-3 w-3" />
                                {isRTL ? 'مسؤول' : 'Admin'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                                <Users className="h-3 w-3" />
                                {isRTL ? 'عادي' : 'Regular'}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedRole(role);
                                  setShowViewModal(true);
                                }}
                                className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRole(role);
                                  setShowRoleModal(true);
                                }}
                                className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (role.isAdmin) {
                                    toast.error(isRTL ? 'لا يمكن حذف دور المسؤول' : 'Cannot delete admin role');
                                    return;
                                  }
                                  setSelectedRole(role);
                                  setShowDeleteModal(true);
                                }}
                                disabled={role.isAdmin}
                                className={`rounded-lg p-2 ${role.isAdmin ? 'cursor-not-allowed text-white/20' : 'text-white/60 hover:bg-red-500/20 hover:text-red-400'}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredRoles.length === 0 && (
                    <div className="p-12 text-center">
                      <Shield className="h-16 w-16 mx-auto text-white/20" />
                      <p className="mt-4 text-white/60">{isRTL ? 'لا توجد أدوار' : 'No roles found'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Permissions Tab (Admin Only) */}
          {activeTab === 'permissions' && isAdmin && (
            <div className="space-y-6">
              {/* Search */}
              <div className="glass-card p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 ${isRTL ? 'right-3' : 'left-3'}`} />
                    <input
                      type="text"
                      placeholder={isRTL ? 'بحث في الصلاحيات...' : 'Search permissions...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`glass-input w-full ${isRTL ? 'pr-10' : 'pl-10'}`}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <Key className="h-5 w-5" />
                    <span>{permissions.length} {isRTL ? 'صلاحية' : 'permissions'}</span>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loadingPermissions && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-[#f26522]" />
                </div>
              )}

              {/* Permissions by Module */}
              {!loadingPermissions && Object.entries(filteredPermissionsByModule).map(([module, modulePermissions]) => (
                <div key={module} className="glass-card overflow-hidden">
                  <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Key className="h-5 w-5 text-[#f26522]" />
                      {getModuleDisplayName(module)}
                    </h3>
                    <span className="text-sm text-white/40">{modulePermissions.length} {isRTL ? 'صلاحية' : 'permissions'}</span>
                  </div>
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {modulePermissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f26522]/20">
                          <Check className="h-4 w-4 text-[#f26522]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">
                            {getActionDisplayName(permission.action)}
                          </p>
                          <p className="text-xs text-white/40 truncate">{permission.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {!loadingPermissions && Object.keys(filteredPermissionsByModule).length === 0 && (
                <div className="glass-card p-12 text-center">
                  <Key className="h-16 w-16 mx-auto text-white/20" />
                  <p className="mt-4 text-white/60">
                    {searchQuery
                      ? (isRTL ? 'لا توجد صلاحيات مطابقة' : 'No matching permissions found')
                      : (isRTL ? 'لا توجد صلاحيات' : 'No permissions found')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Role Modal */}
      <RoleModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedRole(null);
        }}
        role={selectedRole}
        onSuccess={() => {
          fetchRoles();
          setShowRoleModal(false);
          setSelectedRole(null);
        }}
      />

      {/* View Role Modal */}
      <Modal
        isOpen={showViewModal && !!selectedRole}
        onClose={() => {
          setShowViewModal(false);
          setSelectedRole(null);
        }}
        title={isRTL ? 'تفاصيل الدور' : 'Role Details'}
        icon={Shield}
        size="2xl"
        footer={
          <ModalFooter
            onCancel={() => {
              setShowViewModal(false);
              setSelectedRole(null);
            }}
            cancelText={isRTL ? 'إغلاق' : 'Close'}
            onConfirm={() => {
              setShowViewModal(false);
              setShowRoleModal(true);
            }}
            confirmText={isRTL ? 'تعديل' : 'Edit'}
          />
        }
      >
        {selectedRole && (
          <div className="space-y-6">
            {/* Role Info */}
            <div className="flex items-center gap-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${selectedRole.isAdmin ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}>
                {selectedRole.isAdmin ? <Crown className="h-8 w-8 text-amber-400" /> : <Shield className="h-8 w-8 text-blue-400" />}
              </div>
              <div>
                <p className="text-lg font-medium text-white">{selectedRole.name}</p>
                <p className="text-sm text-white/60">{selectedRole.description || '-'}</p>
                {selectedRole.isAdmin && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                    <Crown className="h-3 w-3" />
                    {isRTL ? 'دور المسؤول - جميع الصلاحيات' : 'Admin Role - All Permissions'}
                  </span>
                )}
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-medium text-white">
                <Key className="h-5 w-5 text-white/40" />
                {isRTL ? 'الصلاحيات' : 'Permissions'}
              </h3>

              {selectedRole.isAdmin ? (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-center">
                  <Lock className="mx-auto mb-2 h-8 w-8 text-amber-400" />
                  <p className="text-amber-400">
                    {isRTL ? 'دور المسؤول يملك جميع الصلاحيات تلقائياً' : 'Admin role has all permissions automatically'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
                    Object.entries(
                      selectedRole.permissions.reduce((acc, perm) => {
                        const module = perm.module || 'other';
                        if (!acc[module]) acc[module] = [];
                        acc[module].push(perm);
                        return acc;
                      }, {} as Record<string, Permission[]>)
                    ).map(([module, perms]) => (
                      <div key={module} className="rounded-lg bg-white/5 p-4">
                        <h4 className="mb-3 font-medium text-white">{getModuleDisplayName(module)}</h4>
                        <div className="flex flex-wrap gap-2">
                          {perms.map((perm) => (
                            <span key={perm.id} className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400">
                              <Check className="h-3 w-3" />
                              {getActionDisplayName(perm.action)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg bg-white/5 p-4 text-center text-white/60">
                      {isRTL ? 'لا توجد صلاحيات مخصصة لهذا الدور' : 'No permissions assigned to this role'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 rounded-lg bg-white/5 p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-white/40" />
                <span className="text-white/60">{isRTL ? 'الموظفين:' : 'Employees:'}</span>
                <span className="font-medium text-white">{selectedRole.employeesCount || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-white/40" />
                <span className="text-white/60">{isRTL ? 'الصلاحيات:' : 'Permissions:'}</span>
                <span className="font-medium text-white">
                  {selectedRole.isAdmin ? (isRTL ? 'الكل' : 'All') : selectedRole.permissions?.length || 0}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedRole(null);
        }}
        onConfirm={handleDeleteRole}
        title={isRTL ? 'تأكيد الحذف' : 'Confirm Delete'}
        message={
          <>
            {isRTL ? 'هل أنت متأكد من حذف هذا الدور؟' : 'Are you sure you want to delete this role?'}
            {selectedRole && (selectedRole.employeesCount || 0) > 0 && (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-sm text-amber-400">
                  {isRTL
                    ? `تحذير: هذا الدور مرتبط بـ ${selectedRole.employeesCount} موظف`
                    : `Warning: This role is assigned to ${selectedRole.employeesCount} employee(s)`}
                </p>
              </div>
            )}
          </>
        }
        itemName={selectedRole?.name}
      />
    </div>
  );
}
