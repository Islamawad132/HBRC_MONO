# HBRC CRM System - Core Modules & OOP Architecture

## Overview
نظام CRM شامل لإدارة خدمات المركز القومي لبحوث الإسكان والبناء

---

## 🏗️ Core Modules (الموديولز الأساسية)

### 1️⃣ **Authentication & Authorization Module** (إدارة المستخدمين والصلاحيات)
```typescript
// Core Entities
- User (المستخدم الأساسي)
- Role (الأدوار)
- Permission (الصلاحيات)
- Session (الجلسات)

// Features
- تسجيل الدخول/الخروج
- إدارة الأدوار والصلاحيات
- JWT Authentication
- Multi-factor Authentication (2FA)
```

**OOP Design:**
```typescript
abstract class User {
  id: string;
  email: string;
  password: string;
  role: Role;

  abstract canAccess(permission: string): boolean;
  abstract authenticate(credentials: Credentials): Promise<Session>;
}

class Customer extends User {
  company?: string;
  customerType: 'individual' | 'company';

  canAccess(permission: string): boolean {
    return this.role.hasPermission(permission);
  }
}

class AdminUser extends User {
  isAdmin: true;

  canAccess(permission: string): boolean {
    return true; // Admin has all permissions
  }
}

class Role {
  name: string;
  permissions: Permission[];

  hasPermission(permission: string): boolean {
    return this.permissions.some(p => p.matches(permission));
  }
}
```

---

### 2️⃣ **Service Management Module** (إدارة الخدمات)
```typescript
// Core Services
1. Laboratory Tests (الاختبارات المعملية)
2. Station Accreditation (اعتماد المحطات)
3. Consultancy Services (المعاينات الاستشارية)
4. Elevator Accreditation (اعتماد المصاعد)
5. Hospital Accreditation (اعتماد المستشفيات)
6. Digital Publishing (النشر الرقمي)
7. Fire Safety Accreditation (اعتماد ضد الحريق)
8. Green Building Certification (الهرم الأخضر)
9. Energy Efficiency Certificate (ترشيد الطاقة)
10. Carbon Footprint (البصمة الكربونية)
11. Events & Conferences (المؤتمرات والندوات)
12. Exhibitions (المعارض)
13. Training Courses (الدورات التدريبية)
```

**OOP Design:**
```typescript
// Base Service Class
abstract class Service {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;

  abstract calculateCost(request: ServiceRequest): Cost;
  abstract validateRequest(request: ServiceRequest): ValidationResult;
  abstract getRequiredDocuments(): Document[];
  abstract getWorkflow(): Workflow;
}

// Specialized Services
class LaboratoryTestService extends Service {
  testTypes: TestType[];
  specimens: Specimen[];
  standards: Standard[];

  calculateCost(request: LabTestRequest): Cost {
    // حساب التكلفة بناءً على نوع الاختبار والعينات
    return this.pricingStrategy.calculate(request);
  }

  validateRequest(request: LabTestRequest): ValidationResult {
    return this.validator.validate(request);
  }
}

class StationAccreditationService extends Service {
  mixerTypes: MixerType[];
  distanceRates: DistanceRate[];

  calculateCost(request: StationRequest): Cost {
    const baseCost = this.getBaseCost(request);
    const distanceCost = this.calculateDistanceCost(request.distance);
    const mixerCost = this.calculateMixerCost(request.mixers);

    return new Cost(baseCost + distanceCost + mixerCost);
  }
}

class GreenBuildingService extends Service {
  assessmentLevels: AssessmentLevel[];
  certificationStandards: Standard[];

  async submitForReview(project: Project): Promise<ReviewProcess> {
    const workflow = this.getWorkflow();
    return workflow.initiate(project);
  }
}

class TrainingCourseService extends Service {
  courses: Course[];

  async enrollStudent(student: Student, course: Course): Promise<Enrollment> {
    // التسجيل في الدورة
    const enrollment = await this.enrollmentManager.create(student, course);
    await this.paymentProcessor.processPayment(enrollment);
    return enrollment;
  }
}
```

---

