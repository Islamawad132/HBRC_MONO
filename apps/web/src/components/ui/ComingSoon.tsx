import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { Rocket, Sparkles, Clock, Bell, ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ComingSoonProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
  showNotifyButton?: boolean;
  icon?: React.ReactNode;
  estimatedDate?: string;
  developPercentage?: string;
}

const PARTICLES = [
  { width: 5, height: 4, left: 8, delay: 2, duration: 12 },
  { width: 3, height: 6, left: 15, delay: 5, duration: 18 },
  { width: 7, height: 3, left: 25, delay: 8, duration: 14 },
  { width: 4, height: 5, left: 35, delay: 1, duration: 16 },
  { width: 6, height: 4, left: 45, delay: 12, duration: 11 },
  { width: 3, height: 7, left: 55, delay: 4, duration: 19 },
  { width: 5, height: 5, left: 65, delay: 9, duration: 13 },
  { width: 4, height: 3, left: 72, delay: 6, duration: 15 },
  { width: 6, height: 6, left: 80, delay: 11, duration: 17 },
  { width: 3, height: 4, left: 88, delay: 3, duration: 12 },
  { width: 5, height: 7, left: 92, delay: 7, duration: 14 },
  { width: 4, height: 4, left: 20, delay: 10, duration: 16 },
  { width: 7, height: 5, left: 50, delay: 14, duration: 18 },
  { width: 3, height: 3, left: 60, delay: 0, duration: 11 },
  { width: 6, height: 5, left: 95, delay: 13, duration: 20 },
];

export function ComingSoon({
  title,
  description,
  showBackButton = true,
  showNotifyButton = false,
  icon,
  estimatedDate,
  developPercentage = '75%',
}: ComingSoonProps) {
  const { t } = useTranslation();
  const { language } = useSettings();
  const navigate = useNavigate();
  const isRTL = language === 'ar';

  return (
    <div className="relative flex min-h-[60vh] h-full items-center justify-center overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Animated Background Elements */}
      <div className="pointer-events-none absolute inset-0">
        {/* Floating Orbs */}
        <div className="floating-orb floating-orb-1 opacity-30" />
        <div className="floating-orb floating-orb-2 opacity-20" />
        <div className="floating-orb floating-orb-3 opacity-25" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(160, 89, 43, 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(160, 89, 43, 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Decorative Circles */}
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gradient-to-br from-[#a0592b]/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-gradient-to-tr from-[#f26522]/10 to-transparent blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-2xl px-4 text-center">
        {/* Icon Container */}
        <div className="relative mx-auto mb-8">
          {/* Pulsing Ring */}
          <div className="absolute inset-0 mx-auto h-32 w-32 animate-ping rounded-full bg-gradient-to-r from-[#a0592b]/20 to-[#f26522]/20" style={{ animationDuration: '3s' }} />
          
          {/* Icon Background */}
          <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-[#a0592b] to-[#f26522] shadow-2xl shadow-[#f26522]/30">
            {icon || <Rocket className="h-14 w-14 text-white" />}
            
            {/* Sparkle Effects */}
            <Sparkles className="absolute -right-2 -top-2 h-8 w-8 animate-pulse text-[#d4a84b]" />
            <Sparkles className="absolute -bottom-1 -left-3 h-6 w-6 animate-pulse text-[#d4a84b]" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">
          <span className="bg-gradient-to-r from-[#a0592b] via-[#f26522] to-[#d4a84b] bg-clip-text text-transparent">
            {title || t('comingSoon.title')}
          </span>
        </h1>

        {/* Description */}
        <p className="mx-auto mb-8 max-w-md text-lg text-theme-secondary">
          {description || t('comingSoon.description')}
        </p>

        {/* Estimated Date */}
        {estimatedDate && (
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#d4a84b]/30 bg-[#d4a84b]/10 px-4 py-2">
            <Clock className="h-5 w-5 text-[#d4a84b]" />
            <span className="text-sm font-medium text-[#d4a84b]">
              {t('comingSoon.expectedLaunch')}: {estimatedDate}
            </span>
          </div>
        )}

        {/* Features Preview */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: '🚀', titleKey: 'comingSoon.features.fast', descKey: 'comingSoon.features.fastDesc' },
            { icon: '🔒', titleKey: 'comingSoon.features.secure', descKey: 'comingSoon.features.secureDesc' },
            { icon: '✨', titleKey: 'comingSoon.features.modern', descKey: 'comingSoon.features.modernDesc' },
          ].map((feature, index) => (
            <div
              key={index}
              className="glass-card group cursor-default p-4 transition-all duration-300 hover:scale-105 hover:border-[#a0592b]/30"
            >
              <div className="mb-2 text-3xl">{feature.icon}</div>
              <h3 className="mb-1 font-semibold text-theme-primary">{t(feature.titleKey)}</h3>
              <p className="text-sm text-theme-muted">{t(feature.descKey)}</p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {showBackButton && (
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-medium text-theme-primary backdrop-blur-sm transition-all duration-300 hover:border-[#a0592b]/50 hover:bg-white/10"
            >
              {isRTL ? (
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              ) : (
                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              )}
              {t('comingSoon.goBack')}
            </button>
          )}

          {showNotifyButton && (
            <button
              onClick={() => {}}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#a0592b] to-[#f26522] px-6 py-3 font-medium text-white shadow-lg shadow-[#f26522]/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#f26522]/30"
            >
              <Bell className="h-5 w-5 transition-transform group-hover:animate-bounce" />
              {t('comingSoon.notifyMe')}
            </button>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="mt-12">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-theme-muted">{t('comingSoon.progress')}</span>
            <span className="font-medium text-[#d4a84b]">{developPercentage}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-[#a0592b] via-[#f26522] to-[#d4a84b] transition-all duration-1000"
              style={{ width: developPercentage }}
            />
          </div>
          <p className="mt-2 text-xs text-theme-muted">{t('comingSoon.almostThere')}</p>
        </div>
      </div>

      {/* Animated Particles */}
      <div className="particles">
        {PARTICLES.map((particle, i) => (
          <div
            key={i}
            className="particle"
            style={{
              width: `${particle.width}px`,
              height: `${particle.height}px`,
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
