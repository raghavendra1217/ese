// In src/pages/admin/ManageTradingApprovalsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, VStack, Heading, Text, useColorModeValue, Spinner,
    Center, SimpleGrid, Button, useToast, Image, Modal,
    ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, // <-- ADD ModalFooter HERE
    useDisclosure, Divider, Flex,
    Textarea, FormControl, FormLabel
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';
import NavBar from '../../components/NavBar';

// --- SUB-COMPONENT 1: Rejection Modal ---
// =================================================================
const RejectionModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (isOpen) setComment(''); // Reset comment on open
    }, [isOpen]);

    const handleSubmit = () => {
        if (comment.trim()) {
            onSubmit(comment);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Reject Trade</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <FormControl isRequired>
                        <FormLabel>Reason for Rejection</FormLabel>
                        <Textarea
                            placeholder="Provide a clear reason for the vendor (e.g., 'Screenshot is blurry', 'Transaction ID does not match')."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </FormControl>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isLoading}>Cancel</Button>
                    <Button
                        colorScheme="red"
                        onClick={handleSubmit}
                        isLoading={isLoading}
                        isDisabled={!comment.trim()}
                    >
                        Submit Rejection
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};


// =================================================================
// --- SUB-COMPONENT 2: Trade Approval Card (Updated) ---
// =================================================================
const TradeApprovalCard = ({ trade, onApprove, onReject, url }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const fullImageUrl = `${url}${trade.payment_url}`;

    return (
        <>
            <VStack bg={cardBg} p={5} borderRadius="lg" boxShadow="md" align="stretch" spacing={3}>
                <Heading size="md">{trade.paper_type}</Heading>
                <Text><strong>Purchased by:</strong> {trade.vendor_name}</Text>
                <Text><strong>Purchase Date:</strong> {new Date(trade.date).toLocaleDateString('en-GB')}</Text>
                <Divider my={2} />
                <Box>
                    <Text fontWeight="bold">Purchase Details:</Text>
                    <Text pl={4}><strong>Quantity:</strong> {trade.no_of_stock_bought}</Text>
                    <Text pl={4}><strong>Total Amount:</strong> ₹{parseFloat(trade.total_amount_paid).toLocaleString('en-IN')}</Text>
                    <Text pl={4}><strong>Transaction ID:</strong> {trade.transaction_id}</Text>
                </Box>
                <Button size="sm" mt={2} onClick={onOpen} isDisabled={!trade.payment_url}>
                    View Payment Proof
                </Button>
                {/* --- UPDATED: Button group for Approve/Reject --- */}
                <SimpleGrid columns={2} spacing={2} pt={2}>
                    <Button colorScheme="red" onClick={() => onReject(trade)}>Reject</Button>
                    <Button colorScheme="teal" onClick={() => onApprove(trade.trade_id)}>Approve</Button>
                </SimpleGrid>
            </VStack>

            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Payment Proof Preview</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Center><Image src={fullImageUrl} alt="Payment Screenshot" maxH="80vh" /></Center>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};


// =================================================================
// --- MAIN PAGE COMPONENT (Updated with full logic) ---
// =================================================================
const ManageTradingApprovalsPage = ({ url }) => {
    const mainBg = useColorModeValue('gray.50', 'gray.800');
    const textColor = useColorModeValue('gray.800', 'white');
    const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');
    const cardBg = useColorModeValue('white', 'gray.700');
    const toast = useToast();
    const { token } = useAuth();

    const [trades, setTrades] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // For modal loading state
    const [selectedTrade, setSelectedTrade] = useState(null); // To track which trade is being rejected

    const { isOpen: isRejectionModalOpen, onOpen: onRejectionModalOpen, onClose: onRejectionModalClose } = useDisclosure();

    const fetchPendingTrades = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${url}/api/admin/pending-trades`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch pending trades.');
            const data = await response.json();
            setTrades(data);
        } catch (error) {
            toast({ title: 'Error', description: error.message, status: 'error', duration: 5000, isClosable: true });
        } finally {
            setIsLoading(false);
        }
    }, [token, toast, url]);

    useEffect(() => {
        fetchPendingTrades();
    }, [fetchPendingTrades]);

    // --- NEW: A single handler for both approving and rejecting ---
    const handleReviewTrade = async (tradeId, decision, comment = null) => {
        setIsSubmitting(true);
        try {
            const body = { tradeId, decision };
            if (comment) body.comment = comment;

            const response = await fetch(`${url}/api/admin/trades/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to review trade.');
            
            toast({ title: 'Success', description: `Trade has been ${decision}!`, status: 'success', duration: 3000 });
            setTrades(current => current.filter(t => t.trade_id !== tradeId));
            onRejectionModalClose(); // Close the modal if it was open
        } catch (error) {
            toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- NEW: Handler to open the rejection modal ---
    const handleOpenRejectModal = (trade) => {
        setSelectedTrade(trade);
        onRejectionModalOpen();
    };

    return (
        <Flex minH="100vh" bg={mainBg}>
            <NavBar />
            <Box flex="1" ml="80px" p={{ base: 4, md: 8 }}>
                <VStack spacing={8} align="stretch">
                    <Box>
                        <Heading as="h1" size="xl" color={textColor}>Manage Trading Approvals</Heading>
                        <Text color={secondaryTextColor}>Review, approve, or reject vendor stock purchases.</Text>
                    </Box>
                    {isLoading ? (
                        <Center h="200px"><Spinner size="xl" /></Center>
                    ) : trades.length > 0 ? (
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                            {trades.map(trade => (
                                <TradeApprovalCard 
                                    key={trade.trade_id} 
                                    trade={trade}
                                    onApprove={() => handleReviewTrade(trade.trade_id, 'approved')} // Calls the new handler
                                    onReject={handleOpenRejectModal} // Calls the modal opener
                                    url={url}
                                />
                            ))}
                        </SimpleGrid>
                    ) : (
                        <Center h="200px" bg={cardBg} borderRadius="lg" boxShadow="sm">
                            <Text fontSize="lg">No pending trade approvals at this time.</Text>
                        </Center>
                    )}
                </VStack>
            </Box>

            {/* The modal for rejecting trades */}
            <RejectionModal
                isOpen={isRejectionModalOpen}
                onClose={onRejectionModalClose}
                onSubmit={(comment) => handleReviewTrade(selectedTrade.trade_id, 'rejected', comment)}
                isLoading={isSubmitting}
            />
        </Flex>
    );
};

export default ManageTradingApprovalsPage;