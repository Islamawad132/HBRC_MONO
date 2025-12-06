import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  IsArray,
  IsUUID,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// Lookup Item DTOs
export class CreateLookupItemDto {
  @ApiProperty({
    example: 'Net 30',
    description: 'Item name in English',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'صافي 30 يوم',
    description: 'Item name in Arabic',
  })
  @IsString()
  @MaxLength(255)
  nameAr: string;

  @ApiPropertyOptional({
    example: 'Payment due within 30 days',
    description: 'Item description in English',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'السداد خلال 30 يوم',
    description: 'Item description in Arabic',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiProperty({
    example: 'NET-30',
    description: 'Unique item code within category',
  })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({
    example: '30',
    description: 'Optional value associated with this item',
  })
  @IsString()
  @IsOptional()
  value?: string;

  @ApiPropertyOptional({
    example: 'calendar',
    description: 'Optional icon name for UI',
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({
    example: '#4CAF50',
    description: 'Optional color code for UI',
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    example: { daysUntilDue: 30, reminderDays: [7, 3, 1] },
    description: 'Additional metadata as JSON',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this item is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this is the default item for the category',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: 0,
    description: 'Sort order for display',
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateLookupItemDto extends PartialType(CreateLookupItemDto) {}

export class LookupItemResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  categoryId: string;

  @ApiProperty({ example: 'Net 30' })
  name: string;

  @ApiProperty({ example: 'صافي 30 يوم' })
  nameAr: string;

  @ApiPropertyOptional({ example: 'Payment due within 30 days' })
  description?: string;

  @ApiPropertyOptional({ example: 'السداد خلال 30 يوم' })
  descriptionAr?: string;

  @ApiProperty({ example: 'NET-30' })
  code: string;

  @ApiPropertyOptional({ example: '30' })
  value?: string;

  @ApiPropertyOptional({ example: 'calendar' })
  icon?: string;

  @ApiPropertyOptional({ example: '#4CAF50' })
  color?: string;

  @ApiPropertyOptional({ example: { daysUntilDue: 30 } })
  metadata?: Record<string, any>;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isDefault: boolean;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}

// Lookup Category DTOs
export class CreateLookupCategoryDto {
  @ApiProperty({
    example: 'Payment Terms',
    description: 'Category name in English',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'شروط الدفع',
    description: 'Category name in Arabic',
  })
  @IsString()
  @MaxLength(255)
  nameAr: string;

  @ApiPropertyOptional({
    example: 'Available payment term options',
    description: 'Category description in English',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'خيارات شروط الدفع المتاحة',
    description: 'Category description in Arabic',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiProperty({
    example: 'LC-PAYMENT-TERMS',
    description: 'Unique category code',
  })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this category is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this is a system category (cannot be deleted)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @ApiPropertyOptional({
    description: 'Initial items to create with the category',
    type: [CreateLookupItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLookupItemDto)
  @IsOptional()
  items?: CreateLookupItemDto[];
}

export class UpdateLookupCategoryDto extends PartialType(CreateLookupCategoryDto) {}

export class LookupCategoryResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Payment Terms' })
  name: string;

  @ApiProperty({ example: 'شروط الدفع' })
  nameAr: string;

  @ApiPropertyOptional({ example: 'Available payment term options' })
  description?: string;

  @ApiPropertyOptional({ example: 'خيارات شروط الدفع المتاحة' })
  descriptionAr?: string;

  @ApiProperty({ example: 'LC-PAYMENT-TERMS' })
  code: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isSystem: boolean;

  @ApiPropertyOptional({
    description: 'Category items',
    type: [LookupItemResponseDto],
  })
  items?: LookupItemResponseDto[];

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}
