// src/pages/PurchaseHistoryPage.jsx

import React, { useState, useEffect } from 'react';
import {
  Box, VStack, Heading, Text, Spinner, Alert, AlertIcon, SimpleGrid,
  Container, Image, Badge, Flex, Divider
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

// A dedicated component to display a single purchase record cleanly.
const PurchaseCard = ({ purchase, url }) => (
    <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg="gray.700" p={4}>
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
                    Purchased on: {new Date(purchase.date).toLocaleDateString()}
                </Text>
                <Text fontSize="sm">Quantity: <strong>{purchase.no_of_stock_bought}</strong></Text>
                <Text fontSize="sm">Total Paid: <strong>₹{parseFloat(purchase.total_amount_paid).toFixed(2)}</strong></Text>
                
                {/* --- UPDATE: Display the transaction ID for better record-keeping --- */}
                <Divider pt={1} />
                <Text fontSize="xs" color="gray.400" wordBreak="break-all" pt={1}>
                    Trade ID: {purchase.trade_id}
                </Text>
                {/* Conditionally render the Transaction ID only if it exists (i.e., after proof is submitted) */}
                {purchase.transaction_id && (
                     <Text fontSize="xs" color="gray.400" wordBreak="break-all">
                        Transaction ID: {purchase.transaction_id}
                    </Text>
                )}
                {/* --- END OF UPDATE --- */}

            </VStack>
            <Box ml={{ md: 'auto' }} mt={{ base: 3, md: 0 }}>
                <Badge 
                    fontSize="sm" 
                    p={2} 
                    borderRadius="md"
                    w="100px"
                    textAlign="center"
                    colorScheme={purchase.is_approved ? 'green' : 'yellow'}
                >
                    {purchase.is_approved ? 'Approved' : 'Pending'}
                </Badge>
            </Box>
        </Flex>
    </Box>
);

// The main page component that fetches and displays the history.
const PurchaseHistoryPage = ({ url }) => {
    const { token } = useAuth();
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            if (!token) {
                setError("Authentication token not found. Please log in.");
                setLoading(false);
                return;
            }
            try {
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
    }, [token]);

    if (loading) {
        return <Container centerContent py={20}><Spinner size="xl" /></Container>;
    }
    if (error) {
        return <Container centerContent py={20}><Alert status="error"><AlertIcon />{error}</Alert></Container>;
    }

    return (
        <Container maxW="container.lg" py={10}>
            <Heading as="h1" mb={2}>My Purchase History</Heading>
            <Divider mb={6} />
            {purchases.length === 0 ? (
                <Alert status="info"><AlertIcon />You have not made any purchases yet.</Alert>
            ) : (
                <VStack spacing={6} align="stretch">
                    {purchases.map(purchase => (
                        <PurchaseCard key={purchase.trade_id} purchase={purchase} url={url} />
                    ))}
                </VStack>
            )}
        </Container>
    );
};

export default PurchaseHistoryPage;