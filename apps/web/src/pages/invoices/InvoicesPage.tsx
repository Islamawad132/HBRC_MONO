import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { toast } from 'sonner';
import { invoicesService } from '../../services/invoices.service';
import type { Invoice, InvoiceFilters } from '../../types/interfaces';
import {
  InvoiceStatus,
  InvoiceStatusLabels,
  getLabel,
} from '../../types/enums';
import { InvoiceModal } from '../../components/modals';
import {
  Receipt,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  User,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Send,
  Download,
  FileText,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

// Status colors
const statusColors: Record<InvoiceStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
  ISSUED: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  SENT: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  PAID: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  OVERDUE: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  CANCELLED: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
};

export function InvoicesPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';

  // State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const limit = 10;

  // Fetch invoices
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const filters: InvoiceFilters = {
        page,
        limit,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      };

      const response = await invoicesService.getAll(filters);
      setInvoices(response?.data || []);
      setTotalPages(response?.totalPages || 1);
      setTotal(response?.total || 0);
    } catch (error) {
      toast.error(t('common.error'));
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, statusFilter]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchInvoices();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle actions
  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;
    setActionLoading('delete');
    try {
      await invoicesService.delete(selectedInvoice.id);
      toast.success(t('invoices.deleteSuccess'));
      setShowDeleteModal(false);
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleIssue = async (invoice: Invoice) => {
    setActionLoading(invoice.id);
    try {
      await invoicesService.issue(invoice.id);
      toast.success(t('invoices.issueSuccess'));
      fetchInvoices();
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSend = async (invoice: Invoice) => {
    setActionLoading(invoice.id);
    try {
      await invoicesService.send(invoice.id);
      toast.success(t('invoices.sendSuccess'));
      fetchInvoices();
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async (invoice: Invoice) => {
    setActionLoading(`download-${invoice.id}`);
    try {
      await invoicesService.downloadPdf(invoice.id, `invoice-${invoice.invoiceNumber}.pdf`);
      toast.success(t('invoices.downloadSuccess'));
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
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Stats
  const stats = useMemo(() => {
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const paidAmount = invoices.filter((i) => i.status === 'PAID').reduce((sum, inv) => sum + (inv.total || 0), 0);
    const pendingAmount = invoices.filter((i) => ['ISSUED', 'SENT'].includes(i.status)).reduce((sum, inv) => sum + (inv.total || 0), 0);
    return { total, totalAmount, paidAmount, pendingAmount };
  }, [invoices, total]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b] to-[#f26522]">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            {t('invoices.title')}
          </h1>
          <p className="mt-1 text-sm text-theme-muted">{t('invoices.subtitle')}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchInvoices}
            className="glass-button flex items-center gap-2 px-4 py-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </button>
          <button
            onClick={() => {
              setSelectedInvoice(null);
              setShowInvoiceModal(true);
            }}
            className="btn-premium flex items-center gap-2 px-4 py-2"
          >
            <Plus className="h-4 w-4" />
            <span>{t('invoices.addInvoice')}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-muted">{t('invoices.totalInvoices')}</p>
              <p className="text-2xl font-bold text-theme-primary">{total}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b]/20 to-[#f26522]/20">
              <Receipt className="h-6 w-6 text-[#d4a84b]" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-muted">{t('invoices.totalAmount')}</p>
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
              <p className="text-sm text-theme-muted">{t('invoices.paidAmount')}</p>
              <p className="text-2xl font-bold text-green-400">{formatPrice(stats.paidAmount)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
              <CheckCircle2 className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-muted">{t('invoices.pendingAmount')}</p>
              <p className="text-2xl font-bold text-yellow-400">{formatPrice(stats.pendingAmount)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/20">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted ltr:left-3 rtl:right-3" />
            <input
              type="text"
              placeholder={t('invoices.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full ltr:pl-10 rtl:pr-10"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`glass-button flex items-center gap-2 px-4 py-2 ${
              showFilters ? 'ring-2 ring-[#d4a84b]/50' : ''
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>{t('common.filter')}</span>
            {statusFilter && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d4a84b] text-xs text-white">
                1
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-4 border-t border-theme-border pt-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-theme-muted">{t('invoices.filterByStatus')}</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as InvoiceStatus | '');
                  setPage(1);
                }}
                className="glass-input min-w-[150px]"
              >
                <option value="">{t('common.all')}</option>
                {Object.values(InvoiceStatus).map((status) => (
                  <option key={status} value={status}>
                    {getLabel(InvoiceStatusLabels, status, isRTL ? 'ar' : 'en')}
                  </option>
                ))}
              </select>
            </div>

            {statusFilter && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setPage(1);
                }}
                className="self-end text-sm text-[#d4a84b] hover:text-[#f26522] transition-colors"
              >
                {t('invoices.clearFilters')}
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
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Receipt className="h-16 w-16 text-theme-muted opacity-50" />
            <p className="mt-4 text-lg font-medium text-theme-primary">{t('invoices.noInvoices')}</p>
            <p className="mt-1 text-sm text-theme-muted">{t('invoices.noInvoicesDescription')}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-theme-border bg-theme-bg-secondary/50">
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('invoices.invoiceNumber')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('invoices.customer')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('invoices.amount')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('invoices.status')}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {t('invoices.dueDate')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">
                      {t('invoices.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border">
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="group transition-colors hover:bg-theme-bg-secondary/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b]/20 to-[#f26522]/20">
                            <FileText className="h-5 w-5 text-[#d4a84b]" />
                          </div>
                          <div>
                            <p className="font-medium text-theme-primary">{invoice.invoiceNumber}</p>
                            <p className="text-xs text-theme-muted">
                              {isRTL ? invoice.titleAr : invoice.title}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-theme-muted" />
                          <span className="text-sm text-theme-secondary">
                            {invoice.customer?.name || '-'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-theme-primary font-medium">
                          <DollarSign className="h-4 w-4 text-[#d4a84b]" />
                          {formatPrice(invoice.total, invoice.currency)}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                            statusColors[invoice.status].bg
                          } ${statusColors[invoice.status].text} ${
                            statusColors[invoice.status].border
                          }`}
                        >
                          {getLabel(InvoiceStatusLabels, invoice.status, isRTL ? 'ar' : 'en')}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-theme-muted">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">{formatDate(invoice.dueDate)}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleView(invoice)}
                            className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-theme-bg-secondary hover:text-theme-primary"
                            title={t('common.viewDetails')}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {invoice.status === 'DRAFT' && (
                            <button
                              onClick={() => handleIssue(invoice)}
                              disabled={actionLoading === invoice.id}
                              className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-blue-500/10 hover:text-blue-400"
                              title={t('invoices.issue')}
                            >
                              {actionLoading === invoice.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          {invoice.status === 'ISSUED' && (
                            <button
                              onClick={() => handleSend(invoice)}
                              disabled={actionLoading === invoice.id}
                              className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-purple-500/10 hover:text-purple-400"
                              title={t('invoices.send')}
                            >
                              {actionLoading === invoice.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(invoice)}
                            disabled={actionLoading === `download-${invoice.id}`}
                            className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-[#d4a84b]/10 hover:text-[#d4a84b]"
                            title={t('invoices.download')}
                          >
                            {actionLoading === `download-${invoice.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
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
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-theme-primary">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-theme-muted">{invoice.customer?.name || '-'}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        statusColors[invoice.status].bg
                      } ${statusColors[invoice.status].text} ${statusColors[invoice.status].border}`}
                    >
                      {getLabel(InvoiceStatusLabels, invoice.status, isRTL ? 'ar' : 'en')}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1 text-[#d4a84b] font-medium">
                      <DollarSign className="h-3 w-3" />
                      {formatPrice(invoice.total, invoice.currency)}
                    </span>
                    <span className="flex items-center gap-1 text-theme-muted">
                      <Calendar className="h-3 w-3" />
                      {formatDate(invoice.dueDate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end pt-2 border-t border-theme-border">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleView(invoice)}
                        className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(invoice)}
                        className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
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
                  {t('invoices.showing')} {(page - 1) * limit + 1}-
                  {Math.min(page * limit, total)} {t('invoices.of')} {total}
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
      {showViewModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-theme-border p-4">
              <h2 className="text-xl font-bold text-theme-primary">{t('invoices.invoiceDetails')}</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedInvoice(null);
                }}
                className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b] to-[#f26522]">
                  <Receipt className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-theme-primary">{selectedInvoice.invoiceNumber}</h3>
                  <p className="text-sm text-theme-muted">
                    {isRTL ? selectedInvoice.titleAr : selectedInvoice.title}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('invoices.customer')}</label>
                  <p className="text-theme-primary font-medium mt-1">{selectedInvoice.customer?.name || '-'}</p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('invoices.status')}</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusColors[selectedInvoice.status].bg} ${statusColors[selectedInvoice.status].text} ${statusColors[selectedInvoice.status].border}`}>
                      {getLabel(InvoiceStatusLabels, selectedInvoice.status, isRTL ? 'ar' : 'en')}
                    </span>
                  </p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('invoices.subtotal')}</label>
                  <p className="text-theme-primary font-medium mt-1">{formatPrice(selectedInvoice.subtotal, selectedInvoice.currency)}</p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('invoices.tax')} ({selectedInvoice.taxRate}%)</label>
                  <p className="text-theme-primary font-medium mt-1">{formatPrice(selectedInvoice.taxAmount, selectedInvoice.currency)}</p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('invoices.discount')}</label>
                  <p className="text-theme-primary font-medium mt-1">{formatPrice(selectedInvoice.discount, selectedInvoice.currency)}</p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('invoices.total')}</label>
                  <p className="text-[#d4a84b] font-bold text-xl mt-1">{formatPrice(selectedInvoice.total, selectedInvoice.currency)}</p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('invoices.issuedAt')}</label>
                  <p className="text-theme-primary font-medium mt-1">{formatDate(selectedInvoice.issuedAt)}</p>
                </div>
                <div className="glass-card-dark p-4">
                  <label className="text-xs text-theme-muted">{t('invoices.dueDate')}</label>
                  <p className="text-theme-primary font-medium mt-1">{formatDate(selectedInvoice.dueDate)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-theme-border p-4">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedInvoice(null);
                }}
                className="glass-button px-4 py-2"
              >
                {t('common.close')}
              </button>
              <button
                onClick={() => handleDownload(selectedInvoice)}
                className="btn-premium px-4 py-2 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {t('invoices.download')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md mx-4">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <Trash2 className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-theme-primary">{t('invoices.deleteConfirmTitle')}</h3>
              <p className="mt-2 text-theme-muted">{t('invoices.deleteConfirmMessage')}</p>
              <p className="mt-1 font-medium text-theme-primary">{selectedInvoice.invoiceNumber}</p>
            </div>
            <div className="flex gap-3 border-t border-theme-border p-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedInvoice(null);
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

      {/* Invoice Modal (Create/Edit) */}
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onSuccess={fetchInvoices}
      />
    </div>
  );
}
