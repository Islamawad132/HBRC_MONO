import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, NotificationResponseDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards';
import { RequirePermissions, CurrentUser, Public } from '../common/decorators';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  ErrorResponseDto,
  DeleteResponseDto,
} from '../common/dto';
import { NotificationChannel, NotificationStatus, NotificationType } from '@prisma/client';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ============================================
  // USER NOTIFICATIONS (FOR CURRENT USER)
  // ============================================
  @Get('me')
  @ApiOperation({
    summary: 'Get my notifications',
    description: `
Get notifications for the currently authenticated user.

**Notes:**
- Returns notifications sorted by creation date (newest first)
- Includes total count and unread count
- Supports pagination with limit and offset
    `,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of notifications to return (default: 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of notifications to skip (default: 0)',
  })
  @ApiQuery({
    name: 'unreadOnly',
    required: false,
    type: Boolean,
    description: 'Only return unread notifications',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  getMyNotifications(
    @CurrentUser('id') userId: string,
    @CurrentUser('type') userType: 'customer' | 'employee',
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    return this.notificationsService.findByUser(userId, userType, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      unreadOnly: unreadOnly === true || unreadOnly === 'true' as any,
    });
  }

  @Get('me/stats')
  @ApiOperation({
    summary: 'Get my notification statistics',
    description: 'Get notification statistics for the current user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  getMyStats(
    @CurrentUser('id') userId: string,
    @CurrentUser('type') userType: 'customer' | 'employee',
  ) {
    return this.notificationsService.getStats(userId, userType);
  }

  @Patch('me/read-all')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all unread notifications for the current user as read.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications marked as read',
  })
  markAllAsRead(
    @CurrentUser('id') userId: string,
    @CurrentUser('type') userType: 'customer' | 'employee',
  ) {
    return this.notificationsService.markAllAsRead(userId, userType).then((count) => ({
      message: `${count} notifications marked as read`,
      messageAr: `تم تحديد ${count} إشعار كمقروء`,
      count,
    }));
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a specific notification as read.',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as read',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
    type: NotFoundResponseDto,
  })
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('notifications:create')
  @ApiOperation({
    summary: 'Create a notification (Admin)',
    description: `
Create a new notification for a user.

**Required Permission:** \`notifications:create\`

**Notification Types:**
- REQUEST_CREATED: When a service request is created
- REQUEST_STATUS_CHANGED: When request status changes
- REQUEST_ASSIGNED: When request is assigned to employee
- INVOICE_CREATED: When invoice is generated
- PAYMENT_RECEIVED: When payment is received
- DOCUMENT_UPLOADED: When document is uploaded
- ACCOUNT_VERIFIED: When account is verified
- PASSWORD_RESET: Password reset notification
- WELCOME: Welcome notification
- REMINDER: Reminder notification
- SYSTEM: System notification

**Channels:**
- IN_APP: In-app notification (default)
- EMAIL: Email notification
- SMS: SMS notification
- WHATSAPP: WhatsApp notification
- PUSH: Push notification
    `,
  })
  @ApiBody({
    type: CreateNotificationDto,
    description: 'Notification data',
    examples: {
      inApp: {
        summary: 'In-app notification',
        value: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          userType: 'customer',
          type: 'REQUEST_STATUS_CHANGED',
          channel: 'IN_APP',
          title: 'Request Status Updated',
          titleAr: 'تم تحديث حالة الطلب',
          message: 'Your request has been approved.',
          messageAr: 'تمت الموافقة على طلبك.',
          actionUrl: '/requests/REQ-2024-001',
        },
      },
      email: {
        summary: 'Email notification',
        value: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          userType: 'customer',
          type: 'INVOICE_CREATED',
          channel: 'EMAIL',
          title: 'Invoice Created',
          titleAr: 'تم إنشاء الفاتورة',
          message: 'Your invoice INV-2024-001 is ready.',
          messageAr: 'فاتورتك INV-2024-001 جاهزة.',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Notification created successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    type: ForbiddenResponseDto,
  })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  @RequirePermissions('notifications:read')
  @ApiOperation({
    summary: 'Get all notifications (Admin)',
    description: `
Get all notifications with optional filters.

**Required Permission:** \`notifications:read\`
    `,
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'userType',
    required: false,
    enum: ['customer', 'employee'],
    description: 'Filter by user type',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: NotificationType,
    description: 'Filter by notification type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: NotificationStatus,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'channel',
    required: false,
    enum: NotificationChannel,
    description: 'Filter by channel',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications retrieved successfully',
    type: [NotificationResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    type: ForbiddenResponseDto,
  })
  findAll(
    @Query('userId') userId?: string,
    @Query('userType') userType?: string,
    @Query('type') type?: NotificationType,
    @Query('status') status?: NotificationStatus,
    @Query('channel') channel?: NotificationChannel,
  ) {
    return this.notificationsService.findAll({
      userId,
      userType,
      type,
      status,
      channel,
    });
  }

  @Get('stats')
  @RequirePermissions('notifications:read')
  @ApiOperation({
    summary: 'Get notification statistics (Admin)',
    description: `
Get overall notification statistics.

**Required Permission:** \`notifications:read\`
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  getStats() {
    return this.notificationsService.getStats();
  }

  @Get(':id')
  @RequirePermissions('notifications:read')
  @ApiOperation({
    summary: 'Get notification by ID (Admin)',
    description: `
Get a specific notification by ID.

**Required Permission:** \`notifications:read\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Notification UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification retrieved successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
    type: NotFoundResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('notifications:delete')
  @ApiOperation({
    summary: 'Delete notification (Admin)',
    description: `
Delete a notification.

**Required Permission:** \`notifications:delete\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Notification UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification deleted successfully',
    type: DeleteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    type: ForbiddenResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }

  @Delete('cleanup/old')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('notifications:delete')
  @ApiOperation({
    summary: 'Cleanup old notifications (Admin)',
    description: `
Delete old read notifications.

**Required Permission:** \`notifications:delete\`
    `,
  })
  @ApiQuery({
    name: 'daysOld',
    required: false,
    type: Number,
    description: 'Delete notifications older than this many days (default: 30)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Old notifications cleaned up',
  })
  cleanupOld(@Query('daysOld') daysOld?: number) {
    return this.notificationsService.removeOldNotifications(daysOld ? Number(daysOld) : 30).then((count) => ({
      message: `${count} old notifications deleted`,
      messageAr: `تم حذف ${count} إشعار قديم`,
      count,
    }));
  }
}
