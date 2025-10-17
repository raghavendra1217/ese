// import React from 'react';
// import { Link as RouterLink } from 'react-router-dom';
// import { Flex, Box, Text, Heading, useColorModeValue } from '@chakra-ui/react';

// const StatCard = ({ icon, label, value, iconBgColor = 'blue.500', to = null }) => {
//     const cardBg = useColorModeValue('white', 'gray.700');
//     const labelColor = useColorModeValue('gray.500', 'gray.400');
//     const valueColor = useColorModeValue('gray.900', 'white');
    
//     // Add hover styles only if the card is a link
//     const hoverStyles = to ? { transform: 'translateY(-3px)', boxShadow: 'lg', cursor: 'pointer' } : {};

    
//     return (
//         <Flex
//             as={to ? RouterLink : 'div'}
//             to={to}
//             bg={cardBg}
//             p={4}
//             borderRadius="lg"
//             boxShadow="sm"
//             align="center"
//             transition="all 0.2s ease-in-out"
//             _hover={hoverStyles}
//         >
//             <Box p={3} borderRadius="lg" bg={iconBgColor} color="white" mr={4}>
//                 {icon}
//             </Box>
//             <Box>
//                 <Text fontSize="sm" color={labelColor}>{label}</Text>
//                 <Heading size="md" color={valueColor}>{value}</Heading>
//             </Box>
//         </Flex>
//     );
// };

// export default StatCard;


// File: src/components/shared/cards/StatCard.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flex, Box, Text, Heading, useColorModeValue, HStack } from '@chakra-ui/react';

// NOTE: Using useNavigate hook is often cleaner than wrapping the entire component in RouterLink
const StatCard = ({ icon, label, value, iconBgColor = 'blue.500', to = null }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const labelColor = useColorModeValue('gray.500', 'gray.400');
    const valueColor = useColorModeValue('gray.900', 'white');
    const navigate = useNavigate();
    
    // Add hover styles and click handler only if the card is a link
    const linkProps = to ? {
        onClick: () => navigate(to),
        cursor: 'pointer',
        _hover: { transform: 'translateY(-3px)', boxShadow: 'lg' }
    } : {};

    return (
        <Flex
            bg={cardBg}
            p={4}
            borderRadius="lg"
            boxShadow="sm"
            align="center"
            transition="all 0.2s ease-in-out"
            {...linkProps} // Spread the link-related props here
        >
            {/* HStack makes horizontal layout simple */}
            <HStack spacing={4} w="full" align="center">
                {/* 1. Icon Container: Switched to Flex for perfect centering */}
                {icon && (
                    <Flex
                        w="48px"
                        h="48px"
                        align="center"
                        justify="center"
                        borderRadius="md" // 2. Changed to 'md' to match the screenshot's shape
                        bg={iconBgColor}
                        color="white"
                    >
                        {icon}
                    </Flex>
                )}

                {/* 2. Text Content */}
                <Box>
                    <Text fontSize="sm" color={labelColor}>{label}</Text>
                    <Heading size="md" color={valueColor}>{value}</Heading>
                </Box>
            </HStack>
        </Flex>
    );
};

export default StatCard;