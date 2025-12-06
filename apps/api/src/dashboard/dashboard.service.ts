import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RequestStatus,
  RequestPriority,
  PaymentStatus,
  InvoiceStatus,
  ServiceCategory,
} from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // MAIN DASHBOARD SUMMARY
  // ============================================
  async getSummary(): Promise<{
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
      topServices: { name: string; count: number }[];
    };
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Requests stats
    const [
      totalRequests,
      pendingRequests,
      inProgressRequests,
      completedRequests,
    ] = await Promise.all([
      this.prisma.serviceRequest.count(),
      this.prisma.serviceRequest.count({
        where: { status: { in: [RequestStatus.SUBMITTED, RequestStatus.UNDER_REVIEW] } },
      }),
      this.prisma.serviceRequest.count({
        where: { status: RequestStatus.IN_PROGRESS },
      }),
      this.prisma.serviceRequest.count({
        where: { status: { in: [RequestStatus.COMPLETED, RequestStatus.DELIVERED] } },
      }),
    ]);

    // Customer stats
    const [totalCustomers, activeCustomers, newCustomersThisMonth] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.customer.count({ where: { status: 'ACTIVE' } }),
      this.prisma.customer.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
    ]);

    // Revenue stats
    const payments = await this.prisma.payment.findMany({
      select: { amount: true, status: true, paidAt: true },
    });

    const totalRevenue = payments
      .filter((p) => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const thisMonthRevenue = payments
      .filter((p) => p.status === PaymentStatus.PAID && p.paidAt && p.paidAt >= startOfMonth)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingRevenue = payments
      .filter((p) => p.status === PaymentStatus.PENDING)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Services stats
    const [totalServices, activeServices] = await Promise.all([
      this.prisma.service.count(),
      this.prisma.service.count({ where: { isActive: true } }),
    ]);

    // Top services by request count
    const serviceRequests = await this.prisma.serviceRequest.groupBy({
      by: ['serviceId'],
      _count: { serviceId: true },
      orderBy: { _count: { serviceId: 'desc' } },
      take: 5,
    });

    const topServiceIds = serviceRequests.map((s) => s.serviceId);
    const topServicesData = await this.prisma.service.findMany({
      where: { id: { in: topServiceIds } },
      select: { id: true, name: true, nameAr: true },
    });

    const topServices = serviceRequests.map((sr) => {
      const service = topServicesData.find((s) => s.id === sr.serviceId);
      return {
        name: service?.name || 'Unknown',
        nameAr: service?.nameAr || 'غير معروف',
        count: sr._count.serviceId,
      };
    });

    return {
      requests: {
        total: totalRequests,
        pending: pendingRequests,
        inProgress: inProgressRequests,
        completed: completedRequests,
      },
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        newThisMonth: newCustomersThisMonth,
      },
      revenue: {
        total: totalRevenue,
        thisMonth: thisMonthRevenue,
        pending: pendingRevenue,
      },
      services: {
        total: totalServices,
        active: activeServices,
        topServices,
      },
    };
  }

  // ============================================
  // REQUESTS STATISTICS
  // ============================================
  async getRequestsStats(): Promise<{
    total: number;
    byStatus: Record<RequestStatus, number>;
    byPriority: Record<RequestPriority, number>;
    byCategory: Record<ServiceCategory, number>;
    assigned: number;
    unassigned: number;
    averageCompletionDays: number;
    trend: { date: string; count: number }[];
  }> {
    const requests = await this.prisma.serviceRequest.findMany({
      include: { service: { select: { category: true } } },
    });

    const byStatus = requests.reduce(
      (acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      },
      {} as Record<RequestStatus, number>,
    );

    const byPriority = requests.reduce(
      (acc, req) => {
        acc[req.priority] = (acc[req.priority] || 0) + 1;
        return acc;
      },
      {} as Record<RequestPriority, number>,
    );

    const byCategory = requests.reduce(
      (acc, req) => {
        const category = req.service.category;
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<ServiceCategory, number>,
    );

    const assigned = requests.filter((r) => r.assignedToId).length;
    const unassigned = requests.filter((r) => !r.assignedToId).length;

    // Calculate average completion time
    const completedRequests = requests.filter(
      (r) => r.completedAt && r.requestedDate,
    );
    let averageCompletionDays = 0;
    if (completedRequests.length > 0) {
      const totalDays = completedRequests.reduce((sum, r) => {
        const days =
          (r.completedAt!.getTime() - r.requestedDate.getTime()) /
          (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      averageCompletionDays = Math.round(totalDays / completedRequests.length);
    }

    // Trend for last 30 days
    const trend = await this.getRequestsTrend(30);

    return {
      total: requests.length,
      byStatus,
      byPriority,
      byCategory,
      assigned,
      unassigned,
      averageCompletionDays,
      trend,
    };
  }

  private async getRequestsTrend(days: number): Promise<{ date: string; count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const requests = await this.prisma.serviceRequest.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    });

    const trendMap = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trendMap.set(dateStr, 0);
    }

    requests.forEach((r) => {
      const dateStr = r.createdAt.toISOString().split('T')[0];
      if (trendMap.has(dateStr)) {
        trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
      }
    });

    return Array.from(trendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .reverse();
  }

  // ============================================
  // REVENUE STATISTICS
  // ============================================
  async getRevenueStats(): Promise<{
    total: number;
    paid: number;
    pending: number;
    refunded: number;
    byMonth: { month: string; amount: number }[];
    byPaymentMethod: Record<string, number>;
  }> {
    const payments = await this.prisma.payment.findMany();

    const paid = payments
      .filter((p) => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pending = payments
      .filter((p) => p.status === PaymentStatus.PENDING)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const refunded = payments
      .filter((p) => p.status === PaymentStatus.REFUNDED)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const total = paid + pending;

    // Revenue by month (last 12 months)
    const byMonth = await this.getRevenueByMonth(12);

    // Revenue by payment method
    const byPaymentMethod = payments
      .filter((p) => p.status === PaymentStatus.PAID)
      .reduce(
        (acc, p) => {
          acc[p.method] = (acc[p.method] || 0) + Number(p.amount);
          return acc;
        },
        {} as Record<string, number>,
      );

    return {
      total,
      paid,
      pending,
      refunded,
      byMonth,
      byPaymentMethod,
    };
  }

  private async getRevenueByMonth(months: number): Promise<{ month: string; amount: number }[]> {
    const results: { month: string; amount: number }[] = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthPayments = await this.prisma.payment.findMany({
        where: {
          status: PaymentStatus.PAID,
          paidAt: { gte: date, lt: nextMonth },
        },
        select: { amount: true },
      });

      const amount = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      results.unshift({ month: monthStr, amount });
    }

    return results;
  }

  // ============================================
  // SERVICES STATISTICS
  // ============================================
  async getServicesStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<ServiceCategory, number>;
    mostRequested: { id: string; name: string; nameAr: string; requests: number }[];
    leastRequested: { id: string; name: string; nameAr: string; requests: number }[];
  }> {
    const services = await this.prisma.service.findMany({
      include: { _count: { select: { requests: true } } },
    });

    const active = services.filter((s) => s.isActive).length;
    const inactive = services.filter((s) => !s.isActive).length;

    const byCategory = services.reduce(
      (acc, s) => {
        acc[s.category] = (acc[s.category] || 0) + 1;
        return acc;
      },
      {} as Record<ServiceCategory, number>,
    );

    const sortedByRequests = [...services].sort(
      (a, b) => b._count.requests - a._count.requests,
    );

    const mostRequested = sortedByRequests.slice(0, 5).map((s) => ({
      id: s.id,
      name: s.name,
      nameAr: s.nameAr,
      requests: s._count.requests,
    }));

    const leastRequested = sortedByRequests
      .slice(-5)
      .reverse()
      .map((s) => ({
        id: s.id,
        name: s.name,
        nameAr: s.nameAr,
        requests: s._count.requests,
      }));

    return {
      total: services.length,
      active,
      inactive,
      byCategory,
      mostRequested,
      leastRequested,
    };
  }

  // ============================================
  // CUSTOMERS STATISTICS
  // ============================================
  async getCustomersStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    verified: number;
    unverified: number;
    newThisMonth: number;
    newThisWeek: number;
    topCustomers: { id: string; name: string; requestCount: number; totalSpent: number }[];
  }> {
    const customers = await this.prisma.customer.findMany({
      include: {
        _count: { select: { requests: true } },
        payments: { where: { status: PaymentStatus.PAID }, select: { amount: true } },
      },
    });

    const byStatus = customers.reduce(
      (acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byType = customers.reduce(
      (acc, c) => {
        acc[c.customerType] = (acc[c.customerType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const verified = customers.filter((c) => c.isVerified).length;
    const unverified = customers.filter((c) => !c.isVerified).length;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const newThisMonth = customers.filter((c) => c.createdAt >= startOfMonth).length;
    const newThisWeek = customers.filter((c) => c.createdAt >= startOfWeek).length;

    // Top customers by spending
    const customersWithSpending = customers.map((c) => ({
      id: c.id,
      name: c.name,
      requestCount: c._count.requests,
      totalSpent: c.payments.reduce((sum, p) => sum + Number(p.amount), 0),
    }));

    const topCustomers = customersWithSpending
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      total: customers.length,
      byStatus,
      byType,
      verified,
      unverified,
      newThisMonth,
      newThisWeek,
      topCustomers,
    };
  }

  // ============================================
  // EMPLOYEES STATISTICS
  // ============================================
  async getEmployeesStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byDepartment: Record<string, number>;
    byRole: Record<string, number>;
    withAssignments: number;
    assignmentLoad: { id: string; name: string; department: string; assignments: number }[];
  }> {
    const employees = await this.prisma.employee.findMany({
      include: {
        role: { select: { name: true } },
        _count: { select: { assignedRequests: true } },
      },
    });

    const byStatus = employees.reduce(
      (acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byDepartment = employees.reduce(
      (acc, e) => {
        acc[e.department] = (acc[e.department] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byRole = employees.reduce(
      (acc, e) => {
        acc[e.role.name] = (acc[e.role.name] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const withAssignments = employees.filter((e) => e._count.assignedRequests > 0).length;

    const assignmentLoad = employees
      .map((e) => ({
        id: e.id,
        name: `${e.firstName} ${e.lastName}`,
        department: e.department,
        assignments: e._count.assignedRequests,
      }))
      .sort((a, b) => b.assignments - a.assignments)
      .slice(0, 10);

    return {
      total: employees.length,
      byStatus,
      byDepartment,
      byRole,
      withAssignments,
      assignmentLoad,
    };
  }

  // ============================================
  // RECENT ACTIVITY
  // ============================================
  async getRecentActivity(limit: number = 20): Promise<{
    requests: any[];
    payments: any[];
    invoices: any[];
  }> {
    const [requests, payments, invoices] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          requestNumber: true,
          title: true,
          titleAr: true,
          status: true,
          createdAt: true,
          customer: { select: { name: true } },
          service: { select: { name: true, nameAr: true } },
        },
      }),
      this.prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          paymentNumber: true,
          amount: true,
          status: true,
          method: true,
          createdAt: true,
          customer: { select: { name: true } },
        },
      }),
      this.prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          status: true,
          createdAt: true,
          customer: { select: { name: true } },
        },
      }),
    ]);

    return { requests, payments, invoices };
  }
}
