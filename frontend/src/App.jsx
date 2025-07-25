import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AppProvider, useAuth } from './AppContext';

// Import Layout and All Pages
import AuthLayout from './components/AuthLayout';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import PaymentPage from './pages/PaymentPage';
import AdminDashboard from './pages/AdminDashboard';
import VendorDashboard from './pages/VendorDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManageApprovalsPage from './pages/ManageApprovalsPage';
import ManageProductsPage from './pages/ManageProductsPage';
import ViewProductsPage from './pages/ViewProductsPage'; // <-- IMPORT THE NEW PAGE
import theme from './theme';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes have the AuthLayout */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route path="/payment" element={<PaymentPage />} />
            </Route>

            {/* All routes are now publicly accessible */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/vendor/dashboard" element={<VendorDashboard />} />
            <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
            
            <Route path="/admin/manage-approvals" element={<ManageApprovalsPage />} />
            <Route path="/admin/manage-products" element={<ManageProductsPage />} />

            <Route path="/vendor/products" element={<ViewProductsPage />} />
            
            {/* The root path now defaults to the login page */}
            <Route path="/" element={<Navigate to="/login" replace />} />

          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ChakraProvider>
  );
}

export default App;