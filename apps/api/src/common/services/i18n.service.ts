import { Injectable } from '@nestjs/common';

export interface BilingualMessage {
  message: string;
  messageAr: string;
}

@Injectable()
export class I18nService {
  // Authentication messages
  private readonly messages = {
    // Auth errors
    INVALID_CREDENTIALS: {
      message: 'Invalid credentials',
      messageAr: 'بيانات الدخول غير صحيحة',
    },
    ACCOUNT_INACTIVE: {
      message: 'Account is inactive',
      messageAr: 'الحساب غير نشط',
    },
    USER_INACTIVE: {
      message: 'User account is inactive',
      messageAr: 'حساب المستخدم غير نشط',
    },
    CUSTOMER_INACTIVE: {
      message: 'Customer account is inactive',
      messageAr: 'حساب العميل غير نشط',
    },
    EMPLOYEE_INACTIVE: {
      message: 'Employee account is inactive',
      messageAr: 'حساب الموظف غير نشط',
    },
    EMAIL_ALREADY_EXISTS: {
      message: 'Email already registered',
      messageAr: 'البريد الإلكتروني مسجل بالفعل',
    },
    USER_EMAIL_EXISTS: {
      message: 'User with this email already exists',
      messageAr: 'مستخدم بهذا البريد الإلكتروني موجود بالفعل',
    },

    // Not found errors
    USER_NOT_FOUND: {
      message: 'User not found',
      messageAr: 'المستخدم غير موجود',
    },
    CUSTOMER_NOT_FOUND: {
      message: 'Customer not found',
      messageAr: 'العميل غير موجود',
    },
    EMPLOYEE_NOT_FOUND: {
      message: 'Employee not found',
      messageAr: 'الموظف غير موجود',
    },
    ROLE_NOT_FOUND: {
      message: 'Role not found',
      messageAr: 'الدور الوظيفي غير موجود',
    },
    PERMISSION_NOT_FOUND: {
      message: 'Permission not found',
      messageAr: 'الصلاحية غير موجودة',
    },

    // Validation errors
    COMPANY_NAME_REQUIRED: {
      message: 'Company name is required for CORPORATE customer type',
      messageAr: 'اسم الشركة مطلوب لنوع العميل: شركة',
    },
    LICENSE_NUMBER_REQUIRED: {
      message: 'License number is required for CONSULTANT customer type',
      messageAr: 'رقم الترخيص مطلوب لنوع العميل: استشاري',
    },
    INVALID_CUSTOMER_TYPE: {
      message: 'Invalid customer type',
      messageAr: 'نوع العميل غير صحيح',
    },

    // Success messages
    CUSTOMER_REGISTERED: {
      message: 'Customer registered successfully',
      messageAr: 'تم تسجيل العميل بنجاح',
    },
    EMPLOYEE_CREATED: {
      message: 'Employee created successfully',
      messageAr: 'تم إنشاء الموظف بنجاح',
    },
    LOGIN_SUCCESSFUL: {
      message: 'Login successful',
      messageAr: 'تم تسجيل الدخول بنجاح',
    },
    DELETED_SUCCESSFULLY: {
      message: 'Deleted successfully',
      messageAr: 'تم الحذف بنجاح',
    },
    UPDATED_SUCCESSFULLY: {
      message: 'Updated successfully',
      messageAr: 'تم التحديث بنجاح',
    },
    CREATED_SUCCESSFULLY: {
      message: 'Created successfully',
      messageAr: 'تم الإنشاء بنجاح',
    },

    // General errors
    UNAUTHORIZED: {
      message: 'Unauthorized',
      messageAr: 'غير مصرح',
    },
    FORBIDDEN: {
      message: 'Insufficient permissions',
      messageAr: 'صلاحيات غير كافية',
    },
    NOT_FOUND: {
      message: 'Resource not found',
      messageAr: 'المورد غير موجود',
    },
    CONFLICT: {
      message: 'Resource already exists',
      messageAr: 'المورد موجود بالفعل',
    },
    BAD_REQUEST: {
      message: 'Bad request',
      messageAr: 'طلب خاطئ',
    },
  };

  /**
   * Get bilingual message by key
   */
  t(key: keyof typeof this.messages): BilingualMessage {
    return this.messages[key] || {
      message: 'An error occurred',
      messageAr: 'حدث خطأ',
    };
  }

  /**
   * Create a custom bilingual message
   */
  custom(message: string, messageAr: string): BilingualMessage {
    return { message, messageAr };
  }
}
