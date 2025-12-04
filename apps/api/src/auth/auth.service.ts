import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  CustomerLoginDto,
  EmployeeLoginDto,
  CustomerRegisterDto,
} from './dto';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { CustomerType } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // NOTE: Legacy User authentication methods (register, login, getProfile) have been removed.
  // Use customerRegister/customerLogin or employeeLogin instead.

  // ============================================
  // CUSTOMER AUTHENTICATION
  // ============================================
  async customerRegister(registerDto: CustomerRegisterDto) {
    // Check if email already exists
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { email: registerDto.email },
    });

    if (existingCustomer) {
      throw new ConflictException('Email already registered');
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
    };
  }

  async customerLogin(loginDto: CustomerLoginDto) {
    const { email, password } = loginDto;

    const customer = await this.prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!customer.isActive) {
      throw new UnauthorizedException('Customer account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

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
      throw new NotFoundException('Customer not found');
    }

    const { password, ...result } = customer;
    return result;
  }

  private async generateCustomerTokens(customer: { id: string; email: string }) {
    const payload = {
      sub: customer.id,
      email: customer.email,
      type: 'customer', // Mark as customer
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
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
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!employee.isActive) {
      throw new UnauthorizedException('Employee account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

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
      throw new NotFoundException('Employee not found');
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
      type: 'employee', // Mark as employee
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
    };
  }

  private validateCustomerTypeFields(data: any) {
    const { customerType } = data;

    switch (customerType) {
      case CustomerType.CORPORATE:
        if (!data.companyName) {
          throw new BadRequestException(
            'Company name is required for CORPORATE customer type',
          );
        }
        break;

      case CustomerType.CONSULTANT:
        if (!data.licenseNumber) {
          throw new BadRequestException(
            'License number is required for CONSULTANT customer type',
          );
        }
        break;

      // INDIVIDUAL and SPONSOR don't require additional fields
      case CustomerType.INDIVIDUAL:
      case CustomerType.SPONSOR:
        break;

      default:
        throw new BadRequestException('Invalid customer type');
    }
  }
}
