// In frontend/src/components/VendorDashboardHeader.jsx

import React from 'react';
import { 
    Flex, InputGroup, InputLeftElement, Input, IconButton, 
    Text, useColorModeValue, Button, VStack, useToast, // <-- Added VStack and useToast
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FaRegUserCircle } from 'react-icons/fa';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { HiOutlineMail } from 'react-icons/hi';
import { useAuth } from '../../AppContext'; // Adjust path
import { useNavigate } from 'react-router-dom';

const VendorDashboardHeader = () => {
    const { user } = useAuth();
    const cardBg = useColorModeValue('white', 'gray.700');
    const navigate = useNavigate();
    const toast = useToast(); // Initialize the toast hook

    // This function handles copying the ID to the clipboard
    const handleCopyId = () => {
        // IMPORTANT: Assumes your user object has an 'id' property.
        // It might be user.vendor_id, user.user_id, etc. Adjust if needed.
        if (!user?.id) return; 

        navigator.clipboard.writeText(user.id).then(() => {
            // Show a success toast notification
            toast({
                title: 'ID Copied!',
                description: `${user.id} has been copied to your clipboard.`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        }).catch(err => {
            console.error("Failed to copy ID: ", err);
            toast({
                title: 'Copy Failed',
                description: 'Could not copy the ID to your clipboard.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        });
    };

    return (
        <Flex justify="space-between" align="center" mb={8}>
            <InputGroup w={{ base: '100%', md: 'sm' }}>
                <InputLeftElement pointerEvents="none" children={<SearchIcon color="gray.400" />} />
                <Input type="text" placeholder="Search..." bg={cardBg} borderRadius="md" />
            </InputGroup>

            <Flex align="center" gap={4}>
                <Button colorScheme="purple" onClick={() => navigate('/vendor/wallet')}>Wallet</Button>
                <IconButton variant="ghost" aria-label="Mail" icon={<HiOutlineMail size={24} />} />
                <IconButton variant="ghost" aria-label="Notifications" icon={<IoMdNotificationsOutline size={24} />} />
                
                {/* --- UPDATED SECTION --- */}
                <Flex align="center" gap={3}>
                    <FaRegUserCircle size={32} />
                    <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold" display={{ base: 'none', sm: 'block' }}>
                            Hello, {user?.email.split('@')[0] || 'Vendor'}
                        </Text>
                        {/* This is the new line for the vendor ID */}
                        {user?.id && (
                            <Text 
                                fontSize="xs" 
                                color="gray.500" 
                                cursor="pointer"
                                onClick={handleCopyId}
                                _hover={{ color: 'blue.400' }}
                                title="Click to copy ID"
                            >
                                ID: {user.id}
                            </Text>
                        )}
                    </VStack>
                </Flex>
                {/* --- END OF UPDATED SECTION --- */}

            </Flex>
        </Flex>
    );
};

export default VendorDashboardHeader;