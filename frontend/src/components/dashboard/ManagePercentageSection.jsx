import React from 'react';
import { Box, Heading, Text, Button, useColorModeValue } from '@chakra-ui/react';
// --- NEW: Import Link from react-router-dom ---
import { Link as RouterLink } from 'react-router-dom';

const ManagePercentageSection = () => {
    const cardBg = useColorModeValue('white', 'gray.700');

    // --- REMOVED: All state and modal logic is gone from this component ---

    return (
        <Box p={5} bg={cardBg} borderRadius="lg" shadow="md">
            <Heading size="md" mb={2}>Manage Referral %</Heading>
            <Text fontSize="sm" color="gray.500" mb={4}>
                Update the commission percentage for each active referral wallet.
            </Text>
            {/* --- UPDATED: Button is now a link to the new page --- */}
            <Button
                as={RouterLink}
                to="/admin/manage-percentages"
                colorScheme="purple"
            >
                Open Manager
            </Button>
        </Box>
    );
};



export default ManagePercentageSection;