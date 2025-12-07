// ============================================
// INTERFACES - TypeScript Types for API
// ============================================

import type {
  CustomerType,
  AccountStatus,
  ServiceCategory,
  ServiceStatus,
  PricingType,
  RequestStatus,
  RequestPriority,
  PaymentStatus,
  PaymentMethod,
  InvoiceStatus,
  DocumentType,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  AuditAction,
  StandardType,
  SettingType,
  UserType,
} from './enums';

// ============================================
// BASE INTERFACES
// ============================================

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  messageAr?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  messageAr?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// ============================================
// AUTH INTERFACES
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CustomerLoginResponse {
  accessToken: string;
  refreshToken: string;
  customer: Customer;
}

export interface EmployeeLoginResponse {
  accessToken: string;
  refreshToken: string;
  employee: Employee;
}

export interface CustomerRegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  customerType?: CustomerType;
  address?: string;
  companyName?: string;
  taxNumber?: string;
  contactPerson?: string;
  licenseNumber?: string;
  consultingFirm?: string;
}

export interface ForgotPasswordRequest {
  email: string;
  userType: 'customer' | 'employee';
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

// ============================================
// CUSTOMER INTERFACES
// ============================================

export interface Customer extends BaseEntity {
  email: string;
  customerType: CustomerType;
  name: string;
  phone: string;
  address?: string;
  companyName?: string;
  taxNumber?: string;
  contactPerson?: string;
  licenseNumber?: string;
  consultingFirm?: string;
  status: AccountStatus;
  isVerified: boolean;
  verifiedAt?: string;
  language: string;
  notifications: boolean;
  profileImage?: string;
  lastLoginAt?: string;
  loginCount: number;
}

export interface CreateCustomerRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  customerType?: CustomerType;
  address?: string;
  companyName?: string;
  taxNumber?: string;
  contactPerson?: string;
  licenseNumber?: string;
  consultingFirm?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  customerType?: CustomerType;
  address?: string;
  companyName?: string;
  taxNumber?: string;
  contactPerson?: string;
  licenseNumber?: string;
  consultingFirm?: string;
  status?: AccountStatus;
  language?: string;
  notifications?: boolean;
}

// ============================================
// EMPLOYEE INTERFACES
// ============================================

export interface Employee extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  employeeId: string;
  department: string;
  position: string;
  institute?: string;
  status: AccountStatus;
  roleId: string;
  role?: Role;
  language: string;
  notifications: boolean;
  profileImage?: string;
  lastLoginAt?: string;
  loginCount: number;
}

export interface CreateEmployeeRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  employeeId: string;
  department: string;
  position: string;
  institute?: string;
  roleId: string;
}

export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  position?: string;
  institute?: string;
  status?: AccountStatus;
  roleId?: string;
  language?: string;
  notifications?: boolean;
}

// ============================================
// ROLE & PERMISSION INTERFACES
// ============================================

export interface Permission extends BaseEntity {
  name: string;
  description?: string;
  descriptionAr?: string;
  module: string;
  action: string;
}

export interface Role extends BaseEntity {
  name: string;
  nameAr?: string;
  description?: string;
  isAdmin: boolean;
  permissions?: Permission[];
  // Count fields returned by API
  usersCount?: number;
  employeesCount?: number;
  legacyUsersCount?: number;
}

export interface CreateRoleRequest {
  name: string;
  nameAr?: string;
  description?: string;
  isAdmin?: boolean;
  permissionIds?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  nameAr?: string;
  description?: string;
  isAdmin?: boolean;
  permissionIds?: string[];
}

// ============================================
// SERVICE INTERFACES
// ============================================

export interface Service extends BaseEntity {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  category: ServiceCategory;
  code: string;
  pricingType: PricingType;
  basePrice?: number;
  minPrice?: number;
  maxPrice?: number;
  currency: string;
  duration?: number;
  requirements?: string;
  requirementsAr?: string;
  status: ServiceStatus;
  isActive: boolean;
  orderCount: number;
}

export interface CreateServiceRequest {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  category: ServiceCategory;
  code: string;
  pricingType?: PricingType;
  basePrice?: number;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  duration?: number;
  requirements?: string;
  requirementsAr?: string;
}

export interface UpdateServiceRequest {
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  category?: ServiceCategory;
  pricingType?: PricingType;
  basePrice?: number;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  duration?: number;
  requirements?: string;
  requirementsAr?: string;
  status?: ServiceStatus;
  isActive?: boolean;
}

// ============================================
// SERVICE REQUEST INTERFACES
// ============================================

