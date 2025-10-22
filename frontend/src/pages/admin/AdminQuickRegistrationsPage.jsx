import React, { useState, useEffect } from 'react';
import {
  Box, Button, Table, Thead, Tbody, Tr, Th, Td, VStack, Heading,
  useColorModeValue, Center, Divider, Text, useToast, Container,
  Input, InputGroup, InputLeftElement, HStack, Badge, IconButton,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalCloseButton, useDisclosure, AlertDialog, AlertDialogBody,
  AlertDialogFooter, AlertDialogHeader, AlertDialogContent,
  AlertDialogOverlay, Spinner, Flex, Select, Textarea
} from '@chakra-ui/react';
import { SearchIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

const AdminQuickRegistrationsPage = ({ url }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = React.useRef();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [registrationToDelete, setRegistrationToDelete] = useState(null);
  const [stats, setStats] = useState({});

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const theadBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    fetchRegistrations();
    fetchStats();
  }, [currentPage, searchTerm]);

  const fetchRegistrations = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/quick-reg/admin/all?page=${currentPage}&limit=10&search=${searchTerm}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch registrations');
      }

      const data = await response.json();
      setRegistrations(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch quick registrations',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${url}/api/quick-reg/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleDelete = async () => {
    if (!registrationToDelete) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/quick-reg/admin/${registrationToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete registration');
      }

      toast({
        title: 'Success',
        description: 'Quick registration deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchRegistrations();
      fetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete registration',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
      setRegistrationToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleViewDetails = (registration) => {
    setSelectedRegistration(registration);
    onOpen();
  };

  const handleDeleteClick = (registration) => {
    setRegistrationToDelete(registration);
    onDeleteOpen();
  };

  if (loading) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" color="teal.500" />
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg} p={6}>
      <Container maxW="7xl">
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Heading size="lg" color={textColor}>
              Quick Registrations Management
            </Heading>
            <Button
              colorScheme="blue"
              onClick={() => navigate('/admin')}
            >
              Back to Dashboard
            </Button>
          </Flex>

          {/* Stats Cards */}
          <HStack spacing={4} wrap="wrap">
            <Box bg={cardBg} p={4} borderRadius="md" borderWidth={1} borderColor={cardBorder} minW="200px">
              <Text fontSize="sm" color="gray.500">Total Registrations</Text>
              <Text fontSize="2xl" fontWeight="bold" color="teal.500">
                {stats.total_registrations || 0}
              </Text>
            </Box>
            <Box bg={cardBg} p={4} borderRadius="md" borderWidth={1} borderColor={cardBorder} minW="200px">
              <Text fontSize="sm" color="gray.500">Today</Text>
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {stats.today_registrations || 0}
              </Text>
            </Box>
            <Box bg={cardBg} p={4} borderRadius="md" borderWidth={1} borderColor={cardBorder} minW="200px">
              <Text fontSize="sm" color="gray.500">This Week</Text>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {stats.week_registrations || 0}
              </Text>
            </Box>
            <Box bg={cardBg} p={4} borderRadius="md" borderWidth={1} borderColor={cardBorder} minW="200px">
              <Text fontSize="sm" color="gray.500">This Month</Text>
              <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                {stats.month_registrations || 0}
              </Text>
            </Box>
          </HStack>

          {/* Search */}
          <Box bg={cardBg} p={4} borderRadius="md" borderWidth={1} borderColor={cardBorder}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search by name, phone, or address..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </InputGroup>
          </Box>

          {/* Table */}
          <Box bg={cardBg} borderRadius="md" borderWidth={1} borderColor={cardBorder} overflow="hidden">
            <Box overflowX="auto">
              <Table variant="simple" minW="800px">
                <Thead bg={theadBg}>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Name</Th>
                    <Th>Phone</Th>
                    <Th>Address</Th>
                    <Th>Created On</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {registrations.map((registration) => (
                    <Tr key={registration.id}>
                      <Td>{registration.id}</Td>
                      <Td fontWeight="medium">{registration.name}</Td>
                      <Td>{registration.phone}</Td>
                      <Td maxW="200px" isTruncated>{registration.address}</Td>
                      <Td>{formatDate(registration.created_on)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            icon={<ViewIcon />}
                            size="sm"
                            colorScheme="blue"
                            variant="outline"
                            onClick={() => handleViewDetails(registration)}
                          />
                          <IconButton
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => handleDeleteClick(registration)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <HStack justify="center" spacing={2}>
              <Button
                size="sm"
                isDisabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Text>
                Page {currentPage} of {totalPages}
              </Text>
              <Button
                size="sm"
                isDisabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </HStack>
          )}
        </VStack>

        {/* View Details Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Quick Registration Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedRegistration && (
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontWeight="bold">ID:</Text>
                    <Text>{selectedRegistration.id}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Name:</Text>
                    <Text>{selectedRegistration.name}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Phone:</Text>
                    <Text>{selectedRegistration.phone}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Address:</Text>
                    <Text>{selectedRegistration.address}</Text>
                  </Box>
                  {selectedRegistration.comments && (
                    <Box>
                      <Text fontWeight="bold">Comments:</Text>
                      <Text>{selectedRegistration.comments}</Text>
                    </Box>
                  )}
                  <Box>
                    <Text fontWeight="bold">Created On:</Text>
                    <Text>{formatDate(selectedRegistration.created_on)}</Text>
                  </Box>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

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
                Are you sure you want to delete the registration for {registrationToDelete?.name}? 
                This action cannot be undone.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={handleDelete} ml={3}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Container>
    </Box>
  );
};

export default AdminQuickRegistrationsPage;
