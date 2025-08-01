// src/App.jsx

import React from 'react';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AppProvider } from './AppContext';
import theme from './theme';

// Import Layouts and our simplified RouteGuard
import AuthLayout from './components/AuthLayout';
import RouteGuard from './components/RouteGuard';

// Import All Pages
import LoginPage from './pages/_creds/LoginPage';
import RegistrationPage from './pages/_creds/RegistrationPage';
import PaymentPage from './pages/_creds/PaymentPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import VendorDashboard from './pages/vendor/VendorDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManageApprovalsPage from './pages/admin/ManageApprovalsPage';
import ManageProductsPage from './pages/admin/ManageProductsPage';
import BuyProduct from './pages/vendor/BuyProduct';
import ManageTradingApprovalsPage from './pages/admin/ManageTradingApprovalsPage';
import PurchaseHistoryPage from './pages/vendor/PurchaseHistoryPage';
import ProductTradingPage from './pages/vendor/ProductTradingPage';
import WalletPage from './pages/WalletPage';
import AllVendorsPage from './pages/vendor/AllVendorsPage';
import ManageWalletApprovalsPage from './pages/admin/ManageWalletApprovalsPage';
import ForgotPassword from './pages/ForgotPassword';

const url = "";

function App() {
  return (
    <ChakraProvider theme={theme}>
      {/* 🌙 Ensure color mode is respected and persisted */}
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* --- Group 1: Public-Only Routes --- */}
            <Route element={<RouteGuard isPrivate={false} />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage url={url} />} />
                <Route path="/register" element={<RegistrationPage url={url} />} />
                <Route path="/payment" element={<PaymentPage url={url} />} />
                <Route path="/forgot-password" element={<ForgotPassword url={url} />} />
              </Route>
            </Route>

            {/* --- Group 2: Private Routes --- */}
            <Route element={<RouteGuard isPrivate={true} />}>
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard url={url} />} />
              <Route path="/admin/manage-approvals" element={<ManageApprovalsPage url={url} />} />
              <Route path="/admin/manage-products" element={<ManageProductsPage url={url} />} />
              <Route path="/admin/manage-trading-approvals" element={<ManageTradingApprovalsPage url={url} />} />
              <Route path="/admin/all-vendors" element={<AllVendorsPage url={url} />} />
              <Route path="/admin/wallet-approvals" element={<ManageWalletApprovalsPage url={url} />} />

              {/* Vendor Routes */}
              <Route path="/vendor/dashboard" element={<VendorDashboard url={url} />} />
              <Route path="/vendor/products" element={<BuyProduct url={url} />} />
              <Route path="/vendor/wallet" element={<WalletPage url={url} />} />
              <Route path="/vendor/purchase-history" element={<PurchaseHistoryPage url={url} />} />
              <Route path="/product-trading" element={<ProductTradingPage url={url} />} />

              {/* Employee */}
              <Route path="/employee/dashboard" element={<EmployeeDashboard url={url} />} />
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
