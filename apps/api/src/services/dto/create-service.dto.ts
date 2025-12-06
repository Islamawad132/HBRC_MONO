import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { ServiceCategory, PricingType, ServiceStatus } from '@prisma/client';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Concrete Compression Test',
    description: 'Service name in English',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'اختبار مقاومة الخرسانة للضغط',
    description: 'Service name in Arabic',
  })
  @IsString()
  @MaxLength(255)
  nameAr: string;

  @ApiPropertyOptional({
    example: 'Comprehensive concrete compression strength testing service',
    description: 'Detailed service description in English',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'خدمة اختبار شاملة لمقاومة الخرسانة للضغط',
    description: 'Detailed service description in Arabic',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiProperty({
    enum: ServiceCategory,
    example: ServiceCategory.CONCRETE_TESTING,
    description: 'Service category',
  })
  @IsEnum(ServiceCategory)
  category: ServiceCategory;

  @ApiProperty({
    example: 'CONC-001',
    description: 'Unique service code (e.g., LAB-001, CONS-002)',
  })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    enum: PricingType,
    example: PricingType.FIXED,
    description: 'Pricing type',
    default: PricingType.FIXED,
  })
  @IsEnum(PricingType)
  @IsOptional()
  pricingType?: PricingType;

  @ApiPropertyOptional({
    example: 500.0,
    description: 'Base price in EGP',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  basePrice?: number;

  @ApiPropertyOptional({
    example: 300.0,
    description: 'Minimum price for variable pricing (in EGP)',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({
    example: 1000.0,
    description: 'Maximum price for variable pricing (in EGP)',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({
    example: 'EGP',
    description: 'Currency code',
    default: 'EGP',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    example: 7,
    description: 'Expected service duration in days',
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({
    example: 'Concrete samples, Project specifications',
    description: 'Required documents/materials in English',
  })
  @IsString()
  @IsOptional()
  requirements?: string;

  @ApiPropertyOptional({
    example: 'عينات خرسانة، مواصفات المشروع',
    description: 'Required documents/materials in Arabic',
  })
  @IsString()
  @IsOptional()
  requirementsAr?: string;

  @ApiPropertyOptional({
    enum: ServiceStatus,
    example: ServiceStatus.ACTIVE,
    description: 'Service status',
    default: ServiceStatus.ACTIVE,
  })
  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the service is currently available',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
