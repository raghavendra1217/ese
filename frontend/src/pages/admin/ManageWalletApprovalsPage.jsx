// import React, { useState, useEffect, useCallback } from 'react';
// import {
//     Box, VStack, Heading, Text, useColorModeValue, Spinner, Center, SimpleGrid,
//     Button, useToast, Image, Modal, ModalOverlay, ModalContent, ModalHeader,
//     ModalCloseButton, ModalBody, ModalFooter, useDisclosure, Divider, Flex,
//     Textarea, FormControl, FormLabel, Tag
// } from '@chakra-ui/react';
// import { useAuth } from '../../AppContext';
// import AdminNavBar from '../../components/layout/AdminNavBar';


// // RejectionModal component (This is correct, no changes needed)
// const RejectionModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
//     const [comment, setComment] = useState('');
//     useEffect(() => { if (isOpen) setComment(''); }, [isOpen]);
//     const handleSubmit = () => { if (comment.trim()) onSubmit(comment); };
//     return (
//         <Modal isOpen={isOpen} onClose={onClose} isCentered>
//             <ModalOverlay />
//             <ModalContent>
//                 <ModalHeader>Reject Transaction</ModalHeader>
//                 <ModalCloseButton />
//                 <ModalBody>
//                     <FormControl isRequired>
//                         <FormLabel>Reason for Rejection</FormLabel>
//                         <Textarea placeholder="Provide a clear reason..." value={comment} onChange={(e) => setComment(e.target.value)} />
//                     </FormControl>
//                 </ModalBody>
//                 <ModalFooter>
//                     <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
//                     <Button colorScheme="red" onClick={handleSubmit} isLoading={isLoading} isDisabled={!comment.trim()}>Submit Rejection</Button>
//                 </ModalFooter>
//             </ModalContent>
//         </Modal>
//     );
// };




// // WalletApprovalCard component (This is correct, no changes needed)
// const WalletApprovalCard = ({ transaction, onApprove, onReject }) => {
//     const cardBg = useColorModeValue('white', 'gray.700');
//     const nestedBg = useColorModeValue('gray.50', 'gray.600');
//     const { isOpen, onOpen, onClose } = useDisclosure();
//     const isWithdrawal = transaction.transaction_type === 'withdrawal';
//     return (
//         <>
//             <VStack bg={cardBg} p={5} borderRadius="lg" boxShadow="md" align="stretch" spacing={3}>
//                 <Flex justify="space-between" align="center">
//                     <Heading size="md">{transaction.vendor_name}</Heading>
//                     <Tag colorScheme={isWithdrawal ? 'orange' : 'green'}>{transaction.transaction_type}</Tag>
//                 </Flex>
//                 <Text fontSize="sm" color="gray.500">{transaction.email}</Text>
//                 <Text><strong>Current Balance:</strong> ₹{typeof transaction.current_balance === 'number' ? parseFloat(transaction.current_balance).toLocaleString('en-IN') : 'N/A'}</Text>
//                 <Text><strong>Request Date:</strong> {formatToIST(transaction.created_at, true, true)}</Text>
//                 <Divider />
//                 {isWithdrawal && (
//                     <Box bg={nestedBg} p={3} borderRadius="md">
//                         <Text fontWeight="bold">Bank Details:</Text>
//                         <Text pl={4}><strong>Bank:</strong> {transaction.bank_name || 'N/A'}</Text>
//                         <Text pl={4}><strong>Account #:</strong> {transaction.account_number || 'N/A'}</Text>
//                         <Text pl={4}><strong>IFSC:</strong> {transaction.ifsc_code || 'N/A'}</Text>
//                     </Box>
//                 )}
//                 <Box>
//                     <Text fontWeight="bold">Transaction Details:</Text>
//                     <Text pl={4}><strong>Amount:</strong> ₹{parseFloat(transaction.amount).toLocaleString('en-IN')}</Text>
//                     {!isWithdrawal && <Text pl={4}><strong>User's Txn ID:</strong> {transaction.upi_transaction_id}</Text>}
//                     <Text pl={4} fontSize="sm" fontStyle="italic"><strong>Description:</strong> {transaction.description}</Text>
//                 </Box>
//                 {!isWithdrawal && (
//                     <Button size="sm" mt={2} onClick={onOpen} isDisabled={!transaction.payment_proof_url}>View Payment Proof</Button>
//                 )}
//                 <SimpleGrid columns={2} spacing={2} pt={2}>
//                     <Button colorScheme="red" onClick={() => onReject(transaction)}>Reject</Button>
//                     <Button colorScheme="teal" onClick={() => onApprove(transaction.trans_id)}>
//                         {isWithdrawal ? 'Send' : 'Deposit'}
//                     </Button>
//                 </SimpleGrid>
//             </VStack>
//             <Modal isOpen={isOpen} onClose={onClose} size="xl">
//                 <ModalOverlay />
//                 <ModalContent>
//                     <ModalHeader>Payment Proof</ModalHeader>
//                     <ModalCloseButton />
//                     <ModalBody><Center><Image src={transaction.payment_proof_url} alt="Payment Screenshot" maxH="80vh" /></Center></ModalBody>
//                 </ModalContent>
//             </Modal>
//         </>
//     );
// };


