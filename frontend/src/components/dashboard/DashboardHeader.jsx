import React from 'react';
import {
    Box, Flex, InputGroup, InputLeftElement, Input, IconButton,
    Text, useColorModeValue, Tooltip,
    // --- 1. UPDATE: Import Button and everything needed for the Modal ---
    Button, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, 
    ModalFooter, ModalBody, ModalCloseButton, VStack, HStack, useClipboard
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FaRegUserCircle, FaChartBar, FaWallet } from 'react-icons/fa'; 
import { IoMdNotificationsOutline } from 'react-icons/io';
import { HiOutlineMail } from 'react-icons/hi';
import { Link as RouterLink } from 'react-router-dom';
// --- 2. UPDATE: Import useAuth to get user info and logout function ---
import { useAuth } from '../../AppContext';

// --- 3. UPDATE: Add the Modal component logic inside this file ---
const AddMemberModal = ({ isOpen, onClose, referralLink, onRegisterAndLogout }) => {
    const { onCopy, hasCopied } = useClipboard(referralLink);
    const linkBg = useColorModeValue('gray.100', 'gray.600');

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Add a New Member</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <Text>Copy the link and send it to a new vendor, or log out and register a new account yourself.</Text>
                        <Box p={3} bg={linkBg} borderRadius="md" w="full" minH="46px">
                            {referralLink && (
                                <HStack justify="space-between" align="center">
                                    <Text fontFamily="monospace" fontSize="sm" noOfLines={1} title={referralLink}>
                                        {referralLink}
                                    </Text>
                                    <Button onClick={onCopy} size="sm" colorScheme={hasCopied ? "green" : "teal"}>
                                        {hasCopied ? "Copied!" : "Copy Link"}
                                    </Button>
                                </HStack>
                            )}
                        </Box>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button colorScheme="gray" mr={3} onClick={onClose}>Cancel</Button>
                    <Button colorScheme="blue" onClick={onRegisterAndLogout}>
                        Logout & Register
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};


const DashboardHeader = ({ stats }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const hasPendingWalletApprovals = stats?.pendingWalletApprovals > 0;
    
    // --- 4. UPDATE: Add the hook to control the modal's state (open/close) ---
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { user, logout } = useAuth();
    const referralLink = `https://esepapertrading.onrender.com/register`;
    const handleRegisterAndLogout = () => {
        logout();
        window.location.href = 'https://esepapertrading.onrender.com/register';
    };

    return (
        // --- 5. UPDATE: Wrap the return in a React Fragment <> ... </> ---
        <>
            <Flex justify="flex-end" align="center" mb={8}>
                {/* <InputGroup w={{ base: '100%', md: 'sm' }}>
                    <InputLeftElement pointerEvents="none" children={<SearchIcon color="gray.400" />} />
                    <Input type="text" placeholder="Search..." bg={cardBg} borderRadius="md" />
                </InputGroup> */}

                <Flex align="center" gap={4}>
                    {/* --- 6. UPDATE: Add the "Add Member" button --- */}
                    <Button colorScheme="blue" onClick={onOpen}>Add Member</Button>

                    {/* <IconButton variant="ghost" aria-label="Mail" icon={<HiOutlineMail size={24} />} />
                    <IconButton variant="ghost" aria-label="Notifications" icon={<IoMdNotificationsOutline size={24} />} />
                     */}
                    <Tooltip label="Manage Wallet Approvals" hasArrow>
                        <Box position="relative">
                            <IconButton as={RouterLink} to="/admin/wallet-approvals" variant="ghost" aria-label="Wallet Approvals" icon={<FaWallet size={20} />} />
                            {hasPendingWalletApprovals && <Box as="span" position="absolute" top="1" right="1" fontSize="xs" w={2} h={2} bg="red.500" borderRadius="full" />}
                        </Box>
                    </Tooltip>
                    
                    {/* <IconButton variant="ghost" aria-label="Analytics" icon={<FaChartBar size={20} />} /> */}
                    <Flex align="center" gap={2}>
                        <FaRegUserCircle size={28} />
                        <Text fontWeight="semibold" display={{ base: 'block' }}>Hello, admin</Text>
                    </Flex>
                </Flex>
            </Flex>
            

            {/* --- 7. UPDATE: Render the modal component --- */}
            <AddMemberModal 
                isOpen={isOpen} 
                onClose={onClose} 
                referralLink={referralLink} 
                onRegisterAndLogout={handleRegisterAndLogout} 
            />
        </>
    );
};

export default DashboardHeader;