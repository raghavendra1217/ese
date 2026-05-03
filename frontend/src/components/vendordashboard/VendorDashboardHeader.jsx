import React, { useState, useEffect } from 'react';
import {
    Flex,
    Text,
    useColorModeValue,
    VStack,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Box,
    HStack,
    useClipboard,
    Button,
    Avatar,
    Heading,
    Grid,
    GridItem,
    Icon, // Import Icon component
    Image,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaWallet, FaUserPlus, FaWhatsapp, FaShoppingCart } from 'react-icons/fa';
import { useAuth } from '../../AppContext';
import axios from 'axios';
import ProductRequestModal from '../vendor/ProductRequestModal';

// AddMemberModal component (no changes)
const AddMemberModal = ({ isOpen, onClose, referralLink, onRegisterAndLogout }) => {
    const { onCopy, hasCopied } = useClipboard(referralLink);
    const linkBg = useColorModeValue('gray.100', 'gray.700');

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Add a New Member</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <Text textAlign="center">
                            Copy the referral link to invite a new vendor or log out to register one yourself.
                        </Text>
                        <Box p={3} bg={linkBg} borderRadius="md" w="full">
                            <HStack justify="space-between">
                                <Text fontFamily="monospace" fontSize="sm" noOfLines={1} title={referralLink} w="80%">
                                    {referralLink}
                                </Text>
                                <Button onClick={onCopy} size="sm" colorScheme={hasCopied ? 'green' : 'gray'}>
                                    {hasCopied ? 'Copied!' : 'Copy'}
                                </Button>
                            </HStack>
                        </Box>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button colorScheme="blue" onClick={onRegisterAndLogout}>
                        Logout & Register
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};


