import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Flex,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import { ArrowBackIcon, ViewIcon, ViewOffIcon, HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import AdminNavBar, { NAV_WIDTH } from '../../components/layout/AdminNavBar';

const AddCoordinatorPage = ({ url }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen: isMobileNavOpen, onOpen: onMobileNavOpen, onClose: onMobileNavClose } = useDisclosure();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const headingColor = useColorModeValue('gray.800', 'gray.200');

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
    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
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

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${url}/api/coordinator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add coordinator');
      }

      toast({
        title: 'Success',
        description: 'Coordinator added successfully with login credentials!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone_number: '',
        password: ''
      });

      // Navigate to manage coordinators page
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
            Add Coordinator
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
                Add New Coordinator
              </Heading>
              <Text color="gray.500" mt={1}>
                Create a new coordinator with login credentials
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
                <FormControl isRequired>
                  <FormLabel fontWeight="bold">Login Password</FormLabel>
                  <InputGroup size="lg">
                    <Input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Set coordinator's login password"
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
                    Minimum 6 characters. This will be the coordinator's login password.
                  </Text>
                </FormControl>

                {/* Submit Button */}
                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  isLoading={isLoading}
                  loadingText="Adding Coordinator..."
                >
                  Add Coordinator
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>

        {/* Info Card */}
        <Card bg={useColorModeValue('blue.50', 'blue.900')} border="1px solid" borderColor={useColorModeValue('blue.200', 'blue.700')}>
          <CardBody p={6}>
            <VStack spacing={3} align="start">
              <Text fontWeight="bold" color={useColorModeValue('blue.800', 'blue.200')}>
                📋 What happens when you add a coordinator?
              </Text>
              <VStack spacing={2} align="start" fontSize="sm" color={useColorModeValue('blue.700', 'blue.300')}>
                <Text>• A new coordinator account will be created</Text>
                <Text>• Login credentials will be automatically generated</Text>
                <Text>• The coordinator can immediately log in with the provided email and password</Text>
                <Text>• You can manage the coordinator from the "Manage Coordinators" page</Text>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
        </VStack>
      </Box>
    </Flex>
  );
};

export default AddCoordinatorPage;
