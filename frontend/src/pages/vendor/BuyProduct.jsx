// // import React, { useState, useEffect, useCallback } from 'react';
// // import {
// //   Box, Flex, VStack, SimpleGrid, Heading, Text, Button, Image, useToast, Spinner, Center,
// //   useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
// //   NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Divider,
// //   FormControl, FormLabel, Drawer, DrawerOverlay, DrawerContent, DrawerBody, useColorModeValue,
// //   IconButton,
// // } from '@chakra-ui/react';
// // import { HamburgerIcon } from '@chakra-ui/icons';
// // import { useAuth } from '../../AppContext';
// // import VendorNavBar from '../../components/layout/VendorNavBar';

// // const DESKTOP_SIDEBAR_WIDTH = '200px';

// // // --- Purchase Modal (unchanged) ---
// // const PurchaseModal = ({ isOpen, onClose, product, onProceed, walletBalance }) => {
// //   const [quantity, setQuantity] = useState(1);
// //   useEffect(() => { if (isOpen) setQuantity(1); }, [isOpen]);
// //   if (!product) return null;

// //   const totalCost = quantity * (Number(product.price_per_slot) || 0);
// //   const hasEnoughFunds = walletBalance >= totalCost;

// //   return (
// //     <Modal isOpen={isOpen} onClose={onClose} isCentered>
// //       <ModalOverlay />
// //       <ModalContent>
// //         <ModalHeader>Buy Stock: {product.paper_type}</ModalHeader>
// //         <ModalCloseButton />
// //         <ModalBody>
// //           <VStack align="stretch" spacing={3}>
// //             <Text>Price per Slot: <strong>₹{product.price_per_slot}</strong></Text>
// //             <FormControl>
// //               <FormLabel>Quantity to Buy:</FormLabel>
// //               <NumberInput
// //                 min={1}
// //                 max={product.available_stock || 1}
// //                 onChange={(_, v) => setQuantity(isNaN(v) ? 1 : v)}
// //                 value={quantity}
// //               >
// //                 <NumberInputField placeholder="Enter quantity" />
// //                 <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
// //               </NumberInput>
// //             </FormControl>
// //             <Divider my={2} />
// //             <Heading size="md">Total Cost: ₹{totalCost.toFixed(2)}</Heading>
// //             <Text fontSize="sm" color="gray.500">Your Wallet Balance: ₹{walletBalance.toFixed(2)}</Text>
// //             {!hasEnoughFunds && <Text color="red.500" fontSize="sm">You have insufficient funds in your wallet.</Text>}
// //           </VStack>
// //         </ModalBody>
// //         <ModalFooter>
// //           <Button colorScheme="purple" onClick={() => onProceed(quantity)} isDisabled={!hasEnoughFunds || quantity <= 0} w="full">
// //             Pay with Wallet
// //           </Button>
// //         </ModalFooter>
// //       </ModalContent>
// //     </Modal>
// //   );
// // };

// // const BuyProduct = ({ url }) => {
// //   const { token } = useAuth();
// //   const toast = useToast();
// //   const { isOpen: isMobileNavOpen, onOpen: onMobileNavOpen, onClose: onMobileNavClose } = useDisclosure();

// //   const [products, setProducts] = useState([]);
// //   const [isLoading, setIsLoading] = useState(true);
// //   const [isSubmitting, setIsSubmitting] = useState(false);
// //   const [selectedProduct, setSelectedProduct] = useState(null);
// //   const [walletBalance, setWalletBalance] = useState(0);
// //   const { isOpen: isPurchaseModalOpen, onOpen: onPurchaseModalOpen, onClose: onPurchaseModalClose } = useDisclosure();

// //   // Styling
// //   const mainBg = useColorModeValue('gray.50', '#181C27');
// //   const sidebarBg = '#212734';
// //   const sidebarBorder = 'gray.700';
// //   const productCardBg = useColorModeValue('white', 'gray.800');
// //   const headingColor = useColorModeValue('gray.800', 'gray.200');
// //   const iconColor = useColorModeValue('black', 'whiteAlpha.900');

