import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Flex, Box, Text, Heading, useColorModeValue } from '@chakra-ui/react';

const StatCard = ({ icon, label, value, iconBgColor = 'blue.500', to = null }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const labelColor = useColorModeValue('gray.500', 'gray.400');
    const valueColor = useColorModeValue('gray.900', 'white');
    
    // Add hover styles only if the card is a link
    const hoverStyles = to ? { transform: 'translateY(-3px)', boxShadow: 'lg', cursor: 'pointer' } : {};

    return (
        <Flex
            as={to ? RouterLink : 'div'}
            to={to}
            bg={cardBg}
            p={4}
            borderRadius="lg"
            boxShadow="sm"
            align="center"
            transition="all 0.2s ease-in-out"
            _hover={hoverStyles}
        >
            <Box p={3} borderRadius="lg" bg={iconBgColor} color="white" mr={4}>
                {icon}
            </Box>
            <Box>
                <Text fontSize="sm" color={labelColor}>{label}</Text>
                <Heading size="md" color={valueColor}>{value}</Heading>
            </Box>
        </Flex>
    );
};

export default StatCard;