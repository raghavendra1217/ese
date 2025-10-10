import React, { useState, useEffect } from 'react';
import {
  Box, Flex, VStack, Heading, Text, Table, Thead, Tbody, Tr, Th, Td,
  Button, HStack, Spinner, useColorModeValue, Avatar, Badge, Input,
  InputGroup, InputLeftElement, Switch, Tooltip, useToast, Card, CardBody,
  useDisclosure, Drawer, DrawerContent, DrawerOverlay, IconButton
} from '@chakra-ui/react';
import { FaSearch, FaEye, FaEyeSlash } from 'react-icons/fa';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AppContext';
import AdminNavBar from '../../components/layout/AdminNavBar';

const ADMIN_SIDEBAR_W = '80px';

const ProductVisibilityPage = ({ url }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'enabled', 'disabled'

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');

  // Fetch vendors with visibility status
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${url}/api/admin/vendors-visibility`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch vendors');
      const data = await response.json();
      setVendors(data.vendors || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vendors',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchVendors();
    }
  }, [token]);

  // Toggle product visibility
  const toggleVisibility = async (vendorId, currentVisibility) => {
    try {
      const response = await fetch(`${url}/api/admin/vendors/${vendorId}/product-visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productVisibility: !currentVisibility })
      });

      if (!response.ok) throw new Error('Failed to update visibility');
      
      const data = await response.json();
      
      // Update local state
      setVendors(prevVendors =>
        prevVendors.map(v =>
          v.id === vendorId
            ? { ...v, product_visibility: !currentVisibility }
            : v
        )
      );

      toast({
        title: 'Success',
        description: data.message || 'Product visibility updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product visibility',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Filter vendors based on search and filter
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'enabled' && vendor.product_visibility !== false) ||
      (filter === 'disabled' && vendor.product_visibility === false);

    return matchesSearch && matchesFilter;
  });

  // Statistics
  const stats = {
    total: vendors.length,
    enabled: vendors.filter(v => v.product_visibility !== false).length,
    disabled: vendors.filter(v => v.product_visibility === false).length
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
            Product Visibility
          </Heading>
        </Flex>

        <VStack spacing={6} align="stretch" maxW="1400px" mx="auto">
          {/* Header */}
          <VStack align="start" spacing={1}>
            <Heading size="lg" color={headingColor}>
              Product Visibility Management
            </Heading>
            <Text color="gray.600">
              Control which vendors can see and purchase products
            </Text>
          </VStack>

        {/* Statistics Cards */}
        <HStack spacing={4} flexWrap="wrap">
          <Card
            flex="1"
            minW="200px"
            bg={cardBg}
            borderWidth="1px"
            borderColor={cardBorder}
            shadow="sm"
          >
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color="gray.600">Total Vendors</Text>
                <Text fontSize="3xl" fontWeight="bold" color="blue.500">
                  {stats.total}
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card
            flex="1"
            minW="200px"
            bg={cardBg}
            borderWidth="1px"
            borderColor={cardBorder}
            shadow="sm"
          >
            <CardBody>
              <VStack align="start" spacing={1}>
                <HStack>
                  <FaEye color="green" />
                  <Text fontSize="sm" color="gray.600">Access Enabled</Text>
                </HStack>
                <Text fontSize="3xl" fontWeight="bold" color="green.500">
                  {stats.enabled}
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card
            flex="1"
            minW="200px"
            bg={cardBg}
            borderWidth="1px"
            borderColor={cardBorder}
            shadow="sm"
          >
            <CardBody>
              <VStack align="start" spacing={1}>
                <HStack>
                  <FaEyeSlash color="red" />
                  <Text fontSize="sm" color="gray.600">Access Disabled</Text>
                </HStack>
                <Text fontSize="3xl" fontWeight="bold" color="red.500">
                  {stats.disabled}
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </HStack>

        {/* Filters and Search */}
        <Card bg={cardBg} borderWidth="1px" borderColor={cardBorder}>
          <CardBody>
            <Flex gap={4} flexWrap="wrap">
              <InputGroup maxW="400px">
                <InputLeftElement pointerEvents="none">
                  <FaSearch color="gray" />
                </InputLeftElement>
                <Input
                  placeholder="Search by name, ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <HStack spacing={2}>
                <Button
                  size="sm"
                  variant={filter === 'all' ? 'solid' : 'outline'}
                  colorScheme="blue"
                  onClick={() => setFilter('all')}
                >
                  All ({stats.total})
                </Button>
                <Button
                  size="sm"
                  variant={filter === 'enabled' ? 'solid' : 'outline'}
                  colorScheme="green"
                  onClick={() => setFilter('enabled')}
                >
                  Enabled ({stats.enabled})
                </Button>
                <Button
                  size="sm"
                  variant={filter === 'disabled' ? 'solid' : 'outline'}
                  colorScheme="red"
                  onClick={() => setFilter('disabled')}
                >
                  Disabled ({stats.disabled})
                </Button>
              </HStack>
            </Flex>
          </CardBody>
        </Card>

        {/* Vendors Table */}
        <Card bg={cardBg} borderWidth="1px" borderColor={cardBorder}>
          <CardBody>
            {loading ? (
              <Flex justify="center" align="center" h="200px">
                <Spinner size="xl" color="blue.500" />
              </Flex>
            ) : filteredVendors.length === 0 ? (
              <Flex justify="center" align="center" h="200px">
                <Text color="gray.500">No vendors found</Text>
              </Flex>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead bg={tableHeaderBg}>
                    <Tr>
                      <Th>Vendor</Th>
                      <Th>Email</Th>
                      <Th>Status</Th>
                      <Th textAlign="center">Product Access</Th>
                      <Th textAlign="center">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredVendors.map((vendor) => (
                      <Tr key={vendor.id} _hover={{ bg: tableHeaderBg }}>
                        <Td>
                          <HStack>
                            <Avatar size="sm" name={vendor.vendor_name} />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium">{vendor.vendor_name}</Text>
                              <Text fontSize="xs" color="gray.500">{vendor.id}</Text>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{vendor.email}</Text>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={
                              vendor.is_approved ? 'green' : 
                              vendor.status === 'pending' ? 'orange' : 'gray'
                            }
                          >
                            {vendor.is_approved ? 'Approved' : vendor.status || 'Pending'}
                          </Badge>
                        </Td>
                        <Td textAlign="center">
                          <HStack justify="center" spacing={3}>
                            <Badge
                              colorScheme={vendor.product_visibility !== false ? 'green' : 'red'}
                              fontSize="sm"
                              px={3}
                              py={1}
                            >
                              {vendor.product_visibility !== false ? 'ENABLED' : 'DISABLED'}
                            </Badge>
                            <Tooltip
                              label={
                                vendor.product_visibility !== false
                                  ? 'Click to disable product access'
                                  : 'Click to enable product access'
                              }
                              hasArrow
                            >
                              <Box>
                                <Switch
                                  size="lg"
                                  colorScheme="green"
                                  isChecked={vendor.product_visibility !== false}
                                  onChange={() =>
                                    toggleVisibility(vendor.id, vendor.product_visibility !== false)
                                  }
                                />
                              </Box>
                            </Tooltip>
                          </HStack>
                        </Td>
                        <Td textAlign="center">
                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="outline"
                            onClick={() => navigate(`/admin/manage-profile/${vendor.id}`)}
                          >
                            View Profile
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </CardBody>
        </Card>

          {/* Results Info */}
          <Text fontSize="sm" color="gray.600" textAlign="center">
            Showing {filteredVendors.length} of {vendors.length} vendors
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
};

export default ProductVisibilityPage;

