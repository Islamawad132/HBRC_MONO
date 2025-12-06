import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';
import { Service, ServiceCategory, ServiceStatus } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    // Check if service code already exists
    const existingService = await this.prisma.service.findUnique({
      where: { code: createServiceDto.code },
    });

    if (existingService) {
      throw new ConflictException({
        statusCode: 409,
        message: `Service with code "${createServiceDto.code}" already exists`,
        messageAr: `الخدمة برمز "${createServiceDto.code}" موجودة بالفعل`,
      });
    }

    return this.prisma.service.create({
      data: createServiceDto,
    });
  }

  async findAll(options?: {
    category?: ServiceCategory;
    status?: ServiceStatus;
    isActive?: boolean;
  }): Promise<Service[]> {
    const where: any = {};

    if (options?.category) {
      where.category = options.category;
    }
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    return this.prisma.service.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Service with ID "${id}" not found`,
        messageAr: `الخدمة برقم "${id}" غير موجودة`,
      });
    }

    return service;
  }

  async findByCode(code: string): Promise<Service> {
    const service = await this.prisma.service.findUnique({
      where: { code },
    });

    if (!service) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Service with code "${code}" not found`,
        messageAr: `الخدمة برمز "${code}" غير موجودة`,
      });
    }

    return service;
  }

  async findByCategory(category: ServiceCategory): Promise<Service[]> {
    return this.prisma.service.findMany({
      where: { category },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    // Check if service exists
    await this.findOne(id);

    // If updating code, check for duplicates
    if (updateServiceDto.code) {
      const existingService = await this.prisma.service.findUnique({
        where: { code: updateServiceDto.code },
      });

      if (existingService && existingService.id !== id) {
        throw new ConflictException({
          statusCode: 409,
          message: `Service with code "${updateServiceDto.code}" already exists`,
          messageAr: `الخدمة برمز "${updateServiceDto.code}" موجودة بالفعل`,
        });
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });
  }

  async remove(id: string): Promise<{ message: string; messageAr: string }> {
    // Check if service exists
    await this.findOne(id);

    await this.prisma.service.delete({
      where: { id },
    });

    return {
      message: 'Service deleted successfully',
      messageAr: 'تم حذف الخدمة بنجاح',
    };
  }

  async getServiceStats(): Promise<{
    total: number;
    byCategory: Record<ServiceCategory, number>;
    byStatus: Record<ServiceStatus, number>;
    totalActive: number;
  }> {
    const services = await this.prisma.service.findMany();

    const byCategory = services.reduce(
      (acc, service) => {
        acc[service.category] = (acc[service.category] || 0) + 1;
        return acc;
      },
      {} as Record<ServiceCategory, number>,
    );

    const byStatus = services.reduce(
      (acc, service) => {
        acc[service.status] = (acc[service.status] || 0) + 1;
        return acc;
      },
      {} as Record<ServiceStatus, number>,
    );

    const totalActive = services.filter((s) => s.isActive).length;

    return {
      total: services.length,
      byCategory,
      byStatus,
      totalActive,
    };
  }
}
