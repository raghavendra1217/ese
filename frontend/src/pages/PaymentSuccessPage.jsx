import React, { useEffect, useState } from 'react';
import {
    Box, Container, VStack, HStack, Text, Button, Alert, AlertIcon,
    Heading, Divider, useColorModeValue, Spinner, useToast
} from '@chakra-ui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon, ExternalLinkIcon } from '@chakra-ui/icons';

const PaymentSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    
    const txnid = searchParams.get('txnid');
    const amount = searchParams.get('amount');
    
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    
    document.title = "NAVIU | Payment Success";

    useEffect(() => {
        // Show success toast
        toast({
            title: 'Payment Successful!',
            description: `₹${amount} has been added to your wallet`,
            status: 'success',
            duration: 5000,
            isClosable: true,
        });
    }, [amount, toast]);
    
    const handleGoToWallet = () => {
        navigate('/wallet');
    };
    
    const handleGoToDashboard = () => {
        navigate('/dashboard');
    };
    
    return (
        <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} py={8}>
            <Container maxW="md">
                <VStack spacing={6} bg={bgColor} p={8} borderRadius="lg" boxShadow="lg" border="1px" borderColor={borderColor}>
                    <CheckCircleIcon w={16} h={16} color="green.500" />
                    
                    <VStack spacing={2}>
                        <Heading size="lg" color="green.500">
                            Payment Successful!
                        </Heading>
                        <Text color="gray.600" textAlign="center">
                            Your payment has been processed successfully and the amount has been added to your wallet.
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
                            <Text fontWeight="bold">Amount:</Text>
                            <Text fontWeight="bold" color="green.500">
                                ₹{amount || '0.00'}
                            </Text>
                        </HStack>
                        
                        <HStack justify="space-between" w="full">
                            <Text fontWeight="bold">Status:</Text>
                            <Text color="green.500" fontWeight="bold">
                                Completed
                            </Text>
                        </HStack>
                    </VStack>
                    
                    <Alert status="success" borderRadius="md" w="full">
                        <AlertIcon />
                        <Text fontSize="sm">
                            Your wallet balance has been updated. You can now use this amount for trading.
                        </Text>
                    </Alert>
                    
                    <VStack spacing={3} w="full">
                        <Button
                            colorScheme="green"
                            size="lg"
                            w="full"
                            onClick={handleGoToWallet}
                            rightIcon={<ExternalLinkIcon />}
                        >
                            Go to Wallet
                        </Button>
                        
                        <Button
                            variant="outline"
                            size="lg"
                            w="full"
                            onClick={handleGoToDashboard}
                        >
                            Go to Dashboard
                        </Button>
                    </VStack>
                </VStack>
            </Container>
        </Box>
    );
};

export default PaymentSuccessPage;
