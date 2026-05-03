import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, useColorModeValue, useDisclosure, Drawer,Image, DrawerOverlay, DrawerContent, DrawerBody, Heading, IconButton,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import VendorNavBar from '../../components/layout/VendorNavBar';
import { useAuth } from '../../AppContext';
import DashboardOverview from '../../components/vendordashboard/DashboardOverview';
import VendorTradingSection from '../../components/vendordashboard/VendorTradingSection';
import ReferralTree from '../../components/dashboard/ReferralTree';
import TrustedCompanies from '../../components/vendordashboard/TrustedCompanies';


const DESKTOP_SIDEBAR_WIDTH = '200px';

const VendorDashboard = ({ url }) => {
  const { token } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [stats, setStats] = useState({
    purchasedProducts: 0,
    purchasedValue: 0,
    pendingTradeApprovals: 0,
    availableProducts: 0,
    availableWildProducts: 0,
    sellableTradesCount: 0,
    totalProfitEarned: 0,
  });

  const fetchAllStats = useCallback(async () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [vendorResponse, productCountResponse, totalProfitResponse, wildProductCountResponse] = await Promise.all([
        fetch(`${url}/api/vendor/stats/dashboard`, { headers }),
        fetch(`${url}/api/products/stats/available-count`, { headers }),
        fetch(`${url}/api/trading/total-profit`, { headers }),
        fetch(`${url}/api/wild-products/stats/available-count`, { headers }),
      ]);
      if (!vendorResponse.ok || !productCountResponse.ok || !totalProfitResponse.ok || !wildProductCountResponse.ok) throw new Error('Failed to fetch one or more vendor stats.');
      const vendorStats = await vendorResponse.json();
      const productCountStats = await productCountResponse.json();
      const totalProfitData = await totalProfitResponse.json();
      const wildProductCountStats = await wildProductCountResponse.json();
      setStats(prev => ({ 
        ...prev, 
        ...vendorStats, 
        availableProducts: productCountStats.availableProducts ?? 0,
        availableWildProducts: wildProductCountStats.availableWildProducts ?? 0,
        totalProfitEarned: totalProfitData.totalProfit || 0
      }));
    } catch (error) {
      console.error('Error fetching vendor dashboard stats:', error);
    }
  }, [token, url]);


  useEffect(() => { if (token) fetchAllStats(); }, [fetchAllStats, token]);

  const mainBg = useColorModeValue('gray.50', '#181C27');
  const sidebarBg = '#212734';
  const sidebarBorder = 'gray.700';
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const iconColor = useColorModeValue('black', 'whiteAlpha.900');

  document.title = "NAVIU | Vendor Dashboard";

  return (
    <Flex minH="100vh" bg={mainBg}>
      {/* Sidebar (desktop only) */}
      <Box as="nav" pos="fixed" top="0" left="0" zIndex="sticky" h="full" w={DESKTOP_SIDEBAR_WIDTH} bg={sidebarBg} borderRight="1px" borderColor={sidebarBorder} display={{ base: 'none', md: 'block' }}>
        <VendorNavBar />
      </Box>

      {/* Drawer (mobile nav) */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg={sidebarBg} w={DESKTOP_SIDEBAR_WIDTH}>
          <DrawerBody p={0}><VendorNavBar onLinkClick={onClose} /></DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <Box flex="1" ml={{ base: 0, md: DESKTOP_SIDEBAR_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
        {/* Consistent mobile header */}
        <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon w={5} h={5} />}
            onClick={onOpen}
            size="sm"
            variant="ghost"
            color={iconColor}
            p={1}
            mt="-1"
            _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.200' } }}
          />
          <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">
                <Image src="/naviu.png" alt="NAVIU" h="50px" objectFit="contain" />
       
          </Heading>
        </Flex>

        {/* Desktop title */}
        <Heading as="h1" fontSize="2xl" color={headingColor} mb={6} display={{ base: 'none', md: 'block' }}>
            <Image src="/naviu.png" alt="NAVIU" h="60px" objectFit="contain" />
        </Heading>

        <VendorTradingSection stats={stats} url={url} />
        <DashboardOverview url={url} />
        {/* <Box mt={{ base: 8, md: 12 }}>
          <ReferralTree url={url} />
        </Box> */}
        <Box mt={{ base: 8, md: 12 }}><TrustedCompanies /></Box>
      </Box>
    </Flex>
  );
};



export default VendorDashboard;