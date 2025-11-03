import React, { useState, useEffect } from 'react';
import {
  Box, Button, VStack, Heading,
  useColorModeValue, Divider, Text, useToast, Alert, AlertIcon
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const PaymentPage = ({ url }) => {
  const toast = useToast();
  const navigate = useNavigate();

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.700', 'white');

  const [email, setEmail] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentButton, setShowPaymentButton] = useState(true);
  const [registrationFee, setRegistrationFee] = useState(4999); // Default value

  const backgroundColor = useColorModeValue('gray.5', 'gray.900');

  useEffect(() => {
    const registrationDataString = sessionStorage.getItem('registrationData');
    if (!registrationDataString) {
      toast({
        title: 'Error',
        description: 'No registration data found. Please start the registration process again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/register');
      return;
    }
    const registrationData = JSON.parse(registrationDataString);
    setEmail(registrationData.email);
    setVendorName(registrationData.vendorName);
    setPhoneNumber(registrationData.phoneNumber);

    // Fetch registration fee from API
    const fetchRegistrationFee = async () => {
      try {
        const response = await fetch(`${url}/api/payment/easebuzz/config`);
        if (response.ok) {
          const data = await response.json();
          if (data.registrationFee) {
            setRegistrationFee(data.registrationFee);
          }
        }
      } catch (error) {
        console.error('Failed to fetch registration fee:', error);
        // Keep default value
      }
    };

    fetchRegistrationFee();
  }, [navigate, toast, url]);

  const handlePaymentGateway = async () => {
    // Validate parameters before sending request
    const trimmedEmail = email ? email.trim() : '';
    const trimmedPhoneNumber = phoneNumber ? phoneNumber.trim() : '';
    const trimmedName = vendorName ? vendorName.trim() : '';
    
    // Check for missing required fields
    if (!trimmedEmail || !trimmedPhoneNumber || !trimmedName || !registrationFee) {
      toast({
        title: 'Validation Error',
        description: 'Missing required fields. Please ensure all registration data is available.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: 'Validation Error',
        description: 'Invalid email format. Please enter a valid email address.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      return;
    }
    
    // Validate phone number format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(trimmedPhoneNumber)) {
      toast({
        title: 'Validation Error',
        description: 'Invalid phone number format. Please enter a valid 10-digit phone number.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      return;
    }
    
    // Validate name (minimum length)
    if (trimmedName.length < 2) {
      toast({
        title: 'Validation Error',
        description: 'Name must be at least 2 characters long.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      return;
    }
    
    // Validate amount
    const amountNum = parseFloat(registrationFee);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Invalid registration fee amount.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      return;
    }
    
    setIsLoading(true);
    setShowPaymentButton(false);

    try {
      const response = await fetch(`${url}/api/payment/easebuzz/registration/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountNum,
          email: trimmedEmail,
          phoneNumber: trimmedPhoneNumber,
          name: trimmedName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initiate payment');
      }

      if (data.status === 1 && data.data.payment_url) {
        // Redirect to payment gateway
        window.location.href = data.data.payment_url;
      } else {
        throw new Error('Failed to get payment URL');
      }

    } catch (err) {
      console.error('Payment initiation error:', err);
      toast({
        title: 'Payment Failed',
        description: err.message || 'Failed to initiate payment gateway',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      setIsLoading(false);
      setShowPaymentButton(true);
    }
  };

  const totalAmount = registrationFee;

  if (!sessionStorage.getItem('registrationData')) return null;

  return (
    <Box
      minH="100vh"
      maxW="100vw"
      overflowX="hidden"
      overflowY="auto"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
      py={8}
      bg={backgroundColor}
    >
      <VStack spacing={6} w="100%" maxW="700px" mx="auto">
        <VStack spacing={2} align="flex-start" w="100%">
          <Heading as="h1" size={{ base: 'lg', md: 'xl' }} color={headingColor}>
            Final Step: Complete Payment
          </Heading>
          <Divider borderColor="red.400" borderWidth="1px" />
        </VStack>

          <Box 
            w="full"
            maxW="lg"
            p={{ base: 4, sm: 6, md: 8 }}
            borderWidth={1} 
            borderColor={cardBorder} 
            borderRadius="xl" 
            boxShadow="lg" 
            bg={cardBg} 
          >
            <VStack spacing={6}>
                <Heading size="md" color="teal.500">Registration Payment</Heading>
                
                <Alert status='info' borderRadius="md" w="full">
                    <AlertIcon />
                    <Box>
                        <Text fontWeight="bold">One-Time Registration Fee:</Text>
                        <Text fontWeight="bold" fontSize="lg">Total Amount to Pay: ₹{totalAmount.toLocaleString('en-IN')}</Text>
                    </Box>
                </Alert>

                <Text textAlign="center">
                  Click the button below to proceed with secure payment through our payment gateway.
                  You will be redirected to complete the payment.
                </Text>

                {showPaymentButton && (
                  <Button 
                    colorScheme="teal" 
                    w="full" 
                    size="lg" 
                    onClick={handlePaymentGateway}
                    isLoading={isLoading}
                    loadingText="Processing..."
                  >
                    Proceed to Payment Gateway
                  </Button>
                )}

                {!showPaymentButton && (
                  <Text color="blue.500" textAlign="center">
                    Redirecting to payment gateway...
                  </Text>
                )}
            </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default PaymentPage;