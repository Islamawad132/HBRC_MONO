// ============================================
// ENUMS - مطابقة للـ Prisma Schema
// Using const objects for TypeScript erasableSyntaxOnly compatibility
// ============================================

// نوع المستخدم
export const UserType = {
  CUSTOMER: 'CUSTOMER',
  EMPLOYEE: 'EMPLOYEE',
  ADMIN: 'ADMIN',
} as const;
export type UserType = (typeof UserType)[keyof typeof UserType];

// نوع العميل
export const CustomerType = {
  INDIVIDUAL: 'INDIVIDUAL',
  CORPORATE: 'CORPORATE',
  CONSULTANT: 'CONSULTANT',
  SPONSOR: 'SPONSOR',
} as const;
export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

// حالة الحساب
export const AccountStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING: 'PENDING',
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

// تصنيف الخدمة
export const ServiceCategory = {
  LAB_TESTS: 'LAB_TESTS',
  CONSULTANCY: 'CONSULTANCY',
  STATIONS_APPROVAL: 'STATIONS_APPROVAL',
  FIRE_SAFETY: 'FIRE_SAFETY',
  GREEN_BUILDING: 'GREEN_BUILDING',
  TRAINING: 'TRAINING',
  SOIL_TESTING: 'SOIL_TESTING',
  CONCRETE_TESTING: 'CONCRETE_TESTING',
  STRUCTURAL_REVIEW: 'STRUCTURAL_REVIEW',
  SEISMIC_ANALYSIS: 'SEISMIC_ANALYSIS',
  THERMAL_INSULATION: 'THERMAL_INSULATION',
  ACOUSTIC_TESTING: 'ACOUSTIC_TESTING',
  OTHER: 'OTHER',
} as const;
export type ServiceCategory = (typeof ServiceCategory)[keyof typeof ServiceCategory];

// حالة الخدمة
export const ServiceStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ServiceStatus = (typeof ServiceStatus)[keyof typeof ServiceStatus];

// نوع التسعير
export const PricingType = {
  FIXED: 'FIXED',
  VARIABLE: 'VARIABLE',
  CUSTOM: 'CUSTOM',
} as const;
export type PricingType = (typeof PricingType)[keyof typeof PricingType];

// حالة الطلب
export const RequestStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD',
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

// أولوية الطلب
export const RequestPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type RequestPriority = (typeof RequestPriority)[keyof typeof RequestPriority];

// حالة الدفع
export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

// طريقة الدفع
export const PaymentMethod = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CREDIT_CARD: 'CREDIT_CARD',
  FAWRY: 'FAWRY',
  VODAFONE_CASH: 'VODAFONE_CASH',
  OTHER: 'OTHER',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

// حالة الفاتورة
export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

// نوع المستند
export const DocumentType = {
  CONTRACT: 'CONTRACT',
  CERTIFICATE: 'CERTIFICATE',
  REPORT: 'REPORT',
  INVOICE_PDF: 'INVOICE_PDF',
  RECEIPT: 'RECEIPT',
  TEST_RESULT: 'TEST_RESULT',
  TECHNICAL_DRAWING: 'TECHNICAL_DRAWING',
  PHOTO: 'PHOTO',
  VIDEO: 'VIDEO',
  OTHER: 'OTHER',
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

// قناة الإشعار
export const NotificationChannel = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  WHATSAPP: 'WHATSAPP',
  IN_APP: 'IN_APP',
  PUSH: 'PUSH',
} as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

// حالة الإشعار
export const NotificationStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  READ: 'READ',
} as const;
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];

