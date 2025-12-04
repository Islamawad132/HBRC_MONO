import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCustomerDto } from './dto';
import { CustomerType } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  // NOTE: Customer creation is handled through AuthService.customerRegister()
  // Customers register themselves via POST /auth/customer/register

  async findAll() {
    const customers = await this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Remove passwords from response
    return customers.map(({ password, ...customer }) => customer);
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const { password, ...result } = customer;
    return result;
  }

  async findByEmail(email: string) {
    return this.prisma.customer.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    // Check if customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Validate required fields based on customer type if type is being updated
    if (updateCustomerDto.customerType) {
      this.validateCustomerTypeFields({
        ...customer,
        ...updateCustomerDto,
      } as any);
    }

    // Update customer
    const updatedCustomer = await this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });

    const { password, ...result } = updatedCustomer;
    return result;
  }

  async remove(id: string) {
    // Check if customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.prisma.customer.delete({
      where: { id },
    });

    return { message: 'Customer deleted successfully' };
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