// //   const fetchData = useCallback(async () => {
// //     if (!token) return;
// //     setIsLoading(true);
// //     try {
// //       const [productsRes, walletRes] = await Promise.all([
// //         fetch(`${url}/api/products/available`, { headers: { Authorization: `Bearer ${token}` } }),
// //         fetch(`${url}/api/wallet`, { headers: { Authorization: `Bearer ${token}` } })
// //       ]);
// //       if (!productsRes.ok) throw new Error('Failed to fetch products');
// //       if (!walletRes.ok) throw new Error('Failed to fetch wallet balance');
// //       const productsData = await productsRes.json();
// //       const walletData = await walletRes.json();
// //       setProducts(productsData);
// //       setWalletBalance(walletData.digital_money || 0);
// //     } catch (error) {
// //       toast({ title: 'Data Fetch Error', description: error.message, status: 'error', isClosable: true });
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   }, [token, url, toast]);

// //   useEffect(() => { fetchData(); }, [fetchData]);

// //   const handleBuyClick = (product) => { setSelectedProduct(product); onPurchaseModalOpen(); };

// //   const handleProceed = async (quantity) => {
// //     onPurchaseModalClose();
// //     setIsSubmitting(true);
// //     try {
// //       const response = await fetch(`${url}/api/trading/execute-wallet`, {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
// //         body: JSON.stringify({ productId: selectedProduct.product_id, no_of_stock_bought: quantity })
// //       });
// //       const data = await response.json();
// //       if (!response.ok) throw new Error(data.message || 'Wallet payment failed.');
// //       toast({ title: 'Success', description: data.message, status: 'success', isClosable: true });
// //       fetchData();
// //     } catch (error) {
// //       toast({ title: 'Wallet Payment Error', description: error.message, status: 'error', isClosable: true });
// //     } finally {
// //       setIsSubmitting(false);
// //     }
// //   };

// //   return (
// //     <>
// //       <Flex minH="100vh" bg={mainBg}>
// //         {/* Sidebar (desktop only) */}
// //         <Box as="nav" pos="fixed" top="0" left="0" zIndex="sticky" h="full" w={DESKTOP_SIDEBAR_WIDTH} bg={sidebarBg} borderRight="1px" borderColor={sidebarBorder} display={{ base: 'none', md: 'block' }}>
// //           <VendorNavBar />
// //         </Box>

// //         {/* Drawer (mobile nav) */}
// //         <Drawer isOpen={isMobileNavOpen} placement="left" onClose={onMobileNavClose}>
// //           <DrawerOverlay />
// //           <DrawerContent bg={sidebarBg} w={DESKTOP_SIDEBAR_WIDTH}>
// //             <DrawerBody p={0}><VendorNavBar onLinkClick={onMobileNavClose} /></DrawerBody>
// //           </DrawerContent>
// //         </Drawer>

// //         {/* Main content */}
// //         <Box flex="1" ml={{ base: 0, md: DESKTOP_SIDEBAR_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
// //           {/* Consistent mobile header */}
// //           <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
// //             <IconButton
// //               aria-label="Open menu"
// //               icon={<HamburgerIcon w={5} h={5} />}
// //               onClick={onMobileNavOpen}
// //               size="sm"
// //               variant="ghost"
// //               color={iconColor}
// //               p={1}
// //               mt="-1"
// //               _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.200' } }}
// //             />
// //             <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">
// //               Available Products
// //             </Heading>
// //           </Flex>