### 3️⃣ **Request Management Module** (إدارة الطلبات)
```typescript
// Core Entities
- ServiceRequest (الطلب)
- RequestStatus (حالة الطلب)
- RequestWorkflow (مسار العمل)
- RequestDocument (المستندات)
- RequestHistory (التاريخ)
```

**OOP Design:**
```typescript
abstract class ServiceRequest {
  id: string;
  customer: Customer;
  service: Service;
  status: RequestStatus;
  submittedAt: Date;
  workflow: Workflow;

  abstract submit(): Promise<void>;
  abstract updateStatus(status: RequestStatus): void;
  abstract cancel(): Promise<void>;
  abstract getTimeline(): Timeline[];
}

class LabTestRequest extends ServiceRequest {
  testType: TestType;
  specimen: Specimen;
  standard: Standard;
  documents: Document[];

  async submit(): Promise<void> {
    // Validate
    const validation = await this.service.validateRequest(this);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }

    // Calculate cost
    this.cost = await this.service.calculateCost(this);

    // Process payment
    await this.paymentProcessor.process(this);

    // Start workflow
    this.workflow.start();

    // Notify
    await this.notificationService.notify(this.customer, 'REQUEST_SUBMITTED');
  }
}

class AccreditationRequest extends ServiceRequest {
  projectData: ProjectData;
  documents: Document[];
  visitSchedule: VisitSchedule[];

  async scheduleVisit(date: Date): Promise<Visit> {
    const visit = new Visit(this, date);
    this.visitSchedule.push(visit);
    await visit.save();
    return visit;
  }
}

// State Pattern for Request Status
interface RequestState {
  submit(): void;
  approve(): void;
  reject(): void;
  complete(): void;
}

class DraftState implements RequestState {
  submit() { /* transition to Submitted */ }
  approve() { throw new Error('Cannot approve draft'); }
  reject() { throw new Error('Cannot reject draft'); }
  complete() { throw new Error('Cannot complete draft'); }
}

class SubmittedState implements RequestState {
  submit() { throw new Error('Already submitted'); }
  approve() { /* transition to Approved */ }
  reject() { /* transition to Rejected */ }
  complete() { throw new Error('Not yet approved'); }
}
```

---

### 4️⃣ **Payment Management Module** (إدارة المدفوعات)
```typescript
// Core Entities
- Payment (الدفع)
- Invoice (الفاتورة)
- PaymentMethod (طريقة الدفع)
- Transaction (المعاملة)
```

**OOP Design:**
```typescript
abstract class PaymentMethod {
  abstract process(payment: Payment): Promise<Transaction>;
  abstract refund(transaction: Transaction): Promise<void>;
}

class OnlinePayment extends PaymentMethod {
  provider: 'fawry' | 'instapay';

  async process(payment: Payment): Promise<Transaction> {
    const gateway = this.getGateway();
    const result = await gateway.charge(payment.amount);
    return new Transaction(result);
  }
}

class BankTransfer extends PaymentMethod {
  async process(payment: Payment): Promise<Transaction> {
    // يتطلب رفع إيصال التحويل
    return new Transaction({ status: 'pending_verification' });
  }
}

class PaymentProcessor {
  private strategies: Map<string, PaymentMethod>;

  async processPayment(request: ServiceRequest): Promise<Payment> {
    const invoice = await this.createInvoice(request);
    const method = this.selectPaymentMethod(request.paymentPreference);
    const transaction = await method.process(invoice.payment);

    await this.notificationService.sendReceipt(request.customer, transaction);

    return transaction.payment;
  }

  private createInvoice(request: ServiceRequest): Invoice {
    const cost = request.service.calculateCost(request);
    const tax = this.calculateTax(cost);
    const total = cost.add(tax);

    return new Invoice({
      request,
      subtotal: cost,
      tax,
      total,
      dueDate: this.calculateDueDate()
    });
  }
}
```

---

### 5️⃣ **Document Management Module** (إدارة المستندات)
```typescript
// Core Entities
- Document (المستند)
- DocumentType (نوع المستند)
- DocumentStorage (التخزين)
- DocumentVersion (الإصدار)
```

