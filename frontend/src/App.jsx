

// src/App.jsx

import React from 'react';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AppProvider } from './AppContext';
import theme from './theme';

// Layouts / Guards
import AuthLayout from './components/AuthLayout';
import RouteGuard from './components/RouteGuard';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/_creds/LoginPage';
import RegistrationPage from './pages/_creds/RegistrationPage';
import PaymentPage from './pages/_creds/PaymentPage';
import ForgotPassword from './pages/ForgotPassword';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageApprovalsPage from './pages/admin/ManageApprovalsPage';
import ManageProductsPage from './pages/admin/ManageProductsPage';
import WildProductManagementPage from './pages/admin/WildProductManagementPage';
import ManageTradingApprovalsPage from './pages/admin/ManageTradingApprovalsPage';
import ManageWalletApprovalsPage from './pages/admin/ManageWalletApprovalsPage';
import ManagePercentagePage from './pages/admin/ManagePercentagePage';
import ManageProfile from './pages/admin/ManageProfile';
import InvestorManagementPage from './pages/admin/InvestorManagementPage';
import AdminQuickRegistrationsPage from './pages/admin/AdminQuickRegistrationsPage';
import QuickRegistrationManagementPage from './pages/admin/QuickRegistrationManagementPage';
import PayslipManagementPage from './pages/admin/PayslipManagementPage';
import AddCoordinatorPage from './pages/admin/AddCoordinatorPage';
import ManageCoordinatorsPage from './pages/admin/ManageCoordinatorsPage';
import EditCoordinatorPage from './pages/admin/EditCoordinatorPage';

import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import CoordinatorAllVendorsPage from './pages/coordinator/CoordinatorAllVendorsPage';
import CoordinatorVendorsLast8DaysPage from './pages/coordinator/CoordinatorVendorsLast8DaysPage';
import CoordinatorVendorsTodayPage from './pages/coordinator/CoordinatorVendorsTodayPage';
import CoordinatorInvestorPage from './pages/coordinator/CoordinatorInvestorPage';
import CoordinatorProductsPage from './pages/coordinator/CoordinatorProductsPage';
import CoordinatorWildProductsPage from './pages/coordinator/CoordinatorWildProductsPage';

import VendorDashboard from './pages/vendor/VendorDashboard';
import BuyProduct from './pages/vendor/BuyProduct';
import PurchaseHistoryPage from './pages/vendor/PurchaseHistoryPage';
import ProductTradingPage from './pages/vendor/ProductTradingPage';
import WildProductTradingPage from './pages/vendor/WildProductTradingPage';
import WalletPage from './pages/WalletPage';
import AllVendorsPage from './pages/admin/AllVendorsPage';
import VendorsLast8DaysPage from './pages/admin/VendorsLast8DaysPage';
import TodaysVendorsPage from './pages/admin/TodaysVendorsPage';
import VendorProfile from './pages/vendor/VendorProfile';
import RecentActivityPage from './pages/vendor/RecentActivityPage';
import MyReferralsPage from './pages/vendor/MyReferralsPage';
import QuickRegistrationPage from './pages/QuickRegistrationPage';
import QuickRegistrationFormPage from './pages/QuickRegistrationFormPage';
import NotFound from './components/NotFound';



const url = "";

