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
// --- 1. IMPORT THE NEW PAGE ---
import ManageTradingApprovalsPage from './pages/ManageTradingApprovalsPage';
import PurchaseHistoryPage from './pages/PurchaseHistoryPage';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* --- Group 1: Public-Only Routes --- */}
            {/* The guard protects these from logged-in users. */}
            <Route element={<RouteGuard isPrivate={false} />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegistrationPage />} />
                <Route path="/payment" element={<PaymentPage />} />
              </Route>
            </Route>

            {/* --- Group 2: Private Routes --- */}
            {/* The guard protects these from logged-out users. */}
            <Route element={<RouteGuard isPrivate={true} />}>
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/manage-approvals" element={<ManageApprovalsPage />} />
              <Route path="/admin/manage-products" element={<ManageProductsPage />} />
              
              {/* --- 2. ADD THE NEW ROUTE HERE --- */}
              <Route path="/admin/manage-trading-approvals" element={<ManageTradingApprovalsPage />} />

              {/* Vendor Routes */}
              <Route path="/vendor/dashboard" element={<VendorDashboard />} />
              <Route path="/vendor/products" element={<ViewProductsPage />} />
              <Route path="/my-purchases" element={<PurchaseHistoryPage />} />
              
              {/* Employee Routes */}
              <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
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