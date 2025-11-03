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
  const backgroundColor = useColorModeValue('gray.5', 'gray.900');
  const detailsBoxBg = useColorModeValue('gray.50', 'gray.700');

  const [email, setEmail] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentButton, setShowPaymentButton] = useState(true);
  const [registrationFee, setRegistrationFee] = useState(4999); // Default value


  // #helo

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
    
    try {
      const registrationData = JSON.parse(registrationDataString);
      console.log('🔍 PaymentPage - Registration data loaded:', registrationData);
      
      // Trim and set data with defensive checks
      const emailValue = (registrationData.email || '').trim();
      const vendorNameValue = (registrationData.vendorName || '').trim();
      const phoneNumberValue = (registrationData.phoneNumber || '').trim();
      
      console.log('🔍 PaymentPage - Trimmed values:', { emailValue, vendorNameValue, phoneNumberValue });
      
      if (!emailValue || !vendorNameValue || !phoneNumberValue) {
        const missingFields = [];
        if (!emailValue) missingFields.push('Email');
        if (!vendorNameValue) missingFields.push('Vendor Name');
        if (!phoneNumberValue) missingFields.push('Phone Number');
        
        toast({
          title: 'Registration Data Error',
          description: `Missing required data: ${missingFields.join(', ')}. Please complete registration again.`,
          status: 'error',
          duration: 7000,
          isClosable: true,
        });
        navigate('/register');
        return;
      }

      // #hello
      
      setEmail(emailValue);
      setVendorName(vendorNameValue);
      setPhoneNumber(phoneNumberValue);
    } catch (parseError) {
      console.error('❌ Error parsing registration data:', parseError);
      toast({
        title: 'Data Error',
        description: 'Failed to load registration data. Please start the registration process again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/register');
    }

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
    
    console.log('🔍 PaymentPage - Payment initiation with data:', {
      email: trimmedEmail,
      phoneNumber: trimmedPhoneNumber,
      name: trimmedName,
      registrationFee,
      emailLength: trimmedEmail.length,
      phoneLength: trimmedPhoneNumber.length,
      nameLength: trimmedName.length
    });
    
    // Check for missing required fields with specific error messages
    const missingFields = [];
    if (!trimmedEmail) missingFields.push('Email');
    if (!trimmedPhoneNumber) missingFields.push('Phone Number');
    if (!trimmedName) missingFields.push('Vendor Name');
    if (!registrationFee || registrationFee <= 0) missingFields.push('Registration Fee');
    
    if (missingFields.length > 0) {
      console.error('❌ PaymentPage - Missing fields:', missingFields);
      toast({
        title: 'Validation Error',
        description: `Missing required fields: ${missingFields.join(', ')}. Current values - Email: "${trimmedEmail}", Phone: "${trimmedPhoneNumber}", Name: "${trimmedName}", Fee: ${registrationFee}. Please go back and complete registration again.`,
        status: 'error',
        duration: 8000,
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

      console.log('🔍 PaymentPage - API Response:', JSON.stringify({
        status: data.status,
        hasPaymentUrl: !!(data.data && data.data.payment_url),
        responseData: data
      }, null, 2));

      if (!response.ok) {
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          data: data,
          dataString: JSON.stringify(data, null, 2)
        };
        console.error('❌ PaymentPage - API Error Response:', JSON.stringify(errorDetails, null, 2));
        const errorMessage = data.message || data.error || `Failed to initiate payment (Status: ${response.status})`;
        throw new Error(errorMessage);
      }

      if (data.status === 1 && data.data && data.data.payment_url) {
        console.log('✅ PaymentPage - Redirecting to payment gateway:', data.data.payment_url);
        // Redirect to payment gateway
        window.location.href = data.data.payment_url;
      } else {
        console.error('❌ PaymentPage - Invalid response structure:', data);
        throw new Error(data.message || 'Failed to get payment URL from gateway response');
      }

    } catch (err) {
      console.error('❌ PaymentPage - Payment initiation error:', {
        error: err,
        message: err.message,
        stack: err.stack,
        currentData: {
          email: trimmedEmail,
          phoneNumber: trimmedPhoneNumber,
          name: trimmedName,
          amount: amountNum
        }
      });
      toast({
        title: 'Payment Failed',
        description: err.message || 'Failed to initiate payment gateway. Please check your registration data and try again.',
        status: 'error',
        duration: 7000,
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

                {/* Display registration details for verification */}
                {(email || vendorName || phoneNumber) && (
                  <Box w="full" p={4} bg={detailsBoxBg} borderRadius="md">
                    <Text fontSize="sm" fontWeight="bold" mb={2}>Registration Details:</Text>
                    <VStack align="stretch" spacing={1} fontSize="sm">
                      {email && <Text>Email: {email}</Text>}
                      {vendorName && <Text>Name: {vendorName}</Text>}
                      {phoneNumber && <Text>Phone: {phoneNumber}</Text>}
                    </VStack>
                  </Box>
                )}

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