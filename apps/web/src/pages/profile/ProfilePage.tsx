import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth.service';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Calendar,
  Edit2,
  Save,
  X,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Camera,
  MapPin,
  Briefcase,
  CheckCircle2,
  Trash2,
  Upload,
} from 'lucide-react';

export function ProfilePage() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const { user, userType, refreshUser } = useAuth();
  const isRTL = language === 'ar';

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    address: '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        position: user.position || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to update profile
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast.success(t('profile.updateSuccess'));
      setIsEditing(false);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('profile.passwordMismatch'));
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error(t('profile.passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement API call to change password
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast.success(t('profile.passwordChanged'));
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // Handle profile image upload
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('profile.invalidImageType'));
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('profile.imageTooLarge'));
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);

    try {
      await authService.uploadProfileImage(file, (progress) => {
        setUploadProgress(progress);
      });
      toast.success(t('profile.imageUploaded'));
      // Refresh user data to get the new profile image
      if (refreshUser) {
        await refreshUser();
      }
    } catch {
      toast.error(t('profile.imageUploadFailed'));
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!user?.profileImage) return;

    setUploadingImage(true);
    try {
      await authService.removeProfileImage();
      toast.success(t('profile.imageRemoved'));
      // Refresh user data
      if (refreshUser) {
        await refreshUser();
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setUploadingImage(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#a0592b] to-[#f26522]">
              <User className="h-5 w-5 text-white" />
            </div>
            {t('profile.title')}
          </h1>
          <p className="mt-1 text-sm text-theme-muted">{t('profile.subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="glass-card text-center">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />

            {/* Avatar */}
            <div className="relative mx-auto mb-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#a0592b] to-[#f26522] blur-xl opacity-30" />
                {user?.profileImage ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${user.profileImage}`}
                    alt={user?.name || 'Profile'}
                    className="relative h-28 w-28 rounded-full mx-auto object-cover border-4 border-[#a0592b]/30"
                  />
                ) : (
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#a0592b] to-[#f26522] mx-auto">
                    <User className="h-14 w-14 text-white" />
                  </div>
                )}

                {/* Upload progress overlay */}
                {uploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 mx-auto h-28 w-28">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-white mx-auto" />
                      {uploadProgress > 0 && (
                        <span className="text-xs text-white mt-1 block">{uploadProgress}%</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Camera button - Upload new image */}
              <button
                onClick={handleImageClick}
                disabled={uploadingImage}
                className="absolute bottom-0 right-1/2 translate-x-8 flex h-8 w-8 items-center justify-center rounded-full bg-theme-bg-card border border-theme-border shadow-lg hover:bg-theme-bg-hover transition-colors disabled:opacity-50"
                title={t('profile.uploadImage')}
              >
                <Camera className="h-4 w-4 text-theme-muted" />
              </button>

              {/* Remove image button (only show if there's an image) */}
              {user?.profileImage && !uploadingImage && (
                <button
                  onClick={handleRemoveImage}
                  className="absolute bottom-0 right-1/2 -translate-x-8 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 border border-red-500/30 shadow-lg hover:bg-red-500/30 transition-colors"
                  title={t('profile.removeImage')}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              )}
            </div>

            {/* Name & Role */}
            <h2 className="text-xl font-bold text-theme-primary">{user?.name || '-'}</h2>
            <p className="text-sm text-theme-muted mt-1">{user?.email}</p>

            {/* Badge */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#a0592b]/10 to-[#f26522]/10 border border-[#a0592b]/20 px-4 py-2">
              {userType === 'employee' ? (
                <>
                  <Briefcase className="h-4 w-4 text-[#a0592b]" />
                  <span className="text-sm font-medium text-[#a0592b]">
                    {user?.role?.name || t('profile.employee')}
                  </span>
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 text-[#a0592b]" />
                  <span className="text-sm font-medium text-[#a0592b]">{t('profile.customer')}</span>
                </>
              )}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="glass-card-dark p-3 rounded-xl">
                <p className="text-2xl font-bold text-[#d4a84b]">
                  {user?.isActive ? (
                    <CheckCircle2 className="h-6 w-6 mx-auto text-green-500" />
                  ) : (
                    <X className="h-6 w-6 mx-auto text-red-500" />
                  )}
                </p>
                <p className="text-xs text-theme-muted mt-1">{t('profile.accountStatus')}</p>
              </div>
              <div className="glass-card-dark p-3 rounded-xl">
                <Calendar className="h-6 w-6 mx-auto text-[#f26522]" />
                <p className="text-xs text-theme-muted mt-1">{t('profile.memberSince')}</p>
              </div>
            </div>

            <p className="text-xs text-theme-muted mt-4">
              {t('profile.joinedOn')}: {formatDate(user?.createdAt)}
            </p>
          </div>
        </div>

        {/* Details Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="glass-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                <User className="h-5 w-5 text-[#d4a84b]" />
                {t('profile.personalInfo')}
              </h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="glass-button flex items-center gap-2 px-4 py-2"
                >
                  <Edit2 className="h-4 w-4" />
                  {t('common.edit')}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="glass-button flex items-center gap-2 px-4 py-2"
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="btn-premium flex items-center gap-2 px-4 py-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {t('common.save')}
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Name */}
              <div>
                <label className="text-sm text-theme-muted flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  {t('profile.name')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="glass-input w-full"
                  />
                ) : (
                  <p className="text-theme-primary font-medium">{formData.name || '-'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-sm text-theme-muted flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4" />
                  {t('profile.email')}
                </label>
                <p className="text-theme-primary font-medium">{formData.email || '-'}</p>
                <p className="text-xs text-theme-muted mt-1">{t('profile.emailCannotChange')}</p>
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm text-theme-muted flex items-center gap-2 mb-2">
                  <Phone className="h-4 w-4" />
                  {t('profile.phone')}
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="glass-input w-full"
                    dir="ltr"
                  />
                ) : (
                  <p className="text-theme-primary font-medium" dir="ltr">
                    {formData.phone || '-'}
                  </p>
                )}
              </div>

              {/* Company (for customers) */}
              {userType === 'customer' && (
                <div>
                  <label className="text-sm text-theme-muted flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4" />
                    {t('profile.company')}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="glass-input w-full"
                    />
                  ) : (
                    <p className="text-theme-primary font-medium">{formData.company || '-'}</p>
                  )}
                </div>
              )}

              {/* Position (for employees) */}
              {userType === 'employee' && (
                <div>
                  <label className="text-sm text-theme-muted flex items-center gap-2 mb-2">
                    <Briefcase className="h-4 w-4" />
                    {t('profile.position')}
                  </label>
                  <p className="text-theme-primary font-medium">
                    {user?.role?.name || formData.position || '-'}
                  </p>
                </div>
              )}

              {/* Address */}
              <div className="sm:col-span-2">
                <label className="text-sm text-theme-muted flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4" />
                  {t('profile.address')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="glass-input w-full"
                  />
                ) : (
                  <p className="text-theme-primary font-medium">{formData.address || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="glass-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#f26522]" />
                {t('profile.security')}
              </h3>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="glass-button flex items-center gap-2 px-4 py-2"
                >
                  <Lock className="h-4 w-4" />
                  {t('profile.changePassword')}
                </button>
              )}
            </div>

            {isChangingPassword ? (
              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="text-sm text-theme-muted mb-2 block">
                    {t('profile.currentPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="glass-input w-full ltr:pr-10 rtl:pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-theme-muted hover:text-theme-primary"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-sm text-theme-muted mb-2 block">
                    {t('profile.newPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="glass-input w-full ltr:pr-10 rtl:pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-theme-muted hover:text-theme-primary"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-sm text-theme-muted mb-2 block">
                    {t('profile.confirmPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="glass-input w-full ltr:pr-10 rtl:pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-theme-muted hover:text-theme-primary"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                    className="glass-button flex-1 py-2"
                    disabled={loading}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleChangePassword}
                    className="btn-premium flex-1 py-2 flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {t('profile.updatePassword')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card-dark p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-theme-primary">{t('profile.passwordSecure')}</p>
                    <p className="text-sm text-theme-muted">{t('profile.lastPasswordChange')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
