import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { publicationsService } from '../../services/publications.service';
import type {
  PublicationPurchase,
  PublicationPurchaseStatus,
  PurchaseType,
} from '../../services/publications.service';
import { toast } from 'sonner';
import {
  BookOpen,
  Download,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ShoppingBag,
  Calendar,
  Hash,
  AlertCircle,
  RefreshCw,
  X,
  FileText,
  Truck,
} from 'lucide-react';

// Status colors
const statusColors: Record<PublicationPurchaseStatus, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  PENDING: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: <Clock className="h-4 w-4" /> },
  PAID: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', icon: <CheckCircle className="h-4 w-4" /> },
  DELIVERED: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', icon: <Truck className="h-4 w-4" /> },
  CANCELLED: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', icon: <XCircle className="h-4 w-4" /> },
  REFUNDED: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30', icon: <RefreshCw className="h-4 w-4" /> },
};

// Status labels
const statusLabels: Record<PublicationPurchaseStatus, { en: string; ar: string }> = {
  PENDING: { en: 'Pending Payment', ar: 'في انتظار الدفع' },
  PAID: { en: 'Paid', ar: 'تم الدفع' },
  DELIVERED: { en: 'Delivered', ar: 'تم التسليم' },
  CANCELLED: { en: 'Cancelled', ar: 'ملغي' },
  REFUNDED: { en: 'Refunded', ar: 'مسترد' },
};

// Purchase type labels
const purchaseTypeLabels: Record<PurchaseType, { en: string; ar: string }> = {
  FULL_DOWNLOAD: { en: 'Full Download', ar: 'تحميل كامل' },
  PART_DOWNLOAD: { en: 'Part Download', ar: 'تحميل جزء' },
  VIEW_ONCE: { en: 'View Once', ar: 'تصفح مرة واحدة' },
  VIEW_LIMITED: { en: 'Limited View', ar: 'تصفح محدود' },
  VIEW_PERMANENT: { en: 'Permanent View', ar: 'تصفح دائم' },
  PHYSICAL_COPY: { en: 'Physical Copy', ar: 'نسخة ورقية' },
};

