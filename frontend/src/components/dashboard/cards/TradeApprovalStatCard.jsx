import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flex, Box, Text, Heading, Button, useColorModeValue } from '@chakra-ui/react';

const TradeApprovalStatCard = ({ value }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const valueColor = useColorModeValue('gray.900', 'white');
    const navigate = useNavigate();

    return (
        <Flex bg={cardBg} p={4} borderRadius="lg" boxShadow="sm" direction="column" justify="space-between" minH="130px">
            <Box>
                <Text fontSize="sm" color="gray.500">Pending Trade Approvals</Text>
                <Heading size="md" color={valueColor}>{value.toLocaleString()}</Heading>
            </Box>
            <Button colorScheme="teal" w="full" mt={2} onClick={() => navigate('/admin/manage-trading-approvals')}>
                Manage Trades
            </Button>
        </Flex>
    );
};

// Make sure this line exists and is correct
export default TradeApprovalStatCard;