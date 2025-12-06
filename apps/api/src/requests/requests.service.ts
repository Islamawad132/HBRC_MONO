import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRequestDto,
  UpdateRequestDto,
  UpdateStatusDto,
  AssignEmployeeDto,
} from './dto';
import { ServiceRequest, RequestStatus, RequestPriority } from '@prisma/client';

@Injectable()
export class RequestsService {
  constructor(private prisma: PrismaService) {}

  // Status transition rules
  private readonly statusTransitions: Record<RequestStatus, RequestStatus[]> = {
    [RequestStatus.DRAFT]: [RequestStatus.SUBMITTED, RequestStatus.CANCELLED],
    [RequestStatus.SUBMITTED]: [
      RequestStatus.UNDER_REVIEW,
      RequestStatus.REJECTED,
      RequestStatus.CANCELLED,
    ],
    [RequestStatus.UNDER_REVIEW]: [
      RequestStatus.APPROVED,
      RequestStatus.REJECTED,
      RequestStatus.ON_HOLD,
      RequestStatus.CANCELLED,
    ],
    [RequestStatus.APPROVED]: [
      RequestStatus.IN_PROGRESS,
      RequestStatus.CANCELLED,
    ],
    [RequestStatus.REJECTED]: [],
    [RequestStatus.IN_PROGRESS]: [
      RequestStatus.COMPLETED,
      RequestStatus.ON_HOLD,
      RequestStatus.CANCELLED,
    ],
    [RequestStatus.COMPLETED]: [RequestStatus.DELIVERED],
    [RequestStatus.DELIVERED]: [],
    [RequestStatus.CANCELLED]: [],
    [RequestStatus.ON_HOLD]: [
      RequestStatus.IN_PROGRESS,
      RequestStatus.UNDER_REVIEW,
      RequestStatus.CANCELLED,
    ],
  };

  private async generateRequestNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.serviceRequest.count();
    const number = (count + 1).toString().padStart(4, '0');
    return `REQ-${year}-${number}`;
  }

  private validateStatusTransition(
    currentStatus: RequestStatus,
    newStatus: RequestStatus,
  ): void {
    const allowedTransitions = this.statusTransitions[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException({
        statusCode: 400,
        message: `Cannot transition from ${currentStatus} to ${newStatus}`,
        messageAr: `لا يمكن الانتقال من ${currentStatus} إلى ${newStatus}`,
        allowedTransitions,
      });
    }
  }

  async create(
    customerId: string,
    createRequestDto: CreateRequestDto,
  ): Promise<ServiceRequest> {
    // Verify service exists
    const service = await this.prisma.service.findUnique({
      where: { id: createRequestDto.serviceId },
    });

    if (!service) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Service not found',
        messageAr: 'الخدمة غير موجودة',
      });
    }

    if (!service.isActive || service.status !== 'ACTIVE') {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Service is not available',
        messageAr: 'الخدمة غير متاحة',
      });
    }

    const requestNumber = await this.generateRequestNumber();

    return this.prisma.serviceRequest.create({
      data: {
        requestNumber,
        customerId,
        ...createRequestDto,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            code: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(filters?: {
    customerId?: string;
    serviceId?: string;
    assignedToId?: string;
    status?: RequestStatus;
    priority?: RequestPriority;
  }): Promise<ServiceRequest[]> {
    const where: any = {};

    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.serviceId) where.serviceId = filters.serviceId;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;

    return this.prisma.serviceRequest.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            code: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findOne(id: string): Promise<ServiceRequest> {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            code: true,
            category: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Request with ID "${id}" not found`,
        messageAr: `الطلب برقم "${id}" غير موجود`,
      });
    }

    // Increment view count
    await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });

    return request;
  }

  async findByRequestNumber(requestNumber: string): Promise<ServiceRequest> {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { requestNumber },
      include: {
        customer: true,
        service: true,
        assignedTo: true,
      },
    });

    if (!request) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Request "${requestNumber}" not found`,
        messageAr: `الطلب "${requestNumber}" غير موجود`,
      });
    }

    return request;
  }

  async update(
    id: string,
    updateRequestDto: UpdateRequestDto,
  ): Promise<ServiceRequest> {
    await this.findOne(id);

    return this.prisma.serviceRequest.update({
      where: { id },
      data: updateRequestDto,
      include: {
        customer: true,
        service: true,
        assignedTo: true,
      },
    });
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
  ): Promise<ServiceRequest> {
    const request = await this.findOne(id);

    // Validate status transition
    this.validateStatusTransition(request.status, updateStatusDto.status);

    const updateData: any = {
      status: updateStatusDto.status,
    };

    // Handle specific status changes
    if (updateStatusDto.status === RequestStatus.REJECTED) {
      updateData.rejectionReason = updateStatusDto.reason;
      updateData.rejectionReasonAr = updateStatusDto.reasonAr;
    }

    if (updateStatusDto.status === RequestStatus.CANCELLED) {
      updateData.cancellationReason = updateStatusDto.reason;
      updateData.cancellationReasonAr = updateStatusDto.reasonAr;
    }

    if (updateStatusDto.status === RequestStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    if (updateStatusDto.status === RequestStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    }

    return this.prisma.serviceRequest.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        service: true,
        assignedTo: true,
      },
    });
  }

  async assignEmployee(
    id: string,
    assignEmployeeDto: AssignEmployeeDto,
  ): Promise<ServiceRequest> {
    const request = await this.findOne(id);

    // Verify employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: assignEmployeeDto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Employee not found',
        messageAr: 'الموظف غير موجود',
      });
    }

    if (employee.status !== 'ACTIVE') {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Employee is not active',
        messageAr: 'الموظف غير نشط',
      });
    }

    return this.prisma.serviceRequest.update({
      where: { id },
      data: {
        assignedToId: assignEmployeeDto.employeeId,
        assignedAt: new Date(),
      },
      include: {
        customer: true,
        service: true,
        assignedTo: true,
      },
    });
  }

  async remove(id: string): Promise<{ message: string; messageAr: string }> {
    await this.findOne(id);

    await this.prisma.serviceRequest.delete({
      where: { id },
    });

    return {
      message: 'Request deleted successfully',
      messageAr: 'تم حذف الطلب بنجاح',
    };
  }

  async getRequestStats(): Promise<{
    total: number;
    byStatus: Record<RequestStatus, number>;
    byPriority: Record<RequestPriority, number>;
    assigned: number;
    unassigned: number;
  }> {
    const requests = await this.prisma.serviceRequest.findMany();

    const byStatus = requests.reduce(
      (acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      },
      {} as Record<RequestStatus, number>,
    );

    const byPriority = requests.reduce(
      (acc, req) => {
        acc[req.priority] = (acc[req.priority] || 0) + 1;
        return acc;
      },
      {} as Record<RequestPriority, number>,
    );

    const assigned = requests.filter((r) => r.assignedToId).length;
    const unassigned = requests.filter((r) => !r.assignedToId).length;

    return {
      total: requests.length,
      byStatus,
      byPriority,
      assigned,
      unassigned,
    };
  }
}
