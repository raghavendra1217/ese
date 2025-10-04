import React, { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input, VStack, Heading,
  useColorModeValue, Center, Divider, Textarea, FormHelperText,
  useToast, Container, Text, Alert, AlertIcon, Flex, Image
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const QuickRegistrationPage = ({ url }) => {
  const toast = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    comments: '',
    follow_up_date: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const navBg = useColorModeValue('white', 'gray.800');
  const navBorder = useColorModeValue('gray.200', 'gray.700');

  const validatePhoneNumber = (phone) => /^\d{10}$/.test(phone);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });

    // Clear error when user starts typing
    if (formErrors[id]) {
      setFormErrors({ ...formErrors, [id]: '' });
    }

    // Validate phone number
    if (id === 'phone' && value && !validatePhoneNumber(value)) {
      setFormErrors({ ...formErrors, phone: 'Phone number must be exactly 10 digits.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    else if (!validatePhoneNumber(formData.phone)) errors.phone = 'Phone number must be exactly 10 digits';
    if (!formData.address.trim()) errors.address = 'Address is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${url}/api/quick-reg/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(data.message || 'An account with this email already exists. Please use a different email address or contact support if you believe this is an error.');
        }
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      toast({
        title: 'Registration Successful!',
        description: 'Your quick registration has been submitted successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setFormData({
        name: '',
        phone: '',
        address: '',
        comments: '',
        follow_up_date: ''
      });

    } catch (err) {
      toast({
        title: 'Registration Failed',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.name.trim() && formData.phone.trim() && formData.address.trim() && !Object.values(formErrors).some(err => err !== '');

  return (
    <Box minH="100vh" bg={pageBg}>
      {/* Navigation Bar */}
      <Box
        bg={navBg}
        borderBottom="1px"
        borderColor={navBorder}
        px={4}
        py={3}
        position="sticky"
        top={0}
        zIndex={10}
        boxShadow="sm"
      >
        <Flex justify="space-between" align="center" maxW="7xl" mx="auto">
          <Flex align="center" gap={3}>
            <Image src="/eselogo.png" alt="ESE Paper Trading" h="40px" objectFit="contain" />
            <Heading size="md" color={textColor}>
              ESE Paper Trading
            </Heading>
          </Flex>
          <Flex gap={2}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button
              colorScheme="blue"
              size="sm"
              onClick={() => navigate('/register')}
            >
              Full Registration
            </Button>
          </Flex>
        </Flex>
      </Box>

      <Container maxW="md" py={8}>
        <Box
          borderRadius="xl"
          bg={cardBg}
          boxShadow="2xl"
          borderWidth={1}
          borderColor={cardBorder}
          p={8}
        >
          <VStack spacing={6} as="form" onSubmit={handleSubmit}>
            <Heading size="lg" color={textColor} textAlign="center">
              Quick Registration
            </Heading>
            
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">
                Fill in your basic details for quick registration. We'll contact you soon!
              </Text>
            </Alert>

            <Divider borderColor="teal.400" />

            <FormControl isRequired isInvalid={!!formErrors.name}>
              <FormLabel>Full Name</FormLabel>
              <Input
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
              />
              <FormHelperText>{formErrors.name}</FormHelperText>
            </FormControl>

            <FormControl isRequired isInvalid={!!formErrors.phone}>
              <FormLabel>Phone Number</FormLabel>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter 10-digit phone number"
                maxLength="10"
              />
              <FormHelperText>{formErrors.phone || '10 digits required'}</FormHelperText>
            </FormControl>

            <FormControl isRequired isInvalid={!!formErrors.address}>
              <FormLabel>Address</FormLabel>
              <Textarea
                id="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter your complete address"
                rows={3}
              />
              <FormHelperText>{formErrors.address}</FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel>Comments (Optional)</FormLabel>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={handleInputChange}
                placeholder="Any additional comments or requirements"
                rows={3}
              />
              <FormHelperText>Optional: Any specific requirements or comments</FormHelperText>
            </FormControl>

            <Button
              type="submit"
              colorScheme="teal"
              size="lg"
              width="full"
              isLoading={isLoading}
              loadingText="Submitting..."
              isDisabled={!isFormValid}
            >
              Submit Quick Registration
            </Button>

            <Button
              variant="outline"
              size="md"
              width="full"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default QuickRegistrationPage;
