import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { toast } from 'sonner';
import { servicesService } from '../../services/services.service';
import type { Service, ServiceFilters } from '../../types/interfaces';
import {
  ServiceCategory,
  ServiceStatus,
  PricingType,
  ServiceCategoryLabels,
  getLabel,
} from '../../types/enums';
import { ServiceModal } from '../../components/modals';
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Tag,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  X,
  Layers,
  TrendingUp,
} from 'lucide-react';

// Status colors
const statusColors: Record<ServiceStatus, { bg: string; text: string; border: string }> = {
  ACTIVE: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  INACTIVE: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
  ARCHIVED: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
};

// Category colors
const categoryColors: Record<ServiceCategory, { bg: string; text: string; border: string }> = {
  LAB_TESTS: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  CONSULTANCY: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  STATIONS_APPROVAL: { bg: 'bg-[#d4a84b]/10', text: 'text-[#d4a84b]', border: 'border-[#d4a84b]/30' },
  FIRE_SAFETY: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  GREEN_BUILDING: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  TRAINING: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  SOIL_TESTING: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  CONCRETE_TESTING: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
  STRUCTURAL_REVIEW: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  SEISMIC_ANALYSIS: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  THERMAL_INSULATION: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  ACOUSTIC_TESTING: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  OTHER: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
};

// Pricing type labels
const pricingTypeLabels = {
  FIXED: { en: 'Fixed Price', ar: 'سعر ثابت' },
  VARIABLE: { en: 'Variable', ar: 'متغير' },
  CUSTOM: { en: 'Custom Quote', ar: 'عرض سعر' },
};

