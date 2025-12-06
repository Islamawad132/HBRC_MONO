// ============================================
// SERVICES - Central Export
// ============================================

// HTTP Client
export { httpClient } from './httpclient';
export type { ApiResponse, ApiError } from './httpclient';

// Auth Service
export { authService } from './auth.service';
export { default as AuthService } from './auth.service';

// Customers Service
export { customersService } from './customers.service';
export { default as CustomersService } from './customers.service';

// Employees Service
export { employeesService } from './employees.service';
export { default as EmployeesService } from './employees.service';

// Services Service
export { servicesService } from './services.service';
export { default as ServicesService } from './services.service';

// Requests Service
export { requestsService } from './requests.service';
export { default as RequestsService } from './requests.service';

// Invoices Service
export { invoicesService } from './invoices.service';
export { default as InvoicesService } from './invoices.service';

// Payments Service
export { paymentsService } from './payments.service';
export { default as PaymentsService } from './payments.service';

// Documents Service
export { documentsService } from './documents.service';
export { default as DocumentsService } from './documents.service';

// Notifications Service
export { notificationsService } from './notifications.service';
export { default as NotificationsService } from './notifications.service';

// Dashboard Service
export { dashboardService } from './dashboard.service';
export { default as DashboardService } from './dashboard.service';

// Roles Service
export { rolesService } from './roles.service';
export { default as RolesService } from './roles.service';

// Audit Service
export { auditService } from './audit.service';
export { default as AuditService } from './audit.service';

// Socket Service (Real-time notifications)
export { socketService } from './socket.service';
export { default as SocketService } from './socket.service';

// Settings Service
export { settingsService } from './settings.service';
export { default as SettingsService } from './settings.service';
