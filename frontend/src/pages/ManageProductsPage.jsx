import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Flex, Heading, Button, IconButton, useToast, Spinner, Center,
    Table, Thead, Tbody, Tr, Th, Td, Image, Tag, useDisclosure,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    FormControl, FormLabel, Input, Select, NumberInput, NumberInputField, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { useAuth } from '../AppContext';

const ProductModal = ({ isOpen, onClose, onSave, product, isEditing }) => {
    // Defines the starting values for a NEW product.
    const initialFormState = {
        paper_type: '',
        size: '',
        gsm: '',
        price_per_slot: '',
        stock_status: 'available',
        available_stock: ''
    };

    const [formData, setFormData] = useState(initialFormState);
    const [imageFile, setImageFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (isEditing && product) {
                setFormData(product); // If editing, use the product's data.
            } else {
                setFormData(initialFormState); // If adding, reset to the clean default state.
            }
            setImageFile(null);
        }
    }, [isOpen, product, isEditing]);

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

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleSubmit}>
                <ModalHeader>{isEditing ? 'Edit Product' : 'Add New Product'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    {!isEditing && (
                        <>
                            <FormControl isRequired><FormLabel>Paper Type</FormLabel><Input name="paper_type" value={formData.paper_type || ''} onChange={handleChange} /></FormControl>
                            <FormControl mt={4} isRequired><FormLabel>Product Image</FormLabel><Input type="file" name="productImage" onChange={handleFileChange} p={1.5} /></FormControl>
                            <FormControl mt={4} isRequired><FormLabel>Size</FormLabel><Input name="size" value={formData.size || ''} onChange={handleChange} /></FormControl>
                            <FormControl mt={4} isRequired><FormLabel>GSM</FormLabel>
                                <NumberInput value={formData.gsm || ''} onChange={(value) => handleNumberChange(value, 'gsm')}>
                                    <NumberInputField name="gsm" />
                                </NumberInput>
                            </FormControl>
                        </>
                    )}
                    <FormControl mt={4} isRequired><FormLabel>Price Per Slot</FormLabel>
                        <NumberInput precision={2} value={formData.price_per_slot || ''} onChange={(value) => handleNumberChange(value, 'price_per_slot')}>
                            <NumberInputField name="price_per_slot" />
                        </NumberInput>
                    </FormControl>
                    <FormControl mt={4} isRequired><FormLabel>Stock Status</FormLabel>
                        <Select name="stock_status" value={formData.stock_status || 'available'} onChange={handleChange}>
                            <option value="available">Available</option>
                            <option value="low">Low</option>
                            <option value="out_of_stock">Out of Stock</option>
                        </Select>
                    </FormControl>
                    <FormControl mt={4} isRequired><FormLabel>Available Stock</FormLabel>
                        <NumberInput value={formData.available_stock || ''} onChange={(value) => handleNumberChange(value, 'available_stock')}>
                            <NumberInputField name="available_stock" />
                        </NumberInput>
                    </FormControl>
                </ModalBody>
                <ModalFooter>
                    <Button colorScheme="blue" mr={3} type="submit" isLoading={isLoading}>Save</Button>
                    <Button onClick={onClose}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};


