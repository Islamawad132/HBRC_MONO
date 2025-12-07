import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { rolesService } from '../../services/roles.service';
import type { Role, Permission } from '../../types/interfaces';
import { toast } from 'sonner';
import { RoleModal, DeleteConfirmModal } from '../../components/modals';
import { Modal, ModalFooter } from '../../components/ui/Modal';
import {
  Shield,
  Search,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Users,
  Key,
  Crown,
  X,
  Check,
  Lock,
} from 'lucide-react';

export function RolesPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';

  // State
  const [roles, setRoles] = useState<Role[]>([]);
  const [_permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsByModule, setPermissionsByModule] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    admin: 0,
    regular: 0,
  });

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const rolesData = await rolesService.getAllRoles();
      setRoles(rolesData);

      // Calculate stats
      const adminCount = rolesData.filter((r) => r.isAdmin).length;
      setStats({
        total: rolesData.length,
        admin: adminCount,
        regular: rolesData.length - adminCount,
      });
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Fetch permissions
  const fetchPermissions = useCallback(async () => {
    try {
      const [perms, groupedPerms] = await Promise.all([
        rolesService.getAllPermissions(),
        rolesService.getPermissionsByModule(),
      ]);
      setPermissions(perms);
      setPermissionsByModule(groupedPerms);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  // Filtered roles
  const filteredRoles = roles.filter((role) => {
    if (!searchQuery) return true;
    return (
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Handlers
  const handleView = (role: Role) => {
    setSelectedRole(role);
    setShowViewModal(true);
  };

  const handleDeleteClick = (role: Role) => {
    if (role.isAdmin) {
      toast.error(language === 'ar' ? 'لا يمكن حذف دور المسؤول' : 'Cannot delete admin role');
      return;
    }
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    try {
      await rolesService.deleteRole(selectedRole.id);
      toast.success(t('roles.deleteSuccess'));
      setShowDeleteModal(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (error) {
      console.error('Failed to delete role:', error);
      toast.error(t('common.error'));
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
  };

  // Get role's permission IDs
  const getRolePermissionIds = (role: Role): string[] => {
    return role.permissions?.map((p) => p.id) || [];
  };

  // Check if role has permission
  const hasPermission = (role: Role, permissionId: string): boolean => {
    if (role.isAdmin) return true;
    return getRolePermissionIds(role).includes(permissionId);
  };

  // Get module display name
  const getModuleDisplayName = (module: string): string => {
    const moduleNames: Record<string, { en: string; ar: string }> = {
      users: { en: 'Users', ar: 'المستخدمين' },
      customers: { en: 'Customers', ar: 'العملاء' },
      employees: { en: 'Employees', ar: 'الموظفين' },
      roles: { en: 'Roles', ar: 'الأدوار' },
      services: { en: 'Services', ar: 'الخدمات' },
      requests: { en: 'Requests', ar: 'الطلبات' },
      invoices: { en: 'Invoices', ar: 'الفواتير' },
      payments: { en: 'Payments', ar: 'المدفوعات' },
      documents: { en: 'Documents', ar: 'المستندات' },
      reports: { en: 'Reports', ar: 'التقارير' },
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
    };
    return actionNames[action]?.[language === 'ar' ? 'ar' : 'en'] || action;
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b] to-[#f26522]">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('roles.title')}</h1>
            <p className="text-sm text-white/60">{t('roles.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedRole(null);
            setShowRoleModal(true);
          }}
          className="glass-button flex items-center justify-center gap-2 bg-gradient-to-r from-[#a0592b] to-[#f26522] px-4 py-2.5 text-white hover:opacity-90"
        >
          <Plus className="h-5 w-5" />
          <span>{t('roles.addRole')}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('roles.totalRoles')}</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('roles.adminRoles')}</p>
              <p className="text-2xl font-bold text-amber-400">{stats.admin}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
              <Crown className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('roles.regularRoles')}</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.regular}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
              <Users className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-white/40 ${isRTL ? 'right-3' : 'left-3'}`}
            />
            <input
              type="text"
              placeholder={t('roles.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`glass-input w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
            />
          </div>

          {/* Clear Filters */}
          {searchQuery && (
            <button onClick={clearFilters} className="glass-button flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white">
              <X className="h-4 w-4" />
              <span>{t('roles.clearFilters')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-card flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#f26522]" />
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
          <Shield className="mb-4 h-16 w-16 text-white/20" />
          <h3 className="text-lg font-medium text-white">{t('roles.noRoles')}</h3>
          <p className="mt-1 text-sm text-white/60">{t('roles.noRolesDescription')}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="glass-card hidden overflow-hidden lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={`p-4 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                    {t('roles.roleName')}
                  </th>
                  <th className={`p-4 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                    {t('roles.description')}
                  </th>
                  <th className={`p-4 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                    {t('roles.permissions')}
                  </th>
                  <th className={`p-4 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                    {t('roles.isAdmin')}
                  </th>
                  <th className={`p-4 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                    {t('roles.users')}
                  </th>
                  <th className={`p-4 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                    {t('roles.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            role.isAdmin ? 'bg-amber-500/20' : 'bg-blue-500/20'
                          }`}
                        >
                          {role.isAdmin ? (
                            <Crown className="h-5 w-5 text-amber-400" />
                          ) : (
                            <Shield className="h-5 w-5 text-blue-400" />
                          )}
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
                            ? language === 'ar'
                              ? 'جميع الصلاحيات'
                              : 'All permissions'
                            : `${role.permissions?.length || 0} ${t('roles.permissionsCount')}`}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {role.isAdmin ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                          <Crown className="h-3 w-3" />
                          {language === 'ar' ? 'مسؤول' : 'Admin'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                          <Users className="h-3 w-3" />
                          {language === 'ar' ? 'عادي' : 'Regular'}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-white/40" />
                        <span className="text-white/80">{role.employeesCount || 0}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(role)}
                          className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                          title={t('common.viewDetails')}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRole(role);
                            setShowRoleModal(true);
                          }}
                          className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                          title={t('common.edit')}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(role)}
                          disabled={role.isAdmin}
                          className={`rounded-lg p-2 ${
                            role.isAdmin
                              ? 'cursor-not-allowed text-white/20'
                              : 'text-white/60 hover:bg-red-500/20 hover:text-red-400'
                          }`}
                          title={t('common.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-4 lg:hidden">
            {filteredRoles.map((role) => (
              <div key={role.id} className="glass-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        role.isAdmin ? 'bg-amber-500/20' : 'bg-blue-500/20'
                      }`}
                    >
                      {role.isAdmin ? (
                        <Crown className="h-6 w-6 text-amber-400" />
                      ) : (
                        <Shield className="h-6 w-6 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{role.name}</p>
                      <p className="text-sm text-white/60">{role.description || '-'}</p>
                    </div>
                  </div>
                  {role.isAdmin && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                      <Crown className="h-3 w-3" />
                      Admin
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Key className="h-4 w-4 text-white/40" />
                    <span>
                      {role.isAdmin
                        ? language === 'ar'
                          ? 'جميع الصلاحيات'
                          : 'All permissions'
                        : `${role.permissions?.length || 0} ${t('roles.permissionsCount')}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Users className="h-4 w-4 text-white/40" />
                    <span>
                      {role.employeesCount || 0} {t('roles.employeesCount')}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
                  <button
                    onClick={() => handleView(role)}
                    className="glass-button flex-1 py-2 text-sm text-white/70 hover:text-white"
                  >
                    <Eye className="mx-auto h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setShowRoleModal(true);
                    }}
                    className="glass-button flex-1 py-2 text-sm text-white/70 hover:text-white"
                  >
                    <Edit2 className="mx-auto h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(role)}
                    disabled={role.isAdmin}
                    className={`glass-button flex-1 py-2 text-sm ${
                      role.isAdmin ? 'cursor-not-allowed text-white/20' : 'text-red-400 hover:bg-red-500/20'
                    }`}
                  >
                    <Trash2 className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Results Count */}
          <div className="glass-card p-4">
            <p className="text-sm text-white/60">
              {t('roles.showing')} {filteredRoles.length} {t('roles.of')} {roles.length}
            </p>
          </div>
        </>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal && !!selectedRole}
        onClose={() => {
          setShowViewModal(false);
          setSelectedRole(null);
        }}
        title={t('roles.roleDetails')}
        icon={Shield}
        size="2xl"
        footer={
          <ModalFooter
            onCancel={() => {
              setShowViewModal(false);
              setSelectedRole(null);
            }}
            cancelText={t('common.close')}
            onConfirm={() => {
              setShowViewModal(false);
              setShowRoleModal(true);
            }}
            confirmText={t('common.edit')}
          />
        }
      >
        {selectedRole && (
          <div className="space-y-6">
            {/* Role Info */}
            <div className="flex items-center gap-4">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-xl ${
                  selectedRole.isAdmin ? 'bg-amber-500/20' : 'bg-blue-500/20'
                }`}
              >
                {selectedRole.isAdmin ? (
                  <Crown className="h-8 w-8 text-amber-400" />
                ) : (
                  <Shield className="h-8 w-8 text-blue-400" />
                )}
              </div>
              <div>
                <p className="text-lg font-medium text-white">{selectedRole.name}</p>
                <p className="text-sm text-white/60">{selectedRole.description || '-'}</p>
                {selectedRole.isAdmin && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                    <Crown className="h-3 w-3" />
                    {language === 'ar' ? 'دور المسؤول - جميع الصلاحيات' : 'Admin Role - All Permissions'}
                  </span>
                )}
              </div>
            </div>

            {/* Permissions Grid */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-medium text-white">
                <Key className="h-5 w-5 text-white/40" />
                {t('roles.permissions')}
              </h3>

              {selectedRole.isAdmin ? (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-center">
                  <Lock className="mx-auto mb-2 h-8 w-8 text-amber-400" />
                  <p className="text-amber-400">
                    {language === 'ar'
                      ? 'دور المسؤول يملك جميع الصلاحيات تلقائياً'
                      : 'Admin role has all permissions automatically'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                    <div key={module} className="rounded-lg bg-white/5 p-4">
                      <h4 className="mb-3 font-medium text-white">{getModuleDisplayName(module)}</h4>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {modulePermissions.map((permission) => {
                          const hasIt = hasPermission(selectedRole, permission.id);
                          return (
                            <div
                              key={permission.id}
                              className={`flex items-center gap-2 rounded-lg border p-2 ${
                                hasIt
                                  ? 'border-emerald-500/30 bg-emerald-500/10'
                                  : 'border-white/10 bg-white/5 opacity-50'
                              }`}
                            >
                              {hasIt ? (
                                <Check className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <X className="h-4 w-4 text-white/40" />
                              )}
                              <span className={`text-sm ${hasIt ? 'text-white' : 'text-white/60'}`}>
                                {getActionDisplayName(permission.action)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 rounded-lg bg-white/5 p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-white/40" />
                <span className="text-white/60">{t('roles.employeesCount')}:</span>
                <span className="font-medium text-white">{selectedRole.employeesCount || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-white/40" />
                <span className="text-white/60">{t('roles.permissionsCount')}:</span>
                <span className="font-medium text-white">
                  {selectedRole.isAdmin
                    ? language === 'ar'
                      ? 'الكل'
                      : 'All'
                    : selectedRole.permissions?.length || 0}
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
        onConfirm={handleDelete}
        title={t('roles.deleteConfirmTitle')}
        message={
          <>
            {t('roles.deleteConfirmMessage')}
            {selectedRole && (selectedRole.employeesCount || 0) > 0 && (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-sm text-amber-400">
                  {language === 'ar'
                    ? `تحذير: هذا الدور مرتبط بـ ${selectedRole.employeesCount} موظف`
                    : `Warning: This role is assigned to ${selectedRole.employeesCount} employee(s)`}
                </p>
              </div>
            )}
          </>
        }
        itemName={selectedRole?.name}
      />

      {/* Role Modal */}
      <RoleModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedRole(null);
        }}
        role={selectedRole}
        onSuccess={fetchRoles}
      />
    </div>
  );
}
