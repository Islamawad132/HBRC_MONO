import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceCategory, PricingType, ServiceStatus } from '@prisma/client';

export class ServiceResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Service unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'Concrete Compression Test',
    description: 'Service name in English',
  })
  name: string;

  @ApiProperty({
    example: 'اختبار مقاومة الخرسانة للضغط',
    description: 'Service name in Arabic',
  })
  nameAr: string;

  @ApiPropertyOptional({
    example: 'Comprehensive concrete compression strength testing service',
    description: 'Service description in English',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'خدمة اختبار شاملة لمقاومة الخرسانة للضغط',
    description: 'Service description in Arabic',
  })
  descriptionAr?: string;

  @ApiProperty({
    enum: ServiceCategory,
    example: ServiceCategory.CONCRETE_TESTING,
    description: 'Service category',
  })
  category: ServiceCategory;

  @ApiProperty({
    example: 'CONC-001',
    description: 'Unique service code',
  })
  code: string;

  @ApiProperty({
    enum: PricingType,
    example: PricingType.FIXED,
    description: 'Pricing type',
  })
  pricingType: PricingType;

  @ApiPropertyOptional({
    example: 500.0,
    description: 'Base price in EGP',
  })
  basePrice?: number;

  @ApiPropertyOptional({
    example: 300.0,
    description: 'Minimum price (for variable pricing)',
  })
  minPrice?: number;

  @ApiPropertyOptional({
    example: 1000.0,
    description: 'Maximum price (for variable pricing)',
  })
  maxPrice?: number;

  @ApiProperty({
    example: 'EGP',
    description: 'Currency code',
  })
  currency: string;

  @ApiPropertyOptional({
    example: 7,
    description: 'Expected service duration in days',
  })
  duration?: number;

  @ApiPropertyOptional({
    example: 'Concrete samples, Project specifications',
    description: 'Required documents/materials in English',
  })
  requirements?: string;

  @ApiPropertyOptional({
    example: 'عينات خرسانة، مواصفات المشروع',
    description: 'Required documents/materials in Arabic',
  })
  requirementsAr?: string;

  @ApiProperty({
    enum: ServiceStatus,
    example: ServiceStatus.ACTIVE,
    description: 'Service status',
  })
  status: ServiceStatus;

  @ApiProperty({
    example: true,
    description: 'Whether the service is currently available',
  })
  isActive: boolean;

  @ApiProperty({
    example: 42,
    description: 'Total number of orders for this service',
  })
  orderCount: number;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Service creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-20T15:45:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
