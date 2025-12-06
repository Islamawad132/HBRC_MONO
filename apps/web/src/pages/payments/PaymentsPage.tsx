import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { toast } from 'sonner';
import { paymentsService } from '../../services/payments.service';
import type { Payment, PaymentFilters } from '../../types/interfaces';
import {
  PaymentStatus,
  PaymentMethod,
  PaymentStatusLabels,
  PaymentMethodLabels,
  getLabel,
} from '../../types/enums';
import { PaymentModal } from '../../components/modals';
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  Eye,
  Trash2,
  User,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  FileText,
  X,
  CheckCircle2,
  Clock,
  Receipt,
} from 'lucide-react';

const statusColors: Record<PaymentStatus, { bg: string; text: string; border: string }> = {
  PENDING: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  PAID: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  PARTIALLY_PAID: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  FAILED: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  REFUNDED: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  CANCELLED: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
};

export function PaymentsPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const limit = 10;

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const filters: PaymentFilters = {
        page,
        limit,
        status: statusFilter || undefined,
        method: methodFilter || undefined,
      };
      const response = await paymentsService.getAll(filters);
      setPayments(response?.data || []);
      setTotalPages(response?.totalPages || 1);
      setTotal(response?.total || 0);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter, methodFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) fetchPayments();
      else setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleView = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowViewModal(true);
  };

  const handleDelete = async () => {
    if (!selectedPayment) return;
    setActionLoading('delete');
    try {
      await paymentsService.delete(selectedPayment.id);
      toast.success(t('payments.deleteSuccess'));
      setShowDeleteModal(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (amount?: number, currency = 'EGP') => {
    if (amount === undefined) return '-';
    return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = useMemo(() => {
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const paidAmount = payments.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + (p.amount || 0), 0);
    return { total, totalAmount, paidAmount };
  }, [payments, total]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b] to-[#f26522]">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            {t('payments.title')}
          </h1>
          <p className="mt-1 text-sm text-theme-muted">{t('payments.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPayments} className="glass-button flex items-center gap-2 px-4 py-2" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </button>
          <button
            onClick={() => {
              setSelectedPayment(null);
              setShowPaymentModal(true);
            }}
            className="btn-premium flex items-center gap-2 px-4 py-2"
          >
            <Plus className="h-4 w-4" />
            <span>{t('payments.addPayment')}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-muted">{t('payments.totalPayments')}</p>
              <p className="text-2xl font-bold text-theme-primary">{total}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b]/20 to-[#f26522]/20">
              <CreditCard className="h-6 w-6 text-[#d4a84b]" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-muted">{t('payments.totalAmount')}</p>
              <p className="text-2xl font-bold text-theme-primary">{formatPrice(stats.totalAmount)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
              <DollarSign className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-muted">{t('payments.paidPayments')}</p>
              <p className="text-2xl font-bold text-green-400">{formatPrice(stats.paidAmount)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
              <CheckCircle2 className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted ltr:left-3 rtl:right-3" />
            <input
              type="text"
              placeholder={t('payments.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full ltr:pl-10 rtl:pr-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`glass-button flex items-center gap-2 px-4 py-2 ${showFilters ? 'ring-2 ring-[#d4a84b]/50' : ''}`}
          >
            <Filter className="h-4 w-4" />
            <span>{t('common.filter')}</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-4 border-t border-theme-border pt-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-theme-muted">{t('payments.filterByStatus')}</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | '')} className="glass-input min-w-[150px]">
                <option value="">{t('common.all')}</option>
                {Object.values(PaymentStatus).map((status) => (
                  <option key={status} value={status}>{getLabel(PaymentStatusLabels, status, isRTL ? 'ar' : 'en')}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-theme-muted">{t('payments.filterByMethod')}</label>
              <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | '')} className="glass-input min-w-[150px]">
                <option value="">{t('common.all')}</option>
                {Object.values(PaymentMethod).map((method) => (
                  <option key={method} value={method}>{getLabel(PaymentMethodLabels, method, isRTL ? 'ar' : 'en')}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#d4a84b]" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CreditCard className="h-16 w-16 text-theme-muted opacity-50" />
            <p className="mt-4 text-lg font-medium text-theme-primary">{t('payments.noPayments')}</p>
            <p className="mt-1 text-sm text-theme-muted">{t('payments.noPaymentsDescription')}</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-theme-border bg-theme-bg-secondary/50">
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">{t('payments.paymentNumber')}</th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">{t('payments.customer')}</th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">{t('payments.amount')}</th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">{t('payments.method')}</th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">{t('payments.status')}</th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">{t('payments.date')}</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">{t('payments.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="group transition-colors hover:bg-theme-bg-secondary/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b]/20 to-[#f26522]/20">
                            <Receipt className="h-5 w-5 text-[#d4a84b]" />
                          </div>
                          <p className="font-medium text-theme-primary">{payment.paymentNumber}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-theme-muted" />
                          <span className="text-sm text-theme-secondary">{payment.customer?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-[#d4a84b]">{formatPrice(payment.amount, payment.currency)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-theme-secondary">{getLabel(PaymentMethodLabels, payment.method, isRTL ? 'ar' : 'en')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusColors[payment.status].bg} ${statusColors[payment.status].text} ${statusColors[payment.status].border}`}>
                          {getLabel(PaymentStatusLabels, payment.status, isRTL ? 'ar' : 'en')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-theme-muted">{formatDate(payment.paidAt || payment.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleView(payment)} className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary hover:text-theme-primary">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => { setSelectedPayment(payment); setShowDeleteModal(true); }} className="rounded-lg p-2 text-theme-muted hover:bg-red-500/10 hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="lg:hidden divide-y divide-theme-border">
              {payments.map((payment) => (
                <div key={payment.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-theme-primary">{payment.paymentNumber}</p>
                      <p className="text-sm text-theme-muted">{payment.customer?.name || '-'}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[payment.status].bg} ${statusColors[payment.status].text} ${statusColors[payment.status].border}`}>
                      {getLabel(PaymentStatusLabels, payment.status, isRTL ? 'ar' : 'en')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-theme-border">
                    <span className="font-medium text-[#d4a84b]">{formatPrice(payment.amount, payment.currency)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleView(payment)} className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-theme-border px-4 py-3">
                <p className="text-sm text-theme-muted">{t('payments.showing')} {(page - 1) * limit + 1}-{Math.min(page * limit, total)} {t('payments.of')} {total}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary disabled:opacity-50">
                    {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </button>
                  <span className="text-sm text-theme-primary">{page} / {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary disabled:opacity-50">
                    {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg mx-4">
            <div className="flex items-center justify-between border-b border-theme-border p-4">
              <h2 className="text-xl font-bold text-theme-primary">{t('payments.paymentDetails')}</h2>
              <button onClick={() => { setShowViewModal(false); setSelectedPayment(null); }} className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card-dark p-3">
                  <label className="text-xs text-theme-muted">{t('payments.paymentNumber')}</label>
                  <p className="text-theme-primary font-medium">{selectedPayment.paymentNumber}</p>
                </div>
                <div className="glass-card-dark p-3">
                  <label className="text-xs text-theme-muted">{t('payments.amount')}</label>
                  <p className="text-[#d4a84b] font-bold">{formatPrice(selectedPayment.amount, selectedPayment.currency)}</p>
                </div>
                <div className="glass-card-dark p-3">
                  <label className="text-xs text-theme-muted">{t('payments.method')}</label>
                  <p className="text-theme-primary font-medium">{getLabel(PaymentMethodLabels, selectedPayment.method, isRTL ? 'ar' : 'en')}</p>
                </div>
                <div className="glass-card-dark p-3">
                  <label className="text-xs text-theme-muted">{t('payments.status')}</label>
                  <p className="text-theme-primary font-medium">{getLabel(PaymentStatusLabels, selectedPayment.status, isRTL ? 'ar' : 'en')}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t border-theme-border p-4">
              <button onClick={() => { setShowViewModal(false); setSelectedPayment(null); }} className="glass-button px-4 py-2">{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md mx-4">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <Trash2 className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-theme-primary">{t('payments.deleteConfirmTitle')}</h3>
              <p className="mt-2 text-theme-muted">{t('payments.deleteConfirmMessage')}</p>
            </div>
            <div className="flex gap-3 border-t border-theme-border p-4">
              <button onClick={() => { setShowDeleteModal(false); setSelectedPayment(null); }} className="flex-1 glass-button py-2">{t('common.cancel')}</button>
              <button onClick={handleDelete} disabled={actionLoading === 'delete'} className="flex-1 rounded-xl bg-red-500 py-2 font-medium text-white hover:bg-red-600 disabled:opacity-50">
                {actionLoading === 'delete' ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
        onSuccess={fetchPayments}
      />
    </div>
  );
}
