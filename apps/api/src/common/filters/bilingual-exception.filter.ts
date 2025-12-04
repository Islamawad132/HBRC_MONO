import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Bilingual Exception Filter
 * Adds Arabic translations to all HTTP exceptions
 */
@Catch(HttpException)
export class BilingualExceptionFilter implements ExceptionFilter {
  // Map of common English error messages to Arabic translations
  private readonly translations: Record<string, string> = {
    // Auth messages
    'Invalid credentials': 'بيانات الدخول غير صحيحة',
    'User account is inactive': 'حساب المستخدم غير نشط',
    'Customer account is inactive': 'حساب العميل غير نشط',
    'Employee account is inactive': 'حساب الموظف غير نشط',
    'Email already registered': 'البريد الإلكتروني مسجل بالفعل',
    'User with this email already exists': 'مستخدم بهذا البريد الإلكتروني موجود بالفعل',

    // Not found messages
    'User not found': 'المستخدم غير موجود',
    'Customer not found': 'العميل غير موجود',
    'Employee not found': 'الموظف غير موجود',
    'Role not found': 'الدور الوظيفي غير موجود',
    'Permission not found': 'الصلاحية غير موجودة',
    'Resource not found': 'المورد غير موجود',

    // Validation messages
    'Company name is required for CORPORATE customer type': 'اسم الشركة مطلوب لنوع العميل: شركة',
    'License number is required for CONSULTANT customer type': 'رقم الترخيص مطلوب لنوع العميل: استشاري',
    'Invalid customer type': 'نوع العميل غير صحيح',

    // General messages
    'Unauthorized': 'غير مصرح',
    'Forbidden': 'محظور',
    'Insufficient permissions': 'صلاحيات غير كافية',
    'Bad Request': 'طلب خاطئ',
    'Not Found': 'غير موجود',
    'Conflict': 'تعارض',
    'Internal Server Error': 'خطأ في الخادم',
  };

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let responseBody: any;

    if (typeof exceptionResponse === 'object') {
      const { message, ...rest } = exceptionResponse as any;

      // Handle both single message and array of messages
      if (Array.isArray(message)) {
        responseBody = {
          ...rest,
          statusCode: status,
          message,
          messageAr: this.translateArray(message),
        };
      } else {
        responseBody = {
          ...rest,
          statusCode: status,
          message,
          messageAr: this.translate(message),
        };
      }
    } else {
      // String response
      responseBody = {
        statusCode: status,
        message: exceptionResponse,
        messageAr: this.translate(exceptionResponse as string),
      };
    }

    response.status(status).json(responseBody);
  }

  /**
   * Translate English message to Arabic
   */
  private translate(message: string): string {
    return this.translations[message] || 'حدث خطأ';
  }

  /**
   * Translate array of messages
   */
  private translateArray(messages: string[]): string[] {
    return messages.map(msg => this.translate(msg));
  }
}
