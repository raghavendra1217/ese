import React from 'react';
import { Flex, InputGroup, InputLeftElement, Input, IconButton, Text, useColorModeValue, Button } from '@chakra-ui/react';
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
                <Flex align="center" gap={2}>
                    <FaRegUserCircle size={28} />
                    <Text fontWeight="semibold" display={{ base: 'none', sm: 'block' }}>
                        Hello, {user?.email.split('@')[0] || 'Vendor'}
                    </Text>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default VendorDashboardHeader;