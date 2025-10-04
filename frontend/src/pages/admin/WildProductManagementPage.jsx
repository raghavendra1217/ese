import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, VStack, Heading, Button, IconButton, useToast, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td,
  Image, Tag, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, NumberInput, NumberInputField, AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useColorModeValue, Text, Badge, HStack,
  Drawer, DrawerOverlay, DrawerContent
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon, HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import AdminNavBar from '../../components/layout/AdminNavBar';

const ADMIN_SIDEBAR_W = '80px';

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

const WildProductManagementPage = ({ url }) => {
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

  const fetchWildProducts = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${url}/api/wild-products`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch wild products');
      console.log('🔍 Fetched wild products:', data);
      setWildProducts(data);
    } catch (error) {
      toast({ 
        title: 'Error fetching wild products', 
        description: error.message, 
        status: 'error', 
        isClosable: true 
      });
    } finally { 
      setIsLoading(false); 
    }
  }, [token, toast, url]);

  useEffect(() => { 
    fetchWildProducts(); 
  }, [fetchWildProducts]);

  const handleSave = async (formData, imageFile) => {
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

    const apiUrl = isEditing ? `${url}/api/wild-products/${currentWildProduct.wild_product_id}` : `${url}/api/wild-products`;
    const method = isEditing ? 'PUT' : 'POST';
    let body;
    let headers = { 'Authorization': `Bearer ${token}` };

    try {
      if (isEditing) {
        body = JSON.stringify(preparedData);
        headers['Content-Type'] = 'application/json';
      } else {
        body = new FormData();
        for (const key in preparedData) {
          if (preparedData[key] !== null && preparedData[key] !== undefined) {
            body.append(key, preparedData[key]);
          }
        }
        if (imageFile) {
          console.log('🔍 Adding image file to FormData:', imageFile.name, imageFile.type);
          body.append('productImage', imageFile);
        } else {
          console.log('❌ No image file provided');
        }
      }

      const response = await fetch(apiUrl, { method, headers, body });
      const data = await response.json();

      console.log('🔍 Wild product save response:', data);

      if (!response.ok) throw new Error(data.message || 'Failed to save wild product');

      toast({
        title: isEditing ? 'Wild Product Updated' : 'Wild Product Added',
        description: isEditing ? 'Wild product has been updated successfully' : 'Wild product has been added successfully',
        status: 'success',
        isClosable: true,
      });

      onClose();
      fetchWildProducts();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        isClosable: true,
      });
    }
  };

  const handleEdit = (wildProduct) => {
    setCurrentWildProduct(wildProduct);
    setIsEditing(true);
    onOpen();
  };

  const handleAdd = () => {
    setCurrentWildProduct(null);
    setIsEditing(false);
    onOpen();
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${url}/api/wild-products/${wildProductToDelete.wild_product_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete wild product');
      }

      toast({
        title: 'Wild Product Deleted',
        description: 'Wild product has been deleted successfully',
        status: 'success',
        isClosable: true,
      });

      onDeleteClose();
      fetchWildProducts();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        isClosable: true,
      });
    }
  };

  const handleDeleteClick = (wildProduct) => {
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
      <AdminNavBar variant="static" onOpen={drawer.onOpen} />

      {/* Mobile drawer */}
      <Drawer isOpen={drawer.isOpen} placement="left" onClose={drawer.onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <AdminNavBar variant="drawer" onClose={drawer.onClose} />
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <Box flex="1" ml={{ base: 0, md: ADMIN_SIDEBAR_W }} p={{ base: 4, sm: 6, md: 8 }}>
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

          {/* Wild Products Table */}
          {isLoading ? (
            <Center h="300px"><Spinner /></Center>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple" minW="1200px">
                <Thead>
                  <Tr>
                    <Th>Image</Th>
                    <Th>ID</Th>
                    <Th>Product Name</Th>
                    <Th>Base Price</Th>
                    <Th>Selling Price 1</Th>
                    <Th>Selling Price 2</Th>
                    <Th>Selling Price 3</Th>
                    <Th>GST %</Th>
                    <Th>Final Price</Th>
                    <Th>Profit</Th>
                    <Th>Stock</Th>
                    <Th>Status</Th>
                    <Th>Margin %</Th>
                    <Th>Selling Days</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {wildProducts.map((wildProduct) => {
                    const basePrice = parseFloat(wildProduct.base_price);
                    const profit = parseFloat(wildProduct.profit);
                    const marginPercentage = profit !== null && basePrice > 0 ? (profit * 100) / basePrice : null;
                    
                    return (
                    <Tr key={wildProduct.wild_product_id}>
                      <Td>
                        <Image 
                          src={wildProduct.product_image_url} 
                          alt={wildProduct.product_name}
                          boxSize="50px"
                          objectFit="cover"
                          borderRadius="md"
                          fallbackSrc="https://via.placeholder.com/50"
                        />
                      </Td>
                      <Td fontFamily="monospace" fontSize="sm">
                        {wildProduct.wild_product_id}
                      </Td>
                      <Td fontWeight="medium">{wildProduct.product_name}</Td>
                      <Td>₹{wildProduct.base_price}</Td>
                      <Td>₹{wildProduct.selling_price}</Td>
                      <Td>₹{wildProduct.selling_price_2 || 'N/A'}</Td>
                      <Td>₹{wildProduct.selling_price_3 || 'N/A'}</Td>
                      <Td>{wildProduct.gst_percentage}%</Td>
                      <Td fontWeight="bold" color="green.500">
                        ₹{wildProduct.final_price}
                      </Td>
                      <Td fontWeight="bold" color={wildProduct.profit >= 0 ? "green.500" : "red.500"}>
                        ₹{wildProduct.profit?.toFixed(2) || '0.00'}
                      </Td>
                      <Td>{wildProduct.available_stock}</Td>
                      <Td>
                        <Badge colorScheme={getStockStatusColor(wildProduct.stock_status)}>
                          {wildProduct.stock_status}
                        </Badge>
                      </Td>
                      <Td fontWeight="bold" color={marginPercentage > 0 ? "green.500" : marginPercentage < 0 ? "red.500" : "inherit"}>
                        {marginPercentage !== null ? `${marginPercentage.toFixed(2)}%` : 'N/A'}
                      </Td>
                      <Td>{wildProduct.selling_date_count || 30} days</Td>
                      <Td>
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
                      </Td>
                    </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
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

export default WildProductManagementPage;
