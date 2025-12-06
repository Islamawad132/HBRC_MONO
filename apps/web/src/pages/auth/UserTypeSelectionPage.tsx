import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { Users, Briefcase, ArrowLeft, ArrowRight } from 'lucide-react';

interface UserTypeCardProps {
  to: string;
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}

function UserTypeCard({ to, icon: Icon, title, description, gradient, delay }: UserTypeCardProps) {
  const { language } = useSettings();
  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <Link
      to={to}
      className="group relative block animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Glow effect on hover */}
      <div
        className={`absolute -inset-1 rounded-2xl opacity-0 blur-lg transition-all duration-500 group-hover:opacity-40 ${gradient}`}
      />

      {/* Card */}
      <div className="relative glass-card !p-4 overflow-hidden transition-all duration-500 group-hover:scale-[1.02]">
        {/* Background gradient */}
        <div
          className={`absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-10 ${gradient}`}
        />

        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="relative shrink-0">
            <div
              className={`absolute inset-0 rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity ${gradient}`}
            />
            <div
              className={`relative flex h-14 w-14 items-center justify-center rounded-xl ${gradient} shadow-lg transition-transform duration-500 group-hover:scale-110`}
            >
              <Icon className="h-7 w-7 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-theme-primary group-hover:text-gradient transition-colors">
              {title}
            </h3>
            <p className="text-sm text-theme-muted">{description}</p>
          </div>

          {/* Arrow indicator */}
          <div className="shrink-0">
            <ArrowIcon className="h-5 w-5 text-theme-muted group-hover:text-theme-primary transition-all duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </div>
        </div>

        {/* Shine effect */}
        <div className="absolute inset-0 -translate-x-full opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-30">
          <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white to-transparent skew-x-12" />
        </div>
      </div>
    </Link>
  );
}

export function UserTypeSelectionPage() {
  const { t } = useTranslation();

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 text-center animate-fade-in">
        <h1 className="mb-1 text-2xl font-bold text-theme-primary">{t('auth.welcome')}</h1>
        <p className="text-sm text-theme-muted">{t('auth.selectAccountType')}</p>
      </div>

      {/* User Type Cards */}
      <div className="grid gap-3">
        <UserTypeCard
          to="/login/employee"
          icon={Briefcase}
          title={t('auth.employee')}
          description={t('auth.employeeDescription')}
          gradient="bg-gradient-to-br from-[#a0592b] to-[#7a4420]"
          delay={100}
        />

        <UserTypeCard
          to="/login/customer"
          icon={Users}
          title={t('auth.customer')}
          description={t('auth.customerDescription')}
          gradient="bg-gradient-to-br from-[#f26522] to-[#d4a84b]"
          delay={200}
        />
      </div>

      {/* Register Link */}
      <div className="mt-5 text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
        <p className="text-sm text-theme-muted">
          {t('auth.noAccount')}{' '}
          <Link
            to="/register"
            className="font-semibold text-[#d4a84b] hover:text-[#f26522] transition-colors"
          >
            {t('auth.registerAsCustomer')}
          </Link>
        </p>
      </div>
    </div>
  );
}
