import React from 'react';
import { Box, Flex, Grid, Heading, Button, Spacer, Text, useColorModeValue } from '@chakra-ui/react';

const VendorAnalyticsSection = ({ stats }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    
    return (
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
            <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="sm">
                <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">Performance Statistics</Heading>
                    <Button size="sm" colorScheme="green" variant="outline">Export</Button>
                </Flex>
                <Box h="250px" bg={useColorModeValue('gray.100', 'gray.600')} borderRadius="md"></Box>
            </Box>
            <Flex direction="column" bg="blue.600" color="white" p={6} borderRadius="lg" boxShadow="sm">
                <Flex justify="space-between" align="start">
                    <Box>
                        <Heading size="md">Total Payouts</Heading>
                        <Text color="blue.200">This Month</Text>
                    </Box>
                    <Button size="sm" colorScheme="blue" variant="solid" bg="blue.500" _hover={{bg: 'blue.400'}}>Details</Button>
                </Flex>
                <Spacer />
                <Heading size="2xl">{stats.totalPayouts.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</Heading>
            </Flex>
        </Grid>
    );
};

export default VendorAnalyticsSection;