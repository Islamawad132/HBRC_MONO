import { httpClient } from './httpclient';
import type {
  // Test Types
  TestType,
  CreateTestTypeRequest,
  UpdateTestTypeRequest,
  // Sample Types
  SampleType,
  CreateSampleTypeRequest,
  UpdateSampleTypeRequest,
  // Standards
  Standard,
  CreateStandardRequest,
  UpdateStandardRequest,
  // Price Lists
  PriceList,
  CreatePriceListRequest,
  UpdatePriceListRequest,
  PriceListItem,
  CreatePriceListItemRequest,
  UpdatePriceListItemRequest,
  // Distance Rates
  DistanceRate,
  CreateDistanceRateRequest,
  UpdateDistanceRateRequest,
  // Mixer Types
  MixerType,
  CreateMixerTypeRequest,
  UpdateMixerTypeRequest,
  // Lookup
  LookupCategory,
  CreateLookupCategoryRequest,
  UpdateLookupCategoryRequest,
  LookupItem,
  CreateLookupItemRequest,
  UpdateLookupItemRequest,
  // System Settings
  SystemSetting,
  CreateSystemSettingRequest,
  UpdateSystemSettingRequest,
  BulkUpdateSettingsRequest,
  DeleteResponse,
} from '../types/interfaces';

const ENDPOINTS = {
  // Test Types
  testTypes: '/settings/test-types',
  testTypeById: (id: string) => `/settings/test-types/${id}`,

  // Sample Types
  sampleTypes: '/settings/sample-types',
  sampleTypeById: (id: string) => `/settings/sample-types/${id}`,

  // Standards
  standards: '/settings/standards',
  standardById: (id: string) => `/settings/standards/${id}`,

  // Price Lists
  priceLists: '/settings/price-lists',
  priceListById: (id: string) => `/settings/price-lists/${id}`,
  priceListItems: (priceListId: string) => `/settings/price-lists/${priceListId}/items`,
  priceListItemById: (id: string) => `/settings/price-list-items/${id}`,

  // Distance Rates
  distanceRates: '/settings/distance-rates',
  distanceRateById: (id: string) => `/settings/distance-rates/${id}`,

  // Mixer Types
  mixerTypes: '/settings/mixer-types',
  mixerTypeById: (id: string) => `/settings/mixer-types/${id}`,

  // Lookup Categories
  lookupCategories: '/settings/lookup-categories',
  lookupCategoryById: (id: string) => `/settings/lookup-categories/${id}`,
  lookupCategoryByCode: (code: string) => `/settings/lookup-categories/code/${code}`,
  lookupItems: (categoryId: string) => `/settings/lookup-categories/${categoryId}/items`,
  lookupItemById: (id: string) => `/settings/lookup-items/${id}`,

  // System Settings
  systemSettings: '/settings/system',
  systemSettingByKey: (key: string) => `/settings/system/${key}`,
  publicSettings: '/settings/system/public',
};

class SettingsService {
  // ============================================
  // TEST TYPES (أنواع الاختبارات)
  // ============================================

  async getTestTypes(includeInactive = false): Promise<TestType[]> {
    const url = includeInactive
      ? `${ENDPOINTS.testTypes}?includeInactive=true`
      : ENDPOINTS.testTypes;
    return httpClient.get<TestType[]>(url);
  }

  async getTestTypeById(id: string): Promise<TestType> {
    return httpClient.get<TestType>(ENDPOINTS.testTypeById(id));
  }

  async createTestType(data: CreateTestTypeRequest): Promise<TestType> {
    return httpClient.post<TestType>(ENDPOINTS.testTypes, data);
  }

  async updateTestType(id: string, data: UpdateTestTypeRequest): Promise<TestType> {
    return httpClient.patch<TestType>(ENDPOINTS.testTypeById(id), data);
  }

