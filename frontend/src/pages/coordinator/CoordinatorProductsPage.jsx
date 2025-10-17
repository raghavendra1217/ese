import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, Heading, IconButton, useToast, Spinner, Center,
  Image, Tag, useDisclosure, Drawer, DrawerOverlay, DrawerContent, Text, useColorModeValue,
  Stack, Divider, SimpleGrid,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import CoordinatorNavBar, { NAV_WIDTH } from '../../components/layout/CoordinatorNavBar';


const CoordinatorProductsPage = ({ url }) => {
  const { token } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const drawer = useDisclosure();

  const fetchProducts = useCallback(async () => {
    console.log('🔍 CoordinatorProductsPage - Starting fetchProducts');
    console.log('🔍 CoordinatorProductsPage - Token available:', !!token);
    console.log('🔍 CoordinatorProductsPage - URL:', url);
    
    if (!token) {
      console.log('❌ CoordinatorProductsPage - No token available, skipping fetch');
      return;
    }
    
    setIsLoading(true);
    try {
      const apiUrl = `${url}/api/products`;
      console.log('🔍 CoordinatorProductsPage - Fetching from:', apiUrl);
      
      const response = await fetch(apiUrl, { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      });
      
      console.log('🔍 CoordinatorProductsPage - Response status:', response.status);
      console.log('🔍 CoordinatorProductsPage - Response ok:', response.ok);
      
      const data = await response.json();
      console.log('🔍 CoordinatorProductsPage - Response data:', data);
      
      if (!response.ok) {
        console.error('❌ CoordinatorProductsPage - API Error:', data);
        throw new Error(data.message || 'Failed to fetch products');
      }
      
      console.log('✅ CoordinatorProductsPage - Successfully fetched products:', data.length || 'No products');
      setProducts(data);
    } catch (error) {
      console.error('❌ CoordinatorProductsPage - Fetch error:', error);
      toast({ 
        title: 'Error fetching products', 
        description: error.message, 
        status: 'error', 
        isClosable: true 
      });
    } finally { 
      console.log('🔍 CoordinatorProductsPage - Setting loading to false');
      setIsLoading(false); 
    }
  }, [token, toast, url]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const cardBg = useColorModeValue('white', 'gray.700');

  // A component to render a single product's data row in a card
  const CardDataRow = ({ label, children, labelColor = 'gray.500' }) => (
    <Flex justify="space-between" align="center">
      <Text fontSize="sm" color={labelColor} fontWeight="bold">{label}</Text>
      <Box textAlign="right" fontWeight="bold">{children}</Box>
    </Flex>
  );

  return (
    <Flex minH="100vh" bg={pageBg}>
      <CoordinatorNavBar variant="static" onOpen={drawer.onOpen} />
      <Drawer isOpen={drawer.isOpen} placement="left" onClose={drawer.onClose}>
        <DrawerOverlay /><DrawerContent><CoordinatorNavBar variant="drawer" onClose={drawer.onClose} /></DrawerContent>
      </Drawer>
      
      <Box p={{ base: 4, sm: 6, md: 8 }} ml={{ base: 0, md: NAV_WIDTH }} flex="1">
        <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
          <IconButton aria-label="Open menu" icon={<HamburgerIcon w={5} h={5} />} onClick={drawer.onOpen} size="sm" variant="ghost" />
          <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2" fontWeight="bold">Products</Heading>
        </Flex>

        <Flex justify="space-between" align="center" mb={8} display={{ base: 'none', md: 'flex' }}>
          <Heading fontWeight="bold">Products</Heading>
        </Flex>

        {isLoading ? (
          <Center h="300px"><Spinner /></Center>
        ) : (
          <>
            {/* Grid layout with 3 cards per row */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {products.map(p => {
                 const pricePerSlot = parseFloat(p.price_per_slot);
                 const sellingPrice = parseFloat(p.selling_price);
                 const profit = !isNaN(sellingPrice) && !isNaN(pricePerSlot) ? sellingPrice - pricePerSlot : null;
                 const marginPercentage = profit !== null && pricePerSlot > 0 ? (profit * 100) / pricePerSlot : null;

                 return (
                  <Box key={p.product_id} bg={cardBg} p={6} borderRadius="xl" boxShadow="lg" borderWidth="1px" borderColor="gray.200">
                    <Flex gap={4} align="start" mb={4}>
                      <Image src={p.product_image_url} boxSize="80px" objectFit="cover" borderRadius="md" />
                      <Stack spacing={1} flex="1">
                        <Heading as="h3" size="md" fontWeight="bold">{p.paper_type}</Heading>
                        <Text fontSize="sm" color="gray.500">ID: {p.product_id} | GSM: {p.gsm}</Text>
                        <Tag 
                          size="sm" 
                          mt={2} 
                          w="fit-content"
                          colorScheme={p.stock_status === 'available' ? 'green' : p.stock_status === 'low' ? 'orange' : 'red'}>
                            {p.stock_status} ({p.available_stock} in stock)
                        </Tag>
                      </Stack>
                    </Flex>
                    
                    <Divider my={4} />

                    <Stack spacing={3}>
                       <CardDataRow label="Price/Slot">₹{pricePerSlot.toFixed(2)}</CardDataRow>
                       <CardDataRow label="Selling Price">₹{sellingPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</CardDataRow>
                       <CardDataRow label="Profit">
                         <Text as="span" color={profit > 0 ? 'green.500' : profit < 0 ? 'red.500' : 'inherit'}>
                           ₹{profit !== null ? profit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 'N/A'}
                         </Text>
                       </CardDataRow>
                       <CardDataRow label="Margin %">
                         <Text as="span" color={marginPercentage > 0 ? 'green.500' : marginPercentage < 0 ? 'red.500' : 'inherit'}>
                           {marginPercentage !== null ? `${marginPercentage.toFixed(2)}%` : 'N/A'}
                         </Text>
                       </CardDataRow>
                    </Stack>

                    <Divider my={4} />
                    
                    <Flex justify="space-between" align="center">
                        <Text fontSize="sm" color="gray.500">
                          Updated: {new Date(p.last_updated).toLocaleDateString('en-IN')}
                        </Text>
                    </Flex>
                  </Box>
                 )
              })}
            </SimpleGrid>
          </>
        )}

      </Box>
    </Flex>
  );
};

export default CoordinatorProductsPage;
