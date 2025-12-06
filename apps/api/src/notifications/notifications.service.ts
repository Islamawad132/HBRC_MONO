import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsGateway } from './notifications.gateway';
import { CreateNotificationDto } from './dto';
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {}

  // ============================================
  // CREATE NOTIFICATION
  // ============================================
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        userType: dto.userType,
        type: dto.type,
        channel: dto.channel || NotificationChannel.IN_APP,
        title: dto.title,
        titleAr: dto.titleAr,
        message: dto.message,
        messageAr: dto.messageAr,
        actionUrl: dto.actionUrl,
        actionData: dto.actionData,
        status: NotificationStatus.PENDING,
      },
    });

    // Send notification based on channel
    await this.sendNotification(notification);

    return notification;
  }

  // ============================================
  // SEND NOTIFICATION BY CHANNEL
  // ============================================
  private async sendNotification(notification: Notification): Promise<void> {
    try {
      switch (notification.channel) {
        case NotificationChannel.IN_APP:
          // Send via WebSocket for real-time delivery
          await this.sendInAppNotification(notification);
          break;

        case NotificationChannel.EMAIL:
          await this.sendEmailNotification(notification);
          break;

        case NotificationChannel.SMS:
          await this.sendSmsNotification(notification);
          break;

        case NotificationChannel.WHATSAPP:
          await this.sendWhatsAppNotification(notification);
          break;

        case NotificationChannel.PUSH:
          await this.sendPushNotification(notification);
          break;

        default:
          await this.markAsSent(notification.id);
      }
    } catch (error) {
      this.logger.error(`Failed to send notification ${notification.id}:`, error);
      await this.markAsFailed(notification.id, error.message);
    }
  }

  // ============================================
  // IN-APP NOTIFICATION (Socket.IO)
  // ============================================
  private async sendInAppNotification(notification: Notification): Promise<void> {
    // Send via WebSocket if user is online
    const isDelivered = this.notificationsGateway.sendNotificationToUser(
      notification.userId,
      notification.userType as 'customer' | 'employee',
      notification,
    );

    if (isDelivered) {
      this.logger.log(
        `Real-time notification sent to ${notification.userType}:${notification.userId}`,
      );
    } else {
      this.logger.log(
        `User ${notification.userType}:${notification.userId} is offline, notification stored for later`,
      );
    }

    // Mark as sent regardless (notification is stored in DB)
    await this.markAsSent(notification.id);
  }

  private async sendEmailNotification(notification: Notification): Promise<void> {
    // Get user email based on type
    let email: string | undefined;

    if (notification.userType === 'customer') {
      const customer = await this.prisma.customer.findUnique({
        where: { id: notification.userId },
        select: { email: true },
      });
      email = customer?.email;
    } else {
      const employee = await this.prisma.employee.findUnique({
        where: { id: notification.userId },
        select: { email: true },
      });
      email = employee?.email;
    }

    if (!email) {
      throw new Error('User email not found');
    }

    await this.mailService.sendNotificationEmail(
      email,
      `${notification.title} | ${notification.titleAr}`,
      `${notification.message}\n\n${notification.messageAr}`,
    );

    await this.markAsSent(notification.id);
  }

  private async sendSmsNotification(notification: Notification): Promise<void> {
    // TODO: Integrate with SMS provider (e.g., Twilio, MessageBird)
    this.logger.warn('SMS notifications not yet implemented');
    await this.markAsSent(notification.id);
  }

  private async sendWhatsAppNotification(notification: Notification): Promise<void> {
    // TODO: Integrate with WhatsApp Business API
    this.logger.warn('WhatsApp notifications not yet implemented');
    await this.markAsSent(notification.id);
  }

  private async sendPushNotification(notification: Notification): Promise<void> {
    // TODO: Integrate with push notification service (e.g., Firebase)
    this.logger.warn('Push notifications not yet implemented');
    await this.markAsSent(notification.id);
  }

  // ============================================
  // HELPER METHODS FOR COMMON NOTIFICATIONS
  // ============================================
  async notifyRequestCreated(
    customerId: string,
    requestNumber: string,
    serviceName: string,
  ): Promise<Notification> {
    return this.create({
      userId: customerId,
      userType: 'customer',
      type: NotificationType.REQUEST_CREATED,
      channel: NotificationChannel.IN_APP,
      title: 'Service Request Created',
      titleAr: 'تم إنشاء طلب الخدمة',
      message: `Your service request ${requestNumber} for ${serviceName} has been created successfully.`,
      messageAr: `تم إنشاء طلب الخدمة الخاص بك ${requestNumber} لـ ${serviceName} بنجاح.`,
      actionUrl: `/requests/${requestNumber}`,
      actionData: { requestNumber },
    });
  }

  async notifyRequestStatusChanged(
    customerId: string,
    requestNumber: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<Notification> {
    return this.create({
      userId: customerId,
      userType: 'customer',
      type: NotificationType.REQUEST_STATUS_CHANGED,
      channel: NotificationChannel.IN_APP,
      title: 'Request Status Updated',
      titleAr: 'تم تحديث حالة الطلب',
      message: `Your request ${requestNumber} status has changed from ${oldStatus} to ${newStatus}.`,
      messageAr: `تم تغيير حالة طلبك ${requestNumber} من ${oldStatus} إلى ${newStatus}.`,
      actionUrl: `/requests/${requestNumber}`,
      actionData: { requestNumber, oldStatus, newStatus },
    });
  }

  async notifyRequestAssigned(
    employeeId: string,
    requestNumber: string,
    customerName: string,
  ): Promise<Notification> {
    return this.create({
      userId: employeeId,
      userType: 'employee',
      type: NotificationType.REQUEST_ASSIGNED,
      channel: NotificationChannel.IN_APP,
      title: 'New Request Assigned',
      titleAr: 'تم تعيين طلب جديد',
      message: `Request ${requestNumber} from ${customerName} has been assigned to you.`,
      messageAr: `تم تعيين الطلب ${requestNumber} من ${customerName} لك.`,
      actionUrl: `/requests/${requestNumber}`,
      actionData: { requestNumber, customerName },
    });
  }

  async notifyInvoiceCreated(
    customerId: string,
    invoiceNumber: string,
    amount: number,
  ): Promise<Notification> {
    return this.create({
      userId: customerId,
      userType: 'customer',
      type: NotificationType.INVOICE_CREATED,
      channel: NotificationChannel.IN_APP,
      title: 'Invoice Created',
      titleAr: 'تم إنشاء الفاتورة',
      message: `Invoice ${invoiceNumber} for EGP ${amount.toFixed(2)} has been created.`,
      messageAr: `تم إنشاء الفاتورة ${invoiceNumber} بمبلغ ${amount.toFixed(2)} جنيه.`,
      actionUrl: `/invoices/${invoiceNumber}`,
      actionData: { invoiceNumber, amount },
    });
  }

  async notifyPaymentReceived(
    customerId: string,
    paymentNumber: string,
    amount: number,
  ): Promise<Notification> {
    return this.create({
      userId: customerId,
      userType: 'customer',
      type: NotificationType.PAYMENT_RECEIVED,
      channel: NotificationChannel.IN_APP,
      title: 'Payment Received',
      titleAr: 'تم استلام الدفع',
      message: `Payment ${paymentNumber} of EGP ${amount.toFixed(2)} has been received. Thank you!`,
      messageAr: `تم استلام الدفع ${paymentNumber} بمبلغ ${amount.toFixed(2)} جنيه. شكراً لك!`,
      actionUrl: `/payments/${paymentNumber}`,
      actionData: { paymentNumber, amount },
    });
  }

  // ============================================
  // QUERY METHODS
  // ============================================
  async findAll(filters?: {
    userId?: string;
    userType?: string;
    type?: NotificationType;
    status?: NotificationStatus;
    channel?: NotificationChannel;
    unreadOnly?: boolean;
  }): Promise<Notification[]> {
    const where: any = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.userType) where.userType = filters.userType;
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.channel) where.channel = filters.channel;
    if (filters?.unreadOnly) where.readAt = null;

    return this.prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findByUser(
    userId: string,
    userType: 'customer' | 'employee',
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    },
  ): Promise<{ notifications: Notification[]; total: number; unread: number }> {
    const where: any = { userId, userType };

    if (options?.unreadOnly) {
      where.readAt = null;
    }

    const [notifications, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        take: options?.limit || 20,
        skip: options?.offset || 0,
      }),
      this.prisma.notification.count({ where: { userId, userType } }),
      this.prisma.notification.count({ where: { userId, userType, readAt: null } }),
    ]);

    return { notifications, total, unread };
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Notification with ID "${id}" not found`,
        messageAr: `الإشعار برقم "${id}" غير موجود`,
      });
    }

    return notification;
  }

  // ============================================
  // STATUS UPDATES
  // ============================================
  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.findOne(id);

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    // Update unread count via WebSocket
    await this.sendUnreadCountUpdate(
      notification.userId,
      notification.userType as 'customer' | 'employee',
    );

    return updated;
  }

  async markAllAsRead(userId: string, userType: 'customer' | 'employee'): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        userType,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    // Update unread count via WebSocket (will be 0 after marking all as read)
    this.notificationsGateway.sendUnreadCountUpdate(userId, userType, 0);

    return result.count;
  }

  // ============================================
  // HELPER: Send unread count update via WebSocket
  // ============================================
  private async sendUnreadCountUpdate(
    userId: string,
    userType: 'customer' | 'employee',
  ): Promise<void> {
    const unreadCount = await this.prisma.notification.count({
      where: { userId, userType, readAt: null },
    });

    this.notificationsGateway.sendUnreadCountUpdate(userId, userType, unreadCount);
  }

  private async markAsSent(id: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      },
    });
  }

  private async markAsFailed(id: string, reason: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.FAILED,
        failedAt: new Date(),
        failureReason: reason,
      },
    });
  }

  // ============================================
  // DELETE
  // ============================================
  async remove(id: string): Promise<{ message: string; messageAr: string }> {
    await this.findOne(id);

    await this.prisma.notification.delete({
      where: { id },
    });

    return {
      message: 'Notification deleted successfully',
      messageAr: 'تم حذف الإشعار بنجاح',
    };
  }

  async removeOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        readAt: { not: null },
      },
    });

    return result.count;
  }

  // ============================================
  // STATISTICS
  // ============================================
  async getStats(userId?: string, userType?: string): Promise<{
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byChannel: Record<NotificationChannel, number>;
    byStatus: Record<NotificationStatus, number>;
  }> {
    const where: any = {};
    if (userId) where.userId = userId;
    if (userType) where.userType = userType;

    const notifications = await this.prisma.notification.findMany({ where });

    const byType = notifications.reduce(
      (acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      },
      {} as Record<NotificationType, number>,
    );

    const byChannel = notifications.reduce(
      (acc, n) => {
        acc[n.channel] = (acc[n.channel] || 0) + 1;
        return acc;
      },
      {} as Record<NotificationChannel, number>,
    );

    const byStatus = notifications.reduce(
      (acc, n) => {
        acc[n.status] = (acc[n.status] || 0) + 1;
        return acc;
      },
      {} as Record<NotificationStatus, number>,
    );

    const unread = notifications.filter((n) => !n.readAt).length;

    return {
      total: notifications.length,
      unread,
      byType,
      byChannel,
      byStatus,
    };
  }
}
