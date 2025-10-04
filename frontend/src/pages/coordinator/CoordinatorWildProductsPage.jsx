import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, VStack, Heading, Button, IconButton, useToast, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td,
  Image, Tag, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, NumberInput, NumberInputField, AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useColorModeValue, Text, Badge, HStack,
  Drawer, DrawerOverlay, DrawerContent, SimpleGrid, Stack, Divider
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon, HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import CoordinatorNavBar, { NAV_WIDTH } from '../../components/layout/CoordinatorNavBar';

const WildProductModal = ({ isOpen, onClose, onSave, wildProduct, isEditing }) => {
  const initialFormState = {
    product_name: '',
    base_price: '',
    selling_price: '',
    selling_price_2: '',
    selling_price_3: '',
    gst_percentage: 18.00,
    available_stock: '',
    selling_date_count: 30
  };

  const [formData, setFormData] = useState(initialFormState);
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && wildProduct) {
        setFormData({
          product_name: wildProduct.product_name || '',
          base_price: wildProduct.base_price || '',
          selling_price: wildProduct.selling_price || '',
          selling_price_2: wildProduct.selling_price_2 || '',
          selling_price_3: wildProduct.selling_price_3 || '',
          gst_percentage: wildProduct.gst_percentage || 18.00,
          available_stock: wildProduct.available_stock || '',
          selling_date_count: wildProduct.selling_date_count || 30
        });
      } else {
        setFormData(initialFormState);
      }
      setImageFile(null);
    }
  }, [isOpen, wildProduct, isEditing]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNumberChange = (value, name) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await onSave(formData, imageFile);
    setIsLoading(false);
  };

  // Calculate final price for display
  const finalPrice = formData.base_price && formData.gst_percentage 
    ? (parseFloat(formData.base_price) * (1 + parseFloat(formData.gst_percentage) / 100)).toFixed(2)
    : '0.00';

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader fontWeight="bold">{isEditing ? 'Edit Wild Product' : 'Add New Wild Product'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {!isEditing && (
            <>
              <FormControl isRequired>
                <FormLabel fontWeight="bold">Product Name</FormLabel>
                <Input 
                  fontWeight="bold"
                  name="product_name" 
                  value={formData.product_name || ''} 
                  onChange={handleChange}
                  placeholder="Enter product name"
                />
              </FormControl>
              
              <FormControl mt={4} isRequired>
                <FormLabel fontWeight="bold">Product Image</FormLabel>
                <Input 
                  fontWeight="bold"
                  type="file" 
                  name="productImage" 
                  onChange={handleFileChange} 
                  p={1.5}
                  accept="image/*"
                />
              </FormControl>
            </>
          )}

          <FormControl mt={4} isRequired>
            <FormLabel fontWeight="bold">Base Price (₹)</FormLabel>
            <NumberInput 
              value={formData.base_price || ''} 
              onChange={(value) => handleNumberChange(value, 'base_price')}
              min={0}
              precision={2}
            >
              <NumberInputField fontWeight="bold" placeholder="Enter base price" />
            </NumberInput>
          </FormControl>

          <FormControl mt={4} isRequired>
            <FormLabel fontWeight="bold">Selling Price 1 (Primary) (₹)</FormLabel>
            <NumberInput 
              value={formData.selling_price || ''} 
              onChange={(value) => handleNumberChange(value, 'selling_price')}
              min={0}
              precision={2}
            >
              <NumberInputField fontWeight="bold" placeholder="Enter primary selling price" />
            </NumberInput>
          </FormControl>

          <FormControl mt={4}>
            <FormLabel fontWeight="bold">Selling Price 2 (Secondary) (₹)</FormLabel>
            <NumberInput 
              value={formData.selling_price_2 || ''} 
              onChange={(value) => handleNumberChange(value, 'selling_price_2')}
              min={0}
              precision={2}
            >
              <NumberInputField fontWeight="bold" placeholder="Enter secondary selling price" />
            </NumberInput>
          </FormControl>

          <FormControl mt={4}>
            <FormLabel fontWeight="bold">Selling Price 3 (Tertiary) (₹)</FormLabel>
            <NumberInput 
              value={formData.selling_price_3 || ''} 
              onChange={(value) => handleNumberChange(value, 'selling_price_3')}
              min={0}
              precision={2}
            >
              <NumberInputField fontWeight="bold" placeholder="Enter tertiary selling price" />
            </NumberInput>
          </FormControl>

          <FormControl mt={4} isRequired>
            <FormLabel fontWeight="bold">GST Percentage (%)</FormLabel>
            <NumberInput 
              value={formData.gst_percentage || 18.00} 
              onChange={(value) => handleNumberChange(value, 'gst_percentage')}
              min={0}
              max={100}
              precision={2}
            >
              <NumberInputField fontWeight="bold" placeholder="Enter GST percentage" />
            </NumberInput>
          </FormControl>

          <FormControl mt={4} isRequired>
            <FormLabel fontWeight="bold">Available Stock</FormLabel>
            <NumberInput 
              value={formData.available_stock || ''} 
              onChange={(value) => handleNumberChange(value, 'available_stock')}
              min={0}
            >
              <NumberInputField fontWeight="bold" placeholder="Enter available stock" />
            </NumberInput>
          </FormControl>

          <FormControl mt={4}>
            <FormLabel fontWeight="bold">Selling Days Count</FormLabel>
            <NumberInput 
              value={formData.selling_date_count || 30} 
              onChange={(value) => handleNumberChange(value, 'selling_date_count')}
              min={0}
            >
              <NumberInputField fontWeight="bold" placeholder="Enter selling days count" />
            </NumberInput>
          </FormControl>

          {formData.base_price && formData.gst_percentage && (
            <Box mt={4} p={3} bg="blue.50" borderRadius="md">
              <Text fontSize="sm" color="blue.600">
                <strong>Final Price (including GST): ₹{finalPrice}</strong>
              </Text>
            </Box>
          )}
        </ModalBody>
        <ModalFooter>
          <Button fontWeight="bold" variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button fontWeight="bold" colorScheme="blue" type="submit" isLoading={isLoading}>
            {isEditing ? 'Update' : 'Add'} Wild Product
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const CoordinatorWildProductsPage = ({ url }) => {
  const { token } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const drawer = useDisclosure();
  
  const [wildProducts, setWildProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentWildProduct, setCurrentWildProduct] = useState(null);
  const [wildProductToDelete, setWildProductToDelete] = useState(null);
  const cancelRef = React.useRef();

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const cardBg = useColorModeValue('white', 'gray.700');

  // A component to render a single wild product's data row in a card
  const CardDataRow = ({ label, children, labelColor = 'gray.500' }) => (
    <Flex justify="space-between" align="center">
      <Text fontSize="sm" color={labelColor} fontWeight="bold">{label}</Text>
      <Box textAlign="right" fontWeight="bold">{children}</Box>
    </Flex>
  );

  const fetchWildProducts = useCallback(async () => {
    console.log('🔍 CoordinatorWildProductsPage - Starting fetchWildProducts');
    console.log('🔍 CoordinatorWildProductsPage - Token available:', !!token);
    console.log('🔍 CoordinatorWildProductsPage - URL:', url);
    
    if (!token) {
      console.log('❌ CoordinatorWildProductsPage - No token available, skipping fetch');
      return;
    }
    
    setIsLoading(true);
    try {
      const apiUrl = `${url}/api/wild-products`;
      console.log('🔍 CoordinatorWildProductsPage - Fetching from:', apiUrl);
      
      const response = await fetch(apiUrl, { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      });
      
      console.log('🔍 CoordinatorWildProductsPage - Response status:', response.status);
      console.log('🔍 CoordinatorWildProductsPage - Response ok:', response.ok);
      
      const data = await response.json();
      console.log('🔍 CoordinatorWildProductsPage - Response data:', data);
      
      if (!response.ok) {
        console.error('❌ CoordinatorWildProductsPage - API Error:', data);
        throw new Error(data.message || 'Failed to fetch wild products');
      }
      
      console.log('✅ CoordinatorWildProductsPage - Successfully fetched wild products:', data.length || 'No wild products');
      setWildProducts(data);
    } catch (error) {
      console.error('❌ CoordinatorWildProductsPage - Fetch error:', error);
      toast({ 
        title: 'Error fetching wild products', 
        description: error.message, 
        status: 'error', 
        isClosable: true 
      });
    } finally { 
      console.log('🔍 CoordinatorWildProductsPage - Setting loading to false');
      setIsLoading(false); 
    }
  }, [token, toast, url]);

  useEffect(() => { 
    fetchWildProducts(); 
  }, [fetchWildProducts]);

  const handleSave = async (formData, imageFile) => {
    console.log('🔍 CoordinatorWildProductsPage - Starting handleSave');
    console.log('🔍 CoordinatorWildProductsPage - Form data:', formData);
    console.log('🔍 CoordinatorWildProductsPage - Image file:', imageFile);
    console.log('🔍 CoordinatorWildProductsPage - Is editing:', isEditing);
    console.log('🔍 CoordinatorWildProductsPage - Current wild product:', currentWildProduct);
    
    const preparedData = {
      ...formData,
      base_price: formData.base_price === '' || formData.base_price === null ? null : Number(formData.base_price),
      selling_price: formData.selling_price === '' || formData.selling_price === null ? null : Number(formData.selling_price),
      selling_price_2: formData.selling_price_2 === '' || formData.selling_price_2 === null ? null : Number(formData.selling_price_2),
      selling_price_3: formData.selling_price_3 === '' || formData.selling_price_3 === null ? null : Number(formData.selling_price_3),
      gst_percentage: formData.gst_percentage === '' || formData.gst_percentage === null ? 18.00 : Number(formData.gst_percentage),
      available_stock: formData.available_stock === '' || formData.available_stock === null ? null : Number(formData.available_stock),
      selling_date_count: formData.selling_date_count === '' || formData.selling_date_count === null ? 30 : Number(formData.selling_date_count),
    };

    console.log('🔍 CoordinatorWildProductsPage - Prepared data:', preparedData);

    const apiUrl = isEditing ? `${url}/api/wild-products/${currentWildProduct.wild_product_id}` : `${url}/api/wild-products`;
    const method = isEditing ? 'PUT' : 'POST';
    let body;
    let headers = { 'Authorization': `Bearer ${token}` };

    console.log('🔍 CoordinatorWildProductsPage - API URL:', apiUrl);
    console.log('🔍 CoordinatorWildProductsPage - Method:', method);

    try {
      if (isEditing) {
        body = JSON.stringify(preparedData);
        headers['Content-Type'] = 'application/json';
        console.log('🔍 CoordinatorWildProductsPage - Using JSON body for edit');
      } else {
        body = new FormData();
        for (const key in preparedData) {
          if (preparedData[key] !== null && preparedData[key] !== undefined) {
            body.append(key, preparedData[key]);
          }
        }
        if (imageFile) {
          console.log('🔍 CoordinatorWildProductsPage - Adding image file to FormData:', imageFile.name, imageFile.type);
          body.append('productImage', imageFile);
        } else {
          console.log('❌ CoordinatorWildProductsPage - No image file provided');
        }
        console.log('🔍 CoordinatorWildProductsPage - Using FormData for create');
      }

      console.log('🔍 CoordinatorWildProductsPage - Sending request...');
      const response = await fetch(apiUrl, { method, headers, body });
      console.log('🔍 CoordinatorWildProductsPage - Response status:', response.status);
      console.log('🔍 CoordinatorWildProductsPage - Response ok:', response.ok);
      
      const data = await response.json();
      console.log('🔍 CoordinatorWildProductsPage - Response data:', data);

      if (!response.ok) {
        console.error('❌ CoordinatorWildProductsPage - Save failed:', data);
        throw new Error(data.message || 'Failed to save wild product');
      }

      console.log('✅ CoordinatorWildProductsPage - Wild product saved successfully');
      toast({
        title: isEditing ? 'Wild Product Updated' : 'Wild Product Added',
        description: isEditing ? 'Wild product has been updated successfully' : 'Wild product has been added successfully',
        status: 'success',
        isClosable: true,
      });

      onClose();
      fetchWildProducts();
    } catch (error) {
      console.error('❌ CoordinatorWildProductsPage - Save error:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        isClosable: true,
      });
    }
  };

  const handleEdit = (wildProduct) => {
    console.log('🔍 CoordinatorWildProductsPage - Opening edit modal for wild product:', wildProduct);
    setCurrentWildProduct(wildProduct);
    setIsEditing(true);
    onOpen();
  };

  const handleAdd = () => {
    console.log('🔍 CoordinatorWildProductsPage - Opening add modal');
    setCurrentWildProduct(null);
    setIsEditing(false);
    onOpen();
  };

  const handleDelete = async () => {
    console.log('🔍 CoordinatorWildProductsPage - Starting handleDelete');
    console.log('🔍 CoordinatorWildProductsPage - Wild product to delete:', wildProductToDelete);
    
    try {
      const deleteUrl = `${url}/api/wild-products/${wildProductToDelete.wild_product_id}`;
      console.log('🔍 CoordinatorWildProductsPage - Delete URL:', deleteUrl);
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('🔍 CoordinatorWildProductsPage - Delete response status:', response.status);
      console.log('🔍 CoordinatorWildProductsPage - Delete response ok:', response.ok);

      if (!response.ok) {
        const data = await response.json();
        console.error('❌ CoordinatorWildProductsPage - Delete failed:', data);
        throw new Error(data.message || 'Failed to delete wild product');
      }

      console.log('✅ CoordinatorWildProductsPage - Wild product deleted successfully');
      toast({
        title: 'Wild Product Deleted',
        description: 'Wild product has been deleted successfully',
        status: 'success',
        isClosable: true,
      });

      onDeleteClose();
      fetchWildProducts();
    } catch (error) {
      console.error('❌ CoordinatorWildProductsPage - Delete error:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        isClosable: true,
      });
    }
  };

  const handleDeleteClick = (wildProduct) => {
    console.log('🔍 CoordinatorWildProductsPage - Opening delete alert for wild product:', wildProduct);
    setWildProductToDelete(wildProduct);
    onDeleteOpen();
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'available': return 'green';
      case 'low': return 'yellow';
      case 'out_of_stock': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Flex minH="100vh" bg={pageBg}>
      {/* Desktop sidebar */}
      <CoordinatorNavBar variant="static" onOpen={drawer.onOpen} />

      {/* Mobile drawer */}
      <Drawer isOpen={drawer.isOpen} placement="left" onClose={drawer.onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <CoordinatorNavBar variant="drawer" onClose={drawer.onClose} />
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <Box flex="1" ml={{ base: 0, md: NAV_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
        {/* Mobile header */}
        <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon w={5} h={5} />}
            onClick={drawer.onOpen}
            size="sm"
            variant="ghost"
          />
          <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">
            Wild Product Management
          </Heading>
        </Flex>

        <VStack spacing={{ base: 4, md: 8 }} align="stretch">
          {/* Page Header */}
          <Box>
            <HStack justify="space-between" align="center" mb={4}>
              <Heading size="lg" color={headingColor}>
                Wild Product Management
              </Heading>
              <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleAdd}>
                Add Wild Product
              </Button>
            </HStack>
          </Box>

          {/* Wild Products Grid */}
          {isLoading ? (
            <Center h="300px"><Spinner /></Center>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {wildProducts.map((wildProduct) => {
                const basePrice = parseFloat(wildProduct.base_price);
                const profit = parseFloat(wildProduct.profit);
                const marginPercentage = profit !== null && basePrice > 0 ? (profit * 100) / basePrice : null;
                
                return (
                  <Box key={wildProduct.wild_product_id} bg={cardBg} p={6} borderRadius="xl" boxShadow="lg" borderWidth="1px" borderColor="gray.200">
                    <Flex gap={4} align="start" mb={4}>
                      <Image 
                        src={wildProduct.product_image_url} 
                        alt={wildProduct.product_name}
                        boxSize="80px"
                        objectFit="cover"
                        borderRadius="md"
                        fallbackSrc="https://via.placeholder.com/80"
                      />
                      <Stack spacing={1} flex="1">
                        <Heading as="h3" size="md" fontWeight="bold">{wildProduct.product_name}</Heading>
                        <Text fontSize="sm" color="gray.500" fontFamily="monospace">
                          ID: {wildProduct.wild_product_id}
                        </Text>
                        <Badge 
                          colorScheme={getStockStatusColor(wildProduct.stock_status)}
                          size="sm"
                          w="fit-content"
                          mt={2}
                        >
                          {wildProduct.stock_status} ({wildProduct.available_stock} in stock)
                        </Badge>
                      </Stack>
                    </Flex>
                    
                    <Divider my={4} />

                    <Stack spacing={3}>
                      <CardDataRow label="Base Price">₹{wildProduct.base_price}</CardDataRow>
                      <CardDataRow label="Selling Price 1">₹{wildProduct.selling_price}</CardDataRow>
                      <CardDataRow label="Selling Price 2">
                        ₹{wildProduct.selling_price_2 || 'N/A'}
                      </CardDataRow>
                      <CardDataRow label="Selling Price 3">
                        ₹{wildProduct.selling_price_3 || 'N/A'}
                      </CardDataRow>
                      <CardDataRow label="GST %">{wildProduct.gst_percentage}%</CardDataRow>
                      <CardDataRow label="Final Price">
                        <Text color="green.500">₹{wildProduct.final_price}</Text>
                      </CardDataRow>
                      <CardDataRow label="Profit">
                        <Text color={wildProduct.profit >= 0 ? "green.500" : "red.500"}>
                          ₹{wildProduct.profit?.toFixed(2) || '0.00'}
                        </Text>
                      </CardDataRow>
                      <CardDataRow label="Margin %">
                        <Text color={marginPercentage > 0 ? "green.500" : marginPercentage < 0 ? "red.500" : "inherit"}>
                          {marginPercentage !== null ? `${marginPercentage.toFixed(2)}%` : 'N/A'}
                        </Text>
                      </CardDataRow>
                      <CardDataRow label="Selling Days">
                        {wildProduct.selling_date_count || 30} days
                      </CardDataRow>
                    </Stack>

                    <Divider my={4} />
                    
                    <Flex justify="space-between" align="center">
                      <Text fontSize="sm" color="gray.500">
                        Updated: {new Date(wildProduct.last_updated).toLocaleDateString('en-IN')}
                      </Text>
                      <HStack spacing={2}>
                        <IconButton
                          icon={<EditIcon />}
                          aria-label="Edit wild product"
                          size="sm"
                          colorScheme="blue"
                          variant="ghost"
                          onClick={() => handleEdit(wildProduct)}
                        />
                        <IconButton
                          icon={<DeleteIcon />}
                          aria-label="Delete wild product"
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleDeleteClick(wildProduct)}
                        />
                      </HStack>
                    </Flex>
                  </Box>
                );
              })}
            </SimpleGrid>
          )}
        </VStack>

        {/* Wild Product Modal */}
        <WildProductModal
          isOpen={isOpen}
          onClose={onClose}
          onSave={handleSave}
          wildProduct={currentWildProduct}
          isEditing={isEditing}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Wild Product
              </AlertDialogHeader>
              <AlertDialogBody fontWeight="bold">
                Are you sure you want to delete "{wildProductToDelete?.product_name}"? 
                This action cannot be undone.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button fontWeight="bold" ref={cancelRef} onClick={onDeleteClose}>
                  Cancel
                </Button>
                <Button fontWeight="bold" colorScheme="red" onClick={handleDelete} ml={3}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </Flex>
  );
};

export default CoordinatorWildProductsPage;
