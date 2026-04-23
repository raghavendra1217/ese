// import React, { useState } from 'react';
// import {
//     Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
//     Button, FormControl, FormLabel, Input, useToast, VStack, Text,
//     NumberInput, NumberInputField, Alert, AlertIcon, Image,
//     HStack, useClipboard, useColorModeValue, Box // <-- THE FIX IS HERE: 'Box' has been added
// } from '@chakra-ui/react';
// import { useAuth } from '../../AppContext';

// const AddMoneyModal = ({ isOpen, onClose, url, onTransactionComplete }) => {
//     const { token } = useAuth();
//     const toast = useToast();

//     const upiId = 'akhileshraviteja5-2@okhdfcbank';
//     const { onCopy, hasCopied } = useClipboard(upiId);
//     const upiIdBg = useColorModeValue('gray.100', 'gray.700');

//     // State for the modal
//     const [amount, setAmount] = useState('');
//     const [transactionId, setTransactionId] = useState('');
//     const [paymentScreenshot, setPaymentScreenshot] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState('');

//     const resetAndClose = () => {
//         setAmount('');
//         setTransactionId('');
//         setPaymentScreenshot(null);
//         setError('');
//         setIsLoading(false);
//         onClose();
//     };

//     const handleDepositSubmit = async (e) => {
//         e.preventDefault();
//         if (!amount || !transactionId || !paymentScreenshot) {
//             setError('All fields are required.');
//             return;
//         }
//         setIsLoading(true);
//         setError('');
//         const formData = new FormData();
//         formData.append('amount', amount);
//         formData.append('transactionId', transactionId);
//         formData.append('paymentScreenshot', paymentScreenshot);
//         try {
//             const response = await fetch(`${url}/api/wallet/deposit`, {
//                 method: 'POST',
//                 headers: { 'Authorization': `Bearer ${token}` },
//                 body: formData,
//             });
//             const data = await response.json();
//             if (!response.ok) throw new Error(data.message || 'Failed to submit deposit request.');
//             toast({
//                 title: 'Request Submitted',
//                 description: data.message,
//                 status: 'success',
//                 duration: 5000,
//                 isClosable: true,
//             });
//             onTransactionComplete();
//             resetAndClose();
//         } catch (err) {
//             setError(err.message);
//             toast({ title: 'Submission Error', description: err.message, status: 'error', duration: 4000 });
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleFileChange = (e) => {
//         const file = e.target.files[0];
//         if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
//              setError('File is too large. Maximum size is 5MB.');
//              setPaymentScreenshot(null);
//         } else {
//             setPaymentScreenshot(file);
//         }
//     };

//     return (
//         <Modal isOpen={isOpen} onClose={resetAndClose} isCentered>
//             <ModalOverlay />
//             <ModalContent as="form" onSubmit={handleDepositSubmit}>
//                 <ModalHeader>Request a Deposit</ModalHeader>
//                 <ModalCloseButton />
//                 <ModalBody>
//                     <VStack spacing={4}>
//                         <Text textAlign="center" fontSize="sm">
//                             Please pay using the QR code or UPI ID, then fill out this form to request the deposit.
//                         </Text>
//                         <Image
//                             w="200px"
//                             h="auto"
//                             src="/images/payment-qr-code.png" // Your static QR code
//                             alt="Payment QR Code"
//                         />

//                         {/* This Box component will now be correctly recognized */}
//                         <Box p={3} bg={upiIdBg} borderRadius="md" w="full" maxW="300px">
//                             <HStack justify="space-between" align="center">
//                                 <Text fontFamily="monospace" fontSize="sm">
//                                     {upiId}
//                                 </Text>
//                                 <Button onClick={onCopy} size="sm" colorScheme={hasCopied ? "green" : "blue"}>
//                                     {hasCopied ? "Copied!" : "Copy"}
//                                 </Button>
//                             </HStack>
//                         </Box>
                        
//                         <FormControl isRequired>
//                             <FormLabel>Amount Deposited</FormLabel>
//                             <NumberInput min={1} value={amount} onChange={(val) => setAmount(val)} precision={2}>
//                                 <NumberInputField placeholder="e.g., 500.00" />
//                             </NumberInput>
//                         </FormControl>
//                         <FormControl isRequired>
//                             <FormLabel>Transaction ID</FormLabel>
//                             <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter the UPI/Bank transaction ID"/>
//                         </FormControl>
//                         <FormControl isRequired>
//                             <FormLabel>Payment Screenshot</FormLabel>
//                             <Input type="file" p={1.5} onChange={handleFileChange} accept="image/*" />
//                         </FormControl>
//                         {error && <Alert status="error"><AlertIcon />{error}</Alert>}
//                     </VStack>
//                 </ModalBody>
//                 <ModalFooter>
//                     <Button variant="ghost" mr={3} onClick={resetAndClose}>Cancel</Button>
//                     <Button type="submit" colorScheme="green" isLoading={isLoading} loadingText="Submitting...">
//                         Submit Request
//                     </Button>
//                 </ModalFooter>
//             </ModalContent>
//         </Modal>
//     );
// };
// // #hello

// export default AddMoneyModal;





import React, { useState, useEffect } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    Button, FormControl, FormLabel, Input, useToast, VStack, Text,
    NumberInput, NumberInputField, Alert, AlertIcon, Spinner,
    HStack, useColorModeValue, Box
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

const AddMoneyModal = ({ isOpen, onClose, url, onTransactionComplete }) => {
    const { token, user } = useAuth();
    const toast = useToast();

    // State for the modal
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [minDepositAmount, setMinDepositAmount] = useState(100); // Default fallback
    const [configLoading, setConfigLoading] = useState(true);

    // Fetch payment configuration on component mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch(`${url}/api/payment/easebuzz/config`);
                if (response.ok) {
                    const config = await response.json();
                    setMinDepositAmount(config.minDepositAmount || 100);
                }
            } catch (error) {
                console.error('Failed to fetch payment config:', error);
                // Keep default value of 100
            } finally {
                setConfigLoading(false);
            }
        };

        if (isOpen) {
            fetchConfig();
        }
    }, [isOpen, url]);

    const resetAndClose = () => {
        setAmount('');
        setError('');
        setIsLoading(false);
        onClose();
    };

    const handleDepositSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!amount) {
            setError('Amount is required.');
            return;
        }
        
        const depositAmount = parseFloat(amount);
        if (isNaN(depositAmount) || depositAmount <= 0) {
            setError('Please enter a valid positive amount.');
            return;
        }
        
        if (depositAmount < minDepositAmount) {
            setError(`Minimum deposit amount is ₹${minDepositAmount}.`);
            return;
        }
        
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${url}/api/wallet/deposit`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount: depositAmount }),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to initiate payment.');
            }
            
            if (data.success && data.payment_url) {
                // Redirect to Easebuzz payment gateway
                window.location.href = data.payment_url;
            } else {
                throw new Error('Payment URL not received.');
            }
            
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={resetAndClose} size="md">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Add Money to Wallet</ModalHeader>
                <ModalCloseButton />
                <form onSubmit={handleDepositSubmit}>
                    <ModalBody>
                        <VStack spacing={4}>
                            <Alert status="info" borderRadius="md">
                                <AlertIcon />
                                <Text fontSize="sm">
                                    You will be redirected to our secure payment gateway to complete the transaction.
                                </Text>
                            </Alert>
                            
                            <FormControl isRequired>
                                <FormLabel>Amount (₹)</FormLabel>
                                <NumberInput
                                    value={amount}
                                    onChange={(value) => setAmount(value)}
                                    min={minDepositAmount}
                                    precision={2}
                                    isDisabled={configLoading}
                                >
                                    <NumberInputField 
                                        placeholder={`Enter amount (minimum ₹${minDepositAmount})`} 
                                    />
                                </NumberInput>
                            </FormControl>
                            
                            {error && (
                                <Alert status="error" borderRadius="md" w="full">
                                    <AlertIcon />
                                    <Text fontSize="sm">{error}</Text>
                                </Alert>
                            )}
                            
                            <Box w="full" p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                                <Text fontSize="sm" fontWeight="bold" mb={2}>Payment Information:</Text>
                                <Text fontSize="sm">• Secure payment processing via Easebuzz</Text>
                                <Text fontSize="sm">• Multiple payment options available</Text>
                                <Text fontSize="sm">• Instant wallet credit upon successful payment</Text>
                                <Text fontSize="sm">• Minimum amount: ₹{minDepositAmount}</Text>
                            </Box>
                        </VStack>
                    </ModalBody>
                    
                    <ModalFooter>
                        <HStack spacing={3}>
                            <Button variant="ghost" onClick={resetAndClose} isDisabled={isLoading}>
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                colorScheme="blue" 
                                isLoading={isLoading}
                                loadingText="Processing..."
                                isDisabled={!amount || parseFloat(amount) < minDepositAmount || configLoading}
                            >
                                {isLoading ? <Spinner size="sm" /> : 'Proceed to Payment'}
                            </Button>
                        </HStack>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default AddMoneyModal;