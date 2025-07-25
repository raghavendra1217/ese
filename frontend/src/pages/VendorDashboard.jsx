// Example path: src/pages/VendorDashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Box, Flex, VStack, Grid, Heading, Text, Button, IconButton, Input, InputGroup,
    InputLeftElement, useColorModeValue, Spacer, Tooltip
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FaUsers, FaRegUserCircle, FaFolder, FaCog, FaPowerOff } from 'react-icons/fa';
import { GoHome, GoGraph } from 'react-icons/go';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { HiOutlineMail } from 'react-icons/hi';
import { BsPersonCheckFill, BsCart3, BsCheckCircle } from 'react-icons/bs';
import { useAuth } from '../AppContext';

// --- Vendor-Specific Reusable Components (No changes needed here) ---

const VendorSidebarIcon = ({ icon, label, to = "#", active = false }) => (
    <Tooltip label={label} placement="right" hasArrow>
        <Button as={RouterLink} to={to} justifyContent="center" w="full" py={6} variant={active ? 'solid' : 'ghost'} colorScheme={active ? 'blue' : 'gray'} color={active ? 'white' : 'gray.400'} _hover={{ bg: 'gray.700', color: 'white' }} aria-label={label}>
            {icon}
        </Button>
    </Tooltip>
);

const VendorNavBar = () => {
    const { logout } = useAuth();
    const location = window.location;
    return (
        <VStack as="nav" h="100vh" w="80px" position="fixed" left={0} top={0} bg="gray.900" boxShadow="md" spacing={2} py={6} zIndex={10}>
            <VendorSidebarIcon icon={<GoHome size={22} />} label="Dashboard" to="/vendor/dashboard" active={location.pathname.startsWith('/vendor/dashboard')} />
            <VendorSidebarIcon icon={<FaFolder size={20} />} label="My Resumes" to="#" />
            <VendorSidebarIcon icon={<GoGraph size={20} />} label="My Payouts" to="#" />
            <Spacer />
            <VendorSidebarIcon icon={<FaCog size={20} />} label="My Profile" to="#" />
            <Tooltip label="Logout" placement="right" hasArrow>
                <IconButton aria-label="Logout" icon={<FaPowerOff />} onClick={logout} variant="ghost" colorScheme="red" w="full" />
            </Tooltip>
        </VStack>
    );
};

const StatCard = ({ icon, label, value, iconBgColor = 'blue.500' }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const labelColor = useColorModeValue('gray.500', 'gray.400');
    const valueColor = useColorModeValue('gray.900', 'white');
    return ( <Flex bg={cardBg} p={4} borderRadius="lg" boxShadow="sm" align="center"> <Box p={3} borderRadius="lg" bg={iconBgColor} color="white" mr={4}>{icon}</Box> <Box> <Text fontSize="sm" color={labelColor}>{label}</Text> <Heading size="md" color={valueColor}>{value.toLocaleString()}</Heading> </Box> </Flex> );
};

const ProductStatCard = ({ value }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const valueColor = useColorModeValue('gray.900', 'white');
    const navigate = useNavigate();
    return (
        <Flex bg={cardBg} p={4} borderRadius="lg" boxShadow="sm" direction="column" justify="space-between" minH="130px">
            <Box>
                <Text fontSize="sm" color="gray.500">Available Products</Text>
                <Heading size="md" color={valueColor}>{value.toLocaleString()}</Heading>
            </Box>
            <Button colorScheme="blue" w="full" mt={2} onClick={() => navigate('/vendor/products')}>
                View Products
            </Button>
        </Flex>
    );
};

// --- Main Dashboard Content Area (This is where the fix is) ---

