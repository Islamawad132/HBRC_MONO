import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
} from 'class-validator';
import { SettingType } from '@prisma/client';

export class CreateSystemSettingDto {
  @ApiProperty({
    example: 'tax_rate',
    description: 'Unique setting key',
  })
  @IsString()
  @MaxLength(100)
  key: string;

  @ApiProperty({
    example: '14',
    description: 'Setting value (as string)',
  })
  @IsString()
  value: string;

  @ApiProperty({
    enum: SettingType,
    example: SettingType.NUMBER,
    description: 'Type of the value (for parsing)',
    default: SettingType.STRING,
  })
  @IsEnum(SettingType)
  @IsOptional()
  type?: SettingType;

  @ApiPropertyOptional({
    example: 'finance',
    description: 'Setting category',
    default: 'general',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    example: 'Tax Rate',
    description: 'Setting label in English',
  })
  @IsString()
  @MaxLength(255)
  label: string;

  @ApiProperty({
    example: 'نسبة الضريبة',
    description: 'Setting label in Arabic',
  })
  @IsString()
  @MaxLength(255)
  labelAr: string;

  @ApiPropertyOptional({
    example: 'Default tax rate percentage for invoices',
    description: 'Setting description in English',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'نسبة الضريبة الافتراضية للفواتير',
    description: 'Setting description in Arabic',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this setting is required',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiPropertyOptional({
    example: '^[0-9]+(\\.?[0-9]+)?$',
    description: 'Regex validation rule',
  })
  @IsString()
  @IsOptional()
  validationRule?: string;

  @ApiPropertyOptional({
    example: 'number',
    description: 'Input type for UI (text, number, toggle, select, textarea)',
    default: 'text',
  })
  @IsString()
  @IsOptional()
  inputType?: string;

  @ApiPropertyOptional({
    example: [
      { value: '0', label: '0%', labelAr: '0%' },
      { value: '14', label: '14%', labelAr: '14%' },
    ],
    description: 'Options for select input type',
  })
  @IsObject({ each: true })
  @IsOptional()
  options?: Array<{ value: string; label: string; labelAr: string }>;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this is a system setting (cannot be deleted)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this setting is publicly accessible',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateSystemSettingDto {
  @ApiProperty({
    example: '14',
    description: 'New setting value (as string)',
  })
  @IsString()
  value: string;

  @ApiPropertyOptional({
    example: 'Tax Rate',
    description: 'Setting label in English',
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({
    example: 'نسبة الضريبة',
    description: 'Setting label in Arabic',
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  labelAr?: string;

  @ApiPropertyOptional({
    example: 'Default tax rate percentage for invoices',
    description: 'Setting description in English',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'نسبة الضريبة الافتراضية للفواتير',
    description: 'Setting description in Arabic',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiPropertyOptional({
    example: 'number',
    description: 'Input type for UI',
  })
  @IsString()
  @IsOptional()
  inputType?: string;

  @ApiPropertyOptional({
    description: 'Options for select input type',
  })
  @IsObject({ each: true })
  @IsOptional()
  options?: Array<{ value: string; label: string; labelAr: string }>;
}

export class SystemSettingResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'tax_rate' })
  key: string;

  @ApiProperty({ example: '14' })
  value: string;

  @ApiProperty({ enum: SettingType, example: SettingType.NUMBER })
  type: SettingType;

  @ApiProperty({ example: 'finance' })
  category: string;

  @ApiProperty({ example: 'Tax Rate' })
  label: string;

  @ApiProperty({ example: 'نسبة الضريبة' })
  labelAr: string;

  @ApiPropertyOptional({ example: 'Default tax rate percentage for invoices' })
  description?: string;

  @ApiPropertyOptional({ example: 'نسبة الضريبة الافتراضية للفواتير' })
  descriptionAr?: string;

  @ApiProperty({ example: false })
  isRequired: boolean;

  @ApiPropertyOptional({ example: '^[0-9]+(\\.?[0-9]+)?$' })
  validationRule?: string;

  @ApiProperty({ example: 'number' })
  inputType: string;

  @ApiPropertyOptional()
  options?: Array<{ value: string; label: string; labelAr: string }>;

  @ApiProperty({ example: false })
  isSystem: boolean;

  @ApiProperty({ example: false })
  isPublic: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}

export class BulkUpdateSettingsDto {
  @ApiProperty({
    description: 'Array of setting key-value pairs to update',
    example: [
      { key: 'tax_rate', value: '14' },
      { key: 'company_name', value: 'HBRC' },
    ],
  })
  settings: Array<{ key: string; value: string }>;
}