// نوع الإشعار
export const NotificationType = {
  REQUEST_CREATED: 'REQUEST_CREATED',
  REQUEST_STATUS_CHANGED: 'REQUEST_STATUS_CHANGED',
  REQUEST_ASSIGNED: 'REQUEST_ASSIGNED',
  INVOICE_CREATED: 'INVOICE_CREATED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
  ACCOUNT_VERIFIED: 'ACCOUNT_VERIFIED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  WELCOME: 'WELCOME',
  REMINDER: 'REMINDER',
  SYSTEM: 'SYSTEM',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

// إجراء سجل المراجعة
export const AuditAction = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PASSWORD_RESET: 'PASSWORD_RESET',
  EMAIL_VERIFY: 'EMAIL_VERIFY',
  STATUS_CHANGE: 'STATUS_CHANGE',
  ASSIGN: 'ASSIGN',
  UPLOAD: 'UPLOAD',
  DOWNLOAD: 'DOWNLOAD',
  EXPORT: 'EXPORT',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

// نوع المواصفة القياسية
export const StandardType = {
  EGYPTIAN: 'EGYPTIAN',
  BRITISH: 'BRITISH',
  AMERICAN: 'AMERICAN',
  EUROPEAN: 'EUROPEAN',
  INTERNATIONAL: 'INTERNATIONAL',
  OTHER: 'OTHER',
} as const;
export type StandardType = (typeof StandardType)[keyof typeof StandardType];

// نوع الإعداد
export const SettingType = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
  JSON: 'JSON',
  DATE: 'DATE',
} as const;
export type SettingType = (typeof SettingType)[keyof typeof SettingType];

// ============================================
// Labels للـ UI (بالعربي والإنجليزي)
// ============================================

type LabelMap<T extends string> = Record<T, { en: string; ar: string }>;

export const CustomerTypeLabels: LabelMap<CustomerType> = {
  INDIVIDUAL: { en: 'Individual', ar: 'فرد' },
  CORPORATE: { en: 'Corporate', ar: 'شركة' },
  CONSULTANT: { en: 'Consultant', ar: 'استشاري' },
  SPONSOR: { en: 'Sponsor', ar: 'راعي فعالية' },
};

export const AccountStatusLabels: LabelMap<AccountStatus> = {
  ACTIVE: { en: 'Active', ar: 'نشط' },
  INACTIVE: { en: 'Inactive', ar: 'غير نشط' },
  SUSPENDED: { en: 'Suspended', ar: 'موقوف' },
  PENDING: { en: 'Pending', ar: 'قيد المراجعة' },
};

export const ServiceCategoryLabels: LabelMap<ServiceCategory> = {
  LAB_TESTS: { en: 'Lab Tests', ar: 'اختبارات المعامل' },
  CONSULTANCY: { en: 'Consultancy', ar: 'استشارات هندسية' },
  STATIONS_APPROVAL: { en: 'Stations Approval', ar: 'اعتماد محطات' },
  FIRE_SAFETY: { en: 'Fire Safety', ar: 'السلامة من الحريق' },
  GREEN_BUILDING: { en: 'Green Building', ar: 'المباني الخضراء' },
  TRAINING: { en: 'Training', ar: 'التدريب' },
  SOIL_TESTING: { en: 'Soil Testing', ar: 'فحص التربة' },
  CONCRETE_TESTING: { en: 'Concrete Testing', ar: 'فحص الخرسانة' },
  STRUCTURAL_REVIEW: { en: 'Structural Review', ar: 'مراجعة إنشائية' },
  SEISMIC_ANALYSIS: { en: 'Seismic Analysis', ar: 'التحليل الزلزالي' },
  THERMAL_INSULATION: { en: 'Thermal Insulation', ar: 'العزل الحراري' },
  ACOUSTIC_TESTING: { en: 'Acoustic Testing', ar: 'الاختبارات الصوتية' },
  OTHER: { en: 'Other', ar: 'أخرى' },
};

export const RequestStatusLabels: LabelMap<RequestStatus> = {
  DRAFT: { en: 'Draft', ar: 'مسودة' },
  SUBMITTED: { en: 'Submitted', ar: 'تم الإرسال' },
  UNDER_REVIEW: { en: 'Under Review', ar: 'قيد المراجعة' },
  APPROVED: { en: 'Approved', ar: 'تمت الموافقة' },
  REJECTED: { en: 'Rejected', ar: 'مرفوض' },
  IN_PROGRESS: { en: 'In Progress', ar: 'قيد التنفيذ' },
  COMPLETED: { en: 'Completed', ar: 'مكتمل' },
  DELIVERED: { en: 'Delivered', ar: 'تم التسليم' },
  CANCELLED: { en: 'Cancelled', ar: 'ملغي' },
  ON_HOLD: { en: 'On Hold', ar: 'معلق' },
};

