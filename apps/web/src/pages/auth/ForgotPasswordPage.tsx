import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { toast } from 'sonner';
import { authService } from '../../services/auth.service';
import {
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Send,
} from 'lucide-react';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email form, 2: Success

  const ArrowIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error(t('validation.emailRequired'));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t('validation.invalidEmail'));
      return;
    }

    setIsLoading(true);

    try {
      await authService.forgotPassword({ email });
      setStep(2);
      toast.success(t('auth.emailSent'));
    } catch (error: any) {
      // Don't reveal if email exists or not for security
      setStep(2);
      toast.success(t('auth.emailSent'));
    } finally {
      setIsLoading(false);
    }
  };

  // Success Step
  if (step === 2) {
    return (
      <div className="w-full py-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-green-500 blur-2xl opacity-30 animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>

        <h2 className="mb-2 text-2xl font-bold text-theme-primary">{t('auth.emailSent')}</h2>
        <p className="mb-2 text-theme-muted">
          {t('auth.emailSentDescription')}
        </p>
        <p className="mb-8 text-sm text-theme-muted opacity-70">
          {t('auth.checkInbox')}
        </p>

        <div className="space-y-3">
          <Link
            to="/login"
            className="btn-premium w-full inline-flex items-center justify-center gap-2"
          >
            <span>{t('auth.backToLogin')}</span>
          </Link>

          <button
            onClick={() => {
              setStep(1);
              setEmail('');
            }}
            className="w-full glass-button flex items-center justify-center gap-2"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
            }}
          >
            <Send className="h-4 w-4" />
            <span>{t('auth.resend')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 text-center">
        {/* Back button */}
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-theme-muted hover:text-theme-primary transition-colors"
        >
          <ArrowIcon className="h-4 w-4" />
          <span className="text-sm">{t('auth.backToLogin')}</span>
        </Link>

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#d4a84b] to-[#f26522] blur-xl opacity-50" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a84b] to-[#f26522] shadow-lg">
              <KeyRound className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>

        <h2 className="mb-2 text-2xl font-bold text-theme-primary">{t('auth.forgotPasswordTitle')}</h2>
        <p className="text-theme-muted">
          {t('auth.forgotPasswordDescription')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-theme-secondary">
            {t('auth.email')}
          </label>
          <div className="relative">
            <div className="absolute right-4 rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 text-theme-muted">
              <Mail className="h-5 w-5" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input ltr:pl-12 rtl:pr-12"
              placeholder="example@email.com"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="relative w-full overflow-hidden rounded-xl px-8 py-4 font-bold text-white transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #d4a84b 0%, #f26522 50%, #a0592b 100%)',
            backgroundSize: '200% 200%',
            animation: isLoading ? 'none' : 'gradient-shift 5s ease infinite',
            boxShadow: '0 10px 40px -10px rgba(212, 168, 75, 0.5)',
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t('auth.sending')}</span>
              </>
            ) : (
              <>
                <span>{t('auth.sendResetLink')}</span>
                <Send className="h-5 w-5" />
              </>
            )}
          </span>
        </button>
      </form>

      {/* Help Text */}
      <div className="mt-8 glass-card-dark p-4">
        <h3 className="text-sm font-medium text-theme-primary mb-2">{t('auth.needHelp')}</h3>
        <p className="text-xs text-theme-muted leading-relaxed">
          {t('auth.helpDescription')}{' '}
          <a
            href="mailto:support@hbrc.gov.eg"
            className="text-[#d4a84b] hover:text-[#f26522] transition-colors"
          >
            support@hbrc.gov.eg
          </a>
        </p>
      </div>

      {/* Links */}
      <div className="mt-6 flex items-center justify-center gap-4 text-sm">
        <Link
          to="/login/employee"
          className="text-theme-muted hover:text-theme-primary transition-colors"
        >
          {t('auth.employeeAccess')}
        </Link>
        <span className="text-theme-muted opacity-50">|</span>
        <Link
          to="/login/customer"
          className="text-theme-muted hover:text-theme-primary transition-colors"
        >
          {t('auth.customerAccess')}
        </Link>
      </div>
    </div>
  );
}
