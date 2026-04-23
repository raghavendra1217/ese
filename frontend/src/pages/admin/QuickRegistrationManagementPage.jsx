import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Flex, Heading, Button, IconButton, useToast, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useColorModeValue, Text, Badge, HStack,
  Textarea, Drawer, DrawerContent, DrawerOverlay, VStack, useClipboard
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon, HamburgerIcon, ViewIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import AdminNavBar from '../../components/layout/AdminNavBar';

const ADMIN_SIDEBAR_W = '80px';

const QuickRegistrationModal = ({ isOpen, onClose, onSave, quickReg, isEditing }) => {
  const initialFormState = {
    name: '',
    phone: '',
    address: '',
    comments: '',
    follow_up_date: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && quickReg) {
        setFormData({
          name: quickReg.name || '',
          phone: quickReg.phone || '',
          address: quickReg.address || '',
          comments: quickReg.comments || '',
          follow_up_date: quickReg.follow_up_date || ''
        });
      } else {
        setFormData(initialFormState);
      }
    }
  }, [isOpen, quickReg, isEditing]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving quick registration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isEditing ? 'Edit Quick Registration' : 'Add Quick Registration'}
        </ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Phone Number</FormLabel>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter 10-digit phone number"
                  type="tel"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Address</FormLabel>
                <Textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter complete address"
                  rows={3}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Follow-up Date (Optional)</FormLabel>
                <Input
                  name="follow_up_date"
                  value={formData.follow_up_date}
                  onChange={handleChange}
                  type="date"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Comments (Optional)</FormLabel>
                <Textarea
                  name="comments"
                  value={formData.comments}
                  onChange={handleChange}
                  placeholder="Any additional comments or notes"
                  rows={2}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" type="submit" isLoading={isLoading}>
              {isEditing ? 'Update' : 'Add'} Quick Registration
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

