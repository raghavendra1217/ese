// src/pages/DashboardPage.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';

// This page is now obsolete due to direct role-based routing and protection.
const DashboardPage = () => {
    return <Navigate to="/login" replace />;
};

export default DashboardPage;