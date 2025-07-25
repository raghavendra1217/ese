// src/pages/DashboardPage.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';

// This page is now obsolete due to direct role-based routing and protection.
const DashboardPage = () => {
    return <Navigate to="/login" replace />;
};

export default DashboardPage;