import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import {
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
} from 'lucide-react';

export function EmployeeLoginPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { loginAsEmployee } = useAuth();
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
      await loginAsEmployee(email, password);
      toast.success(t('auth.loginSuccess'));
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
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#a0592b] to-[#7a4420] blur-xl opacity-50" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b] to-[#7a4420] shadow-lg">
              <Briefcase className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>

        <h2 className="mb-2 text-2xl font-bold text-theme-primary">{t('auth.employeeLogin')}</h2>
        <p className="text-theme-muted">{t('auth.employeeLoginDescription')}</p>
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
              placeholder="admin@hbrc.com"
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
          className="btn-premium w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
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
        </button>
      </form>

      {/* Demo Credentials */}
      <div className="mt-6 glass-card-dark p-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-medium text-theme-primary">{t('auth.demoCredentials')}</span>
        </div>
        <div className="space-y-1 text-sm text-theme-muted">
          <p>
            {t('auth.email')}: <code className="text-[#d4a84b] bg-white/5 px-2 py-0.5 rounded">admin@hbrc.com</code>
          </p>
          <p>
            {t('auth.password')}: <code className="text-[#d4a84b] bg-white/5 px-2 py-0.5 rounded">admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
