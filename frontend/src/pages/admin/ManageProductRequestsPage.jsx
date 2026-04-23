import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatISTDate } from '../../utils/dateUtils';
import {
  Box, VStack, Heading, Text, useColorModeValue, Spinner, Center, SimpleGrid,
  Button, useToast, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter, useDisclosure, Divider, Flex, Tag,
  FormControl, FormLabel, Textarea, IconButton, Drawer, DrawerOverlay, DrawerContent,
  HStack, Icon, Tabs, TabList, TabPanels, Tab, TabPanel, Input, Select, Table, 
  Thead, Tbody, Tr, Th, Td, TableContainer, Grid, Popover, PopoverTrigger, 
  PopoverContent, PopoverArrow, PopoverCloseButton, PopoverHeader, PopoverBody, 
  Wrap, WrapItem, TagLabel, TagCloseButton, Tooltip
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { FaWhatsapp } from 'react-icons/fa';
import { useAuth } from '../../AppContext';
import AdminNavBar from '../../components/layout/AdminNavBar';

const ADMIN_SIDEBAR_W = '80px';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

// Status color helper
const statusColor = (s) => {
  switch (String(s).toLowerCase()) {
    case 'approved': return 'green';
    case 'pending': return 'yellow';
    case 'rejected': return 'red';
    case 'cancelled': return 'gray';
    default: return 'gray';
  }
};

// Date formatting helper
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

// Status options for filter
const STATUS_OPTIONS = ['approved', 'pending', 'rejected', 'cancelled'];

// Function to download all product requests as CSV
async function downloadAllProductRequestsCSV(token, url) {
  try {
    const downloadBtn = document.querySelector('[data-download-product-requests-btn]');
    if (downloadBtn) {
      downloadBtn.innerHTML = 'Fetching All Product Requests...';
      downloadBtn.disabled = true;
    }

    const response = await fetch(`${url}/api/admin/product-requests?limit=10000&page=1`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch all product requests');
    }
    
    const data = await response.json();
    const allRequests = Array.isArray(data.data) ? data.data : [];
    
    if (allRequests.length === 0) {
      alert('No product requests found to download');
      return;
    }

    if (downloadBtn) {
      downloadBtn.innerHTML = `Processing ${allRequests.length} Product Requests...`;
    }

    const headers = ['Request ID', 'Vendor Name', 'Vendor Email', 'Phone Number', 'Timestamp (IST)', 'Status', 'Amount', 'Remarks', 'Admin Comment'];
    const escape = (s = '') => `"${String(s ?? '').replace(/"/g, '""')}"`;

    const rows = allRequests.map(r => [
      escape(r.request_id),
      escape(r.vendor_name || r.user_id),
      escape(r.email),
      escape(r.phone_number),
      escape(r.created_at ? formatISTDate(r.created_at, true, true) : ''),
      escape(r.status),
      escape(Number(r.amount ?? 0).toFixed(2)),
      escape(r.remarks),
      escape(r.admin_comment || '')
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    const now = new Date();
    const istDate = now.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(/[/:]/g, '-').replace(/,/g, '_');
    
    link.setAttribute('download', `all_product_requests_export_${istDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (downloadBtn) {
      downloadBtn.innerHTML = `Downloaded ${allRequests.length} Product Requests!`;
      setTimeout(() => {
        downloadBtn.innerHTML = 'Download CSV';
        downloadBtn.disabled = false;
      }, 2000);
    }
    
  } catch (error) {
    console.error('Download failed:', error);
    alert('Failed to download product requests. Please try again.');
    
    const downloadBtn = document.querySelector('[data-download-product-requests-btn]');
    if (downloadBtn) {
      downloadBtn.innerHTML = 'Download CSV';
      downloadBtn.disabled = false;
    }
  }
}

const RejectionModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [comment, setComment] = useState('');
  useEffect(() => { if (isOpen) setComment(''); }, [isOpen]);
  const handleSubmit = () => { if (comment.trim()) onSubmit(comment); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Reject Product Request</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired>
            <FormLabel>Reason for Rejection</FormLabel>
            <Textarea placeholder="Provide a clear reason..." value={comment} onChange={(e) => setComment(e.target.value)} />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button colorScheme="red" onClick={handleSubmit} isLoading={isLoading} isDisabled={!comment.trim()}>Submit Rejection</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const ProductRequestCard = ({ request, onApprove, onReject, onWhatsApp }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const nestedBg = useColorModeValue('gray.50', 'gray.600');
  
  // Determine if this is a coordinator or vendor request
  // If vendor_name exists, it's a vendor request; if coordinator_name exists and no vendor_name, it's a coordinator request
  const isCoordinatorRequest = request.coordinator_name && !request.vendor_name;
  const displayName = isCoordinatorRequest ? request.coordinator_name : request.vendor_name;
  const displayEmail = isCoordinatorRequest ? request.coordinator_email : request.email;
  const displayPhone = isCoordinatorRequest ? request.coordinator_phone : request.vendor_phone;
  const requestType = isCoordinatorRequest ? 'Coordinator Request' : 'Product Request';
  
  return (
    <VStack bg={cardBg} p={5} borderRadius="lg" boxShadow="md" align="stretch" spacing={3}>
      <Flex justify="space-between" align="center">
        <Heading size="md">{displayName}</Heading>
        <Tag colorScheme={isCoordinatorRequest ? "purple" : "blue"}>{requestType}</Tag>
      </Flex>
      <HStack spacing={2} align="center">
        <Text fontSize="sm" color="gray.500">{displayEmail}</Text>
        {(displayPhone || request.vendor_phone || request.coordinator_phone) && (
          <Tooltip label="Contact on WhatsApp" hasArrow>
            <IconButton
              aria-label="Contact on WhatsApp"
              icon={<FaWhatsapp />}
              size="xs"
              colorScheme="whatsapp"
              variant="ghost"
              onClick={() => onWhatsApp(request)}
            />
          </Tooltip>
        )}
      </HStack>
      {!isCoordinatorRequest && (
        <Text><strong>Current Balance:</strong> ₹{parseFloat(request.current_balance || 0).toLocaleString('en-IN')}</Text>
      )}
      <Text><strong>Request Date:</strong> {formatISTDate(request.created_at, true, true)}</Text>
      <Divider />
      <Box>
        <Text fontWeight="bold">Request Details:</Text>
        <Text pl={4}><strong>Amount:</strong> ₹{parseFloat(request.amount).toLocaleString('en-IN')}</Text>
        <Text pl={4} fontSize="sm" fontStyle="italic"><strong>Remarks:</strong> {request.remarks}</Text>
      </Box>
      <SimpleGrid columns={2} spacing={2} pt={2}>
        <Button colorScheme="red" onClick={() => onReject(request)}>Reject</Button>
        <Button colorScheme="green" onClick={() => onApprove(request.request_id)}>Approve</Button>
      </SimpleGrid>
    </VStack>
  );
};

const ManageProductRequestsPage = ({ url }) => {
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const tableBg = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Stat box colors
  const pendingBg = useColorModeValue('yellow.50', 'yellow.900');
  const pendingBorder = useColorModeValue('yellow.300', 'yellow.600');
  const pendingTitle = useColorModeValue('yellow.700', 'yellow.200');
  const pendingAmount = useColorModeValue('yellow.800', 'yellow.100');
  const pendingCount = useColorModeValue('yellow.600', 'yellow.300');
  
  const approvedBg = useColorModeValue('green.50', 'green.900');
  const approvedBorder = useColorModeValue('green.300', 'green.600');
  const approvedTitle = useColorModeValue('green.700', 'green.200');
  const approvedAmount = useColorModeValue('green.800', 'green.100');
  const approvedCount = useColorModeValue('green.600', 'green.300');
  
  const toast = useToast();
  const { token } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isRejectionModalOpen, onOpen: onRejectionModalOpen, onClose: onRejectionModalClose } = useDisclosure();

  // Pending requests state
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Request history state
  const [requestHistory, setRequestHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortOrder, setSortOrder] = useState('desc');

  // Request statistics state
  const [requestStats, setRequestStats] = useState({
    totalApproved: 0,
    totalPending: 0,
    countApproved: 0,
    countPending: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Search and filters for request history
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');

  // UI filters
  const [uiExactDate, setUiExactDate] = useState('');
  const [uiStartDate, setUiStartDate] = useState('');
  const [uiEndDate, setUiEndDate] = useState('');
  const [uiStatus, setUiStatus] = useState('');

  const fetchPendingRequests = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${url}/api/admin/pending-product-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch pending requests.');
      setRequests(await response.json());
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 4000 });
    } finally {
      setIsLoading(false);
    }
  }, [token, url]);

  // Build query params for request history
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
    if (appliedStatus) params.append('status', appliedStatus);
    
    return params;
  }, [page, limit, sortOrder, debouncedSearchTerm, appliedStartDate, appliedEndDate, appliedStatus]);

  const fetchRequestStats = useCallback(async () => {
    if (!token) return;
    setStatsLoading(true);
    try {
      const response = await fetch(`${url}/api/admin/product-request-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Failed to fetch request stats');
      setRequestStats(data);
    } catch (err) {
      console.error('Error fetching request stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [token, url]);

  const fetchRequestHistory = useCallback(async () => {
    if (!token) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await fetch(`${url}/api/admin/product-requests?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Failed to fetch request data');
      setRequestHistory(Array.isArray(data.data) ? data.data : []);
      setTotalPages(Number(data.totalPages ?? 1));
      setTotalCount(Number(data.totalCount ?? 0));
    } catch (err) {
      setHistoryError(err.message);
      setRequestHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [token, url, queryParams]);

  useEffect(() => { 
    fetchPendingRequests(); 
    fetchRequestStats();
  }, [fetchPendingRequests, fetchRequestStats]);

  useEffect(() => {
    fetchRequestHistory();
  }, [fetchRequestHistory]);

  const handleReview = async (requestId, decision, comment = null) => {
    setIsSubmitting(true);
    try {
      const endpoint = `${url}/api/admin/review-product-request`;
      const requestBody = { requestId, decision, comment };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast({ title: 'Success', description: `Product request ${decision}!`, status: 'success', duration: 3000 });

      setRequests(current => current.filter(r => r.request_id !== requestId));
      fetchRequestStats(); // Refresh stats after approval/rejection
      onRejectionModalClose();
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 4000 });
    } finally { setIsSubmitting(false); }
  };

  const handleOpenRejectModal = (request) => { setSelectedRequest(request); onRejectionModalOpen(); };

  const handleDownloadRequests = () => downloadAllProductRequestsCSV(token, url);

  // WhatsApp contact handler
  const handleWhatsAppClick = (request) => {
    // Determine if this is a coordinator or vendor request
    const isCoordinatorRequest = request.coordinator_name && !request.vendor_name;
    const phoneNumber = isCoordinatorRequest 
      ? request.coordinator_phone?.replace(/\D/g, '') || ''
      : request.vendor_phone?.replace(/\D/g, '') || '';
      
    if (!phoneNumber) {
      toast({
        title: 'No Phone Number',
        description: `Phone number not available for this ${isCoordinatorRequest ? 'coordinator' : 'vendor'}.`,
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    const fullPhoneNumber = `91${phoneNumber}`;
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=${fullPhoneNumber}&type=phone_number&app_absent=0&text=Hello`;
    
    window.open(whatsappUrl, '_blank');
  };

  // Filter handlers
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

  const applyStatusFilter = () => {
    setAppliedStatus(uiStatus);
    setPage(1);
  };

  const hasAnyFilter = !!appliedStartDate || !!appliedEndDate || !!appliedStatus;

  const clearAllFilters = () => {
    setAppliedStartDate('');
    setAppliedEndDate('');
    setAppliedStatus('');
    setUiExactDate('');
    setUiStartDate('');
    setUiEndDate('');
    setUiStatus('');
    setPage(1);
  };

  const removeStatus = () => {
    setAppliedStatus('');
    setUiStatus('');
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

      <Box flex="1" ml={{ base: 0, md: ADMIN_SIDEBAR_W }} p={{ base: 4, sm: 6, md: 8 }}>
        {/* Mobile header */}
        <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
          <IconButton aria-label="Open menu" icon={<HamburgerIcon w={5} h={5} />} onClick={onOpen} size="sm" variant="ghost" />
          <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">Manage Product Requests</Heading>
        </Flex>

        <VStack spacing={8} align="stretch">
          <Flex 
            justify="space-between" 
            align={{ base: 'flex-start', md: 'center' }} 
            direction={{ base: 'column', md: 'row' }}
            gap={4}
          >
            <Box>
              <Heading as="h1" size="xl" color={headingColor} display={{ base: 'none', md: 'block' }}>
                Manage Product Requests
              </Heading>
              <Text color="gray.500" display={{ base: 'none', md: 'block' }}>
                Review, approve, or reject vendor product requests.
              </Text>
            </Box>

            {/* Request Statistics */}
            <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
              <Box 
                bg={pendingBg} 
                p={4} 
                borderRadius="lg" 
                borderWidth="2px" 
                borderColor={pendingBorder}
                minW="180px"
              >
                <Text fontSize="xs" fontWeight="semibold" color={pendingTitle} mb={1}>
                  Pending Approvals
                </Text>
                {statsLoading ? (
                  <Spinner size="sm" color="yellow.500" />
                ) : (
                <Text fontSize="2xl" fontWeight="bold" color={pendingAmount}>
                  {requestStats.countPending}
                </Text>
                )}
                <Text fontSize="xs" color={pendingCount}>
                  {requestStats.countPending} request{requestStats.countPending !== 1 ? 's' : ''}
                </Text>
              </Box>

              <Box 
                bg={approvedBg} 
                p={4} 
                borderRadius="lg" 
                borderWidth="2px" 
                borderColor={approvedBorder}
                minW="180px"
              >
                <Text fontSize="xs" fontWeight="semibold" color={approvedTitle} mb={1}>
                  Total Approved
                </Text>
                {statsLoading ? (
                  <Spinner size="sm" color="green.500" />
                ) : (
                <Text fontSize="2xl" fontWeight="bold" color={approvedAmount}>
                  {requestStats.countApproved}
                </Text>
                )}
                <Text fontSize="xs" color={approvedCount}>
                  {requestStats.countApproved} request{requestStats.countApproved !== 1 ? 's' : ''}
                </Text>
              </Box>
            </HStack>
          </Flex>

          {/* Mobile Statistics - Below Header */}
          <SimpleGrid columns={2} spacing={4} display={{ base: 'grid', md: 'none' }}>
            <Box 
              bg={pendingBg} 
              p={3} 
              borderRadius="lg" 
              borderWidth="2px" 
              borderColor={pendingBorder}
            >
              <Text fontSize="xs" fontWeight="semibold" color={pendingTitle} mb={1}>
                Pending
              </Text>
              {statsLoading ? (
                <Spinner size="sm" color="yellow.500" />
              ) : (
                <Text fontSize="lg" fontWeight="bold" color={pendingAmount}>
                  {requestStats.countPending}
                </Text>
              )}
              <Text fontSize="xs" color={pendingCount}>
                {requestStats.countPending} req{requestStats.countPending !== 1 ? 's' : ''}
              </Text>
            </Box>

            <Box 
              bg={approvedBg} 
              p={3} 
              borderRadius="lg" 
              borderWidth="2px" 
              borderColor={approvedBorder}
            >
              <Text fontSize="xs" fontWeight="semibold" color={approvedTitle} mb={1}>
                Approved
              </Text>
              {statsLoading ? (
                <Spinner size="sm" color="green.500" />
              ) : (
                <Text fontSize="lg" fontWeight="bold" color={approvedAmount}>
                  {requestStats.countApproved}
                </Text>
              )}
              <Text fontSize="xs" color={approvedCount}>
                {requestStats.countApproved} req{requestStats.countApproved !== 1 ? 's' : ''}
              </Text>
            </Box>
          </SimpleGrid>

          <Tabs colorScheme="blue" variant="enclosed">
            <TabList>
              <Tab>Pending Approvals</Tab>
              <Tab onClick={fetchRequestHistory}>Request History</Tab>
            </TabList>

            <TabPanels>
              {/* Pending Approvals Tab */}
              <TabPanel>
                {isLoading ? (
                  <Center h="200px"><Spinner size="xl" /></Center>
                ) : requests.length > 0 ? (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {requests.map(request => (
                      <ProductRequestCard
                        key={request.request_id}
                        request={request}
                        onApprove={() => handleReview(request.request_id, 'approved')}
                        onReject={handleOpenRejectModal}
                        onWhatsApp={handleWhatsAppClick}
                      />
                    ))}
                  </SimpleGrid>
                ) : (
                  <Center h="200px" bg={cardBg} borderRadius="lg" boxShadow="sm">
                    <Text fontSize="lg">No pending product requests.</Text>
                  </Center>
                )}
              </TabPanel>

              {/* Request History Tab */}
              <TabPanel>
                <Box bg={tableBg} p={{ base: 3, md: 6 }} borderRadius="lg" boxShadow="lg">
                  <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
                    <Heading size="md">All Product Requests</Heading>
                    <Tooltip 
                      label="Download all product requests (ignores current filters and pagination)" 
                      placement="top"
                      hasArrow
                    >
                      <Button 
                        colorScheme="green" 
                        onClick={handleDownloadRequests} 
                        data-download-product-requests-btn
                        isDisabled={historyLoading}
                        size="sm"
                      >
                        Download CSV
                      </Button>
                    </Tooltip>
                  </Flex>

                  <Grid templateColumns={'1fr'} gap={4} mb={4}>
                    <Input
                      placeholder="Search by Name, Email, Phone, Request ID..."
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
                            {appliedStatus ? `Status: ${appliedStatus}` : 'Filter Status'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <PopoverArrow /><PopoverCloseButton />
                          <PopoverHeader>Filter by Status</PopoverHeader>
                          <PopoverBody>
                            <VStack align="stretch" spacing={3}>
                              <Select 
                                placeholder="Select status" 
                                value={uiStatus} 
                                onChange={(e) => setUiStatus(e.target.value)}
                              >
                                {STATUS_OPTIONS.map(status => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </Select>
                              <Button size="sm" colorScheme="blue" onClick={applyStatusFilter}>
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
                        {appliedStatus && (
                          <WrapItem>
                            <Tag size="md" variant="subtle" colorScheme={statusColor(appliedStatus)} borderRadius="full">
                              <TagLabel>Status: {appliedStatus}</TagLabel>
                              <TagCloseButton onClick={removeStatus} />
                            </Tag>
                          </WrapItem>
                        )}
                      </Wrap>
                    </Box>
                  )}

                  {historyLoading && <Center p={10}><Spinner size="xl" /></Center>}
                  {historyError && <Center p={10}><Text color="red.500">{historyError}</Text></Center>}

                  {!historyLoading && !historyError && (
                    <>
                      <TableContainer display={{ base: 'none', md: 'block' }} overflowX="auto">
                        <Table variant="simple" size="md" minW="980px">
                          <Thead>
                            <Tr>
                              <Th>User</Th>
                              <Th>Date</Th>
                              <Th isNumeric>Amount</Th>
                              <Th>Status</Th>
                              <Th>Remarks</Th>
                              <Th>Contact</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {requestHistory.map(request => {
                              // Determine if this is a coordinator or vendor request
                              // If vendor_name exists, it's a vendor request; if coordinator_name exists and no vendor_name, it's a coordinator request
                              const isCoordinatorRequest = request.coordinator_name && !request.vendor_name;
                              const isVendorRequest = request.vendor_name;
                              const displayName = isCoordinatorRequest ? request.coordinator_name : request.vendor_name;
                              const displayEmail = isCoordinatorRequest ? request.coordinator_email : request.email;
                              const displayPhone = isCoordinatorRequest ? request.coordinator_phone : request.vendor_phone;
                              
                              return (
                                <Tr key={request.request_id}>
                                  <Td fontWeight="bold">
                                    <Text>{displayName || request.user_id}</Text>
                                    <Text fontSize="sm" color={textColor} fontWeight="normal">{displayEmail}</Text>
                                    <Text fontSize="sm" color={textColor} fontWeight="normal">{displayPhone}</Text>
                                    {isCoordinatorRequest && (
                                      <Tag size="sm" colorScheme="purple" mt={1}>Coordinator</Tag>
                                    )}
                                  </Td>
                                  <Td fontWeight="bold">
                                    {request.created_at ? formatISTDate(request.created_at, true, true) : request.created_at}
                                  </Td>
                                  <Td isNumeric color="blue.400" fontWeight="bold">
                                    ₹{Number(request.amount || 0).toFixed(2)}
                                  </Td>
                                  <Td fontWeight="bold" textTransform="capitalize">
                                    <Tag size="sm" variant="subtle" colorScheme={statusColor(request.status)}>
                                      {request.status}
                                    </Tag>
                                  </Td>
                                  <Td>
                                    <Text fontSize="sm" noOfLines={2} maxW="200px">
                                      {request.remarks || 'N/A'}
                                    </Text>
                                    {request.admin_comment && (
                                      <Text fontSize="xs" color="gray.500" mt={1}>
                                        Note: {request.admin_comment}
                                      </Text>
                                    )}
                                  </Td>
                                  <Td>
                                    {(displayPhone || request.vendor_phone || request.coordinator_phone) && (
                                      <Tooltip label="Contact on WhatsApp" hasArrow>
                                        <IconButton
                                          aria-label="Contact on WhatsApp"
                                          icon={<FaWhatsapp />}
                                          size="sm"
                                          colorScheme="whatsapp"
                                          variant="ghost"
                                          onClick={() => handleWhatsAppClick(request)}
                                        />
                                      </Tooltip>
                                    )}
                                  </Td>
                                </Tr>
                              );
                            })}
                          </Tbody>
                        </Table>
                      </TableContainer>

                      {/* Mobile view - Simple Cards */}
                      <VStack spacing={4} display={{ base: 'flex', md: 'none' }}>
                        {requestHistory.map(request => {
                          // Determine if this is a coordinator or vendor request
                          // If vendor_name exists, it's a vendor request; if coordinator_name exists and no vendor_name, it's a coordinator request
                          const isCoordinatorRequest = request.coordinator_name && !request.vendor_name;
                          const displayName = isCoordinatorRequest ? request.coordinator_name : request.vendor_name;
                          const displayEmail = isCoordinatorRequest ? request.coordinator_email : request.email;
                          const displayPhone = isCoordinatorRequest ? request.coordinator_phone : request.vendor_phone;
                          
                          return (
                            <Box key={request.request_id} w="100%" p={4} borderWidth="1px" borderColor={borderColor} borderRadius="lg" boxShadow="sm">
                              <VStack spacing={2} align="stretch">
                                <Flex justify="space-between" align="center">
                                  <Text fontWeight="bold" fontSize="md">{displayName || request.user_id}</Text>
                                  <Tag colorScheme={statusColor(request.status)} size="sm">{request.status}</Tag>
                                </Flex>
                                {isCoordinatorRequest && (
                                  <Tag size="sm" colorScheme="purple" alignSelf="flex-start">Coordinator</Tag>
                                )}
                                <Text fontSize="sm" color={textColor}>{displayEmail}</Text>
                                <HStack spacing={2} align="center">
                                  <Text fontSize="sm" color={textColor}>{displayPhone}</Text>
                                  {(displayPhone || request.vendor_phone || request.coordinator_phone) && (
                                    <Tooltip label="Contact on WhatsApp" hasArrow>
                                      <IconButton
                                        aria-label="Contact on WhatsApp"
                                        icon={<FaWhatsapp />}
                                        size="xs"
                                        colorScheme="whatsapp"
                                        variant="ghost"
                                        onClick={() => handleWhatsAppClick(request)}
                                      />
                                    </Tooltip>
                                  )}
                                </HStack>
                                <Flex justify="space-between" align="center">
                                  <Text fontSize="lg" fontWeight="bold" color="blue.400">
                                    ₹{Number(request.amount || 0).toFixed(2)}
                                  </Text>
                                </Flex>
                                <Text fontSize="sm" color={textColor}>
                                  {request.created_at ? formatISTDate(request.created_at, true, true) : request.created_at}
                                </Text>
                                <Text fontSize="sm" color={textColor} noOfLines={2}>
                                  {request.remarks}
                                </Text>
                                {request.admin_comment && (
                                  <Text fontSize="xs" color="gray.500">
                                    Note: {request.admin_comment}
                                  </Text>
                                )}
                              </VStack>
                            </Box>
                          );
                        })}
                      </VStack>

                      {requestHistory.length === 0 && !historyLoading ? (
                        <Center p={10}><Text>No product requests found for the selected filters.</Text></Center>
                      ) : (
                        <Flex justify="space-between" align="center" mt={6} flexWrap="wrap" gap={4}>
                          <HStack>
                            <Button onClick={() => setPage(p => p - 1)} isDisabled={page === 1 || historyLoading}>
                              Previous
                            </Button>
                            <Button onClick={() => setPage(p => p + 1)} isDisabled={page >= totalPages || historyLoading}>
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
                              isDisabled={historyLoading}
                            >
                              {[5, 10, 15, 25, 50].map(val => <option key={val} value={val}>{val}</option>)}
                            </Select>
                          </HStack>
                        </Flex>
                      )}
                    </>
                  )}
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Box>

      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={onRejectionModalClose}
        onSubmit={(comment) => handleReview(selectedRequest.request_id, 'rejected', comment)}
        isLoading={isSubmitting}
      />

    </Flex>
  );
};

export default ManageProductRequestsPage;
