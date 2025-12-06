import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs/promises';
import { AuthService } from './auth.service';
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
import { Public, CurrentUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';
import {
  UnauthorizedResponseDto,
  ConflictResponseDto,
  ErrorResponseDto,
} from '../common/dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ============================================
  // CUSTOMER AUTHENTICATION
  // ============================================
  @Public()
  @Post('customer/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Customer registration (self-signup)',
    description: `
Register a new customer account. Customers can sign up themselves.

**Customer Types:**
- INDIVIDUAL (فرد): Regular individual customer
- CORPORATE (شركة): Company - requires companyName
- CONSULTANT (استشاري): Engineering consultant - requires licenseNumber
- SPONSOR (راعي فعالية): Event sponsor

**Notes:**
- Email must be unique
- Password will be hashed before storage
- Returns JWT access token and refresh token
- A verification email will be sent
- Account is created as unverified by default
    `,
  })
  @ApiBody({
    type: CustomerRegisterDto,
    description: 'Customer registration data',
    examples: {
      individual: {
        summary: 'Individual customer',
        description: 'Register as an individual customer',
        value: {
          email: 'ahmed@example.com',
          password: 'Password123!',
          name: 'أحمد محمد علي',
          phone: '01012345678',
          address: 'القاهرة، مصر الجديدة',
          customerType: 'INDIVIDUAL',
        },
      },
      corporate: {
        summary: 'Corporate customer',
        description: 'Register a company account',
        value: {
          email: 'info@company.com',
          password: 'Password123!',
          name: 'محمد أحمد',
          phone: '01012345678',
          address: 'القاهرة، التجمع الخامس',
          customerType: 'CORPORATE',
          companyName: 'شركة البناء المتطور',
          taxNumber: '123456789',
          contactPerson: 'محمد أحمد',
        },
      },
      consultant: {
        summary: 'Consultant customer',
        description: 'Register as an engineering consultant',
        value: {
          email: 'consultant@example.com',
          password: 'Password123!',
          name: 'م. خالد محمود',
          phone: '01012345678',
          address: 'الجيزة، المهندسين',
          customerType: 'CONSULTANT',
          licenseNumber: 'ENG-12345',
          consultingFirm: 'مكتب الاستشارات الهندسية',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Customer registered successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or missing required fields for customer type',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already registered',
    type: ConflictResponseDto,
  })
  customerRegister(@Body() registerDto: CustomerRegisterDto) {
    return this.authService.customerRegister(registerDto);
  }

  @Public()
  @Post('customer/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Customer login',
    description: `
Authenticate a customer (external user) with email and password.

**Notes:**
- Returns JWT access token and refresh token
- Access token expires in 1 day
- Refresh token expires in 7 days
- Inactive customers cannot login
    `,
  })
  @ApiBody({
    type: CustomerLoginDto,
    description: 'Customer login credentials',
    examples: {
      individual: {
        summary: 'Individual customer',
        value: {
          email: 'customer@example.com',
          password: 'Password123!',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer login successful',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or customer account is inactive',
    type: UnauthorizedResponseDto,
  })
  customerLogin(@Body() loginDto: CustomerLoginDto) {
    return this.authService.customerLogin(loginDto);
  }

  @Get('customer/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get customer profile',
    description: `
Get the authenticated customer's profile information.

**Notes:**
- Requires valid customer JWT token
- Returns customer details and status
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer profile retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing JWT token',
    type: UnauthorizedResponseDto,
  })
  getCustomerProfile(@CurrentUser('id') customerId: string) {
    return this.authService.getCustomerProfile(customerId);
  }

  // ============================================
  // EMPLOYEE AUTHENTICATION
  // ============================================
  @Public()
  @Post('employee/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Employee login',
    description: `
Authenticate an employee (internal staff) with email and password.

**Notes:**
- Returns JWT access token and refresh token
- Access token expires in 8 hours
- Refresh token expires in 7 days
- Employees have role-based access control (RBAC)
- Token includes role and permission information
- Inactive employees cannot login
    `,
  })
  @ApiBody({
    type: EmployeeLoginDto,
    description: 'Employee login credentials',
    examples: {
      admin: {
        summary: 'System Admin',
        value: {
          email: 'admin@hbrc.com',
          password: 'admin123',
        },
      },
      labManager: {
        summary: 'Lab Manager',
        value: {
          email: 'ahmed.mohamed@hbrc.com',
          password: 'Password123!',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employee login successful',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or employee account is inactive',
    type: UnauthorizedResponseDto,
  })
  employeeLogin(@Body() loginDto: EmployeeLoginDto) {
    return this.authService.employeeLogin(loginDto);
  }

  @Get('employee/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get employee profile',
    description: `
Get the authenticated employee's profile including role and permissions.

**Notes:**
- Requires valid employee JWT token
- Returns complete employee details, role, and permissions
- Admin employees will see all available permissions
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employee profile retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing JWT token',
    type: UnauthorizedResponseDto,
  })
  getEmployeeProfile(@CurrentUser('id') employeeId: string) {
    return this.authService.getEmployeeProfile(employeeId);
  }

  // ============================================
  // PASSWORD RESET
  // ============================================
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: `
Request a password reset email. If the email exists, a reset link will be sent.

**Notes:**
- Works for both customers and employees
- Reset token expires in 1 hour
- For security, always returns success even if email doesn't exist
    `,
  })
  @ApiBody({
    type: ForgotPasswordDto,
    description: 'Email and user type for password reset',
    examples: {
      customer: {
        summary: 'Customer password reset',
        value: {
          email: 'customer@example.com',
          userType: 'customer',
        },
      },
      employee: {
        summary: 'Employee password reset',
        value: {
          email: 'admin@hbrc.com',
          userType: 'employee',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent (if email exists)',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with token',
    description: `
Reset password using the token received via email.

**Notes:**
- Token must be valid and not expired (1 hour validity)
- Token can only be used once
- All active sessions will be invalidated after reset
    `,
  })
  @ApiBody({
    type: ResetPasswordDto,
    description: 'Reset token and new password',
    examples: {
      reset: {
        summary: 'Reset password',
        value: {
          token: 'abc123def456...',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid/expired token or passwords do not match',
    type: ErrorResponseDto,
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ============================================
  // EMAIL VERIFICATION
  // ============================================
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address',
    description: `
Verify email address using the token received via email.

**Notes:**
- Token must be valid and not expired (24 hour validity)
- Token can only be used once
- Customer account will be marked as verified
    `,
  })
  @ApiBody({
    type: VerifyEmailDto,
    description: 'Email verification token',
    examples: {
      verify: {
        summary: 'Verify email',
        value: {
          token: 'abc123def456...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid/expired token or email already verified',
    type: ErrorResponseDto,
  })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend verification email',
    description: `
Resend email verification link.

**Notes:**
- Only works for unverified accounts
- Previous verification tokens will be invalidated
- For security, always returns success even if email doesn't exist
    `,
  })
  @ApiBody({
    type: ResendVerificationDto,
    description: 'Email and user type for verification',
    examples: {
      resend: {
        summary: 'Resend verification',
        value: {
          email: 'customer@example.com',
          userType: 'customer',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email sent (if applicable)',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Email already verified',
    type: ErrorResponseDto,
  })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(dto);
  }

  // ============================================
  // CHANGE PASSWORD (Authenticated)
  // ============================================
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change password (authenticated)',
    description: `
Change password for the authenticated user.

**Notes:**
- Requires current password verification
- Works for both customers and employees
- New password must meet complexity requirements
    `,
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Current and new password',
    examples: {
      change: {
        summary: 'Change password',
        value: {
          currentPassword: 'CurrentPassword123!',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Current password incorrect or passwords do not match',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  changePassword(
    @CurrentUser('id') userId: string,
    @CurrentUser('type') userType: 'customer' | 'employee',
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, userType, dto);
  }

  // ============================================
  // TOKEN REFRESH
  // ============================================
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: `
Get a new access token using a refresh token.

**Notes:**
- Refresh token must be valid and not revoked
- Old refresh token will be revoked after use
- Returns new access token and refresh token
    `,
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Refresh token',
    examples: {
      refresh: {
        summary: 'Refresh token',
        value: {
          refreshToken: 'abc123def456...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'New tokens generated successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid/expired/revoked refresh token',
    type: UnauthorizedResponseDto,
  })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(dto);
  }

  // ============================================
  // LOGOUT
  // ============================================
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user',
    description: `
Logout the authenticated user by revoking all refresh tokens.

**Notes:**
- All refresh tokens for this user will be revoked
- Access token will remain valid until it expires
- Client should discard the access token
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logged out successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  logout(
    @CurrentUser('id') userId: string,
    @CurrentUser('type') userType: 'customer' | 'employee',
  ) {
    return this.authService.logout(userId, userType);
  }

  // ============================================
  // PROFILE IMAGE UPLOAD
  // ============================================
  @Post('profile/image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: async (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads', 'profiles');
          try {
            await fs.mkdir(uploadPath, { recursive: true });
            cb(null, uploadPath);
          } catch (error) {
            cb(error as Error, uploadPath);
          }
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(7);
          const ext = path.extname(file.originalname);
          const filename = `${timestamp}-${randomString}${ext}`;
          cb(null, filename);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for profile images
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only image files are allowed (JPEG, PNG, GIF, WebP)'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload profile image',
    description: `
Upload a profile image for the authenticated user.

**Notes:**
- Maximum file size: 5MB
- Supported formats: JPEG, PNG, GIF, WebP
- Previous profile image will be replaced
- Works for both customers and employees
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Profile image file (JPEG, PNG, GIF, WebP)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile image uploaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file type or file too large',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  async uploadProfileImage(
    @CurrentUser('id') userId: string,
    @CurrentUser('type') userType: 'customer' | 'employee',
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'No file uploaded',
        messageAr: 'لم يتم رفع ملف',
      });
    }

    // Save relative path for database
    const relativePath = `/uploads/profiles/${file.filename}`;

    return this.authService.updateProfileImage(userId, userType, relativePath);
  }

  @Delete('profile/image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove profile image',
    description: `
Remove the profile image for the authenticated user.

**Notes:**
- Deletes the image file from storage
- Works for both customers and employees
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile image removed successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  removeProfileImage(
    @CurrentUser('id') userId: string,
    @CurrentUser('type') userType: 'customer' | 'employee',
  ) {
    return this.authService.removeProfileImage(userId, userType);
  }
}
