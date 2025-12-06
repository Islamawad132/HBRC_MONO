import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { documentsService } from '../../services/documents.service';
import type { Document } from '../../types/interfaces';
import { DocumentType, getLabel } from '../../types/enums';
import { toast } from 'sonner';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Download,
  File,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  HardDrive,
  FolderOpen,
} from 'lucide-react';

// Document type colors
const typeColors: Record<string, string> = {
  CONTRACT: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  REPORT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  CERTIFICATE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  INVOICE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  OTHER: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

// File icon based on mime type
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  if (mimeType.includes('zip') || mimeType.includes('archive')) return FileArchive;
  return File;
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function MyDocumentsPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';

  // State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    totalSize: 0,
  });

  // Fetch my documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await documentsService.getAll({
        page: currentPage,
        limit: 10,
        type: typeFilter as DocumentType || undefined,
        search: searchQuery || undefined,
      });
      const data = response?.data || [];
      setDocuments(data);
      setTotalCount(response?.total || 0);
      setTotalPages(response?.totalPages || 1);

      // Calculate stats
      if (currentPage === 1) {
        const totalSize = data.reduce((acc, doc) => acc + (doc.size || 0), 0);
        setStats({
          total: response?.total || 0,
          totalSize,
        });
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, typeFilter, t]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleView = (document: Document) => {
    setSelectedDocument(document);
    setShowViewModal(true);
  };

  const handleDownload = async (document: Document) => {
    try {
      await documentsService.download(document.id, document.filename);
      toast.success(t('myDocuments.downloadSuccess'));
    } catch (error) {
      console.error('Failed to download document:', error);
      toast.error(t('common.error'));
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b] to-[#f26522]">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('myDocuments.title')}</h1>
          <p className="text-sm text-white/60">{t('myDocuments.subtitle')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('myDocuments.totalDocuments')}</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
              <FolderOpen className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('myDocuments.totalSize')}</p>
              <p className="text-2xl font-bold text-emerald-400">{formatFileSize(stats.totalSize)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
              <HardDrive className="h-6 w-6 text-emerald-400" />
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
              placeholder={t('myDocuments.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`glass-input w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-white/40" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="glass-input min-w-[150px]"
            >
              <option value="">{t('myDocuments.allTypes')}</option>
              {Object.values(DocumentType).map((type) => (
                <option key={type} value={type}>
                  {getLabel('DocumentType', type, language)}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || typeFilter) && (
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
      ) : documents.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
          <FileText className="mb-4 h-16 w-16 text-white/20" />
          <h3 className="text-lg font-medium text-white">{t('myDocuments.noDocuments')}</h3>
          <p className="mt-1 text-sm text-white/60">{t('myDocuments.noDocumentsDescription')}</p>
        </div>
      ) : (
        <>
          {/* Documents Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((document) => {
              const FileIcon = getFileIcon(document.mimeType);
              return (
                <div key={document.id} className="glass-card p-4 transition-colors hover:bg-white/5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <FileIcon className="h-6 w-6 text-white/60" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-white">
                        {language === 'ar' && document.titleAr ? document.titleAr : document.title}
                      </h3>
                      <p className="truncate text-sm text-white/60">{document.filename}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-white/40">
                        <span>{formatFileSize(document.size)}</span>
                        <span>•</span>
                        <span>{formatDate(document.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${typeColors[document.type] || typeColors.OTHER}`}
                    >
                      {getLabel('DocumentType', document.type, language)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleView(document)}
                        className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                        title={t('common.viewDetails')}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(document)}
                        className="rounded-lg p-2 text-white/60 hover:bg-emerald-500/20 hover:text-emerald-400"
                        title={t('myDocuments.download')}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="glass-card flex items-center justify-between p-4">
              <p className="text-sm text-white/60">
                {t('myDocuments.showing')} {(currentPage - 1) * 10 + 1}-
                {Math.min(currentPage * 10, totalCount)} {t('myDocuments.of')} {totalCount}
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
      {showViewModal && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{t('myDocuments.documentDetails')}</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedDocument(null);
                }}
                className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/10">
                  {(() => {
                    const FileIcon = getFileIcon(selectedDocument.mimeType);
                    return <FileIcon className="h-8 w-8 text-white/60" />;
                  })()}
                </div>
                <div>
                  <p className="text-lg font-medium text-white">
                    {language === 'ar' && selectedDocument.titleAr
                      ? selectedDocument.titleAr
                      : selectedDocument.title}
                  </p>
                  <p className="text-sm text-white/60">{selectedDocument.filename}</p>
                  <span
                    className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColors[selectedDocument.type]}`}
                  >
                    {getLabel('DocumentType', selectedDocument.type, language)}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 rounded-lg bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-5 w-5 text-white/40" />
                  <div>
                    <p className="text-xs text-white/40">{t('myDocuments.size')}</p>
                    <p className="text-white">{formatFileSize(selectedDocument.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-white/40" />
                  <div>
                    <p className="text-xs text-white/40">{t('myDocuments.uploadedAt')}</p>
                    <p className="text-white">{formatDate(selectedDocument.createdAt)}</p>
                  </div>
                </div>
                {selectedDocument.description && (
                  <div className="flex items-start gap-3">
                    <FileText className="mt-1 h-5 w-5 text-white/40" />
                    <div>
                      <p className="text-xs text-white/40">{t('myDocuments.description')}</p>
                      <p className="text-white">
                        {language === 'ar' && selectedDocument.descriptionAr
                          ? selectedDocument.descriptionAr
                          : selectedDocument.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedDocument(null);
                }}
                className="glass-button px-4 py-2 text-white/70 hover:text-white"
              >
                {t('common.close')}
              </button>
              <button
                onClick={() => handleDownload(selectedDocument)}
                className="glass-button flex items-center gap-2 bg-gradient-to-r from-[#a0592b] to-[#f26522] px-4 py-2 text-white"
              >
                <Download className="h-4 w-4" />
                {t('myDocuments.download')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
