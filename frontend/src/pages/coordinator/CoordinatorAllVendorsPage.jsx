import React, { useState } from 'react';
import {
  Box, Flex, VStack, useColorModeValue, useDisclosure,
  Drawer, DrawerContent, DrawerOverlay, Heading, IconButton,
  Button, HStack, Tabs, TabList, TabPanel,TabPanels, Tab, TabIndicator
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../AppContext';

import CoordinatorNavBar from '../../components/layout/CoordinatorNavBar';
import CoordinatorVendorsTable from '../../components/dashboard/CoordinatorVendorsTable';

const NAV_SIDEBAR_WIDTH = '80px';

const CoordinatorAllVendorsPage = ({ url }) => {
  const { token } = useAuth();
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Determine initial active tab based on URL parameter
  const getInitialTab = () => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get('tab');
    switch (tab) {
      case 'all': return 1;
      default: return 0;
    }
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const headingColor = useColorModeValue('gray.800', 'gray.200');

  return (
    <Flex minH="100vh" maxH="100vh" bg={pageBg} overflow="hidden">
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
      <Box flex="1" ml={{ base: 0, md: NAV_SIDEBAR_WIDTH }} p={{ base: 4, sm: 6, md: 8 }} overflow="hidden" maxH="100vh">
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
            All Vendors
          </Heading>
        </Flex>

        <VStack spacing={{ base: 4, md: 8 }} align="stretch" h="100%" overflow="hidden">
          {/* Page Header */}
          <Box>
            <HStack justify="space-between" align="center" mb={4}>
              <Heading size="lg" color={headingColor}>
                Vendors Management
              </Heading>
            </HStack>
          </Box>

          {/* Tabs for different vendor segments */}
          <Box flex="1" overflow="hidden">
            <Tabs
              index={activeTab}
              onChange={setActiveTab}
              variant="enclosed"
              colorScheme="blue"
              size="lg"
            >
              <TabList>
                <Tab>My Vendors</Tab>
                <Tab>All Vendors</Tab>
              </TabList>

              <TabPanels h="100%">
                <TabPanel p={0} pt={6} h="100%" overflow="hidden">
                  <CoordinatorVendorsTable
                    url={url}
                    viewType="my"
                  />
                </TabPanel>
                <TabPanel p={0} pt={6} h="100%" overflow="hidden">
                  <CoordinatorVendorsTable
                    url={url}
                    viewType="all"
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </VStack>
      </Box>
    </Flex>
  );
};

export default CoordinatorAllVendorsPage;
