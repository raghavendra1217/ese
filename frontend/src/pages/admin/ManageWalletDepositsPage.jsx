import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Text, Button, useToast, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalFooter, ModalCloseButton, VStack, HStack,
  FormControl, FormLabel, Input, Select, Spinner,
  useColorModeValue, Flex, Heading, IconButton, useDisclosure, Drawer, DrawerOverlay, DrawerContent,
  InputGroup, InputLeftElement, InputRightElement, Divider, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Badge, Center, Wrap, WrapItem, Tag, TagLabel, TagCloseButton
} from '@chakra-ui/react';
import { HamburgerIcon, SearchIcon, CloseIcon } from '@chakra-ui/icons';
import { FaPlus } from 'react-icons/fa';
import { useAuth } from '../../AppContext';
import { formatISTDate } from '../../utils/dateUtils';
import AdminNavBar from '../../components/layout/AdminNavBar';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

const ADMIN_SIDEBAR_W = '80px';

const DepositModal = ({ isOpen, onClose, onSuccess, url, token }) => {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [vendors, setVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingVendors, setFetchingVendors] = useState(false);

  useEffect(() => {
    if (isOpen && step === 1 && vendors.length === 0) {
      fetchVendors();
    }
  }, [isOpen, step]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('[data-dropdown]')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const fetchVendors = async () => {
    setFetchingVendors(true);
    try {
      const response = await fetch(`${url}/api/admin/vendors/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch vendors');
      const data = await response.json();
      setVendors(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch vendors',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setFetchingVendors(false);
    }
  };

  const handleNext = () => {
    if (!selectedVendor) {
      toast({
        title: 'Error',
        description: 'Please select a vendor',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleConfirm = async () => {
    if (!transactionId.trim() || !amount.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${url}/api/admin/add-manual-deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vendorId: selectedVendor.id,
          amount: depositAmount,
          transactionId: transactionId.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add deposit');
      }

      toast({
        title: 'Success',
        description: `Deposit of ₹${depositAmount} added successfully`,
        status: 'success',
        duration: 3000,
      });

      onSuccess();
      onClose();
      
      // Reset form
      setStep(1);
      setSelectedVendor(null);
      setTransactionId('');
      setAmount('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedVendor(null);
    setTransactionId('');
    setAmount('');
    setSearchQuery('');
    setShowDropdown(false);
    onClose();
  };

  const selectedVendorData = selectedVendor ? vendors.find(v => v.id === selectedVendor.id) : null;

  // Filter vendors based on search query
  const filteredVendors = searchQuery.trim() === '' 
    ? vendors.slice(0, 20) // Show first 20 vendors when empty
    : vendors.filter(vendor => 
        vendor.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Add Manual Deposit
          <Box mt={2}>
            {[1, 2].map((s) => (
              <Box
                key={s}
                display="inline-block"
                w="8px"
                h="8px"
                borderRadius="full"
                bg={step >= s ? "blue.500" : "gray.300"}
                mr={2}
              />
            ))}
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {step === 1 ? (
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Search and Select Vendor</FormLabel>
                {fetchingVendors ? (
                  <Flex justify="center" py={4}>
                    <Spinner />
                  </Flex>
                ) : (
                  <Box position="relative" data-dropdown>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder={selectedVendor ? `${selectedVendor.id}: ${selectedVendor.vendor_name}` : "Type to search by name or ID..."}
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        onClick={() => setShowDropdown(true)}
                        size="lg"
                      />
                    </InputGroup>
                    
                    {showDropdown && (
                      <Box
                        position="absolute"
                        zIndex={10}
                        w="100%"
                        maxH="300px"
                        overflowY="auto"
                        bg="white"
                        border="1px solid"
                        borderColor="gray.300"
                        borderRadius="md"
                        mt={1}
                        boxShadow="lg"
                        data-dropdown
                      >
                        {(filteredVendors.length === 0 ? (
                          <Text p={3} color="gray.500">No vendors found</Text>
                        ) : (
                          filteredVendors.map((vendor) => (
                            <Box
                              key={vendor.id}
                              p={3}
                              cursor="pointer"
                              _hover={{ bg: "blue.50" }}
                              onClick={() => {
                                setSelectedVendor(vendor);
                                setShowDropdown(false);
                                setSearchQuery('');
                              }}
                              borderBottom="1px solid"
                              borderColor="gray.100"
                            >
                              <Text fontWeight="bold">{vendor.id}: {vendor.vendor_name}</Text>
                            </Box>
                          ))
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
              </FormControl>
              
              {selectedVendor && (
                <Box p={4} bg="blue.50" border="2px solid" borderColor="blue.200" borderRadius="md">
                  <Text fontWeight="bold" fontSize="md" color="blue.700" mb={3}>
                    Selected Vendor Details
                  </Text>
                  <Divider mb={3} />
                  <VStack spacing={2} align="stretch">
                    <Flex justify="space-between">
                      <Text fontWeight="semibold" color="gray.600">Vendor ID:</Text>
                      <Text fontWeight="bold" color="blue.700">{selectedVendorData?.id}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="semibold" color="gray.600">Name:</Text>
                      <Text fontWeight="bold">{selectedVendorData?.vendor_name}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="semibold" color="gray.600">Email:</Text>
                      <Text>{selectedVendorData?.email}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="semibold" color="gray.600">Phone:</Text>
                      <Text>{selectedVendorData?.phone_number || 'N/A'}</Text>
                    </Flex>
                    <Divider my={2} />
                    <Flex justify="space-between">
                      <Text fontWeight="semibold" color="green.600">Current Balance:</Text>
                      <Text fontWeight="bold" color="green.600" fontSize="lg">
                        ₹{selectedVendorData?.wallet_balance || 0}
                      </Text>
                    </Flex>
                  </VStack>
                </Box>
              )}
            </VStack>
          ) : (
            <VStack spacing={4} align="stretch">
              <Box p={4} bg="blue.50" border="2px solid" borderColor="blue.200" borderRadius="md">
                <Text fontWeight="bold" fontSize="md" color="blue.700" mb={3}>
                  Vendor Information
                </Text>
                <Divider mb={3} />
                <VStack spacing={2} align="stretch">
                  <Flex justify="space-between">
                    <Text fontWeight="semibold" color="gray.600">Vendor ID:</Text>
                    <Text fontWeight="bold" color="blue.700">{selectedVendorData?.id}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text fontWeight="semibold" color="gray.600">Name:</Text>
                    <Text fontWeight="bold">{selectedVendorData?.vendor_name}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text fontWeight="semibold" color="gray.600">Email:</Text>
                    <Text>{selectedVendorData?.email}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text fontWeight="semibold" color="gray.600">Current Balance:</Text>
                    <Text fontWeight="bold" color="green.600">₹{selectedVendorData?.wallet_balance || 0}</Text>
                  </Flex>
                </VStack>
              </Box>

              <FormControl isRequired>
                <FormLabel fontWeight="semibold">Transaction ID</FormLabel>
                <Input
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID"
                  size="lg"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="semibold">Deposit Amount (₹)</FormLabel>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter deposit amount"
                  min="0"
                  step="0.01"
                  size="lg"
                />
                {amount && parseFloat(amount) > 0 && (
                  <Text mt={2} color="green.600" fontWeight="semibold">
                    New Balance: ₹{(parseFloat(selectedVendorData?.wallet_balance || 0) + parseFloat(amount)).toFixed(2)}
                  </Text>
                )}
              </FormControl>
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          {step === 1 ? (
            <>
              <Button variant="ghost" mr={3} onClick={handleClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleNext}>
                Next
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" mr={3} onClick={handleBack}>
                Back
              </Button>
              <Button colorScheme="gray" mr={3} onClick={handleClose}>
                Cancel
              </Button>
              <Button
                colorScheme="green"
                onClick={handleConfirm}
                isLoading={isLoading}
              >
                Confirm Deposit
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const ManageWalletDepositsPage = ({ url }) => {
  const { token } = useAuth();
  const toast = useToast();
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure({
    defaultIsOpen: false
  });
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();

  const [reload, setReload] = useState(0);
  const [deposits, setDeposits] = useState([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const handleSuccess = () => {
    setReload(prev => prev + 1);
    fetchDeposits(); // Refresh deposits after successful deposit
  };

  const fetchDeposits = React.useCallback(async () => {
    setLoadingDeposits(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        search: debouncedSearchTerm,
        status: statusFilter,
        startDate,
        endDate
      });
      
      const response = await fetch(`${url}/api/admin/manual-deposits?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch deposits');
      const data = await response.json();
      setDeposits(data.data);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch deposits',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoadingDeposits(false);
    }
  }, [token, url, page, debouncedSearchTerm, statusFilter, startDate, endDate, toast]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, statusFilter, startDate, endDate]);

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Flex minH="100vh" bg={pageBg}>
      {/* Desktop sidebar */}
      <AdminNavBar variant="static" onOpen={onDrawerOpen} />

      {/* Mobile drawer */}
      <Drawer isOpen={isDrawerOpen} placement="left" onClose={onDrawerClose}>
        <DrawerOverlay />
        <DrawerContent>
          <AdminNavBar variant="drawer" onClose={onDrawerClose} />
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <Box flex="1" ml={{ base: 0, md: ADMIN_SIDEBAR_W }} p={{ base: 4, sm: 6, md: 8 }}>
        {/* Mobile header */}
        <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon w={5} h={5} />}
            onClick={onDrawerOpen}
            size="sm"
            variant="ghost"
          />
          <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">
            Wallet Deposits
          </Heading>
        </Flex>

        <VStack spacing={{ base: 4, md: 8 }} align="stretch">
          {/* Page Header */}
          <Box>
            <HStack justify="space-between" align="center" mb={4}>
              <Heading size="lg" color={headingColor} display={{ base: 'none', md: 'block' }}>
                Wallet Deposits
              </Heading>
              <Button
                leftIcon={<FaPlus />}
                colorScheme="blue"
                onClick={onModalOpen}
              >
                Add Manual Deposit
              </Button>
            </HStack>
          </Box>

          {/* Info Card */}
          <Box p={6} bg={cardBg} borderRadius="md" boxShadow="sm">
            <Text color={textColor}>
              Add manual deposits to vendor wallets. This will update the wallet balance
              and create a transaction record in the transaction table.
            </Text>
          </Box>

          {/* Manual Deposits Table */}
          <Box mt={6}>
            <Heading size="md" mb={4} color={headingColor}>
              Manual Deposits History (From Oct 26, 2024)
            </Heading>

            {/* Search and Filters */}
            <Box mb={4} p={4} bg={cardBg} borderRadius="md" boxShadow="sm">
              <VStack spacing={4} align="stretch">
                {/* Search Bar */}
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search by vendor name, email, ID, or transaction ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <InputRightElement>
                      <IconButton
                        icon={<CloseIcon />}
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm('')}
                        aria-label="Clear search"
                      />
                    </InputRightElement>
                  )}
                </InputGroup>

                {/* Filters */}
                <HStack spacing={4}>
                  <FormControl flex="1">
                    <FormLabel fontSize="sm">Status</FormLabel>
                    <Select
                      placeholder="All Status"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </Select>
                  </FormControl>
                  <FormControl flex="1">
                    <FormLabel fontSize="sm">Start Date</FormLabel>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </FormControl>
                  <FormControl flex="1">
                    <FormLabel fontSize="sm">End Date</FormLabel>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </FormControl>
                </HStack>

                {/* Active Filters */}
                {(statusFilter || startDate || endDate) && (
                  <Wrap spacing={2}>
                    {statusFilter && (
                      <Tag size="md" colorScheme="blue">
                        <TagLabel>Status: {statusFilter}</TagLabel>
                        <TagCloseButton onClick={() => setStatusFilter('')} />
                      </Tag>
                    )}
                    {startDate && (
                      <Tag size="md" colorScheme="green">
                        <TagLabel>From: {startDate}</TagLabel>
                        <TagCloseButton onClick={() => setStartDate('')} />
                      </Tag>
                    )}
                    {endDate && (
                      <Tag size="md" colorScheme="green">
                        <TagLabel>To: {endDate}</TagLabel>
                        <TagCloseButton onClick={() => setEndDate('')} />
                      </Tag>
                    )}
                  </Wrap>
                )}
              </VStack>
            </Box>
            
            {loadingDeposits ? (
              <Center py={10}>
                <Spinner size="xl" />
              </Center>
            ) : (
              <TableContainer bg={cardBg} borderRadius="md" boxShadow="sm">
                <Table variant="simple" size="md">
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Vendor</Th>
                      <Th>Amount</Th>
                      <Th>Balance After</Th>
                      <Th>Status</Th>
                      <Th>Transaction ID</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {deposits.length === 0 ? (
                      <Tr>
                        <Td colSpan={6} textAlign="center" py={10}>
                          <Text color={textColor}>No manual deposits found</Text>
                        </Td>
                      </Tr>
                    ) : (
                      deposits.map((deposit) => (
                        <Tr key={deposit.trans_id}>
                          <Td>{formatISTDate(deposit.created_at, true, true)}</Td>
                          <Td>
                            <Text fontWeight="bold">{deposit.vendor_name}</Text>
                            <Text fontSize="sm" color={textColor}>{deposit.vendor_id}</Text>
                          </Td>
                          <Td isNumeric fontWeight="bold" color="green.500">
                            ₹{Number(deposit.amount || 0).toFixed(2)}
                          </Td>
                          <Td isNumeric fontWeight="bold">
                            ₹{Number(deposit.balance_after_transaction || 0).toFixed(2)}
                          </Td>
                          <Td>
                            <Badge colorScheme="green">{deposit.status}</Badge>
                          </Td>
                          <Td>
                            <Text fontSize="sm" fontFamily="monospace" color="blue.600">
                              {deposit.upi_transaction_id || deposit.trans_id}
                            </Text>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            )}

            {/* Pagination */}
            {!loadingDeposits && totalPages > 1 && (
              <Flex justify="space-between" align="center" mt={4}>
                <Text color={textColor}>
                  Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, totalCount)} of {totalCount} deposits
                </Text>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    isDisabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Text color={textColor}>
                    Page {page} of {totalPages}
                  </Text>
                  <Button
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    isDisabled={page === totalPages}
                  >
                    Next
                  </Button>
                </HStack>
              </Flex>
            )}
          </Box>
        </VStack>

        <DepositModal
          isOpen={isModalOpen}
          onClose={onModalClose}
          onSuccess={handleSuccess}
          url={url}
          token={token}
        />
      </Box>
    </Flex>
  );
};

export default ManageWalletDepositsPage;
