import React from 'react';
import { formatISTDate } from '../../utils/dateUtils';
import { Box, Heading, Text, VStack, useColorModeValue, Tag, Flex, Button, useToast } from '@chakra-ui/react';

const TransactionItem = ({ tx, type, onCancel, isLoading }) => {
    const itemBg = useColorModeValue('gray.100', 'gray.700');
    const dateColor = useColorModeValue('gray.500', 'gray.400');
    
    // Determine color based on transaction type
    const amountColor = type === 'deposit' ? 'green.400' : 'red.400';
    
    // Show cancel button only for pending withdrawal requests
    const showCancelButton = type === 'withdrawal' && tx.status === 'pending' && onCancel;

    return (
        <Flex justify="space-between" align="center" p={4} bg={itemBg} borderRadius="md" w="100%">
            <Box flex="1">
                <Text fontWeight="medium">{tx.description || 'No description'}</Text>
                <Text fontSize="sm" color={dateColor}>
                    {tx.created_at ? formatISTDate(tx.created_at, true, true) : tx.created_at}
                </Text>
                 {tx.upi_transaction_id && (
                     <Text fontSize="xs" color={dateColor}>UPI ID: {tx.upi_transaction_id}</Text>
                 )}
            </Box>
            
            <Flex align="center" gap={3}>
                <Text fontWeight="bold" fontSize="lg" color={amountColor} whiteSpace="nowrap">
                    ₹{parseFloat(tx.amount).toFixed(2)}
                </Text>
                
                {showCancelButton && (
                    <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        onClick={() => onCancel(tx.trans_id)}
                        isLoading={isLoading}
                        loadingText="Cancelling..."
                    >
                        Cancel
                    </Button>
                )}
            </Flex>
        </Flex>
    );
};

const TransactionList = ({ title, transactions, headingColor, type, onCancel, isLoading }) => {
    // Don't render the section if there are no transactions for this status
    if (!transactions || transactions.length === 0) {
        return null; 
    }

    return (
        <Box mb={8}>
            <Flex align="center" mb={4}>
                <Heading size="md" color={headingColor} mr={3}>{title}</Heading>
                <Tag size="sm" colorScheme={headingColor.split('.')[0]}>{transactions.length}</Tag>
            </Flex>
            <VStack spacing={3} align="stretch">
                {transactions.map(tx => (
                    <TransactionItem 
                        key={tx.trans_id} 
                        tx={tx} 
                        type={type} 
                        onCancel={onCancel}
                        isLoading={isLoading}
                    />
                ))}
            </VStack>
        </Box>
    );
};

export default TransactionList;