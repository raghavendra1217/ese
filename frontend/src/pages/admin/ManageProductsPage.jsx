// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   Box, Flex, Heading, Button, IconButton, useToast, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td,
//   Image, Tag, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
//   FormControl, FormLabel, Input, Select, NumberInput, NumberInputField, AlertDialog, AlertDialogBody, AlertDialogFooter,
//   AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, Drawer, DrawerOverlay, DrawerContent, Text, useColorModeValue
// } from '@chakra-ui/react';
// import { EditIcon, DeleteIcon, AddIcon, HamburgerIcon } from '@chakra-ui/icons';
// import { useAuth } from '../../AppContext';
// import AdminNavBar from '../../components/layout/AdminNavBar';

// const ADMIN_SIDEBAR_W = '80px';

// const ProductModal = ({ isOpen, onClose, onSave, product, isEditing }) => {
//   const initialFormState = {
//     paper_type: '', size: '', gsm: '', price_per_slot: '', selling_price: '',
//     available_stock: ''
//   };

//   const [formData, setFormData] = useState(initialFormState);
//   const [imageFile, setImageFile] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     if (isOpen) {
//       if (isEditing && product) setFormData(product);
//       else setFormData(initialFormState);
//       setImageFile(null);
//     }
//   }, [isOpen, product, isEditing]);

//   const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
//   const handleNumberChange = (value, name) => { setFormData({ ...formData, [name]: value }); };
//   const handleFileChange = (e) => { if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]); };

//   const handleSubmit = async (e) => { e.preventDefault(); setIsLoading(true); await onSave(formData, imageFile); setIsLoading(false); };

//   return (
//     <Modal isOpen={isOpen} onClose={onClose} isCentered>
//       <ModalOverlay />
//       <ModalContent as="form" onSubmit={handleSubmit}>
//         <ModalHeader fontWeight="bold">{isEditing ? 'Edit Product' : 'Add New Product'}</ModalHeader>
//         <ModalCloseButton />
//         <ModalBody pb={6}>
//           {!isEditing && (
//             <>
//               <FormControl isRequired><FormLabel fontWeight="bold">Paper Type</FormLabel><Input fontWeight="bold" name="paper_type" value={formData.paper_type || ''} onChange={handleChange} /></FormControl>
//               <FormControl mt={4} isRequired><FormLabel fontWeight="bold">Product Image</FormLabel><Input type="file" name="productImage" onChange={handleFileChange} p={1.5} fontWeight="bold" /></FormControl>
//               <FormControl mt={4} isRequired><FormLabel fontWeight="bold">Size</FormLabel><Input fontWeight="bold" name="size" value={formData.size || ''} onChange={handleChange} /></FormControl>
//               <FormControl mt={4} isRequired><FormLabel fontWeight="bold">GSM</FormLabel>
//                 <NumberInput value={formData.gsm || ''} onChange={(value) => handleNumberChange(value, 'gsm')}>
//                   <NumberInputField name="gsm" fontWeight="bold" />
//                 </NumberInput>
//               </FormControl>
//             </>
//           )}
//           <FormControl mt={4} isRequired><FormLabel fontWeight="bold">Price Per Slot</FormLabel>
//             <NumberInput precision={2} value={formData.price_per_slot || ''} onChange={(value) => handleNumberChange(value, 'price_per_slot')}>
//               <NumberInputField name="price_per_slot" fontWeight="bold" />
//             </NumberInput>
//           </FormControl>
//           <FormControl mt={4} isRequired><FormLabel fontWeight="bold">Selling Price</FormLabel>
//             <NumberInput value={formData.selling_price || ''} onChange={(value) => handleNumberChange(value, 'selling_price')} min={0} precision={2} step={0.01}>
//               <NumberInputField name="selling_price" fontWeight="bold" />
//             </NumberInput>
//           </FormControl>
//           <FormControl mt={4} isRequired><FormLabel fontWeight="bold">Stock Status</FormLabel>
//             <Box p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
//               <Text fontSize="sm" color="gray.600">
//                 Stock status is automatically calculated based on available stock:
//                 <br />• 0 stock = Out of Stock
//                 <br />• 1-80 stock = Low
//                 <br />• 80+ stock = Available
//               </Text>
//             </Box>
//           </FormControl>
//           <FormControl mt={4} isRequired><FormLabel fontWeight="bold">Available Stock</FormLabel>
//             <NumberInput value={formData.available_stock || ''} onChange={(value) => handleNumberChange(value, 'available_stock')}>
//               <NumberInputField name="available_stock" fontWeight="bold" />
//             </NumberInput>
//           </FormControl>
//         </ModalBody>
//         <ModalFooter>
//           <Button fontWeight="bold" colorScheme="blue" mr={3} type="submit" isLoading={isLoading}>Save</Button>
//           <Button fontWeight="bold" onClick={onClose}>Cancel</Button>
//         </ModalFooter>
//       </ModalContent>
//     </Modal>
//   );
// };

