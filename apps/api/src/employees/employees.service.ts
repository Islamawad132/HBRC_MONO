import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    // Check if email already exists
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { email: createEmployeeDto.email },
    });

    if (existingEmployee) {
      throw new ConflictException('Email already registered');
    }

    // Check if employeeId already exists
    const existingEmployeeId = await this.prisma.employee.findUnique({
      where: { employeeId: createEmployeeDto.employeeId },
    });

    if (existingEmployeeId) {
      throw new ConflictException('Employee ID already exists');
    }

    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id: createEmployeeDto.roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createEmployeeDto.password, 10);

    // Create employee
    const employee = await this.prisma.employee.create({
      data: {
        ...createEmployeeDto,
        password: hashedPassword,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    // Remove password from response
    const { password, ...result } = employee;
    return result;
  }

  async findAll() {
    const employees = await this.prisma.employee.findMany({
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Remove passwords from response
    return employees.map(({ password, ...employee }) => employee);
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const { password, ...result } = employee;
    return result;
  }

  async findByEmail(email: string) {
    return this.prisma.employee.findUnique({
      where: { email },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            isAdmin: true,
          },
        },
      },
    });
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Check if role exists (if roleId is being updated)
    if (updateEmployeeDto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: updateEmployeeDto.roleId },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }
    }

    // Update employee
    const updatedEmployee = await this.prisma.employee.update({
      where: { id },
      data: updateEmployeeDto,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    const { password, ...result } = updatedEmployee;
    return result;
  }

  async remove(id: string) {
    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    await this.prisma.employee.delete({
      where: { id },
    });

    return { message: 'Employee deleted successfully' };
  }
}