const VendorDashboardHeader = ({ url }) => {
    const { user, logout, token } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isProductRequestOpen, onOpen: onProductRequestOpen, onClose: onProductRequestClose } = useDisclosure();
    
    // Debug logging for modal state
    useEffect(() => {
        console.log('=== MODAL STATE CHANGED ===');
        console.log('Modal isOpen:', isOpen);
        console.log('handleRegisterAndLogout function exists:', !!handleRegisterAndLogout);
        console.log('Function type:', typeof handleRegisterAndLogout);
    }, [isOpen]);
    const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');
    const mobileButtonBg = useColorModeValue('gray.100', 'gray.700');
    const [photoUrl, setPhotoUrl] = useState(null);
    const [currentBalance, setCurrentBalance] = useState(0);

    useEffect(() => {
        const fetchPhotoUrl = async () => {
            if (!token) return;
            try {
                const res = await axios.get(`${url}/api/vendor/profile/photo-url`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setPhotoUrl(res.data.passportPhotoUrl);
            } catch (error) {
                console.error("Failed to fetch photo URL for header", error);
            }
        };
        fetchPhotoUrl();
    }, [token, url]);

    // Fetch current wallet balance
    const fetchCurrentBalance = async () => {
        if (!token) return;
        try {
            const response = await fetch(`${url}/api/wallet`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCurrentBalance(parseFloat(data.digital_money || 0));
            }
        } catch (error) {
            console.error('Failed to fetch wallet balance:', error);
        }
    };

    useEffect(() => {
        fetchCurrentBalance();
    }, [token, url]);

    const referralLink = user?.id ? `https://naviu.onrender.com/register?ref=${user.id}` : '';
    
    // Debug logging
    console.log('User object:', user);
    console.log('User ID:', user?.id);
    console.log('Referral link:', referralLink);

    const handleCopyId = () => {
        if (user?.id) {
            navigator.clipboard.writeText(user.id);
            toast({
                title: "ID Copied!",
                description: "Your referral ID has been copied to clipboard",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleRegisterAndLogout = () => {
        console.log('=== handleRegisterAndLogout FUNCTION CALLED ===');
        console.log('User object:', user);
        console.log('User ID:', user?.id);
        console.log('Token exists:', !!token);
        console.log('Referral link:', referralLink);
        console.log('Logging out and redirecting to register page...');
        
        try {
            logout();
            console.log('Logout successful, redirecting...');
            // Use the dynamic referral link instead of hardcoded URL
            const redirectUrl = referralLink || 'https://naviu.onrender.com/register';
            console.log('Redirecting to:', redirectUrl);
            window.location.href = redirectUrl;
        } catch (error) {
            console.error('Error in handleRegisterAndLogout:', error);
        }
    };

    const supportWhatsApp = process.env.REACT_APP_SUPPORT_WHATSAPP || '917075923765';

    const openWhatsApp = () => {
        if (!supportWhatsApp) return;
        const txt = `Hi, I have a question. My ID is ${user?.id || 'unknown'}.`;
        const url = `https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(txt)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <>
            <Grid
                templateColumns={{ base: '1fr', md: '1fr auto' }}
                gap={{ base: 4, md: 6 }}
                mb={8}
                w="100%"
                alignItems="center"
            >
                {/* --- Left Side (Unchanged) --- */}
                <GridItem>
                    <VStack align="flex-start" spacing={3}>
                        <HStack spacing={4}>
                            <Avatar size="md" name={user?.vendorName || user?.email} src={photoUrl} />
                            <VStack align="start" spacing={0} maxW="300px">
                                <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" lineHeight="1.2">
                                    Hello, {user?.vendorName || user?.email?.split('@')[0] || 'Vendor'}!
                                </Text>
                                {user?.id && (
                                    <Text fontSize="sm" color="gray.500" cursor="pointer" onClick={handleCopyId} _hover={{ color: 'blue.400' }} title="Click to copy ID" fontWeight="bold">
                                        ID: {user.id}
                                    </Text>
                                )}
                            </VStack>
                        </HStack>
                    </VStack>
                </GridItem>

                {/* --- Right Side: Action Buttons --- */}
                <GridItem justifySelf={{ base: 'stretch', md: 'flex-end' }}>
                    <HStack
                        spacing={2}
                        w={{ base: 'full', md: 'auto' }}
                        bg={{ base: mobileButtonBg, md: 'transparent' }}
                        p={{ base: 2, md: 0 }}
                        borderRadius={{ base: 'lg', md: 0 }}
                    >
                        {/* ✅ FIX: Buttons now stack their content vertically on mobile and share space */}
                        <Button size="md" variant="ghost" onClick={() => navigate('/vendor/wallet')} flex={1} h="auto" py={2}>
                            <VStack spacing={1}>
                                <Icon as={FaWallet} />
                                <Text fontSize="xs">Wallet</Text>
                            </VStack>
                        </Button>
                        <Button size="md" variant="ghost" onClick={onOpen} flex={1} h="auto" py={2}>
                             <VStack spacing={1}>
                                <Icon as={FaUserPlus} />
                                <Text fontSize="xs">Refer</Text>
                            </VStack>
                        </Button>
                        <Button size="md" variant="ghost" colorScheme="whatsapp" onClick={openWhatsApp} flex={1} h="auto" py={2}>
                             <VStack spacing={1}>
                                <Icon as={FaWhatsapp} />
                                <Text fontSize="xs">Chat</Text>
                            </VStack>
                        </Button>
                         <Button size="md" variant="ghost" colorScheme="blue" onClick={onProductRequestOpen} flex={1} h="auto" py={2}>
                             <VStack spacing={1}>
                                 <Icon as={FaShoppingCart} />
                                 <Text fontSize="xs">Request</Text>
                             </VStack>
                         </Button>
                    </HStack>
                </GridItem>
            </Grid>

            <AddMemberModal
                isOpen={isOpen}
                onClose={onClose}
                referralLink={referralLink}
                onRegisterAndLogout={handleRegisterAndLogout}
            />
            
            <ProductRequestModal
                isOpen={isProductRequestOpen}
                onClose={onProductRequestClose}
                url={url}
                currentBalance={currentBalance}
                onRequestSuccess={() => {
                    fetchCurrentBalance();
                    onProductRequestClose();
                }}
            />

        </>
    );
};
export default VendorDashboardHeader;