// //           {isLoading ? (
// //             <Center h="300px"><Spinner size="xl" /></Center>
// //           ) : (
// //             <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
// //               {products.map(product => (
// //                 <VStack key={product.product_id} borderWidth="1px" borderRadius="lg" p={4} spacing={4} align="stretch" justify="space-between" bg={productCardBg} boxShadow="md">
// //                   <Box>
// //                     <Image src={product.product_image_url} h="150px" w="full" objectFit="cover" borderRadius="md" fallbackSrc="https://via.placeholder.com/150" />
// //                     <Heading size="md" mt={4}>{product.paper_type}</Heading>
// //                     <Text>Size: {product.size} | GSM: {product.gsm}</Text>
// //                     <Text>Available: <strong>{product.available_stock} units</strong></Text>
// //                     <Heading size="sm" mt={2}>₹{product.price_per_slot}</Heading>
// //                   </Box>
// //                   <Button colorScheme="blue" onClick={() => handleBuyClick(product)} isDisabled={product.available_stock <= 0 || isSubmitting}>
// //                     {product.available_stock > 0 ? 'Buy Stock' : 'Out of Stock'}
// //                   </Button>
// //                 </VStack>
// //               ))}
// //             </SimpleGrid>
// //           )}
// //         </Box>
// //       </Flex>

// //       {/* Purchase Modal */}
// //       <PurchaseModal isOpen={isPurchaseModalOpen} onClose={onPurchaseModalClose} product={selectedProduct} onProceed={handleProceed} walletBalance={walletBalance} />
// //     </>
// //   );
// // };

// // export default BuyProduct;












// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   Box, Flex, VStack, SimpleGrid, Heading, Text, Button, Image, useToast, Spinner, Center,
//   useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
//   NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Divider,
//   FormControl, FormLabel, Drawer, DrawerOverlay, DrawerContent, DrawerBody, useColorModeValue,
//   IconButton,
// } from '@chakra-ui/react';
// import { HamburgerIcon, WarningTwoIcon, RepeatIcon } from '@chakra-ui/icons';
// import { useAuth } from '../../AppContext';
// import VendorNavBar from '../../components/layout/VendorNavBar';

// const DESKTOP_SIDEBAR_WIDTH = '200px';

// // --- Purchase Modal (updated) ---
// const PurchaseModal = ({ isOpen, onClose, product, onProceed, walletBalance }) => {
//   const [quantity, setQuantity] = useState(1);
//   useEffect(() => { if (isOpen) setQuantity(1); }, [isOpen]);
//   if (!product) return null;

//   const totalCost = quantity * (Number(product.price_per_slot) || 0);
//   const hasEnoughFunds = walletBalance >= totalCost;

//   return (
//     <Modal isOpen={isOpen} onClose={onClose} isCentered>
//       <ModalOverlay />
//       <ModalContent>
//         <ModalHeader fontWeight="bold">Buy Stock: {product.paper_type}</ModalHeader>
//         <ModalCloseButton />
//         <ModalBody>
//           <VStack align="stretch" spacing={3}>
//             <Text fontWeight="bold">Price per Slot: ₹{product.price_per_slot}</Text>
//             <FormControl>
//               <FormLabel fontWeight="bold">Quantity to Buy:</FormLabel>
//               <NumberInput
//                 min={1}
//                 max={product.available_stock || 1}
//                 onChange={(_, v) => setQuantity(isNaN(v) ? 1 : v)}
//                 value={quantity}
//               >
//                 <NumberInputField placeholder="Enter quantity" />
//                 <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
//               </NumberInput>
//             </FormControl>
//             <Divider my={2} />
//             <Heading size="md" fontWeight="bold">Total Cost: ₹{totalCost.toFixed(2)}</Heading>
//             <Text fontSize="sm" color="gray.500" fontWeight="bold">
//               Your Wallet Balance: ₹{walletBalance.toFixed(2)}
//             </Text>
//             {!hasEnoughFunds && (
//               <Text color="red.500" fontSize="sm" fontWeight="bold">
//                 You have insufficient funds in your wallet.
//               </Text>
//             )}
//           </VStack>
//         </ModalBody>
//         <ModalFooter>
//           <Button colorScheme="purple" onClick={() => onProceed(quantity)} isDisabled={!hasEnoughFunds || quantity <= 0} w="full">
//             Pay with Wallet
//           </Button>
//         </ModalFooter>
//       </ModalContent>
//     </Modal>
//   );
// };

