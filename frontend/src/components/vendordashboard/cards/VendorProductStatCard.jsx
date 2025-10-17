// // import React from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import { Flex, Box, Text, Heading, Button, useColorModeValue } from '@chakra-ui/react';

// // const VendorProductStatCard = ({ value }) => {
// //     const cardBg = useColorModeValue('white', 'gray.700');
// //     const valueColor = useColorModeValue('gray.900', 'white');
// //     const navigate = useNavigate();
    
    
// //     return (
// //         <Flex bg={cardBg} p={4} borderRadius="lg" boxShadow="sm" direction="column" justify="space-between" minH="130px">
// //             <Box>
// //                 <Text fontSize="sm" color="gray.500">Products Available to Buy</Text>
// //                 <Heading size="md" color={valueColor}>{value.toLocaleString()}</Heading>
// //             </Box>
// //             <Button colorScheme="blue" w="full" mt={2} onClick={() => navigate('/vendor/products')}>
// //                 View Products
// //             </Button>
// //         </Flex>
// //     );
// // };

// // export default VendorProductStatCard;



// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// // 1. Import the Icon component from Chakra UI
// import { Flex, Box, Text, Heading, Button, useColorModeValue, Icon } from '@chakra-ui/react';
// // 2. Import a suitable product icon from react-icons
// import { BsBoxSeam } from 'react-icons/bs';

// const VendorProductStatCard = ({ value }) => {
//     const cardBg = useColorModeValue('white', 'gray.700');
//     const valueColor = useColorModeValue('gray.900', 'white');
//     const iconBg = useColorModeValue('blue.100', 'blue.800');
//     const iconColor = useColorModeValue('blue.500', 'blue.300');
//     const navigate = useNavigate();
    
    
//     return (
//         <Flex
//             bg={cardBg}
//             p={4}
//             borderRadius="lg"
//             boxShadow="sm"
//             direction="column"
//             justify="space-between"
//             minH="150px" // Slightly increased height for better spacing
//         >
//             {/* 3. This Flex row now holds both the text and the icon */}
//             <Flex justify="space-between" align="flex-start">
//                 <Box>
//                     <Text fontSize="sm" color="gray.500">Products Available to Buy</Text>
//                     <Heading size="lg" color={valueColor} mt={1}>{value.toLocaleString()}</Heading>
//                 </Box>
                
//                 {/* 4. Styled container for the icon */}
//                 <Flex
//                     align="center"
//                     justify="center"
//                     bg={iconBg}
//                     borderRadius="full"
//                     w="48px"
//                     h="48px"
//                 >
//                     <Icon as={BsBoxSeam} color={iconColor} w={6} h={6} />
//                 </Flex>
//             </Flex>
            
//             <Button colorScheme="blue" w="full" mt={4} onClick={() => navigate('/vendor/products')}>
//                 View Products
//             </Button>
//         </Flex>
//     );
// };

// export default VendorProductStatCard;



// File: src/components/vendor/cards/VendorProductStatCard.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flex, Box, Text, Heading, Button, useColorModeValue, Icon } from '@chakra-ui/react';
import { BsBoxSeam } from 'react-icons/bs';

const VendorProductStatCard = ({ value }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const valueColor = useColorModeValue('gray.900', 'white');
    const iconBg = useColorModeValue('blue.100', 'blue.800');
    const iconColor = useColorModeValue('blue.500', 'blue.300');
    const navigate = useNavigate();
    
    return (
        <Flex
            bg={cardBg}
            p={4}
            borderRadius="lg"
            boxShadow="sm"
            direction="column"
            justify="space-between"
            minH="150px"
        >
            {/* This Flex row correctly holds both the text and the icon */}
            <Flex justify="space-between" align="flex-start">
                <Box>
                    <Text fontSize="sm" color="gray.500">Products Available to Buy</Text>
                    <Heading size="lg" color={valueColor} mt={1}>{value.toLocaleString()}</Heading>
                </Box>
                
                {/* This container correctly places the icon on the TOP RIGHT */}
                <Flex
                    align="center"
                    justify="center"
                    bg={iconBg}
                    borderRadius="full"
                    w="48px"
                    h="48px"
                >
                    <Icon as={BsBoxSeam} color={iconColor} w={6} h={6} />
                </Flex>
            </Flex>
            
            <Button colorScheme="blue" w="full" mt={4} onClick={() => navigate('/vendor/products')}>
                View Products
            </Button>
        </Flex>
    );
};

export default VendorProductStatCard;