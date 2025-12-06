import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { requestsService } from '../../services/requests.service';
import type { ServiceRequest } from '../../types/interfaces';
import { RequestStatus, RequestPriority, getLabel } from '../../types/enums';
import { toast } from 'sonner';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Tag,
  User,
  DollarSign,
} from 'lucide-react';

// Status colors
const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  APPROVED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IN_PROGRESS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
  REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

// Priority colors
const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  NORMAL: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  HIGH: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  URGENT: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function MyRequestsPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';

  // State
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  // Fetch my requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await requestsService.getMyRequests({
        page: currentPage,
        limit: 10,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      const data = response?.data || [];
      setRequests(data);
      setTotalCount(response?.total || 0);
      setTotalPages(response?.totalPages || 1);

      // Calculate stats
      if (currentPage === 1) {
        const pending = data.filter((r) => r.status === 'PENDING').length;
        const inProgress = data.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'APPROVED').length;
        const completed = data.filter((r) => r.status === 'COMPLETED').length;
        setStats({
          total: response?.total || 0,
          pending,
          inProgress,
          completed,
        });
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, t]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleView = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b] to-[#f26522]">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('myRequests.title')}</h1>
            <p className="text-sm text-white/60">{t('myRequests.subtitle')}</p>
          </div>
        </div>
        <button className="glass-button flex items-center justify-center gap-2 bg-gradient-to-r from-[#a0592b] to-[#f26522] px-4 py-2.5 text-white hover:opacity-90">
          <Plus className="h-5 w-5" />
          <span>{t('myRequests.newRequest')}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('myRequests.totalRequests')}</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('myRequests.pending')}</p>
              <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('myRequests.inProgress')}</p>
              <p className="text-2xl font-bold text-purple-400">{stats.inProgress}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
              <AlertCircle className="h-5 w-5 text-purple-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('myRequests.completed')}</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.completed}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-white/40 ${isRTL ? 'right-3' : 'left-3'}`}
            />
            <input
              type="text"
              placeholder={t('myRequests.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`glass-input w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
            />
          </div>

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
              <option value="">{t('myRequests.allStatuses')}</option>
              {Object.values(RequestStatus).map((status) => (
                <option key={status} value={status}>
                  {getLabel('RequestStatus', status, language)}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || statusFilter) && (
            <button onClick={clearFilters} className="glass-button flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white">
              <X className="h-4 w-4" />
              <span>{t('common.clearFilters')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-card flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#f26522]" />
        </div>
      ) : requests.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
          <FileText className="mb-4 h-16 w-16 text-white/20" />
          <h3 className="text-lg font-medium text-white">{t('myRequests.noRequests')}</h3>
          <p className="mt-1 text-sm text-white/60">{t('myRequests.noRequestsDescription')}</p>
          <button className="mt-4 glass-button bg-gradient-to-r from-[#a0592b] to-[#f26522] px-6 py-2 text-white">
            <Plus className="mr-2 inline h-4 w-4" />
            {t('myRequests.createFirst')}
          </button>
        </div>
      ) : (
        <>
          {/* Requests List */}
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="glass-card p-4 transition-colors hover:bg-white/5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b]/20 to-[#f26522]/20">
                      <FileText className="h-6 w-6 text-[#f26522]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">#{request.requestNumber}</h3>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[request.status]}`}
                        >
                          {getLabel('RequestStatus', request.status, language)}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${priorityColors[request.priority]}`}
                        >
                          {getLabel('RequestPriority', request.priority, language)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-white/80">
                        {language === 'ar' && request.service?.nameAr
                          ? request.service.nameAr
                          : request.service?.name}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/60">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(request.createdAt)}</span>
                        </div>
                        {request.estimatedPrice && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>{formatCurrency(request.estimatedPrice)}</span>
                          </div>
                        )}
                        {request.assignedEmployee && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{request.assignedEmployee.user.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleView(request)}
                    className="glass-button flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white"
                  >
                    <Eye className="h-4 w-4" />
                    <span>{t('common.viewDetails')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="glass-card flex items-center justify-between p-4">
              <p className="text-sm text-white/60">
                {t('myRequests.showing')} {(currentPage - 1) * 10 + 1}-
                {Math.min(currentPage * 10, totalCount)} {t('myRequests.of')} {totalCount}
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
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="glass-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{t('myRequests.requestDetails')}</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedRequest(null);
                }}
                className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b]/20 to-[#f26522]/20">
                  <FileText className="h-8 w-8 text-[#f26522]" />
                </div>
                <div>
                  <p className="text-lg font-medium text-white">#{selectedRequest.requestNumber}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[selectedRequest.status]}`}
                    >
                      {getLabel('RequestStatus', selectedRequest.status, language)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${priorityColors[selectedRequest.priority]}`}
                    >
                      {getLabel('RequestPriority', selectedRequest.priority, language)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 rounded-lg bg-white/5 p-4">
                <div>
                  <p className="text-xs text-white/40">{t('myRequests.service')}</p>
                  <p className="text-white">
                    {language === 'ar' && selectedRequest.service?.nameAr
                      ? selectedRequest.service.nameAr
                      : selectedRequest.service?.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/40">{t('myRequests.requestDate')}</p>
                  <p className="text-white">{formatDate(selectedRequest.createdAt)}</p>
                </div>
                {selectedRequest.expectedCompletionDate && (
                  <div>
                    <p className="text-xs text-white/40">{t('myRequests.expectedDate')}</p>
                    <p className="text-white">{formatDate(selectedRequest.expectedCompletionDate)}</p>
                  </div>
                )}
                {selectedRequest.estimatedPrice && (
                  <div>
                    <p className="text-xs text-white/40">{t('myRequests.estimatedPrice')}</p>
                    <p className="text-white">{formatCurrency(selectedRequest.estimatedPrice)}</p>
                  </div>
                )}
                {selectedRequest.finalPrice && (
                  <div>
                    <p className="text-xs text-white/40">{t('myRequests.finalPrice')}</p>
                    <p className="text-emerald-400 font-medium">{formatCurrency(selectedRequest.finalPrice)}</p>
                  </div>
                )}
                {selectedRequest.description && (
                  <div>
                    <p className="text-xs text-white/40">{t('myRequests.description')}</p>
                    <p className="text-white">{selectedRequest.description}</p>
                  </div>
                )}
                {selectedRequest.notes && (
                  <div>
                    <p className="text-xs text-white/40">{t('myRequests.notes')}</p>
                    <p className="text-white">{selectedRequest.notes}</p>
                  </div>
                )}
                {selectedRequest.assignedEmployee && (
                  <div>
                    <p className="text-xs text-white/40">{t('myRequests.assignedTo')}</p>
                    <p className="text-white">{selectedRequest.assignedEmployee.user.name}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedRequest(null);
                }}
                className="glass-button px-4 py-2 text-white/70 hover:text-white"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
