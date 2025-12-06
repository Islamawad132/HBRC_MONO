import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { dashboardService } from '../../services/dashboard.service';
import {
  Users,
  FileText,
  ClipboardList,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Activity,
  Calendar,
  BarChart3,
  PieChart,
} from 'lucide-react';

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  gradient: string;
  href?: string;
  delay?: number;
  fromLastMonthText?: string;
  viewDetailsText?: string;
  isRTL?: boolean;
}

function StatsCard({ title, value, change, icon: Icon, gradient, href, delay = 0, fromLastMonthText, viewDetailsText, isRTL }: StatsCardProps) {
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const content = (
    <div
      className="stats-card group hover-lift animate-fade-in h-full"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient Glow */}
      <div
        className={`absolute -inset-1 rounded-2xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-30 ${gradient}`}
      />

      {/* Content */}
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-theme-muted">{title}</p>
          <p className="mt-2 text-3xl font-bold text-theme-primary">{value}</p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {change >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              <span className={change >= 0 ? 'text-green-400' : 'text-red-400'}>
                {change >= 0 ? '+' : ''}
                {change}%
              </span>
              <span className="text-xs text-theme-muted">{fromLastMonthText}</span>
            </div>
          )}
        </div>

        <div className="relative">
          <div className={`absolute inset-0 rounded-xl blur-lg opacity-50 ${gradient}`} />
          <div
            className={`relative flex h-14 w-14 items-center justify-center rounded-xl ${gradient} shadow-lg`}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
      </div>

      {/* Link Arrow */}
      {href && (
        <div className="mt-4 flex items-center gap-2 text-theme-muted group-hover:text-theme-secondary transition-colors">
          <span className="text-sm">{viewDetailsText}</span>
          <ArrowIcon className={`h-4 w-4 transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}

// Activity Item Component
interface ActivityItemProps {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
  time: string;
}

function ActivityItem({ type, title, description, time }: ActivityItemProps) {
  const icons = {
    success: CheckCircle2,
    warning: AlertCircle,
    error: XCircle,
    info: Activity,
  };

  const colors = {
    success: 'text-green-400 bg-green-500/10',
    warning: 'text-yellow-400 bg-yellow-500/10',
    error: 'text-red-400 bg-red-500/10',
    info: 'text-blue-400 bg-blue-500/10',
  };

  const Icon = icons[type];

  return (
    <div className="flex items-start gap-4 py-3 border-b border-theme-primary/5 last:border-0">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[type]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-theme-primary">{title}</p>
        <p className="text-xs text-theme-muted mt-0.5 truncate">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-theme-muted">
        <Clock className="h-3 w-3" />
        <span>{time}</span>
      </div>
    </div>
  );
}

// Quick Action Button
interface QuickActionItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  gradient: string;
}

function QuickActionItem({ icon: Icon, label, href, gradient }: QuickActionItemProps) {
  return (
    <Link
      to={href}
      className="group glass-card-dark p-4 text-center hover-lift transition-all"
    >
      <div
        className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${gradient} shadow-lg transition-transform group-hover:scale-110`}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>
      <p className="text-sm font-medium text-theme-secondary group-hover:text-theme-primary transition-colors">
        {label}
      </p>
    </Link>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const { user, userType } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const isRTL = language === 'ar';
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalServices: 0,
    totalRequests: 0,
    totalRevenue: 0,
    pendingRequests: 0,
    completedRequests: 0,
    monthlyGrowth: 0,
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  // Live clock update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardStats = async () => {
    try {
      const data = await dashboardService.getStats();
      setStats({
        totalCustomers: data.totalCustomers || 0,
        totalServices: data.totalServices || 0,
        totalRequests: data.totalRequests || 0,
        totalRevenue: data.totalRevenue || 0,
        pendingRequests: data.pendingRequests || 0,
        completedRequests: data.completedRequests || 0,
        monthlyGrowth: data.monthlyGrowth || 0,
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    const locale = language === 'ar' ? 'ar-EG' : 'en-EG';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.NumberFormat(locale).format(num);
  };

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 18) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  // Recent activities (mock data - would come from API)
  const recentActivities: ActivityItemProps[] = [
    {
      type: 'success',
      title: t('activity.newRequestCompleted'),
      description: t('activity.buildingInspectionCompleted'),
      time: t('activity.minutesAgo', { count: 5 }),
    },
    {
      type: 'info',
      title: t('activity.newCustomer'),
      description: t('activity.newCustomerRegistered'),
      time: t('activity.minutesAgo', { count: 15 }),
    },
    {
      type: 'warning',
      title: t('activity.pendingRequest'),
      description: t('activity.requestAwaitingApproval'),
      time: t('activity.minutesAgo', { count: 30 }),
    },
    {
      type: 'success',
      title: t('activity.newPayment'),
      description: t('activity.paymentReceived'),
      time: t('activity.hoursAgo', { count: 1 }),
    },
    {
      type: 'error',
      title: t('activity.sendFailed'),
      description: t('activity.notificationFailed'),
      time: t('activity.hoursAgo', { count: 2 }),
    },
  ];

  // Employee-specific quick actions
  const employeeQuickActions = [
    {
      icon: ClipboardList,
      labelKey: 'dashboard.newRequest',
      href: '/requests/new',
      gradient: 'bg-gradient-to-br from-[#a0592b] to-[#d4a84b]',
    },
    {
      icon: Users,
      labelKey: 'dashboard.addEmployee',
      href: '/employees/new',
      gradient: 'bg-gradient-to-br from-[#f26522] to-[#d4a84b]',
    },
    {
      icon: FileText,
      labelKey: 'dashboard.newReport',
      href: '/reports/new',
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-600',
    },
    {
      icon: CreditCard,
      labelKey: 'dashboard.recordPayment',
      href: '/payments/new',
      gradient: 'bg-gradient-to-br from-yellow-500 to-orange-600',
    },
  ];

  // Customer-specific quick actions
  const customerQuickActions = [
    {
      icon: ClipboardList,
      labelKey: 'dashboard.requestService',
      href: '/my-requests/new',
      gradient: 'bg-gradient-to-br from-[#a0592b] to-[#d4a84b]',
    },
    {
      icon: FileText,
      labelKey: 'sidebar.myDocuments',
      href: '/my-documents',
      gradient: 'bg-gradient-to-br from-[#f26522] to-[#d4a84b]',
    },
    {
      icon: CreditCard,
      labelKey: 'dashboard.payInvoice',
      href: '/my-invoices',
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-600',
    },
    {
      icon: Activity,
      labelKey: 'dashboard.trackRequests',
      href: '/my-requests',
      gradient: 'bg-gradient-to-br from-yellow-500 to-orange-600',
    },
  ];

  const quickActions = userType === 'employee' ? employeeQuickActions : customerQuickActions;

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass-card relative overflow-hidden animate-fade-in">
        {/* Background decoration */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(ellipse at 100% 0%, rgba(212, 168, 75, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse at 0% 100%, rgba(160, 89, 43, 0.2) 0%, transparent 50%)
            `,
          }}
        />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-theme-muted">{getGreeting()}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-theme-primary mb-2">
              {t('dashboard.welcome')}, {user?.name}!
            </h1>
            <p className="text-theme-muted">
              {userType === 'employee'
                ? t('dashboard.employeeOverview')
                : t('dashboard.customerOverview')}
            </p>
          </div>

          {/* Time & Date */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Live Clock */}
            <div className="glass-card-dark px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#f26522]/20 blur-md animate-pulse" />
                  <Clock className="relative h-5 w-5 text-[#f26522]" />
                </div>
                <div>
                  <p className="text-xs text-theme-muted">{t('common.time')}</p>
                  <p className="text-lg font-bold text-theme-primary tabular-nums tracking-wide">
                    {currentTime.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="glass-card-dark px-4 py-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-[#d4a84b]" />
                <div>
                  <p className="text-xs text-theme-muted">{t('common.date')}</p>
                  <p className="text-sm font-medium text-theme-primary">
                    {currentTime.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Employee View */}
      {userType === 'employee' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title={t('dashboard.totalCustomers')}
            value={formatNumber(stats.totalCustomers)}
            change={12}
            icon={Users}
            gradient="bg-gradient-to-br from-[#a0592b] to-[#d4a84b]"
            href="/customers"
            delay={100}
            fromLastMonthText={t('common.fromLastMonth')}
            viewDetailsText={t('common.viewDetails')}
            isRTL={isRTL}
          />
          <StatsCard
            title={t('dashboard.availableServices')}
            value={formatNumber(stats.totalServices)}
            icon={FileText}
            gradient="bg-gradient-to-br from-[#f26522] to-[#d4a84b]"
            href="/services"
            delay={200}
            viewDetailsText={t('common.viewDetails')}
            isRTL={isRTL}
          />
          <StatsCard
            title={t('dashboard.activeRequests')}
            value={formatNumber(stats.pendingRequests)}
            change={-5}
            icon={ClipboardList}
            gradient="bg-gradient-to-br from-yellow-500 to-orange-600"
            href="/requests"
            delay={300}
            fromLastMonthText={t('common.fromLastMonth')}
            viewDetailsText={t('common.viewDetails')}
            isRTL={isRTL}
          />
          <StatsCard
            title={t('dashboard.totalRevenue')}
            value={formatCurrency(stats.totalRevenue)}
            change={stats.monthlyGrowth}
            icon={CreditCard}
            gradient="bg-gradient-to-br from-green-500 to-emerald-600"
            href="/payments"
            delay={400}
            fromLastMonthText={t('common.fromLastMonth')}
            viewDetailsText={t('common.viewDetails')}
            isRTL={isRTL}
          />
        </div>
      )}

      {/* Stats Grid - Customer View */}
      {userType === 'customer' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title={t('dashboard.myActiveRequests')}
            value={formatNumber(stats.pendingRequests)}
            icon={ClipboardList}
            gradient="bg-gradient-to-br from-[#a0592b] to-[#d4a84b]"
            href="/my-requests"
            delay={100}
            viewDetailsText={t('common.viewDetails')}
            isRTL={isRTL}
          />
          <StatsCard
            title={t('dashboard.completedRequests')}
            value={formatNumber(stats.completedRequests)}
            icon={CheckCircle2}
            gradient="bg-gradient-to-br from-green-500 to-emerald-600"
            href="/my-requests?status=completed"
            delay={200}
            viewDetailsText={t('common.viewDetails')}
            isRTL={isRTL}
          />
          <StatsCard
            title={t('sidebar.documents')}
            value={formatNumber(12)}
            icon={FileText}
            gradient="bg-gradient-to-br from-[#f26522] to-[#d4a84b]"
            href="/my-documents"
            delay={300}
            viewDetailsText={t('common.viewDetails')}
            isRTL={isRTL}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
        <h2 className="text-lg font-semibold text-theme-primary mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <QuickActionItem
              key={action.labelKey}
              icon={action.icon}
              label={t(action.labelKey)}
              href={action.href}
              gradient={action.gradient}
            />
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="glass-card animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#d4a84b]" />
              {t('dashboard.recentActivity')}
            </h2>
            <Link
              to="/activity"
              className="text-sm text-[#d4a84b] hover:text-[#f26522] transition-colors flex items-center gap-1"
            >
              {t('common.viewAll')}
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-1">
            {recentActivities.map((activity, i) => (
              <ActivityItem key={i} {...activity} />
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="glass-card animate-fade-in" style={{ animationDelay: '700ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#f26522]" />
              {t('dashboard.requestStats')}
            </h2>
            <select className="glass-input py-1 px-3 text-sm rounded-lg">
              <option>{t('common.thisWeek')}</option>
              <option>{t('common.thisMonth')}</option>
              <option>{t('common.thisYear')}</option>
            </select>
          </div>

          {/* Placeholder Chart */}
          <div className="h-64 flex items-center justify-center glass-card-dark rounded-xl">
            <div className="text-center">
              <PieChart className="h-12 w-12 text-theme-muted/40 mx-auto mb-3" />
              <p className="text-sm text-theme-muted">{t('dashboard.chartPlaceholder')}</p>
              <p className="text-xs text-theme-muted/70 mt-1">
                {t('dashboard.chartComingSoon')}
              </p>
            </div>
          </div>

          {/* Mini Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="glass-card-dark p-3 rounded-xl text-center">
              <p className="text-2xl font-bold text-green-500 dark:text-green-400">
                {formatNumber(stats.completedRequests)}
              </p>
              <p className="text-xs text-theme-muted">{t('dashboard.completed')}</p>
            </div>
            <div className="glass-card-dark p-3 rounded-xl text-center">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatNumber(stats.pendingRequests)}
              </p>
              <p className="text-xs text-theme-muted">{t('dashboard.inProgress')}</p>
            </div>
            <div className="glass-card-dark p-3 rounded-xl text-center">
              <p className="text-2xl font-bold text-[#a0592b] dark:text-[#d4a84b]">
                {formatNumber(stats.totalRequests)}
              </p>
              <p className="text-xs text-theme-muted">{t('dashboard.total')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
