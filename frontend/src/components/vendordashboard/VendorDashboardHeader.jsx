import React from 'react';
import {
    Flex, InputGroup, InputLeftElement, Input,
    Text, useColorModeValue, Button, VStack, useToast,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    useDisclosure, Box, HStack, useClipboard
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FaRegUserCircle } from 'react-icons/fa';
// --- 1. Import the 'logout' function from your context ---
import { useAuth } from '../../AppContext';
import { useNavigate } from 'react-router-dom';

// --- 2. UPDATED Modal Component ---
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
                        <Box p={3} bg={linkBg} borderRadius="md" w="full">
                            <HStack justify="space-between" align="center">
                                <Text fontFamily="monospace" fontSize="sm" noOfLines={1} title={referralLink}>
                                    {referralLink}
                                </Text>
                                <Button onClick={onCopy} size="sm" colorScheme={hasCopied ? "green" : "teal"}>
                                    {hasCopied ? "Copied!" : "Copy Link"}
                                </Button>
                            </HStack>
                        </Box>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button colorScheme="gray" mr={3} onClick={onClose}>Cancel</Button>
                    {/* This button now triggers the logout and redirect */}
                    <Button colorScheme="blue" onClick={onRegisterAndLogout}>
                        Logout & Register
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};


const VendorDashboardHeader = () => {
    // --- 3. Get the 'logout' function from useAuth ---
    const { user, logout } = useAuth();
    const cardBg = useColorModeValue('white', 'gray.700');
    const navigate = useNavigate();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const handleCopyId = () => {
        if (!user?.id) return;
        navigator.clipboard.writeText(user.id).then(() => {
            toast({ /* ... toast options ... */ });
        }).catch(err => {
            console.error("Failed to copy ID: ", err);
            toast({ /* ... error toast ... */ });
        });
    };

    const referralLink = user?.id ? `https://esepapertrading.onrender.com/register?ref=${user.id}` : '';

    // --- 4. NEW: Handler for the "Register & Logout" button ---
    const handleRegisterAndLogout = () => {
        logout(); // Log out the current user
        // Redirect the browser to the referral link.
        // We use window.location.href for a full page reload, which is good after a logout.
        window.location.href = referralLink;
    };

    return (
        <>
            <Flex justify="space-between" align="center" mb={8}>
                <InputGroup w={{ base: '100%', md: 'sm' }}>
                    <InputLeftElement pointerEvents="none" children={<SearchIcon color="gray.400" />} />
                    <Input type="text" placeholder="Search..." bg={cardBg} borderRadius="md" />
                </InputGroup>

                <Flex align="center" gap={4}>
                    <Button colorScheme="purple" onClick={() => navigate('/vendor/wallet')}>Wallet</Button>
                    
                    {/* --- 5. UPDATED Button: "Add Member" opens the modal --- */}
                    {user?.id && (
                        <Button colorScheme="blue" onClick={onOpen}>
                            Add Member
                        </Button>
                    )}
                    
                    <Flex align="center" gap={3}>
                        <FaRegUserCircle size={32} />
                        <VStack align="start" spacing={0}>
                            <Text fontWeight="semibold" display={{ base: 'none', sm: 'block' }}>
                                Hello, {user?.email?.split('@')[0] || 'Vendor'}
                            </Text>
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
                </Flex>
            </Flex>

            {/* --- 6. Render the updated Modal component --- */}
            <AddMemberModal 
                isOpen={isOpen}
                onClose={onClose}
                referralLink={referralLink}
                onRegisterAndLogout={handleRegisterAndLogout}
            />
        </>
    );
};

export default VendorDashboardHeader;


// import React from 'react';
// import {
//     Flex, InputGroup, InputLeftElement, Input,
//     Text, useColorModeValue, Button, VStack, useToast,
//     // 1. Import all necessary components for the modal feature
//     Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
//     useDisclosure, Box, HStack, useClipboard
// } from '@chakra-ui/react';
// import { SearchIcon } from '@chakra-ui/icons';
// import { FaRegUserCircle } from 'react-icons/fa';
// import { useAuth } from '../../AppContext';
// import { useNavigate } from 'react-router-dom';

// // 2. A self-contained modal component for sharing the referral link
// const ShareModal = ({ isOpen, onClose, referralLink }) => {
//     const { onCopy, hasCopied } = useClipboard(referralLink);
//     const linkBg = useColorModeValue('gray.100', 'gray.600');