const ManageProductsPage = ({ url }) => {
    const { token } = useAuth();
    const toast = useToast();
    const [products, setProducts] = useState([]);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [deleteAlert, setDeleteAlert] = useState({ isOpen: false, productId: null });
    const cancelRef = React.useRef();

    const fetchProducts = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${url}/api/products`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch products');
            setProducts(data);
        } catch (error) {
            toast({ title: 'Error fetching products', description: error.message, status: 'error', isClosable: true });
        } finally {
            setIsLoading(false);
        }
    }, [token, toast, url]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleSave = async (formData, imageFile) => {
        // --- THIS IS THE FINAL FIX ---
        // Prepare the data to match what the database expects (numbers or null, not empty strings)
        const preparedData = {
            ...formData,
            // If the value is an empty string, send null. Otherwise, convert to a number.
            gsm: formData.gsm === '' || formData.gsm === null ? null : Number(formData.gsm),
            price_per_slot: formData.price_per_slot === '' || formData.price_per_slot === null ? null : Number(formData.price_per_slot),
            available_stock: formData.available_stock === '' || formData.available_stock === null ? null : Number(formData.available_stock),
        };

        const apiUrl = isEditing ? `${url}/api/products/${currentProduct.product_id}` : `${url}/api/products`;
        const method = isEditing ? 'PUT' : 'POST';
        let body;
        let headers = { 'Authorization': `Bearer ${token}` };

        try {
            if (isEditing) {
                // For editing, send the prepared data as JSON
                body = JSON.stringify(preparedData);
                headers['Content-Type'] = 'application/json';
            } else {
                // For creating, send as FormData
                body = new FormData();
                for (const key in preparedData) {
                    // Important: Don't append null values to FormData
                    if (preparedData[key] !== null && preparedData[key] !== undefined) {
                        body.append(key, preparedData[key]);
                    }
                }
                if (imageFile) {
                    body.append('productImage', imageFile);
                }
            }

            const response = await fetch(apiUrl, { method, headers, body });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to save product');
            toast({ title: `Product ${isEditing ? 'updated' : 'added'}`, status: 'success', isClosable: true });
            onClose();
            fetchProducts();
        } catch (error) {
            toast({ title: 'Error saving product', description: error.message, status: 'error', isClosable: true });
        }
    };
    
    const openAddModal = () => {
        setCurrentProduct(null);
        setIsEditing(false);
        onOpen();
    };

    const openEditModal = (product) => {
        setCurrentProduct(product);
        setIsEditing(true);
        onOpen();
    };
    
    const openDeleteAlert = (productId) => {
        setDeleteAlert({ isOpen: true, productId });
    };

    const closeDeleteAlert = () => {
        setDeleteAlert({ isOpen: false, productId: null });
    };

    const handleDelete = async () => {
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

    return (
        <Box flex="1" p={{ base: 4, md: 8 }}>
            <Flex justify="space-between" align="center" mb={8}>
                <Heading>Manage Products</Heading>
                <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={openAddModal}>Add New Product</Button>
            </Flex>
            {isLoading ? (
                <Center h="300px"><Spinner /></Center>
            ) : (
                <Box overflowX="auto">
                    <Table variant="simple">
                        <Thead><Tr><Th>Image</Th><Th>ID</Th><Th>Paper Type</Th><Th>GSM</Th><Th>Price/Slot</Th><Th>Stock</Th><Th>Status</Th><Th>Actions</Th></Tr></Thead>
                        <Tbody>
                            {products.map(p => (
                                <Tr key={p.product_id}>
                                    <Td><Image src={`${url}${p.product_image_url}`} boxSize="50px" objectFit="cover" fallbackSrc="https://via.placehold" /></Td>
                                    <Td>{p.product_id}</Td>
                                    <Td>{p.paper_type}</Td>
                                    <Td>{p.gsm}</Td>
                                    <Td>₹{p.price_per_slot}</Td>
                                    <Td>{p.available_stock}</Td>
                                    <Td><Tag colorScheme={p.stock_status === 'available' ? 'green' : p.stock_status === 'low' ? 'orange' : 'red'}>{p.stock_status}</Tag></Td>
                                    <Td>
                                        <IconButton icon={<EditIcon />} aria-label="Edit" mr={2} onClick={() => openEditModal(p)} />
                                        <IconButton icon={<DeleteIcon />} aria-label="Delete" colorScheme="red" onClick={() => openDeleteAlert(p.product_id)} />
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            )}
            <ProductModal isOpen={isOpen} onClose={onClose} onSave={handleSave} product={currentProduct} isEditing={isEditing} />
            <AlertDialog isOpen={deleteAlert.isOpen} leastDestructiveRef={cancelRef} onClose={closeDeleteAlert}>
                <AlertDialogOverlay><AlertDialogContent><AlertDialogHeader>Delete Product</AlertDialogHeader><AlertDialogBody>Are you sure you want to delete this product? This action cannot be undone.</AlertDialogBody><AlertDialogFooter><Button ref={cancelRef} onClick={closeDeleteAlert}>Cancel</Button><Button colorScheme="red" onClick={handleDelete} ml={3}>Delete</Button></AlertDialogFooter></AlertDialogContent></AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
};

export default ManageProductsPage;