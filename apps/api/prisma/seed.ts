import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Define all initial permissions
const initialPermissions = [
  // Users permissions
  { module: 'users', action: 'create', description: 'Create new users' },
  { module: 'users', action: 'read', description: 'View users' },
  { module: 'users', action: 'update', description: 'Update users' },
  { module: 'users', action: 'delete', description: 'Delete users' },

  // Roles permissions
  { module: 'roles', action: 'create', description: 'Create new roles' },
  { module: 'roles', action: 'read', description: 'View roles' },
  { module: 'roles', action: 'update', description: 'Update roles' },
  { module: 'roles', action: 'delete', description: 'Delete roles' },

  // Permissions permissions
  { module: 'permissions', action: 'create', description: 'Create new permissions' },
  { module: 'permissions', action: 'read', description: 'View permissions' },
  { module: 'permissions', action: 'update', description: 'Update permissions' },
  { module: 'permissions', action: 'delete', description: 'Delete permissions' },

  // Employees permissions
  { module: 'employees', action: 'create', description: 'Create new employees' },
  { module: 'employees', action: 'read', description: 'View employees' },
  { module: 'employees', action: 'update', description: 'Update employees' },
  { module: 'employees', action: 'delete', description: 'Delete employees' },

  // Customers permissions
  { module: 'customers', action: 'create', description: 'Create new customers' },
  { module: 'customers', action: 'read', description: 'View customers' },
  { module: 'customers', action: 'update', description: 'Update customers' },
  { module: 'customers', action: 'delete', description: 'Delete customers' },

  // Services permissions
  { module: 'services', action: 'create', description: 'Create new services' },
  { module: 'services', action: 'read', description: 'View services' },
  { module: 'services', action: 'update', description: 'Update services' },
  { module: 'services', action: 'delete', description: 'Delete services' },

  // Service Requests permissions
  { module: 'requests', action: 'create', description: 'Create new service requests' },
  { module: 'requests', action: 'read', description: 'View service requests' },
  { module: 'requests', action: 'update', description: 'Update service requests' },
  { module: 'requests', action: 'update-status', description: 'Update request status' },
  { module: 'requests', action: 'assign', description: 'Assign employees to requests' },
  { module: 'requests', action: 'delete', description: 'Delete service requests' },

  // Invoices permissions
  { module: 'invoices', action: 'create', description: 'Create new invoices' },
  { module: 'invoices', action: 'read', description: 'View invoices' },
  { module: 'invoices', action: 'update', description: 'Update invoices' },
  { module: 'invoices', action: 'delete', description: 'Delete invoices' },

  // Payments permissions
  { module: 'payments', action: 'create', description: 'Create new payments' },
  { module: 'payments', action: 'read', description: 'View payments' },
  { module: 'payments', action: 'update', description: 'Update payments' },
  { module: 'payments', action: 'delete', description: 'Delete payments' },

  // Lab Tests permissions
  { module: 'lab-tests', action: 'create', description: 'Create lab test requests' },
  { module: 'lab-tests', action: 'read', description: 'View lab test requests' },
  { module: 'lab-tests', action: 'update', description: 'Update lab test requests' },
  { module: 'lab-tests', action: 'delete', description: 'Delete lab test requests' },
  { module: 'lab-tests', action: 'approve', description: 'Approve lab test requests' },
  { module: 'lab-tests', action: 'receive-samples', description: 'Receive and register samples' },
  { module: 'lab-tests', action: 'conduct-tests', description: 'Conduct lab tests' },
  { module: 'lab-tests', action: 'issue-certificate', description: 'Issue test certificates' },

  // Station Approval permissions
  { module: 'stations', action: 'create', description: 'Create station approval requests' },
  { module: 'stations', action: 'read', description: 'View station approval requests' },
  { module: 'stations', action: 'update', description: 'Update station approval requests' },
  { module: 'stations', action: 'delete', description: 'Delete station approval requests' },
  { module: 'stations', action: 'approve', description: 'Approve station requests' },

  // Consultancy Inspections permissions
  { module: 'consultancy', action: 'create', description: 'Create consultancy requests' },
  { module: 'consultancy', action: 'read', description: 'View consultancy requests' },
  { module: 'consultancy', action: 'update', description: 'Update consultancy requests' },
  { module: 'consultancy', action: 'delete', description: 'Delete consultancy requests' },
  { module: 'consultancy', action: 'assign-engineer', description: 'Assign engineer to site visit' },
  { module: 'consultancy', action: 'conduct-visit', description: 'Conduct site visit' },
  { module: 'consultancy', action: 'review-report', description: 'Review inspection report' },
  { module: 'consultancy', action: 'approve-report', description: 'Approve inspection report' },

  // Fire Safety permissions
  { module: 'fire-safety', action: 'create', description: 'Create fire safety requests' },
  { module: 'fire-safety', action: 'read', description: 'View fire safety requests' },
  { module: 'fire-safety', action: 'update', description: 'Update fire safety requests' },
  { module: 'fire-safety', action: 'delete', description: 'Delete fire safety requests' },
  { module: 'fire-safety', action: 'approve', description: 'Approve fire safety certificates' },

  // Publishing permissions
  { module: 'publishing', action: 'create', description: 'Create publishing requests' },
  { module: 'publishing', action: 'read', description: 'View publishing requests' },
  { module: 'publishing', action: 'update', description: 'Update publishing requests' },
  { module: 'publishing', action: 'delete', description: 'Delete publishing requests' },
  { module: 'publishing', action: 'manage-content', description: 'Manage digital content' },

  // Green Building permissions
  { module: 'green-building', action: 'create', description: 'Create green building certification requests' },
  { module: 'green-building', action: 'read', description: 'View green building certification requests' },
  { module: 'green-building', action: 'update', description: 'Update green building certification requests' },
  { module: 'green-building', action: 'delete', description: 'Delete green building certification requests' },
  { module: 'green-building', action: 'audit', description: 'Conduct green building audit' },
  { module: 'green-building', action: 'review', description: 'Review audit report' },
  { module: 'green-building', action: 'approve-certificate', description: 'Approve green building certificate' },
  { module: 'green-building', action: 'manage-experts', description: 'Manage certified experts list' },

  // Energy Efficiency permissions
  { module: 'energy-efficiency', action: 'create', description: 'Create energy efficiency requests' },
  { module: 'energy-efficiency', action: 'read', description: 'View energy efficiency requests' },
  { module: 'energy-efficiency', action: 'update', description: 'Update energy efficiency requests' },
  { module: 'energy-efficiency', action: 'delete', description: 'Delete energy efficiency requests' },
  { module: 'energy-efficiency', action: 'approve', description: 'Approve energy efficiency certificates' },

  // Carbon Footprint permissions
  { module: 'carbon-footprint', action: 'create', description: 'Create carbon footprint requests' },
  { module: 'carbon-footprint', action: 'read', description: 'View carbon footprint requests' },
  { module: 'carbon-footprint', action: 'update', description: 'Update carbon footprint requests' },
  { module: 'carbon-footprint', action: 'delete', description: 'Delete carbon footprint requests' },
  { module: 'carbon-footprint', action: 'calculate', description: 'Calculate carbon footprint' },
  { module: 'carbon-footprint', action: 'approve', description: 'Approve carbon footprint certificates' },

  // Events permissions
  { module: 'events', action: 'create', description: 'Create events' },
  { module: 'events', action: 'read', description: 'View events' },
  { module: 'events', action: 'update', description: 'Update events' },
  { module: 'events', action: 'delete', description: 'Delete events' },
  { module: 'events', action: 'manage-registrations', description: 'Manage event registrations' },
  { module: 'events', action: 'approve', description: 'Approve event certificates' },

  // Marketing permissions
  { module: 'marketing', action: 'create', description: 'Create marketing campaigns' },
  { module: 'marketing', action: 'read', description: 'View marketing data' },
  { module: 'marketing', action: 'update', description: 'Update marketing campaigns' },
  { module: 'marketing', action: 'delete', description: 'Delete marketing campaigns' },
  { module: 'marketing', action: 'manage-crm', description: 'Manage CRM activities' },

  // Finance permissions
  { module: 'finance', action: 'read', description: 'View financial data' },
  { module: 'finance', action: 'manage-payments', description: 'Manage payments and invoices' },
  { module: 'finance', action: 'generate-reports', description: 'Generate financial reports' },

  // Customer Service permissions
  { module: 'customer-service', action: 'read', description: 'View customer inquiries' },
  { module: 'customer-service', action: 'respond', description: 'Respond to customer inquiries' },
  { module: 'customer-service', action: 'manage-tickets', description: 'Manage support tickets' },

  // Training permissions
  { module: 'training', action: 'create', description: 'Create training sessions' },
  { module: 'training', action: 'read', description: 'View training sessions' },
  { module: 'training', action: 'update', description: 'Update training sessions' },
  { module: 'training', action: 'delete', description: 'Delete training sessions' },
  { module: 'training', action: 'conduct', description: 'Conduct training sessions' },

  // Reports permissions
  { module: 'reports', action: 'read', description: 'View system reports' },
  { module: 'reports', action: 'generate', description: 'Generate custom reports' },
  { module: 'reports', action: 'export', description: 'Export reports' },

  // Documents permissions
  { module: 'documents', action: 'create', description: 'Upload new documents' },
  { module: 'documents', action: 'read', description: 'View documents' },
  { module: 'documents', action: 'update', description: 'Update document metadata' },
  { module: 'documents', action: 'delete', description: 'Delete documents' },

  // Notifications permissions
  { module: 'notifications', action: 'create', description: 'Create notifications' },
  { module: 'notifications', action: 'read', description: 'View notifications' },
  { module: 'notifications', action: 'delete', description: 'Delete notifications' },

  // Audit permissions
  { module: 'audit', action: 'read', description: 'View audit logs' },
  { module: 'audit', action: 'export', description: 'Export audit logs' },

  // Dashboard permissions
  { module: 'dashboard', action: 'read', description: 'View dashboard' },
  { module: 'dashboard', action: 'read-all', description: 'View all statistics' },

  // Settings permissions
  { module: 'settings', action: 'create', description: 'Create settings/lookup items' },
  { module: 'settings', action: 'read', description: 'View settings/lookup items' },
  { module: 'settings', action: 'update', description: 'Update settings/lookup items' },
  { module: 'settings', action: 'delete', description: 'Delete settings/lookup items' },
];

