import React from 'react';
import {
    Box, Flex, InputGroup, InputLeftElement, Input, IconButton,
    Text, useColorModeValue, Tooltip
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
// --- RESOLVED: Kept imports for the new wallet feature ---
import { FaRegUserCircle, FaChartBar, FaWallet } from 'react-icons/fa'; 
import { IoMdNotificationsOutline } from 'react-icons/io';
import { HiOutlineMail } from 'react-icons/hi';
import { Link as RouterLink } from 'react-router-dom';

// --- RESOLVED: Accepted incoming prop 'stats' ---
const DashboardHeader = ({ stats }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    // --- RESOLVED: Kept logic for the notification badge ---
    const hasPendingWalletApprovals = stats?.pendingWalletApprovals > 0;

    return (
        <Flex justify="space-between" align="center" mb={8}>
            <InputGroup w={{ base: '100%', md: 'sm' }}>
                <InputLeftElement pointerEvents="none" children={<SearchIcon color="gray.400" />} />
                <Input type="text" placeholder="Search..." bg={cardBg} borderRadius="md" />
            </InputGroup>

            <Flex align="center" gap={4}>
                <IconButton variant="ghost" aria-label="Mail" icon={<HiOutlineMail size={24} />} />
                <IconButton variant="ghost" aria-label="Notifications" icon={<IoMdNotificationsOutline size={24} />} />
                
                {/* --- RESOLVED: Kept the new Wallet management button --- */}
                <Tooltip label="Manage Wallet Approvals" hasArrow>
                    <Box position="relative">
                        <IconButton
                            as={RouterLink}
                            to="/admin/wallet-approvals" // Links to new page
                            variant="ghost"
                            aria-label="Wallet Approvals"
                            icon={<FaWallet size={20} />}
                        />
                        {/* Notification Badge only appears if there are pending approvals */}
                        {hasPendingWalletApprovals && (
                            <Box
                                as="span"
                                position="absolute"
                                top="1"
                                right="1"
                                fontSize="xs"
                                w={2}
                                h={2}
                                bg="red.500"
                                borderRadius="full"
                            />
                        )}
                    </Box>
                </Tooltip>
                
                <IconButton variant="ghost" aria-label="Analytics" icon={<FaChartBar size={20} />} />
                <Flex align="center" gap={2}>
                    <FaRegUserCircle size={28} />
                    <Text fontWeight="semibold" display={{ base: 'none', sm: 'block' }}>Hello, admin</Text>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default DashboardHeader;