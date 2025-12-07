import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { toast } from 'sonner';
import { customersService } from '../../services/customers.service';
import type { Customer, CustomerFilters } from '../../types/interfaces';
import {
  CustomerType,
  AccountStatus,
  CustomerTypeLabels,
  AccountStatusLabels,
  getLabel,
} from '../../types/enums';
import { CustomerModal } from '../../components/modals';
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Building2,
  User,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';

// Status badge colors
const statusColors: Record<AccountStatus, { bg: string; text: string; border: string }> = {
  ACTIVE: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  INACTIVE: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
  SUSPENDED: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  PENDING: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
};

// Customer type colors
const typeColors: Record<CustomerType, { bg: string; text: string; border: string }> = {
  INDIVIDUAL: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  CORPORATE: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  CONSULTANT: { bg: 'bg-[#d4a84b]/10', text: 'text-[#d4a84b]', border: 'border-[#d4a84b]/30' },
  SPONSOR: { bg: 'bg-[#f26522]/10', text: 'text-[#f26522]', border: 'border-[#f26522]/30' },
};

export function CustomersPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<CustomerType | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const limit = 10;

  // Fetch customers
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const filters: CustomerFilters = {
        page,
        limit,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        customerType: typeFilter || undefined,
      };

      const response = await customersService.getAll(filters);
      setCustomers(response?.data || []);
      setTotalPages(response?.totalPages || 1);
      setTotal(response?.total || 0);
    } catch (error) {
      toast.error(t('common.error'));
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, statusFilter, typeFilter]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchCustomers();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle actions
  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    setActionLoading('delete');
    try {
      await customersService.delete(selectedCustomer.id);
      toast.success(t('customers.deleteSuccess'));
      setShowDeleteModal(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (customer: Customer, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    setActionLoading(customer.id);
    try {
      if (newStatus === 'ACTIVE') {
        await customersService.activate(customer.id);
        toast.success(t('customers.activateSuccess'));
      } else {
        await customersService.suspend(customer.id);
        toast.success(t('customers.suspendSuccess'));
      }
      fetchCustomers();
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(null);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total,
      active: customers.filter((c) => c.status === 'ACTIVE').length,
      inactive: customers.filter((c) => c.status !== 'ACTIVE').length,
    };
  }, [customers, total]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b] to-[#f26522]">
              <Users className="h-5 w-5 text-white" />
            </div>
            {t('customers.title')}
          </h1>
          <p className="mt-1 text-sm text-theme-muted">{t('customers.subtitle')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-muted">{t('customers.totalCustomers')}</p>
              <p className="text-2xl font-bold text-theme-primary">{total}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b]/20 to-[#f26522]/20">
              <Users className="h-6 w-6 text-[#d4a84b]" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-muted">{t('customers.activeCustomers')}</p>
              <p className="text-2xl font-bold text-green-400">{stats.active}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
              <UserCheck className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-muted">{t('customers.inactiveCustomers')}</p>
              <p className="text-2xl font-bold text-red-400">{stats.inactive}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20">
              <UserX className="h-6 w-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted ltr:left-3 rtl:right-3" />
            <input
              type="text"
              placeholder={t('customers.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full ltr:pl-10 rtl:pr-10"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`glass-button flex items-center gap-2 px-4 py-2 ${
              showFilters ? 'ring-2 ring-[#d4a84b]/50' : ''
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>{t('common.filter')}</span>
            {(statusFilter || typeFilter) && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d4a84b] text-xs text-white">
                {(statusFilter ? 1 : 0) + (typeFilter ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-4 border-t border-theme-border pt-4">
            {/* Status Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-theme-muted">{t('customers.filterByStatus')}</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as AccountStatus | '');
                  setPage(1);
                }}
                className="glass-input min-w-[150px]"
              >
                <option value="">{t('common.all')}</option>
                {Object.values(AccountStatus).map((status) => (
                  <option key={status} value={status}>
                    {getLabel(AccountStatusLabels, status, isRTL ? 'ar' : 'en')}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-theme-muted">{t('customers.filterByType')}</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as CustomerType | '');
                  setPage(1);
                }}
                className="glass-input min-w-[150px]"
              >
                <option value="">{t('common.all')}</option>
                {Object.values(CustomerType).map((type) => (
                  <option key={type} value={type}>
                    {getLabel(CustomerTypeLabels, type, isRTL ? 'ar' : 'en')}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(statusFilter || typeFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setTypeFilter('');
                  setPage(1);
                }}
                className="self-end text-sm text-[#d4a84b] hover:text-[#f26522] transition-colors"
              >
                {t('customers.clearFilters')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#d4a84b]" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="h-16 w-16 text-theme-muted opacity-50" />
            <p className="mt-4 text-lg font-medium text-theme-primary">{t('customers.noCustomers')}</p>
            <p className="mt-1 text-sm text-theme-muted">{t('customers.noCustomersDescription')}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-theme-border bg-theme-bg-secondary/50">
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('customers.customer')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('customers.contact')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('customers.type')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('customers.status')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('customers.verified')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('customers.joinDate')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">
                      {t('customers.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="group transition-colors hover:bg-theme-bg-secondary/30"
                    >
                      {/* Customer Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a84b] to-[#f26522]">
                            <span className="text-sm font-bold text-white">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-theme-primary">{customer.name}</p>
                            {customer.companyName && (
                              <p className="text-xs text-theme-muted flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {customer.companyName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="text-sm text-theme-secondary flex items-center gap-1">
                            <Mail className="h-3 w-3 text-theme-muted" />
                            {customer.email}
                          </p>
                          <p className="text-sm text-theme-muted flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </p>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                            typeColors[customer.customerType].bg
                          } ${typeColors[customer.customerType].text} ${
                            typeColors[customer.customerType].border
                          }`}
                        >
                          {customer.customerType === 'INDIVIDUAL' && <User className="h-3 w-3" />}
                          {customer.customerType === 'CORPORATE' && <Building2 className="h-3 w-3" />}
                          {getLabel(CustomerTypeLabels, customer.customerType, isRTL ? 'ar' : 'en')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                            statusColors[customer.status].bg
                          } ${statusColors[customer.status].text} ${
                            statusColors[customer.status].border
                          }`}
                        >
                          {getLabel(AccountStatusLabels, customer.status, isRTL ? 'ar' : 'en')}
                        </span>
                      </td>

                      {/* Verified */}
                      <td className="px-4 py-3">
                        {customer.isVerified ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )}
                      </td>

                      {/* Join Date */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-theme-muted">{formatDate(customer.createdAt)}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleView(customer)}
                            className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-theme-bg-secondary hover:text-theme-primary"
                            title={t('common.viewDetails')}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowCustomerModal(true);
                            }}
                            className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-theme-bg-secondary hover:text-[#d4a84b]"
                            title={t('common.edit')}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {customer.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleStatusChange(customer, 'SUSPENDED')}
                              disabled={actionLoading === customer.id}
                              className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                              title={t('customers.suspend')}
                            >
                              {actionLoading === customer.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <UserX className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(customer, 'ACTIVE')}
                              disabled={actionLoading === customer.id}
                              className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-green-500/10 hover:text-green-400"
                              title={t('customers.activate')}
                            >
                              {actionLoading === customer.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowDeleteModal(true);
                            }}
                            className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
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
            <div className="lg:hidden divide-y divide-theme-border">
              {customers.map((customer) => (
                <div key={customer.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a84b] to-[#f26522]">
                        <span className="text-lg font-bold text-white">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-theme-primary">{customer.name}</p>
                        {customer.companyName && (
                          <p className="text-xs text-theme-muted">{customer.companyName}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                          statusColors[customer.status].bg
                        } ${statusColors[customer.status].text} ${
                          statusColors[customer.status].border
                        }`}
                      >
                        {getLabel(AccountStatusLabels, customer.status, isRTL ? 'ar' : 'en')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-theme-muted">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {customer.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-theme-border">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                          typeColors[customer.customerType].bg
                        } ${typeColors[customer.customerType].text} ${
                          typeColors[customer.customerType].border
                        }`}
                      >
                        {getLabel(CustomerTypeLabels, customer.customerType, isRTL ? 'ar' : 'en')}
                      </span>
                      {customer.isVerified ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleView(customer)}
                        className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowCustomerModal(true);
                        }}
                        className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowDeleteModal(true);
                        }}
                        className="rounded-lg p-2 text-theme-muted hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-theme-border px-4 py-3">
                <p className="text-sm text-theme-muted">
                  {t('customers.showing')} {(page - 1) * limit + 1}-
                  {Math.min(page * limit, total)} {t('customers.of')} {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-theme-bg-secondary disabled:opacity-50"
                  >
                    {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </button>
                  <span className="text-sm text-theme-primary">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-theme-bg-secondary disabled:opacity-50"
                  >
                    {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-theme-border p-4">
              <h2 className="text-xl font-bold text-theme-primary">{t('customers.customerDetails')}</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedCustomer(null);
                }}
                className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a84b] to-[#f26522]">
                  <span className="text-3xl font-bold text-white">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-theme-primary">{selectedCustomer.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                        typeColors[selectedCustomer.customerType].bg
                      } ${typeColors[selectedCustomer.customerType].text} ${
                        typeColors[selectedCustomer.customerType].border
                      }`}
                    >
                      {getLabel(CustomerTypeLabels, selectedCustomer.customerType, isRTL ? 'ar' : 'en')}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                        statusColors[selectedCustomer.status].bg
                      } ${statusColors[selectedCustomer.status].text} ${
                        statusColors[selectedCustomer.status].border
                      }`}
                    >
                      {getLabel(AccountStatusLabels, selectedCustomer.status, isRTL ? 'ar' : 'en')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('auth.email')}</label>
                  <p className="text-theme-primary font-medium">{selectedCustomer.email}</p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('auth.phone')}</label>
                  <p className="text-theme-primary font-medium">{selectedCustomer.phone}</p>
                </div>
                {selectedCustomer.companyName && (
                  <div className="glass-card-dark p-4">
                    <label className="text-xs text-theme-muted">{t('auth.companyName')}</label>
                    <p className="text-theme-primary font-medium">{selectedCustomer.companyName}</p>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="glass-card-dark p-4">
                    <label className="text-xs text-theme-muted">{t('customers.address')}</label>
                    <p className="text-theme-primary font-medium">{selectedCustomer.address}</p>
                  </div>
                )}
                {selectedCustomer.taxNumber && (
                  <div className="glass-card-dark p-4">
                    <label className="text-xs text-theme-muted">{t('customers.taxNumber')}</label>
                    <p className="text-theme-primary font-medium">{selectedCustomer.taxNumber}</p>
                  </div>
                )}
                {selectedCustomer.contactPerson && (
                  <div className="glass-card-dark p-4">
                    <label className="text-xs text-theme-muted">{t('customers.contactPerson')}</label>
                    <p className="text-theme-primary font-medium">{selectedCustomer.contactPerson}</p>
                  </div>
                )}
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('customers.verified')}</label>
                  <p className="text-theme-primary font-medium flex items-center gap-2">
                    {selectedCustomer.isVerified ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        {t('common.yes')}
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-400" />
                        {t('common.no')}
                      </>
                    )}
                  </p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('customers.joinDate')}</label>
                  <p className="text-theme-primary font-medium">{formatDate(selectedCustomer.createdAt)}</p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('customers.lastLogin')}</label>
                  <p className="text-theme-primary font-medium">{formatDate(selectedCustomer.lastLoginAt)}</p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('customers.loginCount')}</label>
                  <p className="text-theme-primary font-medium">{selectedCustomer.loginCount}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-theme-border p-4">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedCustomer(null);
                }}
                className="glass-button px-4 py-2"
              >
                {t('common.close')}
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setShowCustomerModal(true);
                }}
                className="btn-premium px-4 py-2 flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                {t('common.edit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md mx-4">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <Trash2 className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-theme-primary">{t('customers.deleteConfirmTitle')}</h3>
              <p className="mt-2 text-theme-muted">{t('customers.deleteConfirmMessage')}</p>
              <p className="mt-1 font-medium text-theme-primary">{selectedCustomer.name}</p>
            </div>
            <div className="flex gap-3 border-t border-theme-border p-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedCustomer(null);
                }}
                className="flex-1 glass-button py-2"
                disabled={actionLoading === 'delete'}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
                className="flex-1 rounded-xl bg-red-500 py-2 font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {actionLoading === 'delete' ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  t('common.delete')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Modal (Create/Edit) */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onSuccess={fetchCustomers}
      />
    </div>
  );
}
