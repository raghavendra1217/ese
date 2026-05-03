import React, { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input, VStack, Heading,
  useColorModeValue, Center, Textarea, useToast, Image, Container, Text
} from '@chakra-ui/react';

const QuickRegistrationFormPage = ({ url }) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const initialFormData = {
    name: '',
    phone: '',
    address: '',
    comments: '',
    follow_up_date: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const pageBg = useColorModeValue('gray.50', 'gray.900');

  document.title = "NAVIU | Quick Registration";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (!formData.phone.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Phone number is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      toast({
        title: 'Validation Error',
        description: 'Phone number must be exactly 10 digits',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (!formData.address.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Address is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
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

      if (response.ok) {
        toast({
          title: 'Success!',
          description: 'Your quick registration has been submitted successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setFormData(initialFormData);
      } else {
        if (response.status === 409) {
          throw new Error(data.message || 'An account with this email already exists. Please use a different email address or contact support if you believe this is an error.');
        }
        throw new Error(data.message || 'Failed to submit registration');
      }
    } catch (error) {
      console.error('Error submitting quick registration:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit registration. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg={pageBg} py={8}>
      <Container maxW="md">
        <VStack spacing={8} align="stretch">
          {/* NAVIU Logo and Header */}
          <Center>
            <VStack spacing={4}>
              <Image 
                src="/naviu.png" 
                alt="NAVIU" 
                h="80px" 
                objectFit="contain"
              />
              <Heading 
                as="h1" 
                size="xl" 
                color={textColor}
                textAlign="center"
              >
                Quick Registration
              </Heading>
              <Box 
                textAlign="center" 
                color={useColorModeValue('gray.600', 'gray.400')}
                fontSize="sm"
              >
                Fill out the form below to register quickly
              </Box>
            </VStack>
          </Center>

          {/* Registration Form */}
          <Box
            bg={cardBg}
            p={8}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={cardBorder}
            boxShadow="lg"
          >
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel color={textColor}>Full Name</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    bg={useColorModeValue('white', 'gray.700')}
                    borderColor={useColorModeValue('gray.300', 'gray.600')}
                    _focus={{
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 1px #3182ce'
                    }}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color={textColor}>Phone Number</FormLabel>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit phone number"
                    type="tel"
                    maxLength="10"
                    bg={useColorModeValue('white', 'gray.700')}
                    borderColor={useColorModeValue('gray.300', 'gray.600')}
                    _focus={{
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 1px #3182ce'
                    }}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color={textColor}>Address</FormLabel>
                  <Textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your complete address"
                    rows={3}
                    bg={useColorModeValue('white', 'gray.700')}
                    borderColor={useColorModeValue('gray.300', 'gray.600')}
                    _focus={{
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 1px #3182ce'
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textColor}>Follow-up Date (Optional)</FormLabel>
                  <Input
                    name="follow_up_date"
                    value={formData.follow_up_date}
                    onChange={handleInputChange}
                    type="date"
                    bg={useColorModeValue('white', 'gray.700')}
                    borderColor={useColorModeValue('gray.300', 'gray.600')}
                    _focus={{
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 1px #3182ce'
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textColor}>Comments (Optional)</FormLabel>
                  <Textarea
                    name="comments"
                    value={formData.comments}
                    onChange={handleInputChange}
                    placeholder="Any additional comments or notes"
                    rows={2}
                    bg={useColorModeValue('white', 'gray.700')}
                    borderColor={useColorModeValue('gray.300', 'gray.600')}
                    _focus={{
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 1px #3182ce'
                    }}
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  isLoading={isLoading}
                  loadingText="Submitting..."
                >
                  Submit Registration
                </Button>
              </VStack>
            </form>
          </Box>

          {/* Footer */}
          <Center>
            <Text 
              fontSize="sm" 
              color={useColorModeValue('gray.500', 'gray.400')}
              textAlign="center"
            >
              © 2024 ESE Paper Trading. All rights reserved.
            </Text>
          </Center>
        </VStack>
      </Container>
    </Box>
  );
};

export default QuickRegistrationFormPage;
