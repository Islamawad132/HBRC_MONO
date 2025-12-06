import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsObject,
} from 'class-validator';
import { NotificationChannel, NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Target user ID',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 'customer',
    description: 'Type of user (customer or employee)',
    enum: ['customer', 'employee'],
  })
  @IsString()
  @IsNotEmpty()
  userType: 'customer' | 'employee';

  @ApiProperty({
    example: 'REQUEST_STATUS_CHANGED',
    description: 'Type of notification',
    enum: NotificationType,
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiPropertyOptional({
    example: 'IN_APP',
    description: 'Notification channel',
    enum: NotificationChannel,
    default: 'IN_APP',
  })
  @IsEnum(NotificationChannel)
  @IsOptional()
  channel?: NotificationChannel;

  @ApiProperty({
    example: 'Request Status Updated',
    description: 'Notification title (English)',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'تم تحديث حالة الطلب',
    description: 'Notification title (Arabic)',
  })
  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @ApiProperty({
    example: 'Your request REQ-2024-001 has been approved.',
    description: 'Notification message (English)',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    example: 'تمت الموافقة على طلبك REQ-2024-001.',
    description: 'Notification message (Arabic)',
  })
  @IsString()
  @IsNotEmpty()
  messageAr: string;

  @ApiPropertyOptional({
    example: '/requests/550e8400-e29b-41d4-a716-446655440000',
    description: 'Action URL for the notification',
  })
  @IsString()
  @IsOptional()
  actionUrl?: string;

  @ApiPropertyOptional({
    example: { requestId: '550e8400-e29b-41d4-a716-446655440000', status: 'APPROVED' },
    description: 'Additional action data',
  })
  @IsObject()
  @IsOptional()
  actionData?: Record<string, any>;
}
