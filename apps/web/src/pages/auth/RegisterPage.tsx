import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { toast } from 'sonner';
import { authService } from '../../services/auth.service';
import { CustomerType } from '../../types/enums';
import type { CustomerRegisterRequest } from '../../types/interfaces';
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Phone,
  Building,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Sparkles,
  BadgeCheck,
  Briefcase,
  Award,
  Users,
  MapPin,
  Hash,
} from 'lucide-react';

// Customer type configuration
const customerTypeConfig = {
  [CustomerType.INDIVIDUAL]: {
    icon: User,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    selectedBorder: 'border-blue-500',
    labelEn: 'Individual',
    labelAr: 'فرد',
    descEn: 'Personal account for individual customers',
    descAr: 'حساب شخصي للعملاء الأفراد',
  },
  [CustomerType.CORPORATE]: {
    icon: Building2,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    selectedBorder: 'border-purple-500',
    labelEn: 'Corporate',
    labelAr: 'شركة',
    descEn: 'Business account for companies & organizations',
    descAr: 'حساب تجاري للشركات والمؤسسات',
  },
  [CustomerType.CONSULTANT]: {
    icon: Briefcase,
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    selectedBorder: 'border-emerald-500',
    labelEn: 'Consultant',
    labelAr: 'استشاري',
    descEn: 'For engineering consultants & experts',
    descAr: 'للاستشاريين الهندسيين والخبراء',
  },
  [CustomerType.SPONSOR]: {
    icon: Award,
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    selectedBorder: 'border-amber-500',
    labelEn: 'Event Sponsor',
    labelAr: 'راعي فعالية',
    descEn: 'For event sponsors & partners',
    descAr: 'لرعاة الفعاليات والشركاء',
  },
};

type FormStep = 'type' | 'details' | 'success';

interface FormData {
  customerType: CustomerType;
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
  // Corporate fields
  companyName: string;
  taxNumber: string;
  contactPerson: string;
  // Consultant fields
  licenseNumber: string;
  consultingFirm: string;
}

