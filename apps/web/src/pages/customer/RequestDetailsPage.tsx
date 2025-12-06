import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { requestsService } from '../../services/requests.service';
import { documentsService } from '../../services/documents.service';
import type { ServiceRequest, Document } from '../../types/interfaces';
import {
  RequestStatus,
  RequestPriority,
  getLabel,
  RequestStatusLabels,
  RequestPriorityLabels,
  ServiceCategoryLabels,
  DocumentTypeLabels,
} from '../../types/enums';
import { toast } from 'sonner';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Building2,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Download,
  File,
  Eye,
  Send,
  CreditCard,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

// Status colors
const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  SUBMITTED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  UNDER_REVIEW: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  APPROVED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
  IN_PROGRESS: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
  DELIVERED: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
  ON_HOLD: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

// Priority colors
const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-500/20 text-gray-400',
  MEDIUM: 'bg-blue-500/20 text-blue-400',
  HIGH: 'bg-amber-500/20 text-amber-400',
  URGENT: 'bg-red-500/20 text-red-400',
};

// Timeline status order
const statusOrder: RequestStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'IN_PROGRESS',
  'COMPLETED',
  'DELIVERED',
];

// Get file icon based on type
const getFileIcon = (mimeType: string) => {
  if (mimeType?.includes('pdf')) return '📄';
  if (mimeType?.includes('image')) return '🖼️';
  if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
  if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊';
  if (mimeType?.includes('zip') || mimeType?.includes('archive')) return '📦';
  return '📎';
};

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function RequestDetailsPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const navigate = useNavigate();
  const { id } = useParams();
  const isRTL = language === 'ar';

  // State
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);

  // Fetch request details
  const fetchRequest = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [requestData, docsData] = await Promise.all([
        requestsService.getById(id),
        documentsService.getByRequest(id).catch(() => []),
      ]);
      setRequest(requestData);
      setDocuments(docsData);
    } catch (error) {
      console.error('Failed to fetch request:', error);
      toast.error(t('common.error'));
      navigate('/my-requests');
    } finally {
      setLoading(false);
    }
  }, [id, t, navigate]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format date with time
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  // Download document
  const handleDownload = async (doc: Document) => {
    try {
      await documentsService.download(doc.id, doc.filename);
      toast.success(t('myDocuments.downloadSuccess'));
    } catch (error) {
      console.error('Failed to download:', error);
      toast.error(t('common.error'));
    }
  };

  // Get current step in timeline
  const getCurrentStep = () => {
    if (!request) return 0;
    if (request.status === 'REJECTED' || request.status === 'CANCELLED' || request.status === 'ON_HOLD') {
      return -1;
    }
    return statusOrder.indexOf(request.status as RequestStatus);
  };

  // Generate timeline events
  const getTimelineEvents = () => {
    if (!request) return [];

    const events = [
      {
        status: 'SUBMITTED',
        date: request.createdAt,
        title: isRTL ? 'تم إرسال الطلب' : 'Request Submitted',
        description: isRTL
          ? 'تم إرسال طلبك وسيتم مراجعته قريبًا'
          : 'Your request has been submitted and will be reviewed soon',
        completed: true,
        icon: <Send className="h-4 w-4" />,
      },
    ];

    // Add status-specific events based on current status
    const currentIndex = statusOrder.indexOf(request.status as RequestStatus);

    if (currentIndex >= statusOrder.indexOf('UNDER_REVIEW')) {
      events.push({
        status: 'UNDER_REVIEW',
        date: request.updatedAt,
        title: isRTL ? 'قيد المراجعة' : 'Under Review',
        description: isRTL
          ? 'يتم مراجعة طلبك من قبل فريقنا'
          : 'Your request is being reviewed by our team',
        completed: currentIndex > statusOrder.indexOf('UNDER_REVIEW'),
        icon: <Eye className="h-4 w-4" />,
      });
    }

    if (currentIndex >= statusOrder.indexOf('APPROVED')) {
      events.push({
        status: 'APPROVED',
        date: request.updatedAt,
        title: isRTL ? 'تمت الموافقة' : 'Approved',
        description: isRTL
          ? 'تمت الموافقة على طلبك وسيبدأ العمل عليه قريبًا'
          : 'Your request has been approved and work will begin soon',
        completed: currentIndex > statusOrder.indexOf('APPROVED'),
        icon: <CheckCircle className="h-4 w-4" />,
      });
    }

    if (request.assignedTo && currentIndex >= statusOrder.indexOf('IN_PROGRESS')) {
      events.push({
        status: 'ASSIGNED',
        date: request.assignedAt || request.updatedAt,
        title: isRTL ? 'تم التكليف' : 'Assigned',
        description: isRTL
          ? `تم تكليف ${request.assignedTo.firstName} ${request.assignedTo.lastName} بطلبك`
          : `${request.assignedTo.firstName} ${request.assignedTo.lastName} has been assigned to your request`,
        completed: true,
        icon: <User className="h-4 w-4" />,
      });
    }

    if (currentIndex >= statusOrder.indexOf('IN_PROGRESS')) {
      events.push({
        status: 'IN_PROGRESS',
        date: request.updatedAt,
        title: isRTL ? 'قيد التنفيذ' : 'In Progress',
        description: isRTL
          ? 'يتم العمل على طلبك حاليًا'
          : 'Your request is currently being worked on',
        completed: currentIndex > statusOrder.indexOf('IN_PROGRESS'),
        icon: <Loader2 className="h-4 w-4" />,
      });
    }

    if (currentIndex >= statusOrder.indexOf('COMPLETED')) {
      events.push({
        status: 'COMPLETED',
        date: request.completedAt || request.updatedAt,
        title: isRTL ? 'مكتمل' : 'Completed',
        description: isRTL
          ? 'تم إكمال العمل على طلبك'
          : 'Work on your request has been completed',
        completed: currentIndex > statusOrder.indexOf('COMPLETED'),
        icon: <CheckCircle className="h-4 w-4" />,
      });
    }

    if (currentIndex >= statusOrder.indexOf('DELIVERED')) {
      events.push({
        status: 'DELIVERED',
        date: request.deliveredAt || request.updatedAt,
        title: isRTL ? 'تم التسليم' : 'Delivered',
        description: isRTL
          ? 'تم تسليم نتائج طلبك'
          : 'Your request results have been delivered',
        completed: true,
        icon: <FileText className="h-4 w-4" />,
      });
    }

    // Special statuses
    if (request.status === 'REJECTED') {
      events.push({
        status: 'REJECTED',
        date: request.updatedAt,
        title: isRTL ? 'مرفوض' : 'Rejected',
        description:
          (language === 'ar' ? request.rejectionReasonAr : request.rejectionReason) ||
          (isRTL ? 'تم رفض طلبك' : 'Your request has been rejected'),
        completed: true,
        icon: <XCircle className="h-4 w-4" />,
      });
    }

    if (request.status === 'CANCELLED') {
      events.push({
        status: 'CANCELLED',
        date: request.updatedAt,
        title: isRTL ? 'ملغي' : 'Cancelled',
        description:
          (language === 'ar' ? request.cancellationReasonAr : request.cancellationReason) ||
          (isRTL ? 'تم إلغاء طلبك' : 'Your request has been cancelled'),
        completed: true,
        icon: <XCircle className="h-4 w-4" />,
      });
    }

    if (request.status === 'ON_HOLD') {
      events.push({
        status: 'ON_HOLD',
        date: request.updatedAt,
        title: isRTL ? 'معلق' : 'On Hold',
        description: isRTL
          ? 'طلبك معلق مؤقتًا'
          : 'Your request is temporarily on hold',
        completed: true,
        icon: <AlertCircle className="h-4 w-4" />,
      });
    }

    return events;
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#f26522]" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
        <FileText className="mb-4 h-16 w-16 text-white/20" />
        <h3 className="text-lg font-medium text-white">
          {isRTL ? 'الطلب غير موجود' : 'Request Not Found'}
        </h3>
        <Link to="/my-requests" className="mt-4 text-[#f26522] hover:underline">
          {isRTL ? 'العودة إلى طلباتي' : 'Back to My Requests'}
        </Link>
      </div>
    );
  }

  const timelineEvents = getTimelineEvents();

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#a0592b] to-[#f26522]">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-white/60">#{request.requestNumber}</span>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusColors[request.status]}`}
                >
                  {getLabel(RequestStatusLabels, request.status, language)}
                </span>
                <span className={`rounded-full px-2 py-1 text-xs ${priorityColors[request.priority]}`}>
                  {getLabel(RequestPriorityLabels, request.priority, language)}
                </span>
              </div>
              <h1 className="mt-1 text-xl font-bold text-white">
                {language === 'ar' ? request.titleAr : request.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/60">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(request.createdAt)}
                </span>
                {request.service && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {language === 'ar' ? request.service.nameAr : request.service.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              to="/my-requests"
              className="glass-button flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white"
            >
              {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              <span>{t('common.back')}</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Timeline */}
          <div className="glass-card p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
              <Clock className="h-5 w-5 text-[#f26522]" />
              {isRTL ? 'تتبع الطلب' : 'Request Timeline'}
            </h2>

            <div className="relative">
              {/* Timeline line */}
              <div
                className="absolute top-0 bottom-0 w-px bg-white/20"
                style={{ left: isRTL ? 'auto' : '11px', right: isRTL ? '11px' : 'auto' }}
              />

              {/* Timeline events */}
              <div className="space-y-6">
                {timelineEvents.map((event, index) => (
                  <div key={index} className="relative flex gap-4">
                    {/* Timeline dot */}
                    <div
                      className={`relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                        event.status === 'REJECTED' || event.status === 'CANCELLED'
                          ? 'bg-red-500'
                          : event.status === 'ON_HOLD'
                          ? 'bg-orange-500'
                          : event.completed
                          ? 'bg-[#f26522]'
                          : 'bg-white/20'
                      }`}
                    >
                      {event.completed ? (
                        <CheckCircle className="h-3 w-3 text-white" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-white/60" />
                      )}
                    </div>

                    {/* Event content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            event.status === 'REJECTED' || event.status === 'CANCELLED'
                              ? 'text-red-400'
                              : 'text-white'
                          }`}
                        >
                          {event.title}
                        </span>
                        {index === timelineEvents.length - 1 && request.status !== 'DELIVERED' && (
                          <span className="rounded bg-[#f26522]/20 px-2 py-0.5 text-xs text-[#f26522]">
                            {isRTL ? 'الحالة الحالية' : 'Current'}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-white/60">{event.description}</p>
                      <p className="mt-1 text-xs text-white/40">{formatDateTime(event.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          {(request.description || request.descriptionAr) && (
            <div className="glass-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">
                {isRTL ? 'الوصف' : 'Description'}
              </h2>
              <p className="text-white/80">
                {language === 'ar' ? request.descriptionAr : request.description}
              </p>
            </div>
          )}

          {/* Notes */}
          {(request.notes || request.notesAr) && (
            <div className="glass-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <MessageSquare className="h-5 w-5 text-[#f26522]" />
                {isRTL ? 'ملاحظات' : 'Notes'}
              </h2>
              <p className="text-white/80">
                {language === 'ar' ? request.notesAr : request.notes}
              </p>
            </div>
          )}

          {/* Documents */}
          <div className="glass-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <File className="h-5 w-5 text-[#f26522]" />
              {isRTL ? 'المستندات' : 'Documents'}
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                {documents.length}
              </span>
            </h2>

            {documents.length === 0 ? (
              <p className="text-center text-white/60">
                {isRTL ? 'لا توجد مستندات' : 'No documents attached'}
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFileIcon(doc.mimetype)}</span>
                      <div>
                        <p className="font-medium text-white">
                          {doc.title || doc.filename}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-white/60">
                          <span>{formatFileSize(doc.size)}</span>
                          <span>{getLabel(DocumentTypeLabels, doc.type, language)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="glass-button p-2 text-white/70 hover:text-white"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Service Info */}
          {request.service && (
            <div className="glass-card p-6">
              <h3 className="mb-4 text-sm font-medium text-white/60">
                {isRTL ? 'الخدمة' : 'Service'}
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b]/20 to-[#f26522]/20">
                  <Building2 className="h-6 w-6 text-[#f26522]" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    {language === 'ar' ? request.service.nameAr : request.service.name}
                  </p>
                  <p className="text-xs text-white/60">
                    {getLabel(ServiceCategoryLabels, request.service.category, language)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="glass-card p-6">
            <h3 className="mb-4 text-sm font-medium text-white/60">
              {isRTL ? 'التكلفة' : 'Cost'}
            </h3>
            <div className="space-y-3">
              {request.estimatedPrice && (
                <div className="flex justify-between">
                  <span className="text-white/60">{isRTL ? 'السعر التقديري' : 'Estimated'}</span>
                  <span className="text-white">{formatCurrency(request.estimatedPrice)}</span>
                </div>
              )}
              {request.finalPrice && (
                <div className="flex justify-between border-t border-white/10 pt-3">
                  <span className="font-medium text-white">{isRTL ? 'السعر النهائي' : 'Final'}</span>
                  <span className="text-lg font-bold text-[#f26522]">
                    {formatCurrency(request.finalPrice)}
                  </span>
                </div>
              )}
              {!request.estimatedPrice && !request.finalPrice && (
                <p className="text-center text-white/60">
                  {isRTL ? 'سيتم تحديد السعر لاحقًا' : 'Price to be determined'}
                </p>
              )}
            </div>
          </div>

          {/* Assigned To */}
          {request.assignedTo && (
            <div className="glass-card p-6">
              <h3 className="mb-4 text-sm font-medium text-white/60">
                {isRTL ? 'المسؤول' : 'Assigned To'}
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#a0592b]/20 to-[#f26522]/20">
                  <User className="h-5 w-5 text-[#f26522]" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    {request.assignedTo.firstName} {request.assignedTo.lastName}
                  </p>
                  <p className="text-xs text-white/60">{request.assignedTo.position}</p>
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="glass-card p-6">
            <h3 className="mb-4 text-sm font-medium text-white/60">
              {isRTL ? 'التواريخ' : 'Dates'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-white/40" />
                <div>
                  <p className="text-xs text-white/40">{isRTL ? 'تاريخ الطلب' : 'Request Date'}</p>
                  <p className="text-white">{formatDate(request.createdAt)}</p>
                </div>
              </div>
              {request.expectedDate && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-white/40" />
                  <div>
                    <p className="text-xs text-white/40">{isRTL ? 'التاريخ المتوقع' : 'Expected'}</p>
                    <p className="text-white">{formatDate(request.expectedDate)}</p>
                  </div>
                </div>
              )}
              {request.completedAt && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-xs text-white/40">{isRTL ? 'تاريخ الإكمال' : 'Completed'}</p>
                    <p className="text-white">{formatDate(request.completedAt)}</p>
                  </div>
                </div>
              )}
              {request.deliveredAt && (
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-teal-400" />
                  <div>
                    <p className="text-xs text-white/40">{isRTL ? 'تاريخ التسليم' : 'Delivered'}</p>
                    <p className="text-white">{formatDate(request.deliveredAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {request.invoice && request.invoice.status !== 'PAID' && (
            <div className="glass-card p-6">
              <h3 className="mb-4 text-sm font-medium text-white/60">
                {isRTL ? 'إجراءات' : 'Actions'}
              </h3>
              <Link
                to={`/payment/${request.invoice.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a0592b] to-[#f26522] px-4 py-3 font-semibold text-white transition-all hover:scale-105"
              >
                <CreditCard className="h-5 w-5" />
                <span>{isRTL ? 'دفع الفاتورة' : 'Pay Invoice'}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