// const ManageProductsPage = ({ url }) => {
//   const { token } = useAuth();
//   const toast = useToast();
//   const [products, setProducts] = useState([]);
//   const [currentProduct, setCurrentProduct] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const { isOpen, onOpen, onClose } = useDisclosure();
//   const drawer = useDisclosure();
//   const [deleteAlert, setDeleteAlert] = useState({ isOpen: false, productId: null });
//   const cancelRef = React.useRef();

//   const fetchProducts = useCallback(async () => {
//     if (!token) return;
//     setIsLoading(true);
//     try {
//       const response = await fetch(`${url}/api/products`, { headers: { 'Authorization': `Bearer ${token}` } });
//       const data = await response.json();
//       if (!response.ok) throw new Error(data.message || 'Failed to fetch products');
//       setProducts(data);
//     } catch (error) {
//       toast({ title: 'Error fetching products', description: error.message, status: 'error', isClosable: true });
//     } finally { setIsLoading(false); }
//   }, [token, toast, url]);

//   useEffect(() => { fetchProducts(); }, [fetchProducts]);

//   const handleSave = async (formData, imageFile) => {
//     const preparedData = {
//       ...formData,
//       gsm: formData.gsm === '' || formData.gsm === null ? null : Number(formData.gsm),
//       price_per_slot: formData.price_per_slot === '' || formData.price_per_slot === null ? null : Number(formData.price_per_slot),
//       selling_price: formData.selling_price === '' || formData.selling_price === null ? null : Number(formData.selling_price),
//       available_stock: formData.available_stock === '' || formData.available_stock === null ? null : Number(formData.available_stock),
//     };

//     const apiUrl = isEditing ? `${url}/api/products/${currentProduct.product_id}` : `${url}/api/products`;
//     const method = isEditing ? 'PUT' : 'POST';
//     let body;
//     let headers = { 'Authorization': `Bearer ${token}` };

//     try {
//       if (isEditing) {
//         body = JSON.stringify(preparedData);
//         headers['Content-Type'] = 'application/json';
//       } else {
//         body = new FormData();
//         for (const key in preparedData) {
//           if (preparedData[key] !== null && preparedData[key] !== undefined) body.append(key, preparedData[key]);
//         }
//         if (imageFile) body.append('productImage', imageFile);
//       }

//       const response = await fetch(apiUrl, { method, headers, body });
//       const data = await response.json();
//       if (!response.ok) throw new Error(data.message || 'Failed to save product');
//       toast({ title: `Product ${isEditing ? 'updated' : 'added'}`, status: 'success', isClosable: true });
//       onClose();
//       fetchProducts();
//     } catch (error) {
//       toast({ title: 'Error saving product', description: error.message, status: 'error', isClosable: true });
//     }
//   };

//   const openAddModal = () => { setCurrentProduct(null); setIsEditing(false); onOpen(); };
//   const openEditModal = (product) => { setCurrentProduct(product); setIsEditing(true); onOpen(); };
//   const openDeleteAlert = (productId) => { setDeleteAlert({ isOpen: true, productId }); };
//   const closeDeleteAlert = () => { setDeleteAlert({ isOpen: false, productId: null }); };

