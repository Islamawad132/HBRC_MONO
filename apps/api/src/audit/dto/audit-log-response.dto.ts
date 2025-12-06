import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';

export class AuditLogResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Audit log unique identifier',
  })
  id: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User ID who performed the action',
  })
  userId?: string;

  @ApiPropertyOptional({
    example: 'employee',
    description: 'Type of user',
  })
  userType?: string;

  @ApiPropertyOptional({
    example: 'admin@hbrc.com',
    description: 'User email',
  })
  userEmail?: string;

  @ApiProperty({
    example: 'CREATE',
    description: 'Action performed',
    enum: AuditAction,
  })
  action: AuditAction;

  @ApiProperty({
    example: 'ServiceRequest',
    description: 'Entity type affected',
  })
  entity: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Entity ID affected',
  })
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Old data before the change',
  })
  oldData?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'New data after the change',
  })
  newData?: Record<string, any>;

  @ApiPropertyOptional({
    example: 'Created new service request',
    description: 'Description of the action (English)',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'تم إنشاء طلب خدمة جديد',
    description: 'Description of the action (Arabic)',
  })
  descriptionAr?: string;

  @ApiPropertyOptional({
    example: '192.168.1.1',
    description: 'IP address of the request',
  })
  ipAddress?: string;

  @ApiPropertyOptional({
    example: 'Mozilla/5.0...',
    description: 'User agent of the request',
  })
  userAgent?: string;

  @ApiPropertyOptional({
    example: '/api/requests',
    description: 'Request path',
  })
  requestPath?: string;

  @ApiPropertyOptional({
    example: 'POST',
    description: 'HTTP method',
  })
  requestMethod?: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;
}
