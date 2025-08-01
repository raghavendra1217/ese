// components/dashboard/ManagePercentageSection.jsx
import React, { useState } from 'react';
import { Box, Heading, Text, Button, useColorModeValue } from '@chakra-ui/react';
import ManagePercentageModal from './ManagePercentageModal'; // We will create this next

const ManagePercentageSection = ({ url }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const cardBg = useColorModeValue('white', 'gray.700');

    return (
        <>
            <Box p={5} bg={cardBg} borderRadius="lg" shadow="md">
                <Heading size="md" mb={2}>Manage Referral %</Heading>
                <Text fontSize="sm" color="gray.500" mb={4}>
                    Update the commission percentage for each active referral wallet.
                </Text>
                <Button colorScheme="purple" onClick={() => setIsModalOpen(true)}>
                    Open Manager
                </Button>
            </Box>

            <ManagePercentageModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                url={url} 
            />
        </>
    );
};

export default ManagePercentageSection;