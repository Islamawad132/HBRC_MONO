import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  CustomerLoginDto,
  EmployeeLoginDto,
  CustomerRegisterDto,
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

  // NOTE: Legacy User authentication endpoints have been removed.
  // Use the following endpoints instead:
  // - POST /auth/customer/register - Customer self-registration
  // - POST /auth/customer/login - Customer login
  // - POST /auth/employee/login - Employee login (employees are created by admins via POST /employees)

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
- Returns JWT token for immediate login
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
- Returns JWT token for customer access
- Customers have fixed permissions (no role-based access)
- Inactive or unverified customers may have restrictions
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
      corporate: {
        summary: 'Corporate customer',
        value: {
          email: 'info@company.com',
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
- Returns JWT token for employee access
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
      engineer: {
        summary: 'Project Engineer',
        value: {
          email: 'khalid.hassan@hbrc.com',
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
}
