import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Heading, Text, VStack, HStack, Spinner, Center, useColorModeValue, Tag, Flex, Button,
  Input, Select, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Grid,
  Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverCloseButton,
  PopoverHeader, PopoverBody, Wrap, WrapItem, TagLabel, TagCloseButton, Divider,
  Tooltip
} from '@chakra-ui/react';

import { useAuth } from '../../AppContext';
import { formatISTDate } from '../../utils/dateUtils';

// Debounce hook to delay API calls while user is typing in search
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

// Function to download all transactions as a CSV file
async function downloadAllTransactionsCSV(token, url) {
  try {
    // Show loading state
    const downloadBtn = document.querySelector('[data-download-btn]');
    if (downloadBtn) {
      downloadBtn.innerHTML = 'Fetching All Transactions...';
      downloadBtn.disabled = true;
    }

    // Fetch all transactions without pagination or filters
    const response = await fetch(`${url}/api/table/transactions?limit=10000&page=1`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch all transactions');
    }
    
    const data = await response.json();
    const allTransactions = Array.isArray(data.data) ? data.data : [];
    
    if (allTransactions.length === 0) {
      alert('No transactions found to download');
      return;
    }

    // Update button to show processing state
    if (downloadBtn) {
      downloadBtn.innerHTML = `Processing ${allTransactions.length} Transactions...`;
    }

    const headers = ['Transaction ID', 'Vendor Name', 'Vendor Email', 'Phone Number', 'Timestamp (IST)', 'Type', 'Status', 'Amount', 'Description', 'UPI Transaction ID'];
    const escape = (s = '') => `"${String(s ?? '').replace(/"/g, '""')}"`;

    const rows = allTransactions.map(t => [
      escape(t.trans_id),
      escape(t.vendor_name || t.user_id),
      escape(t.email),
      escape(t.phone_number),
      escape(formatTimestampIST(t.created_at)),
      escape(t.transaction_type),
      escape(t.status),
      escape(Number(t.amount ?? 0).toFixed(2)),
      escape(t.description),
      escape(t.upi_transaction_id)
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    // Format current date in IST for filename
    const now = new Date();
    const istDate = now.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(/[/:]/g, '-').replace(/,/g, '_');
    
    link.setAttribute('download', `all_transactions_export_${istDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    if (downloadBtn) {
      downloadBtn.innerHTML = `Downloaded ${allTransactions.length} Transactions!`;
      setTimeout(() => {
        downloadBtn.innerHTML = 'Download CSV';
        downloadBtn.disabled = false;
      }, 2000);
    }
    
  } catch (error) {
    console.error('Download failed:', error);
    alert('Failed to download transactions. Please try again.');
    
    // Reset button state on error
    const downloadBtn = document.querySelector('[data-download-btn]');
    if (downloadBtn) {
      downloadBtn.innerHTML = 'Download CSV';
      downloadBtn.disabled = false;
    }
  }
}

// Constants for filters and colors
const TYPES = [
  'deposit', 'sale', 'purchase', 'wild_product_purchase', 'withdrawal',
  'commission_claim', 'registration_fee', 'referral_bonus'
];

const typeColor = (type) => {
  switch (String(type).toLowerCase()) {
    case 'deposit': return 'green';
    case 'sale': return 'purple';
    case 'purchase': return 'blue';
    case 'wild_product_purchase': return 'cyan';
    case 'withdrawal': return 'red';
    case 'commission_claim': return 'orange';
    case 'registration_fee': return 'yellow';
    case 'referral_bonus': return 'teal';
    default: return 'gray';
  }
};

const statusColor = (s) => {
  switch (String(s).toLowerCase()) {
    case 'approved': return 'green';
    case 'pending_approval': return 'yellow';
    case 'rejected': return 'red';
    default: return 'gray';
  }
};

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

const TransactionsPage = ({ url }) => {
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
      const response = await fetch(`${url}/api/table/transactions?${queryParams.toString()}`, {
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

  const handleDownload = () => downloadAllTransactionsCSV(token, url);

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

  const removeType = () => {
    setAppliedType('');
    setUiType('');
    setPage(1);
  };

  const removeDate = () => {
    setAppliedStartDate('');
    setAppliedEndDate('');
    setUiExactDate('');
    setUiStartDate('');
    setUiEndDate('');
    setPage(1);
  };

  return (
    <Box bg={bgColor} minH="100vh" p={{ base: 2, md: 4 }}>
      <Box bg={tableBg} p={{ base: 3, md: 6 }} borderRadius="lg" boxShadow="lg" w={{ base: '100%', lg: '90%' }} mx="auto">
        <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
          <Heading size="lg">Transactions</Heading>
          <Tooltip 
            label="Download all transactions (ignores current filters and pagination)" 
            placement="top"
            hasArrow
          >
            <Button 
              colorScheme="green" 
              onClick={handleDownload} 
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
                      {TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
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
                    <TagCloseButton onClick={removeDate} />
                  </Tag>
                </WrapItem>
              )}
              {appliedType && (
                <WrapItem>
                  <Tag size="md" variant="subtle" colorScheme={typeColor(appliedType)} borderRadius="full">
                    <TagLabel>Type: {appliedType}</TagLabel>
                    <TagCloseButton onClick={removeType} />
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
            <TableContainer display={{ base: 'none', md: 'block' }} overflowX="auto">
              <Table variant="simple" size="md" minW="980px">
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
                  {transactions.map(tx => (
                    <Tr key={tx.trans_id}>
                      <Td fontWeight="bold">
                        <Text>{tx.vendor_name || tx.user_id}</Text>
                        <Text fontSize="sm" color={textColor} fontWeight="normal">{tx.email}</Text>
                        <Text fontSize="sm" color={textColor} fontWeight="normal">{tx.phone_number}</Text>
                      </Td>
                      <Td fontWeight="bold">
                        {formatTimestampIST(tx.created_at)}
                      </Td>
                      <Td fontWeight="bold">
                        <Tag colorScheme={typeColor(tx.transaction_type)}>{tx.transaction_type}</Tag>
                      </Td>
                      <Td isNumeric color={typeColor(tx.transaction_type) + ".400"} fontWeight="bold">
                        ₹{Number(tx.amount || 0).toFixed(2)}
                      </Td>
                      <Td fontWeight="bold" textTransform="capitalize">
                        <Tag size="sm" variant="subtle" colorScheme={statusColor(tx.status)}>
                          {tx.status}
                        </Tag>
                      </Td>
                      <Td>
                        <Text fontSize="sm" noOfLines={2} maxW="200px">
                          {tx.description ? tx.description.split('(')[0].trim() || 'N/A' : 'N/A'}
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>

            {/* Mobile view - Simple Cards */}
            <VStack spacing={4} display={{ base: 'flex', md: 'none' }}>
              {transactions.map(tx => (
                <Box key={tx.trans_id} w="100%" p={4} borderWidth="1px" borderColor={borderColor} borderRadius="lg" boxShadow="sm">
                  <VStack spacing={2} align="stretch">
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="bold" fontSize="md">{tx.vendor_name || tx.user_id}</Text>
                      <Tag colorScheme={typeColor(tx.transaction_type)} size="sm">{tx.transaction_type}</Tag>
                    </Flex>
                    <Text fontSize="sm" color={textColor}>{tx.email}</Text>
                    <Text fontSize="sm" color={textColor}>{tx.phone_number}</Text>
                    <Flex justify="space-between" align="center">
                      <Text fontSize="lg" fontWeight="bold" color={typeColor(tx.transaction_type) + ".400"}>
                        ₹{Number(tx.amount || 0).toFixed(2)}
                      </Text>
                      <Tag size="sm" colorScheme={statusColor(tx.status)}>{tx.status}</Tag>
                    </Flex>
                    <Text fontSize="sm" color={textColor}>
                      {formatTimestampIST(tx.created_at)}
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

export default TransactionsPage;