// const BuyProduct = ({ url }) => {
//   const { token } = useAuth();
//   const toast = useToast();
//   const { isOpen: isMobileNavOpen, onOpen: onMobileNavOpen, onClose: onMobileNavClose } = useDisclosure();

//   const [products, setProducts] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [walletBalance, setWalletBalance] = useState(0);
//   const { isOpen: isPurchaseModalOpen, onOpen: onPurchaseModalOpen, onClose: onPurchaseModalClose } = useDisclosure();

//   // Styling
//   const mainBg = useColorModeValue('gray.50', '#181C27');
//   const sidebarBg = '#212734';
//   const sidebarBorder = 'gray.700';
//   const productCardBg = useColorModeValue('white', 'gray.800');
//   const headingColor = useColorModeValue('gray.800', 'gray.200');
//   const iconColor = useColorModeValue('black', 'whiteAlpha.900');

//   const fetchData = useCallback(async () => {
//     if (!token) return;
//     setIsLoading(true);
//     try {
//       const [productsRes, walletRes] = await Promise.all([
//         fetch(`${url}/api/products/available`, { headers: { Authorization: `Bearer ${token}` } }),
//         fetch(`${url}/api/wallet`, { headers: { Authorization: `Bearer ${token}` } })
//       ]);
//       if (!productsRes.ok) throw new Error('Failed to fetch products');
//       if (!walletRes.ok) throw new Error('Failed to fetch wallet balance');
//       const productsData = await productsRes.json();
//       const walletData = await walletRes.json();
//       setProducts(productsData);
//       setWalletBalance(walletData.digital_money || 0);
//     } catch (error) {
//       toast({ title: 'Data Fetch Error', description: error.message, status: 'error', isClosable: true });
//     } finally {
//       setIsLoading(false);
//     }
//   }, [token, url, toast]);

//   useEffect(() => { fetchData(); }, [fetchData]);

//   const handleBuyClick = (product) => { setSelectedProduct(product); onPurchaseModalOpen(); };

//   const handleProceed = async (quantity) => {
//     onPurchaseModalClose();
//     setIsSubmitting(true);
//     try {
//       const response = await fetch(`${url}/api/trading/execute-wallet`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ productId: selectedProduct.product_id, no_of_stock_bought: quantity })
//       });
//       const data = await response.json();
//       if (!response.ok) throw new Error(data.message || 'Wallet payment failed.');
//       toast({ title: 'Success', description: data.message, status: 'success', isClosable: true });
//       fetchData();
//     } catch (error) {
//       toast({ title: 'Wallet Payment Error', description: error.message, status: 'error', isClosable: true });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <>
//       <Flex minH="100vh" bg={mainBg}>
//         {/* Sidebar (desktop only) */}
//         <Box as="nav" pos="fixed" top="0" left="0" zIndex="sticky" h="full" w={DESKTOP_SIDEBAR_WIDTH} bg={sidebarBg} borderRight="1px" borderColor={sidebarBorder} display={{ base: 'none', md: 'block' }}>
//           <VendorNavBar />
//         </Box>

//         {/* Drawer (mobile nav) */}
//         <Drawer isOpen={isMobileNavOpen} placement="left" onClose={onMobileNavClose}>
//           <DrawerOverlay />
//           <DrawerContent bg={sidebarBg} w={DESKTOP_SIDEBAR_WIDTH}>
//             <DrawerBody p={0}><VendorNavBar onLinkClick={onMobileNavClose} /></DrawerBody>
//           </DrawerContent>
//         </Drawer>

