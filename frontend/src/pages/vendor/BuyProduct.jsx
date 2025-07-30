import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Flex, VStack, SimpleGrid, Heading, Text, Button, Image, useToast, Spinner, Center,
    useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
    NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Divider,
    FormControl, FormLabel
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

// --- Purchase Modal (Simplified) ---
// This is now the only modal needed.
const PurchaseModal = ({ isOpen, onClose, product, onProceed, walletBalance }) => {
    const [quantity, setQuantity] = useState(0); 
    
    useEffect(() => {
        if (isOpen) {
            setQuantity(0);
        }
    }, [isOpen]);

    if (!product) return null;

    const totalCost = (quantity * (Number(product.price_per_slot) || 0));
    const hasEnoughFunds = walletBalance >= totalCost;

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Buy Stock: {product.paper_type}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={3}>
                        <Text>Price per Slot: <strong>₹{product.price_per_slot}</strong></Text>
                        <FormControl>
                            <FormLabel>Quantity to Buy:</FormLabel>
                            <NumberInput
                                min={0}
                                max={product.available_stock || 1}
                                onChange={(valueAsString, valueAsNumber) => setQuantity(isNaN(valueAsNumber) ? 0 : valueAsNumber)}
                                value={quantity}
                            >
                                <NumberInputField placeholder="Enter quantity" />
                                <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                            </NumberInput>
                        </FormControl>
                        <Divider my={2} />
                        <Heading size="md">Total Cost: ₹{totalCost.toFixed(2)}</Heading>
                        <Text fontSize="sm" color="gray.500">Your Wallet Balance: ₹{walletBalance.toFixed(2)}</Text>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button
                        colorScheme="purple"
                        onClick={() => onProceed(quantity)}
                        isDisabled={!hasEnoughFunds || quantity <= 0}
                        w="full" // Make the button full width as it's the only one
                    >
                        Pay with Wallet
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};


