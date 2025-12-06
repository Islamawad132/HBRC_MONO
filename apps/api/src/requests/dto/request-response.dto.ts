import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequestStatus, RequestPriority } from '@prisma/client';

export class RequestResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Request unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'REQ-2024-001',
    description: 'Unique request number',
  })
  requestNumber: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Customer ID',
  })
  customerId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Service ID',
  })
  serviceId: string;

  @ApiProperty({
    example: 'Concrete Testing Request',
    description: 'Request title in English',
  })
  title: string;

  @ApiProperty({
    example: 'طلب اختبار الخرسانة',
    description: 'Request title in Arabic',
  })
  titleAr: string;

  @ApiPropertyOptional({
    example: 'Need concrete compression testing',
    description: 'Request description in English',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'أحتاج اختبار مقاومة الخرسانة',
    description: 'Request description in Arabic',
  })
  descriptionAr?: string;

  @ApiPropertyOptional({
    example: 'Additional notes',
    description: 'Additional notes in English',
  })
  notes?: string;

  @ApiPropertyOptional({
    example: 'ملاحظات إضافية',
    description: 'Additional notes in Arabic',
  })
  notesAr?: string;

  @ApiProperty({
    enum: RequestStatus,
    example: RequestStatus.SUBMITTED,
    description: 'Current request status',
  })
  status: RequestStatus;

  @ApiProperty({
    enum: RequestPriority,
    example: RequestPriority.MEDIUM,
    description: 'Request priority',
  })
  priority: RequestPriority;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Assigned employee ID',
  })
  assignedToId?: string;

  @ApiPropertyOptional({
    example: '2024-12-05T10:30:00.000Z',
    description: 'Assignment timestamp',
  })
  assignedAt?: Date;

  @ApiPropertyOptional({
    example: 2500.0,
    description: 'Estimated price in EGP',
  })
  estimatedPrice?: number;

  @ApiPropertyOptional({
    example: 2400.0,
    description: 'Final price in EGP',
  })
  finalPrice?: number;

  @ApiProperty({
    example: 'EGP',
    description: 'Currency code',
  })
  currency: string;

  @ApiProperty({
    example: '2024-12-05T09:00:00.000Z',
    description: 'Request submission date',
  })
  requestedDate: Date;

  @ApiPropertyOptional({
    example: '2024-12-15T09:00:00.000Z',
    description: 'Expected completion date',
  })
  expectedDate?: Date;

  @ApiPropertyOptional({
    example: '2024-12-14T15:00:00.000Z',
    description: 'Completion timestamp',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    example: '2024-12-16T10:00:00.000Z',
    description: 'Delivery timestamp',
  })
  deliveredAt?: Date;

  @ApiPropertyOptional({
    example: 'Does not meet requirements',
    description: 'Rejection reason (English)',
  })
  rejectionReason?: string;

  @ApiPropertyOptional({
    example: 'لا يستوفي المتطلبات',
    description: 'Rejection reason (Arabic)',
  })
  rejectionReasonAr?: string;

  @ApiPropertyOptional({
    example: 'Customer cancelled request',
    description: 'Cancellation reason (English)',
  })
  cancellationReason?: string;

  @ApiPropertyOptional({
    example: 'العميل ألغى الطلب',
    description: 'Cancellation reason (Arabic)',
  })
  cancellationReasonAr?: string;

  @ApiProperty({
    example: 15,
    description: 'Number of times request was viewed',
  })
  viewCount: number;

  @ApiPropertyOptional({
    example: '2024-12-05T16:30:00.000Z',
    description: 'Last view timestamp',
  })
  lastViewedAt?: Date;

  @ApiProperty({
    example: '2024-12-05T09:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-12-05T14:30:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
