import React, { useEffect, useState } from 'react';
import {
    Box, Container, VStack, HStack, Text, Button, Alert, AlertIcon,
    Heading, Divider, useColorModeValue, useToast
} from '@chakra-ui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { WarningIcon, ExternalLinkIcon, RepeatIcon } from '@chakra-ui/icons';

// Helper function to determine redirect path based on returnTo parameter
const getRedirectPath = (returnTo) => {
    const pathMap = {
        'wallet': '/vendor/wallet',
        'registration': '/register',
        'register': '/register',
        'quick-register': '/quick-register',
        'dashboard': '/vendor/dashboard',
        'admin-dashboard': '/admin/dashboard',
        'coordinator-dashboard': '/coordinator/dashboard',
        'vendor-dashboard': '/vendor/dashboard',
    };
    
    return pathMap[returnTo.toLowerCase()] || '/dashboard';
};

const PaymentFailurePage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    
    const txnid = searchParams.get('txnid');
    const error = searchParams.get('error');
    const returnTo = searchParams.get('returnTo') || 'dashboard';
    
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    
    useEffect(() => {
        // Show error toast
        toast({
            title: 'Payment Failed',
            description: 'Your payment could not be processed. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
        });
        
        // Redirect to original page after showing toast
        setTimeout(() => {
            // Determine redirect destination based on returnTo parameter or default
            const redirectPath = getRedirectPath(returnTo);
            navigate(redirectPath);
        }, 2000);
    }, [toast, navigate, returnTo]);
    
    const handleRetryPayment = () => {
        const redirectPath = getRedirectPath(returnTo);
        navigate(redirectPath);
    };
    
    const handleGoToDashboard = () => {
        navigate('/dashboard');
    };
    
    const getErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'payment_failed':
                return 'The payment was declined by your bank or payment provider.';
            case 'processing_error':
                return 'There was an error processing your payment. Please try again.';
            case 'timeout':
                return 'The payment request timed out. Please try again.';
            case 'cancelled':
                return 'The payment was cancelled by you.';
            default:
                return 'Your payment could not be processed. Please try again or contact support.';
        }
    };
    
    return (
        <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} py={8}>
            <Container maxW="md">
                <VStack spacing={6} bg={bgColor} p={8} borderRadius="lg" boxShadow="lg" border="1px" borderColor={borderColor}>
                    <WarningIcon w={16} h={16} color="red.500" />
                    
                    <VStack spacing={2}>
                        <Heading size="lg" color="red.500">
                            Payment Failed
                        </Heading>
                        <Text color="gray.600" textAlign="center">
                            {getErrorMessage(error)}
                        </Text>
                    </VStack>
                    
                    <Divider />
                    
                    <VStack spacing={3} w="full">
                        {txnid && (
                            <HStack justify="space-between" w="full">
                                <Text fontWeight="bold">Transaction ID:</Text>
                                <Text fontFamily="mono" fontSize="sm" color="gray.600">
                                    {txnid}
                                </Text>
                            </HStack>
                        )}
                        
                        <HStack justify="space-between" w="full">
                            <Text fontWeight="bold">Status:</Text>
                            <Text color="red.500" fontWeight="bold">
                                Failed
                            </Text>
                        </HStack>
                    </VStack>
                    
                    <Alert status="error" borderRadius="md" w="full">
                        <AlertIcon />
                        <VStack align="start" spacing={2}>
                            <Text fontSize="sm" fontWeight="bold">
                                What you can do:
                            </Text>
                            <Text fontSize="sm">• Check your bank account balance</Text>
                            <Text fontSize="sm">• Verify your payment details</Text>
                            <Text fontSize="sm">• Try a different payment method</Text>
                            <Text fontSize="sm">• Contact your bank if the issue persists</Text>
                        </VStack>
                    </Alert>
                    
                    <VStack spacing={3} w="full">
                        <Button
                            colorScheme="red"
                            size="lg"
                            w="full"
                            onClick={handleRetryPayment}
                            rightIcon={<RepeatIcon />}
                        >
                            Try Again
                        </Button>
                        
                        <Button
                            variant="outline"
                            size="lg"
                            w="full"
                            onClick={handleGoToDashboard}
                            rightIcon={<ExternalLinkIcon />}
                        >
                            Go to Dashboard
                        </Button>
                    </VStack>
                    
                    <Box w="full" p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                        <Text fontSize="sm" fontWeight="bold" mb={2}>Need Help?</Text>
                        <Text fontSize="sm" color="gray.600">
                            If you continue to experience issues, please contact our support team with your transaction ID.
                        </Text>
                    </Box>
                </VStack>
            </Container>
        </Box>
    );
};

export default PaymentFailurePage;