//     return (
//         <Modal isOpen={isOpen} onClose={onClose} isCentered>
//             <ModalOverlay />
//             <ModalContent>
//                 <ModalHeader>Share Your Referral Link</ModalHeader>
//                 <ModalCloseButton />
//                 <ModalBody>
//                     <VStack spacing={4}>
//                         <Text>Share this link with new vendors. You will be credited as their referrer when they sign up.</Text>
//                         <Box p={3} bg={linkBg} borderRadius="md" w="full">
//                             <HStack justify="space-between" align="center">
//                                 <Text fontFamily="monospace" fontSize="sm" noOfLines={1} title={referralLink}>
//                                     {referralLink}
//                                 </Text>
//                                 <Button onClick={onCopy} size="sm" colorScheme={hasCopied ? "green" : "blue"}>
//                                     {hasCopied ? "Copied!" : "Copy"}
//                                 </Button>
//                             </HStack>
//                         </Box>
//                     </VStack>
//                 </ModalBody>
//                 <ModalFooter>
//                     <Button colorScheme="gray" onClick={onClose}>Close</Button>
//                 </ModalFooter>
//             </ModalContent>
//         </Modal>
//     );
// };


// const VendorDashboardHeader = () => {
//     const { user } = useAuth();
//     const cardBg = useColorModeValue('white', 'gray.700');
//     const navigate = useNavigate();
//     const toast = useToast();
//     // 3. Initialize disclosure hook for the modal
//     const { isOpen, onOpen, onClose } = useDisclosure();

//     const handleCopyId = () => {
//         if (!user?.id) return;
//         navigator.clipboard.writeText(user.id).then(() => {
//             toast({
//                 title: 'ID Copied!',
//                 description: `${user.id} has been copied to your clipboard.`,
//                 status: 'success',
//                 duration: 3000,
//                 isClosable: true,
//             });
//         }).catch(err => {
//             console.error("Failed to copy ID: ", err);
//             toast({
//                 title: 'Copy Failed',
//                 description: 'Could not copy the ID to your clipboard.',
//                 status: 'error',
//                 duration: 3000,
//                 isClosable: true,
//             });
//         });
//     };

//     // 4. Construct the referral link with the correct '?ref=' query parameter format
//     const referralLink = user?.id ? `https://esepapertrading.onrender.com/register?ref=${user.id}` : '';

//     return (
//         <>
//             <Flex justify="space-between" align="center" mb={8}>
//                 <InputGroup w={{ base: '100%', md: 'sm' }}>
//                     <InputLeftElement pointerEvents="none" children={<SearchIcon color="gray.400" />} />
//                     <Input type="text" placeholder="Search..." bg={cardBg} borderRadius="md" />
//                 </InputGroup>

//                 <Flex align="center" gap={4}>
//                     <Button colorScheme="purple" onClick={() => navigate('/vendor/wallet')}>Wallet</Button>
                    
//                     {/* 5. The "Share" button opens the modal */}
//                     {user?.id && (
//                         <Button colorScheme="blue" onClick={onOpen}>
//                             Share
//                         </Button>
//                     )}
                    
//                     {/* The mail and notification icons have been removed */}
                    
//                     <Flex align="center" gap={3}>
//                         <FaRegUserCircle size={32} />
//                         <VStack align="start" spacing={0}>
//                             <Text fontWeight="semibold" display={{ base: 'none', sm: 'block' }}>
//                                 Hello, {user?.email?.split('@[')[0] || 'Vendor'}
//                             </Text>
//                             {user?.id && (
//                                 <Text 
//                                     fontSize="xs" 
//                                     color="gray.500" 
//                                     cursor="pointer"
//                                     onClick={handleCopyId}
//                                     _hover={{ color: 'blue.400' }}
//                                     title="Click to copy ID"
//                                 >
//                                     ID: {user.id}
//                                 </Text>
//                             )}
//                         </VStack>
//                     </Flex>
//                 </Flex>
//             </Flex>

//             {/* 6. Render the ShareModal component and pass it the required props */}
//             <ShareModal 
//                 isOpen={isOpen}
//                 onClose={onClose}
//                 referralLink={referralLink}
//             />
//         </>
//     );
// };

// export default VendorDashboardHeader;