import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { employeesService } from '../../services/employees.service';
import { rolesService } from '../../services/roles.service';
import type { Employee, Role, EmployeeFilters } from '../../types/interfaces';
import { AccountStatus, getLabel } from '../../types/enums';
import { toast } from 'sonner';
import { EmployeeModal } from '../../components/modals';
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  Building2,
  Shield,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Briefcase,
} from 'lucide-react';

// Status color mapping
const statusColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  INACTIVE: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  SUSPENDED: 'bg-red-500/20 text-red-400 border-red-500/30',
  PENDING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export function EmployeesPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';

  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const filters: EmployeeFilters = {
        page: currentPage,
        limit: 10,
      };

      if (searchQuery) filters.search = searchQuery;
      if (statusFilter) filters.status = statusFilter;
      if (departmentFilter) filters.department = departmentFilter;

      const response = await employeesService.getAll(filters);
      const data = response?.data || [];
      setEmployees(data);
      setTotalCount(response?.total || 0);
      setTotalPages(response?.totalPages || 1);

      // Calculate stats from first page or total
      if (currentPage === 1) {
        const activeCount = data.filter((e) => e.status === 'ACTIVE').length;
        const total = response?.total || 0;
        setStats({
          total,
          active: activeCount,
          inactive: total - activeCount,
        });
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, departmentFilter, t]);

  // Fetch roles for filtering
  const fetchRoles = useCallback(async () => {
    try {
      const rolesData = await rolesService.getAllRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handlers
  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  const handleDeleteClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    try {
      await employeesService.delete(selectedEmployee.id);
      toast.success(t('employees.deleteSuccess'));
      setShowDeleteModal(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error('Failed to delete employee:', error);
      toast.error(t('common.error'));
    }
  };

  const handleActivate = async (employee: Employee) => {
    try {
      await employeesService.activate(employee.id);
      toast.success(t('employees.activateSuccess'));
      fetchEmployees();
    } catch (error) {
      console.error('Failed to activate employee:', error);
      toast.error(t('common.error'));
    }
  };

  const handleSuspend = async (employee: Employee) => {
    try {
      await employeesService.suspend(employee.id);
      toast.success(t('employees.suspendSuccess'));
      fetchEmployees();
    } catch (error) {
      console.error('Failed to suspend employee:', error);
      toast.error(t('common.error'));
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDepartmentFilter('');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b] to-[#f26522]">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('employees.title')}</h1>
            <p className="text-sm text-white/60">{t('employees.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedEmployee(null);
            setShowEmployeeModal(true);
          }}
          className="glass-button flex items-center justify-center gap-2 bg-gradient-to-r from-[#a0592b] to-[#f26522] px-4 py-2.5 text-white hover:opacity-90"
        >
          <UserPlus className="h-5 w-5" />
          <span>{t('employees.addEmployee')}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('employees.totalEmployees')}</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('employees.activeEmployees')}</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('employees.inactiveEmployees')}</p>
              <p className="text-2xl font-bold text-gray-400">{stats.inactive}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-500/20">
              <XCircle className="h-6 w-6 text-gray-400" />
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
              placeholder={t('employees.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`glass-input w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-white/40" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="glass-input min-w-[150px]"
            >
              <option value="">{t('employees.filterByStatus')}</option>
              {Object.values(AccountStatus).map((status) => (
                <option key={status} value={status}>
                  {getLabel('AccountStatus', status, language)}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <input
              type="text"
              placeholder={t('employees.filterByDepartment')}
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="glass-input min-w-[150px]"
            />
          </div>

          {/* Clear Filters */}
          {(searchQuery || statusFilter || departmentFilter) && (
            <button onClick={clearFilters} className="glass-button flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white">
              <X className="h-4 w-4" />
              <span>{t('employees.clearFilters')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-card flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#f26522]" />
        </div>
      ) : employees.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
          <Users className="mb-4 h-16 w-16 text-white/20" />
          <h3 className="text-lg font-medium text-white">{t('employees.noEmployees')}</h3>
          <p className="mt-1 text-sm text-white/60">{t('employees.noEmployeesDescription')}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="glass-card hidden overflow-hidden lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={`p-4 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                    {t('employees.employee')}
                  </th>
                  <th className={`p-4 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                    {t('employees.contact')}
                  </th>
                  <th className={`p-4 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                    {t('employees.department')}
                  </th>
                  <th className={`p-4 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                    {t('employees.role')}
                  </th>
                  <th className={`p-4 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                    {t('employees.status')}
                  </th>
                  <th className={`p-4 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                    {t('employees.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#a0592b] to-[#f26522]">
                          <span className="text-sm font-bold text-white">
                            {employee.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{employee.user.name}</p>
                          <p className="text-sm text-white/60">{employee.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-white/80">
                          <Mail className="h-4 w-4 text-white/40" />
                          <span>{employee.user.email}</span>
                        </div>
                        {employee.user.phone && (
                          <div className="flex items-center gap-2 text-sm text-white/60">
                            <Phone className="h-4 w-4 text-white/40" />
                            <span>{employee.user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-white/40" />
                        <span className="text-white/80">{employee.department || '-'}</span>
                      </div>
                      {employee.position && (
                        <div className="mt-1 flex items-center gap-2 text-sm text-white/60">
                          <Briefcase className="h-3 w-3 text-white/40" />
                          <span>{employee.position}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {employee.role ? (
                        <div className="flex items-center gap-2">
                          <Shield className={`h-4 w-4 ${employee.role.isAdmin ? 'text-amber-400' : 'text-white/40'}`} />
                          <span className="text-white/80">{employee.role.name}</span>
                        </div>
                      ) : (
                        <span className="text-white/40">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[employee.status] || statusColors.INACTIVE}`}
                      >
                        {getLabel('AccountStatus', employee.status, language)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(employee)}
                          className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                          title={t('common.viewDetails')}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowEmployeeModal(true);
                          }}
                          className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                          title={t('common.edit')}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {employee.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleSuspend(employee)}
                            className="rounded-lg p-2 text-white/60 hover:bg-red-500/20 hover:text-red-400"
                            title={t('employees.suspend')}
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(employee)}
                            className="rounded-lg p-2 text-white/60 hover:bg-emerald-500/20 hover:text-emerald-400"
                            title={t('employees.activate')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(employee)}
                          className="rounded-lg p-2 text-white/60 hover:bg-red-500/20 hover:text-red-400"
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
            {employees.map((employee) => (
              <div key={employee.id} className="glass-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#a0592b] to-[#f26522]">
                      <span className="text-lg font-bold text-white">
                        {employee.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{employee.user.name}</p>
                      <p className="text-sm text-white/60">{employee.employeeId}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[employee.status] || statusColors.INACTIVE}`}
                  >
                    {getLabel('AccountStatus', employee.status, language)}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Mail className="h-4 w-4 text-white/40" />
                    <span>{employee.user.email}</span>
                  </div>
                  {employee.user.phone && (
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Phone className="h-4 w-4 text-white/40" />
                      <span>{employee.user.phone}</span>
                    </div>
                  )}
                  {employee.department && (
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Building2 className="h-4 w-4 text-white/40" />
                      <span>{employee.department}</span>
                    </div>
                  )}
                  {employee.role && (
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Shield className={`h-4 w-4 ${employee.role.isAdmin ? 'text-amber-400' : 'text-white/40'}`} />
                      <span>{employee.role.name}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
                  <button
                    onClick={() => handleView(employee)}
                    className="glass-button flex-1 py-2 text-sm text-white/70 hover:text-white"
                  >
                    <Eye className="mx-auto h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setShowEmployeeModal(true);
                    }}
                    className="glass-button flex-1 py-2 text-sm text-white/70 hover:text-white"
                  >
                    <Edit2 className="mx-auto h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(employee)}
                    className="glass-button flex-1 py-2 text-sm text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="glass-card flex items-center justify-between p-4">
              <p className="text-sm text-white/60">
                {t('employees.showing')} {(currentPage - 1) * 10 + 1}-
                {Math.min(currentPage * 10, totalCount)} {t('employees.of')} {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="glass-button p-2 disabled:opacity-50"
                >
                  {isRTL ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </button>
                <span className="px-4 text-sm text-white">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="glass-button p-2 disabled:opacity-50"
                >
                  {isRTL ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Modal */}
      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{t('employees.employeeDetails')}</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedEmployee(null);
                }}
                className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#a0592b] to-[#f26522]">
                  <span className="text-2xl font-bold text-white">
                    {selectedEmployee.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-medium text-white">{selectedEmployee.user.name}</p>
                  <p className="text-sm text-white/60">{selectedEmployee.employeeId}</p>
                  <span
                    className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[selectedEmployee.status]}`}
                  >
                    {getLabel('AccountStatus', selectedEmployee.status, language)}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 rounded-lg bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-white/40" />
                  <div>
                    <p className="text-xs text-white/40">{t('auth.email')}</p>
                    <p className="text-white">{selectedEmployee.user.email}</p>
                  </div>
                </div>
                {selectedEmployee.user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-white/40" />
                    <div>
                      <p className="text-xs text-white/40">{t('auth.phone')}</p>
                      <p className="text-white">{selectedEmployee.user.phone}</p>
                    </div>
                  </div>
                )}
                {selectedEmployee.department && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-white/40" />
                    <div>
                      <p className="text-xs text-white/40">{t('employees.department')}</p>
                      <p className="text-white">{selectedEmployee.department}</p>
                    </div>
                  </div>
                )}
                {selectedEmployee.position && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-white/40" />
                    <div>
                      <p className="text-xs text-white/40">{t('employees.position')}</p>
                      <p className="text-white">{selectedEmployee.position}</p>
                    </div>
                  </div>
                )}
                {selectedEmployee.role && (
                  <div className="flex items-center gap-3">
                    <Shield className={`h-5 w-5 ${selectedEmployee.role.isAdmin ? 'text-amber-400' : 'text-white/40'}`} />
                    <div>
                      <p className="text-xs text-white/40">{t('employees.role')}</p>
                      <p className="text-white">
                        {selectedEmployee.role.name}
                        {selectedEmployee.role.isAdmin && (
                          <span className="ml-2 text-xs text-amber-400">(Admin)</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                {selectedEmployee.institute && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-white/40" />
                    <div>
                      <p className="text-xs text-white/40">{t('employees.institute')}</p>
                      <p className="text-white">{selectedEmployee.institute}</p>
                    </div>
                  </div>
                )}
                {selectedEmployee.user.lastLoginAt && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-white/40" />
                    <div>
                      <p className="text-xs text-white/40">{t('employees.lastLogin')}</p>
                      <p className="text-white">{formatDate(selectedEmployee.user.lastLoginAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedEmployee(null);
                }}
                className="glass-button px-4 py-2 text-white/70 hover:text-white"
              >
                {t('common.close')}
              </button>
              <button className="glass-button bg-gradient-to-r from-[#a0592b] to-[#f26522] px-4 py-2 text-white">
                {t('common.edit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white">{t('employees.deleteConfirmTitle')}</h2>
            <p className="mt-2 text-white/60">{t('employees.deleteConfirmMessage')}</p>
            <p className="mt-2 font-medium text-white">{selectedEmployee.user.name}</p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedEmployee(null);
                }}
                className="glass-button px-4 py-2 text-white/70 hover:text-white"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="glass-button bg-red-500 px-4 py-2 text-white hover:bg-red-600"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      <EmployeeModal
        isOpen={showEmployeeModal}
        onClose={() => {
          setShowEmployeeModal(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        onSuccess={fetchEmployees}
      />
    </div>
  );
}
