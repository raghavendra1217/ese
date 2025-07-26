import React, { useState, useEffect, useRef, useCallback } from 'react';
// UPDATED: Import useLocation for better route matching in the NavBar
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Flex, VStack, Grid, Heading, Text, Button, IconButton, Input, InputGroup,
    InputLeftElement, useColorModeValue, Spacer, Tooltip, useToast
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FaUsers, FaRegUserCircle, FaChartBar, FaFolder, FaCog, FaAngleDown, FaPowerOff } from 'react-icons/fa';
import { GoHome, GoGraph } from 'react-icons/go';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { HiOutlineMail } from 'react-icons/hi';
import { BsPersonCheckFill, BsCart3, BsCheckCircle, BsPrinter } from 'react-icons/bs';
import { useAuth } from '../AppContext';

// --- Reusable Components ---


const SidebarIcon = ({ icon, label, to = "#", active = false }) => (
    <Tooltip label={label} placement="right" hasArrow>
        <Button as={RouterLink} to={to} justifyContent="center" w="full" py={6} variant={active ? 'solid' : 'ghost'} colorScheme={active ? 'blue' : 'gray'} color={active ? 'white' : 'gray.400'} _hover={{ bg: 'gray.700', color: 'white' }} aria-label={label}>
            {icon}
        </Button>
    </Tooltip>
);