// // --- MAIN PAGE COMPONENT (CORRECTED) ---
// const ManageWalletApprovalsPage = ({ url }) => {
//     const mainBg = useColorModeValue('gray.50', 'gray.800');
//     const emptyStateBg = useColorModeValue('white', 'gray.700');
//     const toast = useToast();
//     const { token } = useAuth();
//     const { isOpen: isRejectionModalOpen, onOpen: onRejectionModalOpen, onClose: onRejectionModalClose } = useDisclosure();
    
//     const [transactions, setTransactions] = useState([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [selectedTransaction, setSelectedTransaction] = useState(null);

//     // --- FIX IS HERE: 'toast' is removed from the dependency array ---
//     const fetchPendingTransactions = useCallback(async () => {
//         if (!token) return;
//         setIsLoading(true);
//         try {
//             const response = await fetch(`${url}/api/admin/pending-wallet-transactions`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             if (!response.ok) throw new Error('Failed to fetch pending transactions.');
//             setTransactions(await response.json());
//         } catch (error) {
//             toast({ title: 'Error', description: error.message, status: 'error', duration: 4000 });
//         } finally {
//             setIsLoading(false);
//         }
//     }, [token, url]); // Removed `toast`

//     useEffect(() => {
//         fetchPendingTransactions();
//     }, [fetchPendingTransactions]);

//     // This logic is now correctly filled in
//     const handleReview = async (transactionId, decision, comment = null) => {
//         setIsSubmitting(true);
//         try {
//             const response = await fetch(`${url}/api/admin/review-wallet-transaction`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//                 body: JSON.stringify({ transactionId, decision, comment })
//             });
//             const data = await response.json();
//             if (!response.ok) throw new Error(data.message);
            
//             toast({ title: 'Success', description: `Transaction has been ${decision}!`, status: 'success', duration: 3000 });
//             setTransactions(current => current.filter(t => t.trans_id !== transactionId));
//             onRejectionModalClose();
//         } catch (error) {

            
//             toast({ title: 'Error', description: error.message, status: 'error', duration: 4000 });
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     // This logic is now correctly filled in
//     const handleOpenRejectModal = (transaction) => {
//         setSelectedTransaction(transaction);
//         onRejectionModalOpen();
//     };

