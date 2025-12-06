import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  CustomerLoginDto,
  EmployeeLoginDto,
  CustomerRegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ChangePasswordDto,
  RefreshTokenDto,
} from './dto';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { CustomerType } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  // ============================================
  // CUSTOMER AUTHENTICATION
  // ============================================
  async customerRegister(registerDto: CustomerRegisterDto) {
    // Check if email already exists
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { email: registerDto.email },
    });

    if (existingCustomer) {
      throw new ConflictException({
        statusCode: 409,
        message: 'Email already registered',
        messageAr: 'البريد الإلكتروني مسجل مسبقاً',
      });
    }

    // Validate required fields based on customer type
    this.validateCustomerTypeFields(registerDto);

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create customer
    const customer = await this.prisma.customer.create({
      data: {
        ...registerDto,
        password: hashedPassword,
      },
    });

    // Create email verification token
    await this.createAndSendVerificationEmail(customer.email, customer.name, 'customer');

    // Send welcome email (async, don't wait)
    this.mailService
      .sendCustomerWelcomeEmail(customer.email, customer.name)
      .catch((error) => {
        console.error('Failed to send welcome email:', error);
      });

    // Generate tokens
    const tokens = await this.generateCustomerTokens(customer);

    return {
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        customerType: customer.customerType,
        isVerified: customer.isVerified,
      },
      ...tokens,
      message: 'Registration successful. Please check your email to verify your account.',
      messageAr: 'تم التسجيل بنجاح. يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك.',
    };
  }

  async customerLogin(loginDto: CustomerLoginDto) {
    const { email, password } = loginDto;

    const customer = await this.prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid credentials',
        messageAr: 'بيانات الاعتماد غير صحيحة',
      });
    }

    if (customer.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Customer account is inactive',
        messageAr: 'حساب العميل غير نشط',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid credentials',
        messageAr: 'بيانات الاعتماد غير صحيحة',
      });
    }

    // Update login stats
    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    });

    const tokens = await this.generateCustomerTokens(customer);

    return {
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        customerType: customer.customerType,
        isVerified: customer.isVerified,
      },
      ...tokens,
    };
  }

  async getCustomerProfile(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Customer not found',
        messageAr: 'العميل غير موجود',
      });
    }

    const { password, ...result } = customer;
    return result;
  }

  private async generateCustomerTokens(customer: { id: string; email: string }) {
    const payload = {
      sub: customer.id,
      email: customer.email,
      type: 'customer',
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1d' });
    const refreshToken = await this.createRefreshToken(customer.id, 'customer');

    return {
      accessToken,
      refreshToken,
    };
  }

  // ============================================
  // EMPLOYEE AUTHENTICATION
  // ============================================
  async employeeLogin(loginDto: EmployeeLoginDto) {
    const { email, password } = loginDto;

    const employee = await this.prisma.employee.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });

    if (!employee) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid credentials',
        messageAr: 'بيانات الاعتماد غير صحيحة',
      });
    }

    if (employee.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Employee account is inactive',
        messageAr: 'حساب الموظف غير نشط',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid credentials',
        messageAr: 'بيانات الاعتماد غير صحيحة',
      });
    }

    // Update login stats
    await this.prisma.employee.update({
      where: { id: employee.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    });

    const tokens = await this.generateEmployeeTokens(employee);

    return {
      employee: {
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeId: employee.employeeId,
        department: employee.department,
        position: employee.position,
        role: employee.role.name,
        isAdmin: employee.role.isAdmin,
      },
      ...tokens,
    };
  }

  async getEmployeeProfile(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Employee not found',
        messageAr: 'الموظف غير موجود',
      });
    }

    // If admin, get all permissions
    let permissions: string[];
    if (employee.role.isAdmin) {
      const allPermissions = await this.prisma.permission.findMany();
      permissions = allPermissions.map((p) => p.name);
    } else {
      permissions = employee.role.permissions.map((rp) => rp.permission.name);
    }

    return {
      id: employee.id,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      employeeId: employee.employeeId,
      department: employee.department,
      position: employee.position,
      institute: employee.institute,
      profileImage: employee.profileImage,
      role: employee.role.name,
      isAdmin: employee.role.isAdmin,
      permissions,
    };
  }

  private async generateEmployeeTokens(employee: {
    id: string;
    email: string;
    roleId: string;
    role: { isAdmin: boolean };
  }) {
    const payload: JwtPayload = {
      sub: employee.id,
      email: employee.email,
      roleId: employee.roleId,
      isAdmin: employee.role.isAdmin,
      type: 'employee',
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '8h' });
    const refreshToken = await this.createRefreshToken(employee.id, 'employee');

    return {
      accessToken,
      refreshToken,
    };
  }

  // ============================================
  // PASSWORD RESET
  // ============================================
  async forgotPassword(dto: ForgotPasswordDto) {
    const { email, userType } = dto;

    // Find user based on type
    let user: { id: string; email: string; name?: string; firstName?: string } | null = null;

    if (userType === 'customer') {
      user = await this.prisma.customer.findUnique({ where: { email } });
    } else {
      const employee = await this.prisma.employee.findUnique({ where: { email } });
      if (employee) {
        user = { ...employee, name: `${employee.firstName} ${employee.lastName}` };
      }
    }

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        message: 'If the email exists, a password reset link has been sent.',
        messageAr: 'إذا كان البريد الإلكتروني موجوداً، فسيتم إرسال رابط إعادة تعيين كلمة المرور.',
      };
    }

    // Delete any existing reset tokens for this email
    await this.prisma.passwordResetToken.deleteMany({
      where: { email, userType },
    });

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token
    await this.prisma.passwordResetToken.create({
      data: {
        token,
        email,
        userType,
        expiresAt,
      },
    });

    // Send reset email
    const name = user.name || user.firstName || 'User';
    await this.mailService.sendPasswordResetEmail(email, name, token);

    return {
      message: 'If the email exists, a password reset link has been sent.',
      messageAr: 'إذا كان البريد الإلكتروني موجوداً، فسيتم إرسال رابط إعادة تعيين كلمة المرور.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { token, newPassword, confirmPassword } = dto;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Passwords do not match',
        messageAr: 'كلمات المرور غير متطابقة',
      });
    }

    // Find valid token
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Invalid or expired reset token',
        messageAr: 'رمز إعادة التعيين غير صالح أو منتهي الصلاحية',
      });
    }

    if (resetToken.usedAt) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Reset token has already been used',
        messageAr: 'تم استخدام رمز إعادة التعيين بالفعل',
      });
    }

    if (new Date() > resetToken.expiresAt) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Reset token has expired',
        messageAr: 'انتهت صلاحية رمز إعادة التعيين',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password based on user type
    if (resetToken.userType === 'customer') {
      await this.prisma.customer.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword },
      });
    } else {
      await this.prisma.employee.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword },
      });
    }

    // Mark token as used
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    // Revoke all refresh tokens for security
    await this.prisma.refreshToken.updateMany({
      where: {
        userId: resetToken.email,
        userType: resetToken.userType,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return {
      message: 'Password has been reset successfully. Please login with your new password.',
      messageAr: 'تم إعادة تعيين كلمة المرور بنجاح. يرجى تسجيل الدخول بكلمة المرور الجديدة.',
    };
  }

  // ============================================
  // EMAIL VERIFICATION
  // ============================================
  async verifyEmail(dto: VerifyEmailDto) {
    const { token } = dto;

    // Find valid token
    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Invalid verification token',
        messageAr: 'رمز التحقق غير صالح',
      });
    }

    if (verificationToken.usedAt) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Email has already been verified',
        messageAr: 'تم التحقق من البريد الإلكتروني بالفعل',
      });
    }

    if (new Date() > verificationToken.expiresAt) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Verification token has expired. Please request a new one.',
        messageAr: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.',
      });
    }

    // Update user verification status
    if (verificationToken.userType === 'customer') {
      await this.prisma.customer.update({
        where: { email: verificationToken.email },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
        },
      });
    }
    // Note: Employees don't have email verification in current schema

    // Mark token as used
    await this.prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    });

    return {
      message: 'Email verified successfully',
      messageAr: 'تم التحقق من البريد الإلكتروني بنجاح',
    };
  }

  async resendVerificationEmail(dto: ResendVerificationDto) {
    const { email, userType } = dto;

    // Find user
    let user: { email: string; name?: string; firstName?: string; isVerified?: boolean } | null = null;

    if (userType === 'customer') {
      user = await this.prisma.customer.findUnique({ where: { email } });
      if (user && (user as any).isVerified) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Email is already verified',
          messageAr: 'البريد الإلكتروني مُفعّل بالفعل',
        });
      }
    } else {
      const employee = await this.prisma.employee.findUnique({ where: { email } });
      if (employee) {
        user = { ...employee, name: `${employee.firstName} ${employee.lastName}` };
      }
    }

    if (!user) {
      // Return success to prevent email enumeration
      return {
        message: 'If the email exists and is not verified, a verification link has been sent.',
        messageAr: 'إذا كان البريد الإلكتروني موجوداً وغير مُفعّل، فسيتم إرسال رابط التحقق.',
      };
    }

    const name = user.name || user.firstName || 'User';
    await this.createAndSendVerificationEmail(email, name, userType);

    return {
      message: 'Verification email has been sent',
      messageAr: 'تم إرسال بريد التحقق',
    };
  }

  private async createAndSendVerificationEmail(
    email: string,
    name: string,
    userType: 'customer' | 'employee',
  ) {
    // Delete existing verification tokens
    await this.prisma.emailVerificationToken.deleteMany({
      where: { email, userType },
    });

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save token
    await this.prisma.emailVerificationToken.create({
      data: {
        token,
        email,
        userType,
        expiresAt,
      },
    });

    // Send verification email
    await this.mailService.sendVerificationEmail(email, name, token);
  }

  // ============================================
  // CHANGE PASSWORD (Authenticated)
  // ============================================
  async changePassword(
    userId: string,
    userType: 'customer' | 'employee',
    dto: ChangePasswordDto,
  ) {
    const { currentPassword, newPassword, confirmPassword } = dto;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Passwords do not match',
        messageAr: 'كلمات المرور غير متطابقة',
      });
    }

    // Get current user
    let user: { id: string; password: string } | null = null;

    if (userType === 'customer') {
      user = await this.prisma.customer.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
      });
    } else {
      user = await this.prisma.employee.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
      });
    }

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'User not found',
        messageAr: 'المستخدم غير موجود',
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Current password is incorrect',
        messageAr: 'كلمة المرور الحالية غير صحيحة',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    if (userType === 'customer') {
      await this.prisma.customer.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    } else {
      await this.prisma.employee.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    }

    return {
      message: 'Password changed successfully',
      messageAr: 'تم تغيير كلمة المرور بنجاح',
    };
  }

  // ============================================
  // REFRESH TOKEN
  // ============================================
  private async createRefreshToken(userId: string, userType: 'customer' | 'employee'): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        userType,
        expiresAt,
      },
    });

    return token;
  }

  async refreshAccessToken(dto: RefreshTokenDto) {
    const { refreshToken } = dto;

    // Find valid refresh token
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid refresh token',
        messageAr: 'رمز التحديث غير صالح',
      });
    }

    if (storedToken.revokedAt) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Refresh token has been revoked',
        messageAr: 'تم إلغاء رمز التحديث',
      });
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Refresh token has expired',
        messageAr: 'انتهت صلاحية رمز التحديث',
      });
    }

    // Get user based on type
    if (storedToken.userType === 'customer') {
      const customer = await this.prisma.customer.findUnique({
        where: { id: storedToken.userId },
      });

      if (!customer || customer.status !== 'ACTIVE') {
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'User account is inactive',
          messageAr: 'حساب المستخدم غير نشط',
        });
      }

      // Revoke old refresh token
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      // Generate new tokens
      return this.generateCustomerTokens(customer);
    } else {
      const employee = await this.prisma.employee.findUnique({
        where: { id: storedToken.userId },
        include: { role: true },
      });

      if (!employee || employee.status !== 'ACTIVE') {
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'User account is inactive',
          messageAr: 'حساب المستخدم غير نشط',
        });
      }

      // Revoke old refresh token
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      // Generate new tokens
      return this.generateEmployeeTokens(employee);
    }
  }

  async logout(userId: string, userType: 'customer' | 'employee') {
    // Revoke all refresh tokens for this user
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        userType,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return {
      message: 'Logged out successfully',
      messageAr: 'تم تسجيل الخروج بنجاح',
    };
  }

  // ============================================
  // VALIDATION HELPERS
  // ============================================
  private validateCustomerTypeFields(data: any) {
    const { customerType } = data;

    switch (customerType) {
      case CustomerType.CORPORATE:
        if (!data.companyName) {
          throw new BadRequestException({
            statusCode: 400,
            message: 'Company name is required for CORPORATE customer type',
            messageAr: 'اسم الشركة مطلوب لنوع العميل شركة',
          });
        }
        break;

      case CustomerType.CONSULTANT:
        if (!data.licenseNumber) {
          throw new BadRequestException({
            statusCode: 400,
            message: 'License number is required for CONSULTANT customer type',
            messageAr: 'رقم الترخيص مطلوب لنوع العميل استشاري',
          });
        }
        break;

      case CustomerType.INDIVIDUAL:
      case CustomerType.SPONSOR:
        break;

      default:
        throw new BadRequestException({
          statusCode: 400,
          message: 'Invalid customer type',
          messageAr: 'نوع العميل غير صالح',
        });
    }
  }

  // ============================================
  // PROFILE IMAGE UPLOAD
  // ============================================
  async updateProfileImage(
    userId: string,
    userType: 'customer' | 'employee',
    imagePath: string,
  ) {
    if (userType === 'customer') {
      await this.prisma.customer.update({
        where: { id: userId },
        data: { profileImage: imagePath },
      });
    } else {
      await this.prisma.employee.update({
        where: { id: userId },
        data: { profileImage: imagePath },
      });
    }

    return {
      profileImage: imagePath,
      message: 'Profile image updated successfully',
      messageAr: 'تم تحديث صورة الملف الشخصي بنجاح',
    };
  }

  async removeProfileImage(userId: string, userType: 'customer' | 'employee') {
    if (userType === 'customer') {
      await this.prisma.customer.update({
        where: { id: userId },
        data: { profileImage: null },
      });
    } else {
      await this.prisma.employee.update({
        where: { id: userId },
        data: { profileImage: null },
      });
    }

    return {
      message: 'Profile image removed successfully',
      messageAr: 'تم حذف صورة الملف الشخصي بنجاح',
    };
  }
}
