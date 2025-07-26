import React from 'react';
import { Box, Flex, Grid, Heading, Button, Spacer, Text, useColorModeValue } from '@chakra-ui/react';
import { FaAngleDown } from 'react-icons/fa';
import { BsPrinter } from 'react-icons/bs';

const AnalyticsSection = ({ stats }) => {
    const cardBg = useColorModeValue('white', 'gray.700');

    return (
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
            <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="sm">
                <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">User Statistics</Heading>
                    <Flex gap={2}>
                        <Button size="sm" colorScheme="green" variant="outline">Export</Button>
                        <Button size="sm" colorScheme="blue" variant="outline" leftIcon={<BsPrinter />}>Print</Button>
                    </Flex>
                </Flex>
                <Box h="250px" bg={useColorModeValue('gray.100', 'gray.600')} borderRadius="md">
                    {/* Placeholder for a chart */}
                </Box>
            </Box>
            <Flex direction="column" bg="blue.600" color="white" p={6} borderRadius="lg" boxShadow="sm">
                <Flex justify="space-between" align="start">
                    <Box>
                        <Heading size="md">Pay Outs</Heading>
                        <Text color="blue.200">June 30 - July 15</Text>
                    </Box>
                    <Button size="sm" colorScheme="blue" variant="solid" bg="blue.500" _hover={{ bg: 'blue.400' }} rightIcon={<FaAngleDown />}>Export</Button>
                </Flex>
                <Spacer />
                <Heading size="2xl">{stats.totalPayouts.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</Heading>
            </Flex>
        </Grid>
    );
};

export default AnalyticsSection;