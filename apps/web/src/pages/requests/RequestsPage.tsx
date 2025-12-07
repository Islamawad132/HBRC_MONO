import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { toast } from 'sonner';
import { requestsService } from '../../services/requests.service';
import type { ServiceRequest, ServiceRequestFilters } from '../../types/interfaces';
import {
  RequestStatus,
  RequestPriority,
  RequestStatusLabels,
  RequestPriorityLabels,
  getLabel,
} from '../../types/enums';
import { RequestModal } from '../../components/modals';
import {
  ClipboardList,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Play,
  X,
  FileText,
  UserCheck,
} from 'lucide-react';

// Status colors
const statusColors: Record<RequestStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
  SUBMITTED: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  UNDER_REVIEW: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  APPROVED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  REJECTED: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  IN_PROGRESS: { bg: 'bg-[#d4a84b]/10', text: 'text-[#d4a84b]', border: 'border-[#d4a84b]/30' },
  COMPLETED: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  DELIVERED: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  CANCELLED: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
  ON_HOLD: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
};

// Priority colors
const priorityColors: Record<RequestPriority, { bg: string; text: string; border: string }> = {
  LOW: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
  MEDIUM: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  HIGH: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  URGENT: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
};

export function RequestsPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';

  // State
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<RequestPriority | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const limit = 10;

  // Fetch requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const filters: ServiceRequestFilters = {
        page,
        limit,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      };

      const response = await requestsService.getAll(filters);
      setRequests(response?.data || []);
      setTotalPages(response?.totalPages || 1);
      setTotal(response?.total || 0);
    } catch (error) {
      toast.error(t('common.error'));
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter, priorityFilter]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchRequests();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle actions
  const handleView = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const handleDelete = async () => {
    if (!selectedRequest) return;
    setActionLoading('delete');
    try {
      await requestsService.delete(selectedRequest.id);
      toast.success(t('requests.deleteSuccess'));
      setShowDeleteModal(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (request: ServiceRequest, action: string) => {
    setActionLoading(request.id);
    try {
      switch (action) {
        case 'approve':
          await requestsService.approve(request.id);
          toast.success(t('requests.approveSuccess'));
          break;
        case 'start':
          await requestsService.startProgress(request.id);
          toast.success(t('requests.startSuccess'));
          break;
        case 'complete':
          await requestsService.complete(request.id);
          toast.success(t('requests.completeSuccess'));
          break;
      }
      fetchRequests();
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

  // Format price
  const formatPrice = (amount?: number, currency = 'EGP') => {
    if (!amount) return '-';
    return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total,
      pending: requests.filter((r) => ['SUBMITTED', 'UNDER_REVIEW'].includes(r.status)).length,
      inProgress: requests.filter((r) => r.status === 'IN_PROGRESS').length,
      completed: requests.filter((r) => ['COMPLETED', 'DELIVERED'].includes(r.status)).length,
    };
  }, [requests, total]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b] to-[#f26522]">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            {t('requests.title')}
          </h1>
          <p className="mt-1 text-sm text-theme-muted">{t('requests.subtitle')}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchRequests}
            className="glass-button flex items-center gap-2 px-4 py-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </button>
          <button
            onClick={() => {
              setSelectedRequest(null);
              setShowRequestModal(true);
            }}
            className="btn-premium flex items-center gap-2 px-4 py-2"
          >
            <Plus className="h-4 w-4" />
            <span>{t('requests.addRequest')}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-muted">{t('requests.totalRequests')}</p>
              <p className="text-2xl font-bold text-theme-primary">{total}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b]/20 to-[#f26522]/20">
              <ClipboardList className="h-6 w-6 text-[#d4a84b]" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-muted">{t('requests.pendingRequests')}</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/20">
              <AlertCircle className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-muted">{t('requests.inProgressRequests')}</p>
              <p className="text-2xl font-bold text-[#d4a84b]">{stats.inProgress}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a84b]/20">
              <Play className="h-6 w-6 text-[#d4a84b]" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-muted">{t('requests.completedRequests')}</p>
              <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
              <CheckCircle2 className="h-6 w-6 text-green-400" />
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
              placeholder={t('requests.searchPlaceholder')}
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
            {(statusFilter || priorityFilter) && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d4a84b] text-xs text-white">
                {(statusFilter ? 1 : 0) + (priorityFilter ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-4 border-t border-theme-border pt-4">
            {/* Status Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-theme-muted">{t('requests.filterByStatus')}</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as RequestStatus | '');
                  setPage(1);
                }}
                className="glass-input min-w-[150px]"
              >
                <option value="">{t('common.all')}</option>
                {Object.values(RequestStatus).map((status) => (
                  <option key={status} value={status}>
                    {getLabel(RequestStatusLabels, status, isRTL ? 'ar' : 'en')}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-theme-muted">{t('requests.filterByPriority')}</label>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value as RequestPriority | '');
                  setPage(1);
                }}
                className="glass-input min-w-[150px]"
              >
                <option value="">{t('common.all')}</option>
                {Object.values(RequestPriority).map((priority) => (
                  <option key={priority} value={priority}>
                    {getLabel(RequestPriorityLabels, priority, isRTL ? 'ar' : 'en')}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(statusFilter || priorityFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setPriorityFilter('');
                  setPage(1);
                }}
                className="self-end text-sm text-[#d4a84b] hover:text-[#f26522] transition-colors"
              >
                {t('requests.clearFilters')}
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
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ClipboardList className="h-16 w-16 text-theme-muted opacity-50" />
            <p className="mt-4 text-lg font-medium text-theme-primary">{t('requests.noRequests')}</p>
            <p className="mt-1 text-sm text-theme-muted">{t('requests.noRequestsDescription')}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-theme-border bg-theme-bg-secondary/50">
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('requests.requestNumber')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('requests.customer')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('requests.service')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('requests.status')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('requests.priority')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('requests.date')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">
                      {t('requests.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border">
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="group transition-colors hover:bg-theme-bg-secondary/30"
                    >
                      {/* Request Number */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b]/20 to-[#f26522]/20">
                            <FileText className="h-5 w-5 text-[#d4a84b]" />
                          </div>
                          <div>
                            <p className="font-medium text-theme-primary">{request.requestNumber}</p>
                            <p className="text-xs text-theme-muted">
                              {isRTL ? request.titleAr : request.title}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-theme-muted" />
                          <span className="text-sm text-theme-secondary">
                            {request.customer?.name || '-'}
                          </span>
                        </div>
                      </td>

                      {/* Service */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-theme-secondary">
                          {request.service
                            ? isRTL
                              ? request.service.nameAr
                              : request.service.name
                            : '-'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                            statusColors[request.status].bg
                          } ${statusColors[request.status].text} ${
                            statusColors[request.status].border
                          }`}
                        >
                          {getLabel(RequestStatusLabels, request.status, isRTL ? 'ar' : 'en')}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                            priorityColors[request.priority].bg
                          } ${priorityColors[request.priority].text} ${
                            priorityColors[request.priority].border
                          }`}
                        >
                          {getLabel(RequestPriorityLabels, request.priority, isRTL ? 'ar' : 'en')}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-theme-muted">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">{formatDate(request.requestedDate)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleView(request)}
                            className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-theme-bg-secondary hover:text-theme-primary"
                            title={t('common.viewDetails')}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRequestModal(true);
                            }}
                            className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-theme-bg-secondary hover:text-[#d4a84b]"
                            title={t('common.edit')}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {request.status === 'SUBMITTED' && (
                            <button
                              onClick={() => handleStatusChange(request, 'approve')}
                              disabled={actionLoading === request.id}
                              className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-green-500/10 hover:text-green-400"
                              title={t('requests.approve')}
                            >
                              {actionLoading === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          {request.status === 'APPROVED' && (
                            <button
                              onClick={() => handleStatusChange(request, 'start')}
                              disabled={actionLoading === request.id}
                              className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-[#d4a84b]/10 hover:text-[#d4a84b]"
                              title={t('requests.startProgress')}
                            >
                              {actionLoading === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          {request.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleStatusChange(request, 'complete')}
                              disabled={actionLoading === request.id}
                              className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-green-500/10 hover:text-green-400"
                              title={t('requests.complete')}
                            >
                              {actionLoading === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
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
              {requests.map((request) => (
                <div key={request.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-theme-primary">{request.requestNumber}</p>
                      <p className="text-sm text-theme-muted">
                        {isRTL ? request.titleAr : request.title}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        statusColors[request.status].bg
                      } ${statusColors[request.status].text} ${statusColors[request.status].border}`}
                    >
                      {getLabel(RequestStatusLabels, request.status, isRTL ? 'ar' : 'en')}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1 text-theme-muted">
                      <User className="h-3 w-3" />
                      {request.customer?.name || '-'}
                    </span>
                    <span className="flex items-center gap-1 text-theme-muted">
                      <Calendar className="h-3 w-3" />
                      {formatDate(request.requestedDate)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        priorityColors[request.priority].bg
                      } ${priorityColors[request.priority].text} ${
                        priorityColors[request.priority].border
                      }`}
                    >
                      {getLabel(RequestPriorityLabels, request.priority, isRTL ? 'ar' : 'en')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-theme-border">
                    <span className="text-sm text-theme-muted">
                      {request.service
                        ? isRTL
                          ? request.service.nameAr
                          : request.service.name
                        : '-'}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleView(request)}
                        className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRequestModal(true);
                        }}
                        className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
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
                  {t('requests.showing')} {(page - 1) * limit + 1}-
                  {Math.min(page * limit, total)} {t('requests.of')} {total}
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
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-theme-border p-4">
              <h2 className="text-xl font-bold text-theme-primary">{t('requests.requestDetails')}</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedRequest(null);
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
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-theme-primary">{selectedRequest.requestNumber}</h3>
                  <p className="text-sm text-theme-muted">
                    {isRTL ? selectedRequest.titleAr : selectedRequest.title}
                  </p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium ${
                    statusColors[selectedRequest.status].bg
                  } ${statusColors[selectedRequest.status].text} ${
                    statusColors[selectedRequest.status].border
                  }`}
                >
                  {getLabel(RequestStatusLabels, selectedRequest.status, isRTL ? 'ar' : 'en')}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium ${
                    priorityColors[selectedRequest.priority].bg
                  } ${priorityColors[selectedRequest.priority].text} ${
                    priorityColors[selectedRequest.priority].border
                  }`}
                >
                  {getLabel(RequestPriorityLabels, selectedRequest.priority, isRTL ? 'ar' : 'en')}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('requests.customer')}</label>
                  <p className="text-theme-primary font-medium mt-1">
                    {selectedRequest.customer?.name || '-'}
                  </p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('requests.service')}</label>
                  <p className="text-theme-primary font-medium mt-1">
                    {selectedRequest.service
                      ? isRTL
                        ? selectedRequest.service.nameAr
                        : selectedRequest.service.name
                      : '-'}
                  </p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('requests.requestDate')}</label>
                  <p className="text-theme-primary font-medium mt-1">
                    {formatDate(selectedRequest.requestedDate)}
                  </p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('requests.expectedDate')}</label>
                  <p className="text-theme-primary font-medium mt-1">
                    {formatDate(selectedRequest.expectedDate)}
                  </p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('requests.estimatedPrice')}</label>
                  <p className="text-theme-primary font-medium mt-1">
                    {formatPrice(selectedRequest.estimatedPrice, selectedRequest.currency)}
                  </p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('requests.finalPrice')}</label>
                  <p className="text-theme-primary font-medium mt-1">
                    {formatPrice(selectedRequest.finalPrice, selectedRequest.currency)}
                  </p>
                </div>
                {selectedRequest.assignedTo && (
                  <div className="glass-card-dark p-4">
                    <label className="text-xs text-theme-muted">{t('requests.assignedTo')}</label>
                    <p className="text-theme-primary font-medium mt-1 flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-[#d4a84b]" />
                      {selectedRequest.assignedTo.firstName} {selectedRequest.assignedTo.lastName}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {(selectedRequest.description || selectedRequest.descriptionAr) && (
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('requests.description')}</label>
                  <p className="text-theme-primary mt-1">
                    {isRTL ? selectedRequest.descriptionAr : selectedRequest.description}
                  </p>
                </div>
              )}

              {/* Notes */}
              {(selectedRequest.notes || selectedRequest.notesAr) && (
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('requests.notes')}</label>
                  <p className="text-theme-primary mt-1">
                    {isRTL ? selectedRequest.notesAr : selectedRequest.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-theme-border p-4">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedRequest(null);
                }}
                className="glass-button px-4 py-2"
              >
                {t('common.close')}
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setShowRequestModal(true);
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
      {showDeleteModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md mx-4">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <Trash2 className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-theme-primary">{t('requests.deleteConfirmTitle')}</h3>
              <p className="mt-2 text-theme-muted">{t('requests.deleteConfirmMessage')}</p>
              <p className="mt-1 font-medium text-theme-primary">{selectedRequest.requestNumber}</p>
            </div>
            <div className="flex gap-3 border-t border-theme-border p-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRequest(null);
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

      {/* Request Modal (Create/Edit) */}
      <RequestModal
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onSuccess={fetchRequests}
      />
    </div>
  );
}