//   const handleDelete = async () => {
//     try {
//       const response = await fetch(`${url}/api/products/${deleteAlert.productId}`, {
//         method: 'DELETE',
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (!response.ok) {
//         const data = await response.json().catch(() => ({}));
//         throw new Error(data.message || 'Failed to delete product');
//       }
//       toast({ title: 'Product Deleted', status: 'success', isClosable: true });
//       closeDeleteAlert();
//       fetchProducts();
//     } catch (error) {
//       toast({ title: 'Error deleting product', description: error.message, status: 'error', isClosable: true });
//     }
//   };

//   const pageBg = useColorModeValue('gray.50', 'gray.900');
//   const headingColor = useColorModeValue('gray.800', 'gray.200');

//   return (
//     <Flex minH="100vh" bg={pageBg}>
//       {/* Desktop sidebar */}
//       <AdminNavBar variant="static" onOpen={drawer.onOpen} />
//       {/* Mobile drawer */}
//       <Drawer isOpen={drawer.isOpen} placement="left" onClose={drawer.onClose}>
//         <DrawerOverlay />
//         <DrawerContent>
//           <AdminNavBar variant="drawer" onClose={drawer.onClose} />
//         </DrawerContent>
//       </Drawer>

//       <Box p={{ base: 4, sm: 6, md: 8 }} ml={{ base: 0, md: ADMIN_SIDEBAR_W }} flex="1">
//         {/* Mobile header */}
//         <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
//           <IconButton aria-label="Open menu" icon={<HamburgerIcon w={5} h={5} />} onClick={drawer.onOpen} size="sm" variant="ghost" />
//           <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2" fontWeight="bold">Manage Products</Heading>
//         </Flex>

//         <Flex justify="space-between" align="center" mb={8} display={{ base: 'none', md: 'flex' }}>
//           <Heading fontWeight="bold">Manage Products</Heading>
//           <Button fontWeight="bold" leftIcon={<AddIcon />} colorScheme="teal" onClick={openAddModal}>Add New Product</Button>
//         </Flex>

//         {/* Mobile "Add" button mirrors desktop action */}
//         <Box display={{ base: 'block', md: 'none' }} mb={4}>
//           <Button fontWeight="bold" leftIcon={<AddIcon />} colorScheme="teal" onClick={openAddModal} w="full">Add New Product</Button>
//         </Box>

//         {isLoading ? (
//           <Center h="300px"><Spinner /></Center>
//         ) : (
//           <Box overflowX="auto">
//             <Table variant="simple">
//               <Thead>
//                 <Tr>
//                   <Th fontWeight="bold">Image</Th><Th fontWeight="bold">ID</Th><Th fontWeight="bold">Paper Type</Th><Th fontWeight="bold">GSM</Th>
//                   <Th fontWeight="bold">Price/Slot</Th><Th fontWeight="bold">Selling Price</Th><Th fontWeight="bold">Profits</Th><Th fontWeight="bold">Stock</Th><Th fontWeight="bold">Status</Th><Th fontWeight="bold">Last Updated</Th><Th fontWeight="bold">Actions</Th>
//                 </Tr>
//               </Thead>
//               <Tbody>
//                 {products.map(p => {
//                   const pricePerSlot = parseFloat(p.price_per_slot);
//                   const displayPricePerSlot = !isNaN(pricePerSlot) ? `₹${pricePerSlot.toFixed(2)}` : 'N/A';
//                   const sellingPrice = parseFloat(p.selling_price);
//                   const displaySellingPrice = !isNaN(sellingPrice)
//                     ? `₹${sellingPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
//                     : 'N/A';
                  
//                   // Calculate profit (Selling Price - Price Per Slot)
//                   const profit = !isNaN(sellingPrice) && !isNaN(pricePerSlot) 
//                     ? sellingPrice - pricePerSlot 
//                     : null;
//                   const displayProfit = profit !== null 
//                     ? `₹${profit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
//                     : 'N/A';
                  
//                   const lastUpdatedDate = new Date(p.last_updated);
//                   const displayLastUpdated = p.last_updated && !isNaN(lastUpdatedDate.getTime())
//                     ? lastUpdatedDate.toLocaleString('en-IN') : 'N/A';

//                   return (
//                     <Tr key={p.product_id}>
//                       <Td fontWeight="bold"><Image src={p.product_image_url} boxSize="50px" objectFit="cover" /></Td>
//                       <Td fontWeight="bold">{p.product_id || 'N/A'}</Td>
//                       <Td fontWeight="bold">{p.paper_type || 'N/A'}</Td>
//                       <Td fontWeight="bold">{p.gsm || 'N/A'}</Td>
//                       <Td fontWeight="bold">{displayPricePerSlot}</Td>
//                       <Td fontWeight="bold">{displaySellingPrice}</Td>
//                       <Td fontWeight="bold" color={profit !== null && profit > 0 ? "green.500" : profit !== null && profit < 0 ? "red.500" : "gray.500"}>
//                         {displayProfit}
//                       </Td>
//                       <Td fontWeight="bold">{p.available_stock}</Td>
//                       <Td fontWeight="bold"><Tag fontWeight="bold" colorScheme={p.stock_status === 'available' ? 'green' : p.stock_status === 'low' ? 'orange' : 'red'}>{p.stock_status || 'unknown'}</Tag></Td>
//                       <Td fontWeight="bold">{displayLastUpdated}</Td>
//                       <Td>
//                         <IconButton fontWeight="bold" icon={<EditIcon />} aria-label="Edit" mr={2} onClick={() => openEditModal(p)} />
//                         <IconButton fontWeight="bold" icon={<DeleteIcon />} aria-label="Delete" colorScheme="red" onClick={() => openDeleteAlert(p.product_id)} />
//                       </Td>
//                     </Tr>
//                   );
//                 })}
//               </Tbody>
//             </Table>
//           </Box>
//         )}

//         <ProductModal isOpen={isOpen} onClose={onClose} onSave={handleSave} product={currentProduct} isEditing={isEditing} />
//         <AlertDialog isOpen={deleteAlert.isOpen} leastDestructiveRef={cancelRef} onClose={closeDeleteAlert}>
//           <AlertDialogOverlay>
//             <AlertDialogContent>
//               <AlertDialogHeader fontWeight="bold">Delete Product</AlertDialogHeader>
//               <AlertDialogBody fontWeight="bold">Are you sure you want to delete this product? This action cannot be undone.</AlertDialogBody>
//               <AlertDialogFooter>
//                 <Button fontWeight="bold" ref={cancelRef} onClick={closeDeleteAlert}>Cancel</Button>
//                 <Button fontWeight="bold" colorScheme="red" onClick={handleDelete} ml={3}>Delete</Button>
//               </AlertDialogFooter>
//             </AlertDialogContent>
//           </AlertDialogOverlay>
//         </AlertDialog>
//       </Box>
//     </Flex>
//   );
// };

// export default ManageProductsPage;














import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Flex, Heading, Button, IconButton, useToast, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td,
  Image, Tag, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, FormHelperText, Input, Select, NumberInput, NumberInputField, AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, Drawer, DrawerOverlay, DrawerContent, Text, useColorModeValue,
  Stack, Divider, // NEW: Import Stack and Divider for card layout
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon, HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import AdminNavBar from '../../components/layout/AdminNavBar';

const ProductModal = ({ isOpen, onClose, onSave, product, isEditing }) => {
  const initialFormState = {
    paper_type: '', size: '', gsm: '', price_per_slot: '', selling_price: '',
    available_stock: '', selling_days: '', selling_price_2: '', selling_price_3: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sellingDaysError, setSellingDaysError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (isEditing && product) {
        setFormData({
          paper_type: product.paper_type || '',
          size: product.size || '',
          gsm: product.gsm || '',
          price_per_slot: product.price_per_slot || '',
          selling_price: product.selling_price || '',
          selling_price_2: product.selling_price_2 || '',
          selling_price_3: product.selling_price_3 || '',
          available_stock: product.available_stock || '',
          selling_days: product.selling_days ? String(product.selling_days) : ''
        });
      } else {
        setFormData(initialFormState);
      }
      setImageFile(null);
      setSellingDaysError('');
    }
  }, [isOpen, product, isEditing]);

  const handleChange = (e) => { 
    setFormData({ ...formData, [e.target.name]: e.target.value }); 
  };
  
  const handleNumberChange = (value, name) => { 
    setFormData({ ...formData, [name]: value }); 
  };
  
  const handleFileChange = (e) => { 
    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]); 
  };

  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    
    // Clear any previous errors
    setSellingDaysError('');
    
    // Validate required fields
    if (!formData.price_per_slot || !formData.selling_price || !formData.available_stock) {
      console.error('Missing required fields:', formData);
      return;
    }
    
    // Validate selling days before submission (only if not empty)
    if (formData.selling_days && String(formData.selling_days).trim() !== '') {
      const days = Number(formData.selling_days);
      if (days < 1 || days > 365 || isNaN(days) || days % 1 !== 0) {
        setSellingDaysError('Please enter a valid number of days (1-365) or leave empty for default');
        return;
      }
    }
    
    console.log('Submitting form data:', formData);
    console.log('Image file:', imageFile);
    
    setIsLoading(true); 
    try {
      await onSave(formData, imageFile); 
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader fontWeight="bold">{isEditing ? 'Edit Product' : 'Add New Product'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {!isEditing && (
            <>
              <FormControl isRequired><FormLabel fontWeight="bold">Paper Type</FormLabel><Input fontWeight="bold" name="paper_type" value={formData.paper_type || ''} onChange={handleChange} /></FormControl>
              <FormControl mt={4} isRequired><FormLabel fontWeight="bold">Product Image</FormLabel><Input type="file" name="productImage" onChange={handleFileChange} p={1.5} fontWeight="bold" /></FormControl>
              <FormControl mt={4} isRequired><FormLabel fontWeight="bold">Size</FormLabel><Input fontWeight="bold" name="size" value={formData.size || ''} onChange={handleChange} /></FormControl>
              <FormControl mt={4} isRequired><FormLabel fontWeight="bold">GSM</FormLabel>
                <NumberInput value={formData.gsm || ''} onChange={(value) => handleNumberChange(value, 'gsm')}>
                  <NumberInputField name="gsm" fontWeight="bold" />
                </NumberInput>
              </FormControl>
            </>
          )}
          <FormControl mt={4} isRequired><FormLabel fontWeight="bold">Price Per Slot</FormLabel>
            <NumberInput precision={2} value={formData.price_per_slot || ''} onChange={(value) => handleNumberChange(value, 'price_per_slot')}>
              <NumberInputField name="price_per_slot" fontWeight="bold" />
            </NumberInput>
          </FormControl>
          <FormControl mt={4} isRequired><FormLabel fontWeight="bold">Selling Price 1 (Primary)</FormLabel>
            <NumberInput value={formData.selling_price || ''} onChange={(value) => handleNumberChange(value, 'selling_price')} min={0} precision={2} step={0.01}>
              <NumberInputField name="selling_price" fontWeight="bold" />
            </NumberInput>
          </FormControl>
          <FormControl mt={4}><FormLabel fontWeight="bold">Selling Price 2 (Secondary)</FormLabel>
            <NumberInput value={formData.selling_price_2 || ''} onChange={(value) => handleNumberChange(value, 'selling_price_2')} min={0} precision={2} step={0.01}>
              <NumberInputField name="selling_price_2" fontWeight="bold" />
            </NumberInput>
          </FormControl>
          <FormControl mt={4}><FormLabel fontWeight="bold">Selling Price 3 (Tertiary)</FormLabel>
            <NumberInput value={formData.selling_price_3 || ''} onChange={(value) => handleNumberChange(value, 'selling_price_3')} min={0} precision={2} step={0.01}>
              <NumberInputField name="selling_price_3" fontWeight="bold" />
            </NumberInput>
          </FormControl>
          <FormControl mt={4} isRequired><FormLabel fontWeight="bold">Stock Status</FormLabel>
            <Box p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
              <Text fontSize="sm" color="gray.600">
                Stock status is automatically calculated based on available stock:
                <br />• 0 stock = Out of Stock
                <br />• 1-80 stock = Low
                <br />• 80+ stock = Available
              </Text>
            </Box>
          </FormControl>
          <FormControl mt={4} isRequired><FormLabel fontWeight="bold">Available Stock</FormLabel>
            <NumberInput value={formData.available_stock || ''} onChange={(value) => handleNumberChange(value, 'available_stock')}>
              <NumberInputField name="available_stock" fontWeight="bold" />
            </NumberInput>
          </FormControl>
          <FormControl mt={4}>
            <FormLabel fontWeight="bold">Selling Days</FormLabel>
            <Input 
              name="selling_days" 
              value={formData.selling_days || ''} 
              onChange={handleChange}
              placeholder="Enter number of days (default: 7)"
              fontWeight="bold"
              type="number"
              min="1"
              max="365"
            />
            <FormHelperText color="gray.600">
              <Text fontSize="sm">
                <Text as="span" fontWeight="semibold">Selling Rules (default: 7 days):</Text>
                <br />• Days 1-{Number(formData.selling_days) || 7}: Sell at purchase price (no profit/loss)
                <br />• Days {(Number(formData.selling_days) || 7) + 1}+: Sell at market price (potential profit/loss)
                <br />• Days {(Number(formData.selling_days) || 7) + 2}+: Market price + ₹1/day bonus (max ₹2 bonus)
                <br />• Leave empty to use default (7 days)
              </Text>
            </FormHelperText>
            {sellingDaysError && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {sellingDaysError}
              </Text>
            )}
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button fontWeight="bold" colorScheme="blue" mr={3} type="submit" isLoading={isLoading}>Save</Button>
          <Button fontWeight="bold" onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};


