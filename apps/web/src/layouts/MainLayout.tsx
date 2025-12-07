import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../hooks/useSettings';
import {
  Menu,
  X,
  Home,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  FileText,
  ClipboardList,
  CreditCard,
  Receipt,
  FolderOpen,
  UserCog,
  BarChart3,
  Building2,
  Sparkles,
  Moon,
  Sun,
  Monitor,
  Briefcase,
  SlidersHorizontal,
  BookOpen,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { socketService } from '../services/socket.service';

// Navigation items configuration with translation keys
const employeeNavigation = [
  { nameKey: 'sidebar.home', href: '/dashboard', icon: Home },
  { nameKey: 'sidebar.customers', href: '/customers', icon: Users },
  { nameKey: 'sidebar.employees', href: '/employees', icon: UserCog },
  { nameKey: 'sidebar.services', href: '/services', icon: FileText },
  { nameKey: 'sidebar.publications', href: '/publications', icon: BookOpen },
  { nameKey: 'sidebar.requests', href: '/requests', icon: ClipboardList },
  { nameKey: 'sidebar.invoices', href: '/invoices', icon: Receipt },
  { nameKey: 'sidebar.payments', href: '/payments', icon: CreditCard },
  { nameKey: 'sidebar.documents', href: '/documents', icon: FolderOpen },
  { nameKey: 'sidebar.reports', href: '/reports', icon: BarChart3 },
];

const adminNavigation = [
  { nameKey: 'sidebar.adminSettings', href: '/admin-settings', icon: SlidersHorizontal },
  { nameKey: 'sidebar.settings', href: '/settings', icon: Settings },
];

const customerNavigation = [
  { nameKey: 'sidebar.home', href: '/dashboard', icon: Home },
  { nameKey: 'sidebar.wallet', href: '/wallet', icon: Wallet },
  { nameKey: 'sidebar.publicationsCatalog', href: '/publications-catalog', icon: BookOpen },
  { nameKey: 'sidebar.myPublications', href: '/my-publications', icon: ShoppingBag },
  { nameKey: 'sidebar.myRequests', href: '/my-requests', icon: ClipboardList },
  { nameKey: 'sidebar.myInvoices', href: '/my-invoices', icon: Receipt },
  { nameKey: 'sidebar.myDocuments', href: '/my-documents', icon: FolderOpen },
  { nameKey: 'sidebar.settings', href: '/settings', icon: Settings },
];

/**
 * MainLayout - Premium glassmorphism dashboard layout
 */
export function MainLayout() {
  const { t } = useTranslation();
  const { language, setLanguage, theme, setTheme } = useSettings();
  const { isAuthenticated, isLoading, user, userType, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  // Get the correct chevron icon based on language
  const CollapseIcon = language === 'ar' ? ChevronRight : ChevronLeft;

  // Connect to socket for notifications
  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();

      const unsubscribe = socketService.onUnreadCount((count) => {
        setUnreadCount(count);
      });

      return () => {
        unsubscribe();
        socketService.disconnect();
      };
    }
  }, [isAuthenticated]);

  // Get navigation items based on user type
  const getNavigation = () => {
    if (userType === 'customer') {
      return customerNavigation;
    }
    const nav = [...employeeNavigation];
    if (isAdmin()) {
      nav.push(...adminNavigation);
    }
    return nav;
  };

  const navigation = getNavigation();

  // Premium loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animated-bg" />
        <div className="floating-orb floating-orb-1" />
        <div className="floating-orb floating-orb-2" />

        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#a0592b]/30 blur-3xl animate-pulse" />
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-theme-primary/10" />
            <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-[#a0592b]" />
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="animated-bg" />
        <div className="floating-orb floating-orb-1" />
        <div className="floating-orb floating-orb-2" />
        <div className="floating-orb floating-orb-3" />
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col glass-sidebar transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-theme-primary/10">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#a0592b] to-[#f26522] blur-lg opacity-50" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b] to-[#f26522]">
                <Building2 className="h-5 w-5 text-white" />
              </div>
            </div>
            {!sidebarCollapsed && (
              <div className="animate-fade-in">
                <h1 className="text-lg font-bold text-theme-primary">{t('branding.shortName')}</h1>
                <p className="text-[10px] text-theme-muted">{t('sidebar.integratedSystem')}</p>
              </div>
            )}
          </Link>

          {/* Collapse Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-primary/5 transition-colors"
          >
            <CollapseIcon
              className={`h-5 w-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const name = t(item.nameKey);

            return (
              <Link
                key={item.nameKey}
                to={item.href}
                className={`nav-item ${active ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-3' : ''}`}
                title={sidebarCollapsed ? name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-theme-primary/10 p-4">
          {/* User Badge */}
          {!sidebarCollapsed && (
            <div className="mb-3 glass-card-dark px-3 py-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    userType === 'employee'
                      ? 'bg-gradient-to-br from-[#a0592b] to-[#7a4420]'
                      : 'bg-gradient-to-br from-[#f26522] to-[#d4a84b]'
                  } text-white`}
                >
                  {userType === 'employee' ? (
                    <Briefcase className="h-4 w-4" />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-theme-muted">
                    {userType === 'employee' ? t('sidebar.employeeAccount') : t('sidebar.customerAccount')}
                  </p>
                  {user?.isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#d4a84b]">
                      <Sparkles className="h-3 w-3" />
                      {t('sidebar.systemAdmin')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* User Menu */}
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-theme-secondary hover:bg-theme-primary/5 transition-all ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="relative">
              {user?.profileImage ? (
                <img
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${user.profileImage}`}
                  alt={user?.name || 'User'}
                  className="h-9 w-9 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b]/80 to-[#f26522]/80 text-white font-semibold text-sm">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="absolute -bottom-0.5 ltr:-right-0.5 rtl:-left-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-[var(--bg-primary)]" />
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 text-start min-w-0">
                  <p className="font-medium text-theme-primary text-sm truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-theme-muted truncate">{user?.email}</p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-theme-muted transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </>
            )}
          </button>

          {/* User Dropdown */}
          {userMenuOpen && !sidebarCollapsed && (
            <div className="mt-2 space-y-1 animate-fade-in">
              <Link
                to="/profile"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-theme-muted hover:bg-theme-primary/5 hover:text-theme-primary transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>{t('sidebar.accountSettings')}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('auth.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed ${language === 'ar' ? 'right-0' : 'left-0'} top-0 z-50 h-full w-72 transform glass-sidebar transition-transform duration-300 lg:hidden ${
          sidebarOpen
            ? 'translate-x-0'
            : language === 'ar' ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b border-theme-primary/10 px-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b] to-[#f26522]">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-theme-primary">{t('branding.shortName')}</h1>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-theme-muted hover:bg-theme-primary/5 hover:text-theme-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const name = t(item.nameKey);

            return (
              <Link
                key={item.nameKey}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`nav-item ${active ? 'active' : ''}`}
              >
                <Icon className="h-5 w-5" />
                <span>{name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile User Section */}
        <div className="border-t border-theme-primary/10 p-4">
          <div className="flex items-center gap-3 mb-4">
            {user?.profileImage ? (
              <img
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${user.profileImage}`}
                alt={user?.name || 'User'}
                className="h-10 w-10 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b]/80 to-[#f26522]/80 text-white font-semibold">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-theme-primary text-sm truncate">{user?.name}</p>
              <p className="text-xs text-theme-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>{t('auth.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="glass-navbar h-16 flex items-center px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-theme-muted hover:bg-theme-primary/5 hover:text-theme-primary lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Search Bar */}
          <div className="mx-4 flex flex-1 items-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute rtl:right-3 ltr:left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted" />
              <input
                type="text"
                placeholder={t('common.searchPlaceholder')}
                className="w-full glass-input rounded-lg py-2 rtl:pr-10 ltr:pl-10 rtl:pl-4 ltr:pr-4 text-sm"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Theme Switcher */}
            <div className="flex items-center gap-1 glass-card !p-1 !rounded-lg">
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-md transition-all ${
                  theme === 'light'
                    ? 'bg-[#a0592b] text-white shadow-md'
                    : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10'
                }`}
                title={t('settings.lightMode')}
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-md transition-all ${
                  theme === 'dark'
                    ? 'bg-[#a0592b] text-white shadow-md'
                    : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10'
                }`}
                title={t('settings.darkMode')}
              >
                <Moon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-md transition-all ${
                  theme === 'system'
                    ? 'bg-[#a0592b] text-white shadow-md'
                    : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10'
                }`}
                title={t('settings.systemMode')}
              >
                <Monitor className="h-4 w-4" />
              </button>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 glass-card !p-1 !rounded-lg">
              <button
                onClick={() => setLanguage('ar')}
                className={`px-2 py-1 rounded-md text-sm font-medium transition-all ${
                  language === 'ar'
                    ? 'bg-[#a0592b] text-white shadow-md'
                    : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10'
                }`}
              >
                ع
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-md text-sm font-medium transition-all ${
                  language === 'en'
                    ? 'bg-[#a0592b] text-white shadow-md'
                    : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10'
                }`}
              >
                EN
              </button>
            </div>

            {/* Notifications */}
            <button className="relative rounded-lg p-2 text-theme-muted hover:bg-theme-primary/5 hover:text-theme-primary transition-colors">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 ltr:-right-0.5 rtl:-left-0.5 flex h-5 w-5 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-50"></span>
                  <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              )}
            </button>

            {/* User Info (Desktop Only) */}
            <div className="hidden lg:flex items-center gap-3 ms-2">
              <div className="text-end">
                <p className="text-sm font-medium text-theme-primary">{user?.name || 'User'}</p>
                <p className="text-xs text-theme-muted">
                  {userType === 'employee' ? t('auth.employee') : t('auth.customer')}
                </p>
              </div>
              <div className="relative">
                {user?.profileImage ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${user.profileImage}`}
                    alt={user?.name || 'User'}
                    className="h-10 w-10 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b]/80 to-[#f26522]/80 text-white font-semibold">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute -bottom-0.5 ltr:-right-0.5 rtl:-left-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-[var(--bg-primary)]" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
