import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { useTranslation } from 'react-i18next';
import { Building2, Shield, Zap, BarChart3, Award, Sun, Moon, Monitor } from 'lucide-react';
import { useEffect } from 'react';

// Animated particles component - HBRC themed (gold particles)
function Particles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    left: Math.random() * 100,
    delay: Math.random() * 15,
    duration: Math.random() * 10 + 15,
  }));

  return (
    <div className="particles">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// Feature card component - HBRC themed
function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className={`group glass-card !p-4 hover-lift cursor-default animation-delay-${delay}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#a0592b] to-[#f26522] opacity-20 blur-lg group-hover:opacity-40 transition-opacity" />
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b] to-[#f26522] text-white shadow-lg">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-theme-primary">{title}</h3>
          <p className="text-sm text-theme-muted truncate">{description}</p>
        </div>
      </div>
    </div>
  );
}

// Settings Panel Component
function SettingsPanel() {
  const { t } = useTranslation();
  const { theme, setTheme, language, setLanguage } = useSettings();

  return (
    <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
      {/* Language Switcher */}
      <div className="lang-switcher">
        <button
          onClick={() => setLanguage('ar')}
          className={`lang-btn ${language === 'ar' ? 'active' : ''}`}
        >
          العربية
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`lang-btn ${language === 'en' ? 'active' : ''}`}
        >
          EN
        </button>
      </div>

      {/* Theme Switcher */}
      <div className="flex items-center gap-1 glass-card !p-1 !rounded-lg">
        <button
          onClick={() => setTheme('light')}
          className={`theme-switcher-btn ${theme === 'light' ? 'active' : ''}`}
          title={t('settings.lightMode')}
        >
          <Sun className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`theme-switcher-btn ${theme === 'dark' ? 'active' : ''}`}
          title={t('settings.darkMode')}
        >
          <Moon className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`theme-switcher-btn ${theme === 'system' ? 'active' : ''}`}
          title={t('settings.systemMode')}
        >
          <Monitor className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * AuthLayout - HBRC Premium glassmorphism layout for authentication pages
 */
export function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { language } = useSettings();
  const { t } = useTranslation();

  // Disable body scroll on mount, re-enable on unmount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Premium loading state - HBRC themed
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="animated-bg" />
        <div className="floating-orb floating-orb-1" />
        <div className="floating-orb floating-orb-2" />

        <div className="relative">
          {/* Glow effect - HBRC brown */}
          <div className="absolute inset-0 rounded-full bg-[#a0592b]/30 blur-3xl animate-pulse" />

          {/* Spinner */}
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-theme-primary/10" />
            <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-[#a0592b]" />
          </div>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Settings Panel */}
      <SettingsPanel />

      {/* Animated Background */}
      <div className="animated-bg" />

      {/* Floating Orbs */}
      <div className="floating-orb floating-orb-1" />
      <div className="floating-orb floating-orb-2" />
      <div className="floating-orb floating-orb-3" />

      {/* Particles */}
      <Particles />

      {/* Grid pattern overlay */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(212,168,75,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,168,75,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Right Side - Form Section (RTL) / Left Side (LTR) */}
      <div className="relative flex w-full flex-col justify-center px-4 sm:px-6 lg:w-[50%] lg:px-6 z-10 overflow-y-auto py-6">
        {/* Logo - Mobile */}
        <div className="mb-4 lg:hidden flex justify-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#a0592b] to-[#f26522] blur-md opacity-50" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#a0592b] to-[#f26522]">
                <Building2 className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-theme-primary">{t('branding.shortName')}</h1>
            </div>
          </Link>
        </div>

        {/* Glass Card Container - Wider */}
        <div className="mx-auto w-full max-w-lg lg:max-w-xl">
          <div className="glass-card !p-6 sm:!p-8 shine">
            <Outlet />
          </div>

          {/* Bottom Links */}
          <div className="mt-4 text-center">
            <p className="text-xs text-theme-muted">
              &copy; {new Date().getFullYear()} {t('branding.shortName')}. {t('branding.copyright')}
            </p>
          </div>
        </div>
      </div>

      {/* Left Side - Branding Section (Desktop) (RTL) / Right Side (LTR) */}
      <div className="hidden lg:flex lg:w-[48%] lg:flex-col lg:justify-center lg:px-6 relative z-10">
        {/* Content */}
        <div className="max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-8 animate-fade-in">
            <Link to="/" className="inline-flex items-center gap-4 group">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#a0592b] to-[#f26522] blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#a0592b] to-[#f26522] shadow-xl">
                  <Building2 className="h-9 w-9 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-theme-primary text-shadow">{t('branding.hbrc')}</h1>
                <p className="text-sm text-theme-muted">{t('branding.shortName')}</p>
              </div>
            </Link>
          </div>

          {/* Hero Text */}
          <div className="mb-8 animate-fade-in animation-delay-200">
            <h2 className="text-3xl xl:text-4xl font-bold text-theme-primary leading-tight mb-3 text-shadow-lg">
              {t('branding.tagline')}
              <span className="animated-gradient-text"> {t('branding.taglineHighlight')}</span>
            </h2>
            <p className="text-base text-theme-muted leading-relaxed">
              {t('branding.description')}
            </p>
          </div>

          {/* Features - Better spacing */}
          <div className="grid gap-3 animate-fade-in animation-delay-300">
            <FeatureCard
              icon={Shield}
              title={t('features.security')}
              description={t('features.securityDescription')}
              delay="400"
            />
            <FeatureCard
              icon={Zap}
              title={t('features.performance')}
              description={t('features.performanceDescription')}
              delay="500"
            />
            <FeatureCard
              icon={BarChart3}
              title={t('features.analytics')}
              description={t('features.analyticsDescription')}
              delay="600"
            />
          </div>

          {/* Stats */}
          <div className="mt-8 flex items-center gap-4 animate-fade-in animation-delay-700">
            <div className="glass-card-dark !p-4 text-center flex-1">
              <div className="text-2xl font-bold text-[#d4a84b]">99.9%</div>
              <div className="text-xs text-theme-muted">{t('stats.uptime')}</div>
            </div>
            <div className="glass-card-dark !p-4 text-center flex-1">
              <div className="text-2xl font-bold text-[#f26522]">+1000</div>
              <div className="text-xs text-theme-muted">{t('stats.activeClients')}</div>
            </div>
            <div className="glass-card-dark !p-4 text-center flex-1">
              <div className="text-2xl font-bold text-[#a0592b]">24/7</div>
              <div className="text-xs text-theme-muted">{t('stats.support')}</div>
            </div>
          </div>

          {/* Badge */}
          <div className="mt-6 inline-flex items-center gap-2 glass-card-dark !p-3 !px-4 animate-fade-in animation-delay-1000">
            <Award className="h-4 w-4 text-[#d4a84b]" />
            <span className="text-sm text-theme-secondary">{t('branding.certified')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
