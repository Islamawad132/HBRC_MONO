import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicationCategoryResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Building Codes' })
  name: string;

  @ApiProperty({ example: 'أكواد البناء' })
  nameAr: string;

  @ApiPropertyOptional({ example: 'Egyptian building codes and standards' })
  description?: string;

  @ApiPropertyOptional({ example: 'الأكواد والمواصفات المصرية للبناء' })
  descriptionAr?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  parentId?: string;

  @ApiProperty({ example: 'CAT-001' })
  code: string;

  @ApiProperty({ example: 1 })
  sortOrder: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Child categories',
    type: () => [PublicationCategoryResponseDto],
  })
  children?: PublicationCategoryResponseDto[];

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}
