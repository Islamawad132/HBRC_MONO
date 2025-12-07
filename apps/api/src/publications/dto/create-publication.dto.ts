import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsUUID,
  IsNumber,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PublicationType, PublicationStatus } from '@prisma/client';

export class CreatePublicationDto {
  @ApiProperty({
    example: 'Egyptian Code for Design and Construction of Concrete Structures',
    description: 'Publication title in English',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'الكود المصري لتصميم وتنفيذ المنشآت الخرسانية',
    description: 'Publication title in Arabic',
  })
  @IsString()
  titleAr: string;

  @ApiPropertyOptional({
    example: 'Comprehensive guide for concrete structure design',
    description: 'Publication description in English',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'دليل شامل لتصميم المنشآت الخرسانية',
    description: 'Publication description in Arabic',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiPropertyOptional({
    example: 'concrete, construction, building, Egyptian code',
    description: 'Keywords for search (comma separated)',
  })
  @IsString()
  @IsOptional()
  keywords?: string;

  @ApiProperty({
    enum: PublicationType,
    example: PublicationType.CODE,
    description: 'Type of publication',
  })
  @IsEnum(PublicationType)
  type: PublicationType;

  @ApiProperty({
    example: 'ECP-203',
    description: 'Unique publication code',
  })
  @IsString()
  code: string;

  @ApiPropertyOptional({
    example: '1',
    description: 'Part number if applicable',
  })
  @IsString()
  @IsOptional()
  partNumber?: string;

  @ApiPropertyOptional({
    example: 'Design Requirements',
    description: 'Part name in English',
  })
  @IsString()
  @IsOptional()
  partName?: string;

  @ApiPropertyOptional({
    example: 'متطلبات التصميم',
    description: 'Part name in Arabic',
  })
  @IsString()
  @IsOptional()
  partNameAr?: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'Edition number',
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  editionNumber?: number;

  @ApiPropertyOptional({
    example: 2020,
    description: 'Edition year',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  editionYear?: number;

  @ApiPropertyOptional({
    example: '2020-01-01T00:00:00.000Z',
    description: 'Edition date',
  })
  @IsDateString()
  @IsOptional()
  editionDate?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Category ID',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    example: 500.0,
    description: 'Full download price in EGP',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: 100.0,
    description: 'Part download price in EGP',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  partPrice?: number;

  @ApiPropertyOptional({
    example: 50.0,
    description: 'View only price in EGP',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  viewPrice?: number;

  @ApiPropertyOptional({
    example: 750.0,
    description: 'Physical copy price in EGP',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  physicalPrice?: number;

  @ApiPropertyOptional({
    example: 'EGP',
    description: 'Currency code',
    default: 'EGP',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    enum: PublicationStatus,
    example: PublicationStatus.DRAFT,
    description: 'Publication status',
    default: PublicationStatus.DRAFT,
  })
  @IsEnum(PublicationStatus)
  @IsOptional()
  status?: PublicationStatus;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the publication is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether to feature on homepage',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    example: 250,
    description: 'Number of pages',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  pageCount?: number;
}