export interface ServiceRequest extends BaseEntity {
  requestNumber: string;
  customerId: string;
  customer?: Customer;
  serviceId: string;
  service?: Service;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  notes?: string;
  notesAr?: string;
  status: RequestStatus;
  priority: RequestPriority;
  assignedToId?: string;
  assignedTo?: Employee;
  assignedAt?: string;
  estimatedPrice?: number;
  finalPrice?: number;
  currency: string;
  requestedDate: string;
  expectedDate?: string;
  completedAt?: string;
  deliveredAt?: string;
  rejectionReason?: string;
  rejectionReasonAr?: string;
  cancellationReason?: string;
  cancellationReasonAr?: string;
  viewCount: number;
  lastViewedAt?: string;
  invoice?: Invoice;
  documents?: Document[];
}

export interface CreateServiceRequestRequest {
  serviceId: string;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  notes?: string;
  notesAr?: string;
  priority?: RequestPriority;
  expectedDate?: string;
}

export interface UpdateServiceRequestRequest {
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  notes?: string;
  notesAr?: string;
  priority?: RequestPriority;
  expectedDate?: string;
  estimatedPrice?: number;
  finalPrice?: number;
}

export interface UpdateRequestStatusRequest {
  status: RequestStatus;
  rejectionReason?: string;
  rejectionReasonAr?: string;
  cancellationReason?: string;
  cancellationReasonAr?: string;
}

export interface AssignEmployeeRequest {
  employeeId: string;
}

// ============================================
// INVOICE INTERFACES
// ============================================

export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  requestId: string;
  request?: ServiceRequest;
  customerId: string;
  customer?: Customer;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt?: string;
  sentAt?: string;
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  notesAr?: string;
  payments?: Payment[];
}

export interface CreateInvoiceRequest {
  requestId: string;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  subtotal: number;
  taxRate?: number;
  discount?: number;
  dueDate?: string;
  notes?: string;
  notesAr?: string;
}

export interface UpdateInvoiceRequest {
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  subtotal?: number;
  taxRate?: number;
  discount?: number;
  dueDate?: string;
  notes?: string;
  notesAr?: string;
  status?: InvoiceStatus;
}

// ============================================
// PAYMENT INTERFACES
// ============================================

export interface Payment extends BaseEntity {
  paymentNumber: string;
  invoiceId: string;
  invoice?: Invoice;
  customerId: string;
  customer?: Customer;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  referenceNumber?: string;
  paidAt?: string;
  failedAt?: string;
  refundedAt?: string;
  notes?: string;
  notesAr?: string;
  failureReason?: string;
  failureReasonAr?: string;
  receiptUrl?: string;
}

export interface CreatePaymentRequest {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  referenceNumber?: string;
  notes?: string;
  notesAr?: string;
}

export interface UpdatePaymentRequest {
  method?: PaymentMethod;
  status?: PaymentStatus;
  transactionId?: string;
  referenceNumber?: string;
  notes?: string;
  notesAr?: string;
  failureReason?: string;
  failureReasonAr?: string;
}

// ============================================
// DOCUMENT INTERFACES
// ============================================

export interface Document extends BaseEntity {
  filename: string;
  storedFilename: string;
  filepath: string;
  mimetype: string;
  size: number;
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  type: DocumentType;
  requestId?: string;
  request?: ServiceRequest;
  uploadedById: string;
  uploadedByType: 'customer' | 'employee';
  isPublic: boolean;
  downloadCount: number;
  lastDownloadAt?: string;
}

export interface UploadDocumentRequest {
  file: File;
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  type?: DocumentType;
  requestId?: string;
  isPublic?: boolean;
}

export interface UpdateDocumentRequest {
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  type?: DocumentType;
  isPublic?: boolean;
}

// ============================================
// NOTIFICATION INTERFACES
// ============================================

export interface Notification extends BaseEntity {
  userId: string;
  userType: 'customer' | 'employee';
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  actionUrl?: string;
  actionData?: Record<string, unknown>;
  status: NotificationStatus;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  failureReason?: string;
}

export interface CreateNotificationRequest {
  userId: string;
  userType: 'customer' | 'employee';
  type: NotificationType;
  channel?: NotificationChannel;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  actionUrl?: string;
  actionData?: Record<string, unknown>;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unread: number;
}

// ============================================
// AUDIT LOG INTERFACES
// ============================================

export interface AuditLog {
  id: string;
  userId?: string;
  userType?: 'customer' | 'employee' | 'system';
  userEmail?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  description?: string;
  descriptionAr?: string;
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
  requestMethod?: string;
  createdAt: string;
}

