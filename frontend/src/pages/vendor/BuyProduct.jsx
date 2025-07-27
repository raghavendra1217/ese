import React, { useState, useEffect } from 'react';
import {
    Box, Flex, VStack, SimpleGrid, Heading, Text, Button, Image, useToast, Spinner, Center,
    useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
    NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Divider,
    FormControl, FormLabel, Input
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

// --- MODAL 2: FOR PAYMENT (FIXED) ---
const PaymentModal = ({ isOpen, onClose, tradeDetails, onPaymentSubmit, isLoading }) => {
    const [transactionId, setTransactionId] = useState('');
    const [paymentScreenshot, setPaymentScreenshot] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setTransactionId('');
            setPaymentScreenshot(null);
        }
    }, [isOpen]);

    // Defensive check: don't render if details are missing.
    if (!tradeDetails) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onPaymentSubmit({ transactionId, paymentScreenshot });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleSubmit}>
                <ModalHeader>Complete Payment</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <Text textAlign="center" fontSize="md">
                            Scan the QR code below to pay the exact amount.
                        </Text>
                        
                        {/* --- FIX #1: Use the correct static image path --- */}
                        <Image
                            w="220px" h="220px"
                            src="/images/payment-qr-code.png"
                            alt="Payment QR Code"
                            border="2px solid" borderColor="gray.300" p={1}
                        />

                        {/* --- FIX #2: Access the correct property for the amount --- */}
                        <Heading size="md" color="teal.500">
                            Total Amount: ₹{tradeDetails.total_amount_paid}
                        </Heading>
                        
                        <FormControl isRequired>
                            <FormLabel>Transaction ID</FormLabel>
                            <Input placeholder="Enter UPI/Bank transaction ID" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Upload Payment Screenshot</FormLabel>
                            <Input type="file" p={1.5} onChange={(e) => setPaymentScreenshot(e.target.files[0])} accept="image/*" />
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isLoading}>Cancel</Button>
                    <Button type="submit" colorScheme="teal" isLoading={isLoading} disabled={!transactionId || !paymentScreenshot}>Submit Payment</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};


// --- MODAL 1: FOR SELECTING QUANTITY (No changes needed, but corrected for safety) ---
const PurchaseModal = ({ isOpen, onClose, product, onProceed }) => {
    const [quantity, setQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => { if (isOpen) setQuantity(1); }, [isOpen]);
    if (!product) {
        console.log("PurchaseModal: No product, not rendering modal");
        return null;
    }
    const totalCost = (quantity * (Number(product.price_per_slot) || 0)).toFixed(2);
    const handleProceedClick = async () => {
        setIsLoading(true);
        await onProceed(quantity);
        setIsLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Buy Stock: {product.paper_type}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch">
                        <Text>Price per Slot: <strong>₹{product.price_per_slot}</strong></Text>
                        <Text>Available Stock: <strong>{product.available_stock}</strong></Text>
                        <FormControl>
                            <FormLabel>Quantity to Buy:</FormLabel>
                            <NumberInput defaultValue={1} min={1} max={product.available_stock} onChange={(val) => setQuantity(parseInt(val, 10) || 1)} value={quantity}>
                                <NumberInputField />
                                <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                            </NumberInput>
                        </FormControl>
                        <Divider my={4} />
                        <Heading size="md">Total Cost: ₹{totalCost}</Heading>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                    <Button colorScheme="teal" isLoading={isLoading} onClick={handleProceedClick}>Proceed to Payment</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};


// --- MAIN PAGE COMPONENT (UPDATED LOGIC) ---
const BuyProduct = ({ url }) => {
    const { token } = useAuth();
    const toast = useToast();
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [activeTradeDetails, setActiveTradeDetails] = useState(null);
    const { isOpen: isPurchaseModalOpen, onOpen: onPurchaseModalOpen, onClose: onPurchaseModalClose } = useDisclosure();
    const { isOpen: isPaymentModalOpen, onOpen: onPaymentModalOpen, onClose: onPaymentModalClose } = useDisclosure();

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${url}/api/products/available`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (!response.ok) throw new Error('Failed to fetch products');
            setProducts(data);
        } catch (error) {
            toast({ title: 'Error', description: error.message, status: 'error', isClosable: true });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchProducts();
    }, [token]);

    const handleBuyClick = (product) => {
        console.log("Buy clicked", product);
        setSelectedProduct(product);
        onPurchaseModalOpen();
    };

    const handleProceedToPayment = async (quantity) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${url}/api/trading/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ productId: selectedProduct.product_id, no_of_stock_bought: quantity })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            // --- FIX #3: Set ONLY the nested tradeDetails object to state ---
            // This cleans up the data and makes it easier for the modal to use.
            setActiveTradeDetails(data.tradeDetails); 
            
            onPurchaseModalClose();
            onPaymentModalOpen();
        } catch (error) {
            toast({ title: 'Initialization Error', description: error.message, status: 'error', isClosable: true });
            onPurchaseModalClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handlePaymentSubmit = async ({ transactionId, paymentScreenshot }) => {
        setIsSubmitting(true);
        const formData = new FormData();
        // The modal can now correctly access activeTradeDetails.trade_id
        formData.append('tradeId', activeTradeDetails.trade_id);
        formData.append('transactionId', transactionId);
        formData.append('paymentScreenshot', paymentScreenshot);

        try {
            const response = await fetch(`${url}/api/trading/submit-proof`, { // Endpoint should be from your tradingRoutes.js
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            toast({ title: 'Submission Successful!', description: "Your purchase is now under review by the admin.", status: 'success', isClosable: true });
            onPaymentModalClose();
            fetchProducts();
        } catch (error) {
            toast({ title: 'Submission Error', description: error.message, status: 'error', isClosable: true });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box flex="1" p={{ base: 4, md: 8 }}>
            <Heading mb={8}>Available Products for Trading</Heading>
            {isLoading ? (
                <Center h="300px"><Spinner /></Center>
            ) : (
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
                    {products.map(product => (
                        <VStack key={product.product_id} borderWidth="1px" borderRadius="lg" p={4} spacing={4} align="stretch" justify="space-between">
                            <Box>
                                <Image src={`${url}/${product.product_image_url}`} h="150px" w="full" objectFit="cover" borderRadius="md" fallbackSrc="https://via.placeholder.com/150" />
                                <Heading size="md" mt={4}>{product.paper_type}</Heading>
                                <Text>Size: {product.size} | GSM: {product.gsm}</Text>
                                <Text>Available: <strong>{product.available_stock} units</strong></Text>
                                <Heading size="sm" mt={2}>₹{product.price_per_slot}</Heading>
                            </Box>
                            <Button colorScheme="blue" onClick={() => handleBuyClick(product)}>Buy Stock</Button>
                        </VStack>
                    ))}
                </SimpleGrid>
            )}

            <PurchaseModal
                isOpen={isPurchaseModalOpen}
                onClose={onPurchaseModalClose}
                product={selectedProduct}
                onProceed={handleProceedToPayment}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={onPaymentModalClose}
                tradeDetails={activeTradeDetails}
                onPaymentSubmit={handlePaymentSubmit}
                isLoading={isSubmitting}
            />
        </Box>
    );
};

export default BuyProduct;