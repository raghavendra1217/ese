import React, { useEffect } from 'react';
import {
    Box, Container, VStack, HStack, Text, Button, Alert, AlertIcon,
    Heading, Divider, useColorModeValue, useToast
} from '@chakra-ui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon } from '@chakra-ui/icons';

const RegistrationSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    
    const txnid = searchParams.get('txnid');
    const amount = searchParams.get('amount');
    
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    
    useEffect(() => {
        // Show success toast
        toast({
            title: 'Registration Successful!',
            description: 'Your account has been approved! You can now set your password and login.',
            status: 'success',
            duration: 5000,
            isClosable: true,
        });
        
        // Auto-redirect to login after 3 seconds
        const redirectTimer = setTimeout(() => {
            const registrationDataString = sessionStorage.getItem('registrationData');
            let email = '';
            if (registrationDataString) {
                const registrationData = JSON.parse(registrationDataString);
                email = registrationData.email;
            }
            // Clear registration data from session
            sessionStorage.removeItem('registrationData');
            
            // Redirect to login with email and setPassword flag
            navigate(`/login?email=${encodeURIComponent(email)}&setPassword=true`);
        }, 3000);
        
        return () => clearTimeout(redirectTimer);
    }, [toast, navigate]);
    
    const handleGoToLogin = () => {
        const registrationDataString = sessionStorage.getItem('registrationData');
        let email = '';
        if (registrationDataString) {
            const registrationData = JSON.parse(registrationDataString);
            email = registrationData.email;
        }
        // Clear registration data from session
        sessionStorage.removeItem('registrationData');
        
        // Redirect to login with email and setPassword flag
        navigate(`/login?email=${encodeURIComponent(email)}&setPassword=true`);
    };
    
    return (
        <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} py={8}>
            <Container maxW="md">
                <VStack spacing={6} bg={bgColor} p={8} borderRadius="lg" boxShadow="lg" border="1px" borderColor={borderColor}>
                    <CheckCircleIcon w={16} h={16} color="green.500" />
                    
                    <VStack spacing={2}>
                        <Heading size="lg" color="green.500">
                            Registration Successful!
                        </Heading>
                        <Text color="gray.600" textAlign="center">
                            Your registration payment has been processed successfully. Your account has been approved and is now active!
                        </Text>
                    </VStack>
                    
                    <Divider />
                    
                    <VStack spacing={3} w="full">
                        <HStack justify="space-between" w="full">
                            <Text fontWeight="bold">Transaction ID:</Text>
                            <Text fontFamily="mono" fontSize="sm" color="gray.600">
                                {txnid || 'N/A'}
                            </Text>
                        </HStack>
                        
                        <HStack justify="space-between" w="full">
                            <Text fontWeight="bold">Amount Paid:</Text>
                            <Text fontWeight="bold" color="green.500">
                                ₹{amount || '0.00'}
                            </Text>
                        </HStack>
                        
                        <HStack justify="space-between" w="full">
                            <Text fontWeight="bold">Status:</Text>
                            <Text color="green.500" fontWeight="bold">
                                Approved
                            </Text>
                        </HStack>
                    </VStack>
                    
                    <Alert status="success" borderRadius="md" w="full">
                        <AlertIcon />
                        <Text fontSize="sm">
                            Your registration is complete and you can now set up your password to start using your account.
                        </Text>
                    </Alert>
                    
                    <VStack spacing={3} w="full">
                        <Text fontSize="sm" color="gray.600" textAlign="center">
                            Redirecting to login page in a few seconds...
                        </Text>
                        <Button
                            colorScheme="teal"
                            size="lg"
                            w="full"
                            onClick={handleGoToLogin}
                        >
                            Go to Login Now
                        </Button>
                    </VStack>
                </VStack>
            </Container>
        </Box>
    );
};

export default RegistrationSuccessPage;