export function RegisterPage() {
  useTranslation(); // Keep hook for re-render on language change
  const { language } = useSettings();
  const isRTL = language === 'ar';
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<FormStep>('type');

  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;
  const NextArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const [formData, setFormData] = useState<FormData>({
    customerType: CustomerType.INDIVIDUAL,
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    taxNumber: '',
    contactPerson: '',
    licenseNumber: '',
    consultingFirm: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.name.trim()) {
      newErrors.name = isRTL ? 'الاسم مطلوب' : 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = isRTL ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = isRTL ? 'بريد إلكتروني غير صالح' : 'Invalid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = isRTL ? 'رقم الهاتف مطلوب' : 'Phone is required';
    }

    if (!formData.password) {
      newErrors.password = isRTL ? 'كلمة المرور مطلوبة' : 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match';
    }

    // Type-specific validation
    if (formData.customerType === CustomerType.CORPORATE) {
      if (!formData.companyName.trim()) {
        newErrors.companyName = isRTL ? 'اسم الشركة مطلوب' : 'Company name is required';
      }
    }

    if (formData.customerType === CustomerType.CONSULTANT) {
      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = isRTL ? 'رقم الترخيص مطلوب' : 'License number is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleTypeSelect = (type: CustomerType) => {
    setFormData((prev) => ({ ...prev, customerType: type }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const registerData: CustomerRegisterRequest = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        customerType: formData.customerType,
        address: formData.address || undefined,
      };

      // Add type-specific fields
      if (formData.customerType === CustomerType.CORPORATE) {
        registerData.companyName = formData.companyName;
        registerData.taxNumber = formData.taxNumber || undefined;
        registerData.contactPerson = formData.contactPerson || undefined;
      }

      if (formData.customerType === CustomerType.CONSULTANT) {
        registerData.licenseNumber = formData.licenseNumber;
        registerData.consultingFirm = formData.consultingFirm || undefined;
      }

      await authService.customerRegister(registerData);

      setStep('success');
      toast.success(isRTL ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || (isRTL ? 'حدث خطأ' : 'An error occurred');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
        step === 'type' ? 'bg-gradient-to-br from-[#f26522] to-[#d4a84b] text-white' : 'bg-white/10 text-white/60'
      }`}>
        1
      </div>
      <div className={`w-12 h-1 rounded-full transition-all ${step !== 'type' ? 'bg-gradient-to-r from-[#f26522] to-[#d4a84b]' : 'bg-white/10'}`} />
      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
        step === 'details' ? 'bg-gradient-to-br from-[#f26522] to-[#d4a84b] text-white' : step === 'success' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60'
      }`}>
        {step === 'success' ? <CheckCircle2 className="w-4 h-4" /> : '2'}
      </div>
    </div>
  );

  // Success Step
  if (step === 'success') {
    return (
      <div className="w-full py-8 text-center">
        <StepIndicator />
        
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-500 blur-2xl opacity-30 animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>

        <h2 className="mb-2 text-2xl font-bold text-theme-primary">
          {isRTL ? 'تم إنشاء حسابك بنجاح!' : 'Account Created Successfully!'}
        </h2>
        <p className="mb-2 text-theme-muted">
          {isRTL ? 'تم إرسال رابط التحقق إلى بريدك الإلكتروني' : 'A verification link has been sent to your email'}
        </p>
        <p className="mb-8 text-sm text-theme-muted">
          {isRTL ? 'يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك' : 'Please check your email to activate your account'}
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/login/customer"
            className="btn-premium inline-flex items-center justify-center gap-2"
          >
            <span>{isRTL ? 'الذهاب لتسجيل الدخول' : 'Go to Login'}</span>
            <Sparkles className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  // Type Selection Step
  if (step === 'type') {
    const config = customerTypeConfig[formData.customerType];
    
    return (
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 text-center">
          <Link
            to="/login/customer"
            className="mb-4 inline-flex items-center gap-2 text-theme-muted hover:text-theme-primary transition-colors"
          >
            <ArrowIcon className="h-4 w-4" />
            <span className="text-sm">{isRTL ? 'العودة لتسجيل الدخول' : 'Back to Login'}</span>
          </Link>

          <StepIndicator />

          <div className="mb-4 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#f26522] to-[#d4a84b] blur-xl opacity-50" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#f26522] to-[#d4a84b] shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <h2 className="mb-1 text-2xl font-bold text-theme-primary">
            {isRTL ? 'اختر نوع الحساب' : 'Choose Account Type'}
          </h2>
          <p className="text-sm text-theme-muted">
            {isRTL ? 'حدد نوع حسابك للحصول على تجربة مخصصة' : 'Select your account type for a personalized experience'}
          </p>
        </div>

        {/* Type Cards Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(Object.keys(customerTypeConfig) as CustomerType[]).map((type) => {
            const typeConfig = customerTypeConfig[type];
            const Icon = typeConfig.icon;
            const isSelected = formData.customerType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeSelect(type)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-start group ${
                  isSelected
                    ? `${typeConfig.selectedBorder} ${typeConfig.bgColor} scale-[1.02]`
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2">
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${typeConfig.color} flex items-center justify-center`}>
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${typeConfig.color} flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Label */}
                <h3 className="font-semibold text-theme-primary mb-1">
                  {isRTL ? typeConfig.labelAr : typeConfig.labelEn}
                </h3>
                <p className="text-xs text-theme-muted line-clamp-2">
                  {isRTL ? typeConfig.descAr : typeConfig.descEn}
                </p>
              </button>
            );
          })}
        </div>

        {/* Selected Type Summary */}
        <div className={`p-4 rounded-xl ${config.bgColor} border ${config.borderColor} mb-6`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
              <config.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-theme-primary">
                {isRTL ? 'نوع الحساب المختار:' : 'Selected Account Type:'}
              </p>
              <p className="text-sm text-theme-muted">
                {isRTL ? config.labelAr : config.labelEn}
              </p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          type="button"
          onClick={() => setStep('details')}
          className="relative w-full overflow-hidden rounded-xl px-8 py-4 font-bold text-white transition-all duration-500"
          style={{
            background: 'linear-gradient(135deg, #a0592b 0%, #f26522 50%, #d4a84b 100%)',
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 5s ease infinite',
            boxShadow: '0 10px 40px -10px rgba(242, 101, 34, 0.5)',
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span>{isRTL ? 'متابعة' : 'Continue'}</span>
            <NextArrowIcon className="h-5 w-5" />
          </span>
        </button>

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-theme-muted">
          {isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
          <Link
            to="/login/customer"
            className="font-semibold text-[#d4a84b] hover:text-[#f26522] transition-colors"
          >
            {isRTL ? 'تسجيل الدخول' : 'Login'}
          </Link>
        </p>
      </div>
    );
  }

  // Details Form Step
  const config = customerTypeConfig[formData.customerType];
  const Icon = config.icon;

  return (
    <div className="w-full">
      {/* Header - Compact */}
      <div className="mb-4 text-center">
        <button
          type="button"
          onClick={() => setStep('type')}
          className="mb-3 inline-flex items-center gap-2 text-theme-muted hover:text-theme-primary transition-colors"
        >
          <ArrowIcon className="h-4 w-4" />
          <span className="text-sm">{isRTL ? 'تغيير نوع الحساب' : 'Change Account Type'}</span>
        </button>

        <StepIndicator />

        <div className="flex items-center justify-center gap-3 mb-1">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${config.color} shadow-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="text-start">
            <h2 className="text-xl font-bold text-theme-primary">
              {isRTL ? 'إنشاء حساب' : 'Create Account'}
            </h2>
            <span className={`text-xs font-medium ${config.bgColor} ${config.borderColor} border px-2 py-0.5 rounded-full`}>
              {isRTL ? config.labelAr : config.labelEn}
            </span>
          </div>
        </div>
      </div>

      {/* Form - Compact 2-Column Grid */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Row 1: Name & Email */}
        <div className="grid grid-cols-2 gap-3">
          {/* Name */}
          <div className="space-y-1">
            <label htmlFor="name" className="block text-xs font-medium text-theme-secondary">
              {formData.customerType === CustomerType.CORPORATE 
                ? (isRTL ? 'اسم المسؤول' : 'Representative')
                : (isRTL ? 'الاسم الكامل' : 'Full Name')
              } <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-theme-muted">
                <User className="h-4 w-4" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`glass-input py-2.5 text-sm ltr:pl-10 rtl:pr-10 ${errors.name ? 'border-red-500/50 ring-1 ring-red-500/30' : ''}`}
                placeholder={isRTL ? 'أحمد محمد' : 'John Doe'}
                disabled={isLoading}
              />
            </div>
            {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-xs font-medium text-theme-secondary">
              {isRTL ? 'البريد الإلكتروني' : 'Email'} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-theme-muted">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`glass-input py-2.5 text-sm ltr:pl-10 rtl:pr-10 ${errors.email ? 'border-red-500/50 ring-1 ring-red-500/30' : ''}`}
                placeholder="example@email.com"
                disabled={isLoading}
              />
            </div>
            {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
          </div>
        </div>

        {/* Row 2: Phone & Address */}
        <div className="grid grid-cols-2 gap-3">
          {/* Phone */}
          <div className="space-y-1">
            <label htmlFor="phone" className="block text-xs font-medium text-theme-secondary">
              {isRTL ? 'رقم الهاتف' : 'Phone'} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-theme-muted">
                <Phone className="h-4 w-4" />
              </div>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={`glass-input py-2.5 text-sm ltr:pl-10 rtl:pr-10 ${errors.phone ? 'border-red-500/50 ring-1 ring-red-500/30' : ''}`}
                placeholder="01xxxxxxxxx"
                disabled={isLoading}
                dir="ltr"
              />
            </div>
            {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label htmlFor="address" className="block text-xs font-medium text-theme-secondary">
              {isRTL ? 'العنوان' : 'Address'}
            </label>
            <div className="relative">
              <div className="absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-theme-muted">
                <MapPin className="h-4 w-4" />
              </div>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                className="glass-input py-2.5 text-sm ltr:pl-10 rtl:pr-10"
                placeholder={isRTL ? 'القاهرة، مصر' : 'Cairo, Egypt'}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Corporate-specific Row: Company Name & Tax Number */}
        {formData.customerType === CustomerType.CORPORATE && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="companyName" className="block text-xs font-medium text-theme-secondary">
                {isRTL ? 'اسم الشركة' : 'Company Name'} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-theme-muted">
                  <Building2 className="h-4 w-4" />
                </div>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleChange}
                  className={`glass-input py-2.5 text-sm ltr:pl-10 rtl:pr-10 ${errors.companyName ? 'border-red-500/50 ring-1 ring-red-500/30' : ''}`}
                  placeholder={isRTL ? 'شركة البناء المتطور' : 'ABC Construction'}
                  disabled={isLoading}
                />
              </div>
              {errors.companyName && <p className="text-xs text-red-400">{errors.companyName}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor="taxNumber" className="block text-xs font-medium text-theme-secondary">
                {isRTL ? 'الرقم الضريبي' : 'Tax Number'}
              </label>
              <div className="relative">
                <div className="absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-theme-muted">
                  <Hash className="h-4 w-4" />
                </div>
                <input
                  id="taxNumber"
                  name="taxNumber"
                  type="text"
                  value={formData.taxNumber}
                  onChange={handleChange}
                  className="glass-input py-2.5 text-sm ltr:pl-10 rtl:pr-10"
                  placeholder="123456789"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Corporate-specific: Contact Person (full width) */}
        {formData.customerType === CustomerType.CORPORATE && (
          <div className="space-y-1">
            <label htmlFor="contactPerson" className="block text-xs font-medium text-theme-secondary">
              {isRTL ? 'جهة الاتصال' : 'Contact Person'}
            </label>
            <div className="relative">
              <div className="absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-theme-muted">
                <User className="h-4 w-4" />
              </div>
              <input
                id="contactPerson"
                name="contactPerson"
                type="text"
                value={formData.contactPerson}
                onChange={handleChange}
                className="glass-input py-2.5 text-sm ltr:pl-10 rtl:pr-10"
                placeholder={isRTL ? 'محمد أحمد' : 'Contact Name'}
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {/* Consultant-specific Row: License & Firm */}
        {formData.customerType === CustomerType.CONSULTANT && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="licenseNumber" className="block text-xs font-medium text-theme-secondary">
                {isRTL ? 'رقم الترخيص' : 'License No.'} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-theme-muted">
                  <BadgeCheck className="h-4 w-4" />
                </div>
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  type="text"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className={`glass-input py-2.5 text-sm ltr:pl-10 rtl:pr-10 ${errors.licenseNumber ? 'border-red-500/50 ring-1 ring-red-500/30' : ''}`}
                  placeholder="ENG-12345"
                  disabled={isLoading}
                />
              </div>
              {errors.licenseNumber && <p className="text-xs text-red-400">{errors.licenseNumber}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor="consultingFirm" className="block text-xs font-medium text-theme-secondary">
                {isRTL ? 'المكتب الاستشاري' : 'Consulting Firm'}
              </label>
              <div className="relative">
                <div className="absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-theme-muted">
                  <Building className="h-4 w-4" />
                </div>
                <input
                  id="consultingFirm"
                  name="consultingFirm"
                  type="text"
                  value={formData.consultingFirm}
                  onChange={handleChange}
                  className="glass-input py-2.5 text-sm ltr:pl-10 rtl:pr-10"
                  placeholder={isRTL ? 'مكتب الاستشارات' : 'Firm Name'}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Row: Password & Confirm Password */}
        <div className="grid grid-cols-2 gap-3">
          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-xs font-medium text-theme-secondary">
              {isRTL ? 'كلمة المرور' : 'Password'} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-theme-muted">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                className={`glass-input py-2.5 text-sm ltr:pl-10 rtl:pr-10 ltr:pr-10 rtl:pl-10 ${errors.password ? 'border-red-500/50 ring-1 ring-red-500/30' : ''}`}
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 rtl:left-3 ltr:right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-theme-secondary">
              {isRTL ? 'تأكيد كلمة المرور' : 'Confirm'} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-theme-muted">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`glass-input py-2.5 text-sm ltr:pl-10 rtl:pr-10 ltr:pr-10 rtl:pl-10 ${errors.confirmPassword ? 'border-red-500/50 ring-1 ring-red-500/30' : ''}`}
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 rtl:left-3 ltr:right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
          </div>
        </div>

        {/* Terms */}
        <p className="text-xs text-theme-muted text-center pt-1">
          {isRTL ? 'بالتسجيل، أنت توافق على' : 'By registering, you agree to our'}{' '}
          <Link to="/terms" className="text-[#d4a84b] hover:text-[#f26522] transition-colors">
            {isRTL ? 'الشروط' : 'Terms'}
          </Link>{' '}
          {isRTL ? 'و' : '&'}{' '}
          <Link to="/privacy" className="text-[#d4a84b] hover:text-[#f26522] transition-colors">
            {isRTL ? 'الخصوصية' : 'Privacy'}
          </Link>
        </p>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="relative w-full overflow-hidden rounded-xl px-6 py-3 font-bold text-white transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <span>{isRTL ? 'جاري إنشاء الحساب...' : 'Creating Account...'}</span>
              </>
            ) : (
              <>
                <span>{isRTL ? 'إنشاء الحساب' : 'Create Account'}</span>
                <UserPlus className="h-5 w-5" />
              </>
            )}
          </span>
        </button>
      </form>

      {/* Login Link */}
      <p className="mt-4 text-center text-sm text-theme-muted">
        {isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
        <Link
          to="/login/customer"
          className="font-semibold text-[#d4a84b] hover:text-[#f26522] transition-colors"
        >
          {isRTL ? 'تسجيل الدخول' : 'Login'}
        </Link>
      </p>
    </div>
  );
}
