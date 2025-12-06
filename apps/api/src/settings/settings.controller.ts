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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards';
import { RequirePermissions, Public } from '../common/decorators';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  ConflictResponseDto,
  ErrorResponseDto,
  DeleteResponseDto,
} from '../common/dto';
import { SettingsService } from './settings.service';
import {
  // Test Types
  CreateTestTypeDto,
  UpdateTestTypeDto,
  TestTypeResponseDto,
  // Sample Types
  CreateSampleTypeDto,
  UpdateSampleTypeDto,
  SampleTypeResponseDto,
  // Standards
  CreateStandardDto,
  UpdateStandardDto,
  StandardResponseDto,
  // Price Lists
  CreatePriceListDto,
  UpdatePriceListDto,
  PriceListResponseDto,
  CreatePriceListItemDto,
  UpdatePriceListItemDto,
  PriceListItemResponseDto,
  // Distance Rates
  CreateDistanceRateDto,
  UpdateDistanceRateDto,
  DistanceRateResponseDto,
  // Mixer Types
  CreateMixerTypeDto,
  UpdateMixerTypeDto,
  MixerTypeResponseDto,
  // Lookup
  CreateLookupCategoryDto,
  UpdateLookupCategoryDto,
  LookupCategoryResponseDto,
  CreateLookupItemDto,
  UpdateLookupItemDto,
  LookupItemResponseDto,
  // System Settings
  CreateSystemSettingDto,
  UpdateSystemSettingDto,
  SystemSettingResponseDto,
  BulkUpdateSettingsDto,
} from './dto';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ============================================
  // TEST TYPES (أنواع الاختبارات)
  // ============================================

  @Post('test-types')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('settings:create')
  @ApiOperation({
    summary: 'Create a new test type',
    description: `
Create a new test type for laboratory services.

**Required Permission:** \`settings:create\`
    `,
  })
  @ApiBody({ type: CreateTestTypeDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Test type created successfully',
    type: TestTypeResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ConflictResponseDto })
  createTestType(@Body() dto: CreateTestTypeDto) {
    return this.settingsService.createTestType(dto);
  }

  @Get('test-types')
  @RequirePermissions('settings:read')
  @ApiOperation({
    summary: 'Get all test types',
    description: `
Retrieve a list of all test types with their samples and standards.

**Required Permission:** \`settings:read\`
    `,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive test types',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of test types',
    type: [TestTypeResponseDto],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenResponseDto })
  findAllTestTypes(@Query('includeInactive') includeInactive?: string) {
    return this.settingsService.findAllTestTypes(includeInactive === 'true');
  }

  @Get('test-types/:id')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get test type by ID' })
  @ApiParam({ name: 'id', description: 'Test type UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: TestTypeResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  findTestTypeById(@Param('id') id: string) {
    return this.settingsService.findTestTypeById(id);
  }

  @Patch('test-types/:id')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Update a test type' })
  @ApiParam({ name: 'id', description: 'Test type UUID' })
  @ApiBody({ type: UpdateTestTypeDto })
  @ApiResponse({ status: HttpStatus.OK, type: TestTypeResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ConflictResponseDto })
  updateTestType(@Param('id') id: string, @Body() dto: UpdateTestTypeDto) {
    return this.settingsService.updateTestType(id, dto);
  }

  @Delete('test-types/:id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('settings:delete')
  @ApiOperation({ summary: 'Delete a test type' })
  @ApiParam({ name: 'id', description: 'Test type UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: DeleteResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  deleteTestType(@Param('id') id: string) {
    return this.settingsService.deleteTestType(id);
  }

  // ============================================
  // SAMPLE TYPES (أنواع العينات)
  // ============================================

  @Post('sample-types')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('settings:create')
  @ApiOperation({
    summary: 'Create a new sample type',
    description: `
Create a new sample type linked to a test type.

**Required Permission:** \`settings:create\`
    `,
  })
  @ApiBody({ type: CreateSampleTypeDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: SampleTypeResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ConflictResponseDto })
  createSampleType(@Body() dto: CreateSampleTypeDto) {
    return this.settingsService.createSampleType(dto);
  }

  @Get('sample-types')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get all sample types' })
  @ApiQuery({ name: 'testTypeId', required: false, description: 'Filter by test type' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: HttpStatus.OK, type: [SampleTypeResponseDto] })
  findAllSampleTypes(
    @Query('testTypeId') testTypeId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.settingsService.findAllSampleTypes(testTypeId, includeInactive === 'true');
  }

  @Get('sample-types/:id')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get sample type by ID' })
  @ApiParam({ name: 'id', description: 'Sample type UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: SampleTypeResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  findSampleTypeById(@Param('id') id: string) {
    return this.settingsService.findSampleTypeById(id);
  }

  @Patch('sample-types/:id')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Update a sample type' })
  @ApiParam({ name: 'id', description: 'Sample type UUID' })
  @ApiBody({ type: UpdateSampleTypeDto })
  @ApiResponse({ status: HttpStatus.OK, type: SampleTypeResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  updateSampleType(@Param('id') id: string, @Body() dto: UpdateSampleTypeDto) {
    return this.settingsService.updateSampleType(id, dto);
  }

  @Delete('sample-types/:id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('settings:delete')
  @ApiOperation({ summary: 'Delete a sample type' })
  @ApiParam({ name: 'id', description: 'Sample type UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: DeleteResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  deleteSampleType(@Param('id') id: string) {
    return this.settingsService.deleteSampleType(id);
  }

  // ============================================
  // STANDARDS (المواصفات القياسية)
  // ============================================

  @Post('standards')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('settings:create')
  @ApiOperation({
    summary: 'Create a new standard',
    description: `
Create a new standard (Egyptian, British, ASTM, etc.).

**Required Permission:** \`settings:create\`
    `,
  })
  @ApiBody({ type: CreateStandardDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: StandardResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ConflictResponseDto })
  createStandard(@Body() dto: CreateStandardDto) {
    return this.settingsService.createStandard(dto);
  }

  @Get('standards')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get all standards' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by standard type (EGYPTIAN, BRITISH, etc.)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: HttpStatus.OK, type: [StandardResponseDto] })
  findAllStandards(
    @Query('type') type?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.settingsService.findAllStandards(type, includeInactive === 'true');
  }

  @Get('standards/:id')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get standard by ID' })
  @ApiParam({ name: 'id', description: 'Standard UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: StandardResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  findStandardById(@Param('id') id: string) {
    return this.settingsService.findStandardById(id);
  }

  @Patch('standards/:id')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Update a standard' })
  @ApiParam({ name: 'id', description: 'Standard UUID' })
  @ApiBody({ type: UpdateStandardDto })
  @ApiResponse({ status: HttpStatus.OK, type: StandardResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  updateStandard(@Param('id') id: string, @Body() dto: UpdateStandardDto) {
    return this.settingsService.updateStandard(id, dto);
  }

  @Delete('standards/:id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('settings:delete')
  @ApiOperation({ summary: 'Delete a standard' })
  @ApiParam({ name: 'id', description: 'Standard UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: DeleteResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  deleteStandard(@Param('id') id: string) {
    return this.settingsService.deleteStandard(id);
  }

  // ============================================
  // PRICE LISTS (قوائم الأسعار)
  // ============================================

  @Post('price-lists')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('settings:create')
  @ApiOperation({
    summary: 'Create a new price list',
    description: `
Create a new price list with optional initial items.

**Required Permission:** \`settings:create\`
    `,
  })
  @ApiBody({ type: CreatePriceListDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: PriceListResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ConflictResponseDto })
  createPriceList(@Body() dto: CreatePriceListDto) {
    return this.settingsService.createPriceList(dto);
  }

  @Get('price-lists')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get all price lists' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by service category' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: HttpStatus.OK, type: [PriceListResponseDto] })
  findAllPriceLists(
    @Query('category') category?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.settingsService.findAllPriceLists(category, includeInactive === 'true');
  }

  @Get('price-lists/:id')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get price list by ID' })
  @ApiParam({ name: 'id', description: 'Price list UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: PriceListResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  findPriceListById(@Param('id') id: string) {
    return this.settingsService.findPriceListById(id);
  }

  @Patch('price-lists/:id')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Update a price list' })
  @ApiParam({ name: 'id', description: 'Price list UUID' })
  @ApiBody({ type: UpdatePriceListDto })
  @ApiResponse({ status: HttpStatus.OK, type: PriceListResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  updatePriceList(@Param('id') id: string, @Body() dto: UpdatePriceListDto) {
    return this.settingsService.updatePriceList(id, dto);
  }

  @Delete('price-lists/:id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('settings:delete')
  @ApiOperation({ summary: 'Delete a price list' })
  @ApiParam({ name: 'id', description: 'Price list UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: DeleteResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  deletePriceList(@Param('id') id: string) {
    return this.settingsService.deletePriceList(id);
  }

  // Price List Items
  @Post('price-lists/:priceListId/items')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('settings:create')
  @ApiOperation({ summary: 'Add item to price list' })
  @ApiParam({ name: 'priceListId', description: 'Price list UUID' })
  @ApiBody({ type: CreatePriceListItemDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: PriceListItemResponseDto })
  addPriceListItem(
    @Param('priceListId') priceListId: string,
    @Body() dto: CreatePriceListItemDto,
  ) {
    return this.settingsService.addPriceListItem(priceListId, dto);
  }

  @Patch('price-list-items/:id')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Update a price list item' })
  @ApiParam({ name: 'id', description: 'Price list item UUID' })
  @ApiBody({ type: UpdatePriceListItemDto })
  @ApiResponse({ status: HttpStatus.OK, type: PriceListItemResponseDto })
  updatePriceListItem(@Param('id') id: string, @Body() dto: UpdatePriceListItemDto) {
    return this.settingsService.updatePriceListItem(id, dto);
  }

  @Delete('price-list-items/:id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('settings:delete')
  @ApiOperation({ summary: 'Delete a price list item' })
  @ApiParam({ name: 'id', description: 'Price list item UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: DeleteResponseDto })
  deletePriceListItem(@Param('id') id: string) {
    return this.settingsService.deletePriceListItem(id);
  }

  // ============================================
  // DISTANCE RATES (أسعار المسافات)
  // ============================================

  @Post('distance-rates')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('settings:create')
  @ApiOperation({
    summary: 'Create a new distance rate',
    description: `
Create a new distance rate for transport pricing.

**Required Permission:** \`settings:create\`

**Notes:**
- Distance ranges cannot overlap
- fromKm must be less than toKm
    `,
  })
  @ApiBody({ type: CreateDistanceRateDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: DistanceRateResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ConflictResponseDto })
  createDistanceRate(@Body() dto: CreateDistanceRateDto) {
    return this.settingsService.createDistanceRate(dto);
  }

  @Get('distance-rates')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get all distance rates' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: HttpStatus.OK, type: [DistanceRateResponseDto] })
  findAllDistanceRates(@Query('includeInactive') includeInactive?: string) {
    return this.settingsService.findAllDistanceRates(includeInactive === 'true');
  }

  @Get('distance-rates/:id')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get distance rate by ID' })
  @ApiParam({ name: 'id', description: 'Distance rate UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: DistanceRateResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  findDistanceRateById(@Param('id') id: string) {
    return this.settingsService.findDistanceRateById(id);
  }

  @Patch('distance-rates/:id')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Update a distance rate' })
  @ApiParam({ name: 'id', description: 'Distance rate UUID' })
  @ApiBody({ type: UpdateDistanceRateDto })
  @ApiResponse({ status: HttpStatus.OK, type: DistanceRateResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  updateDistanceRate(@Param('id') id: string, @Body() dto: UpdateDistanceRateDto) {
    return this.settingsService.updateDistanceRate(id, dto);
  }

  @Delete('distance-rates/:id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('settings:delete')
  @ApiOperation({ summary: 'Delete a distance rate' })
  @ApiParam({ name: 'id', description: 'Distance rate UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: DeleteResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  deleteDistanceRate(@Param('id') id: string) {
    return this.settingsService.deleteDistanceRate(id);
  }

  // ============================================
  // MIXER TYPES (أنواع الخلاطات)
  // ============================================

  @Post('mixer-types')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('settings:create')
  @ApiOperation({ summary: 'Create a new mixer type' })
  @ApiBody({ type: CreateMixerTypeDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: MixerTypeResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ConflictResponseDto })
  createMixerType(@Body() dto: CreateMixerTypeDto) {
    return this.settingsService.createMixerType(dto);
  }

  @Get('mixer-types')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get all mixer types' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: HttpStatus.OK, type: [MixerTypeResponseDto] })
  findAllMixerTypes(@Query('includeInactive') includeInactive?: string) {
    return this.settingsService.findAllMixerTypes(includeInactive === 'true');
  }

  @Get('mixer-types/:id')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get mixer type by ID' })
  @ApiParam({ name: 'id', description: 'Mixer type UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: MixerTypeResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  findMixerTypeById(@Param('id') id: string) {
    return this.settingsService.findMixerTypeById(id);
  }

  @Patch('mixer-types/:id')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Update a mixer type' })
  @ApiParam({ name: 'id', description: 'Mixer type UUID' })
  @ApiBody({ type: UpdateMixerTypeDto })
  @ApiResponse({ status: HttpStatus.OK, type: MixerTypeResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  updateMixerType(@Param('id') id: string, @Body() dto: UpdateMixerTypeDto) {
    return this.settingsService.updateMixerType(id, dto);
  }

  @Delete('mixer-types/:id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('settings:delete')
  @ApiOperation({ summary: 'Delete a mixer type' })
  @ApiParam({ name: 'id', description: 'Mixer type UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: DeleteResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  deleteMixerType(@Param('id') id: string) {
    return this.settingsService.deleteMixerType(id);
  }

  // ============================================
  // LOOKUP CATEGORIES (جداول البحث)
  // ============================================

  @Post('lookup-categories')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('settings:create')
  @ApiOperation({
    summary: 'Create a new lookup category',
    description: `
Create a new lookup category with optional initial items.

**Required Permission:** \`settings:create\`
    `,
  })
  @ApiBody({ type: CreateLookupCategoryDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: LookupCategoryResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ConflictResponseDto })
  createLookupCategory(@Body() dto: CreateLookupCategoryDto) {
    return this.settingsService.createLookupCategory(dto);
  }

  @Get('lookup-categories')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get all lookup categories' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: HttpStatus.OK, type: [LookupCategoryResponseDto] })
  findAllLookupCategories(@Query('includeInactive') includeInactive?: string) {
    return this.settingsService.findAllLookupCategories(includeInactive === 'true');
  }

  @Get('lookup-categories/:id')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get lookup category by ID' })
  @ApiParam({ name: 'id', description: 'Lookup category UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: LookupCategoryResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  findLookupCategoryById(@Param('id') id: string) {
    return this.settingsService.findLookupCategoryById(id);
  }

  @Get('lookup-categories/code/:code')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get lookup category by code' })
  @ApiParam({ name: 'code', description: 'Lookup category code (e.g., LC-PAYMENT-TERMS)' })
  @ApiResponse({ status: HttpStatus.OK, type: LookupCategoryResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  findLookupCategoryByCode(@Param('code') code: string) {
    return this.settingsService.findLookupCategoryByCode(code);
  }

  @Patch('lookup-categories/:id')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Update a lookup category' })
  @ApiParam({ name: 'id', description: 'Lookup category UUID' })
  @ApiBody({ type: UpdateLookupCategoryDto })
  @ApiResponse({ status: HttpStatus.OK, type: LookupCategoryResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  updateLookupCategory(@Param('id') id: string, @Body() dto: UpdateLookupCategoryDto) {
    return this.settingsService.updateLookupCategory(id, dto);
  }

  @Delete('lookup-categories/:id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('settings:delete')
  @ApiOperation({ summary: 'Delete a lookup category' })
  @ApiParam({ name: 'id', description: 'Lookup category UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: DeleteResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  deleteLookupCategory(@Param('id') id: string) {
    return this.settingsService.deleteLookupCategory(id);
  }

  // Lookup Items
  @Post('lookup-categories/:categoryId/items')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('settings:create')
  @ApiOperation({ summary: 'Add item to lookup category' })
  @ApiParam({ name: 'categoryId', description: 'Lookup category UUID' })
  @ApiBody({ type: CreateLookupItemDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: LookupItemResponseDto })
  addLookupItem(
    @Param('categoryId') categoryId: string,
    @Body() dto: CreateLookupItemDto,
  ) {
    return this.settingsService.addLookupItem(categoryId, dto);
  }

  @Patch('lookup-items/:id')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Update a lookup item' })
  @ApiParam({ name: 'id', description: 'Lookup item UUID' })
  @ApiBody({ type: UpdateLookupItemDto })
  @ApiResponse({ status: HttpStatus.OK, type: LookupItemResponseDto })
  updateLookupItem(@Param('id') id: string, @Body() dto: UpdateLookupItemDto) {
    return this.settingsService.updateLookupItem(id, dto);
  }

  @Delete('lookup-items/:id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('settings:delete')
  @ApiOperation({ summary: 'Delete a lookup item' })
  @ApiParam({ name: 'id', description: 'Lookup item UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: DeleteResponseDto })
  deleteLookupItem(@Param('id') id: string) {
    return this.settingsService.deleteLookupItem(id);
  }

  // ============================================
  // SYSTEM SETTINGS (إعدادات النظام)
  // ============================================

  @Post('system')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('settings:create')
  @ApiOperation({
    summary: 'Create a new system setting',
    description: `
Create a new system-wide configuration setting.

**Required Permission:** \`settings:create\`
    `,
  })
  @ApiBody({ type: CreateSystemSettingDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: SystemSettingResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ConflictResponseDto })
  createSystemSetting(@Body() dto: CreateSystemSettingDto) {
    return this.settingsService.createSystemSetting(dto);
  }

  @Get('system')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get all system settings' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiResponse({ status: HttpStatus.OK, type: [SystemSettingResponseDto] })
  findAllSystemSettings(@Query('category') category?: string) {
    return this.settingsService.findAllSystemSettings(category);
  }

  @Get('system/public')
  @Public()
  @ApiOperation({
    summary: 'Get public system settings',
    description: 'Returns settings marked as public (accessible without authentication)',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [SystemSettingResponseDto] })
  findPublicSettings() {
    return this.settingsService.findPublicSettings();
  }

  @Get('system/:key')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get system setting by key' })
  @ApiParam({ name: 'key', description: 'Setting key (e.g., tax_rate)' })
  @ApiResponse({ status: HttpStatus.OK, type: SystemSettingResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  findSystemSettingByKey(@Param('key') key: string) {
    return this.settingsService.findSystemSettingByKey(key);
  }

  @Patch('system/:key')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Update a system setting' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiBody({ type: UpdateSystemSettingDto })
  @ApiResponse({ status: HttpStatus.OK, type: SystemSettingResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  updateSystemSetting(@Param('key') key: string, @Body() dto: UpdateSystemSettingDto) {
    return this.settingsService.updateSystemSetting(key, dto);
  }

  @Patch('system')
  @RequirePermissions('settings:update')
  @ApiOperation({
    summary: 'Bulk update system settings',
    description: 'Update multiple settings at once',
  })
  @ApiBody({ type: BulkUpdateSettingsDto })
  @ApiResponse({ status: HttpStatus.OK })
  bulkUpdateSettings(@Body() dto: BulkUpdateSettingsDto) {
    return this.settingsService.bulkUpdateSettings(dto.settings);
  }

  @Delete('system/:key')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('settings:delete')
  @ApiOperation({ summary: 'Delete a system setting' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: HttpStatus.OK, type: DeleteResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  deleteSystemSetting(@Param('key') key: string) {
    return this.settingsService.deleteSystemSetting(key);
  }
}
