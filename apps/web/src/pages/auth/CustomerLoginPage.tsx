import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import {
  Users,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  UserPlus,
} from 'lucide-react';

export function CustomerLoginPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { loginAsCustomer } = useAuth();
  const navigate = useNavigate();

  const ArrowIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(t('validation.enterEmailAndPassword'));
      return;
    }

    setIsLoading(true);

    try {
      await loginAsCustomer(email, password);
      toast.success(`${t('auth.loginSuccess')} ${t('auth.welcomeBack')}`);
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

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
          <span className="text-sm">{t('auth.backToAccountSelection')}</span>
        </Link>

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#f26522] to-[#d4a84b] blur-xl opacity-50" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#f26522] to-[#d4a84b] shadow-lg">
              <Users className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>

        <h2 className="mb-2 text-2xl font-bold text-theme-primary">{t('auth.customerLogin')}</h2>
        <p className="text-theme-muted">{t('auth.customerLoginDescription')}</p>
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

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-theme-secondary">
            {t('auth.password')}
          </label>
          <div className="relative">
            <div className="absolute right-4 rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 text-theme-muted">
              <Lock className="h-5 w-5" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input ltr:pl-12 rtl:pr-12 ltr:pr-12 rtl:pl-12"
              placeholder="••••••••"
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-4 rtl:left-4 ltr:right-4 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="checkbox-premium"
            />
            <span className="text-sm text-theme-muted group-hover:text-theme-secondary transition-colors">
              {t('auth.rememberMe')}
            </span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-[#d4a84b] hover:text-[#f26522] transition-colors"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="relative w-full overflow-hidden rounded-xl px-8 py-4 font-bold text-white transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #a0592b 0%, #f26522 50%, #d4a84b 100%)',
            backgroundSize: '200% 200%',
            animation: isLoading ? 'none' : 'gradient-shift 5s ease infinite',
            boxShadow: '0 10px 40px -10px rgba(242, 101, 34, 0.5)',
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t('auth.loggingIn')}</span>
              </>
            ) : (
              <>
                <span>{t('auth.login')}</span>
                <Sparkles className="h-5 w-5" />
              </>
            )}
          </span>
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-theme-primary/10" />
        <span className="text-sm text-theme-muted">{t('common.or')}</span>
        <div className="h-px flex-1 bg-theme-primary/10" />
      </div>

      {/* Register Button */}
      <Link
        to="/register"
        className="glass-button w-full flex items-center justify-center gap-2 hover:bg-white/10"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <UserPlus className="h-5 w-5" />
        <span>{t('auth.createAccount')}</span>
      </Link>

      {/* Info */}
      <p className="mt-6 text-center text-sm text-theme-muted animate-fade-in" style={{ animationDelay: '200ms' }}>
        {t('auth.loginAgreement')}{' '}
        <Link to="/terms" className="text-[#d4a84b] hover:text-[#f26522] transition-colors">
          {t('auth.termsOfService')}
        </Link>{' '}
        {t('common.and')}{' '}
        <Link to="/privacy" className="text-[#d4a84b] hover:text-[#f26522] transition-colors">
          {t('auth.privacyPolicy')}
        </Link>
      </p>
    </div>
  );
}
