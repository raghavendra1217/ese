import React from 'react';
import { Flex, Box, Text, Heading, useColorModeValue } from '@chakra-ui/react';

const StatCard = ({ icon, label, value, iconBgColor = 'blue.500' }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const labelColor = useColorModeValue('gray.500', 'gray.400');
    const valueColor = useColorModeValue('gray.900', 'white');

    return (
        <Flex bg={cardBg} p={4} borderRadius="lg" boxShadow="sm" align="center">
            <Box p={3} borderRadius="lg" bg={iconBgColor} color="white" mr={4}>{icon}</Box>
            <Box>
                <Text fontSize="sm" color={labelColor}>{label}</Text>
                <Heading size="md" color={valueColor}>{value}</Heading>
            </Box>
        </Flex>
    );
};

export default StatCard;
