import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatISTDate } from '../../utils/dateUtils';
import {
  Box,
  Button,
  VStack,
  HStack,
  Heading,
  Text,
  useColorModeValue,
  useToast,
  Container,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Input,
  InputGroup,
  InputLeftElement,
  Card,
  CardBody,
  Spinner,
  Center,
  Flex,
  Spacer,
  Drawer,
  DrawerContent,
  DrawerOverlay,
} from '@chakra-ui/react';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  SearchIcon,
  HamburgerIcon,
} from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import AdminNavBar, { NAV_WIDTH } from '../../components/layout/AdminNavBar';

const ManageCoordinatorsPage = ({ url }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen: isMobileNavOpen, onOpen: onMobileNavOpen, onClose: onMobileNavClose } = useDisclosure();

  const [coordinators, setCoordinators] = useState([]);
  const [filteredCoordinators, setFilteredCoordinators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoordinator, setSelectedCoordinator] = useState(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const grayText = useColorModeValue('gray.700', 'gray.300');
  const theadBg = useColorModeValue('gray.50', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'gray.200');

  // Fetch coordinators
  const fetchCoordinators = async () => {
    try {
      const response = await fetch(`${url}/api/coordinator`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch coordinators');
      }

      setCoordinators(data.coordinators || []);
      setFilteredCoordinators(data.coordinators || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoordinators();
  }, []);

  // Filter coordinators based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCoordinators(coordinators);
    } else {
      const filtered = coordinators.filter(coordinator =>
        coordinator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coordinator.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coordinator.phone_number.includes(searchTerm)
      );
      setFilteredCoordinators(filtered);
    }
  }, [searchTerm, coordinators]);

  const handleDelete = async () => {
    if (!selectedCoordinator) return;

    try {
      const response = await fetch(`${url}/api/coordinator/${selectedCoordinator.coordinator_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete coordinator');
      }

      toast({
        title: 'Success',
        description: 'Coordinator deleted successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Refresh the list
      fetchCoordinators();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    // Use proper IST formatting that handles both UTC timestamps and pre-formatted IST strings
    return formatISTDate(dateString, true, true) || 'N/A';
  };

  if (isLoading) {
    return (
      <Flex minH="100vh" bg={pageBg}>
        {/* Desktop sidebar */}
        <AdminNavBar variant="static" onOpen={onMobileNavOpen} />

        {/* Mobile drawer */}
        <Drawer isOpen={isMobileNavOpen} placement="left" onClose={onMobileNavClose}>
          <DrawerOverlay />
          <DrawerContent>
            <AdminNavBar variant="drawer" onClose={onMobileNavClose} />
          </DrawerContent>
        </Drawer>

        {/* Main content */}
        
        <Box flex="1" ml={{ base: 0, md: NAV_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
          <Center h="400px">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text>Loading coordinators...</Text>
            </VStack>
          </Center>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg={pageBg}>
      {/* Desktop sidebar */}
      <AdminNavBar variant="static" onOpen={onMobileNavOpen} />

      {/* Mobile drawer */}
      <Drawer isOpen={isMobileNavOpen} placement="left" onClose={onMobileNavClose}>
        <DrawerOverlay />
        <DrawerContent>
          <AdminNavBar variant="drawer" onClose={onMobileNavClose} />
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <Box flex="1" ml={{ base: 0, md: NAV_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
        {/* Mobile header */}
        <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon w={5} h={5} />}
            onClick={onMobileNavOpen}
            size="sm"
            variant="ghost"
          />
          <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">
            Manage Coordinators
          </Heading>
        </Flex>

        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Flex align="center" justify="space-between">
            <Box>
              <Heading size="lg" color={textColor}>
                Manage Coordinators
              </Heading>
              <Text color="gray.500" mt={1}>
                View and manage all coordinators in the system
              </Text>
            </Box>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={() => navigate('/admin/add-coordinator')}
            >
              Add Coordinator
            </Button>
          </Flex>

        {/* Search and Stats */}
        <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
          <CardBody p={6}>
            <VStack spacing={4}>
              <HStack w="full" justify="space-between">
                <Text fontWeight="bold" color={grayText}>
                  Total Coordinators: {coordinators.length}
                </Text>
              </HStack>
              
              <InputGroup maxW="400px">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search coordinators by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </VStack>
          </CardBody>
        </Card>

        {/* Coordinators Table */}
        <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
          <CardBody p={0}>
            <TableContainer>
              <Table variant="simple">
                <Thead bg={theadBg}>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Phone</Th>
                    <Th>Created</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredCoordinators.length === 0 ? (
                    <Tr>
                      <Td colSpan={5} textAlign="center" py={8}>
                        <VStack spacing={2}>
                          <Text color="gray.500">No coordinators found</Text>
                          {searchTerm && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSearchTerm('')}
                            >
                              Clear search
                            </Button>
                          )}
                        </VStack>
                      </Td>
                    </Tr>
                  ) : (
                    filteredCoordinators.map((coordinator) => (
                      <Tr key={coordinator.coordinator_id}>
                        <Td fontWeight="medium">{coordinator.name}</Td>
                        <Td>{coordinator.email}</Td>
                        <Td>{coordinator.phone_number}</Td>
                        <Td fontSize="sm" color="gray.600">
                          {formatDate(coordinator.created_at)}
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<EditIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => navigate(`/admin/edit-coordinator/${coordinator.coordinator_id}`)}
                              aria-label="Edit coordinator"
                            />
                            <IconButton
                              icon={<DeleteIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => {
                                setSelectedCoordinator(coordinator);
                                onOpen();
                              }}
                              aria-label="Delete coordinator"
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Coordinator
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to delete <strong>{selectedCoordinator?.name}</strong>?
                This will permanently remove the coordinator and their login credentials.
                This action cannot be undone.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={handleDelete} ml={3}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
        </VStack>
      </Box>
    </Flex>
  );
};

export default ManageCoordinatorsPage;