**OOP Design:**
```typescript
class Document {
  id: string;
  name: string;
  type: DocumentType;
  mimeType: string;
  size: number;
  uploadedBy: User;
  uploadedAt: Date;
  versions: DocumentVersion[];

  async upload(file: File): Promise<void> {
    // Validate file type and size
    this.validate(file);

    // Store file
    const storage = this.getStorage();
    const path = await storage.store(file);

    // Create version
    this.versions.push(new DocumentVersion(path));

    // Index for search
    await this.searchIndexer.index(this);
  }

  async generateQRCode(): Promise<string> {
    const data = {
      documentId: this.id,
      hash: this.generateHash()
    };
    return QRCodeGenerator.generate(data);
  }
}

interface DocumentStorage {
  store(file: File): Promise<string>;
  retrieve(path: string): Promise<File>;
  delete(path: string): Promise<void>;
}

class LocalFileStorage implements DocumentStorage {
  basePath: string;

  async store(file: File): Promise<string> {
    const path = this.generatePath(file);
    await fs.writeFile(path, file.buffer);
    return path;
  }
}

class S3Storage implements DocumentStorage {
  bucket: string;

  async store(file: File): Promise<string> {
    const key = this.generateKey(file);
    await this.s3Client.upload(this.bucket, key, file.buffer);
    return key;
  }
}
```

---

### 6️⃣ **Workflow Management Module** (إدارة مسارات العمل)
```typescript
// Core Entities
- Workflow (مسار العمل)
- WorkflowStep (خطوة)
- WorkflowAction (إجراء)
- WorkflowCondition (شرط)
```

**OOP Design:**
```typescript
class Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  currentStep: WorkflowStep;

  async start(context: WorkflowContext): Promise<void> {
    this.currentStep = this.steps[0];
    await this.currentStep.execute(context);
  }

  async moveToNext(context: WorkflowContext): Promise<void> {
    const nextStep = this.currentStep.getNext(context);
    if (nextStep) {
      this.currentStep = nextStep;
      await nextStep.execute(context);
    } else {
      await this.complete(context);
    }
  }
}

class WorkflowStep {
  id: string;
  name: string;
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
  nextSteps: Map<string, WorkflowStep>;

  async execute(context: WorkflowContext): Promise<void> {
    // Execute all actions
    for (const action of this.actions) {
      await action.execute(context);
    }

    // Notify stakeholders
    await this.notify(context);
  }

  getNext(context: WorkflowContext): WorkflowStep | null {
    // Evaluate conditions to determine next step
    for (const [key, step] of this.nextSteps) {
      const condition = this.conditions.find(c => c.name === key);
      if (condition && condition.evaluate(context)) {
        return step;
      }
    }
    return null;
  }
}

// Example: Laboratory Test Workflow
class LabTestWorkflow extends Workflow {
  constructor() {
    super();
    this.steps = [
      new SubmitRequestStep(),
      new ReviewDocumentsStep(),
      new ScheduleTestStep(),
      new PerformTestStep(),
      new GenerateReportStep(),
      new DeliverResultsStep()
    ];
  }
}
```

---

### 7️⃣ **Notification Module** (إدارة الإشعارات)
```typescript
// Core Entities
- Notification (الإشعار)
- NotificationChannel (القناة)
- NotificationTemplate (القالب)
```

**OOP Design:**
```typescript
abstract class NotificationChannel {
  abstract send(recipient: string, message: string): Promise<void>;
}

class EmailChannel extends NotificationChannel {
  async send(recipient: string, message: string): Promise<void> {
    await this.emailService.send({
      to: recipient,
      subject: message.subject,
      body: message.body
    });
  }
}

class SMSChannel extends NotificationChannel {
  async send(recipient: string, message: string): Promise<void> {
    await this.smsService.send(recipient, message);
  }
}

class WhatsAppChannel extends NotificationChannel {
  async send(recipient: string, message: string): Promise<void> {
    await this.whatsappService.send(recipient, message);
  }
}

class NotificationService {
  private channels: Map<string, NotificationChannel>;
  private templates: Map<string, NotificationTemplate>;

  async notify(
    user: User,
    event: NotificationEvent,
    channels: string[] = ['email']
  ): Promise<void> {
    const template = this.templates.get(event.type);
    const message = template.render(event.data);

    const promises = channels.map(channelName => {
      const channel = this.channels.get(channelName);
      return channel.send(user.contact, message);
    });

    await Promise.all(promises);

    // Log notification
    await this.logNotification(user, event, channels);
  }
}
```

