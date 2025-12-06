import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { requestsService } from '../../services/requests.service';
import { invoicesService } from '../../services/invoices.service';
import { servicesService } from '../../services/services.service';
import { notificationsService } from '../../services/notifications.service';
import type { ServiceRequest, Invoice, Service, Notification } from '../../types/interfaces';
import { RequestStatus, InvoiceStatus, getLabel, RequestStatusLabels, ServiceCategoryLabels } from '../../types/enums';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
  CreditCard,
  Bell,
  ArrowRight,
  ArrowLeft,
  Plus,
  Eye,
  Calendar,
  Loader2,
  TrendingUp,
  FileCheck,
  ClipboardList,
  FolderOpen,
  Building2,
  Sparkles,
} from 'lucide-react';

// Status colors for requests
const requestStatusColors: Record<string, string> = {
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

// Status icons
const statusIcons: Record<string, React.ReactNode> = {
  DRAFT: <FileText className="h-4 w-4" />,
  SUBMITTED: <Clock className="h-4 w-4" />,
  UNDER_REVIEW: <Eye className="h-4 w-4" />,
  APPROVED: <CheckCircle className="h-4 w-4" />,
  REJECTED: <XCircle className="h-4 w-4" />,
  IN_PROGRESS: <Loader2 className="h-4 w-4 animate-spin" />,
  COMPLETED: <CheckCircle className="h-4 w-4" />,
  DELIVERED: <FileCheck className="h-4 w-4" />,
  CANCELLED: <XCircle className="h-4 w-4" />,
  ON_HOLD: <AlertCircle className="h-4 w-4" />,
};

export function CustomerDashboardPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRTL = language === 'ar';

  // State
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0,
    totalInvoices: 0,
    unpaidInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
  });

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch data in parallel
      const [requestsRes, invoicesRes, servicesRes, notificationsRes] = await Promise.all([
        requestsService.getMyRequests({ limit: 5 }),
        invoicesService.getMyInvoices({ limit: 5 }),
        servicesService.getActiveServices(),
        notificationsService.getMyNotifications({ limit: 5 }),
      ]);

      // Set data
      setRequests(requestsRes?.data || []);
      setInvoices(invoicesRes?.data || []);
      setServices(servicesRes || []);
      setNotifications(notificationsRes?.notifications || []);
      setUnreadCount(notificationsRes?.unread || 0);

      // Calculate stats
      const allRequests = requestsRes?.data || [];
      const allInvoices = invoicesRes?.data || [];

      const pendingStatuses = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'];
      const inProgressStatuses = ['APPROVED', 'IN_PROGRESS'];
      const completedStatuses = ['COMPLETED', 'DELIVERED'];

      const pending = allRequests.filter((r) => pendingStatuses.includes(r.status)).length;
      const inProgress = allRequests.filter((r) => inProgressStatuses.includes(r.status)).length;
      const completed = allRequests.filter((r) => completedStatuses.includes(r.status)).length;

      const unpaidInvoices = allInvoices.filter(
        (inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED'
      ).length;
      const totalAmount = allInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const paidAmount = allInvoices
        .filter((inv) => inv.status === 'PAID')
        .reduce((sum, inv) => sum + (inv.total || 0), 0);

      setStats({
        totalRequests: requestsRes?.total || 0,
        pendingRequests: pending,
        inProgressRequests: inProgress,
        completedRequests: completed,
        totalInvoices: invoicesRes?.total || 0,
        unpaidInvoices,
        totalAmount,
        paidAmount,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 18) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  // Quick actions for customers
  const quickActions = [
    {
      icon: <Plus className="h-5 w-5" />,
      label: t('dashboard.requestService'),
      description: isRTL ? 'اطلب خدمة جديدة' : 'Request a new service',
      href: '/services-catalog',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: <ClipboardList className="h-5 w-5" />,
      label: t('dashboard.trackRequests'),
      description: isRTL ? 'تتبع طلباتك الحالية' : 'Track your current requests',
      href: '/my-requests',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: t('dashboard.payInvoice'),
      description: isRTL ? 'سدد فواتيرك المستحقة' : 'Pay your pending invoices',
      href: '/my-invoices',
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      icon: <FolderOpen className="h-5 w-5" />,
      label: t('sidebar.myDocuments'),
      description: isRTL ? 'عرض شهاداتك ومستنداتك' : 'View your certificates',
      href: '/my-documents',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#f26522]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Welcome Header */}
      <div className="glass-card overflow-hidden p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#a0592b] to-[#f26522]">
              <LayoutDashboard className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-white/60">{getGreeting()}</p>
              <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
              <p className="text-sm text-white/50">{t('dashboard.customerOverview')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/services-catalog"
              className="glass-button flex items-center gap-2 bg-gradient-to-r from-[#a0592b] to-[#f26522] px-6 py-3 font-semibold text-white transition-all hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              <span>{t('myRequests.newRequest')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Requests */}
        <div className="glass-card group p-4 transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('myRequests.totalRequests')}</p>
              <p className="text-3xl font-bold text-white">{stats.totalRequests}</p>
              <p className="mt-1 text-xs text-white/40">
                {stats.completedRequests} {t('dashboard.completed')}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 transition-all group-hover:scale-110">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="glass-card group p-4 transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('myRequests.pending')}</p>
              <p className="text-3xl font-bold text-amber-400">{stats.pendingRequests}</p>
              <p className="mt-1 text-xs text-white/40">
                {stats.inProgressRequests} {t('dashboard.inProgress')}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 transition-all group-hover:scale-110">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Total Amount */}
        <div className="glass-card group p-4 transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('myInvoices.totalAmount')}</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalAmount)}</p>
              <p className="mt-1 text-xs text-emerald-400">
                {formatCurrency(stats.paidAmount)} {t('myInvoices.paid')}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 transition-all group-hover:scale-110">
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Unpaid Invoices */}
        <div className="glass-card group p-4 transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('myInvoices.pending')}</p>
              <p className="text-3xl font-bold text-red-400">{stats.unpaidInvoices}</p>
              <p className="mt-1 text-xs text-white/40">
                {t('myInvoices.totalInvoices')}: {stats.totalInvoices}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 transition-all group-hover:scale-110">
              <Receipt className="h-6 w-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Sparkles className="h-5 w-5 text-[#f26522]" />
          {t('dashboard.quickActions')}
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.href}
              className={`group rounded-xl ${action.bgColor} p-4 transition-all hover:scale-[1.02] hover:bg-opacity-20`}
            >
              <div
                className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.color}`}
              >
                {action.icon}
              </div>
              <h3 className="font-medium text-white">{action.label}</h3>
              <p className="mt-1 text-xs text-white/50">{action.description}</p>
              <div className="mt-3 flex items-center gap-1 text-sm text-white/60 group-hover:text-white">
                <span>{isRTL ? 'اذهب' : 'Go'}</span>
                <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Requests */}
        <div className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <ClipboardList className="h-5 w-5 text-[#f26522]" />
              {isRTL ? 'آخر الطلبات' : 'Recent Requests'}
            </h2>
            <Link
              to="/my-requests"
              className="flex items-center gap-1 text-sm text-white/60 transition-colors hover:text-white"
            >
              <span>{t('common.viewAll')}</span>
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>

          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="mb-3 h-12 w-12 text-white/20" />
              <p className="text-white/60">{t('myRequests.noRequests')}</p>
              <Link
                to="/services-catalog"
                className="mt-3 text-sm text-[#f26522] hover:underline"
              >
                {t('myRequests.createFirst')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => navigate(`/my-requests/${request.id}`)}
                  className="group cursor-pointer rounded-lg bg-white/5 p-3 transition-all hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-white/60">
                          #{request.requestNumber}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${requestStatusColors[request.status]}`}
                        >
                          {statusIcons[request.status]}
                          {getLabel(RequestStatusLabels, request.status, language)}
                        </span>
                      </div>
                      <p className="mt-1 truncate font-medium text-white">
                        {language === 'ar' ? request.titleAr : request.title}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-white/50">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(request.createdAt)}
                        </span>
                        {request.service && (
                          <span className="truncate">
                            {language === 'ar' ? request.service.nameAr : request.service.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowIcon className="h-5 w-5 text-white/30 transition-all group-hover:text-white group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Receipt className="h-5 w-5 text-[#f26522]" />
              {isRTL ? 'آخر الفواتير' : 'Recent Invoices'}
            </h2>
            <Link
              to="/my-invoices"
              className="flex items-center gap-1 text-sm text-white/60 transition-colors hover:text-white"
            >
              <span>{t('common.viewAll')}</span>
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>

          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Receipt className="mb-3 h-12 w-12 text-white/20" />
              <p className="text-white/60">{t('myInvoices.noInvoices')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  onClick={() => navigate('/my-invoices')}
                  className="group cursor-pointer rounded-lg bg-white/5 p-3 transition-all hover:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-white/60">
                          #{invoice.invoiceNumber}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${
                            invoice.status === 'PAID'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : invoice.status === 'OVERDUE'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {getLabel('InvoiceStatus', invoice.status, language)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-white/50">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(invoice.createdAt)}
                        </span>
                        {invoice.dueDate && (
                          <span>
                            {isRTL ? 'الاستحقاق:' : 'Due:'} {formatDate(invoice.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{formatCurrency(invoice.total)}</p>
                      {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/my-invoices');
                          }}
                          className="mt-1 text-xs text-[#f26522] hover:underline"
                        >
                          {t('myInvoices.payNow')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Available Services Preview */}
      <div className="glass-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Building2 className="h-5 w-5 text-[#f26522]" />
            {isRTL ? 'الخدمات المتاحة' : 'Available Services'}
          </h2>
          <Link
            to="/services-catalog"
            className="flex items-center gap-1 text-sm text-white/60 transition-colors hover:text-white"
          >
            <span>{t('common.viewAll')}</span>
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>

        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Building2 className="mb-3 h-12 w-12 text-white/20" />
            <p className="text-white/60">{isRTL ? 'لا توجد خدمات متاحة' : 'No services available'}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 6).map((service) => (
              <div
                key={service.id}
                onClick={() => navigate('/services-catalog')}
                className="group cursor-pointer rounded-xl bg-white/5 p-4 transition-all hover:bg-white/10"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#a0592b]/20 to-[#f26522]/20">
                    <Building2 className="h-5 w-5 text-[#f26522]" />
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                    {getLabel(ServiceCategoryLabels, service.category, language)}
                  </span>
                </div>
                <h3 className="font-medium text-white">
                  {language === 'ar' ? service.nameAr : service.name}
                </h3>
                {service.basePrice && (
                  <p className="mt-1 text-sm text-[#f26522]">
                    {isRTL ? 'من' : 'From'} {formatCurrency(service.basePrice)}
                  </p>
                )}
                {service.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-white/50">
                    {language === 'ar' ? service.descriptionAr : service.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Bell className="h-5 w-5 text-[#f26522]" />
              {t('common.notifications')}
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </h2>
          </div>
          <div className="space-y-2">
            {notifications.slice(0, 3).map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg p-3 ${
                  notification.status !== 'READ' ? 'bg-[#f26522]/10' : 'bg-white/5'
                }`}
              >
                <p className="text-sm text-white">
                  {language === 'ar' ? notification.titleAr : notification.title}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  {language === 'ar' ? notification.messageAr : notification.message}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {formatDate(notification.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
