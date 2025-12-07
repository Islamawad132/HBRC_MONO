import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { publicationsService } from '../../services/publications.service';
import { paymobService, type PaymentMethod } from '../../services/paymob.service';
import { walletService } from '../../services/wallet.service';
import { useAuth } from '../../hooks/useAuth';
import type {
  Publication,
  PublicationCategory,
  PublicationType,
  PurchaseType,
  CreatePurchaseRequest,
} from '../../services/publications.service';
import { toast } from 'sonner';
import {
  BookOpen,
  Search,
  Filter,
  X,
  Eye,
  Download,
  ShoppingCart,
  Star,
  Tag,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  BookMarked,
  ScrollText,
  FileQuestion,
  FlaskConical,
  ChevronDown,
} from 'lucide-react';

// Type icons
const typeIcons: Record<PublicationType, React.ReactNode> = {
  CODE: <BookMarked className="h-6 w-6" />,
  SPECIFICATION: <ScrollText className="h-6 w-6" />,
  GUIDE: <BookOpen className="h-6 w-6" />,
  RESEARCH: <FlaskConical className="h-6 w-6" />,
  PUBLICATION: <FileText className="h-6 w-6" />,
  OTHER: <FileQuestion className="h-6 w-6" />,
};

// Type colors
const typeColors: Record<PublicationType, string> = {
  CODE: 'from-blue-500 to-cyan-500',
  SPECIFICATION: 'from-purple-500 to-pink-500',
  GUIDE: 'from-amber-500 to-orange-500',
  RESEARCH: 'from-green-500 to-emerald-500',
  PUBLICATION: 'from-rose-500 to-red-500',
  OTHER: 'from-gray-400 to-gray-500',
};

