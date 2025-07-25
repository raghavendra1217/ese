import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
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

// --- Vendor-Specific Reusable Components ---

const VendorSidebarIcon = ({ icon, label, to = "#", active = false }) => (
    <Tooltip label={label} placement="right" hasArrow>
        <Button as={RouterLink} to={to} justifyContent="center" w="full" py={6} variant={active ? 'solid' : 'ghost'} colorScheme={active ? 'blue' : 'gray'} color={active ? 'white' : 'gray.400'} _hover={{ bg: 'gray.700', color: 'white' }} aria-label={label}>
            {icon}
        </Button>
    </Tooltip>
);

const VendorNavBar = () => {
    const { logout } = useAuth();
    const location = useLocation();
    return (
        <VStack as="nav" h="100vh" w="80px" position="fixed" left={0} top={0} bg="gray.900" boxShadow="md" spacing={2} py={6} zIndex={10}>
            <VendorSidebarIcon icon={<GoHome size={22} />} label="Dashboard" to="/vendor/dashboard" active={location.pathname === '/vendor/dashboard'} />
            <VendorSidebarIcon icon={<BsCart3 size={20} />} label="Products" to="/vendor/products" active={location.pathname === '/vendor/products'} />
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

const StatCard = ({ icon, label, value, iconBgColor = 'blue.500', to = null }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const labelColor = useColorModeValue('gray.500', 'gray.400');
    const valueColor = useColorModeValue('gray.900', 'white');
    const hoverStyles = { transform: 'translateY(-3px)', boxShadow: 'xl', cursor: 'pointer' };

    return (
        <Flex
            as={to ? RouterLink : 'div'} to={to} bg={cardBg} p={4} borderRadius="lg"
            boxShadow="sm" align="center" transition="all 0.2s ease-in-out"
            _hover={to ? hoverStyles : {}}
        >
            <Box p={3} borderRadius="lg" bg={iconBgColor} color="white" mr={4}>{icon}</Box>
            <Box>
                <Text fontSize="sm" color={labelColor}>{label}</Text>
                <Heading size="md" color={valueColor}>{value}</Heading>
            </Box>
        </Flex>
    );
};

const ProductStatCard = ({ value }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const valueColor = useColorModeValue('gray.900', 'white');
    const navigate = useNavigate();
    return (
        <Flex bg={cardBg} p={4} borderRadius="lg" boxShadow="sm" direction="column" justify="space-between" minH="130px">
            <Box>
                <Text fontSize="sm" color="gray.500">Products Available to Buy</Text>
                <Heading size="md" color={valueColor}>{value.toLocaleString()}</Heading>
            </Box>
            <Button colorScheme="blue" w="full" mt={2} onClick={() => navigate('/vendor/products')}>
                View Products
            </Button>
        </Flex>
    );
};

// --- Main Dashboard Content Area ---

const VendorDashboardContent = ({ url }) => {
    const { user, token } = useAuth();
    // Individual useState hooks for each dashboard variable, no localStorage
    const [assignedResumes, setAssignedResumes] = useState(0);
    const [completedResumes, setCompletedResumes] = useState(0);
    const [availableProducts, setAvailableProducts] = useState(0);
    const [purchasedProducts, setPurchasedProducts] = useState(0);
    const [purchasedValue, setPurchasedValue] = useState(0);
    const [pendingPayOuts, setPendingPayOuts] = useState(0);
    const [pendingTradeApprovals, setPendingTradeApprovals] = useState(0);
    const [availableVacancies, setAvailableVacancies] = useState(10);
    const [employeesOnHold, setEmployeesOnHold] = useState(8);
    const [receivedBill, setReceivedBill] = useState('384.5');
    const [pendingBill, setPendingBill] = useState(0);
    const [totalPayouts, setTotalPayouts] = useState(4578.58);

    const fetchAllStats = useCallback(async () => {
        if (!token) return;
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch Vendor Dashboard Stats
        try {
            const response = await fetch(`${url}/api/vendor/stats/dashboard`, { headers });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const vendorStats = await response.json();
            setAssignedResumes(vendorStats.assignedResumes ?? 0);
            setCompletedResumes(vendorStats.completedResumes ?? 0);
            setAvailableProducts(vendorStats.availableProducts ?? 0);
            setPurchasedProducts(vendorStats.purchasedProducts ?? 0);
            setPurchasedValue(vendorStats.purchasedValue ?? 0);
            setPendingTradeApprovals(vendorStats.pendingTradeApprovals ?? 0);
            setPendingPayOuts(vendorStats.pendingPayOuts ?? 0);
            setAvailableVacancies(vendorStats.availableVacancies ?? 10);
            setEmployeesOnHold(vendorStats.employeesOnHold ?? 8);
            setReceivedBill(vendorStats.receivedBill ?? '384.5');
            setPendingBill(vendorStats.pendingBill ?? 0);
            setTotalPayouts(vendorStats.totalPayouts ?? 4578.58);
        } catch (error) {
            console.error("Error fetching VENDOR stats:", error);
        }

        // Fetch Available Products Count
        try {
            const response = await fetch(`${url}/api/products/stats/available-count`, { headers });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const productCountStats = await response.json();
            setAvailableProducts(productCountStats.availableCount ?? 0);
        } catch (error) {
            console.error("Error fetching PRODUCT COUNT stats:", error);
        }
    }, [token, url]);

    useEffect(() => {
        fetchAllStats();
        window.addEventListener('focus', fetchAllStats);
        return () => {
            window.removeEventListener('focus', fetchAllStats);
        };
    }, [fetchAllStats]);

    const mainBg = useColorModeValue('#F9FAFB', 'gray.800');
    const cardBg = useColorModeValue('white', 'gray.700');
    const textColor = useColorModeValue('gray.800', 'white');
    const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');

    return (
        <Box flex="1" ml="80px" p={{ base: 4, md: 8 }} bg={mainBg}>
            <Flex justify="space-between" align="center" mb={8}>
                <InputGroup w={{ base: '100%', md: 'sm' }}>
                    <InputLeftElement pointerEvents="none" children={<SearchIcon color="gray.400" />} />
                    <Input type="text" placeholder="Search..." bg={cardBg} borderRadius="md" />
                </InputGroup>
                <Flex align="center" gap={4}>
                    <IconButton variant="ghost" aria-label="Mail" icon={<HiOutlineMail size={24} />} />
                    <IconButton variant="ghost" aria-label="Notifications" icon={<IoMdNotificationsOutline size={24} />} />
                    <Flex align="center" gap={2}>
                        <FaRegUserCircle size={28} />
                        <Text fontWeight="semibold" display={{ base: 'none', sm: 'block' }}>Hello, {user?.email.split('@')[0] || 'Vendor'}</Text>
                    </Flex>
                </Flex>
            </Flex>
            
            <Box as="section" mb={8}>
                <Flex justify="space-between" align="center" mb={4}>
                    <Box>
                        <Heading as="h1" size="xl" color={textColor}>Vendor Dashboard</Heading>
                        <Text color={secondaryTextColor}>Your Performance Overview</Text>
                    </Box>
                </Flex>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
                    {/* Real Data Fetched from API */}
                    <StatCard label="Assigned Resumes" value={assignedResumes.toLocaleString()} icon={<BsCart3 size={24} />} iconBgColor="green.500" />
                    <StatCard label="Completed Resumes" value={completedResumes.toLocaleString()} icon={<BsCheckCircle size={24} />} iconBgColor="purple.500" />
                    <StatCard label="Pending Payouts" value={pendingPayOuts.toLocaleString()} icon={<GoGraph size={24} />} iconBgColor="orange.500" />
                    
                    {/* Dummy/Placeholder Stats Retained as Requested */}
                    <StatCard label="Available Vacancies" value={availableVacancies.toLocaleString()} icon={<FaUsers size={24} />} iconBgColor="blue.500" />
                    <StatCard label="Employees on Hold" value={employeesOnHold.toLocaleString()} icon={<BsPersonCheckFill size={24} />} iconBgColor="sky.500" />
                    <StatCard label="Received Bill" value={receivedBill} icon={<BsCart3 size={24} />} iconBgColor="green.500" />
                    <StatCard label="Pending Bill" value={pendingBill.toLocaleString()} icon={<BsCheckCircle size={24} />} iconBgColor="purple.500" />
                </Grid>
            </Box>

            <Box as="section" mb={8}>
                <Flex justify="space-between" align="center" mb={4}>
                    <Heading as="h2" size="lg" color={secondaryTextColor}>TRADING</Heading>
                </Flex>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
                    <ProductStatCard value={availableProducts} />
                    <StatCard 
                        label="My Approved Purchases" 
                        value={purchasedProducts.toLocaleString()} 
                        icon={<BsPersonCheckFill size={24} />} 
                        iconBgColor="sky.500"
                        to="/my-purchases" // Makes the card a clickable link
                    />
                    <StatCard label="Total Spent" value={purchasedValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} icon={<BsCart3 size={24} />} iconBgColor="green.500" />
                    <StatCard label="Purchases Pending Approval" value={pendingTradeApprovals.toLocaleString()} icon={<BsCheckCircle size={24} />} iconBgColor="purple.500" />
                </Grid>
            </Box>

            <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
                <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="sm">
                    <Flex justify="space-between" align="center" mb={4}>
                        <Heading size="md">Performance Statistics</Heading>
                        <Button size="sm" colorScheme="green" variant="outline">Export</Button>
                    </Flex>
                    <Box h="250px" bg={useColorModeValue('gray.100', 'gray.600')} borderRadius="md"></Box>
                </Box>
                <Flex direction="column" bg="blue.600" color="white" p={6} borderRadius="lg" boxShadow="sm">
                    <Flex justify="space-between" align="start">
                        <Box>
                            <Heading size="md">Total Payouts</Heading>
                            <Text color="blue.200">This Month</Text>
                        </Box>
                        <Button size="sm" colorScheme="blue" variant="solid" bg="blue.500" _hover={{bg: 'blue.400'}}>Details</Button>
                    </Flex>
                    <Spacer />
                    <Heading size="2xl">{totalPayouts.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</Heading>
                </Flex>
            </Grid>
        </Box>
    );
};

const VendorDashboard = ({ url }) => (
    <Flex minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
        <VendorNavBar />
        <VendorDashboardContent url={url} />
    </Flex>
);

export default VendorDashboard;