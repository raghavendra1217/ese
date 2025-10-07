import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, VStack, Heading, Text, Table, Thead, Tbody, Tr, Th, Td,
  Button, HStack, Spinner, useColorModeValue, IconButton, useDisclosure,
  Drawer, DrawerContent, DrawerOverlay, Avatar, Badge, Input,
  InputGroup, InputLeftElement, Select, useToast, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  FormControl, FormLabel, Tooltip
} from '@chakra-ui/react';
import { FaUsers, FaSearch, FaArrowLeft, FaEye } from 'react-icons/fa';
import { EditIcon, AddIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AppContext';

const VendorsLast8DaysPage = ({ url }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalVendors, setTotalVendors] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy] = useState('created_at'); // Fixed to registration date
  const [sortOrder] = useState('DESC'); // Fixed to descending order
  const [selectedVendor, setSelectedVendor] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Coordinator management state
  const [coordinators, setCoordinators] = useState([]);
  const [editingVendor, setEditingVendor] = useState(null);
  const [selectedCoordinator, setSelectedCoordinator] = useState('');
  const { isOpen: isCoordEditOpen, onOpen: onCoordEditOpen, onClose: onCoordEditClose } = useDisclosure();

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const tableRowHoverBg = useColorModeValue('gray.50', 'gray.700');

  // Fetch vendors from last 8 days with dedicated logic
  const fetchVendorsLast8Days = useCallback(async (page = 1, search = '', sort = 'created_at', order = 'DESC') => {
    if (!token) return;
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: search,
        sortBy: sort,
        sortOrder: order,
        filter: 'last8days' // This will be handled by backend specifically for last 8 days
      });

      const response = await fetch(`${url}/api/admin/vendors/last8days/paginated?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }

      const data = await response.json();
      setVendors(data.vendors || []);
      setTotalVendors(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching vendors from last 8 days:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch vendors from last 8 days',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [token, url, toast]);

  // Fetch total count for the header
  const fetchTotalCount = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${url}/api/admin/vendors/last8days`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTotalVendors(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching total count:', error);
    }
  }, [token, url]);

  // Fetch coordinators for dropdown
  const fetchCoordinators = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${url}/api/coordinator`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCoordinators(data.coordinators || []);
      }
    } catch (error) {
      console.error('Error fetching coordinators:', error);
    }
  }, [token, url]);

  // Update vendor coordinator
  const updateVendorCoordinator = async () => {
    if (!editingVendor || selectedCoordinator === undefined) {
      return;
    }

    try {
      const requestBody = { coordinator_id: selectedCoordinator };
      
      const response = await fetch(`${url}/api/admin/update-vendor-coordinator/${editingVendor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        toast({
          title: 'Coordinator Assigned',
          description: 'The coordinator has been successfully assigned to this vendor!',
          status: 'success',
          isClosable: true
        });
        
        // Refresh vendors data
        await fetchVendorsLast8Days(currentPage, searchTerm, sortBy, sortOrder);
        
        onCoordEditClose();
        setSelectedCoordinator('');
        setEditingVendor(null);
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to update vendor coordinator',
          status: 'error',
          isClosable: true
        });
      }
    } catch (error) {
      console.error('Error updating vendor coordinator:', error);
      toast({
        title: 'Error',
        description: 'Network error occurred while updating coordinator',
        status: 'error',
        isClosable: true
      });
    }
  };

  useEffect(() => {
    fetchTotalCount();
    fetchCoordinators();
  }, [fetchTotalCount, fetchCoordinators]);

  useEffect(() => {
    fetchVendorsLast8Days(currentPage, searchTerm, sortBy, sortOrder);
  }, [fetchVendorsLast8Days, currentPage, searchTerm, sortBy, sortOrder]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewVendor = (vendor) => {
    setSelectedVendor(vendor);
    onOpen();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box bg={pageBg} minH="100vh" p={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <HStack spacing={4}>
          <IconButton
            icon={<FaArrowLeft />}
            onClick={() => navigate('/admin/dashboard')}
            variant="ghost"
            aria-label="Go back"
            size="lg"
          />
          <VStack align="start" spacing={1}>
            <Heading size="lg" color={headingColor}>
              Vendors from Last 8 Days
            </Heading>
            <Text color="gray.600" fontSize="sm">
              Showing vendors who registered in the last 8 days
            </Text>
          </VStack>
        </HStack>
        
        <HStack spacing={4}>
          <Box textAlign="right">
            <Text fontSize="2xl" fontWeight="bold" color="teal.600">
              {totalVendors}
            </Text>
            <Text fontSize="sm" color="gray.600">
              Total Recent Vendors
            </Text>
          </Box>
        </HStack>
      </Flex>

      {/* Search and Filters */}
      <Box bg={cardBg} p={4} borderRadius="lg" borderWidth="1px" borderColor={cardBorder} mb={6}>
        <HStack spacing={4}>
          <InputGroup maxW="400px">
            <InputLeftElement pointerEvents="none">
              <FaSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search vendors by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              borderRadius="lg"
            />
          </InputGroup>
          

          

        </HStack>
      </Box>

      {/* Vendors Table */}
      <Box bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={cardBorder} overflow="hidden">
        {loading ? (
          <Flex justify="center" align="center" p={12}>
            <Spinner size="xl" color="teal.500" />
          </Flex>
        ) : (
          <>
            <Table variant="simple">
              <Thead bg={tableHeaderBg}>
                <Tr>
                  <Th>
                    <Text>Vendor</Text>
                  </Th>
                  <Th>
                    <Text>Email</Text>
                  </Th>
                  <Th>
                    <Text>Phone</Text>
                  </Th>
                  <Th>
                    <Text>Registration Date</Text>
                  </Th>
                  <Th>Coordinator</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {vendors.length === 0 ? (
                  <Tr>
                    <Td colSpan={7} textAlign="center" py={8}>
                      <VStack spacing={3}>
                        <FaUsers size={48} color="gray.300" />
                        <Text color="gray.500" fontSize="lg">
                          No vendors found in the last 8 days
                        </Text>
                        <Text color="gray.400" fontSize="sm">
                          Try adjusting your search or filters
                        </Text>
                      </VStack>
                    </Td>
                  </Tr>
                ) : (
                  vendors.map((vendor) => (
                    <Tr key={vendor.id} _hover={{ bg: tableRowHoverBg }}>
                      <Td>
                        <HStack spacing={3}>
                          <Avatar
                            size="sm"
                            name={vendor.name || vendor.email}
                            src={null}
                          />
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold" color={headingColor}>
                              {vendor.name || 'N/A'}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              ID: {vendor.id}
                            </Text>
                          </VStack>
                        </HStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm">{vendor.email}</Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">{vendor.phone || 'N/A'}</Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="gray.600">
                          {formatDate(vendor.created_at)}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color={vendor.coordinator_name ? 'inherit' : 'gray.500'}>
                          {vendor.coordinator_name || 'No Coordinator'}
                        </Text>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={getStatusColor(vendor.status)}
                          variant="subtle"
                          borderRadius="full"
                          px={3}
                          py={1}
                        >
                          {vendor.status || 'Unknown'}
                        </Badge>
                      </Td>
                      <Td textAlign="center">
                        <HStack spacing={2} justify="center">
                          {vendor.coordinator_id && vendor.coordinator_id !== '' ? (
                            <Tooltip label="Edit coordinator" hasArrow>
                              <IconButton
                                aria-label="Edit coordinator"
                                icon={<EditIcon />}
                                size="sm"
                                colorScheme="green"
                                variant="solid"
                                bg="green.500"
                                _hover={{ bg: "green.600" }}
                                onClick={() => {
                                  setEditingVendor(vendor);
                                  setSelectedCoordinator(vendor.coordinator_id || '');
                                  onCoordEditOpen();
                                }}
                              />
                            </Tooltip>
                          ) : (
                            <Tooltip label="Add coordinator" hasArrow>
                              <IconButton
                                aria-label="Add coordinator"
                                icon={<AddIcon />}
                                size="sm"
                                colorScheme="blue"
                                variant="solid"
                                bg="blue.500"
                                _hover={{ bg: "blue.600" }}
                                onClick={() => {
                                  setEditingVendor(vendor);
                                  setSelectedCoordinator('');
                                  onCoordEditOpen();
                                }}
                              />
                            </Tooltip>
                          )}
                          <IconButton
                            icon={<FaEye />}
                            size="sm"
                            variant="ghost"
                            colorScheme="teal"
                            onClick={() => handleViewVendor(vendor)}
                            aria-label="View vendor details"
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box p={4} borderTopWidth="1px" borderColor={cardBorder}>
                <HStack justify="center" spacing={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    isDisabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      size="sm"
                      variant={currentPage === page ? "solid" : "outline"}
                      colorScheme={currentPage === page ? "teal" : "gray"}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    isDisabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </HStack>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Vendor Details Drawer */}
      <Drawer isOpen={isOpen} onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <Box p={6}>
            <Heading size="md" mb={4}>
              Vendor Details
            </Heading>
            {selectedVendor && (
              <VStack spacing={4} align="start">
                <HStack spacing={4}>
                  <Avatar
                    size="lg"
                    name={selectedVendor.name || selectedVendor.email}
                    src={null}
                  />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold" fontSize="lg">
                      {selectedVendor.name || 'N/A'}
                    </Text>
                    <Text color="gray.600">{selectedVendor.email}</Text>
                    <Badge
                      colorScheme={getStatusColor(selectedVendor.status)}
                      variant="subtle"
                    >
                      {selectedVendor.status || 'Unknown'}
                    </Badge>
                  </VStack>
                </HStack>
                
                <Box w="full">
                  <Text fontWeight="semibold" mb={2}>Phone</Text>
                  <Text color="gray.600">{selectedVendor.phone || 'N/A'}</Text>
                </Box>
                
                <Box w="full">
                  <Text fontWeight="semibold" mb={2}>Registration Date</Text>
                  <Text color="gray.600">{formatDate(selectedVendor.created_at)}</Text>
                </Box>
                
                <Box w="full">
                  <Text fontWeight="semibold" mb={2}>Vendor ID</Text>
                  <Text color="gray.600">{selectedVendor.id}</Text>
                </Box>
                
                <Button
                  colorScheme="teal"
                  w="full"
                  onClick={onClose}
                >
                  Close
                </Button>
              </VStack>
            )}
          </Box>
        </DrawerContent>
      </Drawer>

      {/* Coordinator Edit Modal */}
      <Modal isOpen={isCoordEditOpen} onClose={onCoordEditClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            bg="purple.50"
            borderBottom="1px"
            borderColor="purple.100"
            borderTopRadius="lg"
            py={6}
            fontSize="lg"
            fontWeight="bold"
          >
            {editingVendor?.coordinator_name ? 'Edit Vendor Coordinator' : 'Add Vendor Coordinator'}
          </ModalHeader>
          <ModalCloseButton top={4} right={4} />
          <ModalBody py={6}>
            {editingVendor && (
              <VStack spacing={6} align="stretch">
                <Box
                  p={4}
                  bg="gray.50"
                  borderRadius="md"
                  border="1px"
                  borderColor="gray.200"
                >
                  <VStack spacing={2} align="stretch">
                    <Text fontWeight="semibold" color="gray.700">
                      Vendor Details:
                    </Text>
                    <Text><strong>Name:</strong> {editingVendor.name}</Text>
                    <Text><strong>ID:</strong> {editingVendor.id}</Text>
                    <Text><strong>Current Coordinator:</strong>
                      <Badge colorScheme={editingVendor.coordinator_name ? "blue" : "gray"} ml={2}>
                        {editingVendor.coordinator_name || 'No Coordinator'}
                      </Badge>
                    </Text>
                  </VStack>
                </Box>

                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.700">Select Coordinator</FormLabel>
                  <Select
                    value={selectedCoordinator}
                    onChange={(e) => setSelectedCoordinator(e.target.value)}
                    placeholder="Choose a coordinator..."
                    size="lg"
                    borderRadius="md"
                    _focus={{
                      borderColor: "#3182ce",
                      boxShadow: "0 0 0 1px #3182ce"
                    }}
                  >
                    <option value="">No Coordinator</option>
                    {coordinators.map((coord) => (
                      <option key={coord.coordinator_id} value={coord.coordinator_id}>
                        {coord.name} ({coord.coordinator_id})
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={onCoordEditClose}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={updateVendorCoordinator}
              isDisabled={selectedCoordinator === undefined}
              borderRadius="md"
              px={6}
            >
              {selectedCoordinator ? 'Update Coordinator' : 'Remove Coordinator'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default VendorsLast8DaysPage;
