import React, { useState, useEffect } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    Button, FormControl, FormLabel, useToast, VStack, Text,
    NumberInput, NumberInputField, Alert, AlertIcon, Textarea, HStack, Tag
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

const CoordinatorProductRequestModal = ({ isOpen, onClose, url, onRequestSuccess }) => {
    const { token } = useAuth();
    const toast = useToast();
    const [amount, setAmount] = useState('');
    const [remarks, setRemarks] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [pendingRequest, setPendingRequest] = useState(null);
    const [isCheckingPending, setIsCheckingPending] = useState(false);

    const resetAndClose = () => {
        setAmount('');
        setRemarks('');
        setError('');
        setIsLoading(false);
        setPendingRequest(null);
        onClose();
    };

    // Check for existing pending request when modal opens
    useEffect(() => {
        if (isOpen) {
            checkPendingRequest();
        }
    }, [isOpen]);

    const checkPendingRequest = async () => {
        if (!token) return;
        
        setIsCheckingPending(true);
        try {
            const response = await fetch(`${url}/api/coordinator/product-requests/current-pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setPendingRequest(data.pendingRequest);
            }
        } catch (error) {
            console.error('Failed to check pending request:', error);
        } finally {
            setIsCheckingPending(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);

        // Client-side validation
        if (pendingRequest) {
            setError('You already have a pending request. Please wait for approval or cancel it first.');
            return;
        }

        if (numericAmount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${url}/api/coordinator/product-requests/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    amount: numericAmount,
                    remarks: remarks.trim() || ''
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            toast({
                title: 'Request Submitted',
                description: data.message,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            onRequestSuccess();
            resetAndClose();

        } catch (err) {
            setError(err.message);
            toast({ 
                title: 'Submission Error', 
                description: err.message, 
                status: 'error', 
                duration: 4000 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={resetAndClose} isCentered>
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleSubmit}>
                <ModalHeader>Request Products</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        {isCheckingPending ? (
                            <Text>Checking for existing requests...</Text>
                        ) : pendingRequest ? (
                            <Alert status="warning" borderRadius="md">
                                <AlertIcon />
                                <VStack align="start" spacing={2} fontSize="sm">
                                    <Text fontWeight="bold">You have a pending request:</Text>
                                    <HStack spacing={2}>
                                        <Text>Amount: ₹{parseFloat(pendingRequest.amount).toFixed(2)}</Text>
                                        <Tag colorScheme="yellow" size="sm">Pending</Tag>
                                    </HStack>
                                    <Text>Created: {new Date(pendingRequest.created_at).toLocaleString()}</Text>
                                    <Text>Please wait for approval or cancel your existing request before submitting a new one.</Text>
                                </VStack>
                            </Alert>
                        ) : (
                            <>
                                <FormControl isRequired>
                                    <FormLabel>Amount (₹)</FormLabel>
                                    <NumberInput
                                        min={1}
                                        value={amount}
                                        onChange={(val) => setAmount(val)}
                                        precision={2}
                                    >
                                        <NumberInputField placeholder="Enter amount" />
                                    </NumberInput>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Remarks</FormLabel>
                                    <Textarea
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Describe your product requirements, quantities, specifications, etc. (Optional)"
                                        rows={4}
                                    />
                                </FormControl>
                            </>
                        )}

                        {error && <Alert status="error"><AlertIcon />{error}</Alert>}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={resetAndClose}>Cancel</Button>
                    {!pendingRequest && (
                        <Button type="submit" colorScheme="blue" isLoading={isLoading} loadingText="Submitting...">
                            Submit Request
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default CoordinatorProductRequestModal;