//         {/* Main content */}
//         <Box flex="1" ml={{ base: 0, md: DESKTOP_SIDEBAR_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
//           {/* Mobile Header */}
//           <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
//             <IconButton
//               aria-label="Open menu"
//               icon={<HamburgerIcon w={5} h={5} />}
//               onClick={onMobileNavOpen}
//               size="sm"
//               variant="ghost"
//               color={iconColor}
//               p={1}
//               mt="-1"
//               _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.200' } }}
//             />
//             <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2" fontWeight="bold">
//               Available Products
//             </Heading>
//           </Flex>

//           {isLoading ? (
//             <Center h="300px"><Spinner size="xl" /></Center>
//           ) : products.length === 0 ? (
//             <Center flexDirection="column" h="300px" textAlign="center" gap={4}>
//               <WarningTwoIcon w={10} h={10} color="gray.400" />
//               <Text fontSize="lg" fontWeight="bold" color="gray.500">
//                 No available products, please try again later!
//               </Text>
//               <Button
//                 leftIcon={<RepeatIcon />}
//                 colorScheme="blue"
//                 variant="solid"
//                 onClick={fetchData}
//               >
//                 Refresh
//               </Button>
//             </Center>
//           ) : (
//             <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
//               {products.map(product => (
//                 <VStack key={product.product_id} borderWidth="1px" borderRadius="lg" p={4} spacing={4} align="stretch" justify="space-between" bg={productCardBg} boxShadow="md">
//                   <Box>
//                     <Image src={product.product_image_url} h="150px" w="full" objectFit="cover" borderRadius="md" fallbackSrc="https://via.placeholder.com/150" />
//                     <Heading size="md" mt={4} fontWeight="bold">{product.paper_type}</Heading>
//                     <Text fontWeight="bold">Size: {product.size} | GSM: {product.gsm}</Text>
//                     <Text fontWeight="bold">Available: {product.available_stock} units</Text>
//                     <Heading size="sm" mt={2} fontWeight="bold">₹{product.price_per_slot}</Heading>
//                   </Box>
//                   <Button colorScheme="blue" onClick={() => handleBuyClick(product)} isDisabled={product.available_stock <= 0 || isSubmitting}>
//                     {product.available_stock > 0 ? 'Buy Stock' : 'Out of Stock'}
//                   </Button>
//                 </VStack>
//               ))}
//             </SimpleGrid>
//           )}
//         </Box>
//       </Flex>

//       {/* Purchase Modal */}
//       <PurchaseModal
//         isOpen={isPurchaseModalOpen}
//         onClose={onPurchaseModalClose}
//         product={selectedProduct}
//         onProceed={handleProceed}
//         walletBalance={walletBalance}
//       />
//     </>
//   );
// };

// export default BuyProduct;





























