import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Flex, VStack, Heading, Text, Spinner, Alert, AlertIcon, SimpleGrid,
    Container, Image, Button, useDisclosure, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalBody, ModalFooter, ModalCloseButton, IconButton, Drawer, DrawerOverlay, DrawerContent, DrawerBody,
    HStack, useToast, FormControl, FormLabel, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
    Divider, Badge, useColorModeValue, Center
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';
import { useNavigate } from 'react-router-dom';
import { HamburgerIcon } from '@chakra-ui/icons';
import VendorNavBar from '../../components/layout/VendorNavBar';

// --- Modal Component for Wild Product Purchase Flow ---
const WildProductPurchaseModal = ({ isOpen, onClose, wildProduct, onSuccess, url, walletBalance }) => {
    const { token } = useAuth();
    const toast = useToast();

    const [quantity, setQuantity] = useState("1"); // string state for display
    const [isLoading, setIsLoading] = useState(false);

    // Reset quantity when modal opens
    useEffect(() => {
        if (isOpen) setQuantity("1"); // reset when modal opens
    }, [isOpen]);

    const handlePurchase = async () => {
        if (!wildProduct) return;

        setIsLoading(true);
        try {
            const numericQuantity = parseInt(quantity, 10) || 0;
            const response = await fetch(`${url}/api/wild-products/purchase`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    wildProductId: wildProduct.wild_product_id,
                    quantity: numericQuantity
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Purchase failed');
            }

            toast({
                title: 'Purchase Successful!',
                description: `You have successfully purchased ${numericQuantity} units of ${wildProduct.product_name}`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            onClose();
            onSuccess(); // Refresh the wild products list

        } catch (error) {
            console.error('Purchase error:', error);
            toast({
                title: 'Purchase Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!wildProduct) return null;

    // convert string -> number for calculations
    const numericQuantity = parseInt(quantity, 10) || 0;
    const totalCost = numericQuantity * (Number(wildProduct.final_price) || 0);
    const hasEnoughFunds = walletBalance >= totalCost;

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader fontWeight="bold">Buy Wild Product: {wildProduct.product_name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={3}>
                        <Box textAlign="center">
                            <Image 
                                src={wildProduct.product_image_url} 
                                alt={wildProduct.product_name}
                                boxSize="120px"
                                objectFit="cover"
                                borderRadius="md"
                                mx="auto"
                                fallbackSrc="https://via.placeholder.com/120"
                            />
                        </Box>
                        
                        <Text fontWeight="bold">Price per Unit: ₹{wildProduct.final_price}</Text>
                        <Text fontSize="sm" color="gray.600">Base Price: ₹{wildProduct.base_price}</Text>
                        <Text fontSize="sm" color="gray.600">Selling Price: ₹{wildProduct.selling_price}</Text>
                        <Text fontSize="sm" color="gray.600">GST ({wildProduct.gst_percentage}%): ₹{(wildProduct.base_price * wildProduct.gst_percentage / 100).toFixed(2)}</Text>
                        <Text fontSize="sm" fontWeight="bold" color={wildProduct.profit >= 0 ? "green.500" : "red.500"}>
                            Profit: ₹{wildProduct.profit?.toFixed(2) || '0.00'}
                        </Text>
                        
                        <FormControl>
                            <FormLabel fontWeight="bold">Quantity to Buy:</FormLabel>
                            <NumberInput
                                min={1}
                                max={wildProduct.available_stock || 1}
                                value={quantity === "0" ? "" : quantity} // show "" instead of 0
                                onChange={(valString) => setQuantity(valString)} // keep string
                            >
                                <NumberInputField placeholder="Enter quantity" />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        </FormControl>
                        
                        <Divider my={2} />
                        <Heading size="md" fontWeight="bold">Total Cost: ₹{totalCost.toFixed(2)}</Heading>
                        <Text fontSize="sm" color="gray.500" fontWeight="bold">
                            Your Wallet Balance: ₹{walletBalance.toFixed(2)}
                        </Text>
                        {!hasEnoughFunds && (
                            <Text color="red.500" fontSize="sm" fontWeight="bold">
                                You have insufficient funds in your wallet.
                            </Text>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button
                        colorScheme="purple"
                        onClick={handlePurchase}
                        isLoading={isLoading}
                        loadingText="Processing..."
                        isDisabled={!hasEnoughFunds || numericQuantity <= 0}
                        w="full"
                    >
                        Pay with Wallet
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

// --- Wild Product Card Component ---
const WildProductCard = ({ wildProduct, onBuyClick, url }) => {
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    return (
        <Box 
            borderWidth="1px" 
            borderRadius="lg" 
            overflow="hidden" 
            bg={cardBg}
            borderColor={borderColor}
            _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
            transition="all 0.2s"
        >
            <Image 
                src={wildProduct.product_image_url} 
                alt={wildProduct.product_name} 
                h="200px" 
                w="200px" 
                objectFit="cover" 
                fallbackSrc='https://via.placeholder.com/200' 
            />
            <Box p={6}>
                <Heading size="md" mb={2}>{wildProduct.product_name}</Heading>
                
                <VStack spacing={2} align="stretch" mb={4}>
                    <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">Base Price:</Text>
                        <Text fontSize="sm">₹{wildProduct.base_price}</Text>
                    </HStack>
                    <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">Selling Price:</Text>
                        <Text fontSize="sm">₹{wildProduct.selling_price}</Text>
                    </HStack>
                    <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">GST ({wildProduct.gst_percentage}%):</Text>
                        <Text fontSize="sm">₹{(wildProduct.base_price * wildProduct.gst_percentage / 100).toFixed(2)}</Text>
                    </HStack>
                    <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">Final Price:</Text>
                        <Text fontSize="lg" fontWeight="bold" color="green.500">₹{wildProduct.final_price}</Text>
                    </HStack>
                    <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">Profit:</Text>
                        <Text fontSize="sm" fontWeight="bold" color={wildProduct.profit >= 0 ? "green.500" : "red.500"}>
                            ₹{wildProduct.profit?.toFixed(2) || '0.00'}
                        </Text>
                    </HStack>
                </VStack>

                <HStack justify="space-between" mb={4}>
                    <Text fontSize="sm">Available:</Text>
                    <Badge colorScheme={wildProduct.available_stock > 0 ? 'green' : 'red'}>
                        {wildProduct.available_stock} units
                    </Badge>
                </HStack>

                <HStack justify="space-between" mb={4}>
                    <Text fontSize="sm">Selling Days:</Text>
                    <Badge colorScheme="blue">{wildProduct.selling_date_count || 30} days</Badge>
                </HStack>

                <Button 
                    w="full" 
                    colorScheme="blue" 
                    onClick={() => onBuyClick(wildProduct)}
                    isDisabled={wildProduct.available_stock === 0}
                >
                    {wildProduct.available_stock === 0 ? 'Out of Stock' : 'Buy Now'}
                </Button>
            </Box>
        </Box>
    );
};

const DESKTOP_SIDEBAR_WIDTH = '200px';

// --- Main Wild Product Trading Page Component ---
const WildProductTradingPage = ({ url }) => {
    const { token } = useAuth();
    const toast = useToast();
    const [wildProducts, setWildProducts] = useState([]);
    const [selectedWildProduct, setSelectedWildProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [walletBalance, setWalletBalance] = useState(0);
    const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
    const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();

    // Color mode values
    const mainBg = useColorModeValue('gray.50', '#181C27');
    const sidebarBg = '#212734';
    const sidebarBorder = 'gray.700';
    const headingColor = useColorModeValue('gray.800', 'gray.200');
    const iconColor = useColorModeValue('black', 'whiteAlpha.900');

    const fetchWildProducts = useCallback(async () => {
        setLoading(true);
        if (!token) { 
            setError("You must be logged in."); 
            setLoading(false); 
            return; 
        }
        try {
            const [wildProductsRes, walletRes] = await Promise.all([
                fetch(`${url}/api/wild-products/available`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${url}/api/wallet`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (!wildProductsRes.ok) throw new Error('Failed to fetch wild products.');
            if (!walletRes.ok) throw new Error('Failed to fetch wallet balance.');
            const wildProductsData = await wildProductsRes.json();
            const walletData = await walletRes.json();
            
            // Handle new API response structure with time constraints
            if (wildProductsData.success === false) {
                // Wild products not available due to time constraints
                toast({ 
                    title: 'Wild Products Not Available', 
                    description: wildProductsData.message, 
                    status: 'warning', 
                    isClosable: true,
                    duration: 5000
                });
                setWildProducts([]);
            } else {
                // Wild products available - extract from new response structure
                setWildProducts(wildProductsData.products || wildProductsData || []);
            }
            setWalletBalance(walletData.digital_money || 0);
        } catch (err) { 
            setError(err.message); 
        } finally { 
            setLoading(false); 
        }
    }, [token, url, toast]);


    useEffect(() => {
        fetchWildProducts();
    }, [token, fetchWildProducts]);

    const handleBuyClick = (wildProduct) => {
        setSelectedWildProduct(wildProduct);
        onModalOpen();
    };

    return (
        <Flex minH="100vh" bg={mainBg}>
            {/* Sidebar (desktop only) */}
            <Box 
                as="nav" 
                pos="fixed" 
                top="0" 
                left="0" 
                zIndex="sticky" 
                h="full" 
                w={DESKTOP_SIDEBAR_WIDTH} 
                bg={sidebarBg} 
                borderRight="1px" 
                borderColor={sidebarBorder} 
                display={{ base: 'none', md: 'block' }}
            >
                <VendorNavBar />
            </Box>

            {/* Drawer (mobile nav) */}
            <Drawer isOpen={isDrawerOpen} placement="left" onClose={onDrawerClose}>
                <DrawerOverlay />
                <DrawerContent bg={sidebarBg} w={DESKTOP_SIDEBAR_WIDTH}>
                    <DrawerBody p={0}>
                        <VendorNavBar onLinkClick={onDrawerClose} />
                    </DrawerBody>
                </DrawerContent>
            </Drawer>

            {/* Main content */}
            <Box flex="1" ml={{ base: 0, md: DESKTOP_SIDEBAR_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
                {/* Mobile header */}
                <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
                    <IconButton
                        aria-label="Open menu"
                        icon={<HamburgerIcon w={5} h={5} />}
                        onClick={onDrawerOpen}
                        size="sm"
                        variant="ghost"
                        color={iconColor}
                        p={1}
                        mt="-1"
                        _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.200' } }}
                    />
                    <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">
                        Wild Products
                    </Heading>
                </Flex>

                {/* Desktop title */}
                <Heading as="h1" fontSize="2xl" color={headingColor} mb={6} display={{ base: 'none', md: 'block' }}>
                    Wild Products Trading
                </Heading>

                {loading && wildProducts.length === 0 ? (
                    <Center py={20}>
                        <Spinner size="xl" />
                    </Center>
                ) : error ? (
                    <Container centerContent>
                        <Alert status="error" mt="20">
                            <AlertIcon />
                            {error}
                        </Alert>
                    </Container>
                ) : wildProducts.length === 0 ? (
                    <Container centerContent py={20}>
                        <VStack spacing={6} textAlign="center">
                            <Box fontSize="6xl">📦</Box>
                            <VStack spacing={3}>
                                <Heading size="lg" color={headingColor}>
                                    No Wild Products Available
                                </Heading>
                                <Text color="gray.600" fontSize="lg">
                                    Coming Soon! Please try again later.
                                </Text>
                                <Text color="gray.500" fontSize="sm">
                                    We're working on adding exciting new wild products for you.
                                </Text>
                            </VStack>
                            <Button 
                                colorScheme="blue" 
                                variant="outline" 
                                onClick={fetchWildProducts}
                                isLoading={loading}
                            >
                                Refresh
                            </Button>
                        </VStack>
                    </Container>
                ) : (
                    <Container maxW="container.xl" py={4}>
                        <Text mb={6} color="gray.600">
                            Discover our exclusive wild products with automatic GST calculation and wallet-only payments.
                        </Text>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                            {wildProducts.map(wildProduct => (
                                <WildProductCard
                                    key={wildProduct.wild_product_id}
                                    wildProduct={wildProduct}
                                    onBuyClick={handleBuyClick}
                                    url={url}
                                />
                            ))}
                        </SimpleGrid>
                    </Container>
                )}

                {selectedWildProduct && (
                    <WildProductPurchaseModal
                        isOpen={isModalOpen}
                        onClose={onModalClose}
                        wildProduct={selectedWildProduct}
                        onSuccess={fetchWildProducts}
                        url={url}
                        walletBalance={walletBalance}
                    />
                )}
            </Box>
        </Flex>
    );
};

export default WildProductTradingPage;