export function ServicesPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';

  // State
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const limit = 10;

  // Fetch services
  const fetchServices = async () => {
    setLoading(true);
    try {
      const filters: ServiceFilters = {
        page,
        limit,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      };

      const response = await servicesService.getAll(filters);
      setServices(response?.data || []);
      setTotalPages(response?.totalPages || 1);
      setTotal(response?.total || 0);
    } catch (error) {
      toast.error(t('common.error'));
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [page, statusFilter, categoryFilter]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchServices();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle actions
  const handleView = (service: Service) => {
    setSelectedService(service);
    setShowViewModal(true);
  };

  const handleDelete = async () => {
    if (!selectedService) return;
    setActionLoading('delete');
    try {
      await servicesService.delete(selectedService.id);
      toast.success(t('services.deleteSuccess'));
      setShowDeleteModal(false);
      setSelectedService(null);
      fetchServices();
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (service: Service) => {
    setActionLoading(service.id);
    try {
      if (service.isActive) {
        await servicesService.deactivate(service.id);
        toast.success(t('services.deactivateSuccess'));
      } else {
        await servicesService.activate(service.id);
        toast.success(t('services.activateSuccess'));
      }
      fetchServices();
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(null);
    }
  };

  // Format price
  const formatPrice = (service: Service) => {
    const locale = isRTL ? 'ar-EG' : 'en-US';
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: service.currency || 'EGP',
      maximumFractionDigits: 0,
    });

    if (service.pricingType === 'FIXED' && service.basePrice) {
      return formatter.format(service.basePrice);
    } else if (service.pricingType === 'VARIABLE' && service.minPrice && service.maxPrice) {
      return `${formatter.format(service.minPrice)} - ${formatter.format(service.maxPrice)}`;
    }
    return pricingTypeLabels.CUSTOM[isRTL ? 'ar' : 'en'];
  };

  // Format duration
  const formatDuration = (days?: number) => {
    if (!days) return '-';
    if (days === 1) return isRTL ? 'يوم واحد' : '1 day';
    return isRTL ? `${days} أيام` : `${days} days`;
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total,
      active: services.filter((s) => s.isActive).length,
      inactive: services.filter((s) => !s.isActive).length,
    };
  }, [services, total]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b] to-[#f26522]">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            {t('services.title')}
          </h1>
          <p className="mt-1 text-sm text-theme-muted">{t('services.subtitle')}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchServices}
            className="glass-button flex items-center gap-2 px-4 py-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </button>
          <button
            onClick={() => {
              setSelectedService(null);
              setShowServiceModal(true);
            }}
            className="btn-premium flex items-center gap-2 px-4 py-2"
          >
            <Plus className="h-4 w-4" />
            <span>{t('services.addService')}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-muted">{t('services.totalServices')}</p>
              <p className="text-2xl font-bold text-theme-primary">{total}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b]/20 to-[#f26522]/20">
              <Layers className="h-6 w-6 text-[#d4a84b]" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-muted">{t('services.activeServices')}</p>
              <p className="text-2xl font-bold text-green-400">{stats.active}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-muted">{t('services.inactiveServices')}</p>
              <p className="text-2xl font-bold text-gray-400">{stats.inactive}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-500/20">
              <XCircle className="h-6 w-6 text-gray-400" />
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
              placeholder={t('services.searchPlaceholder')}
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
            {(statusFilter || categoryFilter) && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d4a84b] text-xs text-white">
                {(statusFilter ? 1 : 0) + (categoryFilter ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-4 border-t border-theme-border pt-4">
            {/* Status Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-theme-muted">{t('services.filterByStatus')}</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ServiceStatus | '');
                  setPage(1);
                }}
                className="glass-input min-w-[150px]"
              >
                <option value="">{t('common.all')}</option>
                <option value="ACTIVE">{isRTL ? 'نشط' : 'Active'}</option>
                <option value="INACTIVE">{isRTL ? 'غير نشط' : 'Inactive'}</option>
                <option value="ARCHIVED">{isRTL ? 'مؤرشف' : 'Archived'}</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-theme-muted">{t('services.filterByCategory')}</label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value as ServiceCategory | '');
                  setPage(1);
                }}
                className="glass-input min-w-[150px]"
              >
                <option value="">{t('common.all')}</option>
                {Object.values(ServiceCategory).map((category) => (
                  <option key={category} value={category}>
                    {getLabel(ServiceCategoryLabels, category, isRTL ? 'ar' : 'en')}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(statusFilter || categoryFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setCategoryFilter('');
                  setPage(1);
                }}
                className="self-end text-sm text-[#d4a84b] hover:text-[#f26522] transition-colors"
              >
                {t('services.clearFilters')}
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
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Briefcase className="h-16 w-16 text-theme-muted opacity-50" />
            <p className="mt-4 text-lg font-medium text-theme-primary">{t('services.noServices')}</p>
            <p className="mt-1 text-sm text-theme-muted">{t('services.noServicesDescription')}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-theme-border bg-theme-bg-secondary/50">
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('services.service')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('services.category')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('services.price')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('services.duration')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('services.orders')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('services.status')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">
                      {t('services.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border">
                  {services.map((service) => (
                    <tr
                      key={service.id}
                      className="group transition-colors hover:bg-theme-bg-secondary/30"
                    >
                      {/* Service Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b]/20 to-[#f26522]/20">
                            <Briefcase className="h-5 w-5 text-[#d4a84b]" />
                          </div>
                          <div>
                            <p className="font-medium text-theme-primary">
                              {isRTL ? service.nameAr : service.name}
                            </p>
                            <p className="text-xs text-theme-muted flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {service.code}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                            categoryColors[service.category].bg
                          } ${categoryColors[service.category].text} ${
                            categoryColors[service.category].border
                          }`}
                        >
                          {getLabel(ServiceCategoryLabels, service.category, isRTL ? 'ar' : 'en')}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-theme-primary">
                          <DollarSign className="h-4 w-4 text-[#d4a84b]" />
                          <span className="font-medium">{formatPrice(service)}</span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-theme-muted">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(service.duration)}</span>
                        </div>
                      </td>

                      {/* Orders */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-theme-muted">
                          <TrendingUp className="h-4 w-4" />
                          <span>{service.orderCount}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                              statusColors[service.status].bg
                            } ${statusColors[service.status].text} ${
                              statusColors[service.status].border
                            }`}
                          >
                            {service.status === 'ACTIVE'
                              ? isRTL
                                ? 'نشط'
                                : 'Active'
                              : service.status === 'INACTIVE'
                              ? isRTL
                                ? 'غير نشط'
                                : 'Inactive'
                              : isRTL
                              ? 'مؤرشف'
                              : 'Archived'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleView(service)}
                            className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-theme-bg-secondary hover:text-theme-primary"
                            title={t('common.viewDetails')}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedService(service);
                              setShowServiceModal(true);
                            }}
                            className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-theme-bg-secondary hover:text-[#d4a84b]"
                            title={t('common.edit')}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(service)}
                            disabled={actionLoading === service.id}
                            className={`rounded-lg p-2 text-theme-muted transition-colors ${
                              service.isActive
                                ? 'hover:bg-gray-500/10 hover:text-gray-400'
                                : 'hover:bg-green-500/10 hover:text-green-400'
                            }`}
                            title={service.isActive ? t('services.deactivate') : t('services.activate')}
                          >
                            {actionLoading === service.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : service.isActive ? (
                              <ToggleRight className="h-4 w-4" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedService(service);
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
              {services.map((service) => (
                <div key={service.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b]/20 to-[#f26522]/20">
                        <Briefcase className="h-6 w-6 text-[#d4a84b]" />
                      </div>
                      <div>
                        <p className="font-medium text-theme-primary">
                          {isRTL ? service.nameAr : service.name}
                        </p>
                        <p className="text-xs text-theme-muted">{service.code}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        statusColors[service.status].bg
                      } ${statusColors[service.status].text} ${statusColors[service.status].border}`}
                    >
                      {service.status === 'ACTIVE' ? (isRTL ? 'نشط' : 'Active') : isRTL ? 'غير نشط' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        categoryColors[service.category].bg
                      } ${categoryColors[service.category].text} ${categoryColors[service.category].border}`}
                    >
                      {getLabel(ServiceCategoryLabels, service.category, isRTL ? 'ar' : 'en')}
                    </span>
                    <span className="flex items-center gap-1 text-theme-muted">
                      <DollarSign className="h-3 w-3" />
                      {formatPrice(service)}
                    </span>
                    <span className="flex items-center gap-1 text-theme-muted">
                      <Clock className="h-3 w-3" />
                      {formatDuration(service.duration)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-theme-border">
                    <span className="flex items-center gap-1 text-sm text-theme-muted">
                      <TrendingUp className="h-4 w-4" />
                      {service.orderCount} {t('services.orders')}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleView(service)}
                        className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedService(service);
                          setShowServiceModal(true);
                        }}
                        className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedService(service);
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
                  {t('services.showing')} {(page - 1) * limit + 1}-
                  {Math.min(page * limit, total)} {t('services.of')} {total}
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
      {showViewModal && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-theme-border p-4">
              <h2 className="text-xl font-bold text-theme-primary">{t('services.serviceDetails')}</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedService(null);
                }}
                className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b] to-[#f26522]">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-theme-primary">
                    {isRTL ? selectedService.nameAr : selectedService.name}
                  </h3>
                  <p className="text-sm text-theme-muted">{selectedService.code}</p>
                </div>
              </div>

              {/* Description */}
              {(selectedService.description || selectedService.descriptionAr) && (
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('services.description')}</label>
                  <p className="text-theme-primary mt-1">
                    {isRTL ? selectedService.descriptionAr : selectedService.description}
                  </p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('services.category')}</label>
                  <p className="text-theme-primary font-medium mt-1">
                    {getLabel(ServiceCategoryLabels, selectedService.category, isRTL ? 'ar' : 'en')}
                  </p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('services.status')}</label>
                  <p className="text-theme-primary font-medium mt-1">
                    {selectedService.isActive ? (isRTL ? 'نشط' : 'Active') : isRTL ? 'غير نشط' : 'Inactive'}
                  </p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('services.pricingType')}</label>
                  <p className="text-theme-primary font-medium mt-1">
                    {pricingTypeLabels[selectedService.pricingType][isRTL ? 'ar' : 'en']}
                  </p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('services.price')}</label>
                  <p className="text-theme-primary font-medium mt-1">{formatPrice(selectedService)}</p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('services.duration')}</label>
                  <p className="text-theme-primary font-medium mt-1">
                    {formatDuration(selectedService.duration)}
                  </p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('services.totalOrders')}</label>
                  <p className="text-theme-primary font-medium mt-1">{selectedService.orderCount}</p>
                </div>
              </div>

              {/* Requirements */}
              {(selectedService.requirements || selectedService.requirementsAr) && (
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('services.requirements')}</label>
                  <p className="text-theme-primary mt-1 whitespace-pre-wrap">
                    {isRTL ? selectedService.requirementsAr : selectedService.requirements}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-theme-border p-4">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedService(null);
                }}
                className="glass-button px-4 py-2"
              >
                {t('common.close')}
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setShowServiceModal(true);
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
      {showDeleteModal && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md mx-4">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <Trash2 className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-theme-primary">{t('services.deleteConfirmTitle')}</h3>
              <p className="mt-2 text-theme-muted">{t('services.deleteConfirmMessage')}</p>
              <p className="mt-1 font-medium text-theme-primary">
                {isRTL ? selectedService.nameAr : selectedService.name}
              </p>
            </div>
            <div className="flex gap-3 border-t border-theme-border p-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedService(null);
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

      {/* Service Modal (Create/Edit) */}
      <ServiceModal
        isOpen={showServiceModal}
        onClose={() => {
          setShowServiceModal(false);
          setSelectedService(null);
        }}
        service={selectedService}
        onSuccess={fetchServices}
      />
    </div>
  );
}
