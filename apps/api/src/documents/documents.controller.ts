import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
  Query,
  Request,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../config';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import {
  UploadDocumentDto,
  UpdateDocumentDto,
  DocumentResponseDto,
} from './dto';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards';
import { RequirePermissions } from '../common/decorators';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  ErrorResponseDto,
  DeleteResponseDto,
} from '../common/dto';
import { DocumentType } from '@prisma/client';
import { createReadStream } from 'fs';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('documents:create')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a new document',
    description: `
Upload a document file to the system.

**Required Permission:** \`documents:create\`

**Notes:**
- Maximum file size: 10MB
- Supported file types: PDF, images, videos, etc.
- Files are stored securely on the server
- Metadata is extracted and stored in database
- Uploader information is automatically captured from JWT token
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'type'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload',
        },
        title: {
          type: 'string',
          example: 'Contract Agreement',
          description: 'Document title (English)',
        },
        titleAr: {
          type: 'string',
          example: 'اتفاقية تعاقد',
          description: 'Document title (Arabic)',
        },
        description: {
          type: 'string',
          example: 'Service contract for concrete testing',
        },
        descriptionAr: {
          type: 'string',
          example: 'عقد خدمة اختبار الخرسانة',
        },
        type: {
          type: 'string',
          enum: Object.values(DocumentType),
          example: DocumentType.CONTRACT,
          description: 'Document type',
        },
        requestId: {
          type: 'string',
          example: '550e8400-e29b-41d4-a716-446655440000',
          description: 'Service request ID to link document to',
        },
        isPublic: {
          type: 'boolean',
          example: false,
          description: 'Whether the document is publicly accessible',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document uploaded successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or file size exceeds limit',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires documents:create)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service request not found',
    type: NotFoundResponseDto,
  })
  async upload(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDocumentDto: UploadDocumentDto,
  ) {
    const userId = req.user.sub;
    const userType = req.user.type; // 'customer' or 'employee'

    return this.documentsService.upload(file, uploadDocumentDto, userId, userType);
  }

  @Get()
  @RequirePermissions('documents:read')
  @ApiOperation({
    summary: 'Get all documents',
    description: `
Retrieve a list of all documents with optional filters.

**Required Permission:** \`documents:read\`

**Optional Filters:**
- Service Request ID
- Document Type
- Uploader ID

**Returns:**
- Documents ordered by upload date (newest first)
- Includes request details if linked
    `,
  })
  @ApiQuery({
    name: 'requestId',
    required: false,
    description: 'Filter by service request ID',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: DocumentType,
    description: 'Filter by document type',
  })
  @ApiQuery({
    name: 'uploadedById',
    required: false,
    description: 'Filter by uploader ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documents list retrieved successfully',
    type: [DocumentResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires documents:read)',
    type: ForbiddenResponseDto,
  })
  findAll(
    @Query('requestId') requestId?: string,
    @Query('type') type?: DocumentType,
    @Query('uploadedById') uploadedById?: string,
  ) {
    return this.documentsService.findAll({ requestId, type, uploadedById });
  }

  @Get('stats')
  @RequirePermissions('documents:read')
  @ApiOperation({
    summary: 'Get document statistics',
    description: `
Retrieve statistical information about documents.

**Required Permission:** \`documents:read\`

**Returns:**
- Total number of documents
- Documents count by type
- Total storage size used
- Average document size
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 150 },
        byType: {
          type: 'object',
          example: {
            CONTRACT: 30,
            CERTIFICATE: 40,
            REPORT: 25,
            INVOICE_PDF: 20,
            PHOTO: 15,
            OTHER: 20,
          },
        },
        totalSize: { type: 'number', example: 52428800 },
        averageSize: { type: 'number', example: 349525 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires documents:read)',
    type: ForbiddenResponseDto,
  })
  getStats() {
    return this.documentsService.getDocumentStats();
  }

  @Get(':id')
  @RequirePermissions('documents:read')
  @ApiOperation({
    summary: 'Get document by ID',
    description: `
Retrieve a specific document metadata by its UUID.

**Required Permission:** \`documents:read\`

**Note:** This returns metadata only, not the file itself. Use /documents/:id/download to get the file.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Document UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document retrieved successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires documents:read)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
    type: NotFoundResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/download')
  @RequirePermissions('documents:read')
  @ApiOperation({
    summary: 'Download a document file',
    description: `
Download the actual file of a document.

**Required Permission:** \`documents:read\`

**Access Control:**
- Public documents: Anyone with read permission
- Private documents: Only uploader or assigned employee

**Notes:**
- Download count is incremented automatically
- File is streamed for efficient transfer
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Document UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File download started',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied to this document',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document or file not found',
    type: NotFoundResponseDto,
  })
  async download(@Param('id') id: string, @Request() req, @Res() res: Response) {
    const userId = req.user.sub;
    const userType = req.user.type;

    const { filepath, filename, mimetype } = await this.documentsService.download(
      id,
      userId,
      userType,
    );

    const file = createReadStream(filepath);

    res.set({
      'Content-Type': mimetype,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    file.pipe(res);
  }

  @Patch(':id')
  @RequirePermissions('documents:update')
  @ApiOperation({
    summary: 'Update document metadata',
    description: `
Update document metadata (title, description, type, etc.).

**Required Permission:** \`documents:update\`

**Notes:**
- Only metadata can be updated, not the file itself
- All fields are optional
- Only provided fields will be updated
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Document UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateDocumentDto,
    description: 'Document update data',
    examples: {
      updateTitle: {
        summary: 'Update title',
        value: {
          title: 'Updated Contract',
          titleAr: 'عقد محدث',
        },
      },
      updateType: {
        summary: 'Update type',
        value: {
          type: 'CERTIFICATE',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document updated successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires documents:update)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
    type: NotFoundResponseDto,
  })
  update(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('documents:delete')
  @ApiOperation({
    summary: 'Delete a document',
    description: `
Permanently delete a document and its file from the system.

**Required Permission:** \`documents:delete\`

**Warning:**
- This action is irreversible
- Both file and metadata are deleted
- Only uploader or employee can delete
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Document UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document deleted successfully',
    type: DeleteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only uploader can delete document',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
    type: NotFoundResponseDto,
  })
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.sub;
    const userType = req.user.type;

    return this.documentsService.remove(id, userId, userType);
  }
}
