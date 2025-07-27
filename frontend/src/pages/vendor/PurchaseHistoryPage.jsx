import React, { useState, useEffect } from 'react';
import {
  Box, VStack, Heading, Text, Spinner, Alert, AlertIcon,
  Container, Image, Badge, Flex, Divider, Button, ButtonGroup, useColorModeValue
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

// --- A more powerful PurchaseCard component ---
const PurchaseCard = ({ purchase, url }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    let statusColorScheme;
    let statusText;

    // Determine color and text based on the new status string
    switch (purchase.is_approved) {
        case 'approved':
            statusColorScheme = 'green';
            statusText = 'Approved';
            break;
        case 'rejected':
            statusColorScheme = 'red';
            statusText = 'Rejected';
            break;
        default: // 'pending'
            statusColorScheme = 'yellow';
            statusText = 'Pending';
            break;
    }

    return (
        <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg={cardBg} p={4}>
            <Flex direction={{ base: 'column', md: 'row' }} align="center" gap={4}>
                <Image
                    src={`${url}${purchase.product_image_url}`}
                    alt={purchase.paper_type}
                    boxSize="100px"
                    objectFit="cover"
                    borderRadius="md"
                    fallbackSrc='https://via.placeholder.com/100'
                />
                <VStack align="flex-start" w="full" spacing={1}>
                    <Heading size="sm">{purchase.paper_type}</Heading>
                    <Text fontSize="xs" color="gray.400">
                        Purchased on: {new Date(purchase.date).toLocaleString('en-GB')}
                    </Text>
                    <Text fontSize="sm">Quantity: <strong>{purchase.no_of_stock_bought}</strong></Text>
                    <Text fontSize="sm">Total Paid: <strong>₹{parseFloat(purchase.total_amount_paid).toFixed(2)}</strong></Text>

                    {purchase.transaction_id && (
                        <Text fontSize="xs" color="gray.400" wordBreak="break-all">
                            Transaction ID: {purchase.transaction_id}
                        </Text>
                    )}

                    {/* --- NEW: Conditionally render the rejection comment --- */}
                    {purchase.is_approved === 'rejected' && purchase.comment && (
                        <Text fontSize="sm" color="red.300" pt={2}>
                            <strong>Admin Comment:</strong> "{purchase.comment}"
                        </Text>
                    )}
                </VStack>
                <Box ml={{ md: 'auto' }} mt={{ base: 3, md: 0 }}>
                    <Badge 
                        fontSize="sm" 
                        p={2} 
                        borderRadius="md"
                        w="100px"
                        textAlign="center"
                        colorScheme={statusColorScheme}
                    >
                        {statusText}
                    </Badge>
                </Box>
            </Flex>
        </Box>
    );
};

// --- The main page component, updated for the new system ---
const PurchaseHistoryPage = ({ url }) => {
    const { token } = useAuth();
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // 'approved', 'pending', 'rejected', or 'all'

    useEffect(() => {
        const fetchHistory = async () => {
            if (!token) {
                setError("Authentication token not found. Please log in.");
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                // We only need to call this one endpoint to get everything
                const response = await fetch(`${url}/api/trading/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch your purchase history.');
                }
                const data = await response.json();
                setPurchases(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [token, url]);

    // The filter logic now checks for the specific status strings
    const filteredPurchases = purchases.filter(p => {
        if (filter === 'all') return true;
        return p.is_approved === filter;
    });

    if (loading) {
        return <Container centerContent py={20}><Spinner size="xl" /></Container>;
    }
    if (error) {
        return <Container centerContent py={20}><Alert status="error"><AlertIcon />{error}</Alert></Container>;
    }

    return (
        <Container maxW="container.lg" py={10}>
            <Flex justify="space-between" align="center" mb={2}>
                <Heading as="h1">My Transaction Log</Heading>
                <ButtonGroup size="sm" isAttached>
                    <Button colorScheme={filter === 'all' ? 'blue' : 'gray'} onClick={() => setFilter('all')}>All</Button>
                    <Button colorScheme={filter === 'approved' ? 'green' : 'gray'} onClick={() => setFilter('approved')}>Approved</Button>
                    <Button colorScheme={filter === 'pending' ? 'yellow' : 'gray'} onClick={() => setFilter('pending')}>Pending</Button>
                    <Button colorScheme={filter === 'rejected' ? 'red' : 'gray'} onClick={() => setFilter('rejected')}>Rejected</Button>
                </ButtonGroup>
            </Flex>
            <Divider mb={6} />
            {filteredPurchases.length === 0 ? (
                <Alert status="info"><AlertIcon />No Rejected Trades.</Alert>
            ) : (
                <VStack spacing={4} align="stretch">
                    {filteredPurchases.map(purchase => (
                        <PurchaseCard key={purchase.trade_id} purchase={purchase} url={url} />
                    ))}
                </VStack>
            )}
        </Container>
    );
};

export default PurchaseHistoryPage;