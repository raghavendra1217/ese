import React from 'react';
import { Box, Heading, Text, Center, Spinner, useColorModeValue } from '@chakra-ui/react';

const WidgetCard = ({ title, children, isLoading, error, height = 'auto' }) => {
    const cardBg = useColorModeValue('white', 'gray.800');
    const textColor = useColorModeValue('gray.600', 'gray.400');

    return (
        <Box
            bg={cardBg}
            p={{ base: 4, md: 6 }}
            borderRadius="lg"
            boxShadow="md"
            h={height}
        >
            <Heading size="md" mb={4}>{title}</Heading>
            {isLoading ? (
                <Center h="100px">
                    <Spinner size="lg" color="blue.500" />
                </Center>
            ) : error ? (
                <Center h="100px">
                    <Text color="red.500">{error}</Text>
                </Center>
            ) : (
                children
            )}
        </Box>
    );
};

export default WidgetCard;