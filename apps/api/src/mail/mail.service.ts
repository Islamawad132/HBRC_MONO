import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });

    // Verify connection configuration
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('Email service configuration error:', error);
      } else {
        this.logger.log('Email service is ready to send messages');
      }
    });
  }

  /**
   * Send welcome email to new customer
   */
  async sendCustomerWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        to: email,
        subject: 'مرحباً بك في مركز بحوث الإسكان والبناء - Welcome to HBRC',
        html: this.getCustomerWelcomeTemplate(name),
      });
      this.logger.log(`Welcome email sent to customer: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Send welcome email to new employee
   */
  async sendEmployeeWelcomeEmail(
    email: string,
    name: string,
    employeeId: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        to: email,
        subject: 'حساب الموظف الجديد - HBRC Employee Account Created',
        html: this.getEmployeeWelcomeTemplate(name, employeeId),
      });
      this.logger.log(`Employee welcome email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send employee email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        to: email,
        subject: 'إعادة تعيين كلمة المرور - Password Reset Request',
        html: this.getPasswordResetTemplate(name, resetToken),
      });
      this.logger.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send reset email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(
    email: string,
    name: string,
    verificationToken: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        to: email,
        subject: 'تأكيد البريد الإلكتروني - Email Verification',
        html: this.getVerificationTemplate(name, verificationToken),
      });
      this.logger.log(`Verification email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Send generic notification email
   */
  async sendNotificationEmail(
    email: string,
    subject: string,
    message: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        to: email,
        subject,
        html: this.getNotificationTemplate(subject, message),
      });
      this.logger.log(`Notification email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to ${email}:`, error);
      throw error;
    }
  }

  // ==================== Email Templates ====================

  private getCustomerWelcomeTemplate(name: string): string {
    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مرحباً بك</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 20px; direction: rtl;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">مرحباً بك في HBRC</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">مركز بحوث الإسكان والبناء</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">عزيزي ${name}،</h2>

      <p style="color: #666666; line-height: 1.8; font-size: 16px; margin: 0 0 20px 0;">
        نشكرك على تسجيلك في منصة HBRC. تم إنشاء حسابك بنجاح ويمكنك الآن الاستفادة من جميع خدماتنا.
      </p>

      <div style="background-color: #f8f9fa; border-right: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <h3 style="color: #667eea; margin: 0 0 15px 0; font-size: 18px;">✨ ما يمكنك فعله الآن:</h3>
        <ul style="color: #666666; line-height: 1.8; margin: 0; padding-right: 20px;">
          <li>تصفح خدماتنا المتنوعة</li>
          <li>تقديم طلبات جديدة</li>
          <li>متابعة حالة طلباتك</li>
          <li>تحديث معلومات حسابك</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 25px; font-size: 16px; font-weight: bold;">
          ابدأ الآن
        </a>
      </div>

      <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
        إذا كان لديك أي أسئلة أو استفسارات، لا تتردد في التواصل معنا.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
      <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
        مركز بحوث الإسكان والبناء
      </p>
      <p style="color: #999999; font-size: 12px; margin: 0;">
        © 2024 HBRC. جميع الحقوق محفوظة.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getEmployeeWelcomeTemplate(name: string, employeeId: string): string {
    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>حساب موظف جديد</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 20px; direction: rtl;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">مرحباً بك في فريق HBRC</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">حساب موظف جديد</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">عزيزي ${name}،</h2>

      <p style="color: #666666; line-height: 1.8; font-size: 16px; margin: 0 0 20px 0;">
        تم إنشاء حسابك كموظف في منظومة HBRC بنجاح.
      </p>

      <div style="background-color: #e8f5e9; border: 2px solid #11998e; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
        <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;">رقم الموظف الخاص بك:</p>
        <p style="color: #11998e; font-size: 24px; font-weight: bold; margin: 0; font-family: monospace;">
          ${employeeId}
        </p>
      </div>

      <div style="background-color: #f8f9fa; border-right: 4px solid #11998e; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <h3 style="color: #11998e; margin: 0 0 15px 0; font-size: 18px;">📋 معلومات مهمة:</h3>
        <ul style="color: #666666; line-height: 1.8; margin: 0; padding-right: 20px;">
          <li>استخدم بريدك الإلكتروني وكلمة المرور للدخول</li>
          <li>احتفظ برقم الموظف للرجوع إليه</li>
          <li>قم بتحديث معلومات حسابك بعد الدخول الأول</li>
          <li>راجع صلاحياتك ومسؤولياتك في النظام</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}" style="display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 25px; font-size: 16px; font-weight: bold;">
          تسجيل الدخول
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
      <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
        مركز بحوث الإسكان والبناء - قسم تكنولوجيا المعلومات
      </p>
      <p style="color: #999999; font-size: 12px; margin: 0;">
        © 2024 HBRC. جميع الحقوق محفوظة.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getPasswordResetTemplate(name: string, resetToken: string): string {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إعادة تعيين كلمة المرور</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 20px; direction: rtl;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">إعادة تعيين كلمة المرور</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">عزيزي ${name}،</h2>

      <p style="color: #666666; line-height: 1.8; font-size: 16px; margin: 0 0 20px 0;">
        تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. إذا لم تقم بهذا الطلب، يرجى تجاهل هذه الرسالة.
      </p>

      <div style="background-color: #fff3cd; border: 2px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p style="color: #856404; margin: 0; font-size: 14px; text-align: center;">
          ⏰ هذا الرابط صالح لمدة 1 ساعة فقط
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 25px; font-size: 16px; font-weight: bold;">
          إعادة تعيين كلمة المرور
        </a>
      </div>

      <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
        أو انسخ الرابط التالي في متصفحك:
      </p>
      <p style="color: #667eea; font-size: 12px; word-break: break-all; text-align: center; margin: 10px 0;">
        ${resetUrl}
      </p>

      <div style="background-color: #f8f9fa; border-right: 4px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <h3 style="color: #dc3545; margin: 0 0 15px 0; font-size: 18px;">⚠️ تحذير أمني:</h3>
        <p style="color: #666666; line-height: 1.6; margin: 0; font-size: 14px;">
          إذا لم تطلب إعادة تعيين كلمة المرور، فقد يحاول شخص ما الوصول إلى حسابك. يرجى تجاهل هذه الرسالة والتأكد من أمان حسابك.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
      <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
        مركز بحوث الإسكان والبناء
      </p>
      <p style="color: #999999; font-size: 12px; margin: 0;">
        © 2024 HBRC. جميع الحقوق محفوظة.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getVerificationTemplate(
    name: string,
    verificationToken: string,
  ): string {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد البريد الإلكتروني</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 20px; direction: rtl;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">تأكيد البريد الإلكتروني</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Email Verification</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">عزيزي ${name}،</h2>

      <p style="color: #666666; line-height: 1.8; font-size: 16px; margin: 0 0 20px 0;">
        شكراً لتسجيلك في HBRC! نحتاج فقط إلى تأكيد بريدك الإلكتروني لإكمال عملية التسجيل.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 25px; font-size: 16px; font-weight: bold;">
          تأكيد البريد الإلكتروني
        </a>
      </div>

      <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
        أو انسخ الرابط التالي في متصفحك:
      </p>
      <p style="color: #667eea; font-size: 12px; word-break: break-all; text-align: center; margin: 10px 0;">
        ${verifyUrl}
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
      <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
        مركز بحوث الإسكان والبناء
      </p>
      <p style="color: #999999; font-size: 12px; margin: 0;">
        © 2024 HBRC. جميع الحقوق محفوظة.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getNotificationTemplate(subject: string, message: string): string {
    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 20px; direction: rtl;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${subject}</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="color: #666666; line-height: 1.8; font-size: 16px; margin: 0;">
        ${message}
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
      <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
        مركز بحوث الإسكان والبناء
      </p>
      <p style="color: #999999; font-size: 12px; margin: 0;">
        © 2024 HBRC. جميع الحقوق محفوظة.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }
}
