import React, { useState, useEffect, useCallback } from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import { useAuth } from '../../AppContext'; // Adjust path as needed

// Import Layout & Sectional Components
import AdminNavBar from '../../components/layout/AdminNavBar'; // Adjust path
import DashboardHeader from '../../components/dashboard/DashboardHeader'; // Adjust path
import ResumeStatsSection from '../../components/dashboard/ResumeStatsSection'; // Adjust path
import TradingStatsSection from '../../components/dashboard/TradingStatsSection'; // Adjust path
import AnalyticsSection from '../../components/dashboard/AnalyticsSection'; // Adjust path

const AdminDashboard = ({ url }) => {
    const { token } = useAuth();
<<<<<<< HEAD
=======
    
    // Updated initial state to include the wallet approvals stat
>>>>>>> d39126c (wallet update)
    const [stats, setStats] = useState(() => {
        const cached = localStorage.getItem('adminDashboardStats');
        return cached ? JSON.parse(cached) : {
            uploadedResume: 0, pendingForApproval: 0, pendingVendorApprovals: 0,
            pendingTradeApprovals: 0, availableProducts: 0, availableVacancies: 0,
            membersInLive: 0, verifiedResumes: 0, employeesOnHold: 0, receivedBill: '0',
            pendingBill: 0, purchasedProducts: 0, purchasedValue: 0,
            pendingPayOuts: 0, totalPayouts: 0,
<<<<<<< HEAD
=======
            pendingWalletApprovals: 0, // <-- Important: Ensures no error on first render
>>>>>>> d39126c (wallet update)
        };
    });

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
            
<<<<<<< HEAD
            const newStats = { ...stats, ...resumeStats, ...adminStats, ...productStats };
            setStats(newStats);
            localStorage.setItem('adminDashboardStats', JSON.stringify(newStats));
        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
        }
=======
            // Use the functional update form of useState to avoid dependency on 'stats'
            const mergedStats = { ...resumeStats, ...adminStats, ...productStats };
            setStats(prevStats => ({...prevStats, ...mergedStats}));
            
            // Update local storage with the fully merged data
            localStorage.setItem('adminDashboardStats', JSON.stringify(mergedStats));

        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
        }
    // --- THE FIX IS HERE ---
    // 'stats' has been removed from the dependency array to prevent the infinite loop.
>>>>>>> d39126c (wallet update)
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
<<<<<<< HEAD
                <DashboardHeader />
=======
                {/* Pass stats to the header for the notification badge */}
                <DashboardHeader stats={stats} />
>>>>>>> d39126c (wallet update)
                <ResumeStatsSection stats={stats} onUploadSuccess={fetchAllStats} url={url} />
                <TradingStatsSection stats={stats} />
                <AnalyticsSection stats={stats} />
            </Box>
        </Flex>
    );
};

export default AdminDashboard;