const QuickRegistrationManagementPage = ({ url }) => {
  const { token } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isMobileNavOpen, onOpen: onMobileNavOpen, onClose: onMobileNavClose } = useDisclosure();
  const cancelRef = useRef();

  const [quickRegistrations, setQuickRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuickReg, setSelectedQuickReg] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Share functionality
  const shareUrl = `${window.location.origin}/quick-register-public`;
  const { onCopy, hasCopied } = useClipboard(shareUrl);

  // Color mode values
  const mainBg = useColorModeValue('gray.50', 'gray.900');
  const sidebarBg = useColorModeValue('white', 'gray.800');
  const sidebarBorder = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const iconColor = useColorModeValue('gray.600', 'gray.400');
  const tableBg = useColorModeValue('white', 'gray.800');

  const fetchQuickRegistrations = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${url}/api/quick-reg/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Quick registrations data received:', data);
        setQuickRegistrations(data.data || []);
      } else {
        throw new Error('Failed to fetch quick registrations');
      }
    } catch (error) {
      console.error('Error fetching quick registrations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch quick registrations',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [url, token, toast]);

  useEffect(() => {
    fetchQuickRegistrations();
  }, [fetchQuickRegistrations]);

  // Debug log to see the state
  useEffect(() => {
    console.log('Quick registrations state:', quickRegistrations);
  }, [quickRegistrations]);

  const handleAdd = () => {
    setSelectedQuickReg(null);
    setIsEditing(false);
    onOpen();
  };

  const handleEdit = (quickReg) => {
    setSelectedQuickReg(quickReg);
    setIsEditing(true);
    onOpen();
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    onDeleteOpen();
  };

  const handleSave = async (formData) => {
    try {
      const endpoint = isEditing 
        ? `${url}/api/quick-reg/admin/${selectedQuickReg.id}`
        : `${url}/api/quick-reg/create`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (isEditing) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: isEditing ? 'Quick registration updated successfully' : 'Quick registration added successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        fetchQuickRegistrations();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save quick registration');
      }
    } catch (error) {
      console.error('Error saving quick registration:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save quick registration',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`${url}/api/quick-reg/admin/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Quick registration deleted successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        fetchQuickRegistrations();
      } else {
        throw new Error('Failed to delete quick registration');
      }
    } catch (error) {
      console.error('Error deleting quick registration:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete quick registration',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
      setDeleteId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <Flex minH="100vh" bg={mainBg}>
      {/* Sidebar (desktop only) */}
      <Box 
        as="nav" 
        pos="fixed" 
        top="0" 
        left="0" 
        zIndex="sticky" 
        h="full" 
        w={ADMIN_SIDEBAR_W} 
        bg={sidebarBg} 
        borderRight="1px" 
        borderColor={sidebarBorder} 
        display={{ base: 'none', md: 'block' }}
      >
        <AdminNavBar />
      </Box>

      {/* Mobile drawer */}
      <Drawer isOpen={isMobileNavOpen} placement="left" onClose={onMobileNavClose}>
        <DrawerOverlay />
        <DrawerContent>
          <AdminNavBar variant="drawer" onClose={onMobileNavClose} />
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <Box flex="1" ml={{ base: 0, md: ADMIN_SIDEBAR_W }} p={{ base: 4, sm: 6, md: 8 }}>
        {/* Mobile header */}
        <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon w={5} h={5} />}
            onClick={onMobileNavOpen}
            size="sm"
            variant="ghost"
            color={iconColor}
          />
          <Heading as="h1" fontSize="lg" color={headingColor}>
            Quick Registration Management
          </Heading>
        </Flex>

        {/* Desktop title */}
        <Heading as="h1" fontSize="2xl" color={headingColor} mb={6} display={{ base: 'none', md: 'block' }}>
          Quick Registration Management
        </Heading>

        {/* Action buttons */}
        <Flex justify="space-between" align="center" mb={6}>
          <HStack spacing={4}>
            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleAdd}>
              Add Quick Registration
            </Button>
            <Button 
              leftIcon={<ExternalLinkIcon />} 
              colorScheme="green" 
              onClick={onCopy}
              variant={hasCopied ? "solid" : "outline"}
            >
              {hasCopied ? "Link Copied!" : "Share Quick Reg"}
            </Button>
          </HStack>
        </Flex>

        {/* Quick Registrations Table */}
        {isLoading ? (
          <Center py={8}>
            <Spinner size="xl" />
          </Center>
        ) : (
          <Box bg={tableBg} borderRadius="lg" overflow="hidden" boxShadow="sm">
            <Box overflowX="auto">
              <Table variant="simple" minW="800px">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>ID</Th>
                    <Th>Name</Th>
                    <Th>Phone</Th>
                    <Th>Address</Th>
                    <Th>Comments</Th>
                    <Th>Follow-up Date</Th>
                    <Th>Created</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {quickRegistrations.map((quickReg) => (
                    <Tr key={quickReg.id}>
                      <Td fontFamily="monospace" fontSize="sm">
                        {quickReg.id}
                      </Td>
                      <Td fontWeight="medium">
                        {quickReg.name}
                      </Td>
                      <Td>{quickReg.phone}</Td>
                      <Td maxW="200px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                        {quickReg.address}
                      </Td>
                      <Td maxW="150px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                        {quickReg.comments || 'N/A'}
                      </Td>
                      <Td>
                        {quickReg.follow_up_date ? formatDate(quickReg.follow_up_date) : 'N/A'}
                      </Td>
                      <Td>{formatDate(quickReg.created_on)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Edit"
                            icon={<EditIcon />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(quickReg)}
                          />
                          <IconButton
                            aria-label="Delete"
                            icon={<DeleteIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDelete(quickReg.id)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Box>
        )}

        {/* Add/Edit Modal */}
        <QuickRegistrationModal
          isOpen={isOpen}
          onClose={onClose}
          onSave={handleSave}
          quickReg={selectedQuickReg}
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
                Delete Quick Registration
              </AlertDialogHeader>
              <AlertDialogBody>
                Are you sure you want to delete this quick registration? This action cannot be undone.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={confirmDelete} ml={3}>
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

export default QuickRegistrationManagementPage;
