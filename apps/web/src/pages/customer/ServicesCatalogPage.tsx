import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { servicesService } from '../../services/services.service';
import type { Service } from '../../types/interfaces';
import { ServiceCategory, getLabel, ServiceCategoryLabels } from '../../types/enums';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Modal, ModalFooter } from '../../components/ui/Modal';
import {
  Building2,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  Clock,
  DollarSign,
  FileText,
  X,
  ChevronDown,
  Sparkles,
  FlaskConical,
  Shield,
  Flame,
  Leaf,
  GraduationCap,
  Mountain,
  Boxes,
  Building,
  Activity,
  Thermometer,
  Volume2,
  MoreHorizontal,
  CheckCircle,
  Info,
} from 'lucide-react';

// Category icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
  LAB_TESTS: <FlaskConical className="h-6 w-6" />,
  CONSULTANCY: <Building2 className="h-6 w-6" />,
  STATIONS_APPROVAL: <Shield className="h-6 w-6" />,
  FIRE_SAFETY: <Flame className="h-6 w-6" />,
  GREEN_BUILDING: <Leaf className="h-6 w-6" />,
  TRAINING: <GraduationCap className="h-6 w-6" />,
  SOIL_TESTING: <Mountain className="h-6 w-6" />,
  CONCRETE_TESTING: <Boxes className="h-6 w-6" />,
  STRUCTURAL_REVIEW: <Building className="h-6 w-6" />,
  SEISMIC_ANALYSIS: <Activity className="h-6 w-6" />,
  THERMAL_INSULATION: <Thermometer className="h-6 w-6" />,
  ACOUSTIC_TESTING: <Volume2 className="h-6 w-6" />,
  OTHER: <MoreHorizontal className="h-6 w-6" />,
};

// Category colors
const categoryColors: Record<string, string> = {
  LAB_TESTS: 'from-blue-500 to-cyan-500',
  CONSULTANCY: 'from-purple-500 to-pink-500',
  STATIONS_APPROVAL: 'from-amber-500 to-orange-500',
  FIRE_SAFETY: 'from-red-500 to-orange-500',
  GREEN_BUILDING: 'from-green-500 to-emerald-500',
  TRAINING: 'from-indigo-500 to-purple-500',
  SOIL_TESTING: 'from-yellow-600 to-amber-600',
  CONCRETE_TESTING: 'from-gray-500 to-slate-500',
  STRUCTURAL_REVIEW: 'from-teal-500 to-cyan-500',
  SEISMIC_ANALYSIS: 'from-rose-500 to-red-500',
  THERMAL_INSULATION: 'from-orange-500 to-yellow-500',
  ACOUSTIC_TESTING: 'from-violet-500 to-purple-500',
  OTHER: 'from-gray-400 to-gray-500',
};

