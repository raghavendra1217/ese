import React from 'react';
import { Box, Flex, Grid, Heading, Button, useColorModeValue } from '@chakra-ui/react';
import { BsPersonCheckFill, BsCart3 } from 'react-icons/bs';

// Correct: No curly braces for default exports
import StatCard from './cards/StatCard';
import ProductStatCard from './cards/ProductStatCard';
import TradeApprovalStatCard from './cards/TradeApprovalStatCard';

const TradingStatsSection = ({ stats }) => {
    const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');

    return (
        <Box as="section" mb={8}>
            <Flex justify="space-between" align="center" mb={4}>
                <Heading as="h2" size="lg" color={secondaryTextColor}>TRADING</Heading>
                {/* <Flex gap={2}>
                    <Button variant="outline">Manage</Button>
                    <Button colorScheme="blue">Add Member</Button>
                </Flex> */}
            </Flex>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
                <TradeApprovalStatCard value={stats.pendingTradeApprovals} />
                <ProductStatCard value={stats.availableProducts} />
                </Grid>
        </Box>
    );
};

export default TradingStatsSection;