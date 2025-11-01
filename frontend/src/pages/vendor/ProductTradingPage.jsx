// src/pages/ProductTradingPage.jsx

import React, { useState, useEffect } from 'react';
import {
    Box, Flex, VStack, Heading, Text, Spinner, Alert, AlertIcon, SimpleGrid,
    Container, Image, Button, useDisclosure, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalBody, ModalFooter, ModalCloseButton, IconButton, Drawer, DrawerOverlay, DrawerContent, DrawerBody ,Input, HStack, useToast, FormControl, FormLabel,
    Divider
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';
import { useNavigate } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';
import VendorNavBar from '../../components/layout/VendorNavBar';


// --- Modal Component for the entire Purchase Flow ---
// This modal now handles both steps: quantity selection and payment proof.
const PurchaseModal = ({ isOpen, onClose, product, onSuccess, url }) => {
    const { token } = useAuth();
    const toast = useToast();

    // Internal state for the modal's flow
    const [step, setStep] = useState('quantity'); // 'quantity' or 'payment'
    const [quantity, setQuantity] = useState(1);
    const [tradeDetails, setTradeDetails] = useState(null); // To store { trade_id, total_amount_paid }
    const [transactionId, setTransactionId] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    // This effect RESETS the modal to the first step every time it's opened.
    useEffect(() => {
        if (isOpen) {
            setStep('quantity');
            setQuantity(1);
            setTransactionId('');
    
            setTradeDetails(null);
        }
    }, [isOpen]);

    // Step 1: User confirms quantity and proceeds.
    const handleInitiatePayment = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${url}/api/trading/initiate`, {
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
        if (!transactionId) {
            toast({ title: 'Missing Information', description: 'Please provide a transaction ID.', status: 'warning', isClosable: true });
            return;
        }
        setIsLoading(true);
        const formData = new FormData();
        formData.append('tradeId', tradeDetails.trade_id);
        formData.append('transactionId', transactionId);

        try {
            const response = await fetch(`${url}/api/trading/submit-proof`, {
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
                                    max={product?.quota_phase === 'personal_quota' 
                                        ? product?.vendor_remaining_quota 
                                        : product?.available_stock}
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


// --- Product Card Component ---
const ProductCard = ({ product, onBuyClick, url }) => {
    // Check if product is in personal quota phase
    const isPersonalQuota = product.quota_phase === 'personal_quota';
    
    console.log(`🔍 [FRONTEND] ProductCard for ${product.product_id}:`, {
        quota_phase: product.quota_phase,
        isPersonalQuota: isPersonalQuota,
        available_stock: product.available_stock,
        vendor_remaining_quota: product.vendor_remaining_quota,
        vendor_quota: product.vendor_quota,
        vendor_purchased: product.vendor_purchased
    });
    
    const displayUnits = isPersonalQuota ? product.vendor_remaining_quota : product.available_stock;
    console.log(`🔍 [FRONTEND] Will display: ${displayUnits} units`);

    const sellingDays = product.selling_days ?? product.sellingDays;
    
    return (
        <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg="gray.700">
            <Image src={`${url}${product.product_image_url}`} alt={product.paper_type} h="200px" w="full" objectFit="cover" fallbackSrc='https://via.placeholder.com/300' />
            <Box p={6}>
                <Heading size="md">{product.paper_type}</Heading>
                <Text mt={2}>Size: {product.size} | GSM: {product.gsm}</Text>
                
                {/* Display available units */}
                <Text mt={2}>
                    Available: <Text as="span" color="green.300" fontWeight="bold">
                        {displayUnits} units
                    </Text>
                </Text>

                {sellingDays !== undefined && sellingDays !== null && (
                    <Text mt={2} color="yellow.300" fontWeight="semibold">
                        Selling Days: {sellingDays} day{sellingDays === 1 ? '' : 's'}
                    </Text>
                )}
                
                <Text fontSize="xl" fontWeight="bold" color="cyan.400" mt={2}>₹{product.price_per_slot} / slot</Text>
                <Button mt={4} w="full" colorScheme="blue" onClick={() => onBuyClick(product)}>Buy Stock</Button>
            </Box>
        </Box>
    );
};

// --- Main Page Component ---
// This is now much simpler. It just displays products and opens the modal.
const ProductTradingPage = ({ url }) => {
  const { token } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchProducts = async () => {
    setLoading(true);
    if (!token) { setError("You must be logged in."); setLoading(false); return; }
    try {
      const response = await fetch(`${url}/api/products/available`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to fetch products.');
      const data = await response.json();
      
      console.log('🔍 [FRONTEND] API Response:', data);
      console.log('🔍 [FRONTEND] Products array:', data.products || data);
      
      // Handle new API response structure with time constraints
      if (data.success === false) {
        // Products not available due to time constraints
        toast({ 
          title: 'Products Not Available', 
          description: data.message, 
          status: 'warning', 
          isClosable: true,
          duration: 5000
        });
        setProducts([]);
      } else {
        // Products available - extract from new response structure
        const productsArray = data.products || data || [];
        console.log('🔍 [FRONTEND] Setting products:', productsArray);
        setProducts(productsArray);
      }
    } catch (err) { 
      console.error('❌ [FRONTEND] Error fetching products:', err);
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };


  useEffect(() => {
    fetchProducts();
  }, [token]);

  const handleBuyClick = (product) => {
    setSelectedProduct(product);
    onOpen();
  };

  return (
  <Flex minH="100vh" bg="gray.100">
    
    {/* SIDEBAR: VendorNavBar - Fixed */}
    <Box
  w={{ base: '60px', lg: '80px' }}
  bg="#111827"
  color="white"
  minH="100vh"
  px={2}
  py={4}
>
  <VendorNavBar />
</Box>




    {/* MAIN CONTENT: Adjusted with margin-left */}
    <Box
        flex="1"
  ml={{ base: "60px", lg: "80px" }}  // Good, leaves space for sidebar
  px={6}
  py={8}
  w="100%"
>
      {loading && products.length === 0 ? (
        <Container centerContent><Spinner size="xl" mt="20" /></Container>
      ) : error ? (
        <Container centerContent><Alert status="error" mt="20"><AlertIcon />{error}</Alert></Container>
      ) : (
        <Container maxW="container.xl" py={4}>
          <Heading mb={6}>Available Products for Trading</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
            {products.map(product => (
              <ProductCard
                key={product.product_id}
                product={product}
                onBuyClick={handleBuyClick}
                url={url}
              />
            ))}
          </SimpleGrid>
        </Container>
      )}

      {selectedProduct && (
        <PurchaseModal
          isOpen={isOpen}
          onClose={onClose}
          product={selectedProduct}
          onSuccess={fetchProducts}
          url={url}
        />
      )}
    </Box>
  </Flex>
);

};

export default ProductTradingPage;