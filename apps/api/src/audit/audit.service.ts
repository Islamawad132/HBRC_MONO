import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLog, AuditAction } from '@prisma/client';

export interface AuditLogInput {
  userId?: string;
  userType?: 'customer' | 'employee' | 'system';
  userEmail?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  description?: string;
  descriptionAr?: string;
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
  requestMethod?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  // ============================================
  // CREATE AUDIT LOG
  // ============================================
  async log(input: AuditLogInput): Promise<AuditLog> {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userId: input.userId,
          userType: input.userType,
          userEmail: input.userEmail,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          oldData: input.oldData,
          newData: input.newData,
          description: input.description,
          descriptionAr: input.descriptionAr,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          requestPath: input.requestPath,
          requestMethod: input.requestMethod,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not break the main flow
      return null as any;
    }
  }

  // ============================================
  // HELPER METHODS FOR COMMON ACTIONS
  // ============================================
  async logCreate(
    userId: string,
    userType: 'customer' | 'employee',
    userEmail: string,
    entity: string,
    entityId: string,
    newData: Record<string, any>,
    requestContext?: { ipAddress?: string; userAgent?: string; requestPath?: string },
  ): Promise<AuditLog> {
    return this.log({
      userId,
      userType,
      userEmail,
      action: AuditAction.CREATE,
      entity,
      entityId,
      newData: this.sanitizeData(newData),
      description: `Created ${entity}`,
      descriptionAr: `تم إنشاء ${entity}`,
      ...requestContext,
      requestMethod: 'POST',
    });
  }

  async logUpdate(
    userId: string,
    userType: 'customer' | 'employee',
    userEmail: string,
    entity: string,
    entityId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    requestContext?: { ipAddress?: string; userAgent?: string; requestPath?: string },
  ): Promise<AuditLog> {
    return this.log({
      userId,
      userType,
      userEmail,
      action: AuditAction.UPDATE,
      entity,
      entityId,
      oldData: this.sanitizeData(oldData),
      newData: this.sanitizeData(newData),
      description: `Updated ${entity}`,
      descriptionAr: `تم تحديث ${entity}`,
      ...requestContext,
      requestMethod: 'PATCH',
    });
  }

  async logDelete(
    userId: string,
    userType: 'customer' | 'employee',
    userEmail: string,
    entity: string,
    entityId: string,
    oldData: Record<string, any>,
    requestContext?: { ipAddress?: string; userAgent?: string; requestPath?: string },
  ): Promise<AuditLog> {
    return this.log({
      userId,
      userType,
      userEmail,
      action: AuditAction.DELETE,
      entity,
      entityId,
      oldData: this.sanitizeData(oldData),
      description: `Deleted ${entity}`,
      descriptionAr: `تم حذف ${entity}`,
      ...requestContext,
      requestMethod: 'DELETE',
    });
  }

  async logLogin(
    userId: string,
    userType: 'customer' | 'employee',
    userEmail: string,
    requestContext?: { ipAddress?: string; userAgent?: string; requestPath?: string },
  ): Promise<AuditLog> {
    return this.log({
      userId,
      userType,
      userEmail,
      action: AuditAction.LOGIN,
      entity: userType === 'customer' ? 'Customer' : 'Employee',
      entityId: userId,
      description: `User logged in`,
      descriptionAr: `تسجيل دخول المستخدم`,
      ...requestContext,
      requestMethod: 'POST',
    });
  }

  async logLogout(
    userId: string,
    userType: 'customer' | 'employee',
    userEmail: string,
    requestContext?: { ipAddress?: string; userAgent?: string; requestPath?: string },
  ): Promise<AuditLog> {
    return this.log({
      userId,
      userType,
      userEmail,
      action: AuditAction.LOGOUT,
      entity: userType === 'customer' ? 'Customer' : 'Employee',
      entityId: userId,
      description: `User logged out`,
      descriptionAr: `تسجيل خروج المستخدم`,
      ...requestContext,
      requestMethod: 'POST',
    });
  }

  async logStatusChange(
    userId: string,
    userType: 'customer' | 'employee',
    userEmail: string,
    entity: string,
    entityId: string,
    oldStatus: string,
    newStatus: string,
    requestContext?: { ipAddress?: string; userAgent?: string; requestPath?: string },
  ): Promise<AuditLog> {
    return this.log({
      userId,
      userType,
      userEmail,
      action: AuditAction.STATUS_CHANGE,
      entity,
      entityId,
      oldData: { status: oldStatus },
      newData: { status: newStatus },
      description: `Changed ${entity} status from ${oldStatus} to ${newStatus}`,
      descriptionAr: `تم تغيير حالة ${entity} من ${oldStatus} إلى ${newStatus}`,
      ...requestContext,
      requestMethod: 'PATCH',
    });
  }

  // ============================================
  // QUERY METHODS
  // ============================================
  async findAll(filters?: {
    userId?: string;
    userType?: string;
    action?: AuditAction;
    entity?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const where: any = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.userType) where.userType = filters.userType;
    if (filters?.action) where.action = filters.action;
    if (filters?.entity) where.entity = filters.entity;
    if (filters?.entityId) where.entityId = filters.entityId;

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  async findByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findByUser(userId: string, userType: string): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { userId, userType },
      orderBy: [{ createdAt: 'desc' }],
      take: 100,
    });
  }

  // ============================================
  // STATISTICS
  // ============================================
  async getStats(filters?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    total: number;
    byAction: Record<AuditAction, number>;
    byEntity: Record<string, number>;
    byUserType: Record<string, number>;
    recentActivity: AuditLog[];
  }> {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const logs = await this.prisma.auditLog.findMany({ where });

    const byAction = logs.reduce(
      (acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      },
      {} as Record<AuditAction, number>,
    );

    const byEntity = logs.reduce(
      (acc, log) => {
        acc[log.entity] = (acc[log.entity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byUserType = logs.reduce(
      (acc, log) => {
        const type = log.userType || 'system';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const recentActivity = await this.prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: 10,
    });

    return {
      total: logs.length,
      byAction,
      byEntity,
      byUserType,
      recentActivity,
    };
  }

  // ============================================
  // CLEANUP
  // ============================================
  async cleanupOldLogs(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  // ============================================
  // HELPERS
  // ============================================
  private sanitizeData(data: Record<string, any>): Record<string, any> {
    if (!data) return data;

    const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken', 'secret'];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