  async deleteTestType(id: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.testTypeById(id));
  }

  // ============================================
  // SAMPLE TYPES (أنواع العينات)
  // ============================================

  async getSampleTypes(testTypeId?: string, includeInactive = false): Promise<SampleType[]> {
    const params = new URLSearchParams();
    if (testTypeId) params.append('testTypeId', testTypeId);
    if (includeInactive) params.append('includeInactive', 'true');
    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.sampleTypes}?${queryString}` : ENDPOINTS.sampleTypes;
    return httpClient.get<SampleType[]>(url);
  }

  async getSampleTypeById(id: string): Promise<SampleType> {
    return httpClient.get<SampleType>(ENDPOINTS.sampleTypeById(id));
  }

  async createSampleType(data: CreateSampleTypeRequest): Promise<SampleType> {
    return httpClient.post<SampleType>(ENDPOINTS.sampleTypes, data);
  }

  async updateSampleType(id: string, data: UpdateSampleTypeRequest): Promise<SampleType> {
    return httpClient.patch<SampleType>(ENDPOINTS.sampleTypeById(id), data);
  }

  async deleteSampleType(id: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.sampleTypeById(id));
  }

  // ============================================
  // STANDARDS (المواصفات القياسية)
  // ============================================

  async getStandards(type?: string, includeInactive = false): Promise<Standard[]> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (includeInactive) params.append('includeInactive', 'true');
    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.standards}?${queryString}` : ENDPOINTS.standards;
    return httpClient.get<Standard[]>(url);
  }

  async getStandardById(id: string): Promise<Standard> {
    return httpClient.get<Standard>(ENDPOINTS.standardById(id));
  }

  async createStandard(data: CreateStandardRequest): Promise<Standard> {
    return httpClient.post<Standard>(ENDPOINTS.standards, data);
  }

  async updateStandard(id: string, data: UpdateStandardRequest): Promise<Standard> {
    return httpClient.patch<Standard>(ENDPOINTS.standardById(id), data);
  }

  async deleteStandard(id: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.standardById(id));
  }

  // ============================================
  // PRICE LISTS (قوائم الأسعار)
  // ============================================

  async getPriceLists(category?: string, includeInactive = false): Promise<PriceList[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (includeInactive) params.append('includeInactive', 'true');
    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.priceLists}?${queryString}` : ENDPOINTS.priceLists;
    return httpClient.get<PriceList[]>(url);
  }

  async getPriceListById(id: string): Promise<PriceList> {
    return httpClient.get<PriceList>(ENDPOINTS.priceListById(id));
  }

  async createPriceList(data: CreatePriceListRequest): Promise<PriceList> {
    return httpClient.post<PriceList>(ENDPOINTS.priceLists, data);
  }

  async updatePriceList(id: string, data: UpdatePriceListRequest): Promise<PriceList> {
    return httpClient.patch<PriceList>(ENDPOINTS.priceListById(id), data);
  }

  async deletePriceList(id: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.priceListById(id));
  }

  // Price List Items
  async addPriceListItem(priceListId: string, data: CreatePriceListItemRequest): Promise<PriceListItem> {
    return httpClient.post<PriceListItem>(ENDPOINTS.priceListItems(priceListId), data);
  }

  async updatePriceListItem(id: string, data: UpdatePriceListItemRequest): Promise<PriceListItem> {
    return httpClient.patch<PriceListItem>(ENDPOINTS.priceListItemById(id), data);
  }

  async deletePriceListItem(id: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.priceListItemById(id));
  }

  // ============================================
  // DISTANCE RATES (أسعار المسافات)
  // ============================================

  async getDistanceRates(includeInactive = false): Promise<DistanceRate[]> {
    const url = includeInactive
      ? `${ENDPOINTS.distanceRates}?includeInactive=true`
      : ENDPOINTS.distanceRates;
    return httpClient.get<DistanceRate[]>(url);
  }

  async getDistanceRateById(id: string): Promise<DistanceRate> {
    return httpClient.get<DistanceRate>(ENDPOINTS.distanceRateById(id));
  }

  async createDistanceRate(data: CreateDistanceRateRequest): Promise<DistanceRate> {
    return httpClient.post<DistanceRate>(ENDPOINTS.distanceRates, data);
  }

  async updateDistanceRate(id: string, data: UpdateDistanceRateRequest): Promise<DistanceRate> {
    return httpClient.patch<DistanceRate>(ENDPOINTS.distanceRateById(id), data);
  }

  async deleteDistanceRate(id: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.distanceRateById(id));
  }

  // ============================================
  // MIXER TYPES (أنواع الخلاطات)
  // ============================================

  async getMixerTypes(includeInactive = false): Promise<MixerType[]> {
    const url = includeInactive
      ? `${ENDPOINTS.mixerTypes}?includeInactive=true`
      : ENDPOINTS.mixerTypes;
    return httpClient.get<MixerType[]>(url);
  }

  async getMixerTypeById(id: string): Promise<MixerType> {
    return httpClient.get<MixerType>(ENDPOINTS.mixerTypeById(id));
  }

  async createMixerType(data: CreateMixerTypeRequest): Promise<MixerType> {
    return httpClient.post<MixerType>(ENDPOINTS.mixerTypes, data);
  }

  async updateMixerType(id: string, data: UpdateMixerTypeRequest): Promise<MixerType> {
    return httpClient.patch<MixerType>(ENDPOINTS.mixerTypeById(id), data);
  }

  async deleteMixerType(id: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.mixerTypeById(id));
  }

  // ============================================
  // LOOKUP CATEGORIES (جداول البحث)
  // ============================================

  async getLookupCategories(includeInactive = false): Promise<LookupCategory[]> {
    const url = includeInactive
      ? `${ENDPOINTS.lookupCategories}?includeInactive=true`
      : ENDPOINTS.lookupCategories;
    return httpClient.get<LookupCategory[]>(url);
  }

  async getLookupCategoryById(id: string): Promise<LookupCategory> {
    return httpClient.get<LookupCategory>(ENDPOINTS.lookupCategoryById(id));
  }

  async getLookupCategoryByCode(code: string): Promise<LookupCategory> {
    return httpClient.get<LookupCategory>(ENDPOINTS.lookupCategoryByCode(code));
  }

  async createLookupCategory(data: CreateLookupCategoryRequest): Promise<LookupCategory> {
    return httpClient.post<LookupCategory>(ENDPOINTS.lookupCategories, data);
  }

  async updateLookupCategory(id: string, data: UpdateLookupCategoryRequest): Promise<LookupCategory> {
    return httpClient.patch<LookupCategory>(ENDPOINTS.lookupCategoryById(id), data);
  }

  async deleteLookupCategory(id: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.lookupCategoryById(id));
  }

  // Lookup Items
  async addLookupItem(categoryId: string, data: CreateLookupItemRequest): Promise<LookupItem> {
    return httpClient.post<LookupItem>(ENDPOINTS.lookupItems(categoryId), data);
  }

  async updateLookupItem(id: string, data: UpdateLookupItemRequest): Promise<LookupItem> {
    return httpClient.patch<LookupItem>(ENDPOINTS.lookupItemById(id), data);
  }

  async deleteLookupItem(id: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.lookupItemById(id));
  }

  // ============================================
  // SYSTEM SETTINGS (إعدادات النظام)
  // ============================================

  async getSystemSettings(category?: string): Promise<SystemSetting[]> {
    const url = category
      ? `${ENDPOINTS.systemSettings}?category=${category}`
      : ENDPOINTS.systemSettings;
    return httpClient.get<SystemSetting[]>(url);
  }

  async getPublicSettings(): Promise<SystemSetting[]> {
    return httpClient.get<SystemSetting[]>(ENDPOINTS.publicSettings);
  }

  async getSystemSettingByKey(key: string): Promise<SystemSetting> {
    return httpClient.get<SystemSetting>(ENDPOINTS.systemSettingByKey(key));
  }

  async createSystemSetting(data: CreateSystemSettingRequest): Promise<SystemSetting> {
    return httpClient.post<SystemSetting>(ENDPOINTS.systemSettings, data);
  }

  async updateSystemSetting(key: string, data: UpdateSystemSettingRequest): Promise<SystemSetting> {
    return httpClient.patch<SystemSetting>(ENDPOINTS.systemSettingByKey(key), data);
  }

  async bulkUpdateSettings(data: BulkUpdateSettingsRequest): Promise<Array<{
    key: string;
    success: boolean;
    setting?: SystemSetting;
    error?: string;
  }>> {
    return httpClient.patch(ENDPOINTS.systemSettings, data);
  }

  async deleteSystemSetting(key: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.systemSettingByKey(key));
  }
}

export const settingsService = new SettingsService();
export default settingsService;
