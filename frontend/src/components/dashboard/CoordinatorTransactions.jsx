import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Flex, Heading, Button, IconButton, useToast, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Text, useColorModeValue, Input, Select, HStack, VStack, Badge, InputGroup, InputLeftElement,
  Popover, PopoverTrigger, PopoverContent, PopoverBody, PopoverArrow, PopoverCloseButton,
  Tag, TagLabel, TagCloseButton, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton, ModalFooter, ButtonGroup, Tooltip, useBreakpointValue,
  Grid, Wrap, WrapItem, Divider, PopoverHeader
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
    switch (String(type).toLowerCase()) {
      case 'deposit': return 'green';
      case 'sale': return 'purple';
      case 'purchase': return 'blue';
      case 'withdrawal': return 'red';
      case 'commission_claim': return 'orange';
      case 'registration_fee': return 'yellow';
      case 'referral_bonus': return 'teal';
      default: return 'gray';
    }
  };

  const getStatusColor = (status) => {
    switch (String(status).toLowerCase()) {
      case 'approved': return 'green';
      case 'pending_approval': return 'yellow';
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
    <Box bg={bgColor} minH="100vh" p={{ base: 2, md: 4 }}>
      <Box bg={tableBg} p={{ base: 3, md: 6 }} borderRadius="lg" boxShadow="lg" w={{ base: '100%', lg: '90%' }} mx="auto">
        <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
          <Heading size="lg">My Vendors' Transactions</Heading>
          <Tooltip 
            label="Download all transactions (ignores current filters and pagination)" 
            placement="top"
            hasArrow
          >
            <Button 
              colorScheme="green" 
              onClick={() => {}} 
              data-download-btn
              isDisabled={loading}
            >
              Download CSV
            </Button>
          </Tooltip>
        </Flex>

        <Grid templateColumns={'1fr'} gap={4} mb={4}>
          <Input
            placeholder="Search by Name, Email, Phone, Transaction ID..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </Grid>

        {/* Filters - Desktop Only */}
        <Box display={{ base: 'none', md: 'block' }}>
          <HStack spacing={4} mb={4}>
            <Popover placement="bottom-start">
              <PopoverTrigger>
                <Button variant="outline" size="sm">
                  {(appliedStartDate || appliedEndDate) ? 
                    `Date: ${appliedStartDate === appliedEndDate ? 
                      formatDateForChip(appliedStartDate) : 
                      `${formatDateForChip(appliedStartDate)} → ${formatDateForChip(appliedEndDate)}`}` 
                    : 'Filter Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverArrow /> <PopoverCloseButton />
                <PopoverHeader>Filter by Date</PopoverHeader>
                <PopoverBody>
                  <VStack spacing={3} align="stretch">
                    <Text fontSize="sm" color={textColor}>Specific Date</Text>
                    <Input 
                      type="date" 
                      value={uiExactDate} 
                      onChange={(e) => { 
                        setUiExactDate(e.target.value); 
                        if (e.target.value) { 
                          setUiStartDate(''); 
                          setUiEndDate(''); 
                        } 
                      }} 
                    />
                    <Divider />
                    <Text fontSize="sm" color={textColor}>Date Range</Text>
                    <HStack>
                      <Input 
                        type="date" 
                        value={uiStartDate} 
                        onChange={(e) => { 
                          setUiStartDate(e.target.value); 
                          if (e.target.value) setUiExactDate(''); 
                        }} 
                        placeholder="From" 
                      />
                      <Input 
                        type="date" 
                        value={uiEndDate} 
                        onChange={(e) => { 
                          setUiEndDate(e.target.value); 
                          if (e.target.value) setUiExactDate(''); 
                        }} 
                        placeholder="To" 
                      />
                    </HStack>
                    <Button size="sm" colorScheme="blue" onClick={applyDateFilter}>
                      Apply
                    </Button>
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>

            <Popover placement="bottom-start">
              <PopoverTrigger>
                <Button variant="outline" size="sm">
                  {appliedType ? `Type: ${appliedType}` : 'Filter Type'}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverArrow /><PopoverCloseButton />
                <PopoverHeader>Filter by Type</PopoverHeader>
                <PopoverBody>
                  <VStack align="stretch" spacing={3}>
                    <Select 
                      placeholder="Select transaction type" 
                      value={uiType} 
                      onChange={(e) => setUiType(e.target.value)}
                    >
                      <option value="deposit">deposit</option>
                      <option value="sale">sale</option>
                      <option value="purchase">purchase</option>
                      <option value="withdrawal">withdrawal</option>
                      <option value="commission_claim">commission_claim</option>
                      <option value="registration_fee">registration_fee</option>
                      <option value="referral_bonus">referral_bonus</option>
                    </Select>
                    <Button size="sm" colorScheme="blue" onClick={applyTypeFilter}>
                      Apply
                    </Button>
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>

            {hasAnyFilter && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear Filters
              </Button>
            )}
          </HStack>
        </Box>

        {/* Active Filters Display - Desktop Only */}
        {hasAnyFilter && (
          <Box display={{ base: 'none', md: 'block' }} mb={5}>
            <Wrap spacing={2}>
              {(appliedStartDate || appliedEndDate) && (
                <WrapItem>
                  <Tag size="md" variant="subtle" colorScheme="cyan" borderRadius="full">
                    <TagLabel>
                      Date:&nbsp;
                      {appliedStartDate === appliedEndDate
                        ? formatDateForChip(appliedStartDate)
                        : `${formatDateForChip(appliedStartDate)} → ${formatDateForChip(appliedEndDate)}`}
                    </TagLabel>
                    <TagCloseButton onClick={removeDateFilter} />
                  </Tag>
                </WrapItem>
              )}
              {appliedType && (
                <WrapItem>
                  <Tag size="md" variant="subtle" colorScheme={getTransactionTypeColor(appliedType)} borderRadius="full">
                    <TagLabel>Type: {appliedType}</TagLabel>
                    <TagCloseButton onClick={removeTypeFilter} />
                  </Tag>
                </WrapItem>
              )}
            </Wrap>
          </Box>
        )}

        {loading && <Center p={10}><Spinner size="xl" /></Center>}
        {error && <Center p={10}><Text color="red.500">{error}</Text></Center>}

      {!loading && !error && (
        <>
          {/* Transactions Table */}
          <TableContainer display={{ base: 'none', md: 'block' }}>
            <Table variant="simple" size="md" w="100%" sx={{ 
              'table-layout': 'fixed',
              'th:nth-of-type(1), td:nth-of-type(1)': { width: '20%' }, // Vendor
              'th:nth-of-type(2), td:nth-of-type(2)': { width: '15%' }, // Date
              'th:nth-of-type(3), td:nth-of-type(3)': { width: '15%' }, // Type
              'th:nth-of-type(4), td:nth-of-type(4)': { width: '15%' }, // Amount
              'th:nth-of-type(5), td:nth-of-type(5)': { width: '15%' }, // Status
              'th:nth-of-type(6), td:nth-of-type(6)': { width: '20%' }  // Description
            }}>
              <Thead>
                <Tr>
                  <Th>
                    <Text>Vendor</Text>
                  </Th>
                  <Th>
                    <HStack justify="space-between">
                      <Text>Date</Text>
                    </HStack>
                  </Th>
                  <Th>Type</Th>
                  <Th isNumeric>Amount</Th>
                  <Th>Status</Th>
                  <Th>Description</Th>
                </Tr>
              </Thead>
              <Tbody>
                {transactions.map((transaction) => (
                  <Tr key={transaction.trans_id}>
                    <Td fontWeight="bold">
                      <Text>{transaction.vendor_name || 'N/A'}</Text>
                      <Text fontSize="sm" color={textColor} fontWeight="normal">{transaction.email || 'N/A'}</Text>
                      <Text fontSize="sm" color={textColor} fontWeight="normal">{transaction.phone_number || 'N/A'}</Text>
                    </Td>
                    <Td fontWeight="bold">
                      {formatTimestampIST(transaction.created_at)}
                    </Td>
                    <Td fontWeight="bold">
                      <Tag colorScheme={getTransactionTypeColor(transaction.transaction_type)}>{transaction.transaction_type}</Tag>
                    </Td>
                    <Td isNumeric color={getTransactionTypeColor(transaction.transaction_type) + ".400"} fontWeight="bold">
                      ₹{Number(transaction.amount || 0).toFixed(2)}
                    </Td>
                    <Td fontWeight="bold" textTransform="capitalize">
                      <Tag size="sm" variant="subtle" colorScheme={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Tag>
                    </Td>
                    <Td>
                      <Text fontSize="sm" noOfLines={2} maxW="200px">
                        {transaction.description ? transaction.description.split('(')[0].trim() || 'N/A' : 'N/A'}
                      </Text>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>

          {/* Mobile view - Simple Cards */}
          <VStack spacing={4} display={{ base: 'flex', md: 'none' }}>
            {transactions.map(transaction => (
              <Box key={transaction.trans_id} w="100%" p={4} borderWidth="1px" borderColor={borderColor} borderRadius="lg" boxShadow="sm">
                <VStack spacing={2} align="stretch">
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" fontSize="md">{transaction.vendor_name || 'N/A'}</Text>
                    <Tag colorScheme={getTransactionTypeColor(transaction.transaction_type)} size="sm">{transaction.transaction_type}</Tag>
                  </Flex>
                  <Text fontSize="sm" color={textColor}>{transaction.email || 'N/A'}</Text>
                  <Text fontSize="sm" color={textColor}>{transaction.phone_number || 'N/A'}</Text>
                  <Flex justify="space-between" align="center">
                    <Text fontSize="lg" fontWeight="bold" color={getTransactionTypeColor(transaction.transaction_type) + ".400"}>
                      ₹{Number(transaction.amount || 0).toFixed(2)}
                    </Text>
                    <Tag size="sm" colorScheme={getStatusColor(transaction.status)}>{transaction.status}</Tag>
                  </Flex>
                  <Text fontSize="sm" color={textColor}>
                    {formatTimestampIST(transaction.created_at)}
                  </Text>
                </VStack>
              </Box>
            ))}
          </VStack>

          {transactions.length === 0 && !loading ? (
            <Center p={10}><Text>No transactions found for the selected filters.</Text></Center>
          ) : (
            <Flex justify="space-between" align="center" mt={6} flexWrap="wrap" gap={4}>
              <HStack>
                <Button onClick={() => setPage(p => p - 1)} isDisabled={page === 1 || loading}>
                  Previous
                </Button>
                <Button onClick={() => setPage(p => p + 1)} isDisabled={page >= totalPages || loading}>
                  Next
                </Button>
              </HStack>
              <Text whiteSpace="nowrap">
                Page {page} of {totalPages} ({totalCount} total)
              </Text>
              <HStack>
                <Text whiteSpace="nowrap">Rows:</Text>
                <Select 
                  w="fit-content" 
                  value={limit} 
                  onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} 
                  isDisabled={loading}
                >
                  {[5, 10, 15, 25, 50].map(val => <option key={val} value={val}>{val}</option>)}
                </Select>
              </HStack>
            </Flex>
          )}
        </>
      )}
      </Box>
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
