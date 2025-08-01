import React, { useState, useEffect } from 'react';
import {
    Box, Heading, Text, VStack, HStack, Spinner, Center, useColorModeValue, Tag, Flex
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext'; // Adjust path if needed

const RecentTransactions = ({ url }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    // --- Component Styling ---
    const boxBg = useColorModeValue('white', 'gray.800');
    const hoverBg = useColorModeValue('gray.100', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.400');

    // --- Data Fetching Effect ---
    useEffect(() => {
        const fetchTransactions = async () => {
            if (!token) return;
            try {
                setLoading(true);
                const response = await fetch(`${url}/api/admin/transactions/recent`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch transaction data');
                }
                const data = await response.json();
                setTransactions(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [token, url]);

    // --- Helper to color-code transaction types ---
    const getStatusColor = (type) => {
        switch (String(type).toLowerCase()) {
            case 'deposit': return 'green';
            case 'withdrawal': return 'red';
            case 'purchase': return 'blue';
            case 'refund': return 'orange';
            default: return 'gray';
        }
    };

    return (
        <Box bg={boxBg} p={6} borderRadius="lg" boxShadow="md">
            <Heading size="md" mb={4}>Recent Transactions</Heading>
            {loading ? (
                <Center h="300px"><Spinner /></Center>
            ) : error ? (
                <Center h="300px"><Text color="red.400">{error}</Text></Center>
            ) : (
                <VStack spacing={3} align="stretch" maxH="350px" overflowY="auto" pr={2}>
                    {transactions.length > 0 ? transactions.map((tx) => (
                        <HStack 
                            key={tx.transaction_id} 
                            justify="space-between" 
                            p={3} 
                            borderRadius="md" 
                            _hover={{ bg: hoverBg }}
                            w="100%"
                        >
                            <VStack align="start" spacing={0}>
                                <Text fontWeight="bold" noOfLines={1}>{tx.user_id}</Text>
                                <Text fontSize="xs" color={textColor}>
                                    {new Date(tx.created_at).toLocaleString()}
                                </Text>
                            </VStack>
                            <VStack align="end" spacing={1} flexShrink={0}>
                                <Text fontWeight="bold" color={getStatusColor(tx.transaction_type) + ".400"}>
                                    ${(tx.amount || 0).toFixed(2)}
                                </Text>
                                <Tag size="sm" colorScheme={getStatusColor(tx.transaction_type)} textTransform="capitalize">
                                    {tx.transaction_type}
                                </Tag>
                            </VStack>
                        </HStack>
                    )) : (
                        <Center h="300px"><Text>No recent transactions found.</Text></Center>
                    )}
                </VStack>
            )}
        </Box>
    );
};

export default RecentTransactions;