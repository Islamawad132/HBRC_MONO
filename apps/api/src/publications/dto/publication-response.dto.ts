import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublicationType, PublicationStatus } from '@prisma/client';
import { PublicationCategoryResponseDto } from './publication-category-response.dto';

export class PublicationResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Egyptian Code for Design and Construction of Concrete Structures' })
  title: string;

  @ApiProperty({ example: 'الكود المصري لتصميم وتنفيذ المنشآت الخرسانية' })
  titleAr: string;

  @ApiPropertyOptional({ example: 'Comprehensive guide for concrete structure design' })
  description?: string;

  @ApiPropertyOptional({ example: 'دليل شامل لتصميم المنشآت الخرسانية' })
  descriptionAr?: string;

  @ApiPropertyOptional({ example: 'concrete, construction, building' })
  keywords?: string;

  @ApiProperty({ enum: PublicationType, example: PublicationType.CODE })
  type: PublicationType;

  @ApiProperty({ example: 'ECP-203' })
  code: string;

  @ApiPropertyOptional({ example: '1' })
  partNumber?: string;

  @ApiPropertyOptional({ example: 'Design Requirements' })
  partName?: string;

  @ApiPropertyOptional({ example: 'متطلبات التصميم' })
  partNameAr?: string;

  @ApiProperty({ example: 3 })
  editionNumber: number;

  @ApiPropertyOptional({ example: 2020 })
  editionYear?: number;

  @ApiPropertyOptional({ example: '2020-01-01T00:00:00.000Z' })
  editionDate?: Date;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  categoryId: string;

  @ApiPropertyOptional({ type: () => PublicationCategoryResponseDto })
  category?: PublicationCategoryResponseDto;

  @ApiPropertyOptional({ example: '/uploads/publications/ecp-203.pdf' })
  filePath?: string;

  @ApiPropertyOptional({ example: 5242880 })
  fileSize?: number;

  @ApiPropertyOptional({ example: 250 })
  pageCount?: number;

  @ApiPropertyOptional({ example: '/uploads/publications/previews/ecp-203-preview.pdf' })
  previewPath?: string;

  @ApiPropertyOptional({ example: '/uploads/publications/covers/ecp-203.jpg' })
  coverImage?: string;

  @ApiProperty({ example: 500.0 })
  price: number;

  @ApiPropertyOptional({ example: 100.0 })
  partPrice?: number;

  @ApiPropertyOptional({ example: 50.0 })
  viewPrice?: number;

  @ApiPropertyOptional({ example: 750.0 })
  physicalPrice?: number;

  @ApiProperty({ example: 'EGP' })
  currency: string;

  @ApiProperty({ enum: PublicationStatus, example: PublicationStatus.PUBLISHED })
  status: PublicationStatus;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isFeatured: boolean;

  @ApiProperty({ example: 150 })
  viewCount: number;

  @ApiProperty({ example: 45 })
  downloadCount: number;

  @ApiProperty({ example: 30 })
  purchaseCount: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}
