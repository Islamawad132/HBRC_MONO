import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateSampleTypeDto {
  @ApiProperty({
    example: 'Concrete Cube 150mm',
    description: 'Sample type name in English',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'مكعب خرساني 150 مم',
    description: 'Sample type name in Arabic',
  })
  @IsString()
  @MaxLength(255)
  nameAr: string;

  @ApiPropertyOptional({
    example: 'Standard 150mm concrete cube specimen',
    description: 'Sample type description in English',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'عينة مكعب خرساني قياسي 150 مم',
    description: 'Sample type description in Arabic',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiProperty({
    example: 'ST-001',
    description: 'Unique sample type code',
  })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the related test type',
  })
  @IsUUID()
  testTypeId: string;

  @ApiPropertyOptional({
    example: 'sample',
    description: 'Unit of measurement in English',
    default: 'sample',
  })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({
    example: 'عينة',
    description: 'Unit of measurement in Arabic',
    default: 'عينة',
  })
  @IsString()
  @IsOptional()
  unitAr?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Minimum quantity required',
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  minQuantity?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Maximum quantity allowed',
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxQuantity?: number;

  @ApiPropertyOptional({
    example: 50.0,
    description: 'Price per unit in EGP',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerUnit?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this sample type is active',
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

export class UpdateSampleTypeDto extends PartialType(CreateSampleTypeDto) {}

export class SampleTypeResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Sample type unique identifier',
  })
  id: string;

  @ApiProperty({ example: 'Concrete Cube 150mm' })
  name: string;

  @ApiProperty({ example: 'مكعب خرساني 150 مم' })
  nameAr: string;

  @ApiPropertyOptional({ example: 'Standard 150mm concrete cube specimen' })
  description?: string;

  @ApiPropertyOptional({ example: 'عينة مكعب خرساني قياسي 150 مم' })
  descriptionAr?: string;

  @ApiProperty({ example: 'ST-001' })
  code: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  testTypeId: string;

  @ApiProperty({ example: 'sample' })
  unit: string;

  @ApiProperty({ example: 'عينة' })
  unitAr: string;

  @ApiProperty({ example: 1 })
  minQuantity: number;

  @ApiPropertyOptional({ example: 100 })
  maxQuantity?: number;

  @ApiPropertyOptional({ example: 50.0 })
  pricePerUnit?: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}
