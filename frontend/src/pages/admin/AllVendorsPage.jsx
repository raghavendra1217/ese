import React from 'react';
import {
  Box, Flex, VStack, useColorModeValue, useDisclosure,
  Drawer, DrawerContent, DrawerOverlay, Heading, IconButton,
  Button, HStack
} from '@chakra-ui/react';
import { HamburgerIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AppContext';

import AdminNavBar from '../../components/layout/AdminNavBar';
import AllVendorsTable from '../../components/dashboard/AllVendorsTable';

const ADMIN_SIDEBAR_W = '80px';

const AllVendorsPage = ({ url }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const headingColor = useColorModeValue('gray.800', 'gray.200');

  const handleBackToDashboard = () => {
    navigate('/admin/dashboard');
  };

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
            All Vendors
          </Heading>
        </Flex>

        <VStack spacing={{ base: 4, md: 8 }} align="stretch">
          {/* Page Header */}
          <Box>
            <HStack justify="space-between" align="center" mb={4}>
              <HStack spacing={4}>
                <Button
                  leftIcon={<ArrowBackIcon />}
                  variant="ghost"
                  onClick={handleBackToDashboard}
                  size="sm"
                >
                  Back to Dashboard
                </Button>
                <Heading size="lg" color={headingColor}>
                  All Vendors
                </Heading>
              </HStack>
            </HStack>
          </Box>

          {/* All Vendors Table */}
          <AllVendorsTable url={url} />
        </VStack>
      </Box>
    </Flex>
  );
};

export default AllVendorsPage;