const ManageProductsPage = ({ url }) => {
  const { token, user } = useAuth();
  const toast = useToast();
  
  // Debug authentication
  console.log('ManageProductsPage - Auth Debug:', { token: token ? 'Present' : 'Missing', user });
  const [products, setProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const drawer = useDisclosure();
  const [deleteAlert, setDeleteAlert] = useState({ isOpen: false, productId: null });
  const cancelRef = useRef();

  const fetchProducts = useCallback(async () => {
    if (!token) {
      console.log('No token available for fetchProducts');
      return;
    }
    
    console.log('Fetching products with token:', token.substring(0, 20) + '...');
    setIsLoading(true);
    try {
      const response = await fetch(`${url}/api/products`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      
      console.log('Fetch products response status:', response.status);
      
      const data = await response.json();
      console.log('Fetch products response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch products');
      }
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({ title: 'Error fetching products', description: error.message, status: 'error', isClosable: true });
    } finally { 
      setIsLoading(false); 
    }
  }, [token, toast, url]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSave = async (formData, imageFile) => {
    console.log('handleSave called with:', { formData, imageFile, isEditing, currentProduct });
    
    const preparedData = {
      ...formData,
      gsm: formData.gsm === '' || formData.gsm === null ? null : Number(formData.gsm),
      price_per_slot: formData.price_per_slot === '' || formData.price_per_slot === null ? null : Number(formData.price_per_slot),
      selling_price: formData.selling_price === '' || formData.selling_price === null ? null : Number(formData.selling_price),
      selling_price_2: formData.selling_price_2 === '' || formData.selling_price_2 === null ? null : Number(formData.selling_price_2),
      selling_price_3: formData.selling_price_3 === '' || formData.selling_price_3 === null ? null : Number(formData.selling_price_3),
      available_stock: formData.available_stock === '' || formData.available_stock === null ? null : Number(formData.available_stock),
      selling_days: formData.selling_days === '' || formData.selling_days === null || formData.selling_days === undefined ? 7 : Number(formData.selling_days),
    };

    console.log('Prepared data:', preparedData);

    const apiUrl = isEditing ? `${url}/api/products/${currentProduct.product_id}` : `${url}/api/products`;
    const method = isEditing ? 'PUT' : 'POST';
    let body;
    let headers = { 'Authorization': `Bearer ${token}` };

    console.log('API URL:', apiUrl);
    console.log('Method:', method);

    try {
      if (isEditing) {
        body = JSON.stringify(preparedData);
        headers['Content-Type'] = 'application/json';
        console.log('Sending JSON body:', body);
      } else {
        body = new FormData();
        for (const key in preparedData) {
          if (preparedData[key] !== null && preparedData[key] !== undefined) {
            body.append(key, preparedData[key]);
          }
        }
        if (imageFile) body.append('productImage', imageFile);
        console.log('Sending FormData');
      }

      console.log('Making request with headers:', headers);
      const response = await fetch(apiUrl, { method, headers, body });
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save product');
      }
      
      toast({ 
        title: `Product ${isEditing ? 'updated' : 'added'} successfully`, 
        status: 'success', 
        isClosable: true 
      });
      
      onClose();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({ 
        title: 'Error saving product', 
        description: error.message, 
        status: 'error', 
        isClosable: true 
      });
      throw error; // Re-throw to handle in the modal
    }
  };

  const handleDelete = async () => {
    // ... (Your existing handleDelete logic, no changes needed)
    try {
      const response = await fetch(`${url}/api/products/${deleteAlert.productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete product');
      }
      toast({ title: 'Product Deleted', status: 'success', isClosable: true });
      closeDeleteAlert();
      fetchProducts();
    } catch (error) {
      toast({ title: 'Error deleting product', description: error.message, status: 'error', isClosable: true });
    }
  };

  const openAddModal = () => { setCurrentProduct(null); setIsEditing(false); onOpen(); };
  const openEditModal = (product) => { setCurrentProduct(product); setIsEditing(true); onOpen(); };
  const openDeleteAlert = (productId) => { setDeleteAlert({ isOpen: true, productId }); };
  const closeDeleteAlert = () => { setDeleteAlert({ isOpen: false, productId: null }); };
  
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');

  document.title = "NAVIU | Manage Products";

  // NEW: A component to render a single product's data row in a card
  const CardDataRow = ({ label, children, labelColor = 'gray.500' }) => (
    <Flex justify="space-between" align="center">
      <Text fontSize="sm" color={labelColor} fontWeight="bold">{label}</Text>
      <Box textAlign="right" fontWeight="bold">{children}</Box>
    </Flex>
  );

  return (
    <Flex minH="100vh" bg={pageBg}>
      <AdminNavBar variant="static" onOpen={drawer.onOpen} />
      <Drawer isOpen={drawer.isOpen} placement="left" onClose={drawer.onClose}>
        <DrawerOverlay /><DrawerContent><AdminNavBar variant="drawer" onClose={drawer.onClose} /></DrawerContent>
      </Drawer>
      
      <Box p={{ base: 4, sm: 6, md: 8 }} ml={{ base: 0, md: '80px' }} flex="1">
        <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
          <IconButton aria-label="Open menu" icon={<HamburgerIcon w={5} h={5} />} onClick={drawer.onOpen} size="sm" variant="ghost" />
          <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2" fontWeight="bold">Manage Products</Heading>
        </Flex>

        <Flex justify="space-between" align="center" mb={8} display={{ base: 'none', md: 'flex' }}>
          <Heading fontWeight="bold">Manage Products</Heading>
          <Button fontWeight="bold" leftIcon={<AddIcon />} colorScheme="teal" onClick={openAddModal}>Add New Product</Button>
        </Flex>

        <Box display={{ base: 'block', md: 'none' }} mb={4}>
          <Button fontWeight="bold" leftIcon={<AddIcon />} colorScheme="teal" onClick={openAddModal} w="full">Add New Product</Button>
        </Box>

        {isLoading ? (
          <Center h="300px"><Spinner /></Center>
        ) : (
          <>
            {/* CHANGED: Hide table on mobile, show on desktop */}
            <Box overflowX="auto" display={{ base: 'none', md: 'block' }}>
              <Table variant="simple" minW="1000px">
                <Thead>
                  <Tr>
                    <Th>Image</Th><Th>ID</Th><Th>Paper Type</Th><Th>GSM</Th>
                    <Th isNumeric>Price/Slot</Th><Th isNumeric>Selling Price 1</Th><Th isNumeric>Selling Price 2</Th><Th isNumeric>Selling Price 3</Th><Th isNumeric>Profit</Th><Th isNumeric>Stock</Th>
                    <Th>Status</Th><Th isNumeric>Margin %</Th><Th isNumeric>Selling Days</Th><Th>Last Updated</Th><Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {products.map(p => {
                    const pricePerSlot = parseFloat(p.price_per_slot);
                    const sellingPrice = parseFloat(p.selling_price);
                    const profit = !isNaN(sellingPrice) && !isNaN(pricePerSlot) ? sellingPrice - pricePerSlot : null;
                    const marginPercentage = profit !== null && pricePerSlot > 0 ? (profit * 100) / pricePerSlot : null;
                    const lastUpdatedDate = new Date(p.last_updated);
                    const displayLastUpdated = p.last_updated && !isNaN(lastUpdatedDate.getTime()) ? lastUpdatedDate.toLocaleString('en-IN') : 'N/A';
                    
                    return (
                      <Tr key={p.product_id}>
                        <Td><Image src={p.product_image_url} boxSize="50px" objectFit="cover" borderRadius="md" /></Td>
                        <Td>{p.product_id}</Td>
                        <Td>{p.paper_type}</Td>
                        <Td>{p.gsm}</Td>
                        <Td isNumeric>₹{pricePerSlot.toFixed(2)}</Td>
                        <Td isNumeric>₹{sellingPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Td>
                        <Td isNumeric>₹{!isNaN(parseFloat(p.selling_price_2)) ? parseFloat(p.selling_price_2).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 'N/A'}</Td>
                        <Td isNumeric>₹{!isNaN(parseFloat(p.selling_price_3)) ? parseFloat(p.selling_price_3).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 'N/A'}</Td>
                        <Td isNumeric color={profit > 0 ? 'green.500' : profit < 0 ? 'red.500' : 'inherit'}>
                           ₹{profit !== null ? profit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 'N/A'}
                        </Td>
                        <Td isNumeric>{p.available_stock}</Td>
                        <Td><Tag colorScheme={p.stock_status === 'available' ? 'green' : p.stock_status === 'low' ? 'orange' : 'red'}>{p.stock_status}</Tag></Td>
                        <Td isNumeric color={marginPercentage > 0 ? 'green.500' : marginPercentage < 0 ? 'red.500' : 'inherit'}>
                          {marginPercentage !== null ? `${marginPercentage.toFixed(2)}%` : 'N/A'}
                        </Td>
                        <Td isNumeric>
                          <Tag 
                            colorScheme="blue" 
                            size="sm" 
                            cursor="pointer"
                            _hover={{ bg: "blue.600", color: "white" }}
                            title="Click to edit selling days"
                          >
                            {p.selling_days || 7} days
                          </Tag>
                        </Td>
                        <Td>{displayLastUpdated}</Td>
                        <Td>
                          <IconButton icon={<EditIcon />} aria-label="Edit" mr={2} onClick={() => openEditModal(p)} />
                          <IconButton icon={<DeleteIcon />} aria-label="Delete" colorScheme="red" onClick={() => openDeleteAlert(p.product_id)} />
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>

            {/* NEW: Card layout for mobile, hidden on desktop */}
            <Stack spacing={4} display={{ base: 'block', md: 'none' }}>
              {products.map(p => {
                 const pricePerSlot = parseFloat(p.price_per_slot);
                 const sellingPrice = parseFloat(p.selling_price);
                 const profit = !isNaN(sellingPrice) && !isNaN(pricePerSlot) ? sellingPrice - pricePerSlot : null;
                 const marginPercentage = profit !== null && pricePerSlot > 0 ? (profit * 100) / pricePerSlot : null;

                 return (
                  <Box key={p.product_id} bg={cardBg} p={4} borderRadius="lg" boxShadow="md">
                    <Flex gap={4} align="start">
                      <Image src={p.product_image_url} boxSize="75px" objectFit="cover" borderRadius="md" />
                      <Stack spacing={1} flex="1">
                        <Heading as="h3" size="sm">{p.paper_type}</Heading>
                        <Text fontSize="xs" color="gray.500">ID: {p.product_id} | GSM: {p.gsm}</Text>
                        <Tag 
                          size="sm" 
                          mt={1} 
                          w="fit-content"
                          colorScheme={p.stock_status === 'available' ? 'green' : p.stock_status === 'low' ? 'orange' : 'red'}>
                            {p.stock_status} ({p.available_stock} in stock)
                        </Tag>
                      </Stack>
                    </Flex>
                    
                    <Divider my={3} />

                    <Stack spacing={2.5}>
                       <CardDataRow label="Price/Slot">₹{pricePerSlot.toFixed(2)}</CardDataRow>
                       <CardDataRow label="Selling Price 1">₹{sellingPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</CardDataRow>
                       <CardDataRow label="Selling Price 2">₹{!isNaN(parseFloat(p.selling_price_2)) ? parseFloat(p.selling_price_2).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 'N/A'}</CardDataRow>
                       <CardDataRow label="Selling Price 3">₹{!isNaN(parseFloat(p.selling_price_3)) ? parseFloat(p.selling_price_3).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 'N/A'}</CardDataRow>
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
                       <CardDataRow label="Selling Days">
                         <Tag 
                           colorScheme="blue" 
                           size="sm"
                           cursor="pointer"
                           _hover={{ bg: "blue.600", color: "white" }}
                           title="Click edit button to modify selling days"
                         >
                           {p.selling_days || 7} days
                         </Tag>
                       </CardDataRow>
                    </Stack>

                    <Divider my={3} />
                    
                    <Flex justify="space-between" align="center">
                        <Text fontSize="xs" color="gray.500">
                          Updated: {new Date(p.last_updated).toLocaleDateString('en-IN')}
                        </Text>
                        <Stack direction="row">
                          <IconButton size="sm" icon={<EditIcon />} aria-label="Edit" onClick={() => openEditModal(p)} />
                          <IconButton size="sm" icon={<DeleteIcon />} aria-label="Delete" colorScheme="red" onClick={() => openDeleteAlert(p.product_id)} />
                        </Stack>
                    </Flex>
                  </Box>
                 )
              })}
            </Stack>
          </>
        )}

        <ProductModal isOpen={isOpen} onClose={onClose} onSave={handleSave} product={currentProduct} isEditing={isEditing} />
        <AlertDialog isOpen={deleteAlert.isOpen} leastDestructiveRef={cancelRef} onClose={closeDeleteAlert}>
            {/* ... (Your existing AlertDialog code) */}
             <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontWeight="bold">Delete Product</AlertDialogHeader>
              <AlertDialogBody fontWeight="bold">Are you sure you want to delete this product? This action cannot be undone.</AlertDialogBody>
              <AlertDialogFooter>
                <Button fontWeight="bold" ref={cancelRef} onClick={closeDeleteAlert}>Cancel</Button>
                <Button fontWeight="bold" colorScheme="red" onClick={handleDelete} ml={3}>Delete</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </Flex>
  );
};

export default ManageProductsPage;