import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, VStack, SimpleGrid, Heading, Text, Button, Image, useToast, Spinner, Center,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Divider,
  FormControl, FormLabel, Drawer, DrawerOverlay, DrawerContent, DrawerBody, useColorModeValue,
  IconButton,
} from '@chakra-ui/react';
import { HamburgerIcon, WarningTwoIcon, RepeatIcon, TrendingUpIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import VendorNavBar from '../../components/layout/VendorNavBar';

const DESKTOP_SIDEBAR_WIDTH = '200px';

// --- Purchase Modal (updated) ---
const PurchaseModal = ({ isOpen, onClose, product, onProceed, walletBalance }) => {
  const [quantity, setQuantity] = useState("1"); // string state for display

  useEffect(() => {
    if (isOpen) setQuantity("1"); // reset when modal opens
  }, [isOpen]);

  if (!product) return null;

  // Check quota phase and calculate max quantity
  const isPersonalQuota = product.quota_phase === 'personal_quota';
  const maxQuantity = isPersonalQuota ? product.vendor_remaining_quota : product.available_stock;
  
  console.log('🔍 [FRONTEND Modal] Product:', {
    product_id: product.product_id,
    quota_phase: product.quota_phase,
    isPersonalQuota,
    available_stock: product.available_stock,
    vendor_remaining_quota: product.vendor_remaining_quota,
    maxQuantity
  });

  // convert string -> number for calculations
  const numericQuantity = parseInt(quantity, 10) || 0;
  const totalCost = numericQuantity * (Number(product.price_per_slot) || 0);
  const hasEnoughFunds = walletBalance >= totalCost;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontWeight="bold">Buy Stock: {product.paper_type}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={3}>
            <Text fontWeight="bold">Price per Slot: ₹{product.price_per_slot}</Text>
            <FormControl>
              <FormLabel fontWeight="bold">Quantity to Buy:</FormLabel>
              <NumberInput
                min={1}
                max={maxQuantity || 1}
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
            onClick={() => onProceed(numericQuantity)}
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

const BuyProduct = ({ url }) => {
  const { token } = useAuth();
  const toast = useToast();
  const { isOpen: isMobileNavOpen, onOpen: onMobileNavOpen, onClose: onMobileNavClose } = useDisclosure();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const { isOpen: isPurchaseModalOpen, onOpen: onPurchaseModalOpen, onClose: onPurchaseModalClose } = useDisclosure();

  // Styling
  const mainBg = useColorModeValue('gray.50', '#181C27');
  const sidebarBg = '#212734';
  const sidebarBorder = 'gray.700';
  const productCardBg = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const iconColor = useColorModeValue('black', 'whiteAlpha.900');

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [productsRes, walletRes] = await Promise.all([
        fetch(`${url}/api/products/available`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${url}/api/wallet`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (!productsRes.ok) throw new Error('Failed to fetch products');
      if (!walletRes.ok) throw new Error('Failed to fetch wallet balance');
      const productsData = await productsRes.json();
      const walletData = await walletRes.json();
      
      console.log('🔍 [FRONTEND BuyProduct] API Response:', productsData);
      console.log('🔍 [FRONTEND BuyProduct] Products array:', productsData.products || productsData);
      
      // Handle new API response structure with time constraints
      if (productsData.success === false) {
        // Products not available due to time constraints
        toast({ 
          title: 'Products Not Available', 
          description: productsData.message, 
          status: 'warning', 
          isClosable: true,
          duration: 5000
        });
        setProducts([]);
      } else {
        // Products available - extract from new response structure
        const productsArray = productsData.products || productsData || [];
        console.log('🔍 [FRONTEND BuyProduct] Setting products state:', productsArray);
        setProducts(productsArray);
      }
      setWalletBalance(walletData.digital_money || 0);
    } catch (error) {
      toast({ title: 'Data Fetch Error', description: error.message, status: 'error', isClosable: true });
    } finally {
      setIsLoading(false);
    }
  }, [token, url, toast]);


  useEffect(() => { fetchData(); }, [fetchData]);

  const handleBuyClick = (product) => { setSelectedProduct(product); onPurchaseModalOpen(); };

  const handleProceed = async (quantity) => {
    onPurchaseModalClose();
    setIsSubmitting(true);
    try {
      const response = await fetch(`${url}/api/trading/execute-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: selectedProduct.product_id, no_of_stock_bought: quantity })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Wallet payment failed.');
      toast({ title: 'Success', description: data.message, status: 'success', isClosable: true });
      fetchData();
    } catch (error) {
      toast({ title: 'Wallet Payment Error', description: error.message, status: 'error', isClosable: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Flex minH="100vh" bg={mainBg}>
        {/* Sidebar (desktop only) */}
        <Box as="nav" pos="fixed" top="0" left="0" zIndex="sticky" h="full" w={DESKTOP_SIDEBAR_WIDTH} bg={sidebarBg} borderRight="1px" borderColor={sidebarBorder} display={{ base: 'none', md: 'block' }}>
          <VendorNavBar />
        </Box>

        {/* Drawer (mobile nav) */}
        <Drawer isOpen={isMobileNavOpen} placement="left" onClose={onMobileNavClose}>
          <DrawerOverlay />
          <DrawerContent bg={sidebarBg} w={DESKTOP_SIDEBAR_WIDTH}>
            <DrawerBody p={0}><VendorNavBar onLinkClick={onMobileNavClose} /></DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Main content */}
        <Box flex="1" ml={{ base: 0, md: DESKTOP_SIDEBAR_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
                     {/* Header - Visible on all screen sizes */}
           <Flex align="center" gap={2} mb={4}>
             <IconButton
               aria-label="Open menu"
               icon={<HamburgerIcon w={5} h={5} />}
               onClick={onMobileNavOpen}
               size="sm"
               variant="ghost"
               color={iconColor}
               p={1}
               mt="-1"
               _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.200' } }}
               display={{ base: 'block', md: 'none' }}
             />
             <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2" fontWeight="bold">
               Available Products
             </Heading>
           </Flex>

          {isLoading ? (
            <Center h="300px"><Spinner size="xl" /></Center>
          ) : products.length === 0 ? (
            <Center flexDirection="column" h="300px" textAlign="center" gap={4}>
              <WarningTwoIcon w={10} h={10} color="gray.400" />
              <Text fontSize="lg" fontWeight="bold" color="gray.500">
                No available products, please try again later!
              </Text>
              <Button
                leftIcon={<RepeatIcon />}
                colorScheme="blue"
                variant="solid"
                onClick={fetchData}
              >
                Refresh
              </Button>
            </Center>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
              {products.map(product => {
                // Check quota phase and calculate display units
                const isPersonalQuota = product.quota_phase === 'personal_quota';
                const displayUnits = isPersonalQuota ? product.vendor_remaining_quota : product.available_stock;
                
                console.log(`🔍 [FRONTEND] Product ${product.product_id}:`, {
                  quota_phase: product.quota_phase,
                  available_stock: product.available_stock,
                  vendor_remaining_quota: product.vendor_remaining_quota,
                  displayUnits
                });
                
                return (
                  <VStack key={product.product_id} borderWidth="1px" borderRadius="lg" p={4} spacing={4} align="stretch" justify="space-between" bg={productCardBg} boxShadow="md">
                    <Box>
                      <Image src={product.product_image_url} h="150px" w="full" objectFit="cover" borderRadius="md" fallbackSrc="https://via.placeholder.com/150" />
                      <Heading size="md" mt={4} fontWeight="bold">{product.paper_type}</Heading>
                      <Text fontWeight="bold">Size: {product.size}</Text>
                      <Text fontWeight="bold">Available: {displayUnits} units</Text>
                      <Text fontWeight="bold" color="green.600" fontSize="sm">
                        Profit: ₹{product.selling_price && product.price_per_slot ? (product.selling_price - product.price_per_slot).toFixed(2) : 'N/A'}
                      </Text>
                      <Heading size="sm" mt={2} fontWeight="bold">₹{product.price_per_slot}</Heading>
                      <Text fontSize="xs" color="gray.500" textAlign="center">
                        Buy Price per Slot
                      </Text>
                    </Box>
                    <Button colorScheme="blue" onClick={() => handleBuyClick(product)} isDisabled={displayUnits <= 0 || isSubmitting}>
                      {displayUnits > 0 ? 'Buy Stock' : 'Out of Stock'}
                    </Button>
                  </VStack>
                );
              })}
            </SimpleGrid>
          )}
        </Box>
      </Flex>

      {/* Purchase Modal */}
      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={onPurchaseModalClose}
        product={selectedProduct}
        onProceed={handleProceed}
        walletBalance={walletBalance}
      />
    </>
  );
};

export default BuyProduct;