function App() {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <BrowserRouter>
        <AppProvider>
          <Routes>

      {/* testing */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Public-only routes (redirect to dashboard if already logged in) */}
            <Route element={<RouteGuard isPrivate={false} />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage url={url} />} />
                <Route path="/register" element={<RegistrationPage url={url} />} />
                <Route path="/payment" element={<PaymentPage url={url} />} />
                <Route path="/forgot-password" element={<ForgotPassword url={url} />} />
                <Route path="/quick-register" element={<QuickRegistrationPage url={url} />} />
                <Route path="/quick-register-public" element={<QuickRegistrationFormPage url={url} />} />
              </Route>
            </Route>

            {/* Private routes (must be logged in) */}
            <Route element={<RouteGuard isPrivate={true} />}>
              {/* Admin-only */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute role="admin">
                    <AdminDashboard url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/manage-percentages"
                element={
                  <ProtectedRoute role="admin">
                    <ManagePercentagePage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/manage-approvals"
                element={
                  <ProtectedRoute role="admin">
                    <ManageApprovalsPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/manage-products"
                element={
                  <ProtectedRoute role="admin">
                    <ManageProductsPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/wild-products"
                element={
                  <ProtectedRoute role="admin">
                    <WildProductManagementPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/manage-trading-approvals"
                element={
                  <ProtectedRoute role="admin">
                    <ManageTradingApprovalsPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/all-vendors"
                element={
                  <ProtectedRoute role="admin">
                    <AllVendorsPage url={url} />
                  </ProtectedRoute>
                }
              />
                          <Route
              path="/admin/vendors-last8days"
              element={
                <ProtectedRoute role="admin">
                  <VendorsLast8DaysPage url={url} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/todays-vendors"
              element={
                <ProtectedRoute role="admin">
                  <TodaysVendorsPage url={url} />
                </ProtectedRoute>
              }
            />
              <Route
                path="/admin/wallet-approvals"
                element={
                  <ProtectedRoute role="admin">
                    <ManageWalletApprovalsPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/vendors/:id"
                element={
                  <ProtectedRoute role="admin">
                    <ManageProfile url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/manage-profile/:id"
                element={
                  <ProtectedRoute role="admin">
                    <ManageProfile url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/investors"
                element={
                  <ProtectedRoute role="admin">
                    <InvestorManagementPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/quick-registrations"
                element={
                  <ProtectedRoute role="admin">
                    <AdminQuickRegistrationsPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/quick-registration-management"
                element={
                  <ProtectedRoute role="admin">
                    <QuickRegistrationManagementPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/payslip-management"
                element={
                  <ProtectedRoute role="admin">
                    <PayslipManagementPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/manage-coordinators"
                element={
                  <ProtectedRoute role="admin">
                    <ManageCoordinatorsPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/add-coordinator"
                element={
                  <ProtectedRoute role="admin">
                    <AddCoordinatorPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/edit-coordinator/:coordinatorId"
                element={
                  <ProtectedRoute role="admin">
                    <EditCoordinatorPage url={url} />
                  </ProtectedRoute>
                }
              />

              {/* Coordinator-only */}
              <Route
                path="/coordinator/dashboard"
                element={
                  <ProtectedRoute role="coordinator">
                    <CoordinatorDashboard url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coordinator/all-vendors"
                element={
                  <ProtectedRoute role="coordinator">
                    <CoordinatorAllVendorsPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coordinator/vendors-last8days"
                element={
                  <ProtectedRoute role="coordinator">
                    <CoordinatorVendorsLast8DaysPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coordinator/vendors-today"
                element={
                  <ProtectedRoute role="coordinator">
                    <CoordinatorVendorsTodayPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coordinator/investors"
                element={
                  <ProtectedRoute role="coordinator">
                    <CoordinatorInvestorPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coordinator/products"
                element={
                  <ProtectedRoute role="coordinator">
                    <CoordinatorProductsPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coordinator/wild-products"
                element={
                  <ProtectedRoute role="coordinator">
                    <CoordinatorWildProductsPage url={url} />
                  </ProtectedRoute>
                }
              />

              {/* Vendor-only */}
              <Route
                path="/vendor/dashboard"
                element={
                  <ProtectedRoute role="vendor">
                    <VendorDashboard url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendor/products"
                element={
                  <ProtectedRoute role="vendor">
                    <BuyProduct url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendor/wild-products"
                element={
                  <ProtectedRoute role="vendor">
                    <WildProductTradingPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendor/wallet"
                element={
                  <ProtectedRoute role="vendor">
                    <WalletPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendor/purchase-history"
                element={
                  <ProtectedRoute role="vendor">
                    <PurchaseHistoryPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/product-trading"
                element={
                  <ProtectedRoute role="vendor">
                    <ProductTradingPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendor/profile"
                element={
                  <ProtectedRoute role="vendor">
                    <VendorProfile url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendor/activity"
                element={
                  <ProtectedRoute role="vendor">
                    <RecentActivityPage url={url} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendor/referrals"
                element={
                  <ProtectedRoute role="vendor">
                    <MyReferralsPage url={url} />
                  </ProtectedRoute>
                }
              />

            </Route>

            {/* Fallback - Show NotFound component which will auto-logout */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;
