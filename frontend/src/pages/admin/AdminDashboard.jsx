// import React, { useState, useEffect, useCallback } from 'react';
// import { Box, Flex, useColorModeValue, Grid } from '@chakra-ui/react';
// import { useAuth } from '../../AppContext';

// // Import Layout & Sectional Components
// import AdminNavBar from '../../components/layout/AdminNavBar';
// import DashboardHeader from '../../components/dashboard/DashboardHeader';
// import ResumeStatsSection from '../../components/dashboard/ResumeStatsSection';
// import TradingStatsSection from '../../components/dashboard/TradingStatsSection';
// import AnalyticsSection from '../../components/dashboard/AnalyticsSection';
// import AllVendorsPage from '../vendor/AllVendorsPage';
// import ThemeToggle from '../../components/ThemeToggle';
// import RecentTransactions from '../../pages/admin/RecentTransactions';

// const AdminDashboard = ({ url }) => {
//     const { token } = useAuth();
    
//     // --- RESOLVED: Merged initial state from both versions ---
//     const [stats, setStats] = useState(() => {
//         const cached = localStorage.getItem('adminDashboardStats');
//         return cached ? JSON.parse(cached) : {
//             uploadedResume: 0,
//         pendingVendorApprovals: 0,
//         pendingTradeApprovals: 0,
//         availableProducts: 0,
//         membersInLive: 0,
//         // pendingPayOuts: 0,
//         // totalPayouts: 0,
//         pendingWalletApprovals: 0, // Kept the incoming change for the new feature
//         };
//     });

//     // --- RESOLVED: Kept the incoming change which fixes an infinite loop ---
//     const fetchAllStats = useCallback(async () => {
//         if (!token) return;
//         try {
//             const headers = { 'Authorization': `Bearer ${token}` };
//             const [resumeResponse, adminResponse, productResponse] = await Promise.all([
//                 fetch(`${url}/api/resumes/stats/dashboard`, { headers }),
//                 fetch(`${url}/api/admin/stats/dashboard`, { headers }),
//                 fetch(`${url}/api/products/stats/dashboard`, { headers })
//             ]);

//             if (!resumeResponse.ok || !adminResponse.ok || !productResponse.ok) {
//                 throw new Error('Failed to fetch one or more dashboard stats.');
//             }

//             const resumeStats = await resumeResponse.json();
//             const adminStats = await adminResponse.json();
//             const productStats = await productResponse.json();
            
//             const mergedStats = { ...resumeStats, ...adminStats, ...productStats };
//             // Using functional update to avoid dependency on 'stats' in useCallback
//             setStats(prevStats => ({...prevStats, ...mergedStats}));
            
//             localStorage.setItem('adminDashboardStats', JSON.stringify(mergedStats));

//         } catch (error) {
//             console.error("Failed to fetch dashboard stats:", error);
//         }
//     // 'stats' is correctly removed from the dependency array to prevent re-fetching
//     }, [url, token]);

//     useEffect(() => {
//         if (token) {
//             fetchAllStats();
//         }
//     }, [token, fetchAllStats]);

//     const mainBg = useColorModeValue('#F9FAFB', 'gray.800');

//     return (
//         <Flex minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
//             <AdminNavBar />
//             <Box flex="1" ml="80px" p={{ base: 4, md: 8 }} bg={mainBg}>
//                 {/* --- RESOLVED: Kept the incoming change to pass stats for the notification badge --- */}
//                 <DashboardHeader stats={stats} />
//                 <ResumeStatsSection stats={stats} onUploadSuccess={fetchAllStats} url={url} />
//                 <TradingStatsSection stats={stats} />
//                 <AnalyticsSection stats={stats} />
//                 {/* <AllVendorsPage url={url} mode="dashboard" /> */}
//                 <Grid
//     templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} // Mobile: 1 column. Large screens: 2 columns.
//     gap={6}    // Space between the items
//     mt={8}     // Space above the section
// >
//     {/* This will appear on the left on desktop, and on top on mobile */}
//     <RecentTransactions url={url} />
    
