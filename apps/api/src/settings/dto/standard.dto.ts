import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { StandardType } from '@prisma/client';

export class CreateStandardDto {
  @ApiProperty({
    example: 'ES 1658-2',
    description: 'Standard name/number in English',
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'م.ق.م 1658-2',
    description: 'Standard name/number in Arabic',
  })
  @IsString()
  @MaxLength(100)
  nameAr: string;

  @ApiProperty({
    example: 'Concrete Compressive Strength Test Method',
    description: 'Full standard title in English',
  })
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiProperty({
    example: 'طريقة اختبار مقاومة الضغط للخرسانة',
    description: 'Full standard title in Arabic',
  })
  @IsString()
  @MaxLength(500)
  titleAr: string;

  @ApiPropertyOptional({
    example: 'Specifies the method for determining compressive strength',
    description: 'Standard description in English',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'تحدد الطريقة المتبعة لتحديد مقاومة الضغط',
    description: 'Standard description in Arabic',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiProperty({
    example: 'STD-001',
    description: 'Unique standard code',
  })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    enum: StandardType,
    example: StandardType.EGYPTIAN,
    description: 'Type of standard (Egyptian, British, ASTM, etc.)',
    default: StandardType.EGYPTIAN,
  })
  @IsEnum(StandardType)
  @IsOptional()
  type?: StandardType;

  @ApiPropertyOptional({
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    description: 'Array of test type IDs this standard applies to',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  testTypeIds?: string[];

  @ApiPropertyOptional({
    example: 'https://example.com/standard.pdf',
    description: 'URL to the standard document',
  })
  @IsString()
  @IsOptional()
  documentUrl?: string;

  @ApiPropertyOptional({
    example: '2021',
    description: 'Version of the standard',
  })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({
    example: 2021,
    description: 'Year the standard was published',
  })
  @IsNumber()
  @IsOptional()
  publishedYear?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this standard is active',
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

export class UpdateStandardDto extends PartialType(CreateStandardDto) {}

export class StandardResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Standard unique identifier',
  })
  id: string;

  @ApiProperty({ example: 'ES 1658-2' })
  name: string;

  @ApiProperty({ example: 'م.ق.م 1658-2' })
  nameAr: string;

  @ApiProperty({ example: 'Concrete Compressive Strength Test Method' })
  title: string;

  @ApiProperty({ example: 'طريقة اختبار مقاومة الضغط للخرسانة' })
  titleAr: string;

  @ApiPropertyOptional({ example: 'Specifies the method for determining compressive strength' })
  description?: string;

  @ApiPropertyOptional({ example: 'تحدد الطريقة المتبعة لتحديد مقاومة الضغط' })
  descriptionAr?: string;

  @ApiProperty({ example: 'STD-001' })
  code: string;

  @ApiProperty({ enum: StandardType, example: StandardType.EGYPTIAN })
  type: StandardType;

  @ApiPropertyOptional({ example: 'https://example.com/standard.pdf' })
  documentUrl?: string;

  @ApiPropertyOptional({ example: '2021' })
  version?: string;

  @ApiPropertyOptional({ example: 2021 })
  publishedYear?: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}
