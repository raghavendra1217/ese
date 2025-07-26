import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, VStack, Heading, Text, useColorModeValue, Spinner,
    Center, SimpleGrid, Button, useToast, Image, Modal,
    ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, useDisclosure, Divider, Flex
} from '@chakra-ui/react';
import { useAuth } from '../AppContext';
import NavBar from '../components/NavBar';

const TradeApprovalCard = ({ trade, onApprove }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const { isOpen, onOpen, onClose } = useDisclosure();

    // --- FIX: Construct the full image URL using the environment variable ---
    // The 'trade.payment_url' from the database is a relative path like '/proof/some-image.png'
    // We prepend the backend's base URL to make it a complete, absolute URL.
    const fullImageUrl = `${process.env.REACT_APP_API_BASE_URL}${trade.payment_url}`;

    return (
        <>
            <VStack bg={cardBg} p={5} borderRadius="lg" boxShadow="md" align="stretch" spacing={3}>
                <Heading size="md">{trade.paper_type}</Heading>
                <Text><strong>Purchased by:</strong> {trade.vendor_name}</Text>
                <Text><strong>Purchase Date:</strong> {new Date(trade.date).toLocaleDateString()}</Text>
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
                <Button colorScheme="teal" mt={2} onClick={() => onApprove(trade.trade_id)}>Approve Trade</Button>
            </VStack>

            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Payment Proof Preview</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Center>
                            {/* --- Use the newly constructed fullImageUrl here --- */}
                            <Image 
                                src={fullImageUrl} 
                                alt="Payment Screenshot" 
                                maxH="80vh" 
                                // Optional: Add a fallback for broken images
                                fallbackSrc='https://via.placeholder.com/400x300?text=Image+Not+Found'
                            />
                        </Center>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};

const ManageTradingApprovalsPage = () => {
    const mainBg = useColorModeValue('#F9FAFB', 'gray.800');
    const textColor = useColorModeValue('gray.800', 'white');
    const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');
    const cardBg = useColorModeValue('white', 'gray.700');
    const toast = useToast();
    const [trades, setTrades] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { token } = useAuth();

    const fetchPendingTrades = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/pending-trades', {
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
    }, [token, toast]);

    useEffect(() => {
        fetchPendingTrades();
    }, [fetchPendingTrades]);

    const handleApprove = async (tradeId) => {
        try {
            const response = await fetch(`/api/admin/approve-trade/${tradeId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to approve trade.');
            
            toast({ title: 'Success', description: 'Trade approved!', status: 'success', duration: 3000 });
            setTrades(currentTrades => currentTrades.filter(t => t.trade_id !== tradeId));
        } catch (error) {
            toast({ title: 'Error', description: error.message, status: 'error', duration: 5000, isClosable: true });
        }
    };

    return (
        <Flex minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
            <NavBar />
            <Box flex="1" ml="80px" p={{ base: 4, md: 8 }} bg={mainBg}>
                <VStack spacing={8} align="stretch">
                    <Box>
                        <Heading as="h1" size="xl" color={textColor}>Manage Trading Approvals</Heading>
                        <Text color={secondaryTextColor}>Review and approve new product purchases.</Text>
                    </Box>
                    {isLoading ? (
                        <Center h="200px"><Spinner size="xl" /></Center>
                    ) : trades.length > 0 ? (
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                            {trades.map(trade => (
                                <TradeApprovalCard key={trade.trade_id} trade={trade} onApprove={handleApprove} />
                            ))}
                        </SimpleGrid>
                    ) : (
                        <Center h="200px" bg={cardBg} borderRadius="lg" boxShadow="sm">
                            <Text fontSize="lg">No pending trade approvals at this time.</Text>
                        </Center>
                    )}
                </VStack>
            </Box>
        </Flex>
    );
};

export default ManageTradingApprovalsPage;