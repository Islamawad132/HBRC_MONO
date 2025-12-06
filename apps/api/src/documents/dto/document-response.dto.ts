import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';

export class DocumentResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Document unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'contract.pdf',
    description: 'Original filename',
  })
  filename: string;

  @ApiProperty({
    example: '1701234567890-contract.pdf',
    description: 'Stored filename (unique)',
  })
  storedFilename: string;

  @ApiProperty({
    example: 'uploads/documents/1701234567890-contract.pdf',
    description: 'File path',
  })
  filepath: string;

  @ApiProperty({
    example: 'application/pdf',
    description: 'File MIME type',
  })
  mimetype: string;

  @ApiProperty({
    example: 1048576,
    description: 'File size in bytes',
  })
  size: number;

  @ApiPropertyOptional({
    example: 'Service Contract',
    description: 'Document title (English)',
  })
  title?: string;

  @ApiPropertyOptional({
    example: 'عقد الخدمة',
    description: 'Document title (Arabic)',
  })
  titleAr?: string;

  @ApiPropertyOptional({
    example: 'Contract for concrete testing services',
    description: 'Document description (English)',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'عقد لخدمات اختبار الخرسانة',
    description: 'Document description (Arabic)',
  })
  descriptionAr?: string;

  @ApiProperty({
    enum: DocumentType,
    example: DocumentType.CONTRACT,
    description: 'Document type',
  })
  type: DocumentType;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Related service request ID',
  })
  requestId?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'Uploader ID (customer or employee)',
  })
  uploadedById: string;

  @ApiProperty({
    example: 'customer',
    description: 'Uploader type',
  })
  uploadedByType: string;

  @ApiProperty({
    example: false,
    description: 'Is document publicly accessible',
  })
  isPublic: boolean;

  @ApiProperty({
    example: 5,
    description: 'Number of times downloaded',
  })
  downloadCount: number;

  @ApiPropertyOptional({
    example: '2024-01-15T14:30:00.000Z',
    description: 'Last download timestamp',
  })
  lastDownloadAt?: Date;

  @ApiProperty({
    example: '2024-01-15T10:00:00.000Z',
    description: 'Upload timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Related service request details',
  })
  request?: {
    id: string;
    requestNumber: string;
    title: string;
  };
}
