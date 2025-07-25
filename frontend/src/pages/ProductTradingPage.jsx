// src/pages/ProductTradingPage.jsx

import React, { useState, useEffect } from 'react';
import {
    Box, VStack, Heading, Text, Spinner, Alert, AlertIcon, SimpleGrid,
    Container, Image, Button, useDisclosure, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalBody, ModalFooter, ModalCloseButton, Input, HStack, useToast, FormControl, FormLabel,
    Divider
} from '@chakra-ui/react';
import { useAuth } from '../AppContext';
import { useNavigate } from 'react-router-dom';

// --- Modal Component for the entire Purchase Flow ---
// This modal now handles both steps: quantity selection and payment proof.
const PurchaseModal = ({ isOpen, onClose, product, onSuccess }) => {
    const { token } = useAuth();
    const toast = useToast();

    // Internal state for the modal's flow
    const [step, setStep] = useState('quantity'); // 'quantity' or 'payment'
    const [quantity, setQuantity] = useState(1);
    const [tradeDetails, setTradeDetails] = useState(null); // To store { trade_id, total_amount_paid }
    const [transactionId, setTransactionId] = useState('');
    const [paymentScreenshot, setPaymentScreenshot] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // This effect RESETS the modal to the first step every time it's opened.
    useEffect(() => {
        if (isOpen) {
            setStep('quantity');
            setQuantity(1);
            setTransactionId('');
            setPaymentScreenshot(null);
            setTradeDetails(null);
        }
    }, [isOpen]);

    // Step 1: User confirms quantity and proceeds.
    const handleInitiatePayment = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/trade/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    productId: product.product_id,
                    no_of_stock_bought: parseInt(quantity, 10)
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            // Success! Store the trade details and switch the modal's view.
            setTradeDetails(data.tradeDetails);
            setStep('payment');

        } catch (err) {
            toast({ title: 'Error', description: err.message, status: 'error', isClosable: true });
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: User submits the payment proof form.
    const handleProofSubmit = async (e) => {
        e.preventDefault();
        if (!transactionId || !paymentScreenshot) {
            toast({ title: 'Missing Information', description: 'Please provide both a transaction ID and a screenshot.', status: 'warning', isClosable: true });
            return;
        }
        setIsLoading(true);
        const formData = new FormData();
        formData.append('tradeId', tradeDetails.trade_id);
        formData.append('transactionId', transactionId);
        formData.append('paymentScreenshot', paymentScreenshot);

        try {
            const response = await fetch('/api/trade/submit-proof', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            toast({ title: 'Submission Successful', description: data.message, status: 'success', isClosable: true });
            onSuccess(); // This calls the parent's function to refresh the product list.
            onClose(); // Close the modal.
            
        } catch (err) {
            toast({ title: 'Submission Failed', description: err.message, status: 'error', isClosable: true });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleProofSubmit} bg="gray.800" color="white">
                <ModalHeader>
                    {step === 'quantity' ? `Buy Stock: ${product?.paper_type}` : 'Complete Your Payment'}
                </ModalHeader>
                <ModalCloseButton />

                {/* --- The Modal Body now renders content based on the 'step' state --- */}
                <ModalBody>
                    {step === 'quantity' && (
                        <VStack spacing={4}>
                            <Text>Price per Slot: ₹{product?.price_per_slot}</Text>
                            <HStack w="full">
                                <Text>Quantity to Buy:</Text>
                                <Input 
                                    type="number" 
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    min={1}
                                    max={product?.available_stock}
                                />
                            </HStack>
                            <Divider />
                            <Text fontWeight="bold" fontSize="lg">
                                Total Cost: ₹{(quantity * (product?.price_per_slot || 0)).toFixed(2)}
                            </Text>
                        </VStack>
                    )}

                    {step === 'payment' && (
                        <VStack spacing={4}>
                            <Alert status='info' borderRadius="md" variant="subtle">
                                <AlertIcon />
                                <Text fontWeight="bold">Amount to Pay: ₹{tradeDetails?.total_amount_paid.toFixed(2)}</Text>
                            </Alert>
                            <Image src="/images/payment-qr-code.png" alt="Payment QR Code" boxSize="180px" bg="white" p={2} borderRadius="md" />
                            <FormControl isRequired>
                                <FormLabel>Transaction ID</FormLabel>
                                <Input placeholder="Enter the UPI/Bank transaction ID" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel>Payment Screenshot</FormLabel>
                                <Input type="file" p={1.5} onChange={(e) => setPaymentScreenshot(e.target.files[0])} accept="image/*" />
                            </FormControl>
                        </VStack>
                    )}
                </ModalBody>

                <ModalFooter>
                    <Button variant='ghost' mr={3} onClick={onClose}>Cancel</Button>
                    {step === 'quantity' ? (
                        <Button colorScheme='blue' onClick={handleInitiatePayment} isLoading={isLoading}>
                            Proceed to Payment
                        </Button>
                    ) : (
                        <Button colorScheme='cyan' type="submit" isLoading={isLoading}>
                            Submit and Complete Payment
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};


// --- Product Card Component (No changes) ---
const ProductCard = ({ product, onBuyClick }) => (
    <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg="gray.700">
        <Image src={`http://localhost:5000${product.product_image_url}`} alt={product.paper_type} h="200px" w="full" objectFit="cover" fallbackSrc='https://via.placeholder.com/300' />
        <Box p={6}>
            <Heading size="md">{product.paper_type}</Heading>
            <Text mt={2}>Size: {product.size} | GSM: {product.gsm}</Text>
            <Text>Available: <Text as="span" color="green.300" fontWeight="bold">{product.available_stock} units</Text></Text>
            <Text fontSize="xl" fontWeight="bold" color="cyan.400" mt={2}>₹{product.price_per_slot} / slot</Text>
            <Button mt={4} w="full" colorScheme="blue" onClick={() => onBuyClick(product)}>Buy Stock</Button>
        </Box>
    </Box>
);

// --- Main Page Component ---
// This is now much simpler. It just displays products and opens the modal.
const ProductTradingPage = () => {
    const { token } = useAuth();
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { isOpen, onOpen, onClose } = useDisclosure();

    const fetchProducts = async () => {
        setLoading(true);
        if (!token) { setError("You must be logged in."); setLoading(false); return; }
        try {
            const response = await fetch('/api/products/available', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Failed to fetch products.');
            const data = await response.json();
            setProducts(data);
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchProducts();
    }, [token]);

    const handleBuyClick = (product) => {
        setSelectedProduct(product);
        onOpen();
    };

    if (loading && products.length === 0) return <Container centerContent><Spinner size="xl" mt="20" /></Container>;
    if (error) return <Container centerContent><Alert status="error" mt="20"><AlertIcon />{error}</Alert></Container>;

    return (
        <Container maxW="container.xl" py={10}>
            <Heading mb={6}>Available Products for Trading</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                {products.map(product => ( <ProductCard key={product.product_id} product={product} onBuyClick={handleBuyClick} /> ))}
            </SimpleGrid>

            {/* The modal is now self-contained */}
            {selectedProduct && (
                <PurchaseModal 
                    isOpen={isOpen}
                    onClose={onClose}
                    product={selectedProduct}
                    onSuccess={fetchProducts} // Pass the fetch function so the modal can refresh the list
                />
            )}
        </Container>
    );
};

export default ProductTradingPage;