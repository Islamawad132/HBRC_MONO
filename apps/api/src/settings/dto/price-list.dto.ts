import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDate,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceCategory } from '@prisma/client';

// Price List Item DTOs
export class CreatePriceListItemDto {
  @ApiProperty({
    example: 'Concrete Cube Test',
    description: 'Item name in English',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'اختبار مكعب خرساني',
    description: 'Item name in Arabic',
  })
  @IsString()
  @MaxLength(255)
  nameAr: string;

  @ApiPropertyOptional({
    example: 'Testing of standard concrete cube specimen',
    description: 'Item description in English',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'اختبار عينة مكعب خرساني قياسي',
    description: 'Item description in Arabic',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiProperty({
    example: 'PLI-001',
    description: 'Item code within this price list',
  })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    example: 150.0,
    description: 'Price in EGP',
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: 'sample',
    description: 'Unit of measurement in English',
    default: 'unit',
  })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({
    example: 'عينة',
    description: 'Unit of measurement in Arabic',
    default: 'وحدة',
  })
  @IsString()
  @IsOptional()
  unitAr?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Minimum quantity',
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  minQuantity?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Maximum quantity',
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxQuantity?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this item is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 0,
    description: 'Sort order for display',
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdatePriceListItemDto extends PartialType(CreatePriceListItemDto) {}

export class PriceListItemResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  priceListId: string;

  @ApiProperty({ example: 'Concrete Cube Test' })
  name: string;

  @ApiProperty({ example: 'اختبار مكعب خرساني' })
  nameAr: string;

  @ApiPropertyOptional({ example: 'Testing of standard concrete cube specimen' })
  description?: string;

  @ApiPropertyOptional({ example: 'اختبار عينة مكعب خرساني قياسي' })
  descriptionAr?: string;

  @ApiProperty({ example: 'PLI-001' })
  code: string;

  @ApiProperty({ example: 150.0 })
  price: number;

  @ApiProperty({ example: 'sample' })
  unit: string;

  @ApiProperty({ example: 'عينة' })
  unitAr: string;

  @ApiProperty({ example: 1 })
  minQuantity: number;

  @ApiPropertyOptional({ example: 100 })
  maxQuantity?: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}

// Price List DTOs
export class CreatePriceListDto {
  @ApiProperty({
    example: 'Lab Tests 2024',
    description: 'Price list name in English',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'أسعار الاختبارات 2024',
    description: 'Price list name in Arabic',
  })
  @IsString()
  @MaxLength(255)
  nameAr: string;

  @ApiPropertyOptional({
    example: 'Price list for laboratory testing services 2024',
    description: 'Price list description in English',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'قائمة أسعار خدمات الاختبارات المعملية 2024',
    description: 'Price list description in Arabic',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiProperty({
    example: 'PL-2024-001',
    description: 'Unique price list code',
  })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    enum: ServiceCategory,
    example: ServiceCategory.LAB_TESTS,
    description: 'Service category this price list applies to',
  })
  @IsEnum(ServiceCategory)
  category: ServiceCategory;

  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Date from which this price list is valid',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  validFrom?: Date;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    description: 'Date until which this price list is valid',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  validTo?: Date;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this price list is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this is the default price list for its category',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Initial items to create with the price list',
    type: [CreatePriceListItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePriceListItemDto)
  @IsOptional()
  items?: CreatePriceListItemDto[];
}

export class UpdatePriceListDto extends PartialType(CreatePriceListDto) {}

export class PriceListResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Lab Tests 2024' })
  name: string;

  @ApiProperty({ example: 'أسعار الاختبارات 2024' })
  nameAr: string;

  @ApiPropertyOptional({ example: 'Price list for laboratory testing services 2024' })
  description?: string;

  @ApiPropertyOptional({ example: 'قائمة أسعار خدمات الاختبارات المعملية 2024' })
  descriptionAr?: string;

  @ApiProperty({ example: 'PL-2024-001' })
  code: string;

  @ApiProperty({ enum: ServiceCategory, example: ServiceCategory.LAB_TESTS })
  category: ServiceCategory;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  validFrom: Date;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z' })
  validTo?: Date;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isDefault: boolean;

  @ApiPropertyOptional({
    description: 'Price list items',
    type: [PriceListItemResponseDto],
  })
  items?: PriceListItemResponseDto[];

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}