---

### 8️⃣ **Reporting & Analytics Module** (التقارير والتحليلات)
```typescript
// Core Entities
- Report (التقرير)
- Dashboard (لوحة المعلومات)
- Metric (المقياس)
- Chart (الرسم البياني)
```

**OOP Design:**
```typescript
abstract class Report {
  id: string;
  name: string;
  filters: ReportFilter[];

  abstract generate(params: ReportParams): Promise<ReportData>;
  abstract export(format: 'pdf' | 'excel' | 'csv'): Promise<Buffer>;
}

class ServiceReport extends Report {
  async generate(params: ReportParams): Promise<ReportData> {
    const data = await this.dataSource.query({
      from: params.startDate,
      to: params.endDate,
      serviceType: params.serviceType
    });

    return {
      totalRequests: data.length,
      completedRequests: data.filter(r => r.status === 'completed').length,
      revenue: data.reduce((sum, r) => sum + r.amount, 0),
      averageProcessingTime: this.calculateAverage(data.map(r => r.processingTime))
    };
  }
}

class Dashboard {
  widgets: DashboardWidget[];

  async refresh(): Promise<void> {
    const promises = this.widgets.map(w => w.fetchData());
    await Promise.all(promises);
  }
}
```

---

### 9️⃣ **CRM & Marketing Module** (إدارة العملاء والتسويق)
```typescript
// Core Entities
- Lead (العميل المحتمل)
- Customer (العميل)
- Campaign (الحملة)
- Journey (رحلة العميل)
```

**OOP Design:**
```typescript
class Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  score: number;
  status: LeadStatus;

  async qualify(): Promise<boolean> {
    this.score = await this.calculateScore();
    return this.score >= this.qualificationThreshold;
  }

  async convertToCustomer(): Promise<Customer> {
    if (await this.qualify()) {
      const customer = new Customer(this);
      await customer.save();
      this.status = 'converted';
      return customer;
    }
    throw new Error('Lead not qualified');
  }
}

class Campaign {
  id: string;
  name: string;
  type: CampaignType;
  channels: NotificationChannel[];
  segments: CustomerSegment[];
  schedule: CampaignSchedule;

  async launch(): Promise<void> {
    const recipients = await this.getRecipients();

    for (const recipient of recipients) {
      await this.sendTo(recipient);
    }

    await this.trackMetrics();
  }

  private async getRecipients(): Promise<Customer[]> {
    return this.segments.flatMap(s => s.customers);
  }
}

class CustomerJourney {
  stages: JourneyStage[];

  async progress(customer: Customer, event: CustomerEvent): Promise<void> {
    const currentStage = this.getCurrentStage(customer);
    const nextStage = currentStage.determineNext(event);

    if (nextStage) {
      await nextStage.enter(customer);
      await this.triggerActions(customer, nextStage);
    }
  }
}
```

---

### 🔟 **Event Management Module** (إدارة الفعاليات)
```typescript
// Core Entities
- Event (الفعالية)
- Conference (المؤتمر)
- Exhibition (المعرض)
- Registration (التسجيل)
- Sponsor (الراعي)
```

