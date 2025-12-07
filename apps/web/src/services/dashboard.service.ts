import { httpClient } from './httpclient';
import type {
  DashboardSummary,
  RequestsStats,
  RevenueStats,
  ServicesStats,
  CustomersStats,
  EmployeesStats,
  RecentActivity,
} from '../types/interfaces';

const ENDPOINTS = {
  summary: '/dashboard/summary',
  requests: '/dashboard/requests',
  revenue: '/dashboard/revenue',
  services: '/dashboard/services',
  customers: '/dashboard/customers',
  employees: '/dashboard/employees',
  activity: '/dashboard/activity',
};

class DashboardService {
  async getSummary(): Promise<DashboardSummary> {
    return httpClient.get<DashboardSummary>(ENDPOINTS.summary);
  }

  async getRequestsStats(): Promise<RequestsStats> {
    return httpClient.get<RequestsStats>(ENDPOINTS.requests);
  }

  async getRevenueStats(): Promise<RevenueStats> {
    return httpClient.get<RevenueStats>(ENDPOINTS.revenue);
  }

  async getServicesStats(): Promise<ServicesStats> {
    return httpClient.get<ServicesStats>(ENDPOINTS.services);
  }

  async getCustomersStats(): Promise<CustomersStats> {
    return httpClient.get<CustomersStats>(ENDPOINTS.customers);
  }

  async getEmployeesStats(): Promise<EmployeesStats> {
    return httpClient.get<EmployeesStats>(ENDPOINTS.employees);
  }

  async getRecentActivity(limit?: number): Promise<RecentActivity> {
    const url = limit ? `${ENDPOINTS.activity}?limit=${limit}` : ENDPOINTS.activity;
    return httpClient.get<RecentActivity>(url);
  }

  // Get basic stats for dashboard
  async getStats(): Promise<{
    totalCustomers: number;
    totalServices: number;
    totalRequests: number;
    totalRevenue: number;
    pendingRequests: number;
    completedRequests: number;
    monthlyGrowth: number;
  }> {
    try {
      const summary = await this.getSummary();
      return {
        totalCustomers: summary.customers?.total || 0,
        totalServices: summary.services?.total || 0,
        totalRequests: summary.requests?.total || 0,
        totalRevenue: summary.revenue?.total || 0,
        pendingRequests: summary.requests?.pending || 0,
        completedRequests: summary.requests?.completed || 0,
        monthlyGrowth: 0, // Calculate from revenue if needed
      };
    } catch {
      // Return default values if API fails
      return {
        totalCustomers: 0,
        totalServices: 0,
        totalRequests: 0,
        totalRevenue: 0,
        pendingRequests: 0,
        completedRequests: 0,
        monthlyGrowth: 0,
      };
    }
  }

  // Get all dashboard data at once
  async getAllStats(): Promise<{
    summary: DashboardSummary;
    requests: RequestsStats;
    revenue: RevenueStats;
    services: ServicesStats;
    customers: CustomersStats;
    employees: EmployeesStats;
    activity: RecentActivity;
  }> {
    const [summary, requests, revenue, services, customers, employees, activity] =
      await Promise.all([
        this.getSummary(),
        this.getRequestsStats(),
        this.getRevenueStats(),
        this.getServicesStats(),
        this.getCustomersStats(),
        this.getEmployeesStats(),
        this.getRecentActivity(),
      ]);

    return {
      summary,
      requests,
      revenue,
      services,
      customers,
      employees,
      activity,
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