//     return (
//         <Flex minH="100vh" bg={mainBg}>
//             <AdminNavBar />
//             <Box flex="1" ml="80px" p={{ base: 4, md: 8 }}>
//                 <VStack spacing={8} align="stretch">
//                     <Box>
//                         <Heading as="h1" size="xl">Manage Wallet Approvals</Heading>
//                         <Text color="gray.500">Review, approve, or reject vendor deposits and withdrawals.</Text>
//                     </Box>
//                     {isLoading ? (
//                         <Center h="200px"><Spinner size="xl" /></Center>
//                     ) : transactions.length > 0 ? (
//                         <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
//                             {transactions.map(t => (
//                                 <WalletApprovalCard 
//                                     key={t.trans_id} 
//                                     transaction={t}
//                                     onApprove={() => handleReview(t.trans_id, 'approved')}
//                                     onReject={handleOpenRejectModal}
//                                 />
//                             ))}
//                         </SimpleGrid>
//                     ) : (
//                         <Center h="200px" bg={emptyStateBg} borderRadius="lg" boxShadow="sm">
//                             <Text fontSize="lg">No pending wallet transactions.</Text>
//                         </Center>
//                     )}
//                 </VStack>
//             </Box>
//             <RejectionModal
//                 isOpen={isRejectionModalOpen}
//                 onClose={onRejectionModalClose}
//                 onSubmit={(comment) => handleReview(selectedTransaction.trans_id, 'rejected', comment)}
//                 isLoading={isSubmitting}
//             />
//         </Flex>
//     );
// };

// export default ManageWalletApprovalsPage;