export function ServicesCatalogPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const navigate = useNavigate();
  const isRTL = language === 'ar';

  // State
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Get unique categories from services
  const categories = Array.from(new Set(services.map((s) => s.category)));

  // Fetch services
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await servicesService.getActiveServices();
      setServices(data || []);
    } catch (error) {
      console.error('Failed to fetch services:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Filter services
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      !searchQuery ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.nameAr.includes(searchQuery) ||
      service.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || service.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group services by category
  const groupedServices = filteredServices.reduce((acc, service) => {
    const category = service.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  // Get price display
  const getPriceDisplay = (service: Service) => {
    if (service.pricingType === 'FIXED' && service.basePrice) {
      return formatCurrency(service.basePrice);
    } else if (service.pricingType === 'VARIABLE' && service.minPrice && service.maxPrice) {
      return `${formatCurrency(service.minPrice)} - ${formatCurrency(service.maxPrice)}`;
    } else if (service.pricingType === 'VARIABLE' && service.minPrice) {
      return `${isRTL ? 'من' : 'From'} ${formatCurrency(service.minPrice)}`;
    }
    return isRTL ? 'حسب الطلب' : 'On Request';
  };

  // Handle service selection
  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setShowModal(true);
  };

  // Handle request service
  const handleRequestService = (service: Service) => {
    navigate(`/new-request/${service.id}`);
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#f26522]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="glass-card overflow-hidden p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#a0592b] to-[#f26522]">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {isRTL ? 'كتالوج الخدمات' : 'Services Catalog'}
              </h1>
              <p className="text-sm text-white/60">
                {isRTL
                  ? 'استعرض خدماتنا واطلب الخدمة التي تحتاجها'
                  : 'Browse our services and request what you need'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Sparkles className="h-4 w-4 text-[#f26522]" />
            <span>
              {services.length} {isRTL ? 'خدمة متاحة' : 'services available'}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40 rtl:right-auto rtl:left-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'ابحث عن خدمة...' : 'Search services...'}
              className="glass-input w-full pr-10 rtl:pl-10 rtl:pr-4"
            />
          </div>

          {/* Category Filter */}
          <div className="relative min-w-[200px]">
            <Filter className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40 rtl:right-auto rtl:left-3" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="glass-input w-full appearance-none pr-10 rtl:pl-10 rtl:pr-4"
            >
              <option value="">{isRTL ? 'جميع الفئات' : 'All Categories'}</option>
              {Object.values(ServiceCategory).map((category) => (
                <option key={category} value={category}>
                  {getLabel(ServiceCategoryLabels, category, language)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 rtl:left-auto rtl:right-3" />
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
              }}
              className="glass-button flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white"
            >
              <X className="h-4 w-4" />
              <span>{t('common.clearFilters')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
          <Building2 className="mb-4 h-16 w-16 text-white/20" />
          <h3 className="text-lg font-medium text-white">
            {isRTL ? 'لا توجد خدمات' : 'No Services Found'}
          </h3>
          <p className="mt-1 text-sm text-white/60">
            {isRTL ? 'جرب البحث بكلمات أخرى' : 'Try different search terms'}
          </p>
        </div>
      ) : selectedCategory ? (
        // Single category view
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${categoryColors[selectedCategory] || 'from-gray-400 to-gray-500'}`}
            >
              {categoryIcons[selectedCategory]}
            </div>
            <h2 className="text-xl font-bold text-white">
              {getLabel(ServiceCategoryLabels, selectedCategory, language)}
            </h2>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/60">
              {filteredServices.length} {isRTL ? 'خدمة' : 'services'}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                language={language}
                isRTL={isRTL}
                onSelect={handleSelectService}
                onRequest={handleRequestService}
                formatCurrency={formatCurrency}
                getPriceDisplay={getPriceDisplay}
              />
            ))}
          </div>
        </div>
      ) : (
        // Grouped by category view
        <div className="space-y-8">
          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${categoryColors[category] || 'from-gray-400 to-gray-500'}`}
                  >
                    {categoryIcons[category]}
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {getLabel(ServiceCategoryLabels, category as ServiceCategory, language)}
                  </h2>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/60">
                    {categoryServices.length}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCategory(category)}
                  className="flex items-center gap-1 text-sm text-white/60 transition-colors hover:text-white"
                >
                  <span>{t('common.viewAll')}</span>
                  <ArrowIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categoryServices.slice(0, 3).map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    language={language}
                    isRTL={isRTL}
                    onSelect={handleSelectService}
                    onRequest={handleRequestService}
                    formatCurrency={formatCurrency}
                    getPriceDisplay={getPriceDisplay}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Details Modal */}
      {showModal && selectedService && (
        <ServiceDetailsModal
          service={selectedService}
          language={language}
          isRTL={isRTL}
          onClose={() => {
            setShowModal(false);
            setSelectedService(null);
          }}
          onRequest={handleRequestService}
          formatCurrency={formatCurrency}
          getPriceDisplay={getPriceDisplay}
        />
      )}
    </div>
  );
}

// Service Card Component
interface ServiceCardProps {
  service: Service;
  language: string;
  isRTL: boolean;
  onSelect: (service: Service) => void;
  onRequest: (service: Service) => void;
  formatCurrency: (amount: number) => string;
  getPriceDisplay: (service: Service) => string;
}

function ServiceCard({
  service,
  language,
  isRTL,
  onSelect,
  onRequest,
  formatCurrency,
  getPriceDisplay,
}: ServiceCardProps) {
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="glass-card group overflow-hidden transition-all hover:scale-[1.02]">
      {/* Card Header */}
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${categoryColors[service.category] || 'from-gray-400 to-gray-500'}`}
          >
            {categoryIcons[service.category]}
          </div>
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60">
            {service.code}
          </span>
        </div>

        <h3 className="mb-2 font-semibold text-white">
          {language === 'ar' ? service.nameAr : service.name}
        </h3>

        {(service.description || service.descriptionAr) && (
          <p className="mb-3 line-clamp-2 text-sm text-white/60">
            {language === 'ar' ? service.descriptionAr : service.description}
          </p>
        )}

        {/* Service Info */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-[#f26522]" />
            <span className="font-medium text-[#f26522]">{getPriceDisplay(service)}</span>
          </div>
          {service.duration && (
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Clock className="h-4 w-4" />
              <span>
                {service.duration} {isRTL ? 'يوم' : 'days'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="flex border-t border-white/10">
        <button
          onClick={() => onSelect(service)}
          className="flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Info className="h-4 w-4" />
          <span>{isRTL ? 'التفاصيل' : 'Details'}</span>
        </button>
        <div className="w-px bg-white/10" />
        <button
          onClick={() => onRequest(service)}
          className="flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm text-[#f26522] transition-colors hover:bg-[#f26522]/10"
        >
          <span>{isRTL ? 'اطلب الآن' : 'Request'}</span>
          <ArrowIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Service Details Modal
interface ServiceDetailsModalProps {
  service: Service;
  language: string;
  isRTL: boolean;
  onClose: () => void;
  onRequest: (service: Service) => void;
  formatCurrency: (amount: number) => string;
  getPriceDisplay: (service: Service) => string;
}

function ServiceDetailsModal({
  service,
  language,
  isRTL,
  onClose,
  onRequest,
  getPriceDisplay,
}: ServiceDetailsModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={language === 'ar' ? service.nameAr : service.name}
      icon={Building2}
      size="lg"
      footer={
        <ModalFooter>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 font-medium text-white transition-colors hover:bg-white/10"
          >
            {t('common.close')}
          </button>
          <button
            onClick={() => onRequest(service)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a0592b] to-[#f26522] px-4 py-2.5 font-medium text-white transition-colors hover:opacity-90"
          >
            <FileText className="h-5 w-5" />
            <span>{isRTL ? 'اطلب هذه الخدمة' : 'Request This Service'}</span>
          </button>
        </ModalFooter>
      }
    >
      <div className="space-y-6">
        {/* Service Header */}
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${categoryColors[service.category] || 'from-gray-400 to-gray-500'}`}
          >
            {categoryIcons[service.category]}
          </div>
          <div>
            <p className="text-sm text-white/60">{service.code}</p>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-white/80">
              {getLabel(ServiceCategoryLabels, service.category, language)}
            </span>
          </div>
        </div>

        {/* Description */}
        {(service.description || service.descriptionAr) && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-white/60">
              {isRTL ? 'الوصف' : 'Description'}
            </h3>
            <p className="text-white">
              {language === 'ar' ? service.descriptionAr : service.description}
            </p>
          </div>
        )}

        {/* Pricing Info */}
        <div className="rounded-lg bg-white/5 p-4">
          <h3 className="mb-3 text-sm font-medium text-white/60">
            {isRTL ? 'معلومات التسعير' : 'Pricing Information'}
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/60">{isRTL ? 'السعر' : 'Price'}</span>
              <span className="text-lg font-bold text-[#f26522]">{getPriceDisplay(service)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/60">{isRTL ? 'نوع التسعير' : 'Pricing Type'}</span>
              <span className="text-white">
                {service.pricingType === 'FIXED'
                  ? isRTL
                    ? 'سعر ثابت'
                    : 'Fixed Price'
                  : service.pricingType === 'VARIABLE'
                  ? isRTL
                    ? 'سعر متغير'
                    : 'Variable Price'
                  : isRTL
                  ? 'تسعير مخصص'
                  : 'Custom Quote'}
              </span>
            </div>

            {service.duration && (
              <div className="flex items-center justify-between">
                <span className="text-white/60">{isRTL ? 'المدة المتوقعة' : 'Duration'}</span>
                <span className="text-white">
                  {service.duration} {isRTL ? 'يوم' : 'days'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Requirements */}
        {(service.requirements || service.requirementsAr) && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-white/60">
              {isRTL ? 'المتطلبات' : 'Requirements'}
            </h3>
            <div className="rounded-lg bg-white/5 p-4">
              <p className="text-sm text-white">
                {language === 'ar' ? service.requirementsAr : service.requirements}
              </p>
            </div>
          </div>
        )}

        {/* Features */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-white/60">
            {isRTL ? 'ما يشمله' : 'What\'s Included'}
          </h3>
          <div className="space-y-2">
            {[
              isRTL ? 'تقرير فني مفصل' : 'Detailed technical report',
              isRTL ? 'شهادة معتمدة' : 'Certified documentation',
              isRTL ? 'دعم فني متخصص' : 'Expert technical support',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-white/80">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
