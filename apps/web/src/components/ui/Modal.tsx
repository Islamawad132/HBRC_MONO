import { useEffect, useRef, type ReactNode, type ElementType } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useTranslation } from 'react-i18next';

export type ModalVariant = 'default' | 'danger' | 'success' | 'warning';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showCloseButton?: boolean;
  icon?: ElementType;
  iconClassName?: string;
  variant?: ModalVariant;
  footer?: ReactNode;
  loading?: boolean;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-4xl',
};

const variantStyles: Record<ModalVariant, { iconBg: string; iconColor: string }> = {
  default: { iconBg: 'bg-gradient-to-br from-[#a0592b]/20 to-[#f26522]/20', iconColor: 'text-[#f26522]' },
  danger: { iconBg: 'bg-red-500/20', iconColor: 'text-red-400' },
  success: { iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400' },
  warning: { iconBg: 'bg-amber-500/20', iconColor: 'text-amber-400' },
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  icon: Icon,
  iconClassName,
  variant = 'default',
  footer,
  loading = false,
  closeOnClickOutside = true,
  closeOnEscape = true,
}: ModalProps) {
  const { language } = useSettings();
  const isRTL = language === 'ar';
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && closeOnEscape && !loading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape, loading]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && !loading) {
        onClose();
      }
    };

    if (isOpen && closeOnClickOutside) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, closeOnClickOutside, loading]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm !mt-0"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        ref={modalRef}
        className={`glass-card w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconClassName || styles.iconBg}`}>
                <Icon className={`h-5 w-5 ${styles.iconColor}`} />
              </div>
            )}
            <h2 className="text-lg font-bold text-white">{title}</h2>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              disabled={loading}
              className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-160px)] overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex gap-3 border-t border-white/10 p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ModalFooterProps {
  onCancel?: () => void;
  onConfirm?: () => void;
  cancelText?: string;
  confirmText?: string;
  confirmVariant?: 'primary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}

export function ModalFooter({
  onCancel,
  onConfirm,
  cancelText,
  confirmText,
  confirmVariant = 'primary',
  loading = false,
  disabled = false,
  children,
}: ModalFooterProps) {
  const { t } = useTranslation();

  if (children) {
    return <>{children}</>;
  }

  const confirmStyles = {
    primary: 'bg-gradient-to-r from-[#a0592b] to-[#f26522] hover:opacity-90',
    danger: 'bg-red-500 hover:bg-red-600',
  };

  return (
    <>
      {onCancel && (
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          {cancelText || t('common.cancel')}
        </button>
      )}
      {onConfirm && (
        <button
          onClick={onConfirm}
          disabled={loading || disabled}
          className={`flex-1 rounded-xl px-4 py-2.5 font-medium text-white transition-colors disabled:opacity-50 ${confirmStyles[confirmVariant]}`}
        >
          {loading ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          ) : (
            confirmText || t('common.confirm')
          )}
        </button>
      )}
    </>
  );
}
