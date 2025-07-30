import React, { useState } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    Button, FormControl, FormLabel, Input, useToast, VStack, Text,
    NumberInput, NumberInputField, Alert, AlertIcon, Image,
    HStack, useClipboard, useColorModeValue, Box // <-- THE FIX IS HERE: 'Box' has been added
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

const AddMoneyModal = ({ isOpen, onClose, url, onTransactionComplete }) => {
    const { token } = useAuth();
    const toast = useToast();

    const upiId = 'akhileshraviteja5-2@okhdfcbank';
    const { onCopy, hasCopied } = useClipboard(upiId);
    const upiIdBg = useColorModeValue('gray.100', 'gray.700');

    // State for the modal
    const [amount, setAmount] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [paymentScreenshot, setPaymentScreenshot] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const resetAndClose = () => {
        setAmount('');
        setTransactionId('');
        setPaymentScreenshot(null);
        setError('');
        setIsLoading(false);
        onClose();
    };

    const handleDepositSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !transactionId || !paymentScreenshot) {
            setError('All fields are required.');
            return;
        }
        setIsLoading(true);
        setError('');
        const formData = new FormData();
        formData.append('amount', amount);
        formData.append('transactionId', transactionId);
        formData.append('paymentScreenshot', paymentScreenshot);
        try {
            const response = await fetch(`${url}/api/wallet/deposit`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to submit deposit request.');
            toast({
                title: 'Request Submitted',
                description: data.message,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            onTransactionComplete();
            resetAndClose();
        } catch (err) {
            setError(err.message);
            toast({ title: 'Submission Error', description: err.message, status: 'error', duration: 4000 });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
             setError('File is too large. Maximum size is 5MB.');
             setPaymentScreenshot(null);
        } else {
            setPaymentScreenshot(file);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={resetAndClose} isCentered>
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleDepositSubmit}>
                <ModalHeader>Request a Deposit</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <Text textAlign="center" fontSize="sm">
                            Please pay using the QR code or UPI ID, then fill out this form to request the deposit.
                        </Text>
                        <Image
                            w="200px"
                            h="auto"
                            src="/images/payment-qr-code.png" // Your static QR code
                            alt="Payment QR Code"
                        />

                        {/* This Box component will now be correctly recognized */}
                        <Box p={3} bg={upiIdBg} borderRadius="md" w="full" maxW="300px">
                            <HStack justify="space-between" align="center">
                                <Text fontFamily="monospace" fontSize="sm">
                                    {upiId}
                                </Text>
                                <Button onClick={onCopy} size="sm" colorScheme={hasCopied ? "green" : "blue"}>
                                    {hasCopied ? "Copied!" : "Copy"}
                                </Button>
                            </HStack>
                        </Box>
                        
                        <FormControl isRequired>
                            <FormLabel>Amount Deposited</FormLabel>
                            <NumberInput min={1} value={amount} onChange={(val) => setAmount(val)} precision={2}>
                                <NumberInputField placeholder="e.g., 500.00" />
                            </NumberInput>
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Transaction ID</FormLabel>
                            <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter the UPI/Bank transaction ID"/>
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Payment Screenshot</FormLabel>
                            <Input type="file" p={1.5} onChange={handleFileChange} accept="image/*" />
                        </FormControl>
                        {error && <Alert status="error"><AlertIcon />{error}</Alert>}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={resetAndClose}>Cancel</Button>
                    <Button type="submit" colorScheme="green" isLoading={isLoading} loadingText="Submitting...">
                        Submit Request
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddMoneyModal;