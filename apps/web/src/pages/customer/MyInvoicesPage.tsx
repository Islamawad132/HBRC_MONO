import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { invoicesService } from '../../services/invoices.service';
import type { Invoice } from '../../types/interfaces';
import { InvoiceStatus, getLabel } from '../../types/enums';
import { toast } from 'sonner';
import { Modal, ModalFooter } from '../../components/ui/Modal';
import {
  Receipt,
  Filter,
  Eye,
  Download,
  CreditCard,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react';

// Status colors
const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  ISSUED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SENT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  PAID: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  PARTIALLY_PAID: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  OVERDUE: 'bg-red-500/20 text-red-400 border-red-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function MyInvoicesPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';

  // State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    paid: 0,
    pending: 0,
  });

  // Fetch my invoices
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await invoicesService.getMyInvoices({
        page: currentPage,
        limit: 10,
        status: statusFilter || undefined,
      });
      const data = response?.data || [];
      setInvoices(data);
      setTotalCount(response?.total || 0);
      setTotalPages(response?.totalPages || 1);

      // Calculate stats
      if (currentPage === 1) {
        const totalAmount = data.reduce((acc, inv) => acc + (inv.total || 0), 0);
        const paidAmount = data
          .filter((inv) => inv.status === 'PAID')
          .reduce((acc, inv) => acc + (inv.total || 0), 0);
        const pendingAmount = totalAmount - paidAmount;
        setStats({
          total: response?.total || 0,
          totalAmount,
          paid: paidAmount,
          pending: pendingAmount,
        });
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, t]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleDownload = async (invoice: Invoice) => {
    try {
      await invoicesService.downloadPdf(invoice.id, `invoice-${invoice.invoiceNumber}.pdf`);
      toast.success(t('myInvoices.downloadSuccess'));
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast.error(t('common.error'));
    }
  };

  const clearFilters = () => {
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
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b] to-[#f26522]">
          <Receipt className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('myInvoices.title')}</h1>
          <p className="text-sm text-white/60">{t('myInvoices.subtitle')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('myInvoices.totalInvoices')}</p>
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
              <p className="text-sm text-white/60">{t('myInvoices.totalAmount')}</p>
              <p className="text-xl font-bold text-white">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
              <DollarSign className="h-5 w-5 text-purple-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('myInvoices.paid')}</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(stats.paid)}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('myInvoices.pending')}</p>
              <p className="text-xl font-bold text-amber-400">{formatCurrency(stats.pending)}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-white/40" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="glass-input min-w-[180px]"
            >
              <option value="">{t('myInvoices.allStatuses')}</option>
              {Object.values(InvoiceStatus).map((status) => (
                <option key={status} value={status}>
                  {getLabel('InvoiceStatus', status, language)}
                </option>
              ))}
            </select>
          </div>

          {statusFilter && (
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
      ) : invoices.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
          <Receipt className="mb-4 h-16 w-16 text-white/20" />
          <h3 className="text-lg font-medium text-white">{t('myInvoices.noInvoices')}</h3>
          <p className="mt-1 text-sm text-white/60">{t('myInvoices.noInvoicesDescription')}</p>
        </div>
      ) : (
        <>
          {/* Invoices List */}
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="glass-card p-4 transition-colors hover:bg-white/5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b]/20 to-[#f26522]/20">
                      <Receipt className="h-6 w-6 text-[#f26522]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">#{invoice.invoiceNumber}</h3>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[invoice.status]}`}
                        >
                          {getLabel('InvoiceStatus', invoice.status, language)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/60">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(invoice.createdAt)}</span>
                        </div>
                        {invoice.dueDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{t('myInvoices.dueDate')}: {formatDate(invoice.dueDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{formatCurrency(invoice.total)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(invoice)}
                        className="glass-button p-2 text-white/70 hover:text-white"
                        title={t('common.viewDetails')}
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDownload(invoice)}
                        className="glass-button p-2 text-white/70 hover:text-white"
                        title={t('myInvoices.download')}
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                        <button
                          className="glass-button flex items-center gap-2 bg-gradient-to-r from-[#a0592b] to-[#f26522] px-4 py-2 text-white"
                        >
                          <CreditCard className="h-4 w-4" />
                          <span>{t('myInvoices.payNow')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="glass-card flex items-center justify-between p-4">
              <p className="text-sm text-white/60">
                {t('myInvoices.showing')} {(currentPage - 1) * 10 + 1}-
                {Math.min(currentPage * 10, totalCount)} {t('myInvoices.of')} {totalCount}
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
      <Modal
        isOpen={showViewModal && !!selectedInvoice}
        onClose={() => {
          setShowViewModal(false);
          setSelectedInvoice(null);
        }}
        title={t('myInvoices.invoiceDetails')}
        icon={Receipt}
        size="lg"
        footer={
          <ModalFooter>
            <button
              onClick={() => selectedInvoice && handleDownload(selectedInvoice)}
              className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 font-medium text-white transition-colors hover:bg-white/10"
            >
              <Download className="mr-2 inline h-4 w-4" />
              {t('myInvoices.download')}
            </button>
            {selectedInvoice && selectedInvoice.status !== 'PAID' && selectedInvoice.status !== 'CANCELLED' && (
              <button className="flex-1 rounded-xl bg-gradient-to-r from-[#a0592b] to-[#f26522] px-4 py-2.5 font-medium text-white transition-colors hover:opacity-90">
                <CreditCard className="mr-2 inline h-4 w-4" />
                {t('myInvoices.payNow')}
              </button>
            )}
          </ModalFooter>
        }
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b]/20 to-[#f26522]/20">
                <Receipt className="h-8 w-8 text-[#f26522]" />
              </div>
              <div>
                <p className="text-lg font-medium text-white">#{selectedInvoice.invoiceNumber}</p>
                <span
                  className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[selectedInvoice.status]}`}
                >
                  {getLabel('InvoiceStatus', selectedInvoice.status, language)}
                </span>
              </div>
            </div>

            <div className="grid gap-4 rounded-lg bg-white/5 p-4">
              <div className="flex justify-between">
                <span className="text-white/60">{t('myInvoices.subtotal')}</span>
                <span className="text-white">{formatCurrency(selectedInvoice.subtotal)}</span>
              </div>
              {selectedInvoice.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/60">{t('myInvoices.tax')}</span>
                  <span className="text-white">{formatCurrency(selectedInvoice.tax)}</span>
                </div>
              )}
              {selectedInvoice.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/60">{t('myInvoices.discount')}</span>
                  <span className="text-emerald-400">-{formatCurrency(selectedInvoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/10 pt-4">
                <span className="font-medium text-white">{t('myInvoices.total')}</span>
                <span className="text-xl font-bold text-white">{formatCurrency(selectedInvoice.total)}</span>
              </div>
            </div>

            <div className="grid gap-4 rounded-lg bg-white/5 p-4">
              <div>
                <p className="text-xs text-white/40">{t('myInvoices.issuedAt')}</p>
                <p className="text-white">{formatDate(selectedInvoice.createdAt)}</p>
              </div>
              {selectedInvoice.dueDate && (
                <div>
                  <p className="text-xs text-white/40">{t('myInvoices.dueDate')}</p>
                  <p className="text-white">{formatDate(selectedInvoice.dueDate)}</p>
                </div>
              )}
              {selectedInvoice.request && (
                <div>
                  <p className="text-xs text-white/40">{t('myInvoices.relatedRequest')}</p>
                  <p className="text-white">#{selectedInvoice.request.requestNumber}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
