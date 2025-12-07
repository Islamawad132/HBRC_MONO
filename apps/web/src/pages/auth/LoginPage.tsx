import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react';

export function LoginPage() {
  useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = isRTL ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = isRTL ? 'بريد إلكتروني غير صالح' : 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = isRTL ? 'كلمة المرور مطلوبة' : 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success(isRTL ? 'تم تسجيل الدخول بنجاح!' : 'Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || (isRTL ? 'فشل تسجيل الدخول' : 'Login failed');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 text-center">
        {/* Back button */}
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-2 text-theme-muted hover:text-theme-primary transition-colors"
        >
          <ArrowIcon className="h-4 w-4" />
          <span className="text-sm">{isRTL ? 'العودة للرئيسية' : 'Back to Home'}</span>
        </Link>

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#f26522] to-[#d4a84b] blur-xl opacity-50" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#f26522] to-[#d4a84b] shadow-lg">
              <LogIn className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>

        <h2 className="mb-1 text-2xl font-bold text-theme-primary">
          {isRTL ? 'تسجيل الدخول' : 'Welcome Back'}
        </h2>
        <p className="text-sm text-theme-muted">
          {isRTL ? 'أدخل بياناتك للمتابعة' : 'Enter your credentials to continue'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-theme-secondary">
            {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
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

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-theme-secondary">
            {isRTL ? 'كلمة المرور' : 'Password'}
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

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#f26522] focus:ring-[#f26522] focus:ring-offset-0"
            />
            <span className="text-sm text-theme-muted group-hover:text-theme-secondary transition-colors">
              {isRTL ? 'تذكرني' : 'Remember me'}
            </span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-[#d4a84b] hover:text-[#f26522] transition-colors"
          >
            {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
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
                <span>{isRTL ? 'جاري تسجيل الدخول...' : 'Signing in...'}</span>
              </>
            ) : (
              <>
                <span>{isRTL ? 'تسجيل الدخول' : 'Sign In'}</span>
                <Sparkles className="h-5 w-5" />
              </>
            )}
          </span>
        </button>
      </form>

      {/* Demo Credentials */}
      <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
            <Info className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-400">
              {isRTL ? 'حساب تجريبي' : 'Demo Account'}
            </p>
            <p className="mt-1 text-xs text-theme-muted">
              {isRTL ? 'البريد:' : 'Email:'} <strong className="text-theme-secondary">admin@hbrc.com</strong>
            </p>
            <p className="text-xs text-theme-muted">
              {isRTL ? 'كلمة المرور:' : 'Password:'} <strong className="text-theme-secondary">admin123</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Register Link */}
      <p className="mt-6 text-center text-sm text-theme-muted">
        {isRTL ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
        <Link
          to="/register"
          className="font-semibold text-[#d4a84b] hover:text-[#f26522] transition-colors"
        >
          {isRTL ? 'إنشاء حساب جديد' : 'Create Account'}
        </Link>
      </p>
    </div>
  );
}
