import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  // Test Types
  CreateTestTypeDto,
  UpdateTestTypeDto,
  // Sample Types
  CreateSampleTypeDto,
  UpdateSampleTypeDto,
  // Standards
  CreateStandardDto,
  UpdateStandardDto,
  // Price Lists
  CreatePriceListDto,
  UpdatePriceListDto,
  CreatePriceListItemDto,
  UpdatePriceListItemDto,
  // Distance Rates
  CreateDistanceRateDto,
  UpdateDistanceRateDto,
  // Mixer Types
  CreateMixerTypeDto,
  UpdateMixerTypeDto,
  // Lookup
  CreateLookupCategoryDto,
  UpdateLookupCategoryDto,
  CreateLookupItemDto,
  UpdateLookupItemDto,
  // System Settings
  CreateSystemSettingDto,
  UpdateSystemSettingDto,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // TEST TYPES (أنواع الاختبارات)
  // ============================================

  async createTestType(dto: CreateTestTypeDto) {
    const existing = await this.prisma.testType.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('Test type with this code already exists');
    }

    return this.prisma.testType.create({
      data: {
        ...dto,
        basePrice: dto.basePrice ? new Prisma.Decimal(dto.basePrice) : null,
      },
      include: {
        samples: true,
        standards: true,
      },
    });
  }

  async findAllTestTypes(includeInactive = false) {
    return this.prisma.testType.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        samples: {
          where: includeInactive ? {} : { isActive: true },
        },
        standards: {
          where: includeInactive ? {} : { isActive: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findTestTypeById(id: string) {
    const testType = await this.prisma.testType.findUnique({
      where: { id },
      include: {
        samples: true,
        standards: true,
      },
    });
    if (!testType) {
      throw new NotFoundException('Test type not found');
    }
    return testType;
  }

  async updateTestType(id: string, dto: UpdateTestTypeDto) {
    await this.findTestTypeById(id);

    if (dto.code) {
      const existing = await this.prisma.testType.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Test type with this code already exists');
      }
    }

    return this.prisma.testType.update({
      where: { id },
      data: {
        ...dto,
        basePrice: dto.basePrice !== undefined
          ? dto.basePrice ? new Prisma.Decimal(dto.basePrice) : null
          : undefined,
      },
      include: {
        samples: true,
        standards: true,
      },
    });
  }

  async deleteTestType(id: string) {
    await this.findTestTypeById(id);
    await this.prisma.testType.delete({ where: { id } });
    return { message: 'Test type deleted successfully', messageAr: 'تم حذف نوع الاختبار بنجاح' };
  }

  // ============================================
  // SAMPLE TYPES (أنواع العينات)
  // ============================================

  async createSampleType(dto: CreateSampleTypeDto) {
    const existing = await this.prisma.sampleType.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('Sample type with this code already exists');
    }

    // Verify test type exists
    const testType = await this.prisma.testType.findUnique({
      where: { id: dto.testTypeId },
    });
    if (!testType) {
      throw new BadRequestException('Test type not found');
    }

    return this.prisma.sampleType.create({
      data: {
        ...dto,
        pricePerUnit: dto.pricePerUnit ? new Prisma.Decimal(dto.pricePerUnit) : null,
      },
      include: {
        testType: true,
      },
    });
  }

  async findAllSampleTypes(testTypeId?: string, includeInactive = false) {
    return this.prisma.sampleType.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(testTypeId ? { testTypeId } : {}),
      },
      include: {
        testType: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findSampleTypeById(id: string) {
    const sampleType = await this.prisma.sampleType.findUnique({
      where: { id },
      include: {
        testType: true,
      },
    });
    if (!sampleType) {
      throw new NotFoundException('Sample type not found');
    }
    return sampleType;
  }

  async updateSampleType(id: string, dto: UpdateSampleTypeDto) {
    await this.findSampleTypeById(id);

    if (dto.code) {
      const existing = await this.prisma.sampleType.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Sample type with this code already exists');
      }
    }

    if (dto.testTypeId) {
      const testType = await this.prisma.testType.findUnique({
        where: { id: dto.testTypeId },
      });
      if (!testType) {
        throw new BadRequestException('Test type not found');
      }
    }

    return this.prisma.sampleType.update({
      where: { id },
      data: {
        ...dto,
        pricePerUnit: dto.pricePerUnit !== undefined
          ? dto.pricePerUnit ? new Prisma.Decimal(dto.pricePerUnit) : null
          : undefined,
      },
      include: {
        testType: true,
      },
    });
  }

  async deleteSampleType(id: string) {
    await this.findSampleTypeById(id);
    await this.prisma.sampleType.delete({ where: { id } });
    return { message: 'Sample type deleted successfully', messageAr: 'تم حذف نوع العينة بنجاح' };
  }

  // ============================================
  // STANDARDS (المواصفات القياسية)
  // ============================================

  async createStandard(dto: CreateStandardDto) {
    const existing = await this.prisma.standard.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('Standard with this code already exists');
    }

    const { testTypeIds, ...data } = dto;

    return this.prisma.standard.create({
      data: {
        ...data,
        testTypes: testTypeIds?.length
          ? { connect: testTypeIds.map(id => ({ id })) }
          : undefined,
      },
      include: {
        testTypes: true,
      },
    });
  }

  async findAllStandards(type?: string, includeInactive = false) {
    return this.prisma.standard.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(type ? { type: type as any } : {}),
      },
      include: {
        testTypes: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findStandardById(id: string) {
    const standard = await this.prisma.standard.findUnique({
      where: { id },
      include: {
        testTypes: true,
      },
    });
    if (!standard) {
      throw new NotFoundException('Standard not found');
    }
    return standard;
  }

  async updateStandard(id: string, dto: UpdateStandardDto) {
    await this.findStandardById(id);

    if (dto.code) {
      const existing = await this.prisma.standard.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Standard with this code already exists');
      }
    }

    const { testTypeIds, ...data } = dto;

    return this.prisma.standard.update({
      where: { id },
      data: {
        ...data,
        testTypes: testTypeIds !== undefined
          ? { set: testTypeIds.map(id => ({ id })) }
          : undefined,
      },
      include: {
        testTypes: true,
      },
    });
  }

  async deleteStandard(id: string) {
    await this.findStandardById(id);
    await this.prisma.standard.delete({ where: { id } });
    return { message: 'Standard deleted successfully', messageAr: 'تم حذف المواصفة القياسية بنجاح' };
  }

  // ============================================
  // PRICE LISTS (قوائم الأسعار)
  // ============================================

  async createPriceList(dto: CreatePriceListDto) {
    const existing = await this.prisma.priceList.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('Price list with this code already exists');
    }

    const { items, ...data } = dto;

    return this.prisma.priceList.create({
      data: {
        ...data,
        items: items?.length
          ? {
              create: items.map(item => ({
                ...item,
                price: new Prisma.Decimal(item.price),
              })),
            }
          : undefined,
      },
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
  }

  async findAllPriceLists(category?: string, includeInactive = false) {
    return this.prisma.priceList.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(category ? { category: category as any } : {}),
      },
      include: {
        items: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
      orderBy: [{ validFrom: 'desc' }, { name: 'asc' }],
    });
  }

  async findPriceListById(id: string) {
    const priceList = await this.prisma.priceList.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
    if (!priceList) {
      throw new NotFoundException('Price list not found');
    }
    return priceList;
  }

  async updatePriceList(id: string, dto: UpdatePriceListDto) {
    await this.findPriceListById(id);

    if (dto.code) {
      const existing = await this.prisma.priceList.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Price list with this code already exists');
      }
    }

    const { items, ...data } = dto;

    // If setting as default, unset other defaults in same category
    if (dto.isDefault) {
      const current = await this.prisma.priceList.findUnique({ where: { id } });
      await this.prisma.priceList.updateMany({
        where: { category: current!.category, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.priceList.update({
      where: { id },
      data,
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
  }

  async deletePriceList(id: string) {
    await this.findPriceListById(id);
    await this.prisma.priceList.delete({ where: { id } });
    return { message: 'Price list deleted successfully', messageAr: 'تم حذف قائمة الأسعار بنجاح' };
  }

  // Price List Items
  async addPriceListItem(priceListId: string, dto: CreatePriceListItemDto) {
    await this.findPriceListById(priceListId);

    const existing = await this.prisma.priceListItem.findUnique({
      where: { priceListId_code: { priceListId, code: dto.code } },
    });
    if (existing) {
      throw new ConflictException('Item with this code already exists in this price list');
    }

    return this.prisma.priceListItem.create({
      data: {
        ...dto,
        priceListId,
        price: new Prisma.Decimal(dto.price),
      },
    });
  }

  async updatePriceListItem(id: string, dto: UpdatePriceListItemDto) {
    const item = await this.prisma.priceListItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Price list item not found');
    }

    if (dto.code) {
      const existing = await this.prisma.priceListItem.findFirst({
        where: { priceListId: item.priceListId, code: dto.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Item with this code already exists in this price list');
      }
    }

    return this.prisma.priceListItem.update({
      where: { id },
      data: {
        ...dto,
        price: dto.price !== undefined ? new Prisma.Decimal(dto.price) : undefined,
      },
    });
  }

  async deletePriceListItem(id: string) {
    const item = await this.prisma.priceListItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Price list item not found');
    }
    await this.prisma.priceListItem.delete({ where: { id } });
    return { message: 'Item deleted successfully', messageAr: 'تم حذف العنصر بنجاح' };
  }

  // ============================================
  // DISTANCE RATES (أسعار المسافات)
  // ============================================

  async createDistanceRate(dto: CreateDistanceRateDto) {
    if (dto.fromKm >= dto.toKm) {
      throw new BadRequestException('fromKm must be less than toKm');
    }

    // Check for overlapping ranges
    const overlapping = await this.prisma.distanceRate.findFirst({
      where: {
        isActive: true,
        OR: [
          { fromKm: { lte: dto.fromKm }, toKm: { gt: dto.fromKm } },
          { fromKm: { lt: dto.toKm }, toKm: { gte: dto.toKm } },
          { fromKm: { gte: dto.fromKm }, toKm: { lte: dto.toKm } },
        ],
      },
    });
    if (overlapping) {
      throw new ConflictException('Distance range overlaps with existing rate');
    }

    return this.prisma.distanceRate.create({
      data: {
        ...dto,
        rate: new Prisma.Decimal(dto.rate),
        ratePerKm: dto.ratePerKm ? new Prisma.Decimal(dto.ratePerKm) : null,
      },
    });
  }

  async findAllDistanceRates(includeInactive = false) {
    return this.prisma.distanceRate.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ fromKm: 'asc' }],
    });
  }

  async findDistanceRateById(id: string) {
    const rate = await this.prisma.distanceRate.findUnique({ where: { id } });
    if (!rate) {
      throw new NotFoundException('Distance rate not found');
    }
    return rate;
  }

  async updateDistanceRate(id: string, dto: UpdateDistanceRateDto) {
    const current = await this.findDistanceRateById(id);

    const fromKm = dto.fromKm ?? current.fromKm;
    const toKm = dto.toKm ?? current.toKm;

    if (fromKm >= toKm) {
      throw new BadRequestException('fromKm must be less than toKm');
    }

    if (dto.fromKm !== undefined || dto.toKm !== undefined) {
      const overlapping = await this.prisma.distanceRate.findFirst({
        where: {
          isActive: true,
          NOT: { id },
          OR: [
            { fromKm: { lte: fromKm }, toKm: { gt: fromKm } },
            { fromKm: { lt: toKm }, toKm: { gte: toKm } },
            { fromKm: { gte: fromKm }, toKm: { lte: toKm } },
          ],
        },
      });
      if (overlapping) {
        throw new ConflictException('Distance range overlaps with existing rate');
      }
    }

    return this.prisma.distanceRate.update({
      where: { id },
      data: {
        ...dto,
        rate: dto.rate !== undefined ? new Prisma.Decimal(dto.rate) : undefined,
        ratePerKm: dto.ratePerKm !== undefined
          ? dto.ratePerKm ? new Prisma.Decimal(dto.ratePerKm) : null
          : undefined,
      },
    });
  }

  async deleteDistanceRate(id: string) {
    await this.findDistanceRateById(id);
    await this.prisma.distanceRate.delete({ where: { id } });
    return { message: 'Distance rate deleted successfully', messageAr: 'تم حذف سعر المسافة بنجاح' };
  }

  // ============================================
  // MIXER TYPES (أنواع الخلاطات)
  // ============================================

  async createMixerType(dto: CreateMixerTypeDto) {
    const existing = await this.prisma.mixerType.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('Mixer type with this code already exists');
    }

    return this.prisma.mixerType.create({
      data: {
        ...dto,
        capacity: dto.capacity ? new Prisma.Decimal(dto.capacity) : null,
        pricePerBatch: dto.pricePerBatch ? new Prisma.Decimal(dto.pricePerBatch) : null,
      },
    });
  }

  async findAllMixerTypes(includeInactive = false) {
    return this.prisma.mixerType.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findMixerTypeById(id: string) {
    const mixerType = await this.prisma.mixerType.findUnique({ where: { id } });
    if (!mixerType) {
      throw new NotFoundException('Mixer type not found');
    }
    return mixerType;
  }

  async updateMixerType(id: string, dto: UpdateMixerTypeDto) {
    await this.findMixerTypeById(id);

    if (dto.code) {
      const existing = await this.prisma.mixerType.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Mixer type with this code already exists');
      }
    }

    return this.prisma.mixerType.update({
      where: { id },
      data: {
        ...dto,
        capacity: dto.capacity !== undefined
          ? dto.capacity ? new Prisma.Decimal(dto.capacity) : null
          : undefined,
        pricePerBatch: dto.pricePerBatch !== undefined
          ? dto.pricePerBatch ? new Prisma.Decimal(dto.pricePerBatch) : null
          : undefined,
      },
    });
  }

  async deleteMixerType(id: string) {
    await this.findMixerTypeById(id);
    await this.prisma.mixerType.delete({ where: { id } });
    return { message: 'Mixer type deleted successfully', messageAr: 'تم حذف نوع الخلاطة بنجاح' };
  }

  // ============================================
  // LOOKUP CATEGORIES (جداول البحث)
  // ============================================

  async createLookupCategory(dto: CreateLookupCategoryDto) {
    const existing = await this.prisma.lookupCategory.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('Lookup category with this code already exists');
    }

    const { items, ...data } = dto;

    return this.prisma.lookupCategory.create({
      data: {
        ...data,
        items: items?.length ? { create: items } : undefined,
      },
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
  }

  async findAllLookupCategories(includeInactive = false) {
    return this.prisma.lookupCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        items: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findLookupCategoryById(id: string) {
    const category = await this.prisma.lookupCategory.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
    if (!category) {
      throw new NotFoundException('Lookup category not found');
    }
    return category;
  }

  async findLookupCategoryByCode(code: string) {
    const category = await this.prisma.lookupCategory.findUnique({
      where: { code },
      include: {
        items: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
    if (!category) {
      throw new NotFoundException('Lookup category not found');
    }
    return category;
  }

  async updateLookupCategory(id: string, dto: UpdateLookupCategoryDto) {
    const current = await this.findLookupCategoryById(id);

    if (current.isSystem && dto.isActive === false) {
      throw new BadRequestException('Cannot deactivate system category');
    }

    if (dto.code) {
      const existing = await this.prisma.lookupCategory.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Lookup category with this code already exists');
      }
    }

    const { items, ...data } = dto;

    return this.prisma.lookupCategory.update({
      where: { id },
      data,
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
  }

  async deleteLookupCategory(id: string) {
    const category = await this.findLookupCategoryById(id);
    if (category.isSystem) {
      throw new BadRequestException('Cannot delete system category');
    }
    await this.prisma.lookupCategory.delete({ where: { id } });
    return { message: 'Lookup category deleted successfully', messageAr: 'تم حذف جدول البحث بنجاح' };
  }

  // Lookup Items
  async addLookupItem(categoryId: string, dto: CreateLookupItemDto) {
    await this.findLookupCategoryById(categoryId);

    const existing = await this.prisma.lookupItem.findUnique({
      where: { categoryId_code: { categoryId, code: dto.code } },
    });
    if (existing) {
      throw new ConflictException('Item with this code already exists in this category');
    }

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.lookupItem.updateMany({
        where: { categoryId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.lookupItem.create({
      data: {
        ...dto,
        categoryId,
      },
    });
  }

  async updateLookupItem(id: string, dto: UpdateLookupItemDto) {
    const item = await this.prisma.lookupItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Lookup item not found');
    }

    if (dto.code) {
      const existing = await this.prisma.lookupItem.findFirst({
        where: { categoryId: item.categoryId, code: dto.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Item with this code already exists in this category');
      }
    }

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.lookupItem.updateMany({
        where: { categoryId: item.categoryId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.lookupItem.update({
      where: { id },
      data: dto,
    });
  }

  async deleteLookupItem(id: string) {
    const item = await this.prisma.lookupItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Lookup item not found');
    }
    await this.prisma.lookupItem.delete({ where: { id } });
    return { message: 'Item deleted successfully', messageAr: 'تم حذف العنصر بنجاح' };
  }

  // ============================================
  // SYSTEM SETTINGS (إعدادات النظام)
  // ============================================

  async createSystemSetting(dto: CreateSystemSettingDto) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key: dto.key },
    });
    if (existing) {
      throw new ConflictException('Setting with this key already exists');
    }

    return this.prisma.systemSetting.create({
      data: dto,
    });
  }

  async findAllSystemSettings(category?: string, includeSystem = true) {
    return this.prisma.systemSetting.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(includeSystem ? {} : { isSystem: false }),
      },
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  }

  async findPublicSettings() {
    return this.prisma.systemSetting.findMany({
      where: { isPublic: true },
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  }

  async findSystemSettingByKey(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    if (!setting) {
      throw new NotFoundException('Setting not found');
    }
    return setting;
  }

  async updateSystemSetting(key: string, dto: UpdateSystemSettingDto) {
    const setting = await this.findSystemSettingByKey(key);

    // Validate value against rule if present
    if (setting.validationRule && dto.value) {
      const regex = new RegExp(setting.validationRule);
      if (!regex.test(dto.value)) {
        throw new BadRequestException('Value does not match validation rule');
      }
    }

    return this.prisma.systemSetting.update({
      where: { key },
      data: dto,
    });
  }

  async bulkUpdateSettings(updates: Array<{ key: string; value: string }>) {
    const results: Array<{
      key: string;
      success: boolean;
      setting?: any;
      error?: string;
    }> = [];
    for (const update of updates) {
      try {
        const result = await this.updateSystemSetting(update.key, { value: update.value });
        results.push({ key: update.key, success: true, setting: result });
      } catch (error: any) {
        results.push({ key: update.key, success: false, error: error.message });
      }
    }
    return results;
  }

  async deleteSystemSetting(key: string) {
    const setting = await this.findSystemSettingByKey(key);
    if (setting.isSystem) {
      throw new BadRequestException('Cannot delete system setting');
    }
    await this.prisma.systemSetting.delete({ where: { key } });
    return { message: 'Setting deleted successfully', messageAr: 'تم حذف الإعداد بنجاح' };
  }

  // Helper to get parsed setting value
  async getSettingValue<T = string>(key: string, defaultValue?: T): Promise<T> {
    try {
      const setting = await this.findSystemSettingByKey(key);
      switch (setting.type) {
        case 'NUMBER':
          return parseFloat(setting.value) as unknown as T;
        case 'BOOLEAN':
          return (setting.value === 'true') as unknown as T;
        case 'JSON':
          return JSON.parse(setting.value) as T;
        case 'DATE':
          return new Date(setting.value) as unknown as T;
        default:
          return setting.value as unknown as T;
      }
    } catch {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new NotFoundException(`Setting '${key}' not found`);
    }
  }
}
