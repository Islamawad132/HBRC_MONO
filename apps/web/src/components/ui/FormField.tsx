import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useSettings } from '../../context/SettingsContext';

interface BaseFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
}

interface InputFieldProps extends BaseFieldProps, InputHTMLAttributes<HTMLInputElement> {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'datetime-local';
}

interface SelectFieldProps extends BaseFieldProps, SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
}

interface TextareaFieldProps extends BaseFieldProps, TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function InputField({ label, error, required, hint, className, ...props }: InputFieldProps) {
  const { language } = useSettings();
  const isRTL = language === 'ar';

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-sm font-medium text-white/80">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      <input
        {...props}
        className={`glass-input w-full ${error ? 'border-red-500/50 focus:border-red-500' : ''} ${className || ''}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      />
      {hint && !error && <p className="text-xs text-white/40">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function SelectField({ label, error, required, hint, children, className, ...props }: SelectFieldProps) {
  const { language } = useSettings();
  const isRTL = language === 'ar';

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-sm font-medium text-white/80">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      <select
        {...props}
        className={`glass-input w-full ${error ? 'border-red-500/50 focus:border-red-500' : ''} ${className || ''}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {children}
      </select>
      {hint && !error && <p className="text-xs text-white/40">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function TextareaField({ label, error, required, hint, className, ...props }: TextareaFieldProps) {
  const { language } = useSettings();
  const isRTL = language === 'ar';

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-sm font-medium text-white/80">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      <textarea
        {...props}
        className={`glass-input min-h-[100px] w-full resize-none ${error ? 'border-red-500/50 focus:border-red-500' : ''} ${className || ''}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      />
      {hint && !error && <p className="text-xs text-white/40">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function CheckboxField({
  label,
  error,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  error?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="flex cursor-pointer items-center gap-3">
        <div className="relative">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="peer sr-only"
          />
          <div className="h-5 w-5 rounded border border-white/20 bg-white/5 transition-colors peer-checked:border-[#f26522] peer-checked:bg-[#f26522] peer-disabled:opacity-50" />
          <svg
            className="absolute left-1 top-1 h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm text-white/80">{label}</span>
      </label>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
