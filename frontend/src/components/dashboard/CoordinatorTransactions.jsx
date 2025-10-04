import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Flex, Heading, Button, IconButton, useToast, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td,
  Text, useColorModeValue, Input, Select, HStack, VStack, Badge, InputGroup, InputLeftElement,
  Popover, PopoverTrigger, PopoverContent, PopoverBody, PopoverArrow, PopoverCloseButton,
  Tag, TagLabel, TagCloseButton, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton, ModalFooter, ButtonGroup, Tooltip, useBreakpointValue
} from '@chakra-ui/react';
import { SearchIcon, CalendarIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import { formatISTDate } from '../../utils/dateUtils';

// Helper to format date strings for display in filter chips
const formatDateForChip = (dateString) => {
  if (!dateString) return '—';
  const [year, month, day] = dateString.split('-');
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Helper to format timestamps using proper IST conversion
const formatTimestampIST = (timestamp) => {
  if (!timestamp) return '—';
  return formatISTDate(timestamp, true, true) || '—';
};

const CoordinatorTransactions = ({ url }) => {
  const { token } = useAuth();
  
  // API Data State
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Default sorting by recent transactions (created_at desc)
  const [sortOrder, setSortOrder] = useState('desc');

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // SIMPLIFIED FILTERS - Max 2 filters
  const [appliedStartDate, setAppliedStartDate] = useState(''); // YYYY-MM-DD
  const [appliedEndDate, setAppliedEndDate] = useState('');     // YYYY-MM-DD
  const [appliedType, setAppliedType] = useState(''); // Single type only

  // UI (DRAFT) FILTERS inside popovers
  const [uiExactDate, setUiExactDate] = useState('');
  const [uiStartDate, setUiStartDate] = useState('');
  const [uiEndDate, setUiEndDate] = useState('');
  const [uiType, setUiType] = useState('');
  
  // Theme colors
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const tableBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.800', 'gray.200');

  // Build query params for the API call
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({ 
      page, 
      limit, 
      sortBy: 'created_at',
      sortOrder 
    });
    
    if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
    if (appliedStartDate) params.append('startDate', appliedStartDate);
    if (appliedEndDate) params.append('endDate', appliedEndDate);
    if (appliedType) params.append('transaction_type', appliedType);
    
    return params;
  }, [page, limit, sortOrder, debouncedSearchTerm, appliedStartDate, appliedEndDate, appliedType]);

  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      // Use coordinator-specific endpoint that filters by assigned vendors
      const response = await fetch(`${url}/api/coordinator/transactions?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Failed to fetch transaction data');
      setTransactions(Array.isArray(data.data) ? data.data : []);
      setTotalPages(Number(data.totalPages ?? 1));
      setTotalCount(Number(data.totalCount ?? 0));
    } catch (err) {
      setError(err.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [token, url, queryParams]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const applyDateFilter = () => {
    if (uiExactDate) {
      setAppliedStartDate(uiExactDate);
      setAppliedEndDate(uiExactDate);
    } else {
      setAppliedStartDate(uiStartDate || '');
      setAppliedEndDate(uiEndDate || '');
    }
    setPage(1);
  };

  const applyTypeFilter = () => {
    setAppliedType(uiType);
    setPage(1);
  };
  
  // Transactions are sorted by created_at desc by default (most recent first)

  const hasAnyFilter = !!appliedStartDate || !!appliedEndDate || !!appliedType;

  const clearAllFilters = () => {
    setAppliedStartDate('');
    setAppliedEndDate('');
    setAppliedType('');
    setUiExactDate('');
    setUiStartDate('');
    setUiEndDate('');
    setUiType('');
    setPage(1);
  };

  const removeDateFilter = () => {
    setAppliedStartDate('');
    setAppliedEndDate('');
    setPage(1);
  };

  const removeTypeFilter = () => {
    setAppliedType('');
    setPage(1);
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'deposit': return 'green';
      case 'withdrawal': return 'red';
      case 'purchase': return 'blue';
      case 'referral_earning': return 'purple';
      case 'registration_fee': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const isMobile = useBreakpointValue({ base: true, md: false });

  if (loading) {
    return (
      <Center h="300px">
        <Spinner size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
        <Text color="red.600">Error: {error}</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color={headingColor}>
          My Vendors' Transactions
        </Heading>
        <Text fontSize="sm" color={textColor}>
          Showing transactions from vendors assigned to you
        </Text>
      </Flex>

      {/* Search and Filters */}
      <Box mb={6}>
        <Flex direction={{ base: 'column', md: 'row' }} gap={4} align="center">
          {/* Search */}
          <InputGroup maxW="400px">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search by vendor name, email, phone, transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          {/* Filter Controls */}
          <HStack spacing={2}>
            {/* Date Filter */}
            <Popover>
              <PopoverTrigger>
                <Button leftIcon={<CalendarIcon />} variant="outline" size="sm">
                  Date
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverBody p={4}>
                  <VStack spacing={3} align="stretch">
                    <Text fontSize="sm" fontWeight="bold">Filter by Date</Text>
                    <Input
                      type="date"
                      placeholder="Exact Date"
                      value={uiExactDate}
                      onChange={(e) => setUiExactDate(e.target.value)}
                    />
                    <Text fontSize="xs" color="gray.500" textAlign="center">OR</Text>
                    <Input
                      type="date"
                      placeholder="Start Date"
                      value={uiStartDate}
                      onChange={(e) => setUiStartDate(e.target.value)}
                    />
                    <Input
                      type="date"
                      placeholder="End Date"
                      value={uiEndDate}
                      onChange={(e) => setUiEndDate(e.target.value)}
                    />
                    <Button size="sm" colorScheme="blue" onClick={applyDateFilter}>
                      Apply
                    </Button>
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>

            {/* Type Filter */}
            <Popover>
              <PopoverTrigger>
                <Button variant="outline" size="sm">
                  Type
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverBody p={4}>
                  <VStack spacing={3} align="stretch">
                    <Text fontSize="sm" fontWeight="bold">Filter by Type</Text>
                    <Select
                      placeholder="Select transaction type"
                      value={uiType}
                      onChange={(e) => setUiType(e.target.value)}
                    >
                      <option value="deposit">Deposit</option>
                      <option value="withdrawal">Withdrawal</option>
                      <option value="purchase">Purchase</option>
                      <option value="referral_earning">Referral Earning</option>
                      <option value="registration_fee">Registration Fee</option>
                    </Select>
                    <Button size="sm" colorScheme="blue" onClick={applyTypeFilter}>
                      Apply
                    </Button>
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {hasAnyFilter && (
              <Button size="sm" variant="ghost" onClick={clearAllFilters}>
                Clear All
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Applied Filters */}
        {hasAnyFilter && (
          <HStack spacing={2} mt={3} flexWrap="wrap">
            {(appliedStartDate || appliedEndDate) && (
              <Tag colorScheme="blue" size="sm">
                <TagLabel>
                  Date: {appliedStartDate === appliedEndDate 
                    ? formatDateForChip(appliedStartDate)
                    : `${formatDateForChip(appliedStartDate)} - ${formatDateForChip(appliedEndDate)}`
                  }
                </TagLabel>
                <TagCloseButton onClick={removeDateFilter} />
              </Tag>
            )}
            {appliedType && (
              <Tag colorScheme="green" size="sm">
                <TagLabel>Type: {appliedType}</TagLabel>
                <TagCloseButton onClick={removeTypeFilter} />
              </Tag>
            )}
          </HStack>
        )}
      </Box>

      {/* Results Summary */}
      <Text fontSize="sm" color={textColor} mb={4}>
        Showing {transactions.length} of {totalCount} transactions
      </Text>

      {/* Transactions Table */}
      <Box overflowX="auto" bg={tableBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Date</Th>
              <Th>Vendor</Th>
              <Th>Type</Th>
              <Th isNumeric>Amount</Th>
              <Th>Status</Th>
              <Th>Description</Th>
            </Tr>
          </Thead>
          <Tbody>
            {transactions.map((transaction) => (
              <Tr key={transaction.trans_id}>
                <Td fontFamily="monospace" fontSize="xs">
                  {transaction.trans_id}
                </Td>
                <Td fontSize="sm">
                  {formatTimestampIST(transaction.created_at)}
                </Td>
                <Td>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="medium">
                      {transaction.vendor_name || 'N/A'}
                    </Text>
                    <Text fontSize="xs" color={textColor}>
                      {transaction.email || transaction.phone_number || 'N/A'}
                    </Text>
                  </VStack>
                </Td>
                <Td>
                  <Badge colorScheme={getTransactionTypeColor(transaction.transaction_type)}>
                    {transaction.transaction_type}
                  </Badge>
                </Td>
                <Td isNumeric fontWeight="medium">
                  {formatAmount(transaction.amount)}
                </Td>
                <Td>
                  <Badge colorScheme={getStatusColor(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </Td>
                <Td fontSize="sm" maxW="200px" isTruncated>
                  {transaction.description || '—'}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Flex justify="center" mt={6}>
          <ButtonGroup size="sm" isAttached variant="outline">
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              isDisabled={page === 1}
            >
              Previous
            </Button>
            <Button variant="solid" colorScheme="blue">
              {page} of {totalPages}
            </Button>
            <Button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              isDisabled={page === totalPages}
            >
              Next
            </Button>
          </ButtonGroup>
        </Flex>
      )}

      {transactions.length === 0 && !loading && (
        <Center h="200px">
          <VStack spacing={3}>
            <Text color={textColor}>No transactions found</Text>
            {hasAnyFilter && (
              <Button size="sm" onClick={clearAllFilters}>
                Clear filters to see all transactions
              </Button>
            )}
          </VStack>
        </Center>
      )}
    </Box>
  );
};

// Custom hook for debouncing
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default CoordinatorTransactions;
