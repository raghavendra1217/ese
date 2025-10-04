import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useColorModeValue,
  Text,
  Alert,
  AlertIcon,
  useToast,
  Container,
  Card,
  CardBody,
  HStack,
  IconButton,
  InputGroup,
  InputRightElement,
  Spinner,
  Center,
  Flex,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import { ArrowBackIcon, ViewIcon, ViewOffIcon, HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import AdminNavBar, { NAV_WIDTH } from '../../components/layout/AdminNavBar';

const EditCoordinatorPage = ({ url }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { coordinatorId } = useParams();
  const toast = useToast();
  const { isOpen: isMobileNavOpen, onOpen: onMobileNavOpen, onClose: onMobileNavClose } = useDisclosure();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const blueBg = useColorModeValue('blue.50', 'blue.900');
  const blueBorder = useColorModeValue('blue.200', 'blue.700');
  const blueText = useColorModeValue('blue.800', 'blue.200');
  const blueSubText = useColorModeValue('blue.700', 'blue.300');
  const headingColor = useColorModeValue('gray.800', 'gray.200');

  // Fetch coordinator data
  useEffect(() => {
    const fetchCoordinator = async () => {
      try {
        const response = await fetch(`${url}/api/coordinators/${coordinatorId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch coordinator');
        }

        setFormData({
          name: data.coordinator.name || '',
          email: data.coordinator.email || '',
          phone_number: data.coordinator.phone_number || '',
          password: '' // Don't pre-fill password
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        navigate('/admin/manage-coordinators');
      } finally {
        setIsLoadingData(false);
      }
    };

    if (coordinatorId) {
      fetchCoordinator();
    }
  }, [coordinatorId, token, url, navigate, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.phone_number.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Phone validation (basic)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(formData.phone_number.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number');
      return false;
    }

    // Password validation (only if provided)
    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      // Prepare data - only include password if it's provided
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone_number: formData.phone_number
      };

      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      const response = await fetch(`${url}/api/coordinators/${coordinatorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update coordinator');
      }

      toast({
        title: 'Success',
        description: 'Coordinator updated successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Navigate back to manage coordinators page
      navigate('/admin/manage-coordinators');

    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
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
              <Text>Loading coordinator data...</Text>
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
            Edit Coordinator
          </Heading>
        </Flex>

        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack spacing={4}>
            <IconButton
              icon={<ArrowBackIcon />}
              onClick={() => navigate('/admin/manage-coordinators')}
              variant="ghost"
              aria-label="Go back"
            />
            <Box>
              <Heading size="lg" color={textColor}>
                Edit Coordinator
              </Heading>
              <Text color="gray.500" mt={1}>
                Update coordinator details and login credentials
              </Text>
            </Box>
          </HStack>

        {/* Form Card */}
        <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
          <CardBody p={8}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                {error && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}

                {/* Name Field */}
                <FormControl isRequired>
                  <FormLabel fontWeight="bold">Full Name</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter coordinator's full name"
                    size="lg"
                  />
                </FormControl>

                {/* Email Field */}
                <FormControl isRequired>
                  <FormLabel fontWeight="bold">Email Address</FormLabel>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter coordinator's email address"
                    size="lg"
                  />
                </FormControl>

                {/* Phone Number Field */}
                <FormControl isRequired>
                  <FormLabel fontWeight="bold">Phone Number</FormLabel>
                  <Input
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="Enter coordinator's phone number"
                    size="lg"
                  />
                </FormControl>

                {/* Password Field */}
                <FormControl>
                  <FormLabel fontWeight="bold">New Password (Optional)</FormLabel>
                  <InputGroup size="lg">
                    <Input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter new password (leave blank to keep current)"
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Leave blank to keep the current password. Minimum 6 characters if changing.
                  </Text>
                </FormControl>

                {/* Submit Button */}
                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  isLoading={isLoading}
                  loadingText="Updating Coordinator..."
                >
                  Update Coordinator
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>

        {/* Info Card */}
        <Card bg={blueBg} border="1px solid" borderColor={blueBorder}>
          <CardBody p={6}>
            <VStack spacing={3} align="start">
              <Text fontWeight="bold" color={blueText}>
                📝 Editing Coordinator Information
              </Text>
              <VStack spacing={2} align="start" fontSize="sm" color={blueSubText}>
                <Text>• Update the coordinator's personal information</Text>
                <Text>• Change login credentials if needed</Text>
                <Text>• Leave password blank to keep the current password</Text>
                <Text>• Changes will take effect immediately</Text>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
        </VStack>
      </Box>
    </Flex>
  );
};

export default EditCoordinatorPage;