//     {/* This will appear on the right on desktop, and below on mobile */}
//     <AllVendorsPage url={url} mode="dashboard" />
// </Grid>
//             </Box>
//         </Flex>
//     );
// };

// export default AdminDashboard;

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Flex, useColorModeValue, Grid, IconButton, useDisclosure, Drawer, DrawerContent, DrawerOverlay } from '@chakra-ui/react';
import { useAuth } from '../../AppContext';
import { HamburgerIcon } from '@chakra-ui/icons';

// Import Layout & Sectional Components
import AdminNavBar from '../../components/layout/AdminNavBar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import ResumeStatsSection from '../../components/dashboard/ResumeStatsSection';
import TradingStatsSection from '../../components/dashboard/TradingStatsSection';
import AnalyticsSection from '../../components/dashboard/AnalyticsSection';
import AllVendorsPage from '../vendor/AllVendorsPage';
import RecentTransactions from '../../pages/admin/RecentTransactions';
// --- NEW: Import the new section component for managing percentages ---
import ManagePercentageSection from '../../components/dashboard/ManagePercentageSection';

const AdminDashboard = ({ url }) => {
    const { token } = useAuth();
    
    const { isOpen, onOpen, onClose } = useDisclosure();
    // State for dashboard stats
    const [stats, setStats] = useState(() => {
    const cached = localStorage.getItem('adminDashboardStats');
    return cached ? JSON.parse(cached) : {
        pendingVendorApprovals: 0,
        pendingTradeApprovals: 0,
        availableProducts: 0,
        membersInLive: 0,
        pendingWalletApprovals: 0,
    };
});

    // Callback to fetch all dashboard stats
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
            setStats(prevStats => ({...prevStats, ...mergedStats}));
            
            localStorage.setItem('adminDashboardStats', JSON.stringify(mergedStats));

        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
        }
    }, [url, token]);

    useEffect(() => {
        if (token) {
            fetchAllStats();
        }
    }, [token, fetchAllStats]);

    const mainBg = useColorModeValue('gray.100', 'gray.800');

    return (
    <Flex minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
        
        {/* This is the static sidebar that only appears on desktop screens. */}
        {/* We pass the 'static' variant to it. */}
        <AdminNavBar variant="static" />

        {/* This is the hidden Drawer that will slide out on mobile. */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
            <DrawerOverlay />
            <DrawerContent>
                {/* We reuse your navbar component inside the drawer. */}
                <AdminNavBar variant="drawer" />
            </DrawerContent>
        </Drawer>

        {/* This is the main content area. Its margin is now responsive. */}
        <Box 
            flex="1" 
            ml={{ base: 0, lg: '80px' }} // No margin on mobile, 80px on large screens
            p={{ base: 4, md: 8 }} 
            bg={mainBg}
        >
            {/* This is the hamburger button. It only appears on mobile screens. */}
            <IconButton
                aria-label="Open Menu"
                icon={<HamburgerIcon />}
                size="lg"
                variant="ghost"
                onClick={onOpen} // This opens the drawer
                display={{ base: 'flex', lg: 'none' }} // This makes it responsive
                mb={4}
            />

            {/* All of your existing content goes below, unchanged. */}
            <DashboardHeader stats={stats} />
            
            <ResumeStatsSection stats={stats} onUploadSuccess={fetchAllStats} url={url} />
            
            <Grid templateColumns={{ base: '1fr', xl: '1fr 1fr' }} gap={6} mt={6}>
                <TradingStatsSection stats={stats} />
                <ManagePercentageSection url={url} />
            </Grid>

            <AnalyticsSection stats={stats} />

            <Grid
                templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }}
                gap={6}
                mt={8}
            >
                <RecentTransactions url={url} />
                <AllVendorsPage url={url} mode="dashboard" />
            </Grid>
        </Box>
    </Flex>
);
};

export default AdminDashboard;