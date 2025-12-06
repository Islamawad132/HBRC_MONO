import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel, NotificationStatus, NotificationType } from '@prisma/client';

export class NotificationResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Notification unique identifier',
  })
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Target user ID',
  })
  userId: string;

  @ApiProperty({
    example: 'customer',
    description: 'Type of user',
  })
  userType: string;

  @ApiProperty({
    example: 'REQUEST_STATUS_CHANGED',
    description: 'Type of notification',
    enum: NotificationType,
  })
  type: NotificationType;

  @ApiProperty({
    example: 'IN_APP',
    description: 'Notification channel',
    enum: NotificationChannel,
  })
  channel: NotificationChannel;

  @ApiProperty({
    example: 'Request Status Updated',
    description: 'Notification title (English)',
  })
  title: string;

  @ApiProperty({
    example: 'تم تحديث حالة الطلب',
    description: 'Notification title (Arabic)',
  })
  titleAr: string;

  @ApiProperty({
    example: 'Your request REQ-2024-001 has been approved.',
    description: 'Notification message (English)',
  })
  message: string;

  @ApiProperty({
    example: 'تمت الموافقة على طلبك REQ-2024-001.',
    description: 'Notification message (Arabic)',
  })
  messageAr: string;

  @ApiPropertyOptional({
    example: '/requests/550e8400-e29b-41d4-a716-446655440000',
    description: 'Action URL',
  })
  actionUrl?: string;

  @ApiPropertyOptional({
    description: 'Additional action data',
  })
  actionData?: Record<string, any>;

  @ApiProperty({
    example: 'SENT',
    description: 'Notification status',
    enum: NotificationStatus,
  })
  status: NotificationStatus;

  @ApiPropertyOptional({
    example: '2024-01-15T10:30:00.000Z',
    description: 'When the notification was sent',
  })
  sentAt?: Date;

  @ApiPropertyOptional({
    example: '2024-01-15T10:31:00.000Z',
    description: 'When the notification was delivered',
  })
  deliveredAt?: Date;

  @ApiPropertyOptional({
    example: '2024-01-15T10:35:00.000Z',
    description: 'When the notification was read',
  })
  readAt?: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;
}
