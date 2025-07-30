import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input, VStack, Heading,
  useColorModeValue, Center, Divider, Text, useToast, Image, Alert, AlertIcon,
  HStack, useClipboard
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const PaymentPage = ({ url }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const paymentScreenshotRef = useRef(null);
  
  // --- THE FIX IS HERE ---
  // All Hooks must be called at the top level of the component.
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.700', 'white');
  const upiIdBg = useColorModeValue('gray.100', 'gray.700');
  const upiIdColor = useColorModeValue('gray.800', 'gray.200'); // <-- MOVED HOOK HERE

  const [email, setEmail] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const upiId = 'akhileshraviteja5-2@okhdfcbank';
  const { onCopy, hasCopied } = useClipboard(upiId);

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
  }, [navigate, toast]);

  const registrationFee = 9999;
  const totalAmount = registrationFee;

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const paymentData = new FormData();
    paymentData.append('email', email);
    paymentData.append('transactionId', transactionId);
    paymentData.append('paymentScreenshot', paymentScreenshot);

    try {
        const response = await fetch(`${url}/api/auth/submit-payment`, {
            method: 'POST',
            body: paymentData,
        });
        const contentType = response.headers.get("content-type");
        if (!response.ok || !contentType || !contentType.includes("application/json")) {
            throw new Error(`Server responded with an error (Status: ${response.status}). Please check the API connection.`);
        }
        const data = await response.json();
        toast({
            title: 'Registration Submitted!',
            description: data.message,
            status: 'success',
            duration: 9000,
            isClosable: true,
            position: 'top',
        });
        sessionStorage.removeItem('registrationData');
        navigate('/login');
    } catch (err) {
        toast({ title: 'Submission Failed', description: err.message, status: 'error', duration: 5000, isClosable: true });
    } finally {
        setIsLoading(false);
    }
  };

  if (!sessionStorage.getItem('registrationData')) return null;

  return (
    <Box py={{ base: 6, md: 10 }} px={{ base: 2, sm: 4 }}>
      <VStack spacing={6} w="100%" maxW="700px" mx="auto">
        <VStack spacing={2} align="flex-start" w="100%">
          <Heading as="h1" size={{ base: 'lg', md: 'xl' }} color={headingColor}>
            Final Step: Complete Payment
          </Heading>
          <Divider borderColor="red.400" borderWidth="1px" />
        </VStack>

        <Box 
          p={{ base: 4, sm: 6, md: 8 }}
          borderWidth={1} 
          borderColor={cardBorder} 
          borderRadius="xl" 
          boxShadow="lg" 
          bg={cardBg} 
          w="100%"
        >
            <VStack as="form" onSubmit={handlePaymentSubmit} spacing={6}>
                <Heading size="md" color="teal.500">Registration Payment</Heading>
                
                <Alert status='info' borderRadius="md" w="full">
                    <AlertIcon />
                    <Box>
                        <Text fontWeight="bold">One-Time Registration Fee:</Text>
                        <Text fontWeight="bold" fontSize="lg">Total Amount to Pay: ₹{totalAmount.toLocaleString('en-IN')}</Text>
                    </Box>
                </Alert>

                <Text textAlign="center">Please scan the QR code below or use the UPI ID to complete the payment.</Text>
                
                <Image
                    w={{ base: '200px', md: '250px' }}
                    h="auto"
                    objectFit="contain"
                    src="/images/payment-qr-code.png"
                    alt="QR Code for payment"
                    fallbackSrc="https://via.placeholder.com/250"
                />

                <Box p={3} bg={upiIdBg} borderRadius="md" w="full" maxW="350px">
                    <HStack justify="space-between" align="center">
                        {/* Use the variable defined at the top of the component */}
                        <Text fontFamily="monospace" fontSize="md" color={upiIdColor}>
                            {upiId}
                        </Text>
                        <Button onClick={onCopy} size="sm" colorScheme={hasCopied ? "green" : "blue"}>{hasCopied ? "Copied!" : "Copy"}</Button>
                    </HStack>
                </Box>

                <FormControl isRequired>
                    <FormLabel htmlFor="transactionId">Transaction ID</FormLabel>
                    <Input id="transactionId" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter the UPI/Bank transaction ID"/>
                </FormControl>
                <FormControl isRequired>
                    <FormLabel htmlFor="paymentScreenshot">Upload Payment Screenshot</FormLabel>
                    <Input ref={paymentScreenshotRef} id="paymentScreenshot" type="file" p={1.5} onChange={(e) => setPaymentScreenshot(e.target.files[0])} accept="image/*"/>
                </FormControl>
                <Button type="submit" colorScheme="teal" w="full" size="lg" isLoading={isLoading} disabled={!transactionId || !paymentScreenshot}>
                    Submit and Complete Registration
                </Button>
            </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default PaymentPage;