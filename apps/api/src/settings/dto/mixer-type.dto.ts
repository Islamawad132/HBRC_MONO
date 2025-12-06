import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateMixerTypeDto {
  @ApiProperty({
    example: 'Mobile Mixer 10m³',
    description: 'Mixer type name in English',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'خلاطة متنقلة 10م³',
    description: 'Mixer type name in Arabic',
  })
  @IsString()
  @MaxLength(255)
  nameAr: string;

  @ApiPropertyOptional({
    example: 'Standard mobile concrete mixer with 10 cubic meter capacity',
    description: 'Description in English',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'خلاطة خرسانة متنقلة قياسية بسعة 10 متر مكعب',
    description: 'Description in Arabic',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiProperty({
    example: 'MT-001',
    description: 'Unique mixer type code',
  })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({
    example: 10.0,
    description: 'Mixer capacity',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({
    example: 'm³',
    description: 'Capacity unit in English',
    default: 'm³',
  })
  @IsString()
  @IsOptional()
  capacityUnit?: string;

  @ApiPropertyOptional({
    example: 'م³',
    description: 'Capacity unit in Arabic',
    default: 'م³',
  })
  @IsString()
  @IsOptional()
  capacityUnitAr?: string;

  @ApiPropertyOptional({
    example: 1500.0,
    description: 'Price per batch in EGP',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerBatch?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this mixer type is active',
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

export class UpdateMixerTypeDto extends PartialType(CreateMixerTypeDto) {}

export class MixerTypeResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Mixer type unique identifier',
  })
  id: string;

  @ApiProperty({ example: 'Mobile Mixer 10m³' })
  name: string;

  @ApiProperty({ example: 'خلاطة متنقلة 10م³' })
  nameAr: string;

  @ApiPropertyOptional({ example: 'Standard mobile concrete mixer' })
  description?: string;

  @ApiPropertyOptional({ example: 'خلاطة خرسانة متنقلة قياسية' })
  descriptionAr?: string;

  @ApiProperty({ example: 'MT-001' })
  code: string;

  @ApiPropertyOptional({ example: 10.0 })
  capacity?: number;

  @ApiProperty({ example: 'm³' })
  capacityUnit: string;

  @ApiProperty({ example: 'م³' })
  capacityUnitAr: string;

  @ApiPropertyOptional({ example: 1500.0 })
  pricePerBatch?: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}