export const RequestPriorityLabels: LabelMap<RequestPriority> = {
  LOW: { en: 'Low', ar: 'منخفضة' },
  MEDIUM: { en: 'Medium', ar: 'متوسطة' },
  HIGH: { en: 'High', ar: 'عالية' },
  URGENT: { en: 'Urgent', ar: 'عاجل' },
};

export const PaymentStatusLabels: LabelMap<PaymentStatus> = {
  PENDING: { en: 'Pending', ar: 'في انتظار الدفع' },
  PAID: { en: 'Paid', ar: 'تم الدفع' },
  PARTIALLY_PAID: { en: 'Partially Paid', ar: 'دفع جزئي' },
  FAILED: { en: 'Failed', ar: 'فشل' },
  REFUNDED: { en: 'Refunded', ar: 'مسترد' },
  CANCELLED: { en: 'Cancelled', ar: 'ملغي' },
};

export const PaymentMethodLabels: LabelMap<PaymentMethod> = {
  CASH: { en: 'Cash', ar: 'نقدي' },
  BANK_TRANSFER: { en: 'Bank Transfer', ar: 'تحويل بنكي' },
  CREDIT_CARD: { en: 'Credit Card', ar: 'بطاقة ائتمان' },
  FAWRY: { en: 'Fawry', ar: 'فوري' },
  VODAFONE_CASH: { en: 'Vodafone Cash', ar: 'فودافون كاش' },
  OTHER: { en: 'Other', ar: 'أخرى' },
};

export const InvoiceStatusLabels: LabelMap<InvoiceStatus> = {
  DRAFT: { en: 'Draft', ar: 'مسودة' },
  ISSUED: { en: 'Issued', ar: 'صادر' },
  SENT: { en: 'Sent', ar: 'مرسل' },
  PAID: { en: 'Paid', ar: 'مدفوع' },
  OVERDUE: { en: 'Overdue', ar: 'متأخر' },
  CANCELLED: { en: 'Cancelled', ar: 'ملغي' },
};

export const DocumentTypeLabels: LabelMap<DocumentType> = {
  CONTRACT: { en: 'Contract', ar: 'عقد' },
  CERTIFICATE: { en: 'Certificate', ar: 'شهادة' },
  REPORT: { en: 'Report', ar: 'تقرير' },
  INVOICE_PDF: { en: 'Invoice PDF', ar: 'فاتورة PDF' },
  RECEIPT: { en: 'Receipt', ar: 'إيصال' },
  TEST_RESULT: { en: 'Test Result', ar: 'نتيجة اختبار' },
  TECHNICAL_DRAWING: { en: 'Technical Drawing', ar: 'رسم هندسي' },
  PHOTO: { en: 'Photo', ar: 'صورة' },
  VIDEO: { en: 'Video', ar: 'فيديو' },
  OTHER: { en: 'Other', ar: 'أخرى' },
};

export const StandardTypeLabels: LabelMap<StandardType> = {
  EGYPTIAN: { en: 'Egyptian (ES)', ar: 'مصري (م.ق.م)' },
  BRITISH: { en: 'British (BS)', ar: 'بريطاني (BS)' },
  AMERICAN: { en: 'American (ASTM)', ar: 'أمريكي (ASTM)' },
  EUROPEAN: { en: 'European (EN)', ar: 'أوروبي (EN)' },
  INTERNATIONAL: { en: 'International (ISO)', ar: 'دولي (ISO)' },
  OTHER: { en: 'Other', ar: 'أخرى' },
};

export const SettingTypeLabels: LabelMap<SettingType> = {
  STRING: { en: 'Text', ar: 'نص' },
  NUMBER: { en: 'Number', ar: 'رقم' },
  BOOLEAN: { en: 'Yes/No', ar: 'نعم/لا' },
  JSON: { en: 'JSON', ar: 'JSON' },
  DATE: { en: 'Date', ar: 'تاريخ' },
};

// ============================================
// Helper function to get label
// ============================================
export function getLabel<T extends string>(
  labels: LabelMap<T>,
  value: T,
  lang: 'en' | 'ar' = 'ar'
): string {
  return labels[value]?.[lang] || value;
}
