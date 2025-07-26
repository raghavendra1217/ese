import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AppProvider } from './AppContext';
import theme from './theme';

// Import Layouts and our simplified RouteGuard
import AuthLayout from './components/AuthLayout';
import RouteGuard from './components/RouteGuard';

// Import All Pages
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import PaymentPage from './pages/PaymentPage';
import AdminDashboard from './pages/AdminDashboard';
import VendorDashboard from './pages/VendorDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManageApprovalsPage from './pages/ManageApprovalsPage';
import ManageProductsPage from './pages/ManageProductsPage';
import ViewProductsPage from './pages/ViewProductsPage';
import ManageTradingApprovalsPage from './pages/ManageTradingApprovalsPage';
import PurchaseHistoryPage from './pages/PurchaseHistoryPage';
import ProductTradingPage from './pages/ProductTradingPage';

const url = "https://esepapertrading.onrender.com";

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* --- Group 1: Public-Only Routes --- */}
            <Route element={<RouteGuard isPrivate={false} />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage url={url} />} />
                <Route path="/register" element={<RegistrationPage url={url} />} />
                <Route path="/payment" element={<PaymentPage url={url} />} />
              </Route>
            </Route>

            {/* --- Group 2: Private Routes --- */}
            <Route element={<RouteGuard isPrivate={true} />}>
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard url={url} />} />
              <Route path="/admin/manage-approvals" element={<ManageApprovalsPage url={url} />} />
              <Route path="/admin/manage-products" element={<ManageProductsPage url={url} />} />
              <Route path="/admin/manage-trading-approvals" element={<ManageTradingApprovalsPage url={url} />} />

              {/* Vendor Routes */}
              <Route path="/vendor/dashboard" element={<VendorDashboard url={url} />} />
              <Route path="/vendor/products" element={<ViewProductsPage url={url} />} />

              {/* Employee Routes */}
              <Route path="/employee/dashboard" element={<EmployeeDashboard url={url} />} />
              <Route path="/purchase-history" element={<PurchaseHistoryPage url={url} />} />
              <Route path="/product-trading" element={<ProductTradingPage url={url} />} />
            </Route>

            {/* --- Fallback Route --- */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ChakraProvider>
  );
}

export default App;
