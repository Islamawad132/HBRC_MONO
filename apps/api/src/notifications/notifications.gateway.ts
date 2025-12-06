import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Notification } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: 'customer' | 'employee';
  userEmail?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // In production, specify your frontend URL
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>

  constructor(private jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('Notifications WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Get token from handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.userType = payload.type;
      client.userEmail = payload.email;

      // Add to connected users map
      const userKey = `${client.userType}:${client.userId}`;
      if (!this.connectedUsers.has(userKey)) {
        this.connectedUsers.set(userKey, new Set());
      }
      this.connectedUsers.get(userKey)!.add(client.id);

      // Join user-specific room
      client.join(userKey);

      this.logger.log(
        `Client connected: ${client.id} (${client.userType}: ${client.userEmail})`,
      );

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to notifications',
        messageAr: 'متصل بالإشعارات',
        userId: client.userId,
        userType: client.userType,
      });
    } catch (error) {
      this.logger.error(`Connection error for ${client.id}:`, error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId && client.userType) {
      const userKey = `${client.userType}:${client.userId}`;
      const userSockets = this.connectedUsers.get(userKey);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userKey);
        }
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ============================================
  // SEND NOTIFICATION TO USER
  // ============================================
  sendNotificationToUser(
    userId: string,
    userType: 'customer' | 'employee',
    notification: Notification,
  ): boolean {
    const userKey = `${userType}:${userId}`;
    const isOnline = this.connectedUsers.has(userKey);

    if (isOnline) {
      this.server.to(userKey).emit('notification', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        titleAr: notification.titleAr,
        message: notification.message,
        messageAr: notification.messageAr,
        actionUrl: notification.actionUrl,
        actionData: notification.actionData,
        createdAt: notification.createdAt,
      });
      this.logger.log(`Notification sent to ${userKey}`);
    }

    return isOnline;
  }

  // ============================================
  // SEND TO MULTIPLE USERS
  // ============================================
  sendNotificationToUsers(
    users: { userId: string; userType: 'customer' | 'employee' }[],
    notification: Partial<Notification>,
  ): number {
    let sentCount = 0;

    for (const user of users) {
      const userKey = `${user.userType}:${user.userId}`;
      if (this.connectedUsers.has(userKey)) {
        this.server.to(userKey).emit('notification', notification);
        sentCount++;
      }
    }

    return sentCount;
  }

  // ============================================
  // BROADCAST TO ALL EMPLOYEES
  // ============================================
  broadcastToEmployees(notification: Partial<Notification>): void {
    for (const [userKey] of this.connectedUsers) {
      if (userKey.startsWith('employee:')) {
        this.server.to(userKey).emit('notification', notification);
      }
    }
    this.logger.log('Broadcast sent to all employees');
  }

  // ============================================
  // SEND UNREAD COUNT UPDATE
  // ============================================
  sendUnreadCountUpdate(
    userId: string,
    userType: 'customer' | 'employee',
    unreadCount: number,
  ): void {
    const userKey = `${userType}:${userId}`;
    if (this.connectedUsers.has(userKey)) {
      this.server.to(userKey).emit('unreadCount', { count: unreadCount });
    }
  }

  // ============================================
  // CLIENT EVENTS
  // ============================================
  @SubscribeMessage('markAsRead')
  handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string },
  ) {
    this.logger.log(
      `User ${client.userId} marked notification ${data.notificationId} as read`,
    );
    // The actual marking is done via REST API, this is just for logging
    return { success: true };
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    return { event: 'pong', timestamp: new Date().toISOString() };
  }

  // ============================================
  // HELPER METHODS
  // ============================================
  isUserOnline(userId: string, userType: 'customer' | 'employee'): boolean {
    const userKey = `${userType}:${userId}`;
    return this.connectedUsers.has(userKey);
  }

  getOnlineUsersCount(): { customers: number; employees: number; total: number } {
    let customers = 0;
    let employees = 0;

    for (const [userKey] of this.connectedUsers) {
      if (userKey.startsWith('customer:')) customers++;
      else if (userKey.startsWith('employee:')) employees++;
    }

    return { customers, employees, total: customers + employees };
  }

  getConnectedUserIds(): { customers: string[]; employees: string[] } {
    const customers: string[] = [];
    const employees: string[] = [];

    for (const [userKey] of this.connectedUsers) {
      const [type, id] = userKey.split(':');
      if (type === 'customer') customers.push(id);
      else if (type === 'employee') employees.push(id);
    }

    return { customers, employees };
  }
}
