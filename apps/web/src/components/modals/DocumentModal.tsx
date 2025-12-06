import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { Modal, InputField, SelectField, TextareaField, CheckboxField, Button } from '../ui';
import { DocumentType, DocumentTypeLabels, getLabel } from '../../types/enums';
import type { Document, UploadDocumentRequest, UpdateDocumentRequest, ServiceRequest } from '../../types/interfaces';
import { documentsService } from '../../services/documents.service';
import { requestsService } from '../../services/requests.service';
import { toast } from 'sonner';
import { Save, X, Upload, FileText, File, Trash2 } from 'lucide-react';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document?: Document | null;
  onSuccess: () => void;
  requestId?: string; // Pre-selected request
}

interface FormData {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  type: DocumentType;
  requestId: string;
  isPublic: boolean;
}

interface FormErrors {
  title?: string;
  titleAr?: string;
  type?: string;
  file?: string;
}

export function DocumentModal({ isOpen, onClose, document, onSuccess, requestId }: DocumentModalProps) {
  const { t } = useTranslation();
  const { language } = useSettings();
  const isRTL = language === 'ar';
  const isEditMode = !!document;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    type: DocumentType.OTHER,
    requestId: requestId || '',
    isPublic: false,
  });

  // Fetch requests
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const response = await requestsService.getAll({ limit: 100 });
        setRequests(response.data);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
        toast.error(t('common.error'));
      } finally {
        setLoadingData(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, t]);

  useEffect(() => {
    if (isOpen) {
      if (document) {
        setFormData({
          title: document.title || '',
          titleAr: document.titleAr || '',
          description: document.description || '',
          descriptionAr: document.descriptionAr || '',
          type: document.type,
          requestId: document.requestId || '',
          isPublic: document.isPublic,
        });
      } else {
        setFormData({
          title: '',
          titleAr: '',
          description: '',
          descriptionAr: '',
          type: DocumentType.OTHER,
          requestId: requestId || '',
          isPublic: false,
        });
      }
      setSelectedFile(null);
      setErrors({});
    }
  }, [isOpen, document, requestId]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t('validation.required');
    }

    if (!formData.titleAr.trim()) {
      newErrors.titleAr = t('validation.required');
    }

    if (!isEditMode && !selectedFile) {
      newErrors.file = t('validation.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      if (isEditMode && document) {
        const updateData: UpdateDocumentRequest = {
          title: formData.title,
          titleAr: formData.titleAr,
          description: formData.description || undefined,
          descriptionAr: formData.descriptionAr || undefined,
          type: formData.type,
          isPublic: formData.isPublic,
        };
        await documentsService.update(document.id, updateData);
        toast.success(t('documents.updateSuccess'));
      } else {
        if (!selectedFile) {
          toast.error(t('documents.selectFile'));
          return;
        }

        const uploadData: UploadDocumentRequest = {
          file: selectedFile,
          title: formData.title,
          titleAr: formData.titleAr,
          description: formData.description || undefined,
          descriptionAr: formData.descriptionAr || undefined,
          type: formData.type,
          requestId: formData.requestId || undefined,
          isPublic: formData.isPublic,
        };
        await documentsService.upload(uploadData);
        toast.success(t('documents.uploadSuccess'));
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Failed to save document:', error);
      const errorMessage = error instanceof Error ? error.message : t('common.error');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrors((prev) => ({ ...prev, file: undefined }));

      // Auto-fill title from filename
      if (!formData.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setFormData((prev) => ({
          ...prev,
          title: nameWithoutExt,
          titleAr: nameWithoutExt,
        }));
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setErrors((prev) => ({ ...prev, file: undefined }));

      if (!formData.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setFormData((prev) => ({
          ...prev,
          title: nameWithoutExt,
          titleAr: nameWithoutExt,
        }));
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t('documents.editDocument') : t('documents.uploadDocument')}
      size="lg"
    >
      {loadingData ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#f26522]" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* File Upload (only for new documents) */}
          {!isEditMode && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                {t('documents.file')} <span className="text-red-400">*</span>
              </label>

              <div
                className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-[#f26522] bg-[#f26522]/10'
                    : errors.file
                      ? 'border-red-500/50 bg-red-500/5'
                      : 'border-white/20 bg-white/5 hover:border-white/30'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip,.rar"
                />

                {selectedFile ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f26522]/20">
                      <File className="h-6 w-6 text-[#f26522]" />
                    </div>
                    <div className="text-start">
                      <p className="font-medium text-white">{selectedFile.name}</p>
                      <p className="text-sm text-white/60">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="rounded-lg p-2 text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mx-auto mb-3 h-10 w-10 text-white/40" />
                    <p className="text-white/80">{t('documents.dragDrop')}</p>
                    <p className="mt-1 text-sm text-white/40">{t('documents.or')}</p>
                    <button
                      type="button"
                      className="mt-2 text-sm font-medium text-[#f26522] hover:underline"
                    >
                      {t('documents.browseFiles')}
                    </button>
                    <p className="mt-3 text-xs text-white/40">{t('documents.supportedFormats')}</p>
                  </div>
                )}
              </div>

              {errors.file && <p className="text-xs text-red-400">{errors.file}</p>}
            </div>
          )}

          {/* Title */}
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label={t('documents.titleEn')}
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              error={errors.title}
              required
              placeholder="Document title in English"
              dir="ltr"
            />

            <InputField
              label={t('documents.titleAr')}
              type="text"
              value={formData.titleAr}
              onChange={(e) => handleChange('titleAr', e.target.value)}
              error={errors.titleAr}
              required
              placeholder="عنوان المستند بالعربي"
              dir="rtl"
            />
          </div>

          {/* Description */}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextareaField
              label={t('documents.descriptionEn')}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description in English"
              dir="ltr"
            />

            <TextareaField
              label={t('documents.descriptionAr')}
              value={formData.descriptionAr}
              onChange={(e) => handleChange('descriptionAr', e.target.value)}
              placeholder="الوصف بالعربي"
              dir="rtl"
            />
          </div>

          {/* Type & Request */}
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label={t('documents.type')}
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              {Object.values(DocumentType).map((type) => (
                <option key={type} value={type}>
                  {getLabel(DocumentTypeLabels, type, language === 'ar' ? 'ar' : 'en')}
                </option>
              ))}
            </SelectField>

            <SelectField
              label={t('documents.linkedRequest')}
              value={formData.requestId}
              onChange={(e) => handleChange('requestId', e.target.value)}
            >
              <option value="">{t('documents.noRequest')}</option>
              {requests.map((request) => (
                <option key={request.id} value={request.id}>
                  {request.requestNumber} - {language === 'ar' ? request.titleAr : request.title}
                </option>
              ))}
            </SelectField>
          </div>

          {/* Visibility */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <CheckboxField
              label={t('documents.makePublic')}
              checked={formData.isPublic}
              onChange={(checked) => handleChange('isPublic', checked)}
            />
            <p className="mt-1 text-xs text-white/40">{t('documents.publicDescription')}</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} icon={<X className="h-4 w-4" />}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={loading} icon={isEditMode ? <Save className="h-4 w-4" /> : <Upload className="h-4 w-4" />}>
              {isEditMode ? t('common.save') : t('documents.upload')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