// Type labels
const typeLabels: Record<PublicationType, { en: string; ar: string }> = {
  CODE: { en: 'Egyptian Code', ar: 'كود مصري' },
  SPECIFICATION: { en: 'Specification', ar: 'مواصفة قياسية' },
  GUIDE: { en: 'Technical Guide', ar: 'دليل فني' },
  RESEARCH: { en: 'Research', ar: 'بحث علمي' },
  PUBLICATION: { en: 'Publication', ar: 'مطبوعة' },
  OTHER: { en: 'Other', ar: 'أخرى' },
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

export function PublicationsCatalogPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';

  // State
  const [publications, setPublications] = useState<Publication[]>([]);
  const [categories, setCategories] = useState<PublicationCategory[]>([]);
  const [featuredPublications, setFeaturedPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<PublicationType | ''>('');
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const data = await publicationsService.getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  // Fetch publications
  const fetchPublications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await publicationsService.getPublications({
        page,
        limit,
        search: searchQuery || undefined,
        categoryId: selectedCategory || undefined,
        type: selectedType || undefined,
        isActive: true,
        status: 'PUBLISHED',
      });
      setPublications(response?.data || []);
      setTotalPages(response?.meta?.totalPages || 1);
      setTotal(response?.meta?.total || 0);
    } catch (error) {
      console.error('Failed to fetch publications:', error);
      toast.error(isRTL ? 'فشل في تحميل المنشورات' : 'Failed to load publications');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedCategory, selectedType, isRTL]);

  // Fetch featured publications
  const fetchFeatured = useCallback(async () => {
    try {
      const response = await publicationsService.getPublications({
        isFeatured: true,
        isActive: true,
        status: 'PUBLISHED',
        limit: 6,
      });
      setFeaturedPublications(response?.data || []);
    } catch (error) {
      console.error('Failed to fetch featured:', error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchFeatured();
  }, [fetchCategories, fetchFeatured]);

  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        fetchPublications();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Format currency
  const formatCurrency = (amount: number, currency = 'EGP') => {
    return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle view details
  const handleViewDetails = (publication: Publication) => {
    setSelectedPublication(publication);
    setShowDetailModal(true);
  };

  // Handle purchase
  const handlePurchase = (publication: Publication) => {
    setSelectedPublication(publication);
    setShowPurchaseModal(true);
  };

  if (loading && publications.length === 0) {
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
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {isRTL ? 'الكتالوج الرقمي' : 'Digital Catalog'}
              </h1>
              <p className="text-sm text-white/60">
                {isRTL
                  ? 'الأكواد والمواصفات والأدلة الفنية'
                  : 'Codes, Specifications & Technical Guides'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Sparkles className="h-4 w-4 text-[#f26522]" />
            <span>
              {total} {isRTL ? 'منشور متاح' : 'publications available'}
            </span>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      {featuredPublications.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-theme-primary flex items-center gap-2">
            <Star className="h-5 w-5 text-[#d4a84b] fill-[#d4a84b]" />
            {isRTL ? 'المنشورات المميزة' : 'Featured Publications'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredPublications.slice(0, 3).map((pub) => (
              <div
                key={pub.id}
                className="glass-card overflow-hidden group cursor-pointer hover:ring-2 hover:ring-[#d4a84b]/50 transition-all"
                onClick={() => handleViewDetails(pub)}
              >
                <div className="flex gap-4 p-4">
                  {pub.coverImage ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${pub.coverImage}`}
                      alt={pub.title}
                      className="h-24 w-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className={`flex h-24 w-20 items-center justify-center rounded-lg bg-gradient-to-br ${typeColors[pub.type]}`}>
                      {typeIcons[pub.type]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-4 w-4 text-[#d4a84b] fill-[#d4a84b]" />
                      <span className="text-xs text-[#d4a84b]">{isRTL ? 'مميز' : 'Featured'}</span>
                    </div>
                    <h3 className="font-medium text-theme-primary line-clamp-2">
                      {isRTL ? pub.titleAr : pub.title}
                    </h3>
                    <p className="text-xs text-theme-muted mt-1">{pub.code}</p>
                    <p className="text-sm font-bold text-[#d4a84b] mt-2">
                      {formatCurrency(pub.price, pub.currency)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted ltr:left-3 rtl:right-3" />
            <input
              type="text"
              placeholder={isRTL ? 'بحث بالعنوان أو الكود...' : 'Search by title or code...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full ltr:pl-10 rtl:pr-10"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="glass-input min-w-[180px]"
          >
            <option value="">{isRTL ? 'جميع الفئات' : 'All Categories'}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {isRTL ? cat.nameAr : cat.name}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value as PublicationType | '');
              setPage(1);
            }}
            className="glass-input min-w-[180px]"
          >
            <option value="">{isRTL ? 'جميع الأنواع' : 'All Types'}</option>
            {Object.entries(typeLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {isRTL ? label.ar : label.en}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {(searchQuery || selectedCategory || selectedType) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setSelectedType('');
                setPage(1);
              }}
              className="glass-button px-4 py-2 flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              {isRTL ? 'مسح' : 'Clear'}
            </button>
          )}
        </div>
      </div>

      {/* Publications Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#d4a84b]" />
        </div>
      ) : publications.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BookOpen className="h-16 w-16 mx-auto text-theme-muted opacity-50" />
          <p className="mt-4 text-lg font-medium text-theme-primary">
            {isRTL ? 'لا توجد منشورات' : 'No publications found'}
          </p>
          <p className="mt-1 text-sm text-theme-muted">
            {isRTL ? 'جرب تغيير معايير البحث' : 'Try changing your search criteria'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {publications.map((pub) => (
              <div
                key={pub.id}
                className="glass-card overflow-hidden group hover:ring-2 hover:ring-[#d4a84b]/30 transition-all"
              >
                {/* Cover */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  {pub.coverImage ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${pub.coverImage}`}
                      alt={pub.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className={`h-full w-full flex items-center justify-center bg-gradient-to-br ${typeColors[pub.type]}`}>
                      <div className="text-white/80">
                        {typeIcons[pub.type]}
                      </div>
                    </div>
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  {/* Type Badge */}
                  <div className="absolute top-2 ltr:left-2 rtl:right-2">
                    <span className={`inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2 py-1 text-xs text-white`}>
                      {isRTL ? typeLabels[pub.type].ar : typeLabels[pub.type].en}
                    </span>
                  </div>
                  {/* Featured Badge */}
                  {pub.isFeatured && (
                    <div className="absolute top-2 ltr:right-2 rtl:left-2">
                      <Star className="h-5 w-5 text-[#d4a84b] fill-[#d4a84b]" />
                    </div>
                  )}
                  {/* Price */}
                  <div className="absolute bottom-2 ltr:left-2 rtl:right-2">
                    <span className="inline-flex items-center rounded-full bg-[#d4a84b] px-3 py-1 text-sm font-bold text-white">
                      {formatCurrency(pub.price, pub.currency)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center gap-1 text-xs text-theme-muted mb-1">
                    <Tag className="h-3 w-3" />
                    {pub.code}
                  </div>
                  <h3 className="font-medium text-theme-primary line-clamp-2 min-h-[2.5rem]">
                    {isRTL ? pub.titleAr : pub.title}
                  </h3>
                  {pub.category && (
                    <p className="text-xs text-theme-muted mt-1">
                      {isRTL ? pub.category.nameAr : pub.category.name}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleViewDetails(pub)}
                      className="flex-1 glass-button py-2 flex items-center justify-center gap-1 text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      {isRTL ? 'التفاصيل' : 'Details'}
                    </button>
                    <button
                      onClick={() => handlePurchase(pub)}
                      className="flex-1 btn-premium py-2 flex items-center justify-center gap-1 text-sm"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {isRTL ? 'شراء' : 'Buy'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="glass-button p-2 disabled:opacity-50"
              >
                {isRTL ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </button>
              <span className="text-theme-primary">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="glass-button p-2 disabled:opacity-50"
              >
                {isRTL ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPublication && (
        <PublicationDetailModal
          publication={selectedPublication}
          isRTL={isRTL}
          formatCurrency={formatCurrency}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedPublication(null);
          }}
          onPurchase={() => {
            setShowDetailModal(false);
            setShowPurchaseModal(true);
          }}
        />
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedPublication && (
        <PurchaseModal
          publication={selectedPublication}
          isRTL={isRTL}
          formatCurrency={formatCurrency}
          onClose={() => {
            setShowPurchaseModal(false);
            setSelectedPublication(null);
          }}
        />
      )}
    </div>
  );
}

// Publication Detail Modal
function PublicationDetailModal({
  publication,
  isRTL,
  formatCurrency,
  onClose,
  onPurchase,
}: {
  publication: Publication;
  isRTL: boolean;
  formatCurrency: (amount: number, currency?: string) => string;
  onClose: () => void;
  onPurchase: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-theme-border p-4">
          <h2 className="text-xl font-bold text-theme-primary">
            {isRTL ? 'تفاصيل المنشور' : 'Publication Details'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex gap-6">
            {publication.coverImage ? (
              <img
                src={`${import.meta.env.VITE_API_URL}${publication.coverImage}`}
                alt={publication.title}
                className="h-48 w-36 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className={`h-48 w-36 rounded-xl flex items-center justify-center bg-gradient-to-br ${typeColors[publication.type]} flex-shrink-0`}>
                <div className="text-white scale-150">
                  {typeIcons[publication.type]}
                </div>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 border-blue-500/30`}>
                  {isRTL ? typeLabels[publication.type].ar : typeLabels[publication.type].en}
                </span>
                {publication.isFeatured && (
                  <Star className="h-5 w-5 text-[#d4a84b] fill-[#d4a84b]" />
                )}
              </div>
              <h3 className="text-xl font-bold text-theme-primary">
                {isRTL ? publication.titleAr : publication.title}
              </h3>
              <p className="text-sm text-theme-muted mt-1">{publication.code}</p>
              {publication.category && (
                <p className="text-sm text-theme-muted">
                  {isRTL ? publication.category.nameAr : publication.category.name}
                </p>
              )}
              <div className="mt-4">
                <span className="text-2xl font-bold text-[#d4a84b]">
                  {formatCurrency(publication.price, publication.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {(publication.description || publication.descriptionAr) && (
            <div className="glass-card-dark p-4">
              <label className="text-xs text-theme-muted">{isRTL ? 'الوصف' : 'Description'}</label>
              <p className="text-theme-primary mt-1">
                {isRTL ? publication.descriptionAr : publication.description}
              </p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card-dark p-3 text-center">
              <p className="text-xs text-theme-muted">{isRTL ? 'الطبعة' : 'Edition'}</p>
              <p className="text-lg font-bold text-theme-primary">{publication.editionNumber}</p>
            </div>
            {publication.editionYear && (
              <div className="glass-card-dark p-3 text-center">
                <p className="text-xs text-theme-muted">{isRTL ? 'السنة' : 'Year'}</p>
                <p className="text-lg font-bold text-theme-primary">{publication.editionYear}</p>
              </div>
            )}
            {publication.pageCount && (
              <div className="glass-card-dark p-3 text-center">
                <p className="text-xs text-theme-muted">{isRTL ? 'الصفحات' : 'Pages'}</p>
                <p className="text-lg font-bold text-theme-primary">{publication.pageCount}</p>
              </div>
            )}
            <div className="glass-card-dark p-3 text-center">
              <p className="text-xs text-theme-muted">{isRTL ? 'المشاهدات' : 'Views'}</p>
              <p className="text-lg font-bold text-theme-primary">{publication.viewCount}</p>
            </div>
          </div>

          {/* Pricing Options */}
          <div className="space-y-2">
            <h4 className="font-medium text-theme-primary">{isRTL ? 'خيارات الشراء' : 'Purchase Options'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="glass-card-dark p-3 flex justify-between items-center">
                <span className="text-sm text-theme-primary">{isRTL ? 'تحميل كامل' : 'Full Download'}</span>
                <span className="font-bold text-[#d4a84b]">{formatCurrency(publication.price, publication.currency)}</span>
              </div>
              {publication.partPrice && (
                <div className="glass-card-dark p-3 flex justify-between items-center">
                  <span className="text-sm text-theme-primary">{isRTL ? 'تحميل جزء' : 'Part Download'}</span>
                  <span className="font-bold text-[#d4a84b]">{formatCurrency(publication.partPrice, publication.currency)}</span>
                </div>
              )}
              {publication.viewPrice && (
                <div className="glass-card-dark p-3 flex justify-between items-center">
                  <span className="text-sm text-theme-primary">{isRTL ? 'تصفح فقط' : 'View Only'}</span>
                  <span className="font-bold text-[#d4a84b]">{formatCurrency(publication.viewPrice, publication.currency)}</span>
                </div>
              )}
              {publication.physicalPrice && (
                <div className="glass-card-dark p-3 flex justify-between items-center">
                  <span className="text-sm text-theme-primary">{isRTL ? 'نسخة ورقية' : 'Physical Copy'}</span>
                  <span className="font-bold text-[#d4a84b]">{formatCurrency(publication.physicalPrice, publication.currency)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-theme-border p-4">
          <button onClick={onClose} className="glass-button px-4 py-2">
            {t('common.close')}
          </button>
          <button onClick={onPurchase} className="btn-premium px-6 py-2 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            {isRTL ? 'شراء الآن' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Purchase Modal
function PurchaseModal({
  publication,
  isRTL,
  formatCurrency,
  onClose,
}: {
  publication: Publication;
  isRTL: boolean;
  formatCurrency: (amount: number, currency?: string) => string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'type' | 'payment'>('type');
  const [selectedPurchaseType, setSelectedPurchaseType] = useState<PurchaseType>('FULL_DOWNLOAD');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | 'wallet'>('wallet');
  const [shippingAddress, setShippingAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);

  const paymentMethods = paymobService.getPaymentMethods();

  // Load wallet balance on mount
  useEffect(() => {
    const loadBalance = async () => {
      try {
        const { balance } = await walletService.getBalance();
        setWalletBalance(balance);
      } catch (error) {
        console.error('Failed to load wallet balance:', error);
      } finally {
        setLoadingBalance(false);
      }
    };
    loadBalance();
  }, []);

  const getPriceForType = (type: PurchaseType): number => {
    switch (type) {
      case 'FULL_DOWNLOAD':
        return publication.price;
      case 'PART_DOWNLOAD':
        return publication.partPrice || publication.price;
      case 'VIEW_ONCE':
      case 'VIEW_LIMITED':
      case 'VIEW_PERMANENT':
        return publication.viewPrice || publication.price;
      case 'PHYSICAL_COPY':
        return publication.physicalPrice || publication.price;
      default:
        return publication.price;
    }
  };

  const handleProceedToPayment = () => {
    if (selectedPurchaseType === 'PHYSICAL_COPY' && !shippingAddress) {
      toast.error(isRTL ? 'يرجى إدخال عنوان الشحن' : 'Please enter shipping address');
      return;
    }
    setStep('payment');
  };

  const handleSubmit = async () => {
    setLoading(true);
    const amount = getPriceForType(selectedPurchaseType);

    try {
      // Handle wallet payment
      if (selectedPaymentMethod === 'wallet') {
        // Check balance first
        if (walletBalance < amount) {
          toast.error(isRTL ? 'رصيد المحفظة غير كافٍ' : 'Insufficient wallet balance');
          setLoading(false);
          return;
        }

        // Create purchase record
        const purchaseData: CreatePurchaseRequest = {
          publicationId: publication.id,
          purchaseType: selectedPurchaseType,
          paymentMethod: 'VODAFONE_CASH', // Using this as placeholder for wallet
          shippingAddress: selectedPurchaseType === 'PHYSICAL_COPY' ? shippingAddress : undefined,
        };
        const purchase = await publicationsService.createPurchase(purchaseData);

        // Process wallet payment
        const walletResult = await walletService.processPurchase({
          amount,
          referenceType: 'publication_purchase',
          referenceId: purchase.id,
          description: `Purchase: ${publication.code}`,
          descriptionAr: `شراء: ${publication.code}`,
        });

        if (walletResult.success) {
          // Update purchase status to PAID
          toast.success(isRTL ? 'تم الشراء بنجاح!' : 'Purchase successful!');
          onClose();
          // Navigate to my publications
          window.location.href = '/my-publications';
        } else {
          toast.error(walletResult.errorMessage || (isRTL ? 'فشل في الدفع' : 'Payment failed'));
          setLoading(false);
        }
        return;
      }

      // Handle Paymob payment (card, wallet, kiosk)
      const purchaseData: CreatePurchaseRequest = {
        publicationId: publication.id,
        purchaseType: selectedPurchaseType,
        paymentMethod: selectedPaymentMethod as any,
        shippingAddress: selectedPurchaseType === 'PHYSICAL_COPY' ? shippingAddress : undefined,
      };
      const purchase = await publicationsService.createPurchase(purchaseData);

      // Create payment intention with Paymob
      const paymentResponse = await paymobService.createPayment({
        amount,
        currency: publication.currency || 'EGP',
        orderId: purchase.purchaseNumber,
        description: `${isRTL ? publication.titleAr : publication.title} - ${publication.code}`,
        paymentMethod: selectedPaymentMethod as PaymentMethod,
        firstName: user?.firstName || user?.name?.split(' ')[0] || 'Customer',
        lastName: user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '',
        email: user?.email || '',
        phone: user?.phone || '',
        items: [
          {
            name: publication.code,
            description: isRTL ? publication.titleAr : publication.title,
            amount,
            quantity: 1,
          },
        ],
      });

      // Redirect to Paymob checkout
      toast.success(isRTL ? 'جاري التحويل للدفع...' : 'Redirecting to payment...');
      paymobService.openCheckout(paymentResponse.checkoutUrl);
    } catch (error: any) {
      toast.error(error.response?.data?.message || (isRTL ? 'فشل في إنشاء الطلب' : 'Failed to create purchase'));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-theme-border p-4">
          <h2 className="text-xl font-bold text-theme-primary">
            {isRTL ? 'إتمام الشراء' : 'Complete Purchase'}
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
          <div className="glass-card-dark p-4">
            <div className="flex items-center gap-3">
              {publication.coverImage ? (
                <img
                  src={`${import.meta.env.VITE_API_URL}${publication.coverImage}`}
                  alt={publication.title}
                  className="h-16 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className={`h-16 w-12 rounded-lg flex items-center justify-center bg-gradient-to-br ${typeColors[publication.type]}`}>
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h3 className="font-medium text-theme-primary">
                  {isRTL ? publication.titleAr : publication.title}
                </h3>
                <p className="text-xs text-theme-muted">{publication.code}</p>
              </div>
            </div>
          </div>

          {/* Purchase Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-theme-primary">
              {isRTL ? 'نوع الشراء' : 'Purchase Type'}
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 glass-card-dark rounded-lg cursor-pointer hover:ring-2 hover:ring-[#d4a84b]/30">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="purchaseType"
                    value="FULL_DOWNLOAD"
                    checked={selectedPurchaseType === 'FULL_DOWNLOAD'}
                    onChange={(e) => setSelectedPurchaseType(e.target.value as PurchaseType)}
                    className="text-[#d4a84b]"
                  />
                  <div>
                    <p className="text-sm text-theme-primary">{isRTL ? 'تحميل كامل' : 'Full Download'}</p>
                    <p className="text-xs text-theme-muted">{isRTL ? 'تحميل الملف الكامل' : 'Download the full file'}</p>
                  </div>
                </div>
                <span className="font-bold text-[#d4a84b]">{formatCurrency(publication.price, publication.currency)}</span>
              </label>

              {publication.partPrice && (
                <label className="flex items-center justify-between p-3 glass-card-dark rounded-lg cursor-pointer hover:ring-2 hover:ring-[#d4a84b]/30">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="purchaseType"
                      value="PART_DOWNLOAD"
                      checked={selectedPurchaseType === 'PART_DOWNLOAD'}
                      onChange={(e) => setSelectedPurchaseType(e.target.value as PurchaseType)}
                      className="text-[#d4a84b]"
                    />
                    <div>
                      <p className="text-sm text-theme-primary">{isRTL ? 'تحميل جزء' : 'Part Download'}</p>
                      <p className="text-xs text-theme-muted">{isRTL ? 'تحميل جزء من الملف' : 'Download a section'}</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#d4a84b]">{formatCurrency(publication.partPrice, publication.currency)}</span>
                </label>
              )}

              {publication.viewPrice && (
                <label className="flex items-center justify-between p-3 glass-card-dark rounded-lg cursor-pointer hover:ring-2 hover:ring-[#d4a84b]/30">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="purchaseType"
                      value="VIEW_LIMITED"
                      checked={selectedPurchaseType === 'VIEW_LIMITED'}
                      onChange={(e) => setSelectedPurchaseType(e.target.value as PurchaseType)}
                      className="text-[#d4a84b]"
                    />
                    <div>
                      <p className="text-sm text-theme-primary">{isRTL ? 'تصفح فقط' : 'View Only'}</p>
                      <p className="text-xs text-theme-muted">{isRTL ? 'تصفح بدون تحميل' : 'Online viewing without download'}</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#d4a84b]">{formatCurrency(publication.viewPrice, publication.currency)}</span>
                </label>
              )}

              {publication.physicalPrice && (
                <label className="flex items-center justify-between p-3 glass-card-dark rounded-lg cursor-pointer hover:ring-2 hover:ring-[#d4a84b]/30">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="purchaseType"
                      value="PHYSICAL_COPY"
                      checked={selectedPurchaseType === 'PHYSICAL_COPY'}
                      onChange={(e) => setSelectedPurchaseType(e.target.value as PurchaseType)}
                      className="text-[#d4a84b]"
                    />
                    <div>
                      <p className="text-sm text-theme-primary">{isRTL ? 'نسخة ورقية' : 'Physical Copy'}</p>
                      <p className="text-xs text-theme-muted">{isRTL ? 'شحن نسخة مطبوعة' : 'Printed copy delivery'}</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#d4a84b]">{formatCurrency(publication.physicalPrice, publication.currency)}</span>
                </label>
              )}
            </div>
          </div>

          {/* Shipping Address (for physical copies) */}
          {selectedPurchaseType === 'PHYSICAL_COPY' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-theme-primary">
                {isRTL ? 'عنوان الشحن' : 'Shipping Address'} *
              </label>
              <textarea
                rows={3}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="glass-input w-full"
                placeholder={isRTL ? 'أدخل عنوان الشحن الكامل' : 'Enter full shipping address'}
                required
              />
            </div>
          )}

          {/* Payment Method Selection (Step 2) */}
          {step === 'payment' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-theme-primary">
                {isRTL ? 'طريقة الدفع' : 'Payment Method'}
              </label>
              <div className="space-y-2">
                {/* Wallet Payment Option */}
                <label
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                    selectedPaymentMethod === 'wallet'
                      ? 'bg-[#d4a84b]/20 border-2 border-[#d4a84b]'
                      : 'glass-card-dark hover:ring-2 hover:ring-[#d4a84b]/30'
                  } ${walletBalance < getPriceForType(selectedPurchaseType) ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wallet"
                      checked={selectedPaymentMethod === 'wallet'}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value as 'wallet')}
                      disabled={walletBalance < getPriceForType(selectedPurchaseType)}
                      className="text-[#d4a84b]"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xl">👛</span>
                      <div>
                        <p className="text-sm text-theme-primary">
                          {isRTL ? 'رصيد المحفظة' : 'Wallet Balance'}
                        </p>
                        <p className="text-xs text-theme-muted">
                          {loadingBalance ? '...' : formatCurrency(walletBalance, publication.currency)}
                          {walletBalance < getPriceForType(selectedPurchaseType) && (
                            <span className="text-red-400 mr-2 ml-2">
                              ({isRTL ? 'رصيد غير كافٍ' : 'Insufficient'})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Other Payment Methods */}
                {paymentMethods.map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                      selectedPaymentMethod === method.value
                        ? 'bg-[#d4a84b]/20 border-2 border-[#d4a84b]'
                        : 'glass-card-dark hover:ring-2 hover:ring-[#d4a84b]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={selectedPaymentMethod === method.value}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
                        className="text-[#d4a84b]"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{method.icon}</span>
                        <div>
                          <p className="text-sm text-theme-primary">
                            {isRTL ? method.labelAr : method.labelEn}
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="glass-card-dark p-4 flex items-center justify-between">
            <span className="text-lg font-medium text-theme-primary">{isRTL ? 'الإجمالي' : 'Total'}</span>
            <span className="text-2xl font-bold text-[#d4a84b]">
              {formatCurrency(getPriceForType(selectedPurchaseType), publication.currency)}
            </span>
          </div>

          {step === 'type' && (
            <p className="text-xs text-theme-muted text-center">
              {isRTL
                ? 'اختر نوع الشراء ثم انتقل لاختيار طريقة الدفع'
                : 'Select purchase type then proceed to payment method'}
            </p>
          )}

          {step === 'payment' && (
            <p className="text-xs text-theme-muted text-center">
              {isRTL
                ? 'سيتم تحويلك لصفحة الدفع الآمنة من Paymob'
                : 'You will be redirected to secure Paymob checkout'}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-theme-border p-4">
          <button
            onClick={() => step === 'payment' ? setStep('type') : onClose()}
            className="glass-button px-4 py-2"
            disabled={loading}
          >
            {step === 'payment' ? (isRTL ? 'رجوع' : 'Back') : t('common.cancel')}
          </button>
          
          {step === 'type' ? (
            <button
              onClick={handleProceedToPayment}
              disabled={selectedPurchaseType === 'PHYSICAL_COPY' && !shippingAddress}
              className="btn-premium px-6 py-2 flex items-center gap-2 disabled:opacity-50"
            >
              {isRTL ? 'التالي' : 'Next'}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-premium px-6 py-2 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              {isRTL ? 'الدفع الآن' : 'Pay Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
