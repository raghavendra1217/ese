import React, { useState } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    Button, FormControl, FormLabel, useToast, VStack, Text,
    NumberInput, NumberInputField, Alert, AlertIcon
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

// --- UPDATED COMPONENT: Now accepts 'onWithdrawalSuccess' ---
const WithdrawModal = ({ isOpen, onClose, url, currentBalance, onWithdrawalSuccess }) => {
    const { token } = useAuth();
    const toast = useToast();

    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const resetAndClose = () => {
        setAmount('');
        setError('');
        setIsLoading(false);
        onClose();
    };

    const handleWithdrawSubmit = async (e) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);

        // Client-side validation
        if (numericAmount > currentBalance) {
            setError('Withdrawal amount cannot be greater than your current balance.');
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
                        <Text>Your request will be processed to your registered bank account within 24 hours.</Text>
                         <FormControl isRequired>
                            <FormLabel>Amount to Withdraw</FormLabel>
                            <NumberInput
                                max={currentBalance}
                                min={1}
                                value={amount}
                                onChange={(val) => setAmount(val)}
                                precision={2}
                            >
                                <NumberInputField placeholder={`Max: ₹${currentBalance.toFixed(2)}`} />
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