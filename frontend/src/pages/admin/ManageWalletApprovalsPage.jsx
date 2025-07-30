import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, VStack, Heading, Text, useColorModeValue, Spinner, Center, SimpleGrid,
    Button, useToast, Image, Modal, ModalOverlay, ModalContent, ModalHeader,
    ModalCloseButton, ModalBody, ModalFooter, useDisclosure, Divider, Flex,
    Textarea, FormControl, FormLabel, Tag
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';
import AdminNavBar from '../../components/layout/AdminNavBar';

// RejectionModal component (This is correct, no changes needed)
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

// WalletApprovalCard component (This is correct, no changes needed)
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
                <Text><strong>Request Date:</strong> {new Date(transaction.created_at).toLocaleString('en-GB')}</Text>
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


// --- MAIN PAGE COMPONENT (CORRECTED) ---
const ManageWalletApprovalsPage = ({ url }) => {
    const mainBg = useColorModeValue('gray.50', 'gray.800');
    const emptyStateBg = useColorModeValue('white', 'gray.700');
    const toast = useToast();
    const { token } = useAuth();
    const { isOpen: isRejectionModalOpen, onOpen: onRejectionModalOpen, onClose: onRejectionModalClose } = useDisclosure();
    
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    // --- FIX IS HERE: 'toast' is removed from the dependency array ---
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
        } finally {
            setIsLoading(false);
        }
    }, [token, url]); // Removed `toast`

    useEffect(() => {
        fetchPendingTransactions();
    }, [fetchPendingTransactions]);

    // This logic is now correctly filled in
    const handleReview = async (transactionId, decision, comment = null) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`${url}/api/admin/review-wallet-transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ transactionId, decision, comment })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            toast({ title: 'Success', description: `Transaction has been ${decision}!`, status: 'success', duration: 3000 });
            setTransactions(current => current.filter(t => t.trans_id !== transactionId));
            onRejectionModalClose();
        } catch (error) {
            toast({ title: 'Error', description: error.message, status: 'error', duration: 4000 });
        } finally {
            setIsSubmitting(false);
        }
    };

    // This logic is now correctly filled in
    const handleOpenRejectModal = (transaction) => {
        setSelectedTransaction(transaction);
        onRejectionModalOpen();
    };

    return (
        <Flex minH="100vh" bg={mainBg}>
            <AdminNavBar />
            <Box flex="1" ml="80px" p={{ base: 4, md: 8 }}>
                <VStack spacing={8} align="stretch">
                    <Box>
                        <Heading as="h1" size="xl">Manage Wallet Approvals</Heading>
                        <Text color="gray.500">Review, approve, or reject vendor deposits and withdrawals.</Text>
                    </Box>
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
                        <Center h="200px" bg={emptyStateBg} borderRadius="lg" boxShadow="sm">
                            <Text fontSize="lg">No pending wallet transactions.</Text>
                        </Center>
                    )}
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