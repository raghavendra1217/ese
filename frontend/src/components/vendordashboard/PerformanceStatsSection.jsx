import React from 'react';
import { Box, Flex, Heading, Text, useColorModeValue } from '@chakra-ui/react';
// --- REMOVED: No longer importing Grid or StatCard ---

const PerformanceStatsSection = () => {
    const textColor = useColorModeValue('gray.800', 'white');
    const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');

    return (
        <Box as="section" mb={8}>
            {/* --- UPDATED: The Flex container is now the main component structure --- */}
            <Flex justify="space-between" align="center" mb={4}>
                <Box>
                    <Heading as="h1" size="xl" color={textColor}>Vendor Dashboard</Heading>
                    <Text color={secondaryTextColor}>Your Trading and Wallet Overview</Text>
                </Box>
            </Flex>
            {/* --- REMOVED: The <Grid> component and all StatCards have been deleted --- */}
        </Box>
    );
};

export default PerformanceStatsSection;