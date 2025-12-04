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

  // Create all 29 employee roles with bilingual names
  console.log('Creating employee roles...');
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

  for (const role of employeeRoles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { nameAr: role.nameAr, description: role.description },
      create: {
        name: role.name,
        nameAr: role.nameAr,
        description: role.description,
        isAdmin: false,
      },
    });
  }
  console.log(`Created/updated ${employeeRoles.length} employee roles`);

  // Create admin employee
  console.log('Creating admin employee...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminEmployee = await prisma.employee.upsert({
    where: { email: 'admin@hbrc.com' },
    update: { roleId: adminRole.id },
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
      isActive: true,
    },
  });
  console.log(`Admin employee created/updated: ${adminEmployee.email}`);

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
