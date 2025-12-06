import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { ServiceCategory } from '@prisma/client';

export class CreateTestTypeDto {
  @ApiProperty({
    example: 'Concrete Compression Test',
    description: 'Test type name in English',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'اختبار مقاومة الضغط للخرسانة',
    description: 'Test type name in Arabic',
  })
  @IsString()
  @MaxLength(255)
  nameAr: string;

  @ApiPropertyOptional({
    example: 'Measures the compressive strength of concrete specimens',
    description: 'Test type description in English',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'يقيس مقاومة الضغط لعينات الخرسانة',
    description: 'Test type description in Arabic',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiProperty({
    example: 'TT-001',
    description: 'Unique test type code',
  })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    enum: ServiceCategory,
    example: ServiceCategory.CONCRETE_TESTING,
    description: 'Service category this test type belongs to',
  })
  @IsEnum(ServiceCategory)
  category: ServiceCategory;

  @ApiPropertyOptional({
    example: 250.0,
    description: 'Base price for this test type in EGP',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  basePrice?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this test type is active',
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

export class UpdateTestTypeDto extends PartialType(CreateTestTypeDto) {}

export class TestTypeResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Test type unique identifier',
  })
  id: string;

  @ApiProperty({ example: 'Concrete Compression Test' })
  name: string;

  @ApiProperty({ example: 'اختبار مقاومة الضغط للخرسانة' })
  nameAr: string;

  @ApiPropertyOptional({ example: 'Measures the compressive strength' })
  description?: string;

  @ApiPropertyOptional({ example: 'يقيس مقاومة الضغط' })
  descriptionAr?: string;

  @ApiProperty({ example: 'TT-001' })
  code: string;

  @ApiProperty({ enum: ServiceCategory, example: ServiceCategory.CONCRETE_TESTING })
  category: ServiceCategory;

  @ApiPropertyOptional({ example: 250.0 })
  basePrice?: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}