async function main() {
  console.log('Starting seed...');

  // Create all permissions
  console.log('Creating permissions...');
  for (const perm of initialPermissions) {
    const name = `${perm.module}:${perm.action}`;
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: {
        name,
        module: perm.module,
        action: perm.action,
        description: perm.description,
      },
    });
  }
  console.log(`Created ${initialPermissions.length} permissions`);

  // Create Admin role
  console.log('Creating Admin role...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: { isAdmin: true },
    create: {
      name: 'Admin',
      description: 'Administrator with full access to all features',
      isAdmin: true,
    },
  });
  console.log(`Admin role created/updated: ${adminRole.id}`);

  // Create default User role
  console.log('Creating User role...');
  const userRole = await prisma.role.upsert({
    where: { name: 'User' },
    update: {},
    create: {
      name: 'User',
      description: 'Default user role with limited access',
      isAdmin: false,
    },
  });
  console.log(`User role created/updated: ${userRole.id}`);

  // Create all 29 employee roles with bilingual names and their permissions
  console.log('Creating employee roles with permissions...');

  // Define role permissions mapping (role name -> array of permission names)
  const rolePermissionsMap: Record<string, string[]> = {
    'System Administrator': [
      'users:create', 'users:read', 'users:update', 'users:delete',
      'roles:create', 'roles:read', 'roles:update', 'roles:delete',
      'permissions:read',
      'employees:create', 'employees:read', 'employees:update', 'employees:delete',
      'settings:create', 'settings:read', 'settings:update', 'settings:delete',
      'audit:read', 'audit:export',
      'dashboard:read', 'dashboard:read-all',
    ],
    'Lab Manager': [
      'lab-tests:create', 'lab-tests:read', 'lab-tests:update', 'lab-tests:delete',
      'lab-tests:approve', 'lab-tests:receive-samples', 'lab-tests:conduct-tests', 'lab-tests:issue-certificate',
      'employees:read',
      'customers:read',
      'requests:read', 'requests:update-status', 'requests:assign',
      'documents:create', 'documents:read', 'documents:update',
      'reports:read', 'reports:generate',
      'dashboard:read',
    ],
    'Sample Receiver': [
      'lab-tests:read', 'lab-tests:receive-samples',
      'customers:read',
      'requests:read', 'requests:update-status',
      'documents:create', 'documents:read',
      'dashboard:read',
    ],
    'Lab Analyst': [
      'lab-tests:read', 'lab-tests:conduct-tests',
      'requests:read', 'requests:update-status',
      'documents:create', 'documents:read',
      'dashboard:read',
    ],
    'Chief Engineer': [
      'consultancy:read', 'consultancy:update', 'consultancy:review-report', 'consultancy:approve-report',
      'requests:read', 'requests:update-status',
      'employees:read',
      'documents:create', 'documents:read', 'documents:update',
      'reports:read', 'reports:generate',
      'dashboard:read',
    ],
    'Project Engineer': [
      'consultancy:read', 'consultancy:conduct-visit',
      'requests:read', 'requests:update-status',
      'documents:create', 'documents:read',
      'dashboard:read',
    ],
    'Committee Head': [
      'stations:read', 'stations:update', 'stations:approve',
      'requests:read', 'requests:update-status',
      'employees:read',
      'documents:create', 'documents:read', 'documents:update',
      'reports:read',
      'dashboard:read',
    ],
    'Committee Member': [
      'stations:read',
      'requests:read',
      'documents:read',
      'dashboard:read',
    ],
    'Committee Secretary': [
      'stations:read', 'stations:update',
      'requests:read',
      'documents:create', 'documents:read', 'documents:update',
      'dashboard:read',
    ],
    'Green Building Auditor': [
      'green-building:read', 'green-building:audit',
      'requests:read', 'requests:update-status',
      'documents:create', 'documents:read',
      'dashboard:read',
    ],
    'Green Building Reviewer': [
      'green-building:read', 'green-building:review',
      'requests:read', 'requests:update-status',
      'documents:create', 'documents:read', 'documents:update',
      'dashboard:read',
    ],
    'Green Building Certificate Approver': [
      'green-building:read', 'green-building:approve-certificate', 'green-building:manage-experts',
      'requests:read', 'requests:update-status',
      'documents:create', 'documents:read', 'documents:update',
      'reports:read',
      'dashboard:read',
    ],
    'Certified Expert': [
      'green-building:read', 'green-building:audit',
      'consultancy:read', 'consultancy:conduct-visit',
      'requests:read',
      'documents:create', 'documents:read',
      'dashboard:read',
    ],
    'Publishing Manager': [
      'publishing:create', 'publishing:read', 'publishing:update', 'publishing:delete', 'publishing:manage-content',
      'documents:create', 'documents:read', 'documents:update', 'documents:delete',
      'reports:read',
      'dashboard:read',
    ],
    'Events Manager': [
      'events:create', 'events:read', 'events:update', 'events:delete',
      'events:manage-registrations', 'events:approve',
      'customers:read',
      'documents:create', 'documents:read', 'documents:update',
      'reports:read',
      'dashboard:read',
    ],
    'Head of Marketing': [
      'marketing:create', 'marketing:read', 'marketing:update', 'marketing:delete', 'marketing:manage-crm',
      'customers:read',
      'events:read',
      'publishing:read',
      'reports:read', 'reports:generate',
      'dashboard:read', 'dashboard:read-all',
    ],
    'Growth Lead': [
      'marketing:create', 'marketing:read', 'marketing:update',
      'customers:read',
      'reports:read',
      'dashboard:read',
    ],
    'Content Lead': [
      'marketing:read', 'marketing:update',
      'publishing:create', 'publishing:read', 'publishing:update', 'publishing:manage-content',
      'documents:create', 'documents:read', 'documents:update',
      'dashboard:read',
    ],
    'CRM Lead': [
      'marketing:read', 'marketing:manage-crm',
      'customers:read', 'customers:update',
      'customer-service:read', 'customer-service:manage-tickets',
      'reports:read',
      'dashboard:read',
    ],
    'PR Lead': [
      'marketing:read', 'marketing:update',
      'events:read',
      'publishing:read',
      'dashboard:read',
    ],
    'Marketing Operations': [
      'marketing:read', 'marketing:update',
      'events:read', 'events:update',
      'reports:read',
      'dashboard:read',
    ],
    'Customer Service': [
      'customer-service:read', 'customer-service:respond', 'customer-service:manage-tickets',
      'customers:read',
      'requests:read',
      'invoices:read',
      'payments:read',
      'notifications:create', 'notifications:read',
      'dashboard:read',
    ],
    'Accountant': [
      'finance:read', 'finance:manage-payments', 'finance:generate-reports',
      'invoices:create', 'invoices:read', 'invoices:update',
      'payments:create', 'payments:read', 'payments:update',
      'customers:read',
      'requests:read',
      'reports:read', 'reports:generate', 'reports:export',
      'dashboard:read',
    ],
    'Trainer': [
      'training:create', 'training:read', 'training:update', 'training:delete', 'training:conduct',
      'events:read',
      'documents:create', 'documents:read',
      'dashboard:read',
    ],
    'Stations Manager': [
      'stations:create', 'stations:read', 'stations:update', 'stations:delete', 'stations:approve',
      'requests:read', 'requests:update-status', 'requests:assign',
      'employees:read',
      'customers:read',
      'documents:create', 'documents:read', 'documents:update',
      'reports:read', 'reports:generate',
      'dashboard:read',
    ],
    'Consultancy Manager': [
      'consultancy:create', 'consultancy:read', 'consultancy:update', 'consultancy:delete',
      'consultancy:assign-engineer', 'consultancy:conduct-visit', 'consultancy:review-report', 'consultancy:approve-report',
      'requests:read', 'requests:update-status', 'requests:assign',
      'employees:read',
      'customers:read',
      'documents:create', 'documents:read', 'documents:update',
      'reports:read', 'reports:generate',
      'dashboard:read',
    ],
    'Fire Safety Manager': [
      'fire-safety:create', 'fire-safety:read', 'fire-safety:update', 'fire-safety:delete', 'fire-safety:approve',
      'requests:read', 'requests:update-status', 'requests:assign',
      'employees:read',
      'customers:read',
      'documents:create', 'documents:read', 'documents:update',
      'reports:read', 'reports:generate',
      'dashboard:read',
    ],
    'Energy Efficiency Manager': [
      'energy-efficiency:create', 'energy-efficiency:read', 'energy-efficiency:update', 'energy-efficiency:delete', 'energy-efficiency:approve',
      'requests:read', 'requests:update-status', 'requests:assign',
      'employees:read',
      'customers:read',
      'documents:create', 'documents:read', 'documents:update',
      'reports:read', 'reports:generate',
      'dashboard:read',
    ],
    'Carbon Footprint Manager': [
      'carbon-footprint:create', 'carbon-footprint:read', 'carbon-footprint:update', 'carbon-footprint:delete',
      'carbon-footprint:calculate', 'carbon-footprint:approve',
      'requests:read', 'requests:update-status', 'requests:assign',
      'employees:read',
      'customers:read',
      'documents:create', 'documents:read', 'documents:update',
      'reports:read', 'reports:generate',
      'dashboard:read',
    ],
    'User': [
      'dashboard:read',
      'requests:read',
      'documents:read',
      'notifications:read',
    ],
  };

  const employeeRoles = [
    { name: 'System Administrator', nameAr: 'مدير النظام', description: 'Full access to system configuration' },
    { name: 'Lab Manager', nameAr: 'مدير المعمل', description: 'Manages lab operations and staff' },
    { name: 'Sample Receiver', nameAr: 'مستقبل العينات', description: 'Receives and registers test samples' },
    { name: 'Lab Analyst', nameAr: 'فني المعمل', description: 'Conducts laboratory tests' },
    { name: 'Chief Engineer', nameAr: 'مهندس رئيسي', description: 'Reviews and approves technical reports' },
    { name: 'Project Engineer', nameAr: 'مهندس المشروع', description: 'Conducts site visits and inspections' },
    { name: 'Committee Head', nameAr: 'رئيس اللجنة', description: 'Leads technical committees' },
    { name: 'Committee Member', nameAr: 'عضو لجنة', description: 'Participates in technical evaluations' },
    { name: 'Committee Secretary', nameAr: 'أمين لجنة', description: 'Documents committee decisions' },
    { name: 'Green Building Auditor', nameAr: 'مدقق المباني الخضراء', description: 'Conducts green building audits' },
    { name: 'Green Building Reviewer', nameAr: 'مراجع تدقيق المباني الخضراء', description: 'Reviews audit reports' },
    { name: 'Green Building Certificate Approver', nameAr: 'معتمد شهادات المباني الخضراء', description: 'Approves certificates' },
    { name: 'Certified Expert', nameAr: 'خبير معتمد', description: 'Authorized green building consultant' },
    { name: 'Publishing Manager', nameAr: 'مدير النشر', description: 'Manages digital publications' },
    { name: 'Events Manager', nameAr: 'مدير الفعاليات', description: 'Manages conferences and exhibitions' },
    { name: 'Head of Marketing', nameAr: 'رئيس التسويق', description: 'Leads marketing strategy' },
    { name: 'Growth Lead', nameAr: 'مسؤول النمو', description: 'Manages growth initiatives' },
    { name: 'Content Lead', nameAr: 'مسؤول المحتوى', description: 'Manages content strategy' },
    { name: 'CRM Lead', nameAr: 'مسؤول CRM', description: 'Manages customer relationships' },
    { name: 'PR Lead', nameAr: 'مسؤول العلاقات العامة', description: 'Manages public relations' },
    { name: 'Marketing Operations', nameAr: 'مسؤول العمليات التسويقية', description: 'Manages marketing operations' },
    { name: 'Customer Service', nameAr: 'خدمة العملاء', description: 'Handles customer inquiries' },
    { name: 'Accountant', nameAr: 'المحاسب', description: 'Manages financial transactions' },
    { name: 'Trainer', nameAr: 'المدرب', description: 'Conducts training sessions' },
    { name: 'Stations Manager', nameAr: 'مدير المحطات', description: 'Manages station approvals' },
    { name: 'Consultancy Manager', nameAr: 'مدير الاستشارات', description: 'Manages consultancy services' },
    { name: 'Fire Safety Manager', nameAr: 'مدير السلامة', description: 'Manages fire safety certifications' },
    { name: 'Energy Efficiency Manager', nameAr: 'مدير كفاءة الطاقة', description: 'Manages energy certificates' },
    { name: 'Carbon Footprint Manager', nameAr: 'مدير البصمة الكربونية', description: 'Manages carbon calculations' },
  ];

  // Get all permissions from database for lookup
  const allPermissions = await prisma.permission.findMany();
  const permissionMap = new Map(allPermissions.map(p => [p.name, p.id]));

  for (const role of employeeRoles) {
    // Create or update the role
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: { nameAr: role.nameAr, description: role.description },
      create: {
        name: role.name,
        nameAr: role.nameAr,
        description: role.description,
        isAdmin: false,
      },
    });

    // Get permissions for this role
    const rolePermissions = rolePermissionsMap[role.name] || [];

    // Delete existing role permissions to avoid duplicates
    await prisma.rolePermission.deleteMany({
      where: { roleId: createdRole.id },
    });

    // Create new role permissions
    for (const permName of rolePermissions) {
      const permissionId = permissionMap.get(permName);
      if (permissionId) {
        await prisma.rolePermission.create({
          data: {
            roleId: createdRole.id,
            permissionId: permissionId,
          },
        });
      } else {
        console.warn(`Permission not found: ${permName}`);
      }
    }
  }

  // Also assign permissions to User role
  const defaultUserRole = await prisma.role.findUnique({ where: { name: 'User' } });
  if (defaultUserRole) {
    const userPermissions = rolePermissionsMap['User'] || [];
    await prisma.rolePermission.deleteMany({ where: { roleId: defaultUserRole.id } });
    for (const permName of userPermissions) {
      const permissionId = permissionMap.get(permName);
      if (permissionId) {
        await prisma.rolePermission.create({
          data: {
            roleId: defaultUserRole.id,
            permissionId: permissionId,
          },
        });
      }
    }
  }

  console.log(`Created/updated ${employeeRoles.length} employee roles with permissions`);

  // Create admin employee
  console.log('Creating admin employee...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminEmployee = await prisma.employee.upsert({
    where: { email: 'admin@hbrc.com' },
    update: { roleId: adminRole.id, status: 'ACTIVE' },
    create: {
      email: 'admin@hbrc.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      employeeId: 'EMP-ADMIN-001',
      department: 'IT',
      position: 'System Administrator',
      institute: 'HBRC',
      roleId: adminRole.id,
      status: 'ACTIVE',
      language: 'ar',
      notifications: true,
    },
  });
  console.log(`Admin employee created/updated: ${adminEmployee.email}`);

  // Create System Settings
  console.log('Creating system settings...');
  const systemSettings = [
    // File Upload Settings
    {
      key: 'max_file_size_mb',
      value: '10',
      type: 'NUMBER',
      category: 'files',
      label: 'Maximum File Size (MB)',
      labelAr: 'الحد الأقصى لحجم الملف (ميجابايت)',
      description: 'Maximum allowed file size for uploads in megabytes',
      descriptionAr: 'الحد الأقصى المسموح به لحجم الملف المرفوع بالميجابايت',
      isRequired: true,
      inputType: 'number',
      isSystem: true,
      isPublic: false,
    },
    {
      key: 'allowed_file_types',
      value: 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif,zip,rar,txt',
      type: 'STRING',
      category: 'files',
      label: 'Allowed File Types',
      labelAr: 'أنواع الملفات المسموحة',
      description: 'Comma-separated list of allowed file extensions',
      descriptionAr: 'قائمة بامتدادات الملفات المسموحة مفصولة بفاصلة',
      isRequired: true,
      inputType: 'text',
      isSystem: true,
      isPublic: false,
    },
    {
      key: 'max_files_per_request',
      value: '10',
      type: 'NUMBER',
      category: 'files',
      label: 'Maximum Files Per Request',
      labelAr: 'الحد الأقصى للملفات لكل طلب',
      description: 'Maximum number of files that can be uploaded per request',
      descriptionAr: 'الحد الأقصى لعدد الملفات التي يمكن رفعها لكل طلب',
      isRequired: false,
      inputType: 'number',
      isSystem: true,
      isPublic: false,
    },
    // Company Settings
    {
      key: 'company_name',
      value: 'مركز بحوث الإسكان والبناء',
      type: 'STRING',
      category: 'company',
      label: 'Company Name',
      labelAr: 'اسم الشركة',
      description: 'The official name of the company',
      descriptionAr: 'الاسم الرسمي للشركة',
      isRequired: true,
      inputType: 'text',
      isSystem: true,
      isPublic: true,
    },
    {
      key: 'company_name_en',
      value: 'Housing and Building Research Center',
      type: 'STRING',
      category: 'company',
      label: 'Company Name (English)',
      labelAr: 'اسم الشركة (إنجليزي)',
      description: 'The official name of the company in English',
      descriptionAr: 'الاسم الرسمي للشركة بالإنجليزية',
      isRequired: true,
      inputType: 'text',
      isSystem: true,
      isPublic: true,
    },
    {
      key: 'company_email',
      value: 'info@hbrc.gov.eg',
      type: 'STRING',
      category: 'company',
      label: 'Company Email',
      labelAr: 'البريد الإلكتروني للشركة',
      description: 'The official email of the company',
      descriptionAr: 'البريد الإلكتروني الرسمي للشركة',
      isRequired: true,
      inputType: 'email',
      isSystem: true,
      isPublic: true,
    },
    {
      key: 'company_phone',
      value: '+20 2 3761 8600',
      type: 'STRING',
      category: 'company',
      label: 'Company Phone',
      labelAr: 'هاتف الشركة',
      description: 'The official phone number of the company',
      descriptionAr: 'رقم الهاتف الرسمي للشركة',
      isRequired: true,
      inputType: 'text',
      isSystem: true,
      isPublic: true,
    },
    {
      key: 'company_address',
      value: '87 Tahrir St., Dokki, Giza, Egypt',
      type: 'STRING',
      category: 'company',
      label: 'Company Address',
      labelAr: 'عنوان الشركة',
      description: 'The official address of the company',
      descriptionAr: 'العنوان الرسمي للشركة',
      isRequired: true,
      inputType: 'textarea',
      isSystem: true,
      isPublic: true,
    },
    // Finance Settings
    {
      key: 'tax_rate',
      value: '14',
      type: 'NUMBER',
      category: 'finance',
      label: 'Tax Rate (%)',
      labelAr: 'نسبة الضريبة (%)',
      description: 'Default VAT/Tax rate applied to invoices',
      descriptionAr: 'نسبة ضريبة القيمة المضافة الافتراضية على الفواتير',
      isRequired: true,
      inputType: 'number',
      isSystem: true,
      isPublic: false,
    },
    {
      key: 'currency',
      value: 'EGP',
      type: 'STRING',
      category: 'finance',
      label: 'Currency',
      labelAr: 'العملة',
      description: 'Default currency for invoices and payments',
      descriptionAr: 'العملة الافتراضية للفواتير والمدفوعات',
      isRequired: true,
      inputType: 'text',
      isSystem: true,
      isPublic: true,
    },
    {
      key: 'invoice_prefix',
      value: 'INV',
      type: 'STRING',
      category: 'finance',
      label: 'Invoice Prefix',
      labelAr: 'بادئة الفاتورة',
      description: 'Prefix for invoice numbers',
      descriptionAr: 'البادئة المستخدمة في أرقام الفواتير',
      isRequired: true,
      inputType: 'text',
      isSystem: true,
      isPublic: false,
    },
    // Payment Settings
    {
      key: 'bank_name',
      value: 'National Bank of Egypt',
      type: 'STRING',
      category: 'payment',
      label: 'Bank Name',
      labelAr: 'اسم البنك',
      description: 'Bank name for bank transfer payments',
      descriptionAr: 'اسم البنك للتحويلات البنكية',
      isRequired: false,
      inputType: 'text',
      isSystem: true,
      isPublic: true,
    },
    {
      key: 'bank_account_name',
      value: 'Housing and Building Research Center',
      type: 'STRING',
      category: 'payment',
      label: 'Bank Account Name',
      labelAr: 'اسم الحساب البنكي',
      description: 'Account holder name for bank transfers',
      descriptionAr: 'اسم صاحب الحساب للتحويلات البنكية',
      isRequired: false,
      inputType: 'text',
      isSystem: true,
      isPublic: true,
    },
    {
      key: 'bank_account_number',
      value: '1234567890123',
      type: 'STRING',
      category: 'payment',
      label: 'Bank Account Number',
      labelAr: 'رقم الحساب البنكي',
      description: 'Bank account number for transfers',
      descriptionAr: 'رقم الحساب البنكي للتحويلات',
      isRequired: false,
      inputType: 'text',
      isSystem: true,
      isPublic: true,
    },
    {
      key: 'bank_iban',
      value: 'EG380001000001234567890123',
      type: 'STRING',
      category: 'payment',
      label: 'Bank IBAN',
      labelAr: 'رقم IBAN',
      description: 'IBAN number for international transfers',
      descriptionAr: 'رقم IBAN للتحويلات الدولية',
      isRequired: false,
      inputType: 'text',
      isSystem: true,
      isPublic: true,
    },
    {
      key: 'vodafone_cash_number',
      value: '01012345678',
      type: 'STRING',
      category: 'payment',
      label: 'Vodafone Cash Number',
      labelAr: 'رقم فودافون كاش',
      description: 'Vodafone Cash wallet number for mobile payments',
      descriptionAr: 'رقم محفظة فودافون كاش للدفع بالموبايل',
      isRequired: false,
      inputType: 'text',
      isSystem: true,
      isPublic: true,
    },
    // System Settings
    {
      key: 'session_timeout_minutes',
      value: '60',
      type: 'NUMBER',
      category: 'system',
      label: 'Session Timeout (Minutes)',
      labelAr: 'مهلة انتهاء الجلسة (دقائق)',
      description: 'Time in minutes before an inactive session expires',
      descriptionAr: 'الوقت بالدقائق قبل انتهاء صلاحية الجلسة غير النشطة',
      isRequired: true,
      inputType: 'number',
      isSystem: true,
      isPublic: false,
    },
    {
      key: 'password_min_length',
      value: '6',
      type: 'NUMBER',
      category: 'system',
      label: 'Minimum Password Length',
      labelAr: 'الحد الأدنى لطول كلمة المرور',
      description: 'Minimum number of characters required for passwords',
      descriptionAr: 'الحد الأدنى لعدد الأحرف المطلوبة في كلمة المرور',
      isRequired: true,
      inputType: 'number',
      isSystem: true,
      isPublic: false,
    },
    {
      key: 'enable_email_verification',
      value: 'true',
      type: 'BOOLEAN',
      category: 'system',
      label: 'Enable Email Verification',
      labelAr: 'تفعيل التحقق من البريد الإلكتروني',
      description: 'Require email verification for new accounts',
      descriptionAr: 'طلب التحقق من البريد الإلكتروني للحسابات الجديدة',
      isRequired: false,
      inputType: 'toggle',
      isSystem: true,
      isPublic: false,
    },
    {
      key: 'maintenance_mode',
      value: 'false',
      type: 'BOOLEAN',
      category: 'system',
      label: 'Maintenance Mode',
      labelAr: 'وضع الصيانة',
      description: 'Enable maintenance mode to temporarily disable the system',
      descriptionAr: 'تفعيل وضع الصيانة لتعطيل النظام مؤقتاً',
      isRequired: false,
      inputType: 'toggle',
      isSystem: true,
      isPublic: true,
    },
  ];

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {
        value: setting.value,
        label: setting.label,
        labelAr: setting.labelAr,
        description: setting.description,
        descriptionAr: setting.descriptionAr,
      },
      create: setting as any,
    });
  }
  console.log(`Created/updated ${systemSettings.length} system settings`);

  console.log('Seed completed successfully!');
  console.log('\n--- Admin Credentials (Employee) ---');
  console.log('Email: admin@hbrc.com');
  console.log('Password: admin123');
  console.log('Login via: POST /auth/employee/login');
  console.log('------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