// --- MAIN PAGE COMPONENT (Simplified) ---
const BuyProduct = ({ url }) => {
    const { token } = useAuth();
    const toast = useToast();
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [walletBalance, setWalletBalance] = useState(0);

    const { isOpen: isPurchaseModalOpen, onOpen: onPurchaseModalOpen, onClose: onPurchaseModalClose } = useDisclosure();
    const fetchData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [productsRes, walletRes] = await Promise.all([
                fetch(`${url}/api/products/available`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${url}/api/wallet`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!productsRes.ok) throw new Error('Failed to fetch products');
            if (!walletRes.ok) throw new Error('Failed to fetch wallet balance');

            const productsData = await productsRes.json();
            const walletData = await walletRes.json();

            setProducts(productsData);
            setWalletBalance(walletData.digital_money || 0);

        } catch (error) {
            toast({ title: 'Data Fetch Error', description: error.message, status: 'error', isClosable: true });
        } finally {
            setIsLoading(false);
        }
    }, [token, url, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleBuyClick = (product) => {
        setSelectedProduct(product);
        onPurchaseModalOpen();
    };

    // --- Simplified Logic: Only handles wallet payments ---
    const handleProceed = async (quantity) => {
        onPurchaseModalClose();
        setIsSubmitting(true);
        try {
            const response = await fetch(`${url}/api/trading/execute-wallet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    productId: selectedProduct.product_id,
                    no_of_stock_bought: quantity,
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Wallet payment failed.');
            
            toast({ title: 'Success', description: data.message, status: 'success', isClosable: true });
            fetchData(); // Refresh product list and wallet balance
        } catch (error) {
            toast({ title: 'Wallet Payment Error', description: error.message, status: 'error', isClosable: true });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box flex="1" p={{ base: 4, md: 8 }}>
            <Heading mb={8}>Available Products for Trading</Heading>
            {isLoading ? (
                <Center h="300px"><Spinner size="xl" /></Center>
            ) : (
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
                    {products.map(product => (
                        <VStack key={product.product_id} borderWidth="1px" borderRadius="lg" p={4} spacing={4} align="stretch" justify="space-between">
                            <Box>
                                <Image src={product.product_image_url} h="150px" w="full" objectFit="cover" borderRadius="md" fallbackSrc="https://via.placeholder.com/150" />
                                <Heading size="md" mt={4}>{product.paper_type}</Heading>
                                <Text>Size: {product.size} | GSM: {product.gsm}</Text>
                                <Text>Available: <strong>{product.available_stock} units</strong></Text>
                                <Heading size="sm" mt={2}>₹{product.price_per_slot}</Heading>
                            </Box>
                            <Button colorScheme="blue" onClick={() => handleBuyClick(product)} isDisabled={product.available_stock <= 0 || isSubmitting}>
                                {product.available_stock > 0 ? 'Buy Stock' : 'Out of Stock'}
                            </Button>
                        </VStack>
                    ))}
                </SimpleGrid>
            )}

            <PurchaseModal
                isOpen={isPurchaseModalOpen}
                onClose={onPurchaseModalClose}
                product={selectedProduct}
                onProceed={handleProceed}
                walletBalance={walletBalance}
            />
        </Box>
    );
};

export default BuyProduct;









// import React, { useState, useEffect } from 'react';

// import {
//     Box, Flex, VStack, SimpleGrid, Heading, Text, Button, Image, useToast, Spinner, Center,
//     useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
//     NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Divider,
//     FormControl, FormLabel, Input,
//     HStack, useClipboard, useColorModeValue // <-- ADD THIS LINE
// } from '@chakra-ui/react';


// import { useAuth } from '../../AppContext';

// // --- MODAL 2: FOR PAYMENT (UPDATED) ---
// // This modal now receives all necessary info directly
// const PaymentModal = ({ isOpen, onClose, productInfo, onPaymentSubmit, isLoading }) => {
//     const [transactionId, setTransactionId] = useState('');
//     const [paymentScreenshot, setPaymentScreenshot] = useState(null);

//        // --- ADD THIS LOGIC ---
//     const upiId = 'akhileshraviteja5-2@okhdfcbank';
//     const { onCopy, hasCopied } = useClipboard(upiId);
//     const upiIdBg = useColorModeValue('gray.100', 'gray.700');
//     // --- END OF ADDED LOGIC ---

//     useEffect(() => {
//         // Reset form when the modal opens
//         if (isOpen) {
//             setTransactionId('');
//             setPaymentScreenshot(null);
//         }
//     }, [isOpen]);
    
//     // Don't render if we don't have the info we need
//     if (!productInfo) return null;

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         onPaymentSubmit({ transactionId, paymentScreenshot });
//     };

//     return (
//         <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
//             <ModalOverlay />
//             <ModalContent as="form" onSubmit={handleSubmit}>
//                 <ModalHeader>Complete Payment for {productInfo.paper_type}</ModalHeader>
//                 <ModalCloseButton />
//                 <ModalBody>
//                     <VStack spacing={4}>
//                         <Text>You are buying <strong>{productInfo.quantity}</strong> stocks.</Text>
//                         <Image w="220px" h="220px" src="/images/payment-qr-code.png" alt="Payment QR Code" border="2px solid" borderColor="gray.300" p={1} />
//                         <Box p={3} bg={upiIdBg} borderRadius="md" w="full" maxW="350px">
//                             <HStack justify="space-between" align="center">
//                                 <Text fontFamily="monospace" fontSize="md">
//                                     {upiId}
//                                 </Text>
//                                 <Button onClick={onCopy} size="sm" colorScheme={hasCopied ? "green" : "blue"}>
//                                     {hasCopied ? "Copied!" : "Copy"}
//                                 </Button>
//                             </HStack>
//                         </Box>
//                         <Heading size="md" color="teal.500">Total Amount: ₹{productInfo.totalCost.toFixed(2)}</Heading>
//                         <FormControl isRequired>
//                             <FormLabel>Transaction ID</FormLabel>
//                             <Input placeholder="Enter UPI/Bank transaction ID" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
//                         </FormControl>
//                         <FormControl isRequired>
//                             <FormLabel>Upload Payment Screenshot</FormLabel>
//                             <Input type="file" p={1.5} onChange={(e) => setPaymentScreenshot(e.target.files[0])} accept="image/*" />
//                         </FormControl>
//                     </VStack>
//                 </ModalBody>
//                 <ModalFooter>
//                     <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isLoading}>Cancel</Button>
//                     <Button type="submit" colorScheme="teal" isLoading={isLoading} disabled={!transactionId || !paymentScreenshot}>
//                         Submit Payment Proof
//                     </Button>
//                 </ModalFooter>
//             </ModalContent>
//         </Modal>
//     );
// };


// // --- MODAL 1: FOR SELECTING QUANTITY (UPDATED) ---
// // This modal is now simpler and just triggers the next step.
// const PurchaseModal = ({ isOpen, onClose, product, onProceed, walletBalance }) => {
//     // CHANGE 1: Initialize quantity state to 0 instead of 1.
//     const [quantity, setQuantity] = useState(0); 
    
//     // CHANGE 2: Reset quantity to 0 when the modal opens.
//     useEffect(() => { if (isOpen) setQuantity(0); }, [isOpen]);

//     if (!product) return null;

//     const totalCost = (quantity * (Number(product.price_per_slot) || 0));
//     const hasEnoughFunds = walletBalance >= totalCost;

//     return (
//         <Modal isOpen={isOpen} onClose={onClose} isCentered>
//             <ModalOverlay />
//             <ModalContent>
//                 <ModalHeader>Buy Stock: {product.paper_type}</ModalHeader>
//                 <ModalCloseButton />
//                 <ModalBody>
//                     <VStack align="stretch" spacing={3}>
//                         <Text>Price per Slot: <strong>₹{product.price_per_slot}</strong></Text>
//                         <FormControl>
//                             <FormLabel>Quantity to Buy:</FormLabel>
//                             {/* CHANGE 3: Update NumberInput props for correct behavior */}
//                             <NumberInput
//                                 min={0} // Allow 0 as the minimum value
//                                 max={product.available_stock || 1}
//                                 // Handle onChange to allow free typing, falling back to 0 if empty/invalid
//                                 onChange={(valueAsString, valueAsNumber) => setQuantity(isNaN(valueAsNumber) ? 0 : valueAsNumber)}
//                                 value={quantity} // Value is controlled by the state
//                             >
//                                 <NumberInputField placeholder="Enter quantity" />
//                                 <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
//                             </NumberInput>
//                         </FormControl>
//                         <Divider my={2} />
//                         <Heading size="md">Total Cost: ₹{totalCost.toFixed(2)}</Heading>
//                         <Text fontSize="sm" color="gray.500">Your Wallet Balance: ₹{walletBalance.toFixed(2)}</Text>
//                     </VStack>
//                 </ModalBody>
//                 <ModalFooter>
//                     {/* CHANGE 4 (Recommended): Disable buttons if quantity is zero */}
//                     <Button
//                         colorScheme="purple"
//                         mr={3}
//                         onClick={() => onProceed(quantity, 'wallet')}
//                         isDisabled={!hasEnoughFunds || quantity <= 0}
//                     >
//                         Pay with Wallet
//                     </Button>
//                     <Button
//                         colorScheme="teal"
//                         onClick={() => onProceed(quantity, 'upi')}
//                         isDisabled={quantity <= 0}
//                     >
//                         Pay with UPI/QR
//                     </Button>
//                 </ModalFooter>
//             </ModalContent>
//         </Modal>
//     );
// };


// // --- MAIN PAGE COMPONENT (LOGIC REFACTORED) ---
// const BuyProduct = ({ url }) => {
//     const { token } = useAuth();
//     const toast = useToast();
//     const [products, setProducts] = useState([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [selectedProduct, setSelectedProduct] = useState(null);
//     const [purchaseInfo, setPurchaseInfo] = useState(null); // Will hold all info for the payment modal
//     const [walletBalance, setWalletBalance] = useState(0);

//     const { isOpen: isPurchaseModalOpen, onOpen: onPurchaseModalOpen, onClose: onPurchaseModalClose } = useDisclosure();
//     const { isOpen: isPaymentModalOpen, onOpen: onPaymentModalOpen, onClose: onPaymentModalClose } = useDisclosure();

//     const fetchData = async () => {
//         setIsLoading(true);
//         try {
//             // Fetch products and wallet balance simultaneously for efficiency
//             const [productsRes, walletRes] = await Promise.all([
//                 fetch(`${url}/api/products/available`, { headers: { 'Authorization': `Bearer ${token}` } }),
//                 fetch(`${url}/api/wallet`, { headers: { 'Authorization': `Bearer ${token}` } })
//             ]);

//             if (!productsRes.ok) throw new Error('Failed to fetch products');
//             if (!walletRes.ok) throw new Error('Failed to fetch wallet balance');

//             const productsData = await productsRes.json();
//             const walletData = await walletRes.json();

//             setProducts(productsData);
//             setWalletBalance(walletData.digital_money || 0);

//         } catch (error) {
//             toast({ title: 'Data Fetch Error', description: error.message, status: 'error', isClosable: true });
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     useEffect(() => {
//         if (token) {
//             fetchData();
//         }
//     }, [token]);

//     const handleBuyClick = (product) => {
//         setSelectedProduct(product);
//         onPurchaseModalOpen();
//     };

//     // --- REFACTORED LOGIC ---
//     // This handler now directs traffic based on the chosen payment method.
//     const handleProceed = async (quantity, paymentMethod) => {
//         onPurchaseModalClose(); // Close the first modal immediately
//         const totalCost = quantity * parseFloat(selectedProduct.price_per_slot);

//         if (paymentMethod === 'wallet') {
//             // For wallet, execute the payment directly.
//             setIsSubmitting(true);
//             try {
//                 const response = await fetch(`${url}/api/trading/execute-wallet`, {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//                     body: JSON.stringify({
//                         productId: selectedProduct.product_id,
//                         no_of_stock_bought: quantity,
//                     })
//                 });
//                 const data = await response.json();
//                 if (!response.ok) throw new Error(data.message || 'Wallet payment failed.');
                
//                 toast({ title: 'Success', description: data.message, status: 'success', isClosable: true });
//                 fetchData(); // Refresh product list and wallet balance
//             } catch (error) {
//                 toast({ title: 'Wallet Payment Error', description: error.message, status: 'error', isClosable: true });
//             } finally {
//                 setIsSubmitting(false);
//             }
//         } else {
//             // For UPI, just prepare the data and open the payment modal. No backend call here.
//             setPurchaseInfo({
//                 productId: selectedProduct.product_id,
//                 paper_type: selectedProduct.paper_type,
//                 quantity,
//                 totalCost,
//             });
//             onPaymentModalOpen();
//         }
//     };

//     // This handler now sends a single request to create the UPI trade record.
//     const handlePaymentSubmit = async ({ transactionId, paymentScreenshot }) => {
//         setIsSubmitting(true);
//         const formData = new FormData();
//         // Append all necessary data for the new endpoint
//         formData.append('productId', purchaseInfo.productId);
//         formData.append('no_of_stock_bought', purchaseInfo.quantity);
//         formData.append('transactionId', transactionId);
//         formData.append('paymentScreenshot', paymentScreenshot);

//         try {
//             const response = await fetch(`${url}/api/trading/create-upi`, {
//                 method: 'POST',
//                 headers: { 'Authorization': `Bearer ${token}` }, // No 'Content-Type', browser sets it for FormData
//                 body: formData
//             });
//             const data = await response.json();
//             if (!response.ok) throw new Error(data.message || 'Failed to submit payment proof.');
            
//             toast({ title: 'Success', description: data.message, status: 'success', isClosable: true });
//             onPaymentModalClose();
//             fetchData(); // Refresh product list after submission
//         } catch (error) {
//             toast({ title: 'Submission Error', description: error.message, status: 'error', isClosable: true });
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     return (
//         <Box flex="1" p={{ base: 4, md: 8 }}>
//             <Heading mb={8}>Available Products for Trading</Heading>
//             {isLoading ? (
//                 <Center h="300px"><Spinner size="xl" /></Center>
//             ) : (
//                 <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
//                     {products.map(product => (
//                         <VStack key={product.product_id} borderWidth="1px" borderRadius="lg" p={4} spacing={4} align="stretch" justify="space-between">
//                             <Box>
//                                 <Image src={`${url}${product.product_image_url}`} h="150px" w="full" objectFit="cover" borderRadius="md" fallbackSrc="https://via.placeholder.com/150" />
//                                 <Heading size="md" mt={4}>{product.paper_type}</Heading>
//                                 <Text>Size: {product.size} | GSM: {product.gsm}</Text>
//                                 <Text>Available: <strong>{product.available_stock} units</strong></Text>
//                                 <Heading size="sm" mt={2}>₹{product.price_per_slot}</Heading>
//                             </Box>
//                             <Button colorScheme="blue" onClick={() => handleBuyClick(product)} isDisabled={product.available_stock === 0}>
//                                 {product.available_stock > 0 ? 'Buy Stock' : 'Out of Stock'}
//                             </Button>
//                         </VStack>
//                     ))}
//                 </SimpleGrid>
//             )}

//             <PurchaseModal
//                 isOpen={isPurchaseModalOpen}
//                 onClose={onPurchaseModalClose}
//                 product={selectedProduct}
//                 onProceed={handleProceed}
//                 walletBalance={walletBalance}
//             />

//             <PaymentModal
//                 isOpen={isPaymentModalOpen}
//                 onClose={onPaymentModalClose}
//                 productInfo={purchaseInfo}
//                 onPaymentSubmit={handlePaymentSubmit}
//                 isLoading={isSubmitting}
//             />
//         </Box>
//     );
// };

// export default BuyProduct;