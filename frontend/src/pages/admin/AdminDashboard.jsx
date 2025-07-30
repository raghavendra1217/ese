import React, { useState, useEffect, useCallback } from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

// Import Layout & Sectional Components
import AdminNavBar from '../../components/layout/AdminNavBar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import ResumeStatsSection from '../../components/dashboard/ResumeStatsSection';
import TradingStatsSection from '../../components/dashboard/TradingStatsSection';
import AnalyticsSection from '../../components/dashboard/AnalyticsSection';

const AdminDashboard = ({ url }) => {
    const { token } = useAuth();
    
    // --- RESOLVED: Merged initial state from both versions ---
    const [stats, setStats] = useState(() => {
        const cached = localStorage.getItem('adminDashboardStats');
        return cached ? JSON.parse(cached) : {
            uploadedResume: 0, pendingForApproval: 0, pendingVendorApprovals: 0,
            pendingTradeApprovals: 0, availableProducts: 0, availableVacancies: 0,
            membersInLive: 0, verifiedResumes: 0, employeesOnHold: 0, receivedBill: '0',
            pendingBill: 0, purchasedProducts: 0, purchasedValue: 0,
            pendingPayOuts: 0, totalPayouts: 0,
            pendingWalletApprovals: 0, // Kept the incoming change for the new feature
        };
    });

    // --- RESOLVED: Kept the incoming change which fixes an infinite loop ---
    const fetchAllStats = useCallback(async () => {
        if (!token) return;
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [resumeResponse, adminResponse, productResponse] = await Promise.all([
                fetch(`${url}/api/resumes/stats/dashboard`, { headers }),
                fetch(`${url}/api/admin/stats/dashboard`, { headers }),
                fetch(`${url}/api/products/stats/dashboard`, { headers })
            ]);

            if (!resumeResponse.ok || !adminResponse.ok || !productResponse.ok) {
                throw new Error('Failed to fetch one or more dashboard stats.');
            }

            const resumeStats = await resumeResponse.json();
            const adminStats = await adminResponse.json();
            const productStats = await productResponse.json();
            
            const mergedStats = { ...resumeStats, ...adminStats, ...productStats };
            // Using functional update to avoid dependency on 'stats' in useCallback
            setStats(prevStats => ({...prevStats, ...mergedStats}));
            
            localStorage.setItem('adminDashboardStats', JSON.stringify(mergedStats));

        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
        }
    // 'stats' is correctly removed from the dependency array to prevent re-fetching
    }, [url, token]);

    useEffect(() => {
        if (token) {
            fetchAllStats();
        }
    }, [token, fetchAllStats]);

    const mainBg = useColorModeValue('#F9FAFB', 'gray.800');

    return (
        <Flex minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
            <AdminNavBar />
            <Box flex="1" ml="80px" p={{ base: 4, md: 8 }} bg={mainBg}>
                {/* --- RESOLVED: Kept the incoming change to pass stats for the notification badge --- */}
                <DashboardHeader stats={stats} />
                <ResumeStatsSection stats={stats} onUploadSuccess={fetchAllStats} url={url} />
                <TradingStatsSection stats={stats} />
                <AnalyticsSection stats={stats} />
            </Box>
        </Flex>
    );
};

export default AdminDashboard;