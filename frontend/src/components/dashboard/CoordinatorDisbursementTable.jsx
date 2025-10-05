import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Table, Thead, Tbody, Tr, Th, Td, Badge, Button, IconButton,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, FormControl, FormLabel, Input, Textarea, Select,
  useToast, HStack, Text, Spinner, Center, useColorModeValue, Flex, VStack,
  Stack, Divider
} from '@chakra-ui/react';
import { EditIcon, ChevronLeftIcon, ChevronRightIcon, ViewIcon, DownloadIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'green';
      case 'pending': return 'orange';
      case 'overdue': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Badge colorScheme={getStatusColor(status)} variant="solid" borderRadius="full" px={3} py={1}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const DisbursementModal = ({ isOpen, onClose, disbursement, onUpdate }) => {
  const [formData, setFormData] = useState({
    status: '',
    paymentReference: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (disbursement) {
      setFormData({
        status: disbursement.status || '',
        paymentReference: disbursement.payment_reference || '',
        notes: disbursement.notes || ''
      });
    }
  }, [disbursement]);

  const handleSubmit = async () => {
    if (!formData.status) {
      toast({
        title: 'Status is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(disbursement.id, formData);
      onClose();
      toast({
        title: 'Disbursement updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error updating disbursement',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Update Disbursement</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl mb={4}>
            <FormLabel>Status</FormLabel>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </Select>
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Payment Reference</FormLabel>
            <Input
              value={formData.paymentReference}
              onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
              placeholder="Transaction ID or reference number"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Notes</FormLabel>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={isLoading}>
            Update Disbursement
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const CoordinatorDisbursementTable = ({ url }) => {
  const { token } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedDisbursement, setSelectedDisbursement] = useState(null);
  const [disbursements, setDisbursements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 50
  });
  const [pagination, setPagination] = useState(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Load real data from API
  const loadDisbursements = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString()
      });

      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status) queryParams.append('status', filters.status);

      const response = await fetch(`${url}/api/coordinator/disbursements?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch disbursements');
      }

      const result = await response.json();
      if (result.success) {
        setDisbursements(result.data.disbursements || []);
        setPagination(result.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          limit: 50,
          hasPrev: false,
          hasNext: false
        });
      }
    } catch (error) {
      console.error('Error loading disbursements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load disbursements',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setDisbursements([]);
    } finally {
      setIsLoading(false);
    }
  }, [url, token, filters, toast]);

  useEffect(() => {
    loadDisbursements();
  }, [loadDisbursements]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      let date;
      
      if (typeof dateString === 'string') {
        if (dateString.includes('T') || dateString.includes('Z')) {
          date = new Date(dateString);
        } else {
          date = new Date(dateString + 'T00:00:00');
        }
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const handleEditDisbursement = (disbursement) => {
    setSelectedDisbursement(disbursement);
    onOpen();
  };

  const handleUpdateDisbursement = async (id, data) => {
    try {
      const response = await fetch(`${url}/api/coordinator/disbursements/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update disbursement');
      }

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Disbursement updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Reload disbursements to get updated data
        loadDisbursements();
      } else {
        throw new Error(result.message || 'Failed to update disbursement');
      }
    } catch (error) {
      console.error('Error updating disbursement:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update disbursement',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error; // Re-throw to let the modal handle it
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  if (isLoading) {
    return (
      <Center py={8}>
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <Box>
      {/* Download CSV Button */}
      <Flex justify="flex-end" align="center" mb={6}>
        <Button
          leftIcon={<DownloadIcon />}
          colorScheme="green"
          variant="outline"
          size="sm"
          onClick={() => {
            // Create CSV content
            const headers = ['ID', 'Investor', 'Mobile', 'Coordinator', 'Plan', 'Amount', 'Date', 'Status'];
            const csvContent = [
              headers.join(','),
              ...(disbursements || []).map(d => [
                d.id,
                d.first_name,
                d.mobile_number,
                d.coordinator || 'N/A',
                `${d.plan_type} - ${d.select_plan}`,
                d.disbursement_amount,
                d.disbursement_date,
                d.status
              ].join(','))
            ].join('\n');

            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `coordinator-disbursements-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
          }}
          _hover={{ bg: "green.50", borderColor: "green.400" }}
          borderRadius="lg"
        >
          Download CSV
        </Button>
      </Flex>

      {/* Rows per page selector */}
      <Flex justify="space-between" align="center" mb={4}>
        <HStack spacing={3}>
          <Text fontSize="sm" color="gray.600" fontWeight="medium">
            Rows per page:
          </Text>
          <Select 
            value={filters.limit || 50}
            onChange={(e) => handleFiltersChange({ ...filters, limit: parseInt(e.target.value), page: 1 })}
            size="sm"
            width="80px"
            borderRadius="lg"
            borderColor="gray.300"
            _hover={{ borderColor: "blue.400" }}
            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </Select>
        </HStack>
        
        {pagination && (
          <Text fontSize="sm" color="gray.600" fontWeight="medium">
            Total: {pagination.totalCount} disbursements
          </Text>
        )}
      </Flex>

      {/* Table */}
      <Box 
        bg="white" 
        borderRadius="xl" 
        overflow="hidden" 
        border="2px solid" 
        borderColor="gray.200" 
        boxShadow="xl"
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%)',
          pointerEvents: 'none',
          borderRadius: 'xl'
        }}
      >
        <Box display={{ base: 'none', md: 'block' }}>
          <Table variant="simple" position="relative" zIndex={1} w="100%" sx={{ 
            'table-layout': 'fixed',
            'th:nth-of-type(1), td:nth-of-type(1)': { width: '8%' },  // ID
            'th:nth-of-type(2), td:nth-of-type(2)': { width: '15%' }, // Investor
            'th:nth-of-type(3), td:nth-of-type(3)': { width: '12%' }, // Mobile
            'th:nth-of-type(4), td:nth-of-type(4)': { width: '15%' }, // Coordinator
            'th:nth-of-type(5), td:nth-of-type(5)': { width: '15%' }, // Plan
            'th:nth-of-type(6), td:nth-of-type(6)': { width: '12%' }, // Amount
            'th:nth-of-type(7), td:nth-of-type(7)': { width: '10%' }, // Date
            'th:nth-of-type(8), td:nth-of-type(8)': { width: '8%' },  // Status
            'th:nth-of-type(9), td:nth-of-type(9)': { width: '5%' }   // Actions
          }}>
            <Thead bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" position="sticky" top={0} zIndex={2}>
              <Tr>
                <Th color="white" fontWeight="bold" fontSize="sm" py={4} textAlign="center">ID</Th>
                <Th color="white" fontWeight="bold" fontSize="sm" py={4}>Investor</Th>
                <Th color="white" fontWeight="bold" fontSize="sm" py={4}>Mobile</Th>
                <Th color="white" fontWeight="bold" fontSize="sm" py={4}>Coordinator</Th>
                <Th color="white" fontWeight="bold" fontSize="sm" py={4} textAlign="center">Plan</Th>
                <Th color="white" fontWeight="bold" fontSize="sm" py={4} textAlign="right">Amount</Th>
                <Th color="white" fontWeight="bold" fontSize="sm" py={4} textAlign="center">Date</Th>
                <Th color="white" fontWeight="bold" fontSize="sm" py={4} textAlign="center">Status</Th>
                <Th color="white" fontWeight="bold" fontSize="sm" py={4} textAlign="center">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {disbursements && disbursements.length > 0 ? disbursements.map((disbursement, index) => (
                <Tr 
                  key={disbursement.id}
                  _hover={{ 
                    bg: "linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}
                  bg={index % 2 === 0 ? "white" : "gray.25"}
                  transition="all 0.2s ease"
                  borderBottom="1px solid"
                  borderColor="gray.100"
                >
                  <Td fontFamily="monospace" fontSize="sm" color="gray.600" textAlign="center" py={4}>
                    <Badge colorScheme="purple" variant="subtle" borderRadius="full" px={2} py={1}>
                      #{disbursement.id}
                    </Badge>
                  </Td>
                  <Td fontWeight="semibold" color="gray.700" py={4}>
                    {disbursement.first_name}
                  </Td>
                  <Td fontFamily="monospace" color="gray.600" py={4}>{disbursement.mobile_number}</Td>
                  <Td color="gray.600" py={4}>{disbursement.coordinator || 'N/A'}</Td>
                  <Td textAlign="center" py={4}>
                    <Badge 
                      colorScheme="blue" 
                      variant="subtle" 
                      borderRadius="full" 
                      px={3} 
                      py={1}
                      fontWeight="medium"
                      fontSize="xs"
                    >
                      {disbursement.plan_type} - {disbursement.select_plan}
                    </Badge>
                  </Td>
                  <Td fontWeight="bold" color="green.600" fontSize="md" textAlign="right" py={4}>
                    {formatCurrency(disbursement.disbursement_amount)}
                  </Td>
                  <Td color="gray.600" textAlign="center" py={4}>{formatDate(disbursement.disbursement_date)}</Td>
                  <Td textAlign="center" py={4}>
                    <StatusBadge status={disbursement.status} />
                  </Td>
                  <Td textAlign="center" py={4}>
                    <HStack spacing={2} justify="center">
                      <IconButton
                        aria-label="View details"
                        icon={<ViewIcon />}
                        size="sm"
                        variant="outline"
                        colorScheme="blue"
                        _hover={{ 
                          bg: "blue.50", 
                          borderColor: "blue.400",
                          transform: "scale(1.05)"
                        }}
                        borderRadius="lg"
                      />
                      <IconButton
                        aria-label="Edit disbursement"
                        icon={<EditIcon />}
                        size="sm"
                        variant="outline"
                        colorScheme="orange"
                        onClick={() => handleEditDisbursement(disbursement)}
                        _hover={{ 
                          bg: "orange.50", 
                          borderColor: "orange.400",
                          transform: "scale(1.05)"
                        }}
                        borderRadius="lg"
                      />
                    </HStack>
                  </Td>
                </Tr>
              )) : (
                <Tr>
                  <Td colSpan={9} textAlign="center" py={8} color="gray.500">
                    <Text fontSize="lg" fontWeight="medium">No disbursements found</Text>
                    <Text fontSize="sm" mt={2}>Try adjusting your search criteria or filters</Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>

        {/* Mobile Card View */}
        <Stack spacing={4} display={{ base: 'block', md: 'none' }} p={4}>
          {disbursements && disbursements.length > 0 ? disbursements.map((disbursement) => (
            <Box
              key={disbursement.id}
              bg="white"
              borderRadius="lg"
              p={4}
              border="1px solid"
              borderColor="gray.200"
              boxShadow="sm"
              _hover={{
                boxShadow: "md",
                transform: "translateY(-2px)",
                transition: "all 0.2s ease"
              }}
            >
              <VStack spacing={3} align="stretch">
                {/* Header with ID and Status */}
                <Flex justify="space-between" align="center">
                  <Badge colorScheme="purple" variant="subtle" borderRadius="full" px={2} py={1}>
                    #{disbursement.id}
                  </Badge>
                  <StatusBadge status={disbursement.status} />
                </Flex>

                {/* Investor Info */}
                <Box>
                  <Text fontWeight="semibold" color="gray.700" fontSize="lg">
                    {disbursement.first_name}
                  </Text>
                  <Text fontFamily="monospace" color="gray.600" fontSize="sm">
                    {disbursement.mobile_number}
                  </Text>
                </Box>

                {/* Plan Info */}
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>Plan</Text>
                  <Badge 
                    colorScheme="blue" 
                    variant="subtle" 
                    borderRadius="full" 
                    px={3} 
                    py={1}
                    fontWeight="medium"
                    fontSize="xs"
                  >
                    {disbursement.plan_type} - {disbursement.select_plan}
                  </Badge>
                </Box>

                {/* Amount */}
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>Amount</Text>
                  <Text fontWeight="bold" color="green.600" fontSize="lg">
                    {formatCurrency(disbursement.disbursement_amount)}
                  </Text>
                </Box>

                {/* Coordinator */}
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>Coordinator</Text>
                  <Text color="gray.600">{disbursement.coordinator || 'N/A'}</Text>
                </Box>

                {/* Date */}
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>Date</Text>
                  <Text color="gray.600">{formatDate(disbursement.disbursement_date)}</Text>
                </Box>

                {/* Actions */}
                <Divider />
                <HStack spacing={2} justify="center">
                  <Button
                    leftIcon={<EditIcon />}
                    size="sm"
                    colorScheme="green"
                    variant="outline"
                    onClick={() => handleEditDisbursement(disbursement)}
                  >
                    Edit
                  </Button>
                </HStack>
              </VStack>
            </Box>
          )) : (
            <Box textAlign="center" py={8}>
              <VStack spacing={2}>
                <Text fontSize="lg" fontWeight="medium" color="gray.500">
                  No disbursements found
                </Text>
                <Text fontSize="sm" mt={2}>Try adjusting your search criteria or filters</Text>
              </VStack>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Pagination */}
      {pagination && (
        <Box 
          mt={6} 
          p={6} 
          bg="linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)" 
          borderRadius="xl" 
          border="2px solid" 
          borderColor="gray.200"
          boxShadow="lg"
        >
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <Box>
              <Text fontSize="sm" color="gray.600" fontWeight="medium" mb={1}>
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
                {pagination.totalCount} disbursements
              </Text>
              <Text fontSize="xs" color="gray.500">
                Page {pagination.currentPage} of {pagination.totalPages} • {pagination.totalPages} total pages
              </Text>
            </Box>
            
            <HStack spacing={2}>
              <Button
                size="sm"
                leftIcon={<ChevronLeftIcon />}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                isDisabled={!pagination.hasPrev}
                colorScheme="blue"
                variant="solid"
                bg="linear-gradient(135deg, #3182ce 0%, #2c5282 100%)"
                _hover={{ 
                  bg: "linear-gradient(135deg, #2c5282 0%, #2a4365 100%)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(49, 130, 206, 0.3)"
                }}
                _active={{ transform: "translateY(0px)" }}
                borderRadius="lg"
                fontWeight="semibold"
                boxShadow="0 2px 8px rgba(49, 130, 206, 0.2)"
              >
                Previous
              </Button>
              
              {/* Page numbers */}
              <HStack spacing={1}>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const startPage = Math.max(1, pagination.currentPage - 2);
                  const pageNum = startPage + i;
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      colorScheme={pageNum === pagination.currentPage ? "blue" : "gray"}
                      variant={pageNum === pagination.currentPage ? "solid" : "outline"}
                      bg={pageNum === pagination.currentPage ? "linear-gradient(135deg, #3182ce 0%, #2c5282 100%)" : "white"}
                      color={pageNum === pagination.currentPage ? "white" : "gray.700"}
                      _hover={{ 
                        bg: pageNum === pagination.currentPage ? "linear-gradient(135deg, #2c5282 0%, #2a4365 100%)" : "blue.50",
                        borderColor: "blue.400",
                        transform: "translateY(-1px)"
                      }}
                      borderRadius="lg"
                      fontWeight="semibold"
                      minW="40px"
                      boxShadow={pageNum === pagination.currentPage ? "0 2px 8px rgba(49, 130, 206, 0.3)" : "none"}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </HStack>
              
              <Button
                size="sm"
                rightIcon={<ChevronRightIcon />}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                isDisabled={!pagination.hasNext}
                colorScheme="blue"
                variant="solid"
                bg="linear-gradient(135deg, #3182ce 0%, #2c5282 100%)"
                _hover={{ 
                  bg: "linear-gradient(135deg, #2c5282 0%, #2a4365 100%)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(49, 130, 206, 0.3)"
                }}
                _active={{ transform: "translateY(0px)" }}
                borderRadius="lg"
                fontWeight="semibold"
                boxShadow="0 2px 8px rgba(49, 130, 206, 0.2)"
              >
                Next
              </Button>
            </HStack>
          </Flex>
        </Box>
      )}

      {/* Update Modal */}
      <DisbursementModal
        isOpen={isOpen}
        onClose={onClose}
        disbursement={selectedDisbursement}
        onUpdate={handleUpdateDisbursement}
      />
    </Box>
  );
};

export default CoordinatorDisbursementTable;
