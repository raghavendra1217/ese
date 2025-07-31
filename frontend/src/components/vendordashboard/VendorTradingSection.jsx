import React from 'react';
import { Box, Flex, Grid, Heading, useColorModeValue } from '@chakra-ui/react';
import StatCard from '../shared/cards/StatCard'; // Assuming path to your reusable card is correct
import VendorProductStatCard from './cards/VendorProductStatCard';
import { BsPersonCheckFill, BsCart3, BsCheckCircle } from 'react-icons/bs';

const VendorTradingSection = ({ stats }) => {
    const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');

    return (
        <Box as="section" mb={8}>
            <Flex justify="space-between" align="center" mb={4}>
                <Heading as="h2" size="lg" color={secondaryTextColor}>TRADING</Heading>
                {/* The "Add Member" button has been moved to the VendorDashboardHeader component */}
            </Flex>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
                <VendorProductStatCard value={stats.availableProducts} />
                <StatCard
                    label="My Approved Purchases"
                    value={stats.purchasedProducts.toLocaleString()}
                    icon={<BsPersonCheckFill size={24} />}
                    iconBgColor="sky.500"
                    to="/vendor/purchase-history" // Links to the general history page
                />
                {/* --- UPDATED CARD --- */}
                {/* This card now links to the detailed spending history page */}
                <StatCard 
                    label="Total Spent" 
                    value={stats.purchasedValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} 
                    icon={<BsCart3 size={24} />} 
                    iconBgColor="green.500" 
                    to="/vendor/spending-history"
                />
                <StatCard 
                    label="Purchases Pending Approval" 
                    value={stats.pendingTradeApprovals.toLocaleString()} 
                    icon={<BsCheckCircle size={24} />} 
                    iconBgColor="purple.500" 
                />
            </Grid>
        </Box>
    );
};

export default VendorTradingSection;