**OOP Design:**
```typescript
abstract class Event {
  id: string;
  name: string;
  date: Date;
  location: Location;
  capacity: number;
  registrations: Registration[];

  abstract getTicketTypes(): TicketType[];
  abstract register(attendee: Attendee, ticket: TicketType): Promise<Registration>;
}

class Conference extends Event {
  sessions: Session[];
  speakers: Speaker[];
  sponsors: Sponsor[];

  async register(attendee: Attendee, ticket: TicketType): Promise<Registration> {
    // Check capacity
    if (this.isFull()) {
      throw new Error('Event is full');
    }

    // Create registration
    const registration = new Registration(this, attendee, ticket);

    // Process payment
    await registration.processPayment();

    // Generate QR code
    registration.qrCode = await this.generateQRCode(registration);

    // Send confirmation
    await this.notifyAttendee(registration);

    this.registrations.push(registration);
    return registration;
  }
}

class Exhibition extends Event {
  booths: Booth[];
  exhibitors: Exhibitor[];

  async bookBooth(exhibitor: Exhibitor, booth: Booth): Promise<Booking> {
    if (booth.isAvailable) {
      const booking = new Booking(exhibitor, booth);
      await booking.processPayment();
      booth.isAvailable = false;
      return booking;
    }
    throw new Error('Booth not available');
  }
}

class Registration {
  id: string;
  event: Event;
  attendee: Attendee;
  ticket: TicketType;
  qrCode: string;
  checkedIn: boolean;

  async checkIn(): Promise<void> {
    if (this.checkedIn) {
      throw new Error('Already checked in');
    }

    this.checkedIn = true;
    this.checkedInAt = new Date();
    await this.save();

    await this.event.notifyCheckIn(this);
  }
}
```

---

## 🎯 Design Patterns Used

### 1. **Strategy Pattern** (للدفع والتسعير)
```typescript
interface PricingStrategy {
  calculate(request: ServiceRequest): Cost;
}

class StandardPricing implements PricingStrategy {
  calculate(request: ServiceRequest): Cost {
    return new Cost(request.service.basePrice);
  }
}

class DistanceBasedPricing implements PricingStrategy {
  calculate(request: StationRequest): Cost {
    const baseCost = request.service.basePrice;
    const distanceCost = request.distance * this.ratePerKm;
    return new Cost(baseCost + distanceCost);
  }
}
```

### 2. **Factory Pattern** (لإنشاء الخدمات والطلبات)
```typescript
class ServiceFactory {
  create(type: ServiceType): Service {
    switch (type) {
      case 'lab_test':
        return new LaboratoryTestService();
      case 'station_accreditation':
        return new StationAccreditationService();
      case 'green_building':
        return new GreenBuildingService();
      default:
        throw new Error('Unknown service type');
    }
  }
}
```

### 3. **Observer Pattern** (للإشعارات والأحداث)
```typescript
interface Observer {
  update(event: Event): void;
}

class RequestObserver implements Observer {
  update(event: RequestEvent): void {
    if (event.type === 'status_changed') {
      this.notificationService.notify(event.request.customer, event);
    }
  }
}

class Request {
  private observers: Observer[] = [];

  attach(observer: Observer): void {
    this.observers.push(observer);
  }

  notify(event: Event): void {
    this.observers.forEach(o => o.update(event));
  }
}
```

### 4. **Repository Pattern** (للوصول للبيانات)
```typescript
interface Repository<T> {
  findById(id: string): Promise<T>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}

class ServiceRequestRepository implements Repository<ServiceRequest> {
  constructor(private db: DatabaseConnection) {}

  async findById(id: string): Promise<ServiceRequest> {
    const data = await this.db.query('SELECT * FROM requests WHERE id = ?', [id]);
    return this.mapToEntity(data);
  }

  async findByCustomer(customerId: string): Promise<ServiceRequest[]> {
    const data = await this.db.query(
      'SELECT * FROM requests WHERE customer_id = ?',
      [customerId]
    );
    return data.map(d => this.mapToEntity(d));
  }
}
```

### 5. **Decorator Pattern** (للتحقق والسجلات)
```typescript
class LoggingDecorator implements Service {
  constructor(private service: Service) {}

  async calculateCost(request: ServiceRequest): Promise<Cost> {
    console.log(`Calculating cost for ${request.id}`);
    const cost = await this.service.calculateCost(request);
    console.log(`Cost calculated: ${cost.amount}`);
    return cost;
  }
}

class CachingDecorator implements Service {
  private cache = new Map();

  constructor(private service: Service) {}

  async calculateCost(request: ServiceRequest): Promise<Cost> {
    const cacheKey = this.getCacheKey(request);

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const cost = await this.service.calculateCost(request);
    this.cache.set(cacheKey, cost);
    return cost;
  }
}
```

