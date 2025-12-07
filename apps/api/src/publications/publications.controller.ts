import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { createReadStream, existsSync } from 'fs';
import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
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
import { PublicationsService } from './publications.service';
import {
  CreatePublicationCategoryDto,
  UpdatePublicationCategoryDto,
  CreatePublicationDto,
  UpdatePublicationDto,
  CreatePublicationPurchaseDto,
  PublicationResponseDto,
  PublicationCategoryResponseDto,
  PublicationPurchaseResponseDto,
} from './dto';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards';
import { RequirePermissions, Public, CurrentUser } from '../common/decorators';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  ConflictResponseDto,
  ErrorResponseDto,
  DeleteResponseDto,
} from '../common/dto';
import { PublicationType, PublicationStatus } from '@prisma/client';

// Multer config for PDF uploads
const pdfStorage = diskStorage({
  destination: './uploads/publications',
  filename: (req, file, callback) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});

const coverStorage = diskStorage({
  destination: './uploads/publications/covers',
  filename: (req, file, callback) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});

const previewStorage = diskStorage({
  destination: './uploads/publications/previews',
  filename: (req, file, callback) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});

@ApiTags('Publications - النشر الرقمي')
@Controller('publications')
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  // ============================================
  // CATEGORIES (Admin)
  // ============================================

  @Post('categories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('publications:create')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create publication category',
    description: 'Create a new publication category. **Required Permission:** `publications:create`',
  })
  @ApiBody({ type: CreatePublicationCategoryDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: PublicationCategoryResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ConflictResponseDto })
  createCategory(@Body() dto: CreatePublicationCategoryDto) {
    return this.publicationsService.createCategory(dto);
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Get all publication categories' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: HttpStatus.OK, type: [PublicationCategoryResponseDto] })
  findAllCategories(@Query('includeInactive') includeInactive?: string) {
    return this.publicationsService.findAllCategories(includeInactive === 'true');
  }

  @Get('categories/:id')
  @Public()
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: PublicationCategoryResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  findCategoryById(@Param('id') id: string) {
    return this.publicationsService.findCategoryById(id);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('publications:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update publication category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiBody({ type: UpdatePublicationCategoryDto })
  @ApiResponse({ status: HttpStatus.OK, type: PublicationCategoryResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  updateCategory(@Param('id') id: string, @Body() dto: UpdatePublicationCategoryDto) {
    return this.publicationsService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('publications:delete')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete publication category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: DeleteResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  deleteCategory(@Param('id') id: string) {
    return this.publicationsService.deleteCategory(id);
  }

  // ============================================
  // PUBLICATIONS (Admin CRUD)
  // ============================================

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('publications:create')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create publication',
    description: `
Create a new publication (code, specification, guide, etc.).

**Required Permission:** \`publications:create\`

**Notes:**
- File upload is done separately after creation
- Publication starts in DRAFT status by default
    `,
  })
  @ApiBody({ type: CreatePublicationDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: PublicationResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ConflictResponseDto })
  createPublication(@Body() dto: CreatePublicationDto, @CurrentUser('id') userId: string) {
    return this.publicationsService.createPublication(dto, userId);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all publications with filtering' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'type', required: false, enum: PublicationType })
  @ApiQuery({ name: 'status', required: false, enum: PublicationStatus })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, description: 'Search in title, code, keywords' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: HttpStatus.OK, type: [PublicationResponseDto] })
  findAllPublications(
    @Query('categoryId') categoryId?: string,
    @Query('type') type?: PublicationType,
    @Query('status') status?: PublicationStatus,
    @Query('isActive') isActive?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.publicationsService.findAllPublications({
      categoryId,
      type,
      status,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      isFeatured: isFeatured !== undefined ? isFeatured === 'true' : undefined,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('publications:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get publications statistics (Admin)' })
  @ApiResponse({ status: HttpStatus.OK })
  getStats() {
    return this.publicationsService.getStats();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get publication by ID' })
  @ApiParam({ name: 'id', description: 'Publication UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: PublicationResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  async findPublicationById(@Param('id') id: string) {
    const publication = await this.publicationsService.findPublicationById(id);
    // Increment view count
    await this.publicationsService.incrementViewCount(id);
    return publication;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('publications:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update publication' })
  @ApiParam({ name: 'id', description: 'Publication UUID' })
  @ApiBody({ type: UpdatePublicationDto })
  @ApiResponse({ status: HttpStatus.OK, type: PublicationResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  updatePublication(@Param('id') id: string, @Body() dto: UpdatePublicationDto) {
    return this.publicationsService.updatePublication(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('publications:delete')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete publication' })
  @ApiParam({ name: 'id', description: 'Publication UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: DeleteResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  deletePublication(@Param('id') id: string) {
    return this.publicationsService.deletePublication(id);
  }

  // ============================================
  // FILE UPLOADS (Admin)
  // ============================================

  @Post(':id/upload-pdf')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('publications:update')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', { storage: pdfStorage }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload PDF file for publication' })
  @ApiParam({ name: 'id', description: 'Publication UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'PDF file' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, type: PublicationResponseDto })
  async uploadPdf(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const filePath = `/uploads/publications/${file.filename}`;
    return this.publicationsService.updatePublicationFile(id, filePath, file.size);
  }

  @Post(':id/upload-cover')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('publications:update')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', { storage: coverStorage }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload cover image for publication' })
  @ApiParam({ name: 'id', description: 'Publication UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Image file (JPG, PNG)' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, type: PublicationResponseDto })
  async uploadCover(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const coverPath = `/uploads/publications/covers/${file.filename}`;
    return this.publicationsService.updatePublicationCover(id, coverPath);
  }

  @Post(':id/upload-preview')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('publications:update')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', { storage: previewStorage }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload preview PDF for publication' })
  @ApiParam({ name: 'id', description: 'Publication UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Preview PDF file' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, type: PublicationResponseDto })
  async uploadPreview(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const previewPath = `/uploads/publications/previews/${file.filename}`;
    return this.publicationsService.updatePublicationPreview(id, previewPath);
  }

  // ============================================
  // PURCHASES (Customer)
  // ============================================

  @Post('purchases')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create purchase (Customer)',
    description: 'Create a new publication purchase. Returns purchase details for payment.',
  })
  @ApiBody({ type: CreatePublicationPurchaseDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: PublicationPurchaseResponseDto })
  createPurchase(@Body() dto: CreatePublicationPurchaseDto, @CurrentUser('id') userId: string) {
    return this.publicationsService.createPurchase(dto, userId);
  }

  @Get('purchases/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my purchases (Customer)' })
  @ApiResponse({ status: HttpStatus.OK, type: [PublicationPurchaseResponseDto] })
  getMyPurchases(@CurrentUser('id') userId: string) {
    return this.publicationsService.findPurchasesByCustomer(userId);
  }

  @Get('purchases/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get purchase by ID' })
  @ApiParam({ name: 'id', description: 'Purchase UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: PublicationPurchaseResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  getPurchaseById(@Param('id') id: string, @CurrentUser('id') userId: string) {
    // For customers, only show their own purchases
    // Admins can see all (check in service if needed)
    return this.publicationsService.findPurchaseById(id, userId);
  }

  @Post('purchases/:id/mark-paid')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('publications:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark purchase as paid (Admin)' })
  @ApiParam({ name: 'id', description: 'Purchase UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string', description: 'Payment transaction ID' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, type: PublicationPurchaseResponseDto })
  markPurchaseAsPaid(@Param('id') id: string, @Body('paymentId') paymentId: string) {
    return this.publicationsService.markPurchaseAsPaid(id, paymentId);
  }

  @Get('purchases/:id/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download purchased publication' })
  @ApiParam({ name: 'id', description: 'Purchase UUID' })
  async downloadPublication(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const purchase = await this.publicationsService.findPurchaseById(id, userId);

    // This will throw if download limit reached or expired
    await this.publicationsService.incrementDownloadCount(id, userId);

    const filePath = join(process.cwd(), purchase.publication.filePath);

    if (!existsSync(filePath)) {
      throw new Error('File not found');
    }

    const file = createReadStream(filePath);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${purchase.publication.code}.pdf"`,
    });

    return new StreamableFile(file);
  }
}