const NavBar = () => {
    const { logout } = useAuth();
    // Using the useLocation hook is the standard way to get the current path
    const location = useLocation(); 
    return (
        <VStack as="nav" h="100vh" w="80px" position="fixed" left={0} top={0} bg="gray.900" boxShadow="md" spacing={2} py={6} zIndex={10}>
            <SidebarIcon icon={<GoHome size={22} />} label="Dashboard" to="/admin/dashboard" active={location.pathname === '/admin/dashboard'} />
            <SidebarIcon icon={<BsPersonCheckFill size={20} />} label="Vendor Approvals" to="/admin/manage-approvals" active={location.pathname === '/admin/manage-approvals'} />
            
            {/* --- NEW LINK FOR TRADING APPROVALS --- */}
            <SidebarIcon icon={<GoGraph size={20} />} label="Trading Approvals" to="/admin/manage-trading-approvals" active={location.pathname === '/admin/manage-trading-approvals'} />
            
            <SidebarIcon icon={<BsCart3 size={20} />} label="Products" to="/admin/manage-products" active={location.pathname === '/admin/manage-products'} />
            
            <SidebarIcon icon={<FaUsers size={20} />} label="Members" to="#" />
            <Spacer />
            <SidebarIcon icon={<FaCog size={20} />} label="Settings" to="#" />
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

// --- Interactive Cards ---

const UploadResumeCard = ({ count, onUploadSuccess, url }) => {
    const { token } = useAuth();
    const cardBg = useColorModeValue('white', 'gray.700');
    const valueColor = useColorModeValue('gray.900', 'white');
    const toast = useToast();
    const fileInputRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleFileUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        setIsLoading(true);
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) { formData.append('resumes', files[i]); }
        try {
            const response = await fetch(`${url}/api/resumes/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Upload failed.');
            toast({ title: 'Upload Successful', description: data.message, status: 'success', duration: 5000, isClosable: true });
            onUploadSuccess();
        } catch (error) {
            toast({ title: 'Upload Error', description: error.message, status: 'error', duration: 5000, isClosable: true });
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    const triggerFileSelect = () => fileInputRef.current?.click();
    return ( <Flex bg={cardBg} p={4} borderRadius="lg" boxShadow="sm" direction="column" justify="space-between" minH="130px"> <Box> <Text fontSize="sm" color="gray.500">Uploaded Resumes</Text> <Heading size="md" color={valueColor}>{count.toLocaleString()}</Heading> </Box> <Input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} display="none" /> <Button colorScheme="green" w="full" mt={2} onClick={triggerFileSelect} isLoading={isLoading}> Upload Resumes </Button> </Flex> );
};

const ApprovalStatCard = ({ value }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const valueColor = useColorModeValue('gray.900', 'white');
    const navigate = useNavigate();
    return ( <Flex bg={cardBg} p={4} borderRadius="lg" boxShadow="sm" direction="column" justify="space-between" minH="130px"> <Box> <Text fontSize="sm" color="gray.500">Pending Vendor Approvals</Text> <Heading size="md" color={valueColor}>{value.toLocaleString()}</Heading> </Box> <Button colorScheme="orange" w="full" mt={2} onClick={() => navigate('/admin/manage-approvals')} > Manage Approvals </Button> </Flex> );
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
            <Button colorScheme="blue" w="full" mt={2} onClick={() => navigate('/admin/manage-products')}>
                Manage Products
            </Button>
        </Flex>
    );
};

// --- NEW INTERACTIVE CARD FOR TRADE APPROVALS ---
const TradeApprovalStatCard = ({ value }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const valueColor = useColorModeValue('gray.900', 'white');
    const navigate = useNavigate();
    return (
        <Flex bg={cardBg} p={4} borderRadius="lg" boxShadow="sm" direction="column" justify="space-between" minH="130px">
            <Box>
                <Text fontSize="sm" color="gray.500">Pending Trade Approvals</Text>
                <Heading size="md" color={valueColor}>{value.toLocaleString()}</Heading>
            </Box>
            <Button colorScheme="teal" w="full" mt={2} onClick={() => navigate('/admin/manage-trading-approvals')}>
                Manage Trades
            </Button>
        </Flex>
    );
};


// --- Main Dashboard Component Wrapper ---
const AdminDashboard = ({ url }) => (
    <Flex minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
        <NavBar />
        <DashboardContent url={url} />
    </Flex>
);

// --- Dashboard Content Area ---
const DashboardContent = ({ url }) => {
    const { token } = useAuth();
    // UPDATED: Added pendingTradeApprovals to the initial state
    const [stats, setStats] = useState(() => {
        // Try to load from localStorage first
        const cached = localStorage.getItem('adminDashboardStats');
        return cached ? JSON.parse(cached) : {
            uploadedResume: 0,
            pendingForApproval: 0,
            pendingVendorApprovals: 0,
            pendingTradeApprovals: 0, // <-- New state
            availableProducts: 0,
            // Other dummy stats for layout purposes
            availableVacancies: 10, membersInLive: 8, verifiedResumes: 769, 
            employeesOnHold: 8, receivedBill: '384.5', pendingBill: 0,
            purchasedProducts: 22, purchasedValue: 1245, 
            pendingPayOuts: 576, totalPayouts: 4578.58,
        };
    });

        const fetchAllStats = useCallback(async () => {
        if (!token) return;

        try {
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch from all three endpoints concurrently for better performance
            const [resumeResponse, adminResponse, productResponse] = await Promise.all([
                fetch(`${url}/api/resumes/stats/dashboard`, { headers }),
                fetch(`${url}/api/admin/stats/dashboard`, { headers }),
                fetch(`${url}/api/products/stats/dashboard`, { headers })
            ]);

            // Check if all API calls were successful
            if (!resumeResponse.ok || !adminResponse.ok || !productResponse.ok) {
                // You can add more specific error handling here if needed
                throw new Error('Failed to fetch one or more dashboard stats.');
            }

            const resumeStats = await resumeResponse.json();
            const adminStats = await adminResponse.json(); 
            const productStats = await productResponse.json();

            // Merge all results into the state. The new `pendingTradeApprovals` key
            // from the backend API will be automatically included.
            const newStats = {
                ...resumeStats,
                ...adminStats,
                ...productStats,
            };
            setStats(newStats);
            localStorage.setItem('adminDashboardStats', JSON.stringify(newStats));
        } catch (error) { 
            console.error("Failed to fetch dashboard stats:", error);
            // Optionally, you could show a toast message to the user on failure
        }
    }, [url, token]);
    
    useEffect(() => {
        // Fetch stats when the component mounts or the auth token changes
        if (token) {
            fetchAllStats();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, fetchAllStats]);

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
                    <IconButton variant="ghost" aria-label="Analytics" icon={<FaChartBar size={20} />} />
                    <Flex align="center" gap={2}>
                        <FaRegUserCircle size={28} />
                        <Text fontWeight="semibold" display={{ base: 'none', sm: 'block' }}>Hello, admin</Text>
                    </Flex>
                </Flex>
            </Flex>
            
            <Box as="section" mb={8}>
                <Flex justify="space-between" align="center" mb={4}>
                    <Box>
                        <Heading as="h1" size="xl" color={textColor}>Dashboard</Heading>
                        <Text color={secondaryTextColor}>Resume Uploading</Text>
                    </Box>
                    <Flex gap={2}>
                        <Button variant="outline">Manage</Button>
                        <Button colorScheme="blue">Add Member</Button>
                    </Flex>
                </Flex>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
                    <StatCard label="Available Vacancies" value={stats.availableVacancies} icon={<FaUsers size={24} />} iconBgColor="blue.500" />
                    <ApprovalStatCard value={stats.pendingVendorApprovals} />
                    <UploadResumeCard count={stats.uploadedResume} onUploadSuccess={fetchAllStats} url={url} />
                    <StatCard label="Pending Resumes" value={stats.pendingForApproval} icon={<BsCheckCircle size={24} />} iconBgColor="purple.500" />
                    <StatCard label="Verified Resumes" value={stats.verifiedResumes} icon={<FaUsers size={24} />} iconBgColor="blue.500" />
                    <StatCard label="Employees on Hold" value={stats.employeesOnHold} icon={<BsPersonCheckFill size={24} />} iconBgColor="sky.500" />
                    <StatCard label="Received Bill" value={stats.receivedBill} icon={<BsCart3 size={24} />} iconBgColor="green.500" />
                    <StatCard label="Pending Bill" value={stats.pendingBill} icon={<BsCheckCircle size={24} />} iconBgColor="purple.500" />
                </Grid>
            </Box>

            <Box as="section" mb={8}>
                <Flex justify="space-between" align="center" mb={4}>
                    <Heading as="h2" size="lg" color={secondaryTextColor}>TRADING</Heading>
                    <Flex gap={2}>
                        <Button variant="outline">Manage</Button>
                        <Button colorScheme="blue">Add Member</Button>
                    </Flex>
                </Flex>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
                    {/* UPDATED: Add the new interactive TradeApprovalStatCard here */}
                    <TradeApprovalStatCard value={stats.pendingTradeApprovals} />
                    <ProductStatCard value={stats.availableProducts} />
                    <StatCard label="Purchased Products" value={stats.purchasedProducts} icon={<BsPersonCheckFill size={24} />} iconBgColor="sky.500" />
                    <StatCard label="Purchased Value" value={stats.purchasedValue} icon={<BsCart3 size={24} />} iconBgColor="green.500" />
                </Grid>
            </Box>

            <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
                <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="sm">
                    <Flex justify="space-between" align="center" mb={4}>
                        <Heading size="md">User Statistics</Heading>
                        <Flex gap={2}>
                            <Button size="sm" colorScheme="green" variant="outline">Export</Button>
                            <Button size="sm" colorScheme="blue" variant="outline" leftIcon={<BsPrinter />}>Print</Button>
                        </Flex>
                    </Flex>
                    <Box h="250px" bg={useColorModeValue('gray.100', 'gray.600')} borderRadius="md">
                        {/* Placeholder for a chart */}
                    </Box>
                </Box>
                <Flex direction="column" bg="blue.600" color="white" p={6} borderRadius="lg" boxShadow="sm">
                    <Flex justify="space-between" align="start">
                        <Box>
                            <Heading size="md">Pay Outs</Heading>
                            <Text color="blue.200">June 30 - July 15</Text>
                        </Box>
                        <Button size="sm" colorScheme="blue" variant="solid" bg="blue.500" _hover={{bg: 'blue.400'}} rightIcon={<FaAngleDown />}>Export</Button>
                    </Flex>
                    <Spacer />
                    <Heading size="2xl">{stats.totalPayouts.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</Heading>
                </Flex>
            </Grid>
        </Box>
    );
};

export default AdminDashboard;