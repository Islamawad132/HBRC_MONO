import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, Min, IsUUID } from 'class-validator';

export class CreatePublicationCategoryDto {
  @ApiProperty({
    example: 'Building Codes',
    description: 'Category name in English',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'أكواد البناء',
    description: 'Category name in Arabic',
  })
  @IsString()
  nameAr: string;

  @ApiPropertyOptional({
    example: 'Egyptian building codes and standards',
    description: 'Category description in English',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'الأكواد والمواصفات المصرية للبناء',
    description: 'Category description in Arabic',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Parent category ID for subcategories',
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiProperty({
    example: 'CAT-001',
    description: 'Unique category code',
  })
  @IsString()
  code: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Sort order for display',
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the category is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