---

## 📊 Database Schema (High-Level)

```sql
-- Core Tables
users (id, email, password, role_id, created_at)
roles (id, name, is_admin)
permissions (id, module, action, description)
role_permissions (role_id, permission_id)

-- Services
services (id, name, type, category, base_price)
service_requests (id, service_id, customer_id, status, submitted_at)
request_documents (id, request_id, document_id)
request_history (id, request_id, status, changed_at, changed_by)

-- Payments
payments (id, request_id, amount, status, method)
invoices (id, request_id, subtotal, tax, total, due_date)
transactions (id, payment_id, gateway_response, completed_at)

-- Documents
documents (id, name, type, path, uploaded_by, uploaded_at)
document_versions (id, document_id, version, path, created_at)

-- Workflows
workflows (id, name, service_type)
workflow_steps (id, workflow_id, name, order)
workflow_actions (id, step_id, action_type, config)

-- CRM
leads (id, name, email, phone, source, score, status)
customers (id, user_id, company, type)
campaigns (id, name, type, start_date, end_date)
customer_segments (id, name, criteria)

-- Events
events (id, name, type, date, location, capacity)
registrations (id, event_id, attendee_id, ticket_type, qr_code)
sponsors (id, event_id, company, package_type)
booths (id, event_id, number, size, is_available)
```

---

## 🚀 Implementation Roadmap

### Phase 1: Core Foundation (2-3 months)
- ✅ Authentication & Authorization
- ✅ User Management
- ✅ Service Catalog
- ✅ Basic Request Flow

### Phase 2: Service Modules (3-4 months)
- ✅ Laboratory Tests
- ✅ Station Accreditation
- ✅ Consultancy Services
- ✅ Green Building Certification

### Phase 3: Advanced Features (2-3 months)
- ✅ Payment Integration
- ✅ Document Management
- ✅ Workflow Engine
- ✅ Notification System

### Phase 4: CRM & Marketing (2 months)
- ✅ Lead Management
- ✅ Campaign Management
- ✅ Customer Journey
- ✅ Analytics & Reporting

### Phase 5: Events & Training (2 months)
- ✅ Conference Management
- ✅ Exhibition Management
- ✅ Training Courses
- ✅ LMS Integration

---

## 🔐 Security Considerations

1. **Authentication**: JWT with refresh tokens
2. **Authorization**: Role-based with granular permissions
3. **Data Encryption**: At rest and in transit
4. **Audit Logging**: All actions tracked
5. **Input Validation**: Class-validator on all DTOs
6. **Rate Limiting**: Prevent abuse
7. **File Upload Security**: Type validation, size limits, virus scanning

---

## 📈 Performance Optimization

1. **Caching**: Redis for frequently accessed data
2. **Database Indexing**: On foreign keys and search fields
3. **Query Optimization**: N+1 prevention with eager loading
4. **File Storage**: CDN for static assets
5. **Background Jobs**: Bull/BullMQ for async tasks
6. **Database Sharding**: For scalability

---

## 🧪 Testing Strategy

1. **Unit Tests**: For business logic (70% coverage)
2. **Integration Tests**: For API endpoints (80% coverage)
3. **E2E Tests**: For critical user flows
4. **Load Testing**: For performance validation
5. **Security Testing**: Penetration testing

---

## 📚 Documentation

1. **API Documentation**: Swagger/OpenAPI
2. **Architecture Docs**: This file + diagrams
3. **User Guides**: For each module
4. **Developer Guides**: Setup and contribution
5. **Deployment Guides**: Production setup

---

## 🎓 Technologies

**Backend:**
- NestJS 11 (TypeScript)
- Prisma 5 (ORM)
- PostgreSQL (Database)
- Redis (Cache)
- Bull (Job Queue)

**Frontend:**
- React 19
- Vite
- TypeScript
- TanStack Query

**Infrastructure:**
- Docker
- Nginx
- PM2