const VendorDashboardContent = () => {
    const { user, token } = useAuth();
    const [stats, setStats] = useState({
        assignedResumes: 0, completedResumes: 0, availableProducts: 0, purchasedProducts: 0,
        purchasedValue: 0, pendingPayOuts: 0,
        // Placeholders can still have defaults
        pendingEmployeeApprovals: 0, availableVacancies: 10, employeesOnHold: 8,
        receivedBill: '0', pendingBill: 0, totalPayouts: 0,
    });
    
    // --- THE FIX IS HERE ---
    const fetchAllStats = useCallback(async () => {
        if (!token) return;
        try {
            // 1. We only need ONE API call because the backend controller is efficient.
            const response = await fetch('/api/vendor/dashboard-stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                // Try to get a more specific error message from the backend
                const errorData = await response.json().catch(() => ({ message: 'Failed to fetch dashboard data.' }));
                throw new Error(errorData.message);
            }
            
            const fetchedStats = await response.json();
            
            // 2. We update the state with the complete object from the single API call.
            setStats(prevStats => ({
                ...prevStats, // Keep any placeholder values
                ...fetchedStats, // Overwrite with fresh data from the server
            }));

        } catch (error) { 
            console.error("Failed to fetch dashboard stats:", error);
            // Optionally, show a toast notification to the user here
        }
    }, [token]); // This function only re-creates itself if the token changes

    useEffect(() => {
        fetchAllStats();
        window.addEventListener('focus', fetchAllStats);
        return () => {
            window.removeEventListener('focus', fetchAllStats);
        };
    }, [fetchAllStats]);
    // --- END OF FIX ---

    const mainBg = useColorModeValue('#F9FAFB', 'gray.800');
    const cardBg = useColorModeValue('white', 'gray.700');
    const textColor = useColorModeValue('gray.800', 'white');
    const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');

    return (
        <Box flex="1" ml="80px" p={{ base: 4, md: 8 }} bg={mainBg}>
            <Flex justify="space-between" align="center" mb={8}>
                <InputGroup w={{ base: '100%', md: 'sm' }}><InputLeftElement pointerEvents="none" children={<SearchIcon color="gray.400" />} /><Input type="text" placeholder="Search..." bg={cardBg} borderRadius="md" /></InputGroup>
                <Flex align="center" gap={4}><IconButton variant="ghost" aria-label="Mail" icon={<HiOutlineMail size={24} />} /><IconButton variant="ghost" aria-label="Notifications" icon={<IoMdNotificationsOutline size={24} />} /><Flex align="center" gap={2}><FaRegUserCircle size={28} /><Text fontWeight="semibold" display={{ base: 'none', sm: 'block' }}>Hello, {user?.email.split('@')[0] || 'Vendor'}</Text></Flex></Flex>
            </Flex>
            <Box as="section" mb={8}>
                <Flex justify="space-between" align="center" mb={4}><Box><Heading as="h1" size="xl" color={textColor}>Vendor Dashboard</Heading><Text color={secondaryTextColor}>Your Performance Overview</Text></Box></Flex>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
                    <StatCard label="Available Vacancies" value={stats.availableVacancies} icon={<FaUsers size={24} />} iconBgColor="blue.500" />
                    <StatCard label="Pending Employee Approvals" value={stats.pendingEmployeeApprovals} icon={<BsPersonCheckFill size={24} />} iconBgColor="orange.500" />
                    <StatCard label="Assigned Resumes" value={stats.assignedResumes} icon={<BsCart3 size={24} />} iconBgColor="green.500" />
                    <StatCard label="Completed Resumes" value={stats.completedResumes} icon={<BsCheckCircle size={24} />} iconBgColor="purple.500" />
                    <StatCard label="Employees on Hold" value={stats.employeesOnHold} icon={<BsPersonCheckFill size={24} />} iconBgColor="sky.500" />
                    <StatCard label="Received Bill" value={stats.receivedBill} icon={<BsCart3 size={24} />} iconBgColor="green.500" />
                    <StatCard label="Pending Bill" value={stats.pendingBill} icon={<BsCheckCircle size={24} />} iconBgColor="purple.500" />
                </Grid>
            </Box>
            <Box as="section" mb={8}><Flex justify="space-between" align="center" mb={4}><Heading as="h2" size="lg" color={secondaryTextColor}>TRADING</Heading></Flex><Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
                <ProductStatCard value={stats.availableProducts} />
                <StatCard label="Purchased Products" value={stats.purchasedProducts} icon={<BsPersonCheckFill size={24} />} iconBgColor="sky.500" />
                <StatCard label="Purchased Value" value={stats.purchasedValue} icon={<BsCart3 size={24} />} iconBgColor="green.500" />
                <StatCard label="Pending Pay Outs" value={stats.pendingPayOuts} icon={<BsCheckCircle size={24} />} iconBgColor="purple.500" />
                </Grid>
            </Box>
            <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}><Box bg={cardBg} p={6} borderRadius="lg" boxShadow="sm"><Flex justify="space-between" align="center" mb={4}><Heading size="md">Performance Statistics</Heading><Button size="sm" colorScheme="green" variant="outline">Export</Button></Flex><Box h="250px" bg={useColorModeValue('gray.100', 'gray.600')} borderRadius="md"></Box></Box><Flex direction="column" bg="blue.600" color="white" p={6} borderRadius="lg" boxShadow="sm"><Flex justify="space-between" align="start"><Box><Heading size="md">Total Payouts</Heading><Text color="blue.200">This Month</Text></Box><Button size="sm" colorScheme="blue" variant="solid" bg="blue.500" _hover={{bg: 'blue.400'}}>Details</Button></Flex><Spacer /><Heading size="2xl">{stats.totalPayouts.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</Heading></Flex></Grid>
        </Box>
    );
};

// --- Main Component Export (No changes here) ---
const VendorDashboard = () => (
    <Flex minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
        <VendorNavBar />
        <VendorDashboardContent />
    </Flex>
);

export default VendorDashboard;