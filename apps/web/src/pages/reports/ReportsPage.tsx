import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'sonner';
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  FileCheck,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  RefreshCw,
} from 'lucide-react';

type ReportType = 'overview' | 'requests' | 'revenue' | 'customers';

export function ReportsPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';

  // State
  const [activeReport, setActiveReport] = useState<ReportType>('overview');
  const [dateRange, setDateRange] = useState('thisMonth');
  const [loading, setLoading] = useState(false);

  // Mock data for charts
  const overviewStats = [
    {
      title: t('reports.totalRevenue'),
      value: '125,430',
      unit: language === 'ar' ? 'ج.م' : 'EGP',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'emerald',
    },
    {
      title: t('reports.totalRequests'),
      value: '1,284',
      unit: '',
      change: '+8.2%',
      trend: 'up',
      icon: FileCheck,
      color: 'blue',
    },
    {
      title: t('reports.newCustomers'),
      value: '45',
      unit: '',
      change: '+15.3%',
      trend: 'up',
      icon: Users,
      color: 'purple',
    },
    {
      title: t('reports.avgProcessingTime'),
      value: '3.2',
      unit: language === 'ar' ? 'أيام' : 'days',
      change: '-5.1%',
      trend: 'down',
      icon: Clock,
      color: 'amber',
    },
  ];

  const recentReports = [
    { name: t('reports.monthlyRevenue'), date: '2024-01-15', type: 'PDF', size: '2.4 MB' },
    { name: t('reports.requestsSummary'), date: '2024-01-14', type: 'Excel', size: '1.8 MB' },
    { name: t('reports.customerAnalysis'), date: '2024-01-12', type: 'PDF', size: '3.1 MB' },
    { name: t('reports.servicePerformance'), date: '2024-01-10', type: 'Excel', size: '956 KB' },
  ];

  const requestsByStatus = [
    { status: t('reports.completed'), count: 856, percentage: 67 },
    { status: t('reports.inProgress'), count: 234, percentage: 18 },
    { status: t('reports.pending'), count: 128, percentage: 10 },
    { status: t('reports.cancelled'), count: 66, percentage: 5 },
  ];

  const topServices = [
    { name: language === 'ar' ? 'فحص المباني' : 'Building Inspection', requests: 245, revenue: 48500 },
    { name: language === 'ar' ? 'اختبار التربة' : 'Soil Testing', requests: 189, revenue: 37800 },
    { name: language === 'ar' ? 'تحليل المواد' : 'Material Analysis', requests: 156, revenue: 31200 },
    { name: language === 'ar' ? 'استشارات هندسية' : 'Engineering Consultation', requests: 98, revenue: 19600 },
  ];

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    toast.success(t('reports.dataRefreshed'));
  };

  const handleExport = (format: string) => {
    toast.success(`${t('reports.exportingAs')} ${format}...`);
  };

  const reportTabs = [
    { id: 'overview' as ReportType, label: t('reports.overview'), icon: BarChart3 },
    { id: 'requests' as ReportType, label: t('reports.requestsReport'), icon: FileCheck },
    { id: 'revenue' as ReportType, label: t('reports.revenueReport'), icon: DollarSign },
    { id: 'customers' as ReportType, label: t('reports.customersReport'), icon: Users },
  ];

  const dateRanges = [
    { value: 'today', label: t('reports.today') },
    { value: 'thisWeek', label: t('common.thisWeek') },
    { value: 'thisMonth', label: t('common.thisMonth') },
    { value: 'thisYear', label: t('common.thisYear') },
    { value: 'custom', label: t('reports.customRange') },
  ];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b] to-[#f26522]">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('reports.title')}</h1>
            <p className="text-sm text-white/60">{t('reports.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="glass-button flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh')}</span>
          </button>
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="glass-input appearance-none pr-10"
            >
              {dateRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <Calendar className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-white/40 ${isRTL ? 'left-3' : 'right-3'}`} />
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="glass-card p-2">
        <div className="flex flex-wrap gap-2">
          {reportTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 transition-colors ${
                activeReport === tab.id
                  ? 'bg-gradient-to-r from-[#a0592b] to-[#f26522] text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat, index) => (
          <div key={index} className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">{stat.title}</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {stat.value}
                  {stat.unit && <span className="ml-1 text-base text-white/60">{stat.unit}</span>}
                </p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${stat.color}-500/20`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1">
              {stat.trend === 'up' ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-400" />
              )}
              <span className={stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}>
                {stat.change}
              </span>
              <span className="text-sm text-white/40">{t('common.fromLastMonth')}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Requests by Status */}
        <div className="glass-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{t('reports.requestsByStatus')}</h2>
            <button
              onClick={() => handleExport('PDF')}
              className="glass-button flex items-center gap-2 px-3 py-1.5 text-sm text-white/70 hover:text-white"
            >
              <Download className="h-4 w-4" />
              <span>{t('reports.export')}</span>
            </button>
          </div>

          <div className="space-y-4">
            {requestsByStatus.map((item, index) => (
              <div key={index}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-white/80">{item.status}</span>
                  <span className="text-white">{item.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#a0592b] to-[#f26522]"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Services */}
        <div className="glass-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{t('reports.topServices')}</h2>
            <button
              onClick={() => handleExport('Excel')}
              className="glass-button flex items-center gap-2 px-3 py-1.5 text-sm text-white/70 hover:text-white"
            >
              <Download className="h-4 w-4" />
              <span>{t('reports.export')}</span>
            </button>
          </div>

          <div className="space-y-4">
            {topServices.map((service, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg bg-white/5 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#a0592b]/20 to-[#f26522]/20">
                    <span className="font-bold text-[#f26522]">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{service.name}</p>
                    <p className="text-sm text-white/60">
                      {service.requests} {t('reports.requests')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-emerald-400">
                    {service.revenue.toLocaleString()} {language === 'ar' ? 'ج.م' : 'EGP'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="glass-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{t('reports.revenueOverTime')}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('PDF')}
              className="glass-button flex items-center gap-2 px-3 py-1.5 text-sm text-white/70 hover:text-white"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
            <button
              onClick={() => handleExport('Excel')}
              className="glass-button flex items-center gap-2 px-3 py-1.5 text-sm text-white/70 hover:text-white"
            >
              <Download className="h-4 w-4" />
              Excel
            </button>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-white/20">
          <div className="text-center">
            <BarChart3 className="mx-auto mb-2 h-12 w-12 text-white/20" />
            <p className="text-white/40">{t('dashboard.chartPlaceholder')}</p>
            <p className="text-sm text-white/20">{t('dashboard.chartComingSoon')}</p>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="glass-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{t('reports.recentReports')}</h2>
          <button className="glass-button flex items-center gap-2 px-3 py-1.5 text-sm text-white/70 hover:text-white">
            <Filter className="h-4 w-4" />
            <span>{t('common.filter')}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className={`p-3 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                  {t('reports.reportName')}
                </th>
                <th className={`p-3 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                  {t('common.date')}
                </th>
                <th className={`p-3 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                  {t('reports.format')}
                </th>
                <th className={`p-3 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                  {t('reports.size')}
                </th>
                <th className={`p-3 text-${isRTL ? 'right' : 'left'} text-sm font-medium text-white/60`}>
                  {t('reports.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((report, index) => (
                <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-white/40" />
                      <span className="text-white">{report.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-white/70">{report.date}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        report.type === 'PDF'
                          ? 'border-red-500/30 bg-red-500/20 text-red-400'
                          : 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {report.type}
                    </span>
                  </td>
                  <td className="p-3 text-white/70">{report.size}</td>
                  <td className="p-3">
                    <button className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white">
                      <Download className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