export interface AuditLogFilters {
  userId?: string;
  userType?: string;
  action?: AuditAction;
  entity?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ============================================
// DASHBOARD INTERFACES
// ============================================

export interface DashboardSummary {
  requests: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  customers: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    pending: number;
  };
  services: {
    total: number;
    active: number;
    topServices: Array<{
      id: string;
      name: string;
      nameAr: string;
      orderCount: number;
    }>;
  };
}

export interface RequestsStats {
  total: number;
  byStatus: Record<RequestStatus, number>;
  byPriority: Record<RequestPriority, number>;
  byCategory: Record<ServiceCategory, number>;
  assigned: number;
  unassigned: number;
  averageCompletionTime?: number;
  trend: Array<{
    date: string;
    count: number;
  }>;
}

export interface RevenueStats {
  total: number;
  paid: number;
  pending: number;
  refunded: number;
  monthly: Array<{
    month: string;
    amount: number;
  }>;
  byMethod: Record<PaymentMethod, number>;
}

export interface ServicesStats {
  total: number;
  active: number;
  inactive: number;
  byCategory: Record<ServiceCategory, number>;
  mostRequested: Service[];
  leastRequested: Service[];
}

export interface CustomersStats {
  total: number;
  byStatus: Record<AccountStatus, number>;
  byType: Record<CustomerType, number>;
  verified: number;
  unverified: number;
  newThisMonth: number;
  newThisWeek: number;
  topBySpending: Array<{
    customer: Customer;
    totalSpent: number;
  }>;
}

export interface EmployeesStats {
  total: number;
  byStatus: Record<AccountStatus, number>;
  byDepartment: Record<string, number>;
  byRole: Record<string, number>;
  assignmentLoad: Array<{
    employee: Employee;
    activeRequests: number;
  }>;
}

export interface RecentActivity {
  recentRequests: ServiceRequest[];
  recentPayments: Payment[];
  recentInvoices: Invoice[];
}

