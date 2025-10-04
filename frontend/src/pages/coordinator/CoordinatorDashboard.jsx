import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, VStack, SimpleGrid, useColorModeValue, useDisclosure,
  Drawer, DrawerContent, DrawerOverlay, Heading, IconButton,
  Text, Button
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { FaUsers, FaChartBar, FaCog, FaWallet, FaMoneyBillWave, FaArrowUp, FaArrowDown, FaHandshake, FaFileArchive, FaFileInvoice } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AppContext';
import CoordinatorNavBar, { NAV_WIDTH } from '../../components/layout/CoordinatorNavBar';
import CoordinatorDashboardHeader from '../../components/dashboard/CoordinatorDashboardHeader';
import Transactions from '../admin/Transactions';

const CoordinatorDashboard = ({ url }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [stats, setStats] = useState(() => {
    const cached = localStorage.getItem('coordinatorDashboardStats');
    return cached ? JSON.parse(cached) : {
      pendingVendorApprovals: 0,
      pendingTradeApprovals: 0,
      availableProducts: 0,
      pendingWalletApprovals: 0,
      totalVendors: 0,
      vendorsLast8Days: 0,
      todayVendors: 0,
      totalWalletAmount: 0,
      totalWithdrawnAmount: 0,
      totalDepositedAmount: 0,
      availableWildProducts: 0,
      totalInvestors: 0,
      quickRegStats: {
        total_registrations: 0,
        today_registrations: 0,
        week_registrations: 0,
        month_registrations: 0
      },
    };
  });

  // Fetch real vendor counts for coordinator
  const fetchAllStats = useCallback(async () => {
    if (!token) {
      console.log('🔍 Dashboard Debug - No token available');
      return;
    }

    console.log('🔍 Dashboard Debug - Starting fetchAllStats');
    console.log('🔍 Dashboard Debug - URL:', url);
    console.log('🔍 Dashboard Debug - Token:', token ? 'Present' : 'Missing');

    try {
      // Fetch my vendors count (vendors assigned to current coordinator)
      const myVendorsUrl = `${url}/api/coordinator/vendors/my-count?_t=${Date.now()}`;
      console.log('🔍 Dashboard Debug - Fetching My Vendors Count from:', myVendorsUrl);
      
      const myVendorsResponse = await fetch(myVendorsUrl, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });
      
      console.log('🔍 Dashboard Debug - My Vendors Response Status:', myVendorsResponse.status);
      console.log('🔍 Dashboard Debug - My Vendors Response OK:', myVendorsResponse.ok);
      
      const myVendorsData = myVendorsResponse.ok ? await myVendorsResponse.json() : { count: 0 };
      console.log('🔍 Dashboard Debug - My Vendors Data:', myVendorsData);
      console.log('🔍 Dashboard Debug - My Vendors Count:', myVendorsData.count);

      // Fetch my vendors from last 8 days
      const myVendorsLast8DaysUrl = `${url}/api/coordinator/vendors/last8days/my-count?_t=${Date.now()}`;
      console.log('🔍 Dashboard Debug - Fetching My Vendors Last 8 Days Count from:', myVendorsLast8DaysUrl);
      
      const myVendorsLast8DaysResponse = await fetch(myVendorsLast8DaysUrl, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });
      
      console.log('🔍 Dashboard Debug - My Vendors Last 8 Days Response Status:', myVendorsLast8DaysResponse.status);
      const myVendorsLast8DaysData = myVendorsLast8DaysResponse.ok ? await myVendorsLast8DaysResponse.json() : { count: 0 };
      console.log('🔍 Dashboard Debug - My Vendors Last 8 Days Data:', myVendorsLast8DaysData);

      // Fetch my vendors from today
      const myVendorsTodayUrl = `${url}/api/coordinator/vendors/today/my-count?_t=${Date.now()}`;
      console.log('🔍 Dashboard Debug - Fetching My Vendors Today Count from:', myVendorsTodayUrl);
      
      const myVendorsTodayResponse = await fetch(myVendorsTodayUrl, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });
      
      console.log('🔍 Dashboard Debug - My Vendors Today Response Status:', myVendorsTodayResponse.status);
      const myVendorsTodayData = myVendorsTodayResponse.ok ? await myVendorsTodayResponse.json() : { count: 0 };
      console.log('🔍 Dashboard Debug - My Vendors Today Data:', myVendorsTodayData);

      const realStats = {
        pendingVendorApprovals: Math.floor(Math.random() * 20) + 5, // Keep dummy for now
        pendingTradeApprovals: Math.floor(Math.random() * 15) + 3, // Keep dummy for now
        availableProducts: Math.floor(Math.random() * 50) + 25, // Keep dummy for now
        pendingWalletApprovals: Math.floor(Math.random() * 10) + 2, // Keep dummy for now
        totalVendors: myVendorsData.count || 0, // My vendors count
        vendorsLast8Days: myVendorsLast8DaysData.count || 0, // My vendors from last 8 days
        todayVendors: myVendorsTodayData.count || 0, // My vendors from today
        totalWalletAmount: Math.floor(Math.random() * 500000) + 100000, // Keep dummy for now
        totalWithdrawnAmount: Math.floor(Math.random() * 200000) + 50000, // Keep dummy for now
        totalDepositedAmount: Math.floor(Math.random() * 300000) + 150000, // Keep dummy for now
        availableWildProducts: Math.floor(Math.random() * 20) + 10, // Keep dummy for now
        totalInvestors: Math.floor(Math.random() * 100) + 50, // Keep dummy for now
        quickRegStats: {
          total_registrations: Math.floor(Math.random() * 500) + 200,
          today_registrations: Math.floor(Math.random() * 20) + 5,
          week_registrations: Math.floor(Math.random() * 100) + 30,
          month_registrations: Math.floor(Math.random() * 300) + 100
        },
      };

      console.log('🔍 Dashboard Debug - Final Real Stats:', realStats);
      console.log('🔍 Dashboard Debug - Setting stats with totalVendors:', realStats.totalVendors);

      setStats(prev => ({ ...prev, ...realStats }));
      localStorage.setItem('coordinatorDashboardStats', JSON.stringify(realStats));
      
      console.log('🔍 Dashboard Debug - Stats updated and saved to localStorage');
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  }, [token, url]);

  useEffect(() => { if (token) fetchAllStats(); }, [token, fetchAllStats]);

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');

  return (
    <Flex minH="100vh" bg={pageBg}>
      {/* Desktop sidebar */}
      <CoordinatorNavBar variant="static" onOpen={onOpen} />

      {/* Mobile drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <CoordinatorNavBar variant="drawer" onClose={onClose} />
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <Box flex="1" ml={{ base: 0, md: NAV_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
        {/* Mobile header */}
        <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon w={5} h={5} />}
            onClick={onOpen}
            size="sm"
            variant="ghost"
          />
          <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">
            Coordinator Dashboard
          </Heading>
        </Flex>

        <VStack spacing={{ base: 4, md: 8 }} align="stretch">
          <CoordinatorDashboardHeader stats={stats} url={url} />

          {/* First Section - Main Dashboard Boxes */}
        <VStack spacing={6} align="stretch">
            <Heading as="h2" fontSize="xl" color={headingColor} textAlign="center">
              Dashboard Overview
            </Heading>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6}>
             {/* First Box - All Vendors */}
             <Box
               bg={cardBg}
               p={6}
               borderRadius="xl"
               borderWidth="1px"
               borderColor={cardBorder}
               boxShadow="lg"
               cursor="pointer"
               onClick={() => {
                 // Navigate to coordinator vendors page - My Vendors tab
                 navigate('/coordinator/all-vendors?tab=my');
               }}
               _hover={{
                 boxShadow: "xl",
                 transform: "translateY(-4px)",
                 transition: "all 0.3s ease",
                 _before: {
                   transform: "scaleX(1)"
                 }
               }}
               transition="all 0.3s ease"
               position="relative"
               overflow="hidden"
               _before={{
                 content: '""',
                 position: "absolute",
                 top: 0,
                 left: 0,
                 right: 0,
                 height: "4px",
                 bg: "blue.500",
                 transform: "scaleX(0)",
                 transition: "transform 0.3s ease",
                 transformOrigin: "left"
               }}
             >
               <VStack spacing={5} align="center">
                 <Box
                   p={4}
                   borderRadius="full"
                   bg="blue.50"
                   color="blue.600"
                   _dark={{ bg: "blue.900", color: "blue.200" }}
                   boxShadow="md"
                 >
                   <FaUsers size={28} />
                 </Box>
                 <VStack spacing={2} align="center">
                   <Text fontSize="4xl" fontWeight="bold" color={headingColor} lineHeight="1">
                     {stats.totalVendors || 0}
                   </Text>
                   <Text fontSize="lg" color="gray.600" textAlign="center" fontWeight="medium">
                     My Vendors
            </Text>
                 </VStack>
                 <Button
                   colorScheme="blue"
                   size="md"
                   w="full"
                   borderRadius="lg"
                   fontWeight="semibold"
                   _hover={{
                     transform: "translateY(-2px)",
                     boxShadow: "lg"
                   }}
                   transition="all 0.2s ease"
                 >
                   View My Vendors
                 </Button>
               </VStack>
          </Box>

             {/* Second Box - Vendors from Last 8 Days */}
             <Box
               bg={cardBg}
               p={6}
               borderRadius="xl"
               borderWidth="1px"
               borderColor={cardBorder}
               boxShadow="lg"
               cursor="pointer"
               onClick={() => {
                 // Navigate to coordinator vendors last 8 days page
                 navigate('/coordinator/vendors-last8days');
               }}
               _hover={{
                 boxShadow: "xl",
                 transform: "translateY(-4px)",
                 transition: "all 0.3s ease",
                 _before: {
                   transform: "scaleX(1)"
                 }
               }}
               transition="all 0.3s ease"
               position="relative"
               overflow="hidden"
               _before={{
                 content: '""',
                 position: "absolute",
                 top: 0,
                 left: 0,
                 right: 0,
                 height: "4px",
                 bg: "teal.500",
                 transform: "scaleX(0)",
                 transition: "transform 0.3s ease",
                 transformOrigin: "left"
               }}
             >
               <VStack spacing={5} align="center">
                 <Box
                   p={4}
                   borderRadius="full"
                   bg="teal.50"
                   color="teal.600"
                   _dark={{ bg: "teal.900", color: "teal.200" }}
                   boxShadow="md"
                 >
                   <FaUsers size={28} />
                 </Box>
                 <VStack spacing={2} align="center">
                   <Text fontSize="4xl" fontWeight="bold" color={headingColor} lineHeight="1">
                     {stats.vendorsLast8Days || 0}
                   </Text>
                   <Text fontSize="lg" color="gray.600" textAlign="center" fontWeight="medium">
                     My Vendors (Last 8 Days)
                   </Text>
                 </VStack>
                 <Button
                   colorScheme="teal"
                   size="md"
                   w="full"
                   borderRadius="lg"
                   fontWeight="semibold"
                   _hover={{
                     transform: "translateY(-2px)",
                     boxShadow: "lg"
                   }}
                   transition="all 0.2s ease"
                 >
                   View Recent
                    </Button>
               </VStack>
             </Box>

             {/* Third Box - Today's Vendors */}
             <Box
               bg={cardBg}
               p={6}
               borderRadius="xl"
               borderWidth="1px"
               borderColor={cardBorder}
               boxShadow="lg"
               cursor="pointer"
               onClick={() => {
                 // Navigate to coordinator vendors today page
                 navigate('/coordinator/vendors-today');
               }}
               _hover={{
                 boxShadow: "xl",
                 transform: "translateY(-4px)",
                 transition: "all 0.3s ease",
                 _before: {
                   transform: "scaleX(1)"
                 }
               }}
               transition="all 0.3s ease"
               position="relative"
               overflow="hidden"
               _before={{
                 content: '""',
                 position: "absolute",
                 top: 0,
                 left: 0,
                 right: 0,
                 height: "4px",
                 bg: "pink.500",
                 transform: "scaleX(0)",
                 transition: "transform 0.3s ease",
                 transformOrigin: "left"
               }}
             >
               <VStack spacing={5} align="center">
                 <Box
                   p={4}
                   borderRadius="full"
                   bg="pink.50"
                   color="pink.600"
                   _dark={{ bg: "pink.900", color: "pink.200" }}
                   boxShadow="md"
                 >
                   <FaUsers size={28} />
                        </Box>
                 <VStack spacing={2} align="center">
                   <Text fontSize="4xl" fontWeight="bold" color={headingColor} lineHeight="1">
                     {stats.todayVendors || 0}
                          </Text>
                   <Text fontSize="lg" color="gray.600" textAlign="center" fontWeight="medium">
                     My Today's Vendors
                          </Text>
                        </VStack>
                 <Button
                   colorScheme="pink"
                   size="md"
                   w="full"
                   borderRadius="lg"
                   fontWeight="semibold"
                   _hover={{
                     transform: "translateY(-2px)",
                     boxShadow: "lg"
                   }}
                   transition="all 0.2s ease"
                 >
                   View Today
                 </Button>
                  </VStack>
             </Box>

             {/* Fourth Box - Pending Vendor Approvals */}
             <Box
               bg={cardBg}
               p={6}
               borderRadius="xl"
               borderWidth="1px"
               borderColor={cardBorder}
               boxShadow="lg"
               cursor="pointer"
               onClick={() => {
                 // Dummy function - no real navigation
                 alert('Pending Approvals functionality - Coming Soon!');
               }}
               _hover={{
                 boxShadow: "xl",
                 transform: "translateY(-4px)",
                 transition: "all 0.3s ease",
                 _before: {
                   transform: "scaleX(1)"
                 }
               }}
               transition="all 0.3s ease"
               position="relative"
               overflow="hidden"
               _before={{
                 content: '""',
                 position: "absolute",
                 top: 0,
                 left: 0,
                 right: 0,
                 height: "4px",
                 bg: "orange.500",
                 transform: "scaleX(0)",
                 transition: "transform 0.3s ease",
                 transformOrigin: "left"
               }}
             >
               <VStack spacing={5} align="center">
                 <Box
                   p={4}
                   borderRadius="full"
                   bg="orange.50"
                   color="orange.600"
                   _dark={{ bg: "orange.900", color: "orange.200" }}
                   boxShadow="md"
                 >
                   <FaUsers size={28} />
                 </Box>
                 <VStack spacing={2} align="center">
                   <Text fontSize="4xl" fontWeight="bold" color={headingColor} lineHeight="1">
                     {stats.pendingVendorApprovals || 0}
                   </Text>
                   <Text fontSize="lg" color="gray.600" textAlign="center" fontWeight="medium">
                     Pending Approvals
                   </Text>
                </VStack>
                      <Button
                   colorScheme="orange"
                   size="md"
                   w="full"
                   borderRadius="lg"
                   fontWeight="semibold"
                   _hover={{
                     transform: "translateY(-2px)",
                     boxShadow: "lg"
                   }}
                   transition="all 0.2s ease"
                 >
                   Manage Approvals
                      </Button>
               </VStack>
             </Box>

             {/* Fifth Box - Available Products */}
             <Box
               bg={cardBg}
               p={6}
               borderRadius="xl"
               borderWidth="1px"
               borderColor={cardBorder}
               boxShadow="lg"
               cursor="pointer"
               onClick={() => {
                 // Dummy function - no real navigation
                 alert('Products Management functionality - Coming Soon!');
               }}
               _hover={{
                 boxShadow: "xl",
                 transform: "translateY(-4px)",
                 transition: "all 0.3s ease",
                 _before: {
                   transform: "scaleX(1)"
                 }
               }}
               transition="all 0.3s ease"
               position="relative"
               overflow="hidden"
               _before={{
                 content: '""',
                 position: "absolute",
                 top: 0,
                 left: 0,
                 right: 0,
                 height: "4px",
                 bg: "green.500",
                 transform: "scaleX(0)",
                 transition: "transform 0.3s ease",
                 transformOrigin: "left"
               }}
             >
               <VStack spacing={5} align="center">
                 <Box
                   p={4}
                   borderRadius="full"
                   bg="green.50"
                   color="green.600"
                   _dark={{ bg: "green.900", color: "green.200" }}
                   boxShadow="md"
                 >
                   <FaChartBar size={28} />
                 </Box>
                 <VStack spacing={2} align="center">
                   <Text fontSize="4xl" fontWeight="bold" color={headingColor} lineHeight="1">
                     {stats.availableProducts || 0}
                   </Text>
                   <Text fontSize="lg" color="gray.600" textAlign="center" fontWeight="medium">
                     Available Products
                   </Text>
                 </VStack>
                      <Button
                        colorScheme="green"
                   size="md"
                   w="full"
                   borderRadius="lg"
                   fontWeight="semibold"
                   _hover={{
                     transform: "translateY(-2px)",
                     boxShadow: "lg"
                   }}
                   transition="all 0.2s ease"
                 >
                   Manage Products
                      </Button>
               </VStack>
             </Box>

             {/* Sixth Box - Wild Products */}
             <Box
               bg={cardBg}
               p={6}
               borderRadius="xl"
               borderWidth="1px"
               borderColor={cardBorder}
               boxShadow="lg"
               cursor="pointer"
               onClick={() => {
                 // Dummy function - no real navigation
                 alert('Wild Products functionality - Coming Soon!');
               }}
               _hover={{
                 boxShadow: "xl",
                 transform: "translateY(-4px)",
                 transition: "all 0.3s ease",
                 _before: {
                   transform: "scaleX(1)"
                 }
               }}
               transition="all 0.3s ease"
               position="relative"
               overflow="hidden"
               _before={{
                 content: '""',
                 position: 'absolute',
                 top: 0,
                 left: 0,
                 right: 0,
                 height: '4px',
                 bg: 'linear-gradient(90deg, #4299E1, #63B3ED)',
                 transform: 'scaleX(0)',
                 transition: 'transform 0.3s ease'
               }}
             >
               <VStack spacing={4} align="center">
                 <Box
                   p={4}
                   borderRadius="full"
                   bg="linear-gradient(135deg, #4299E1, #63B3ED)"
                   color="white"
                   boxShadow="lg"
                 >
                   <FaChartBar size={28} />
                 </Box>
                 <VStack spacing={2} align="center">
                   <Text fontSize="4xl" fontWeight="bold" color={headingColor} lineHeight="1">
                     {stats.availableWildProducts || 0}
                   </Text>
                   <Text fontSize="lg" color="gray.600" textAlign="center" fontWeight="medium">
                     Wild Products
                   </Text>
                 </VStack>
                      <Button
                   colorScheme="blue"
                   size="md"
                   w="full"
                   borderRadius="lg"
                   fontWeight="semibold"
                   _hover={{
                     transform: "translateY(-2px)",
                     boxShadow: "lg"
                   }}
                   transition="all 0.2s ease"
                 >
                   Manage Wild Products
                      </Button>
               </VStack>
             </Box>

             {/* Seventh Box - Manage Referral % */}
             <Box
               bg={cardBg}
               p={6}
               borderRadius="xl"
               borderWidth="1px"
               borderColor={cardBorder}
               boxShadow="lg"
               cursor="pointer"
               onClick={() => {
                 // Dummy function - no real navigation
                 alert('Commission Management functionality - Coming Soon!');
               }}
               _hover={{
                 boxShadow: "xl",
                 transform: "translateY(-4px)",
                 transition: "all 0.3s ease",
                 _before: {
                   transform: "scaleX(1)"
                 }
               }}
               transition="all 0.3s ease"
               position="relative"
               overflow="hidden"
               _before={{
                 content: '""',
                 position: "absolute",
                 top: 0,
                 left: 0,
                 right: 0,
                 height: "4px",
                 bg: "purple.500",
                 transform: "scaleX(0)",
                 transition: "transform 0.3s ease",
                 transformOrigin: "left"
               }}
             >
               <VStack spacing={5} align="center">
                 <Box
                   p={4}
                   borderRadius="full"
                   bg="purple.50"
                   color="purple.600"
                   _dark={{ bg: "purple.900", color: "purple.200" }}
                   boxShadow="md"
                 >
                   <FaCog size={28} />
                 </Box>
                 <VStack spacing={2} align="center">
                   <Text fontSize="2xl" fontWeight="bold" color={headingColor} lineHeight="1">
                     Referral %
                   </Text>
                   <Text fontSize="lg" color="gray.600" textAlign="center" fontWeight="medium">
                     Manage Commission
                   </Text>
                 </VStack>
                      <Button
                   colorScheme="purple"
                   size="md"
                   w="full"
                   borderRadius="lg"
                   fontWeight="semibold"
                   _hover={{
                     transform: "translateY(-2px)",
                     boxShadow: "lg"
                   }}
                   transition="all 0.2s ease"
                 >
                   Open Manager
                      </Button>
                    </VStack>
             </Box>

            </SimpleGrid>
          </VStack>

          {/* Wallet Statistics Section */}
          <VStack spacing={6} align="stretch">
            <Heading size="lg" color={headingColor} mb={4}>
              Wallet Statistics
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
               {/* Total Wallet Amount Box */}
               <Box
                 bg={cardBg}
                 p={6}
                 borderRadius="xl"
                 borderWidth="1px"
                 borderColor={cardBorder}
                 boxShadow="lg"
                 transition="all 0.3s ease"
                 _hover={{
                   boxShadow: "xl",
                   transform: "translateY(-4px)"
                 }}
               >
                 <VStack spacing={5} align="center">
                   <Box
                     p={4}
                     borderRadius="full"
                     bg="blue.50"
                     color="blue.600"
                     _dark={{ bg: "blue.900", color: "blue.200" }}
                     boxShadow="md"
                   >
                     <FaWallet size={28} />
                   </Box>
                   <VStack spacing={2} align="center">
                     <Text fontSize="4xl" fontWeight="bold" color={headingColor} lineHeight="1">
                       ₹{stats.totalWalletAmount?.toLocaleString() || '0'}
                     </Text>
                     <Text fontSize="lg" color="gray.600" textAlign="center" fontWeight="medium">
                       Total Wallet Amount
                     </Text>
                   </VStack>
                 </VStack>
               </Box>

               {/* Total Withdrawn Amount Box */}
               <Box
                 bg={cardBg}
                 p={6}
                 borderRadius="xl"
                 borderWidth="1px"
                 borderColor={cardBorder}
                 boxShadow="lg"
                 transition="all 0.3s ease"
                 _hover={{
                   boxShadow: "xl",
                   transform: "translateY(-4px)"
                 }}
               >
                 <VStack spacing={5} align="center">
                   <Box
                     p={4}
                     borderRadius="full"
                     bg="red.50"
                     color="red.600"
                     _dark={{ bg: "red.900", color: "red.200" }}
                     boxShadow="md"
                   >
                     <FaArrowUp size={28} />
                   </Box>
                   <VStack spacing={2} align="center">
                     <Text fontSize="4xl" fontWeight="bold" color={headingColor} lineHeight="1">
                       ₹{stats.totalWithdrawnAmount?.toLocaleString() || '0'}
                     </Text>
                     <Text fontSize="lg" color="gray.600" textAlign="center" fontWeight="medium">
                       Total Withdrawn
                     </Text>
                   </VStack>
                 </VStack>
               </Box>

               {/* Total Deposited Amount Box */}
               <Box
                 bg={cardBg}
                 p={6}
                 borderRadius="xl"
                 borderWidth="1px"
                 borderColor={cardBorder}
                 boxShadow="lg"
                 transition="all 0.3s ease"
                 _hover={{
                   boxShadow: "xl",
                   transform: "translateY(-4px)"
                 }}
               >
                 <VStack spacing={5} align="center">
                   <Box
                     p={4}
                     borderRadius="full"
                     bg="green.50"
                     color="green.600"
                     _dark={{ bg: "green.900", color: "green.200" }}
                     boxShadow="md"
                   >
                     <FaArrowDown size={28} />
                   </Box>
                   <VStack spacing={2} align="center">
                     <Text fontSize="4xl" fontWeight="bold" color={headingColor} lineHeight="1">
                       ₹{stats.totalDepositedAmount?.toLocaleString() || '0'}
                     </Text>
                     <Text fontSize="lg" color="gray.600" textAlign="center" fontWeight="medium">
                       Total Deposited
                     </Text>
                   </VStack>
                 </VStack>
               </Box>
            </SimpleGrid>
          </VStack>

          {/* Second Section - Tools & Management */}
          <VStack spacing={6} align="stretch">
            <Heading as="h2" fontSize="xl" color={headingColor} textAlign="center">
              Tools & Management
            </Heading>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6}>
              {/* Investors Box */}
              <Box
                bg={cardBg}
                p={6}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={cardBorder}
                boxShadow="lg"
                cursor="pointer"
                onClick={() => {
                  // Dummy function - no real navigation
                  alert('Investors Management functionality - Coming Soon!');
                }}
                _hover={{
                  boxShadow: "xl",
                  transform: "translateY(-4px)",
                  transition: "all 0.3s ease",
                  _before: {
                    transform: "scaleX(1)"
                  }
                }}
                transition="all 0.3s ease"
                position="relative"
                overflow="hidden"
                _before={{
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  bg: "cyan.500",
                  transform: "scaleX(0)",
                  transition: "transform 0.3s ease",
                  transformOrigin: "left"
                }}
              >
                <VStack spacing={5} align="center">
                  <Box
                    p={4}
                    borderRadius="full"
                    bg="cyan.50"
                    color="cyan.600"
                    _dark={{ bg: "cyan.900", color: "cyan.200" }}
                    boxShadow="md"
                  >
                    <FaHandshake size={28} />
                  </Box>
                  <VStack spacing={2} align="center">
                    <Text fontSize="4xl" fontWeight="bold" color={headingColor} lineHeight="1">
                      {stats.total_investors || 0}
                    </Text>
                    <Text fontSize="lg" color="gray.600" textAlign="center" fontWeight="medium">
                      Investors
                    </Text>
                  </VStack>
                  <Button
                    colorScheme="cyan"
                    size="md"
                    w="full"
                    borderRadius="lg"
                    fontWeight="semibold"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "lg"
                    }}
                    transition="all 0.2s ease"
                  >
                    Manage Investors
                  </Button>
                </VStack>
              </Box>

              {/* PDF Compressor Box */}
              <Box
                bg={cardBg}
                p={6}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={cardBorder}
                boxShadow="lg"
                cursor="pointer"
                onClick={() => window.open('https://compressor-ljk9.onrender.com/', '_blank')}
                _hover={{
                  boxShadow: "xl",
                  transform: "translateY(-4px)",
                  transition: "all 0.3s ease",
                  _before: {
                    transform: "scaleX(1)"
                  }
                }}
                transition="all 0.3s ease"
                position="relative"
                overflow="hidden"
                _before={{
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  bg: "red.500",
                  transform: "scaleX(0)",
                  transition: "transform 0.3s ease",
                  transformOrigin: "left"
                }}
              >
                <VStack spacing={5} align="center">
                  <Box
                    p={4}
                    borderRadius="full"
                    bg="red.50"
                    color="red.600"
                    _dark={{ bg: "red.900", color: "red.200" }}
                    boxShadow="md"
                  >
                    <FaFileArchive size={28} />
                  </Box>
                  <VStack spacing={2} align="center">
                    <Text fontSize="2xl" fontWeight="bold" color={headingColor} lineHeight="1">
                      PDF
                    </Text>
                    <Text fontSize="lg" color="gray.600" textAlign="center" fontWeight="medium">
                      Compressor
                        </Text>
                  </VStack>
                  <Button
                    colorScheme="red"
                    size="md"
                    w="full"
                    borderRadius="lg"
                    fontWeight="semibold"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "lg"
                    }}
                    transition="all 0.2s ease"
                  >
                    Open Compressor
                  </Button>
                </VStack>
              </Box>

              {/* Payslip Management Box */}
              <Box
                bg={cardBg}
                p={6}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={cardBorder}
                boxShadow="lg"
                cursor="pointer"
                onClick={() => {
                  // Dummy function - no real navigation
                  alert('Payslip Management functionality - Coming Soon!');
                }}
                _hover={{
                  boxShadow: "xl",
                  transform: "translateY(-4px)",
                  transition: "all 0.3s ease",
                  _before: {
                    transform: "scaleX(1)"
                  }
                }}
                transition="all 0.3s ease"
                position="relative"
                overflow="hidden"
                _before={{
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  bg: "purple.500",
                  transform: "scaleX(0)",
                  transition: "transform 0.3s ease",
                  transformOrigin: "left"
                }}
              >
                <VStack spacing={5} align="center">
                  <Box
                    p={4}
                    borderRadius="full"
                    bg="purple.50"
                    color="purple.600"
                    _dark={{ bg: "purple.900", color: "purple.200" }}
                    boxShadow="md"
                  >
                    <FaFileInvoice size={28} />
                  </Box>
                  <VStack spacing={2} align="center">
                    <Text fontSize="2xl" fontWeight="bold" color={headingColor} lineHeight="1">
                      Payslip
                        </Text>
                    <Text fontSize="lg" color="gray.600" textAlign="center" fontWeight="medium">
                      Management
                        </Text>
                  </VStack>
                  <Button
                    colorScheme="purple"
                    size="md"
                    w="full"
                    borderRadius="lg"
                    fontWeight="semibold"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "lg"
                    }}
                    transition="all 0.2s ease"
                  >
                    Manage Payslips
                  </Button>
                </VStack>
              </Box>
            </SimpleGrid>
          </VStack>

          <VStack spacing={8} align="stretch">
            <Transactions url={url} />
            </VStack>

        </VStack>
      </Box>
    </Flex>
  );
};

export default CoordinatorDashboard;
