import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { toast } from 'sonner';
import { authService } from '../../services/auth.service';
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Phone,
  Building,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export function RegisterPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Success

  const ArrowIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.invalidEmail');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('validation.phoneRequired');
    }

    if (!formData.password) {
      newErrors.password = t('validation.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('validation.passwordMin');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await authService.customerRegister({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        companyName: formData.companyName || undefined,
        password: formData.password,
      });

      setStep(2); // Show success step
      toast.success(t('auth.accountCreated'));
    } catch (error: any) {
      const message = error.response?.data?.message || t('common.error');
      toast.error(message);
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

        <h2 className="mb-2 text-2xl font-bold text-theme-primary">{t('auth.accountCreated')}</h2>
        <p className="mb-8 text-theme-muted">
          {t('auth.verificationSent')}
          <br />
          {t('auth.verifyEmail')}
        </p>

        <Link
          to="/login/customer"
          className="btn-premium inline-flex items-center gap-2"
        >
          <span>{t('auth.goToLogin')}</span>
          <Sparkles className="h-5 w-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 text-center">
        {/* Back button */}
        <Link
          to="/login/customer"
          className="mb-4 inline-flex items-center gap-2 text-theme-muted hover:text-theme-primary transition-colors"
        >
          <ArrowIcon className="h-4 w-4" />
          <span className="text-sm">{t('auth.backToLogin')}</span>
        </Link>

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#f26522] to-[#d4a84b] blur-xl opacity-50" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#f26522] to-[#d4a84b] shadow-lg">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <h2 className="mb-1 text-2xl font-bold text-theme-primary">{t('auth.createAccount')}</h2>
        <p className="text-sm text-theme-muted">{t('auth.createAccountDescription')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-medium text-theme-secondary">
            {t('auth.name')} <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute right-4 rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 text-theme-muted">
              <User className="h-5 w-5" />
            </div>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={`glass-input ltr:pl-12 rtl:pr-12 ${errors.name ? 'border-red-500/50 ring-1 ring-red-500/30' : ''}`}
              placeholder={language === 'ar' ? 'أحمد محمد' : 'John Doe'}
              disabled={isLoading}
            />
          </div>
          {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-theme-secondary">
            {t('auth.email')} <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute right-4 rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 text-theme-muted">
              <Mail className="h-5 w-5" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`glass-input ltr:pl-12 rtl:pr-12 ${errors.email ? 'border-red-500/50 ring-1 ring-red-500/30' : ''}`}
              placeholder="example@email.com"
              disabled={isLoading}
            />
          </div>
          {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label htmlFor="phone" className="block text-sm font-medium text-theme-secondary">
            {t('auth.phone')} <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute right-4 rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 text-theme-muted">
              <Phone className="h-5 w-5" />
            </div>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className={`glass-input ltr:pl-12 rtl:pr-12 ${errors.phone ? 'border-red-500/50 ring-1 ring-red-500/30' : ''}`}
              placeholder="01xxxxxxxxx"
              disabled={isLoading}
              dir="ltr"
            />
          </div>
          {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
        </div>

        {/* Company Name (Optional) */}
        <div className="space-y-1.5">
          <label htmlFor="companyName" className="block text-sm font-medium text-theme-secondary">
            {t('auth.companyName')} <span className="text-theme-muted">({t('common.optional')})</span>
          </label>
          <div className="relative">
            <div className="absolute right-4 rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 text-theme-muted">
              <Building className="h-5 w-5" />
            </div>
            <input
              id="companyName"
              name="companyName"
              type="text"
              value={formData.companyName}
              onChange={handleChange}
              className="glass-input ltr:pl-12 rtl:pr-12"
              placeholder={language === 'ar' ? 'اسم الشركة أو المؤسسة' : 'Company or organization name'}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-theme-secondary">
            {t('auth.password')} <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute right-4 rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 text-theme-muted">
              <Lock className="h-5 w-5" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              className={`glass-input ltr:pl-12 rtl:pr-12 ltr:pr-12 rtl:pl-12 ${errors.password ? 'border-red-500/50 ring-1 ring-red-500/30' : ''}`}
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-4 rtl:left-4 ltr:right-4 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-theme-secondary">
            {t('auth.confirmPassword')} <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute right-4 rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 text-theme-muted">
              <Lock className="h-5 w-5" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`glass-input ltr:pl-12 rtl:pr-12 ltr:pr-12 rtl:pl-12 ${errors.confirmPassword ? 'border-red-500/50 ring-1 ring-red-500/30' : ''}`}
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute left-4 rtl:left-4 ltr:right-4 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
        </div>

        {/* Terms */}
        <p className="text-xs text-theme-muted text-center">
          {t('auth.termsAgreement')}{' '}
          <Link to="/terms" className="text-[#d4a84b] hover:text-[#f26522] transition-colors">
            {t('auth.termsOfService')}
          </Link>{' '}
          {t('common.and')}{' '}
          <Link to="/privacy" className="text-[#d4a84b] hover:text-[#f26522] transition-colors">
            {t('auth.privacyPolicy')}
          </Link>
        </p>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="relative w-full overflow-hidden rounded-xl px-8 py-4 font-bold text-white transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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
                <span>{t('auth.creatingAccount')}</span>
              </>
            ) : (
              <>
                <span>{t('auth.createAccount')}</span>
                <UserPlus className="h-5 w-5" />
              </>
            )}
          </span>
        </button>
      </form>

      {/* Login Link */}
      <p className="mt-6 text-center text-sm text-theme-muted">
        {t('auth.hasAccount')}{' '}
        <Link
          to="/login/customer"
          className="font-semibold text-[#d4a84b] hover:text-[#f26522] transition-colors"
        >
          {t('auth.login')}
        </Link>
      </p>
    </div>
  );
}