export function MyPublicationsPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';

  // State
  const [purchases, setPurchases] = useState<PublicationPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<PublicationPurchase | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch purchases
  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const data = await publicationsService.getMyPurchases();
      setPurchases(data || []);
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
      toast.error(isRTL ? 'فشل في تحميل المشتريات' : 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  }, [isRTL]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // Format currency
  const formatCurrency = (amount: number, currency = 'EGP') => {
    return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle download
  const handleDownload = async (purchase: PublicationPurchase) => {
    if (!purchase.publication) return;

    // Check if download is allowed
    if (purchase.status !== 'PAID') {
      toast.error(isRTL ? 'يجب دفع الفاتورة أولاً' : 'Payment required first');
      return;
    }

    if (purchase.downloadCount >= purchase.maxDownloads) {
      toast.error(isRTL ? 'تم استنفاد عدد التحميلات المسموح' : 'Download limit reached');
      return;
    }

    if (purchase.expiresAt && new Date(purchase.expiresAt) < new Date()) {
      toast.error(isRTL ? 'انتهت صلاحية التحميل' : 'Download expired');
      return;
    }

    setDownloadingId(purchase.id);
    try {
      const filename = `${purchase.publication.code}.pdf`;
      await publicationsService.downloadPublication(purchase.id, filename);
      toast.success(isRTL ? 'جاري تحميل الملف' : 'Download started');
      // Refresh to update download count
      fetchPurchases();
    } catch (error) {
      toast.error(isRTL ? 'فشل في تحميل الملف' : 'Failed to download file');
    } finally {
      setDownloadingId(null);
    }
  };

  // Check if download is available
  const canDownload = (purchase: PublicationPurchase): boolean => {
    if (purchase.status !== 'PAID') return false;
    if (purchase.purchaseType === 'PHYSICAL_COPY') return false;
    if (purchase.downloadCount >= purchase.maxDownloads) return false;
    if (purchase.expiresAt && new Date(purchase.expiresAt) < new Date()) return false;
    return true;
  };

  // Get download status message
  const getDownloadStatus = (purchase: PublicationPurchase): { message: string; type: 'success' | 'warning' | 'error' } => {
    if (purchase.status !== 'PAID') {
      return {
        message: isRTL ? 'في انتظار الدفع' : 'Awaiting payment',
        type: 'warning',
      };
    }
    if (purchase.purchaseType === 'PHYSICAL_COPY') {
      return {
        message: isRTL ? 'نسخة ورقية - سيتم الشحن' : 'Physical copy - will be shipped',
        type: 'success',
      };
    }
    if (purchase.downloadCount >= purchase.maxDownloads) {
      return {
        message: isRTL ? 'تم استنفاد التحميلات' : 'Downloads exhausted',
        type: 'error',
      };
    }
    if (purchase.expiresAt && new Date(purchase.expiresAt) < new Date()) {
      return {
        message: isRTL ? 'انتهت الصلاحية' : 'Expired',
        type: 'error',
      };
    }
    return {
      message: `${purchase.downloadCount}/${purchase.maxDownloads} ${isRTL ? 'تحميلات' : 'downloads'}`,
      type: 'success',
    };
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#f26522]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="glass-card overflow-hidden p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d4a84b] to-[#f26522]">
              <ShoppingBag className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {isRTL ? 'مشترياتي' : 'My Purchases'}
              </h1>
              <p className="text-sm text-white/60">
                {isRTL ? 'إدارة الأكواد والمنشورات المشتراة' : 'Manage your purchased publications'}
              </p>
            </div>
          </div>
          <button
            onClick={fetchPurchases}
            className="glass-button px-4 py-2 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {isRTL ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Purchases List */}
      {purchases.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-theme-muted opacity-50" />
          <p className="mt-4 text-lg font-medium text-theme-primary">
            {isRTL ? 'لا توجد مشتريات' : 'No purchases yet'}
          </p>
          <p className="mt-1 text-sm text-theme-muted">
            {isRTL ? 'تصفح الكتالوج وقم بشراء المنشورات' : 'Browse the catalog and purchase publications'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => {
            const downloadStatus = getDownloadStatus(purchase);
            const publication = purchase.publication;

            return (
              <div key={purchase.id} className="glass-card overflow-hidden">
                <div className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Publication Cover */}
                    <div className="flex-shrink-0">
                      {publication?.coverImage ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL}${publication.coverImage}`}
                          alt={publication?.title}
                          className="h-32 w-24 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-32 w-24 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#d4a84b]/20 to-[#f26522]/20">
                          <BookOpen className="h-8 w-8 text-[#d4a84b]" />
                        </div>
                      )}
                    </div>

                    {/* Purchase Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-theme-primary">
                            {isRTL ? publication?.titleAr : publication?.title}
                          </h3>
                          <p className="text-sm text-theme-muted">{publication?.code}</p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
                            statusColors[purchase.status].bg
                          } ${statusColors[purchase.status].text} ${statusColors[purchase.status].border}`}
                        >
                          {statusColors[purchase.status].icon}
                          {isRTL ? statusLabels[purchase.status].ar : statusLabels[purchase.status].en}
                        </span>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-theme-muted">{isRTL ? 'رقم الطلب' : 'Order #'}</p>
                          <p className="text-sm font-medium text-theme-primary flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {purchase.purchaseNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-theme-muted">{isRTL ? 'نوع الشراء' : 'Type'}</p>
                          <p className="text-sm font-medium text-theme-primary">
                            {isRTL ? purchaseTypeLabels[purchase.purchaseType].ar : purchaseTypeLabels[purchase.purchaseType].en}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-theme-muted">{isRTL ? 'السعر' : 'Price'}</p>
                          <p className="text-sm font-bold text-[#d4a84b]">
                            {formatCurrency(purchase.price, purchase.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-theme-muted">{isRTL ? 'تاريخ الشراء' : 'Date'}</p>
                          <p className="text-sm font-medium text-theme-primary flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(purchase.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Download Status */}
                      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-theme-border">
                        <div className="flex items-center gap-2">
                          {downloadStatus.type === 'success' && <CheckCircle className="h-4 w-4 text-green-400" />}
                          {downloadStatus.type === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-400" />}
                          {downloadStatus.type === 'error' && <XCircle className="h-4 w-4 text-red-400" />}
                          <span className={`text-sm ${
                            downloadStatus.type === 'success' ? 'text-green-400' :
                            downloadStatus.type === 'warning' ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {downloadStatus.message}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedPurchase(purchase);
                              setShowDetailModal(true);
                            }}
                            className="glass-button px-4 py-2 flex items-center gap-2 text-sm"
                          >
                            <Eye className="h-4 w-4" />
                            {isRTL ? 'التفاصيل' : 'Details'}
                          </button>
                          {canDownload(purchase) && (
                            <button
                              onClick={() => handleDownload(purchase)}
                              disabled={downloadingId === purchase.id}
                              className="btn-premium px-4 py-2 flex items-center gap-2 text-sm disabled:opacity-50"
                            >
                              {downloadingId === purchase.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                              {isRTL ? 'تحميل' : 'Download'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPurchase && (
        <PurchaseDetailModal
          purchase={selectedPurchase}
          isRTL={isRTL}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedPurchase(null);
          }}
          onDownload={() => handleDownload(selectedPurchase)}
          canDownload={canDownload(selectedPurchase)}
          downloadingId={downloadingId}
        />
      )}
    </div>
  );
}

// Purchase Detail Modal
function PurchaseDetailModal({
  purchase,
  isRTL,
  formatCurrency,
  formatDate,
  onClose,
  onDownload,
  canDownload,
  downloadingId,
}: {
  purchase: PublicationPurchase;
  isRTL: boolean;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: string) => string;
  onClose: () => void;
  onDownload: () => void;
  canDownload: boolean;
  downloadingId: string | null;
}) {
  const { t } = useTranslation();
  const publication = purchase.publication;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-theme-border p-4">
          <h2 className="text-xl font-bold text-theme-primary">
            {isRTL ? 'تفاصيل الشراء' : 'Purchase Details'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Publication Info */}
          <div className="flex gap-4">
            {publication?.coverImage ? (
              <img
                src={`${import.meta.env.VITE_API_URL}${publication.coverImage}`}
                alt={publication?.title}
                className="h-40 w-28 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-40 w-28 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#d4a84b]/20 to-[#f26522]/20 flex-shrink-0">
                <BookOpen className="h-10 w-10 text-[#d4a84b]" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-theme-primary">
                {isRTL ? publication?.titleAr : publication?.title}
              </h3>
              <p className="text-sm text-theme-muted">{publication?.code}</p>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
                    statusColors[purchase.status].bg
                  } ${statusColors[purchase.status].text} ${statusColors[purchase.status].border}`}
                >
                  {statusColors[purchase.status].icon}
                  {isRTL ? statusLabels[purchase.status].ar : statusLabels[purchase.status].en}
                </span>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card-dark p-4">
              <p className="text-xs text-theme-muted">{isRTL ? 'رقم الطلب' : 'Order Number'}</p>
              <p className="text-lg font-bold text-theme-primary">{purchase.purchaseNumber}</p>
            </div>
            <div className="glass-card-dark p-4">
              <p className="text-xs text-theme-muted">{isRTL ? 'نوع الشراء' : 'Purchase Type'}</p>
              <p className="text-lg font-bold text-theme-primary">
                {isRTL ? purchaseTypeLabels[purchase.purchaseType].ar : purchaseTypeLabels[purchase.purchaseType].en}
              </p>
            </div>
            <div className="glass-card-dark p-4">
              <p className="text-xs text-theme-muted">{isRTL ? 'السعر' : 'Price'}</p>
              <p className="text-lg font-bold text-[#d4a84b]">
                {formatCurrency(purchase.price, purchase.currency)}
              </p>
            </div>
            <div className="glass-card-dark p-4">
              <p className="text-xs text-theme-muted">{isRTL ? 'تاريخ الشراء' : 'Purchase Date'}</p>
              <p className="text-lg font-bold text-theme-primary">{formatDate(purchase.createdAt)}</p>
            </div>
          </div>

          {/* Download Info */}
          {purchase.purchaseType !== 'PHYSICAL_COPY' && (
            <div className="glass-card-dark p-4">
              <h4 className="font-medium text-theme-primary mb-3">{isRTL ? 'معلومات التحميل' : 'Download Info'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-theme-muted">{isRTL ? 'التحميلات المستخدمة' : 'Downloads Used'}</p>
                  <p className="text-lg font-bold text-theme-primary">
                    {purchase.downloadCount} / {purchase.maxDownloads}
                  </p>
                </div>
                {purchase.expiresAt && (
                  <div>
                    <p className="text-xs text-theme-muted">{isRTL ? 'تاريخ الانتهاء' : 'Expires'}</p>
                    <p className="text-lg font-bold text-theme-primary">{formatDate(purchase.expiresAt)}</p>
                  </div>
                )}
                {purchase.lastAccessedAt && (
                  <div>
                    <p className="text-xs text-theme-muted">{isRTL ? 'آخر تحميل' : 'Last Download'}</p>
                    <p className="text-lg font-bold text-theme-primary">{formatDate(purchase.lastAccessedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping Info (for physical copies) */}
          {purchase.purchaseType === 'PHYSICAL_COPY' && purchase.shippingAddress && (
            <div className="glass-card-dark p-4">
              <h4 className="font-medium text-theme-primary mb-3">{isRTL ? 'معلومات الشحن' : 'Shipping Info'}</h4>
              <p className="text-sm text-theme-muted">{purchase.shippingAddress}</p>
              {purchase.shippedAt && (
                <p className="text-sm text-green-400 mt-2">
                  {isRTL ? 'تم الشحن في:' : 'Shipped on:'} {formatDate(purchase.shippedAt)}
                </p>
              )}
              {purchase.deliveredAt && (
                <p className="text-sm text-green-400">
                  {isRTL ? 'تم التسليم في:' : 'Delivered on:'} {formatDate(purchase.deliveredAt)}
                </p>
              )}
            </div>
          )}

          {/* Payment Info */}
          {purchase.paidAt && (
            <div className="glass-card-dark p-4">
              <h4 className="font-medium text-theme-primary mb-3">{isRTL ? 'معلومات الدفع' : 'Payment Info'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-theme-muted">{isRTL ? 'تاريخ الدفع' : 'Payment Date'}</p>
                  <p className="text-theme-primary">{formatDate(purchase.paidAt)}</p>
                </div>
                {purchase.paymentId && (
                  <div>
                    <p className="text-xs text-theme-muted">{isRTL ? 'رقم العملية' : 'Transaction ID'}</p>
                    <p className="text-theme-primary">{purchase.paymentId}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-theme-border p-4">
          <button onClick={onClose} className="glass-button px-4 py-2">
            {t('common.close')}
          </button>
          {canDownload && (
            <button
              onClick={onDownload}
              disabled={downloadingId === purchase.id}
              className="btn-premium px-6 py-2 flex items-center gap-2 disabled:opacity-50"
            >
              {downloadingId === purchase.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isRTL ? 'تحميل الملف' : 'Download File'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
