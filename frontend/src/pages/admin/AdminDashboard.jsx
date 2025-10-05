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

import AdminNavBar from '../../components/layout/AdminNavBar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import Transactions from './Transactions';

const ADMIN_SIDEBAR_W = '80px';

const AdminDashboard = ({ url }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [stats, setStats] = useState(() => {
    const cached = localStorage.getItem('adminDashboardStats');
    return cached ? JSON.parse(cached) : {
      pendingVendorApprovals: 0,
      pendingTradeApprovals: 0,
      pendingInvestorApprovals: 0,
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

  const fetchAllStats = useCallback(async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [adminResponse, productResponse, vendorResponse, wildProductResponse, investorResponse] = await Promise.all([
        fetch(`${url}/api/admin/stats/dashboard`, { headers }).catch(e => e),
        fetch(`${url}/api/products/stats/dashboard`, { headers }).catch(e => e),
        fetch(`${url}/api/admin/vendors/count`, { headers }).catch(e => e),
        fetch(`${url}/api/wild-products/stats/dashboard`, { headers }).catch(e => e),
        fetch(`${url}/api/investors/stats`, { headers }).catch(e => e)
      ]);

      let adminStats = {};
      let productStats = {};
      let vendorStats = {};
      let wildProductStats = {};
      let investorStats = {};

      if (adminResponse && adminResponse.ok) adminStats = await adminResponse.json();
      if (productResponse && productResponse.ok) productStats = await productResponse.json();
      if (vendorResponse && vendorResponse.ok) vendorStats = await vendorResponse.json();
      if (wildProductResponse && wildProductResponse.ok) wildProductStats = await wildProductResponse.json();
      if (investorResponse && investorResponse.ok) investorStats = await investorResponse.json();

             // Get additional vendor stats
       const additionalStats = {};
       
       // Get vendors from last 8 days (only approved)
       try {
         const last8DaysResponse = await fetch(`${url}/api/admin/vendors/last8days`, { headers });
         if (last8DaysResponse.ok) {
           const last8DaysData = await last8DaysResponse.json();
           additionalStats.vendorsLast8Days = last8DaysData.count || 0;
         } else {
           additionalStats.vendorsLast8Days = 0;
         }
       } catch (error) {
         console.error('Failed to fetch last 8 days vendors:', error);
         additionalStats.vendorsLast8Days = 0;
       }
       
       // Get today's vendors (only approved)
       try {
         const todayResponse = await fetch(`${url}/api/admin/vendors/today`, { headers });
         if (todayResponse.ok) {
           const todayData = await todayResponse.json();
           additionalStats.todayVendors = todayData.count || 0;
         } else {
           additionalStats.todayVendors = 0;
         }
       } catch (error) {
         console.error('Failed to fetch today vendors:', error);
         additionalStats.todayVendors = 0;
       }

      // Get wallet statistics
      let walletStats = {};
      try {
        const walletResponse = await fetch(`${url}/api/admin/stats/wallet`, { headers });
        if (walletResponse.ok) {
          walletStats = await walletResponse.json();
        } else {
          walletStats = {
            totalWalletAmount: 0,
            totalWithdrawnAmount: 0,
            totalDepositedAmount: 0
          };
        }
      } catch (error) {
        console.error('Failed to fetch wallet stats:', error);
        walletStats = {
          totalWalletAmount: 0,
          totalWithdrawnAmount: 0,
          totalDepositedAmount: 0
        };
      }

      // Get quick registration statistics
      let quickRegStats = {};
      try {
        const quickRegResponse = await fetch(`${url}/api/quick-reg/admin/stats`, { headers });
        if (quickRegResponse.ok) {
          quickRegStats = await quickRegResponse.json();
        } else {
          quickRegStats = {
            total_registrations: 0,
            today_registrations: 0,
            week_registrations: 0,
            month_registrations: 0
          };
        }
      } catch (error) {
        console.error('Failed to fetch quick registration stats:', error);
        quickRegStats = {
          total_registrations: 0,
          today_registrations: 0,
          week_registrations: 0,
          month_registrations: 0
        };
      }

      // Get pending investor approvals
      let pendingInvestorApprovals = 0;
      try {
        const pendingInvestorsResponse = await fetch(`${url}/api/admin/pending-investors`, { headers });
        if (pendingInvestorsResponse.ok) {
          const pendingInvestorsData = await pendingInvestorsResponse.json();
          pendingInvestorApprovals = pendingInvestorsData.count || 0;
        }
      } catch (error) {
        console.error('Failed to fetch pending investor approvals:', error);
      }

      const mergedStats = { ...adminStats, ...productStats, ...vendorStats, ...additionalStats, ...walletStats, ...wildProductStats, ...investorStats, ...quickRegStats, pendingInvestorApprovals };
      setStats(prev => ({ ...prev, ...mergedStats }));
      localStorage.setItem('adminDashboardStats', JSON.stringify(mergedStats));
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  }, [url, token]);

  useEffect(() => { if (token) fetchAllStats(); }, [token, fetchAllStats]);

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');



  return (
    <Flex minH="100vh" bg={pageBg}>
      {/* Desktop sidebar */}
      <AdminNavBar variant="static" onOpen={onOpen} />

      {/* Mobile drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <AdminNavBar variant="drawer" onClose={onClose} />
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <Box flex="1" ml={{ base: 0, md: ADMIN_SIDEBAR_W }} p={{ base: 4, sm: 6, md: 8 }}>
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
            Admin Dashboard
          </Heading>
        </Flex>

        <VStack spacing={{ base: 4, md: 8 }} align="stretch">
          <DashboardHeader stats={stats} />
          
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
               onClick={() => navigate('/admin/all-vendors')}
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
                     All Vendors
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
                   View All Vendors
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
               onClick={() => navigate('/admin/vendors-last8days')}
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
                     Vendors (Last 8 Days)
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
                onClick={() => navigate('/admin/todays-vendors')}
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
                      Today's Vendors
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
                onClick={() => navigate('/admin/manage-approvals')}
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
               onClick={() => navigate('/admin/manage-products')}
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
               onClick={() => navigate('/admin/wild-products')}
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
               onClick={() => navigate('/admin/manage-percentages')}
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
                onClick={() => navigate('/admin/investors')}
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

              {/* Approve Investment Box */}
              <Box
                bg={cardBg}
                p={6}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={cardBorder}
                boxShadow="lg"
                cursor="pointer"
                onClick={() => navigate('/admin/approve-investments')}
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
                    <FaHandshake size={28} />
                  </Box>
                  <VStack spacing={2} align="center">
                    <Text fontSize="2xl" fontWeight="bold" color={headingColor} lineHeight="1">
                      {stats.pendingInvestorApprovals || 0}
                    </Text>
                    <Text fontSize="lg" color="gray.600" textAlign="center" fontWeight="medium">
                      Pending Investments
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
                    Approve Investments
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
                onClick={() => navigate('/admin/payslip-management')}
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

export default AdminDashboard;