import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatISTDate } from '../../utils/dateUtils';
import {
  Box, VStack, Heading, Text, useColorModeValue, Spinner, Center, SimpleGrid,
  Button, useToast, Image, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter, useDisclosure, Divider, Flex, Tag,
  FormControl, FormLabel, Textarea, IconButton, Drawer, DrawerOverlay, DrawerContent,
  HStack, Icon, Tabs, TabList, TabPanels, Tab, TabPanel, Input, Select, Table, 
  Thead, Tbody, Tr, Th, Td, TableContainer, Grid, Popover, PopoverTrigger, 
  PopoverContent, PopoverArrow, PopoverCloseButton, PopoverHeader, PopoverBody, 
  Wrap, WrapItem, TagLabel, TagCloseButton, Tooltip
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
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

// Function to download all withdrawals as CSV
async function downloadAllWithdrawalsCSV(token, url) {
  try {
    const downloadBtn = document.querySelector('[data-download-withdrawals-btn]');
    if (downloadBtn) {
      downloadBtn.innerHTML = 'Fetching All Withdrawals...';
      downloadBtn.disabled = true;
    }

    const response = await fetch(`${url}/api/admin/withdrawals?limit=10000&page=1`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch all withdrawals');
    }
    
    const data = await response.json();
    const allWithdrawals = Array.isArray(data.data) ? data.data : [];
    
    if (allWithdrawals.length === 0) {
      alert('No withdrawals found to download');
      return;
    }

    if (downloadBtn) {
      downloadBtn.innerHTML = `Processing ${allWithdrawals.length} Withdrawals...`;
    }

    const headers = ['Transaction ID', 'Vendor Name', 'Vendor Email', 'Phone Number', 'Timestamp (IST)', 'Status', 'Amount', 'Description', 'Admin Comment'];
    const escape = (s = '') => `"${String(s ?? '').replace(/"/g, '""')}"`;

    const rows = allWithdrawals.map(t => [
      escape(t.trans_id),
      escape(t.vendor_name || t.user_id),
      escape(t.email),
      escape(t.phone_number),
      escape(t.created_at ? formatISTDate(t.created_at, true, true) : ''),
      escape(t.status),
      escape(Number(t.amount ?? 0).toFixed(2)),
      escape(t.description),
      escape(t.admin_comment || '')
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
    
    link.setAttribute('download', `all_withdrawals_export_${istDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (downloadBtn) {
      downloadBtn.innerHTML = `Downloaded ${allWithdrawals.length} Withdrawals!`;
      setTimeout(() => {
        downloadBtn.innerHTML = 'Download CSV';
        downloadBtn.disabled = false;
      }, 2000);
    }
    
  } catch (error) {
    console.error('Download failed:', error);
    alert('Failed to download withdrawals. Please try again.');
    
    const downloadBtn = document.querySelector('[data-download-withdrawals-btn]');
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
        <ModalHeader>Reject Transaction</ModalHeader>
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

const WalletApprovalCard = ({ transaction, onApprove, onReject }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const nestedBg = useColorModeValue('gray.50', 'gray.600');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isWithdrawal = transaction.transaction_type === 'withdrawal';
  return (
    <>
      <VStack bg={cardBg} p={5} borderRadius="lg" boxShadow="md" align="stretch" spacing={3}>
        <Flex justify="space-between" align="center">
          <Heading size="md">{transaction.vendor_name}</Heading>
          <Tag colorScheme={isWithdrawal ? 'orange' : 'green'}>{transaction.transaction_type}</Tag>
        </Flex>
        <Text fontSize="sm" color="gray.500">{transaction.email}</Text>
        <Text><strong>Current Balance:</strong> ₹{typeof transaction.current_balance === 'number' ? parseFloat(transaction.current_balance).toLocaleString('en-IN') : 'N/A'}</Text>
        <Text><strong>Request Date:</strong> {transaction.created_at ? formatISTDate(transaction.created_at, true, true) : transaction.created_at}</Text>
        <Divider />
        {isWithdrawal && (
          <Box bg={nestedBg} p={3} borderRadius="md">
            <Text fontWeight="bold">Bank Details:</Text>
            <Text pl={4}><strong>Bank:</strong> {transaction.bank_name || 'N/A'}</Text>
            <Text pl={4}><strong>Account #:</strong> {transaction.account_number || 'N/A'}</Text>
            <Text pl={4}><strong>IFSC:</strong> {transaction.ifsc_code || 'N/A'}</Text>
          </Box>
        )}
        <Box>
          <Text fontWeight="bold">Transaction Details:</Text>
          <Text pl={4}><strong>Amount:</strong> ₹{parseFloat(transaction.amount).toLocaleString('en-IN')}</Text>
          {!isWithdrawal && <Text pl={4}><strong>User's Txn ID:</strong> {transaction.upi_transaction_id}</Text>}
          <Text pl={4} fontSize="sm" fontStyle="italic"><strong>Description:</strong> {transaction.description}</Text>
        </Box>
        {!isWithdrawal && (
          <Button size="sm" mt={2} onClick={onOpen} isDisabled={!transaction.payment_proof_url}>View Payment Proof</Button>
        )}
        <SimpleGrid columns={2} spacing={2} pt={2}>
          <Button colorScheme="red" onClick={() => onReject(transaction)}>Reject</Button>
          <Button colorScheme="teal" onClick={() => onApprove(transaction.trans_id)}>
            {isWithdrawal ? 'Send' : 'Deposit'}
          </Button>
        </SimpleGrid>
      </VStack>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Payment Proof</ModalHeader>
          <ModalCloseButton />
          <ModalBody><Center><Image src={transaction.payment_proof_url} alt="Payment Screenshot" maxH="80vh" /></Center></ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

const ManageWalletApprovalsPage = ({ url }) => {
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

  // Pending transactions state
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Withdrawal history state
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [withdrawalsError, setWithdrawalsError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortOrder, setSortOrder] = useState('desc');

  // Withdrawal statistics state
  const [withdrawalStats, setWithdrawalStats] = useState({
    totalApproved: 0,
    totalPending: 0,
    countApproved: 0,
    countPending: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Search and filters for withdrawal history
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

  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetchWithdrawalSettings = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${url}/api/admin/withdrawals/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load settings');
      setWithdrawalsEnabled(!!data.withdrawals_enabled);
    } catch (e) {
      console.error('Failed to load withdrawal settings', e);
    }
  }, [token, url]);

  const handleToggleWithdrawals = useCallback(async () => {
    if (!token) return;
    setToggleLoading(true);
    try {
      const next = !withdrawalsEnabled;
      const res = await fetch(`${url}/api/admin/withdrawals/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ withdrawals_enabled: next })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to update settings');
      setWithdrawalsEnabled(!!data.withdrawals_enabled);
      toast({ title: 'Updated', description: `Withdrawals ${next ? 'enabled' : 'disabled'}`, status: 'success', duration: 2500 });
    } catch (e) {
      toast({ title: 'Error', description: e.message, status: 'error', duration: 4000 });
    } finally {
      setToggleLoading(false);
    }
  }, [token, url, withdrawalsEnabled, toast]);

  const fetchPendingTransactions = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${url}/api/admin/pending-wallet-transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch pending transactions.');
      setTransactions(await response.json());
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 4000 });
    } finally { setIsLoading(false); }
  }, [token, url]);

  // Build query params for withdrawal history
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

  const fetchWithdrawalStats = useCallback(async () => {
    if (!token) return;
    setStatsLoading(true);
    try {
      const response = await fetch(`${url}/api/admin/withdrawal-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Failed to fetch withdrawal stats');
      setWithdrawalStats(data);
    } catch (err) {
      console.error('Error fetching withdrawal stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [token, url]);

  const fetchWithdrawals = useCallback(async () => {
    if (!token) return;
    setWithdrawalsLoading(true);
    setWithdrawalsError(null);
    try {
      const response = await fetch(`${url}/api/admin/withdrawals?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Failed to fetch withdrawal data');
      setWithdrawals(Array.isArray(data.data) ? data.data : []);
      setTotalPages(Number(data.totalPages ?? 1));
      setTotalCount(Number(data.totalCount ?? 0));
    } catch (err) {
      setWithdrawalsError(err.message);
      setWithdrawals([]);
    } finally {
      setWithdrawalsLoading(false);
    }
  }, [token, url, queryParams]);

  useEffect(() => { 
    fetchPendingTransactions(); 
    fetchWithdrawalStats();
    fetchWithdrawalSettings();
  }, [fetchPendingTransactions, fetchWithdrawalStats, fetchWithdrawalSettings]);

  const handleReview = async (transactionId, decision, comment = null) => {
    setIsSubmitting(true);
    try {
      const endpoint = `${url}/api/admin/review-wallet-transaction`;
      const requestBody = { transactionId, decision, comment };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast({ title: 'Success', description: `Transaction has been ${decision}!`, status: 'success', duration: 3000 });

      setTransactions(current => current.filter(t => t.trans_id !== transactionId));
      fetchWithdrawalStats(); // Refresh stats after approval/rejection
      onRejectionModalClose();
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 4000 });
    } finally { setIsSubmitting(false); }
  };

  const handleOpenRejectModal = (transaction) => { setSelectedTransaction(transaction); onRejectionModalOpen(); };

  const handleDownloadWithdrawals = () => downloadAllWithdrawalsCSV(token, url);

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

  document.title = "NAVIU | Wallet Approvals";

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
          <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">Manage Wallet Approvals</Heading>
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
                Manage Wallet Approvals
              </Heading>
              <Text color="gray.500" display={{ base: 'none', md: 'block' }}>
                Review, approve, or reject vendor deposits and withdrawals.
              </Text>
            </Box>
            {/* Right side header actions: Toggle + Stats */}
            <HStack spacing={4} display={{ base: 'none', md: 'flex' }} align="stretch">
              <Box
                bg={cardBg}
                p={4}
                borderRadius="lg"
                borderWidth="2px"
                borderColor={borderColor}
                minW="180px"
                h="full"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap={3}
              >
                <Text fontSize="sm" color={textColor} fontWeight="semibold">Withdrawals</Text>
                <Button
                  size="sm"
                  onClick={handleToggleWithdrawals}
                  isLoading={toggleLoading}
                  colorScheme={withdrawalsEnabled ? 'green' : 'red'}
                  variant={withdrawalsEnabled ? 'solid' : 'outline'}
                >
                  {withdrawalsEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </Box>

              {/* Withdrawal Statistics */}
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
                    ₹{withdrawalStats.totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                )}
                <Text fontSize="xs" color={pendingCount}>
                  {withdrawalStats.countPending} transaction{withdrawalStats.countPending !== 1 ? 's' : ''}
                </Text>
              </Box>

              <Box 
                bg={approvedBg} 
                p={4} 
                borderRadius="lg" 
                borderWidth="2px" 
                borderColor={approvedBorder}
                minW="180px"
                h="full"
              >
                <Text fontSize="xs" fontWeight="semibold" color={approvedTitle} mb={1}>
                  Total Approved
                </Text>
                {statsLoading ? (
                  <Spinner size="sm" color="green.500" />
                ) : (
                  <Text fontSize="2xl" fontWeight="bold" color={approvedAmount}>
                    ₹{withdrawalStats.totalApproved.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                )}
                <Text fontSize="xs" color={approvedCount}>
                  {withdrawalStats.countApproved} transaction{withdrawalStats.countApproved !== 1 ? 's' : ''}
                </Text>
              </Box>
            </HStack>
          </Flex>

          {/* Mobile Toggle + Statistics - Below Header */}
          <Box display={{ base: 'block', md: 'none' }}>
            <Box
              bg={cardBg}
              p={3}
              borderRadius="lg"
              borderWidth="2px"
              borderColor={borderColor}
              mb={4}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gap={3}
            >
              <Text fontSize="sm" color={textColor} fontWeight="semibold">Withdrawals</Text>
              <Button size="sm" onClick={handleToggleWithdrawals} isLoading={toggleLoading} colorScheme={withdrawalsEnabled ? 'green' : 'red'} variant={withdrawalsEnabled ? 'solid' : 'outline'}>
                {withdrawalsEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </Box>
          </Box>

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
                  ₹{withdrawalStats.totalPending.toLocaleString('en-IN')}
                </Text>
              )}
              <Text fontSize="xs" color={pendingCount}>
                {withdrawalStats.countPending} txn{withdrawalStats.countPending !== 1 ? 's' : ''}
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
                  ₹{withdrawalStats.totalApproved.toLocaleString('en-IN')}
                </Text>
              )}
              <Text fontSize="xs" color={approvedCount}>
                {withdrawalStats.countApproved} txn{withdrawalStats.countApproved !== 1 ? 's' : ''}
              </Text>
            </Box>
          </SimpleGrid>

          <Tabs colorScheme="blue" variant="enclosed">
            <TabList>
              <Tab>Pending Approvals</Tab>
              <Tab onClick={fetchWithdrawals}>Withdrawal History</Tab>
            </TabList>

            <TabPanels>
              {/* Pending Approvals Tab */}
              <TabPanel>
                {isLoading ? (
                  <Center h="200px"><Spinner size="xl" /></Center>
                ) : transactions.length > 0 ? (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {transactions.map(t => (
                      <WalletApprovalCard
                        key={t.trans_id}
                        transaction={t}
                        onApprove={() => handleReview(t.trans_id, 'approved')}
                        onReject={handleOpenRejectModal}
                      />
                    ))}
                  </SimpleGrid>
                ) : (
                  <Center h="200px" bg={cardBg} borderRadius="lg" boxShadow="sm">
                    <Text fontSize="lg">No pending wallet transactions.</Text>
                  </Center>
                )}
              </TabPanel>

              {/* Withdrawal History Tab */}
              <TabPanel>
                <Box bg={tableBg} p={{ base: 3, md: 6 }} borderRadius="lg" boxShadow="lg">
                  <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
                    <Heading size="md">All Withdrawal Transactions</Heading>
                    <Tooltip 
                      label="Download all withdrawals (ignores current filters and pagination)" 
                      placement="top"
                      hasArrow
                    >
                      <Button 
                        colorScheme="green" 
                        onClick={handleDownloadWithdrawals} 
                        data-download-withdrawals-btn
                        isDisabled={withdrawalsLoading}
                        size="sm"
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

                  {withdrawalsLoading && <Center p={10}><Spinner size="xl" /></Center>}
                  {withdrawalsError && <Center p={10}><Text color="red.500">{withdrawalsError}</Text></Center>}

                  {!withdrawalsLoading && !withdrawalsError && (
                    <>
                      <TableContainer display={{ base: 'none', md: 'block' }} overflowX="auto">
                        <Table variant="simple" size="md" minW="980px">
                          <Thead>
                            <Tr>
                              <Th>Vendor</Th>
                              <Th>Date</Th>
                              <Th isNumeric>Amount</Th>
                              <Th>Status</Th>
                              <Th>Description</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {withdrawals.map(tx => (
                              <Tr key={tx.trans_id}>
                                <Td fontWeight="bold">
                                  <Text>{tx.vendor_name || tx.user_id}</Text>
                                  <Text fontSize="sm" color={textColor} fontWeight="normal">{tx.email}</Text>
                                  <Text fontSize="sm" color={textColor} fontWeight="normal">{tx.phone_number}</Text>
                                </Td>
                                <Td fontWeight="bold">
                                  {tx.created_at ? formatISTDate(tx.created_at, true, true) : tx.created_at}
                                </Td>
                                <Td isNumeric color="red.400" fontWeight="bold">
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
                                  {tx.admin_comment && (
                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                      Note: {tx.admin_comment}
                                    </Text>
                                  )}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>

                      {/* Mobile view - Simple Cards */}
                      <VStack spacing={4} display={{ base: 'flex', md: 'none' }}>
                        {withdrawals.map(tx => (
                          <Box key={tx.trans_id} w="100%" p={4} borderWidth="1px" borderColor={borderColor} borderRadius="lg" boxShadow="sm">
                            <VStack spacing={2} align="stretch">
                              <Flex justify="space-between" align="center">
                                <Text fontWeight="bold" fontSize="md">{tx.vendor_name || tx.user_id}</Text>
                                <Tag colorScheme={statusColor(tx.status)} size="sm">{tx.status}</Tag>
                              </Flex>
                              <Text fontSize="sm" color={textColor}>{tx.email}</Text>
                              <Text fontSize="sm" color={textColor}>{tx.phone_number}</Text>
                              <Flex justify="space-between" align="center">
                                <Text fontSize="lg" fontWeight="bold" color="red.400">
                                  ₹{Number(tx.amount || 0).toFixed(2)}
                                </Text>
                              </Flex>
                              <Text fontSize="sm" color={textColor}>
                                {tx.created_at ? formatISTDate(tx.created_at, true, true) : tx.created_at}
                              </Text>
                              {tx.admin_comment && (
                                <Text fontSize="xs" color="gray.500">
                                  Note: {tx.admin_comment}
                                </Text>
                              )}
                            </VStack>
                          </Box>
                        ))}
                      </VStack>

                      {withdrawals.length === 0 && !withdrawalsLoading ? (
                        <Center p={10}><Text>No withdrawal transactions found for the selected filters.</Text></Center>
                      ) : (
                        <Flex justify="space-between" align="center" mt={6} flexWrap="wrap" gap={4}>
                          <HStack>
                            <Button onClick={() => setPage(p => p - 1)} isDisabled={page === 1 || withdrawalsLoading}>
                              Previous
                            </Button>
                            <Button onClick={() => setPage(p => p + 1)} isDisabled={page >= totalPages || withdrawalsLoading}>
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
                              isDisabled={withdrawalsLoading}
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
        onSubmit={(comment) => handleReview(selectedTransaction.trans_id, 'rejected', comment)}
        isLoading={isSubmitting}
      />

    </Flex>
  );
};

export default ManageWalletApprovalsPage;
