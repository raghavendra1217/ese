// import React, { useState, useEffect, useCallback } from 'react';
// import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
// import { useAuth } from '../../AppContext';

// // Import Layout & Sectional Components
// import VendorNavBar from '../../components/layout/VendorNavBar';
// import VendorDashboardHeader from '../../components/vendordashboard/VendorDashboardHeader';
// import PerformanceStatsSection from '../../components/vendordashboard/PerformanceStatsSection';
// import VendorTradingSection from '../../components/vendordashboard/VendorTradingSection';
// import VendorAnalyticsSection from '../../components/vendordashboard/VendorAnalyticsSection';

// const VendorDashboard = ({ url }) => {
//     const { token } = useAuth();
//     const [stats, setStats] = useState({
//         assignedResumes: 0, completedResumes: 0, availableProducts: 0,
//         purchasedProducts: 0, purchasedValue: 0, pendingPayOuts: 0,
//         pendingTradeApprovals: 0, availableVacancies: 0, employeesOnHold: 0,
//         receivedBill: '0', pendingBill: 0, totalPayouts: 0,
//     });

//     const fetchAllStats = useCallback(async () => {
//         if (!token) return;
//         const headers = { 'Authorization': `Bearer ${token}` };
        
//         try {
//             const [vendorResponse, productCountResponse] = await Promise.all([
//                 fetch(`${url}/api/vendor/stats/dashboard`, { headers }),
//                 fetch(`${url}/api/products/stats/available-count`, { headers })
//             ]);

//             if (!vendorResponse.ok || !productCountResponse.ok) {
//                 throw new Error('Failed to fetch one or more vendor stats.');
//             }

//             const vendorStats = await vendorResponse.json();
//             const productCountStats = await productCountResponse.json();

//             setStats(prevStats => ({
//                 ...prevStats,
//                 ...vendorStats,
//                 availableProducts: productCountStats.availableProducts ?? 0,
//             }));

//         } catch (error) {
//             console.error("Error fetching vendor dashboard stats:", error);
//         }
//     }, [token, url]);

//     useEffect(() => {
//         fetchAllStats();
//         window.addEventListener('focus', fetchAllStats);
//         return () => {
//             window.removeEventListener('focus', fetchAllStats);
//         };
//     }, [fetchAllStats]);

//     const mainBg = useColorModeValue('#F9FAFB', 'gray.800');

//     return (
//         <Flex minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
//             <VendorNavBar />
//             <Box flex="1" ml="80px" p={{ base: 4, md: 8 }} bg={mainBg}>
//                 <VendorDashboardHeader />
//                 <PerformanceStatsSection stats={stats} />
//                 <VendorTradingSection stats={stats} />
//                 <VendorAnalyticsSection stats={stats} />
//             </Box>
//         </Flex>
//     );
// };

// export default VendorDashboard;

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

// Import Layout & Sectional Components
import VendorNavBar from '../../components/layout/VendorNavBar';
import VendorDashboardHeader from '../../components/vendordashboard/VendorDashboardHeader';
import PerformanceStatsSection from '../../components/vendordashboard/PerformanceStatsSection';
import VendorTradingSection from '../../components/vendordashboard/VendorTradingSection';
// --- REMOVED: VendorAnalyticsSection is no longer imported as it was a placeholder ---

const VendorDashboard = ({ url }) => {
    const { token } = useAuth();
    
    // --- UPDATED: Initial state now only contains real, non-dummy data points ---
    const [stats, setStats] = useState({
        // These stats are fetched from the /api/vendor/stats/dashboard endpoint
        purchasedProducts: 0,
        purchasedValue: 0,
        pendingTradeApprovals: 0,
        // This stat is fetched from the /api/products/stats/available-count endpoint
        availableProducts: 0,
    });

    const fetchAllStats = useCallback(async () => {
        if (!token) return;
        const headers = { 'Authorization': `Bearer ${token}` };
        
        try {
            const [vendorResponse, productCountResponse] = await Promise.all([
                fetch(`${url}/api/vendor/stats/dashboard`, { headers }),
                fetch(`${url}/api/products/stats/available-count`, { headers })
            ]);

            if (!vendorResponse.ok || !productCountResponse.ok) {
                throw new Error('Failed to fetch one or more vendor stats.');
            }

            const vendorStats = await vendorResponse.json();
            const productCountStats = await productCountResponse.json();

            // This merges the real data from both APIs into the clean state
            setStats(prevStats => ({
                ...prevStats,
                ...vendorStats,
                availableProducts: productCountStats.availableProducts ?? 0,
            }));

        } catch (error) {
            console.error("Error fetching vendor dashboard stats:", error);
        }
    }, [token, url]);

    useEffect(() => {
        if (token) {
            fetchAllStats();
        }
        // This is a good feature to keep the data fresh
        window.addEventListener('focus', fetchAllStats);
        return () => {
            window.removeEventListener('focus', fetchAllStats);
        };
    }, [fetchAllStats, token]); // Corrected dependency array

    const mainBg = useColorModeValue('#F9FAFB', 'gray.800');

    return (
        <Flex minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
            <VendorNavBar />
            <Box flex="1" ml="80px" p={{ base: 4, md: 8 }} bg={mainBg}>
                <VendorDashboardHeader />
                {/* This component now just serves as the main page title */}
                <PerformanceStatsSection /> 
                {/* This component displays all the real, fetched stats */}
                <VendorTradingSection stats={stats} />
                {/* --- REMOVED: The VendorAnalyticsSection component is no longer rendered --- */}
            </Box>
        </Flex>
    );
};

export default VendorDashboard;