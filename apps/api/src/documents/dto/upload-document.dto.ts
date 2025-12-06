import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class UploadDocumentDto {
  @ApiPropertyOptional({
    example: 'Contract Agreement',
    description: 'Document title (English)',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'اتفاقية تعاقد',
    description: 'Document title (Arabic)',
  })
  @IsString()
  @IsOptional()
  titleAr?: string;

  @ApiPropertyOptional({
    example: 'Service contract for concrete testing',
    description: 'Document description (English)',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'عقد خدمة اختبار الخرسانة',
    description: 'Document description (Arabic)',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiProperty({
    enum: DocumentType,
    example: DocumentType.CONTRACT,
    description: 'Type of document',
  })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Service request ID to link document to',
  })
  @IsUUID()
  @IsOptional()
  requestId?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the document is publicly accessible',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
