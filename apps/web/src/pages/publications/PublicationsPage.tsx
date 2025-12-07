import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { toast } from 'sonner';
import { publicationsService } from '../../services/publications.service';
import type {
  Publication,
  PublicationCategory,
  PublicationType,
  PublicationStatus,
  PublicationFilters,
  CreatePublicationRequest,
  UpdatePublicationRequest,
  CreateCategoryRequest,
} from '../../services/publications.service';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Tag,
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
  Upload,
  FileText,
  Image,
  FolderTree,
  Star,
  Download,
  Archive,
  FileUp,
} from 'lucide-react';

// Status colors
const statusColors: Record<PublicationStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
  PUBLISHED: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  ARCHIVED: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
};

// Type colors
const typeColors: Record<PublicationType, { bg: string; text: string; border: string }> = {
  CODE: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  SPECIFICATION: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  GUIDE: { bg: 'bg-[#d4a84b]/10', text: 'text-[#d4a84b]', border: 'border-[#d4a84b]/30' },
  RESEARCH: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  PUBLICATION: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  OTHER: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
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

// Status labels
const statusLabels: Record<PublicationStatus, { en: string; ar: string }> = {
  DRAFT: { en: 'Draft', ar: 'مسودة' },
  PUBLISHED: { en: 'Published', ar: 'منشور' },
  ARCHIVED: { en: 'Archived', ar: 'مؤرشف' },
};

export function PublicationsPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';

  // State
  const [publications, setPublications] = useState<Publication[]>([]);
  const [categories, setCategories] = useState<PublicationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PublicationStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<PublicationType | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPublicationModal, setShowPublicationModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'pdf' | 'cover' | 'preview'>('pdf');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const limit = 10;

  // Fetch publications
  const fetchPublications = async () => {
    setLoading(true);
    try {
      const filters: PublicationFilters = {
        page,
        limit,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        categoryId: categoryFilter || undefined,
      };

      const response = await publicationsService.getPublications(filters);
      setPublications(response?.data || []);
      setTotalPages(response?.meta?.totalPages || 1);
      setTotal(response?.meta?.total || 0);
    } catch (error) {
      toast.error(isRTL ? 'فشل في تحميل المنشورات' : 'Failed to load publications');
      console.error('Failed to fetch publications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const data = await publicationsService.getCategories(true);
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPublications();
  }, [page, statusFilter, typeFilter, categoryFilter]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchPublications();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle actions
  const handleView = (publication: Publication) => {
    setSelectedPublication(publication);
    setShowViewModal(true);
  };

  const handleDelete = async () => {
    if (!selectedPublication) return;
    setActionLoading('delete');
    try {
      await publicationsService.deletePublication(selectedPublication.id);
      toast.success(isRTL ? 'تم حذف المنشور بنجاح' : 'Publication deleted successfully');
      setShowDeleteModal(false);
      setSelectedPublication(null);
      fetchPublications();
    } catch (error) {
      toast.error(isRTL ? 'فشل في حذف المنشور' : 'Failed to delete publication');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (publication: Publication) => {
    setActionLoading(publication.id);
    try {
      await publicationsService.updatePublication(publication.id, {
        isActive: !publication.isActive,
      });
      toast.success(
        publication.isActive
          ? isRTL ? 'تم إلغاء تفعيل المنشور' : 'Publication deactivated'
          : isRTL ? 'تم تفعيل المنشور' : 'Publication activated'
      );
      fetchPublications();
    } catch (error) {
      toast.error(isRTL ? 'فشل في تحديث الحالة' : 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (publication: Publication) => {
    setActionLoading(`featured-${publication.id}`);
    try {
      await publicationsService.updatePublication(publication.id, {
        isFeatured: !publication.isFeatured,
      });
      toast.success(
        publication.isFeatured
          ? isRTL ? 'تم إزالة التمييز' : 'Removed from featured'
          : isRTL ? 'تم تمييز المنشور' : 'Marked as featured'
      );
      fetchPublications();
    } catch (error) {
      toast.error(isRTL ? 'فشل في تحديث التمييز' : 'Failed to update featured status');
    } finally {
      setActionLoading(null);
    }
  };

  // Format price
  const formatPrice = (price: number, currency = 'EGP') => {
    const locale = isRTL ? 'ar-EG' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total,
      published: publications.filter((p) => p.status === 'PUBLISHED').length,
      draft: publications.filter((p) => p.status === 'DRAFT').length,
    };
  }, [publications, total]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b] to-[#f26522]">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            {isRTL ? 'النشر الرقمي للكودات' : 'Digital Publications'}
          </h1>
          <p className="mt-1 text-sm text-theme-muted">
            {isRTL ? 'إدارة الأكواد والمواصفات والأدلة الفنية' : 'Manage codes, specifications, and technical guides'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchPublications}
            className="glass-button flex items-center gap-2 px-4 py-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </button>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="glass-button flex items-center gap-2 px-4 py-2"
          >
            <FolderTree className="h-4 w-4" />
            <span className="hidden sm:inline">{isRTL ? 'الفئات' : 'Categories'}</span>
          </button>
          <button
            onClick={() => {
              setSelectedPublication(null);
              setShowPublicationModal(true);
            }}
            className="btn-premium flex items-center gap-2 px-4 py-2"
          >
            <Plus className="h-4 w-4" />
            <span>{isRTL ? 'إضافة منشور' : 'Add Publication'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-muted">{isRTL ? 'إجمالي المنشورات' : 'Total Publications'}</p>
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
              <p className="text-sm text-theme-muted">{isRTL ? 'منشور' : 'Published'}</p>
              <p className="text-2xl font-bold text-green-400">{stats.published}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-muted">{isRTL ? 'مسودة' : 'Draft'}</p>
              <p className="text-2xl font-bold text-gray-400">{stats.draft}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-500/20">
              <Archive className="h-6 w-6 text-gray-400" />
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
              placeholder={isRTL ? 'بحث بالعنوان أو الكود...' : 'Search by title or code...'}
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
            {(statusFilter || typeFilter || categoryFilter) && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d4a84b] text-xs text-white">
                {(statusFilter ? 1 : 0) + (typeFilter ? 1 : 0) + (categoryFilter ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-4 border-t border-theme-border pt-4">
            {/* Status Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-theme-muted">{isRTL ? 'الحالة' : 'Status'}</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as PublicationStatus | '');
                  setPage(1);
                }}
                className="glass-input min-w-[150px]"
              >
                <option value="">{t('common.all')}</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {isRTL ? label.ar : label.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-theme-muted">{isRTL ? 'النوع' : 'Type'}</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as PublicationType | '');
                  setPage(1);
                }}
                className="glass-input min-w-[150px]"
              >
                <option value="">{t('common.all')}</option>
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {isRTL ? label.ar : label.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-theme-muted">{isRTL ? 'الفئة' : 'Category'}</label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="glass-input min-w-[150px]"
              >
                <option value="">{t('common.all')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {isRTL ? cat.nameAr : cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(statusFilter || typeFilter || categoryFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setTypeFilter('');
                  setCategoryFilter('');
                  setPage(1);
                }}
                className="self-end text-sm text-[#d4a84b] hover:text-[#f26522] transition-colors"
              >
                {isRTL ? 'مسح الفلاتر' : 'Clear Filters'}
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
        ) : publications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-16 w-16 text-theme-muted opacity-50" />
            <p className="mt-4 text-lg font-medium text-theme-primary">
              {isRTL ? 'لا توجد منشورات' : 'No publications found'}
            </p>
            <p className="mt-1 text-sm text-theme-muted">
              {isRTL ? 'قم بإضافة منشور جديد للبدء' : 'Add a new publication to get started'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-theme-border bg-theme-bg-secondary/50">
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {isRTL ? 'المنشور' : 'Publication'}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {isRTL ? 'النوع' : 'Type'}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {isRTL ? 'السعر' : 'Price'}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {isRTL ? 'الملفات' : 'Files'}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {isRTL ? 'الإحصائيات' : 'Stats'}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-theme-muted">
                      {isRTL ? 'الحالة' : 'Status'}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">
                      {isRTL ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border">
                  {publications.map((publication) => (
                    <tr
                      key={publication.id}
                      className="group transition-colors hover:bg-theme-bg-secondary/30"
                    >
                      {/* Publication Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {publication.coverImage ? (
                            <img
                              src={`${import.meta.env.VITE_API_URL}${publication.coverImage}`}
                              alt={publication.title}
                              className="h-12 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a84b]/20 to-[#f26522]/20">
                              <BookOpen className="h-5 w-5 text-[#d4a84b]" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-theme-primary line-clamp-1">
                              {isRTL ? publication.titleAr : publication.title}
                            </p>
                            <p className="text-xs text-theme-muted flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {publication.code}
                              {publication.isFeatured && (
                                <Star className="h-3 w-3 text-[#d4a84b] fill-[#d4a84b] ml-1" />
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                            typeColors[publication.type].bg
                          } ${typeColors[publication.type].text} ${typeColors[publication.type].border}`}
                        >
                          {isRTL ? typeLabels[publication.type].ar : typeLabels[publication.type].en}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-theme-primary">
                          <DollarSign className="h-4 w-4 text-[#d4a84b]" />
                          <span className="font-medium">{formatPrice(publication.price, publication.currency)}</span>
                        </div>
                      </td>

                      {/* Files */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {publication.filePath ? (
                            <span className="text-green-400" title="PDF uploaded">
                              <FileText className="h-4 w-4" />
                            </span>
                          ) : (
                            <span className="text-gray-500" title="No PDF">
                              <FileText className="h-4 w-4" />
                            </span>
                          )}
                          {publication.coverImage ? (
                            <span className="text-green-400" title="Cover uploaded">
                              <Image className="h-4 w-4" />
                            </span>
                          ) : (
                            <span className="text-gray-500" title="No cover">
                              <Image className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stats */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 text-xs text-theme-muted">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {publication.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {publication.downloadCount}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                              statusColors[publication.status].bg
                            } ${statusColors[publication.status].text} ${statusColors[publication.status].border}`}
                          >
                            {isRTL ? statusLabels[publication.status].ar : statusLabels[publication.status].en}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleView(publication)}
                            className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-theme-bg-secondary hover:text-theme-primary"
                            title={t('common.viewDetails')}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPublication(publication);
                              setShowPublicationModal(true);
                            }}
                            className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-theme-bg-secondary hover:text-[#d4a84b]"
                            title={t('common.edit')}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPublication(publication);
                              setUploadType('pdf');
                              setShowUploadModal(true);
                            }}
                            className="rounded-lg p-2 text-theme-muted transition-colors hover:bg-theme-bg-secondary hover:text-blue-400"
                            title={isRTL ? 'رفع ملفات' : 'Upload files'}
                          >
                            <Upload className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleFeatured(publication)}
                            disabled={actionLoading === `featured-${publication.id}`}
                            className={`rounded-lg p-2 transition-colors ${
                              publication.isFeatured
                                ? 'text-[#d4a84b] hover:bg-[#d4a84b]/10'
                                : 'text-theme-muted hover:bg-theme-bg-secondary hover:text-[#d4a84b]'
                            }`}
                            title={publication.isFeatured ? (isRTL ? 'إزالة التمييز' : 'Remove featured') : (isRTL ? 'تمييز' : 'Mark featured')}
                          >
                            {actionLoading === `featured-${publication.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Star className={`h-4 w-4 ${publication.isFeatured ? 'fill-current' : ''}`} />
                            )}
                          </button>
                          <button
                            onClick={() => handleToggleActive(publication)}
                            disabled={actionLoading === publication.id}
                            className={`rounded-lg p-2 text-theme-muted transition-colors ${
                              publication.isActive
                                ? 'hover:bg-gray-500/10 hover:text-gray-400'
                                : 'hover:bg-green-500/10 hover:text-green-400'
                            }`}
                            title={publication.isActive ? (isRTL ? 'إلغاء التفعيل' : 'Deactivate') : (isRTL ? 'تفعيل' : 'Activate')}
                          >
                            {actionLoading === publication.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : publication.isActive ? (
                              <ToggleRight className="h-4 w-4" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPublication(publication);
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
              {publications.map((publication) => (
                <div key={publication.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {publication.coverImage ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL}${publication.coverImage}`}
                          alt={publication.title}
                          className="h-14 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a84b]/20 to-[#f26522]/20">
                          <BookOpen className="h-6 w-6 text-[#d4a84b]" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-theme-primary line-clamp-1">
                          {isRTL ? publication.titleAr : publication.title}
                        </p>
                        <p className="text-xs text-theme-muted">{publication.code}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        statusColors[publication.status].bg
                      } ${statusColors[publication.status].text} ${statusColors[publication.status].border}`}
                    >
                      {isRTL ? statusLabels[publication.status].ar : statusLabels[publication.status].en}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        typeColors[publication.type].bg
                      } ${typeColors[publication.type].text} ${typeColors[publication.type].border}`}
                    >
                      {isRTL ? typeLabels[publication.type].ar : typeLabels[publication.type].en}
                    </span>
                    <span className="flex items-center gap-1 text-theme-muted">
                      <DollarSign className="h-3 w-3" />
                      {formatPrice(publication.price, publication.currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-theme-border">
                    <div className="flex items-center gap-3 text-xs text-theme-muted">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {publication.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {publication.downloadCount}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleView(publication)}
                        className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPublication(publication);
                          setShowPublicationModal(true);
                        }}
                        className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPublication(publication);
                          setShowUploadModal(true);
                        }}
                        className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
                      >
                        <Upload className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPublication(publication);
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
                  {isRTL ? 'عرض' : 'Showing'} {(page - 1) * limit + 1}-
                  {Math.min(page * limit, total)} {isRTL ? 'من' : 'of'} {total}
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
      {showViewModal && selectedPublication && (
        <PublicationViewModal
          publication={selectedPublication}
          isRTL={isRTL}
          formatPrice={formatPrice}
          onClose={() => {
            setShowViewModal(false);
            setSelectedPublication(null);
          }}
          onEdit={() => {
            setShowViewModal(false);
            setShowPublicationModal(true);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPublication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md mx-4">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <Trash2 className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-theme-primary">
                {isRTL ? 'تأكيد الحذف' : 'Confirm Delete'}
              </h3>
              <p className="mt-2 text-theme-muted">
                {isRTL ? 'هل أنت متأكد من حذف هذا المنشور؟' : 'Are you sure you want to delete this publication?'}
              </p>
              <p className="mt-1 font-medium text-theme-primary">
                {isRTL ? selectedPublication.titleAr : selectedPublication.title}
              </p>
            </div>
            <div className="flex gap-3 border-t border-theme-border p-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPublication(null);
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

      {/* Publication Modal (Create/Edit) */}
      {showPublicationModal && (
        <PublicationFormModal
          publication={selectedPublication}
          categories={categories}
          isRTL={isRTL}
          onClose={() => {
            setShowPublicationModal(false);
            setSelectedPublication(null);
          }}
          onSuccess={() => {
            setShowPublicationModal(false);
            setSelectedPublication(null);
            fetchPublications();
          }}
        />
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          categories={categories}
          isRTL={isRTL}
          onClose={() => setShowCategoryModal(false)}
          onSuccess={fetchCategories}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && selectedPublication && (
        <UploadModal
          publication={selectedPublication}
          isRTL={isRTL}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedPublication(null);
          }}
          onSuccess={() => {
            setShowUploadModal(false);
            setSelectedPublication(null);
            fetchPublications();
          }}
        />
      )}
    </div>
  );
}

// Publication View Modal Component
function PublicationViewModal({
  publication,
  isRTL,
  formatPrice,
  onClose,
  onEdit,
}: {
  publication: Publication;
  isRTL: boolean;
  formatPrice: (price: number, currency?: string) => string;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
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
          <div className="flex items-center gap-4">
            {publication.coverImage ? (
              <img
                src={`${import.meta.env.VITE_API_URL}${publication.coverImage}`}
                alt={publication.title}
                className="h-24 w-20 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-24 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b] to-[#f26522]">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-theme-primary">
                {isRTL ? publication.titleAr : publication.title}
              </h3>
              <p className="text-sm text-theme-muted">{publication.code}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                    typeColors[publication.type].bg
                  } ${typeColors[publication.type].text} ${typeColors[publication.type].border}`}
                >
                  {isRTL ? typeLabels[publication.type].ar : typeLabels[publication.type].en}
                </span>
                {publication.isFeatured && (
                  <Star className="h-4 w-4 text-[#d4a84b] fill-[#d4a84b]" />
                )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card-dark p-4">
              <label className="text-xs text-theme-muted">{isRTL ? 'السعر' : 'Price'}</label>
              <p className="text-theme-primary font-medium mt-1">
                {formatPrice(publication.price, publication.currency)}
              </p>
            </div>
            <div className="glass-card-dark p-4">
              <label className="text-xs text-theme-muted">{isRTL ? 'رقم الطبعة' : 'Edition'}</label>
              <p className="text-theme-primary font-medium mt-1">
                {publication.editionNumber} {publication.editionYear ? `(${publication.editionYear})` : ''}
              </p>
            </div>
            <div className="glass-card-dark p-4">
              <label className="text-xs text-theme-muted">{isRTL ? 'عدد الصفحات' : 'Pages'}</label>
              <p className="text-theme-primary font-medium mt-1">
                {publication.pageCount || '-'}
              </p>
            </div>
            <div className="glass-card-dark p-4">
              <label className="text-xs text-theme-muted">{isRTL ? 'الحالة' : 'Status'}</label>
              <p className="text-theme-primary font-medium mt-1">
                {isRTL ? statusLabels[publication.status].ar : statusLabels[publication.status].en}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card-dark p-4 text-center">
              <Eye className="h-6 w-6 mx-auto text-theme-muted" />
              <p className="text-2xl font-bold text-theme-primary mt-1">{publication.viewCount}</p>
              <p className="text-xs text-theme-muted">{isRTL ? 'مشاهدة' : 'Views'}</p>
            </div>
            <div className="glass-card-dark p-4 text-center">
              <Download className="h-6 w-6 mx-auto text-theme-muted" />
              <p className="text-2xl font-bold text-theme-primary mt-1">{publication.downloadCount}</p>
              <p className="text-xs text-theme-muted">{isRTL ? 'تحميل' : 'Downloads'}</p>
            </div>
            <div className="glass-card-dark p-4 text-center">
              <DollarSign className="h-6 w-6 mx-auto text-theme-muted" />
              <p className="text-2xl font-bold text-theme-primary mt-1">{publication.purchaseCount}</p>
              <p className="text-xs text-theme-muted">{isRTL ? 'شراء' : 'Purchases'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-theme-border p-4">
          <button onClick={onClose} className="glass-button px-4 py-2">
            {t('common.close')}
          </button>
          <button onClick={onEdit} className="btn-premium px-4 py-2 flex items-center gap-2">
            <Edit2 className="h-4 w-4" />
            {t('common.edit')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Publication Form Modal Component
function PublicationFormModal({
  publication,
  categories,
  isRTL,
  onClose,
  onSuccess,
}: {
  publication: Publication | null;
  categories: PublicationCategory[];
  isRTL: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePublicationRequest>({
    title: publication?.title || '',
    titleAr: publication?.titleAr || '',
    description: publication?.description || '',
    descriptionAr: publication?.descriptionAr || '',
    keywords: publication?.keywords || '',
    type: publication?.type || 'CODE',
    code: publication?.code || '',
    partNumber: publication?.partNumber || '',
    partName: publication?.partName || '',
    partNameAr: publication?.partNameAr || '',
    editionNumber: publication?.editionNumber || 1,
    editionYear: publication?.editionYear || new Date().getFullYear(),
    categoryId: publication?.categoryId || '',
    price: publication?.price || 0,
    partPrice: publication?.partPrice || undefined,
    viewPrice: publication?.viewPrice || undefined,
    physicalPrice: publication?.physicalPrice || undefined,
    status: publication?.status || 'DRAFT',
    isActive: publication?.isActive ?? true,
    isFeatured: publication?.isFeatured ?? false,
    pageCount: publication?.pageCount || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (publication) {
        await publicationsService.updatePublication(publication.id, formData);
        toast.success(isRTL ? 'تم تحديث المنشور بنجاح' : 'Publication updated successfully');
      } else {
        await publicationsService.createPublication(formData);
        toast.success(isRTL ? 'تم إنشاء المنشور بنجاح' : 'Publication created successfully');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (isRTL ? 'حدث خطأ' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-theme-border p-4">
          <h2 className="text-xl font-bold text-theme-primary">
            {publication ? (isRTL ? 'تعديل المنشور' : 'Edit Publication') : (isRTL ? 'إضافة منشور جديد' : 'Add New Publication')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-theme-muted">{isRTL ? 'العنوان (إنجليزي)' : 'Title (English)'} *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="glass-input w-full mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-theme-muted">{isRTL ? 'العنوان (عربي)' : 'Title (Arabic)'} *</label>
              <input
                type="text"
                required
                value={formData.titleAr}
                onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                className="glass-input w-full mt-1"
                dir="rtl"
              />
            </div>
          </div>

          {/* Code and Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-theme-muted">{isRTL ? 'الكود' : 'Code'} *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="glass-input w-full mt-1"
                placeholder="e.g., ECP-203"
              />
            </div>
            <div>
              <label className="text-sm text-theme-muted">{isRTL ? 'النوع' : 'Type'} *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PublicationType })}
                className="glass-input w-full mt-1"
              >
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {isRTL ? label.ar : label.en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-theme-muted">{isRTL ? 'الفئة' : 'Category'} *</label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="glass-input w-full mt-1"
              >
                <option value="">{isRTL ? 'اختر الفئة' : 'Select category'}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {isRTL ? cat.nameAr : cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Edition Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-theme-muted">{isRTL ? 'رقم الطبعة' : 'Edition Number'}</label>
              <input
                type="number"
                min="1"
                value={formData.editionNumber}
                onChange={(e) => setFormData({ ...formData, editionNumber: parseInt(e.target.value) || 1 })}
                className="glass-input w-full mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-theme-muted">{isRTL ? 'سنة الإصدار' : 'Edition Year'}</label>
              <input
                type="number"
                min="1900"
                max="2100"
                value={formData.editionYear || ''}
                onChange={(e) => setFormData({ ...formData, editionYear: parseInt(e.target.value) || undefined })}
                className="glass-input w-full mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-theme-muted">{isRTL ? 'عدد الصفحات' : 'Page Count'}</label>
              <input
                type="number"
                min="1"
                value={formData.pageCount || ''}
                onChange={(e) => setFormData({ ...formData, pageCount: parseInt(e.target.value) || undefined })}
                className="glass-input w-full mt-1"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-theme-muted">{isRTL ? 'السعر الكامل' : 'Full Price'} *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="glass-input w-full mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-theme-muted">{isRTL ? 'سعر الجزء' : 'Part Price'}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.partPrice || ''}
                onChange={(e) => setFormData({ ...formData, partPrice: parseFloat(e.target.value) || undefined })}
                className="glass-input w-full mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-theme-muted">{isRTL ? 'سعر التصفح' : 'View Price'}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.viewPrice || ''}
                onChange={(e) => setFormData({ ...formData, viewPrice: parseFloat(e.target.value) || undefined })}
                className="glass-input w-full mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-theme-muted">{isRTL ? 'سعر النسخة الورقية' : 'Physical Price'}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.physicalPrice || ''}
                onChange={(e) => setFormData({ ...formData, physicalPrice: parseFloat(e.target.value) || undefined })}
                className="glass-input w-full mt-1"
              />
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-theme-muted">{isRTL ? 'الوصف (إنجليزي)' : 'Description (English)'}</label>
              <textarea
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="glass-input w-full mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-theme-muted">{isRTL ? 'الوصف (عربي)' : 'Description (Arabic)'}</label>
              <textarea
                rows={3}
                value={formData.descriptionAr || ''}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                className="glass-input w-full mt-1"
                dir="rtl"
              />
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="text-sm text-theme-muted">{isRTL ? 'الكلمات المفتاحية' : 'Keywords'}</label>
            <input
              type="text"
              value={formData.keywords || ''}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              className="glass-input w-full mt-1"
              placeholder={isRTL ? 'افصل بين الكلمات بفاصلة' : 'Separate with commas'}
            />
          </div>

          {/* Status and Flags */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-theme-muted">{isRTL ? 'الحالة' : 'Status'}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PublicationStatus })}
                className="glass-input w-full mt-1"
              >
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {isRTL ? label.ar : label.en}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-theme-border"
                />
                <span className="text-sm text-theme-primary">{isRTL ? 'نشط' : 'Active'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="rounded border-theme-border"
                />
                <span className="text-sm text-theme-primary">{isRTL ? 'مميز' : 'Featured'}</span>
              </label>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-theme-border p-4">
          <button onClick={onClose} className="glass-button px-4 py-2" disabled={loading}>
            {t('common.cancel')}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            }}
            disabled={loading}
            className="btn-premium px-4 py-2 flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {publication ? t('common.save') : (isRTL ? 'إنشاء' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Category Modal Component
function CategoryModal({
  categories,
  isRTL,
  onClose,
  onSuccess,
}: {
  categories: PublicationCategory[];
  isRTL: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PublicationCategory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    code: '',
    sortOrder: 0,
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      code: '',
      sortOrder: 0,
      isActive: true,
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleEdit = (category: PublicationCategory) => {
    setFormData({
      name: category.name,
      nameAr: category.nameAr,
      description: category.description || '',
      descriptionAr: category.descriptionAr || '',
      code: category.code,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingCategory) {
        await publicationsService.updateCategory(editingCategory.id, formData);
        toast.success(isRTL ? 'تم تحديث الفئة بنجاح' : 'Category updated successfully');
      } else {
        await publicationsService.createCategory(formData);
        toast.success(isRTL ? 'تم إنشاء الفئة بنجاح' : 'Category created successfully');
      }
      resetForm();
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (isRTL ? 'حدث خطأ' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذه الفئة؟' : 'Are you sure you want to delete this category?')) {
      return;
    }
    try {
      await publicationsService.deleteCategory(id);
      toast.success(isRTL ? 'تم حذف الفئة بنجاح' : 'Category deleted successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (isRTL ? 'فشل في حذف الفئة' : 'Failed to delete category'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-theme-border p-4">
          <h2 className="text-xl font-bold text-theme-primary">
            {isRTL ? 'إدارة الفئات' : 'Manage Categories'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add/Edit Form */}
          {showForm ? (
            <form onSubmit={handleSubmit} className="glass-card-dark p-4 space-y-4">
              <h3 className="font-medium text-theme-primary">
                {editingCategory ? (isRTL ? 'تعديل الفئة' : 'Edit Category') : (isRTL ? 'إضافة فئة جديدة' : 'Add New Category')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-theme-muted">{isRTL ? 'الاسم (إنجليزي)' : 'Name (English)'} *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="glass-input w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-theme-muted">{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'} *</label>
                  <input
                    type="text"
                    required
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    className="glass-input w-full mt-1"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="text-xs text-theme-muted">{isRTL ? 'الكود' : 'Code'} *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="glass-input w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-theme-muted">{isRTL ? 'الترتيب' : 'Sort Order'}</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="glass-input w-full mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span className="text-sm text-theme-primary">{isRTL ? 'نشط' : 'Active'}</span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={resetForm} className="glass-button px-4 py-2">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={loading} className="btn-premium px-4 py-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingCategory ? t('common.save') : (isRTL ? 'إضافة' : 'Add'))}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="btn-premium w-full py-2 flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {isRTL ? 'إضافة فئة جديدة' : 'Add New Category'}
            </button>
          )}

          {/* Categories List */}
          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-center text-theme-muted py-8">
                {isRTL ? 'لا توجد فئات' : 'No categories found'}
              </p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 glass-card-dark rounded-lg"
                >
                  <div>
                    <p className="font-medium text-theme-primary">
                      {isRTL ? category.nameAr : category.name}
                    </p>
                    <p className="text-xs text-theme-muted">
                      {category.code} • {category._count?.publications || 0} {isRTL ? 'منشور' : 'publications'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!category.isActive && (
                      <span className="text-xs text-gray-400">{isRTL ? 'غير نشط' : 'Inactive'}</span>
                    )}
                    <button
                      onClick={() => handleEdit(category)}
                      className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary hover:text-[#d4a84b]"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="rounded-lg p-2 text-theme-muted hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-theme-border p-4">
          <button onClick={onClose} className="glass-button px-4 py-2">
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Upload Modal Component
function UploadModal({
  publication,
  isRTL,
  onClose,
  onSuccess,
}: {
  publication: Publication;
  isRTL: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpload = async (type: 'pdf' | 'cover' | 'preview', file: File) => {
    setLoading(type);
    try {
      if (type === 'pdf') {
        await publicationsService.uploadPdf(publication.id, file);
      } else if (type === 'cover') {
        await publicationsService.uploadCover(publication.id, file);
      } else {
        await publicationsService.uploadPreview(publication.id, file);
      }
      toast.success(isRTL ? 'تم رفع الملف بنجاح' : 'File uploaded successfully');
      onSuccess();
    } catch (error) {
      toast.error(isRTL ? 'فشل في رفع الملف' : 'Failed to upload file');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg mx-4">
        <div className="flex items-center justify-between border-b border-theme-border p-4">
          <h2 className="text-xl font-bold text-theme-primary">
            {isRTL ? 'رفع ملفات' : 'Upload Files'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-theme-muted hover:bg-theme-bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-theme-muted mb-4">
            {isRTL ? publication.titleAr : publication.title}
          </p>

          {/* PDF Upload */}
          <div className="glass-card-dark p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#d4a84b]" />
                <span className="font-medium text-theme-primary">{isRTL ? 'ملف PDF' : 'PDF File'}</span>
              </div>
              {publication.filePath && (
                <span className="text-xs text-green-400">{isRTL ? 'تم الرفع' : 'Uploaded'}</span>
              )}
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload('pdf', file);
              }}
              disabled={loading !== null}
              className="glass-input w-full text-sm"
            />
            {loading === 'pdf' && (
              <div className="flex items-center gap-2 mt-2 text-theme-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{isRTL ? 'جاري الرفع...' : 'Uploading...'}</span>
              </div>
            )}
          </div>

          {/* Cover Upload */}
          <div className="glass-card-dark p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5 text-[#d4a84b]" />
                <span className="font-medium text-theme-primary">{isRTL ? 'صورة الغلاف' : 'Cover Image'}</span>
              </div>
              {publication.coverImage && (
                <span className="text-xs text-green-400">{isRTL ? 'تم الرفع' : 'Uploaded'}</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload('cover', file);
              }}
              disabled={loading !== null}
              className="glass-input w-full text-sm"
            />
            {loading === 'cover' && (
              <div className="flex items-center gap-2 mt-2 text-theme-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{isRTL ? 'جاري الرفع...' : 'Uploading...'}</span>
              </div>
            )}
          </div>

          {/* Preview Upload */}
          <div className="glass-card-dark p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-[#d4a84b]" />
                <span className="font-medium text-theme-primary">{isRTL ? 'معاينة PDF' : 'Preview PDF'}</span>
              </div>
              {publication.previewPath && (
                <span className="text-xs text-green-400">{isRTL ? 'تم الرفع' : 'Uploaded'}</span>
              )}
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload('preview', file);
              }}
              disabled={loading !== null}
              className="glass-input w-full text-sm"
            />
            {loading === 'preview' && (
              <div className="flex items-center gap-2 mt-2 text-theme-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{isRTL ? 'جاري الرفع...' : 'Uploading...'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-theme-border p-4">
          <button onClick={onClose} className="glass-button px-4 py-2">
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
