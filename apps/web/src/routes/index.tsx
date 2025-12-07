import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { MainLayout } from '../layouts/MainLayout';

// Auth Pages
import { UserTypeSelectionPage } from '../pages/auth/UserTypeSelectionPage';
import { EmployeeLoginPage } from '../pages/auth/EmployeeLoginPage';
import { CustomerLoginPage } from '../pages/auth/CustomerLoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';

// Dashboard Pages
import { DashboardPage } from '../pages/dashboard/DashboardPage';

// CRM Pages
import { CustomersPage } from '../pages/customers/CustomersPage';
import { ServicesPage } from '../pages/services/ServicesPage';
import { RequestsPage } from '../pages/requests/RequestsPage';
import { InvoicesPage } from '../pages/invoices/InvoicesPage';
import { PaymentsPage } from '../pages/payments/PaymentsPage';
import { EmployeesPage } from '../pages/employees/EmployeesPage';
import { RolesPage } from '../pages/roles/RolesPage';
import { DocumentsPage } from '../pages/documents/DocumentsPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { AdminSettingsPage } from '../pages/admin-settings/AdminSettingsPage';

// Customer Portal Pages
import { CustomerDashboardPage } from '../pages/customer/CustomerDashboardPage';
import { MyRequestsPage } from '../pages/customer/MyRequestsPage';
import { MyInvoicesPage } from '../pages/customer/MyInvoicesPage';
import { MyDocumentsPage } from '../pages/customer/MyDocumentsPage';
import { ServicesCatalogPage } from '../pages/customer/ServicesCatalogPage';
import { NewRequestPage } from '../pages/customer/NewRequestPage';
import { RequestDetailsPage } from '../pages/customer/RequestDetailsPage';
import { PaymentPage } from '../pages/customer/PaymentPage';
import { PublicationsCatalogPage } from '../pages/customer/PublicationsCatalogPage';
import { MyPublicationsPage } from '../pages/customer/MyPublicationsPage';
import { PaymentResultPage } from '../pages/customer/PaymentResultPage';
import { WalletPage } from '../pages/customer/WalletPage';

// Publications (Admin)
import { PublicationsPage } from '../pages/publications/PublicationsPage';

/**
 * Application routes configuration
 */
export const router = createBrowserRouter([
  // Redirect root to dashboard
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },

  // Auth Routes (with AuthLayout)
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      // User type selection (main login entry)
      {
        path: 'login',
        element: <UserTypeSelectionPage />,
      },
      // Employee login
      {
        path: 'login/employee',
        element: <EmployeeLoginPage />,
      },
      // Customer login
      {
        path: 'login/customer',
        element: <CustomerLoginPage />,
      },
      // Customer registration
      {
        path: 'register',
        element: <RegisterPage />,
      },
      // Forgot password
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
    ],
  },

  // Protected Routes (with MainLayout)
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'customers',
        element: <CustomersPage />,
      },
      {
        path: 'services',
        element: <ServicesPage />,
      },
      {
        path: 'requests',
        element: <RequestsPage />,
      },
      {
        path: 'invoices',
        element: <InvoicesPage />,
      },
      {
        path: 'payments',
        element: <PaymentsPage />,
      },
      {
        path: 'employees',
        element: <EmployeesPage />,
      },
      {
        path: 'roles',
        element: <RolesPage />,
      },
      {
        path: 'documents',
        element: <DocumentsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'admin-settings',
        element: <AdminSettingsPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      // Publications (Admin)
      {
        path: 'publications',
        element: <PublicationsPage />,
      },
      // Customer Portal Routes
      {
        path: 'customer-dashboard',
        element: <CustomerDashboardPage />,
      },
      {
        path: 'services-catalog',
        element: <ServicesCatalogPage />,
      },
      {
        path: 'new-request',
        element: <NewRequestPage />,
      },
      {
        path: 'new-request/:serviceId',
        element: <NewRequestPage />,
      },
      {
        path: 'my-requests',
        element: <MyRequestsPage />,
      },
      {
        path: 'my-requests/:id',
        element: <RequestDetailsPage />,
      },
      {
        path: 'my-invoices',
        element: <MyInvoicesPage />,
      },
      {
        path: 'my-documents',
        element: <MyDocumentsPage />,
      },
      {
        path: 'payment/:invoiceId',
        element: <PaymentPage />,
      },
      // Publications (Customer)
      {
        path: 'publications-catalog',
        element: <PublicationsCatalogPage />,
      },
      {
        path: 'my-publications',
        element: <MyPublicationsPage />,
      },
      // Wallet
      {
        path: 'wallet',
        element: <WalletPage />,
      },
      // Payment Result Pages
      {
        path: 'payment/result',
        element: <PaymentResultPage />,
      },
      {
        path: 'payment/success',
        element: <PaymentResultPage />,
      },
      {
        path: 'payment/pending',
        element: <PaymentResultPage />,
      },
      {
        path: 'payment/failed',
        element: <PaymentResultPage />,
      },
    ],
  },

  // 404 Page
  {
    path: '*',
    element: (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `
                radial-gradient(ellipse at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)
              `,
            }}
          />
        </div>

        <div className="text-center">
          {/* 404 Number with Gradient */}
          <h1 className="text-[150px] font-black leading-none animated-gradient-text">404</h1>

          {/* Message */}
          <p className="mt-4 text-2xl font-semibold text-white/80">الصفحة غير موجودة</p>
          <p className="mt-2 text-white/50">عذراً، الصفحة التي تبحث عنها غير متاحة</p>

          {/* Back Button */}
          <a
            href="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            العودة للرئيسية
          </a>
        </div>
      </div>
    ),
  },
]);