// ============================================
// QUERY/FILTER INTERFACES
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ServiceRequestFilters extends PaginationParams {
  status?: RequestStatus;
  priority?: RequestPriority;
  customerId?: string;
  serviceId?: string;
  assignedToId?: string;
  category?: ServiceCategory;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface CustomerFilters extends PaginationParams {
  status?: AccountStatus;
  customerType?: CustomerType;
  isVerified?: boolean;
  search?: string;
}

export interface EmployeeFilters extends PaginationParams {
  status?: AccountStatus;
  department?: string;
  roleId?: string;
  search?: string;
}

export interface ServiceFilters extends PaginationParams {
  status?: ServiceStatus;
  category?: ServiceCategory;
  isActive?: boolean;
  search?: string;
}

export interface InvoiceFilters extends PaginationParams {
  status?: InvoiceStatus;
  customerId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaymentFilters extends PaginationParams {
  status?: PaymentStatus;
  method?: PaymentMethod;
  customerId?: string;
  invoiceId?: string;
  startDate?: string;
  endDate?: string;
}

// ============================================
// UTILITY TYPES
// ============================================

// UserType is defined in enums.ts

export interface CurrentUser {
  id: string;
  email: string;
  type: UserType;
  name: string;
  permissions?: string[];
  isAdmin?: boolean;
}

export interface DeleteResponse {
  message: string;
  messageAr: string;
}

// ============================================
// SETTINGS INTERFACES (جداول الإعدادات)
// ============================================

// Test Types (أنواع الاختبارات)
export interface TestType extends BaseEntity {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  code: string;
  category: ServiceCategory;
  basePrice?: number;
  isActive: boolean;
  sortOrder: number;
  samples?: SampleType[];
  standards?: Standard[];
}

export interface CreateTestTypeRequest {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  code: string;
  category: ServiceCategory;
  basePrice?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateTestTypeRequest extends Partial<CreateTestTypeRequest> {}

// Sample Types (أنواع العينات)
export interface SampleType extends BaseEntity {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  code: string;
  testTypeId: string;
  testType?: TestType;
  unit: string;
  unitAr: string;
  minQuantity: number;
  maxQuantity?: number;
  pricePerUnit?: number;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateSampleTypeRequest {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  code: string;
  testTypeId: string;
  unit?: string;
  unitAr?: string;
  minQuantity?: number;
  maxQuantity?: number;
  pricePerUnit?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateSampleTypeRequest extends Partial<CreateSampleTypeRequest> {}

// Standards (المواصفات القياسية)
export interface Standard extends BaseEntity {
  name: string;
  nameAr: string;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  code: string;
  type: StandardType;
  testTypes?: TestType[];
  documentUrl?: string;
  version?: string;
  publishedYear?: number;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateStandardRequest {
  name: string;
  nameAr: string;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  code: string;
  type?: StandardType;
  testTypeIds?: string[];
  documentUrl?: string;
  version?: string;
  publishedYear?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateStandardRequest extends Partial<CreateStandardRequest> {}

// Price Lists (قوائم الأسعار)
export interface PriceListItem extends BaseEntity {
  priceListId: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  code: string;
  price: number;
  unit: string;
  unitAr: string;
  minQuantity: number;
  maxQuantity?: number;
  isActive: boolean;
  sortOrder: number;
}

export interface CreatePriceListItemRequest {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  code: string;
  price: number;
  unit?: string;
  unitAr?: string;
  minQuantity?: number;
  maxQuantity?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePriceListItemRequest extends Partial<CreatePriceListItemRequest> {}

export interface PriceList extends BaseEntity {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  code: string;
  category: ServiceCategory;
  validFrom: string;
  validTo?: string;
  isActive: boolean;
  isDefault: boolean;
  items?: PriceListItem[];
}

export interface CreatePriceListRequest {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  code: string;
  category: ServiceCategory;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
  isDefault?: boolean;
  items?: CreatePriceListItemRequest[];
}

export interface UpdatePriceListRequest extends Partial<Omit<CreatePriceListRequest, 'items'>> {}

// Distance Rates (أسعار المسافات)
export interface DistanceRate extends BaseEntity {
  fromKm: number;
  toKm: number;
  rate: number;
  ratePerKm?: number;
  description?: string;
  descriptionAr?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateDistanceRateRequest {
  fromKm: number;
  toKm: number;
  rate: number;
  ratePerKm?: number;
  description?: string;
  descriptionAr?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateDistanceRateRequest extends Partial<CreateDistanceRateRequest> {}

// Mixer Types (أنواع الخلاطات)
export interface MixerType extends BaseEntity {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  code: string;
  capacity?: number;
  capacityUnit: string;
  capacityUnitAr: string;
  pricePerBatch?: number;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateMixerTypeRequest {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  code: string;
  capacity?: number;
  capacityUnit?: string;
  capacityUnitAr?: string;
  pricePerBatch?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateMixerTypeRequest extends Partial<CreateMixerTypeRequest> {}

// Lookup Categories & Items (جداول البحث)
export interface LookupItem extends BaseEntity {
  categoryId: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  code: string;
  value?: string;
  icon?: string;
  color?: string;
  metadata?: Record<string, unknown>;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export interface CreateLookupItemRequest {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  code: string;
  value?: string;
  icon?: string;
  color?: string;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface UpdateLookupItemRequest extends Partial<CreateLookupItemRequest> {}

export interface LookupCategory extends BaseEntity {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  code: string;
  isActive: boolean;
  isSystem: boolean;
  items?: LookupItem[];
}

export interface CreateLookupCategoryRequest {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  code: string;
  isActive?: boolean;
  isSystem?: boolean;
  items?: CreateLookupItemRequest[];
}

export interface UpdateLookupCategoryRequest extends Partial<Omit<CreateLookupCategoryRequest, 'items'>> {}

// System Settings (إعدادات النظام)
export interface SystemSetting extends BaseEntity {
  key: string;
  value: string;
  type: SettingType;
  category: string;
  label: string;
  labelAr: string;
  description?: string;
  descriptionAr?: string;
  isRequired: boolean;
  validationRule?: string;
  inputType: string;
  options?: Array<{ value: string; label: string; labelAr: string }>;
  isSystem: boolean;
  isPublic: boolean;
}

export interface CreateSystemSettingRequest {
  key: string;
  value: string;
  type?: SettingType;
  category?: string;
  label: string;
  labelAr: string;
  description?: string;
  descriptionAr?: string;
  isRequired?: boolean;
  validationRule?: string;
  inputType?: string;
  options?: Array<{ value: string; label: string; labelAr: string }>;
  isSystem?: boolean;
  isPublic?: boolean;
}

export interface UpdateSystemSettingRequest {
  value: string;
  label?: string;
  labelAr?: string;
  description?: string;
  descriptionAr?: string;
  inputType?: string;
  options?: Array<{ value: string; label: string; labelAr: string }>;
}

export interface BulkUpdateSettingsRequest {
  settings: Array<{ key: string; value: string }>;
}
