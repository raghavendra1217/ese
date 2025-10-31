import React, { useState } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    Button, FormControl, FormLabel, useToast, VStack, Text,
    NumberInput, NumberInputField, Alert, AlertIcon
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

// --- UPDATED COMPONENT: Now accepts 'onWithdrawalSuccess' ---
const FIXED_WITHDRAWAL_AMOUNT = 25000;

const WithdrawModal = ({ isOpen, onClose, url, currentBalance, onWithdrawalSuccess }) => {
    const { token } = useAuth();
    const toast = useToast();

    const [amount, setAmount] = useState(FIXED_WITHDRAWAL_AMOUNT.toString());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const resetAndClose = () => {
        setAmount(FIXED_WITHDRAWAL_AMOUNT.toString());
        setError('');
        setIsLoading(false);
        onClose();
    };

    const handleWithdrawSubmit = async (e) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);

        if (Number.isNaN(numericAmount)) {
            setError('Withdrawal amount must be ₹25,000.');
            return;
        }

        // Client-side validation
        if (numericAmount > currentBalance) {
            setError('Withdrawal amount cannot be greater than your current balance.');
            return;
        }

        // Withdrawal amount must be exactly the fixed amount
        if (numericAmount !== FIXED_WITHDRAWAL_AMOUNT) {
            setError('Withdrawal amount must be ₹25,000.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${url}/api/wallet/withdraw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount: numericAmount }),
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

            // --- THE FIX IS HERE ---
            // This function is called to tell the parent page (WalletPage)
            // that the request was successful, so it can immediately disable the button.
            onWithdrawalSuccess();

            resetAndClose();

        } catch (err) {
            setError(err.message);
            toast({ title: 'Submission Error', description: err.message, status: 'error', duration: 4000 });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={resetAndClose} isCentered>
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleWithdrawSubmit}>
                <ModalHeader>Request a Withdrawal</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <Text>Your withdrawal request will be processed within 3 bank working days.</Text>
                        
                        {/* Withdrawal Rules Information */}
                        <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <VStack align="start" spacing={1} fontSize="sm">
                                <Text fontWeight="bold">Withdrawal Guidelines:</Text>
                                <Text>• Withdrawal amount is fixed at ₹25,000</Text>
                                <Text>• All requests are subject to approval and processing time</Text>
                            </VStack>
                        </Alert>
                        
                         <FormControl isRequired>
                            <FormLabel>Amount to Withdraw</FormLabel>
                            <NumberInput
                                value={amount}
                                min={FIXED_WITHDRAWAL_AMOUNT}
                                max={FIXED_WITHDRAWAL_AMOUNT}
                                isReadOnly
                                precision={2}
                            >
                                <NumberInputField placeholder="25000" />
                            </NumberInput>
                        </FormControl>

                        {error && <Alert status="error"><AlertIcon />{error}</Alert>}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={resetAndClose}>Cancel</Button>
                    <Button type="submit" colorScheme="orange" isLoading={isLoading} loadingText="Submitting...">
                        Submit Request
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default WithdrawModal;