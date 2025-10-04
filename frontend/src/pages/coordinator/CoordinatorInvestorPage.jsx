import React, { useState } from 'react';
import {
  Box, Flex, Heading, IconButton, useColorModeValue, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody,
  Tabs, TabList, TabPanels, Tab, TabPanel, useDisclosure
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import CoordinatorNavBar, { NAV_WIDTH } from '../../components/layout/CoordinatorNavBar';
import CoordinatorInvestorDashboard from '../../components/dashboard/CoordinatorInvestorDashboard';
import MyInvestors from '../../components/dashboard/MyInvestors';
import UnassignedInvestors from '../../components/dashboard/UnassignedInvestors';

const CoordinatorInvestorPage = ({ url }) => {
  const { token } = useAuth();
  const { isOpen: isMobileNavOpen, onOpen: onMobileNavOpen, onClose: onMobileNavClose } = useDisclosure();

  // Color mode values
  const mainBg = useColorModeValue('gray.50', '#181C27');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const iconColor = useColorModeValue('black', 'whiteAlpha.900');

  return (
    <Flex minH="100vh" bg={mainBg}>
      {/* Sidebar (desktop only) */}
      <Box
        as="nav"
        pos="fixed"
        top="0"
        left="0"
        zIndex="sticky"
        h="full"
        w={NAV_WIDTH}
        bg="#212734"
        borderRight="1px"
        borderColor="gray.700"
        display={{ base: 'none', md: 'block' }}
      >
        <CoordinatorNavBar />
      </Box>

      {/* Main content */}
      <Box flex="1" ml={{ base: 0, md: NAV_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
        {/* Mobile header */}
        <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon w={5} h={5} />}
            onClick={onMobileNavOpen}
            size="sm"
            variant="ghost"
            color={iconColor}
          />
          <Heading as="h1" fontSize="lg" color={headingColor}>
            Investor Management
          </Heading>
        </Flex>

        {/* Desktop title */}
        <Heading as="h1" fontSize="2xl" color={headingColor} mb={6} display={{ base: 'none', md: 'block' }}>
          Investor Management
        </Heading>

        {/* Tabs for Dashboard and Investors */}
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Dashboard</Tab>
            <Tab>My Investors</Tab>
            <Tab>Unassigned Investors</Tab>
          </TabList>

          <TabPanels>
            {/* Dashboard Tab */}
            <TabPanel px={0}>
              <CoordinatorInvestorDashboard url={url} />
            </TabPanel>

            {/* My Investors Tab */}
            <TabPanel px={0}>
              <MyInvestors url={url} />
            </TabPanel>

            {/* Unassigned Investors Tab */}
            <TabPanel px={0}>
              <UnassignedInvestors url={url} />
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Mobile Navigation Drawer */}
        <Modal isOpen={isMobileNavOpen} onClose={onMobileNavClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Navigation</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <CoordinatorNavBar variant="drawer" onClose={onMobileNavClose} />
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  );
};

export default CoordinatorInvestorPage;
