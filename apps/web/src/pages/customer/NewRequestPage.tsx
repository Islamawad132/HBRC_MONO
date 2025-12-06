import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { servicesService } from '../../services/services.service';
import { requestsService } from '../../services/requests.service';
import { documentsService } from '../../services/documents.service';
import type { Service, CreateServiceRequestRequest } from '../../types/interfaces';
import { RequestPriority, getLabel, ServiceCategoryLabels, RequestPriorityLabels } from '../../types/enums';
import { toast } from 'sonner';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  ArrowRight,
  ArrowLeft,
  Upload,
  X,
  ChevronDown,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  File,
  Trash2,
  Building2,
  Loader2,
  Send,
  Info,
} from 'lucide-react';

// File type icons
const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
  return '📎';
};

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function NewRequestPage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const isRTL = language === 'ar';

  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Form data
  const [formData, setFormData] = useState({
    serviceId: serviceId || '',
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    notesEn: '',
    notesAr: '',
    priority: 'MEDIUM' as RequestPriority,
    expectedDate: '',
  });

  // Uploaded files
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Fetch services
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await servicesService.getActiveServices();
      setServices(data || []);

      // If serviceId is provided, find and select the service
      if (serviceId) {
        const service = data?.find((s) => s.id === serviceId);
        if (service) {
          setSelectedService(service);
          setFormData((prev) => ({ ...prev, serviceId: service.id }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [serviceId, t]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Handle service selection
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setFormData((prev) => ({ ...prev, serviceId: service.id }));
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validFiles: File[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        toast.error(`${file.name} ${isRTL ? 'حجم الملف كبير جدًا' : 'is too large'}`);
        return;
      }
      validFiles.push(file);
    });

    setUploadedFiles((prev) => [...prev, ...validFiles]);
  };

  // Remove file
  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (!files) return;

    const validFiles: File[] = [];
    const maxSize = 10 * 1024 * 1024;

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        toast.error(`${file.name} ${isRTL ? 'حجم الملف كبير جدًا' : 'is too large'}`);
        return;
      }
      validFiles.push(file);
    });

    setUploadedFiles((prev) => [...prev, ...validFiles]);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  // Get estimated price
  const getEstimatedPrice = () => {
    if (!selectedService) return null;

    if (selectedService.pricingType === 'FIXED' && selectedService.basePrice) {
      return formatCurrency(selectedService.basePrice);
    } else if (selectedService.pricingType === 'VARIABLE' && selectedService.minPrice && selectedService.maxPrice) {
      return `${formatCurrency(selectedService.minPrice)} - ${formatCurrency(selectedService.maxPrice)}`;
    } else if (selectedService.pricingType === 'VARIABLE' && selectedService.minPrice) {
      return `${isRTL ? 'من' : 'From'} ${formatCurrency(selectedService.minPrice)}`;
    }
    return isRTL ? 'سيتم تحديده لاحقًا' : 'To be determined';
  };

  // Validate form
  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return !!selectedService;
      case 2:
        return formData.titleEn.trim() !== '' && formData.titleAr.trim() !== '';
      case 3:
        return true; // Documents are optional
      default:
        return true;
    }
  };

  // Handle next step
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    } else {
      if (currentStep === 1) {
        toast.error(isRTL ? 'يرجى اختيار الخدمة' : 'Please select a service');
      } else if (currentStep === 2) {
        toast.error(isRTL ? 'يرجى إدخال عنوان الطلب' : 'Please enter request title');
      }
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedService || !user) return;

    try {
      setSubmitting(true);

      // Create request data
      const requestData: CreateServiceRequestRequest = {
        serviceId: selectedService.id,
        title: formData.titleEn,
        titleAr: formData.titleAr,
        description: formData.descriptionEn || undefined,
        descriptionAr: formData.descriptionAr || undefined,
        notes: formData.notesEn || undefined,
        notesAr: formData.notesAr || undefined,
        priority: formData.priority,
        expectedDate: formData.expectedDate || undefined,
      };

      // Create the request
      const createdRequest = await requestsService.create(requestData);

      // Upload documents if any
      if (uploadedFiles.length > 0 && createdRequest.id) {
        setUploading(true);
        for (const file of uploadedFiles) {
          try {
            await documentsService.upload(file, {
              requestId: createdRequest.id,
              type: 'OTHER',
            });
          } catch (uploadError) {
            console.error('Failed to upload file:', file.name, uploadError);
          }
        }
        setUploading(false);
      }

      toast.success(isRTL ? 'تم إنشاء الطلب بنجاح' : 'Request created successfully');
      navigate(`/my-requests/${createdRequest.id}`);
    } catch (error) {
      console.error('Failed to create request:', error);
      toast.error(isRTL ? 'فشل في إنشاء الطلب' : 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#f26522]" />
      </div>
    );
  }

  // Steps configuration
  const steps = [
    { number: 1, title: isRTL ? 'اختيار الخدمة' : 'Select Service' },
    { number: 2, title: isRTL ? 'تفاصيل الطلب' : 'Request Details' },
    { number: 3, title: isRTL ? 'المستندات' : 'Documents' },
    { number: 4, title: isRTL ? 'المراجعة والإرسال' : 'Review & Submit' },
  ];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#a0592b] to-[#f26522]">
            <FileText className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isRTL ? 'طلب خدمة جديدة' : 'New Service Request'}
            </h1>
            <p className="text-sm text-white/60">
              {isRTL
                ? 'اتبع الخطوات لإرسال طلبك'
                : 'Follow the steps to submit your request'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                    currentStep >= step.number
                      ? 'bg-gradient-to-br from-[#a0592b] to-[#f26522] text-white'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`hidden text-sm font-medium sm:block ${
                    currentStep >= step.number ? 'text-white' : 'text-white/40'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-4 h-px w-8 sm:w-16 ${
                    currentStep > step.number ? 'bg-[#f26522]' : 'bg-white/20'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="glass-card p-6">
        {/* Step 1: Select Service */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">
              {isRTL ? 'اختر الخدمة المطلوبة' : 'Select the Service You Need'}
            </h2>

            {/* Service Search */}
            <div className="relative">
              <input
                type="text"
                placeholder={isRTL ? 'ابحث عن خدمة...' : 'Search for a service...'}
                className="glass-input w-full"
              />
            </div>

            {/* Service Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    selectedService?.id === service.id
                      ? 'border-[#f26522] bg-[#f26522]/10'
                      : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#a0592b]/20 to-[#f26522]/20">
                      <Building2 className="h-5 w-5 text-[#f26522]" />
                    </div>
                    {selectedService?.id === service.id && (
                      <CheckCircle className="h-5 w-5 text-[#f26522]" />
                    )}
                  </div>
                  <h3 className="mb-1 font-medium text-white">
                    {language === 'ar' ? service.nameAr : service.name}
                  </h3>
                  <p className="mb-2 text-xs text-white/60">
                    {getLabel(ServiceCategoryLabels, service.category, language)}
                  </p>
                  {service.basePrice && (
                    <p className="text-sm font-medium text-[#f26522]">
                      {formatCurrency(service.basePrice)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Selected Service Summary */}
            {selectedService && (
              <div className="rounded-xl bg-[#f26522]/10 p-4">
                <h3 className="mb-2 text-sm font-medium text-white/60">
                  {isRTL ? 'الخدمة المختارة' : 'Selected Service'}
                </h3>
                <p className="text-lg font-semibold text-white">
                  {language === 'ar' ? selectedService.nameAr : selectedService.name}
                </p>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1 text-white/60">
                    <DollarSign className="h-4 w-4 text-[#f26522]" />
                    {getEstimatedPrice()}
                  </span>
                  {selectedService.duration && (
                    <span className="flex items-center gap-1 text-white/60">
                      <Clock className="h-4 w-4" />
                      {selectedService.duration} {isRTL ? 'يوم' : 'days'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Request Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">
              {isRTL ? 'أدخل تفاصيل الطلب' : 'Enter Request Details'}
            </h2>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Title (English) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  {isRTL ? 'عنوان الطلب (إنجليزي)' : 'Request Title (English)'} *
                </label>
                <input
                  type="text"
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                  placeholder={isRTL ? 'أدخل العنوان بالإنجليزية' : 'Enter title in English'}
                  className="glass-input w-full"
                  dir="ltr"
                />
              </div>

              {/* Title (Arabic) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  {isRTL ? 'عنوان الطلب (عربي)' : 'Request Title (Arabic)'} *
                </label>
                <input
                  type="text"
                  value={formData.titleAr}
                  onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                  placeholder={isRTL ? 'أدخل العنوان بالعربية' : 'Enter title in Arabic'}
                  className="glass-input w-full"
                  dir="rtl"
                />
              </div>

              {/* Description (English) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  {isRTL ? 'الوصف (إنجليزي)' : 'Description (English)'}
                </label>
                <textarea
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  placeholder={isRTL ? 'أدخل الوصف بالإنجليزية' : 'Enter description in English'}
                  className="glass-input min-h-[100px] w-full"
                  dir="ltr"
                />
              </div>

              {/* Description (Arabic) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  {isRTL ? 'الوصف (عربي)' : 'Description (Arabic)'}
                </label>
                <textarea
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  placeholder={isRTL ? 'أدخل الوصف بالعربية' : 'Enter description in Arabic'}
                  className="glass-input min-h-[100px] w-full"
                  dir="rtl"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  {isRTL ? 'الأولوية' : 'Priority'}
                </label>
                <div className="relative">
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as RequestPriority })
                    }
                    className="glass-input w-full appearance-none"
                  >
                    {Object.values(RequestPriority).map((priority) => (
                      <option key={priority} value={priority}>
                        {getLabel(RequestPriorityLabels, priority, language)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 rtl:left-auto rtl:right-3" />
                </div>
              </div>

              {/* Expected Date */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  {isRTL ? 'التاريخ المتوقع' : 'Expected Date'}
                </label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40 rtl:right-auto rtl:left-3" />
                  <input
                    type="date"
                    value={formData.expectedDate}
                    onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                    className="glass-input w-full pr-10 rtl:pl-10 rtl:pr-4"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Notes (English) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  {isRTL ? 'ملاحظات إضافية (إنجليزي)' : 'Additional Notes (English)'}
                </label>
                <textarea
                  value={formData.notesEn}
                  onChange={(e) => setFormData({ ...formData, notesEn: e.target.value })}
                  placeholder={isRTL ? 'أي ملاحظات إضافية' : 'Any additional notes'}
                  className="glass-input min-h-[80px] w-full"
                  dir="ltr"
                />
              </div>

              {/* Notes (Arabic) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  {isRTL ? 'ملاحظات إضافية (عربي)' : 'Additional Notes (Arabic)'}
                </label>
                <textarea
                  value={formData.notesAr}
                  onChange={(e) => setFormData({ ...formData, notesAr: e.target.value })}
                  placeholder={isRTL ? 'أي ملاحظات إضافية' : 'Any additional notes'}
                  className="glass-input min-h-[80px] w-full"
                  dir="rtl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">
              {isRTL ? 'ارفق المستندات المطلوبة' : 'Attach Required Documents'}
            </h2>

            {/* Requirements Info */}
            {selectedService?.requirements && (
              <div className="flex items-start gap-3 rounded-xl bg-blue-500/10 p-4">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
                <div>
                  <h3 className="mb-1 text-sm font-medium text-blue-400">
                    {isRTL ? 'المتطلبات' : 'Requirements'}
                  </h3>
                  <p className="text-sm text-white/80">
                    {language === 'ar'
                      ? selectedService.requirementsAr
                      : selectedService.requirements}
                  </p>
                </div>
              </div>
            )}

            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-8 text-center transition-colors hover:border-[#f26522]/50"
            >
              <Upload className="mx-auto mb-4 h-12 w-12 text-white/40" />
              <p className="mb-2 text-white">
                {isRTL ? 'اسحب الملفات وأفلتها هنا' : 'Drag and drop files here'}
              </p>
              <p className="mb-4 text-sm text-white/60">
                {isRTL ? 'أو' : 'or'}
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
                />
                <span className="glass-button inline-flex items-center gap-2 px-4 py-2 text-white">
                  <File className="h-4 w-4" />
                  {isRTL ? 'اختر الملفات' : 'Choose Files'}
                </span>
              </label>
              <p className="mt-4 text-xs text-white/40">
                PDF, DOC, XLS, JPG, PNG, ZIP ({isRTL ? 'الحد الأقصى' : 'max'} 10MB)
              </p>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white/60">
                  {isRTL ? 'الملفات المرفقة' : 'Attached Files'} ({uploadedFiles.length})
                </h3>
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFileIcon(file.type)}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{file.name}</p>
                        <p className="text-xs text-white/60">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">
              {isRTL ? 'راجع طلبك قبل الإرسال' : 'Review Your Request Before Submitting'}
            </h2>

            {/* Service Summary */}
            <div className="rounded-xl bg-white/5 p-4">
              <h3 className="mb-3 text-sm font-medium text-white/60">
                {isRTL ? 'الخدمة المطلوبة' : 'Requested Service'}
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b]/20 to-[#f26522]/20">
                  <Building2 className="h-6 w-6 text-[#f26522]" />
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {language === 'ar' ? selectedService?.nameAr : selectedService?.name}
                  </p>
                  <p className="text-sm text-white/60">
                    {selectedService && getLabel(ServiceCategoryLabels, selectedService.category, language)}
                  </p>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="rounded-xl bg-white/5 p-4">
              <h3 className="mb-3 text-sm font-medium text-white/60">
                {isRTL ? 'تفاصيل الطلب' : 'Request Details'}
              </h3>
              <div className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-white/40">
                      {isRTL ? 'العنوان (إنجليزي)' : 'Title (English)'}
                    </p>
                    <p className="text-white">{formData.titleEn || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">
                      {isRTL ? 'العنوان (عربي)' : 'Title (Arabic)'}
                    </p>
                    <p className="text-white" dir="rtl">
                      {formData.titleAr || '-'}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-white/40">{isRTL ? 'الأولوية' : 'Priority'}</p>
                    <p className="text-white">
                      {getLabel(RequestPriorityLabels, formData.priority, language)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">
                      {isRTL ? 'التاريخ المتوقع' : 'Expected Date'}
                    </p>
                    <p className="text-white">{formData.expectedDate || '-'}</p>
                  </div>
                </div>
                {(formData.descriptionEn || formData.descriptionAr) && (
                  <div>
                    <p className="text-xs text-white/40">{isRTL ? 'الوصف' : 'Description'}</p>
                    <p className="text-white">
                      {language === 'ar' ? formData.descriptionAr : formData.descriptionEn}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="rounded-xl bg-white/5 p-4">
              <h3 className="mb-3 text-sm font-medium text-white/60">
                {isRTL ? 'المستندات المرفقة' : 'Attached Documents'}
              </h3>
              {uploadedFiles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1 text-sm text-white"
                    >
                      <span>{getFileIcon(file.type)}</span>
                      {file.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-white/60">{isRTL ? 'لا توجد مستندات' : 'No documents attached'}</p>
              )}
            </div>

            {/* Pricing Summary */}
            <div className="rounded-xl bg-[#f26522]/10 p-4">
              <h3 className="mb-3 text-sm font-medium text-white/60">
                {isRTL ? 'ملخص التكلفة' : 'Cost Summary'}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-white">{isRTL ? 'التكلفة التقديرية' : 'Estimated Cost'}</span>
                <span className="text-xl font-bold text-[#f26522]">{getEstimatedPrice()}</span>
              </div>
              <p className="mt-2 text-xs text-white/60">
                {isRTL
                  ? 'السعر النهائي قد يختلف بناءً على متطلبات المشروع'
                  : 'Final price may vary based on project requirements'}
              </p>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
              <div>
                <p className="text-sm text-white">
                  {isRTL
                    ? 'بإرسال هذا الطلب، فإنك توافق على الشروط والأحكام الخاصة بنا.'
                    : 'By submitting this request, you agree to our terms and conditions.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
          {currentStep > 1 ? (
            <button
              onClick={handlePrevStep}
              className="glass-button flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white"
            >
              {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              <span>{t('common.previous')}</span>
            </button>
          ) : (
            <Link
              to="/services-catalog"
              className="glass-button flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white"
            >
              {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              <span>{t('common.back')}</span>
            </Link>
          )}

          {currentStep < 4 ? (
            <button
              onClick={handleNextStep}
              disabled={!validateStep(currentStep)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#a0592b] to-[#f26522] px-6 py-3 font-semibold text-white transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{t('common.next')}</span>
              <ArrowIcon className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#a0592b] to-[#f26522] px-6 py-3 font-semibold text-white transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{isRTL ? 'جاري الإرسال...' : 'Submitting...'}</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>{isRTL ? 'إرسال الطلب' : 'Submit Request'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
