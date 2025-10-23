import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, VStack, SimpleGrid, Heading, Text, Button, useToast, Spinner, Center,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Divider,
  FormControl, FormLabel, Drawer, DrawerOverlay, DrawerContent, DrawerBody, useColorModeValue,
  IconButton, Alert, AlertIcon, Textarea, HStack, Tag, Badge, Table, Thead, Tbody, Tr, Th, Td,
  TableContainer, Card, CardBody, CardHeader
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import CoordinatorNavBar, { NAV_WIDTH } from '../../components/layout/CoordinatorNavBar';

// Product Request Modal Component
const ProductRequestModal = ({ isOpen, onClose, url, onRequestSuccess }) => {
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

// Cancel Request Modal
const CancelRequestModal = ({ isOpen, onClose, requestId, url, onCancelSuccess }) => {
    const { token } = useAuth();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleCancel = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${url}/api/coordinator/product-requests/cancel`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ requestId }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            toast({
                title: 'Request Cancelled',
                description: data.message,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            onCancelSuccess();
            onClose();

        } catch (err) {
            toast({ 
                title: 'Cancellation Error', 
                description: err.message, 
                status: 'error', 
                duration: 4000 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Cancel Request</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Text>Are you sure you want to cancel this product request?</Text>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>No</Button>
                    <Button colorScheme="red" onClick={handleCancel} isLoading={isLoading}>
                        Yes, Cancel
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

const CoordinatorProductRequestPage = ({ url }) => {
    const { token } = useAuth();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure();
    
    const [pendingRequest, setPendingRequest] = useState(null);
    const [requestHistory, setRequestHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequestId, setSelectedRequestId] = useState(null);

    const pageBg = useColorModeValue('gray.50', 'gray.900');
    const cardBg = useColorModeValue('white', 'gray.800');
    const cardBorder = useColorModeValue('gray.200', 'gray.700');

    const fetchData = useCallback(async () => {
        if (!token) return;
        
        setLoading(true);
        try {
            const [pendingRes, historyRes] = await Promise.all([
                fetch(`${url}/api/coordinator/product-requests/current-pending`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${url}/api/coordinator/product-requests/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (pendingRes.ok) {
                const pendingData = await pendingRes.json();
                setPendingRequest(pendingData.pendingRequest);
            }

            if (historyRes.ok) {
                const historyData = await historyRes.json();
                setRequestHistory(historyData.requests || []);
            }
        } catch (error) {
            console.error('Failed to fetch product request data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load product request data',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    }, [token, url, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRequestSuccess = () => {
        fetchData();
    };

    const handleCancelClick = (requestId) => {
        setSelectedRequestId(requestId);
        onCancelOpen();
    };

    const handleCancelSuccess = () => {
        fetchData();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'yellow';
            case 'approved': return 'green';
            case 'rejected': return 'red';
            case 'cancelled': return 'gray';
            default: return 'gray';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <Flex minH="100vh" bg={pageBg}>
                <CoordinatorNavBar variant="static" />
                <Box flex="1" ml={{ base: 0, md: NAV_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
                    <Center h="50vh">
                        <Spinner size="xl" />
                    </Center>
                </Box>
            </Flex>
        );
    }

    return (
        <Flex minH="100vh" bg={pageBg}>
            {/* Desktop sidebar */}
            <CoordinatorNavBar variant="static" />

            {/* Mobile drawer */}
            <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
                <DrawerOverlay />
                <DrawerContent>
                    <CoordinatorNavBar variant="drawer" onClose={onClose} />
                </DrawerContent>
            </Drawer>

            {/* Main content */}
            <Box flex="1" ml={{ base: 0, md: NAV_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
                {/* Mobile header */}
                <Flex align="center" gap={2} mb={6} display={{ base: 'flex', md: 'none' }}>
                    <IconButton
                        aria-label="Open menu"
                        icon={<HamburgerIcon w={5} h={5} />}
                        onClick={onOpen}
                        size="sm"
                        variant="ghost"
                    />
                    <Heading as="h1" fontSize="lg">
                        Product Requests
                    </Heading>
                </Flex>

                <VStack spacing={8} align="stretch">
                    {/* Header */}
                    <Box>
                        <Heading as="h1" fontSize="2xl" mb={2}>
                            Product Requests
                        </Heading>
                        <Text color="gray.600">
                            Submit product requests to admin for approval
                        </Text>
                    </Box>

                    {/* Current Pending Request */}
                    {pendingRequest && (
                        <Card bg={cardBg} borderColor={cardBorder}>
                            <CardHeader>
                                <Heading size="md" color="orange.500">
                                    Pending Request
                                </Heading>
                            </CardHeader>
                            <CardBody>
                                <VStack spacing={4} align="stretch">
                                    <HStack justify="space-between">
                                        <Text fontWeight="bold">Amount:</Text>
                                        <Text>₹{parseFloat(pendingRequest.amount).toFixed(2)}</Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text fontWeight="bold">Status:</Text>
                                        <Badge colorScheme={getStatusColor(pendingRequest.status)}>
                                            {pendingRequest.status.toUpperCase()}
                                        </Badge>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text fontWeight="bold">Created:</Text>
                                        <Text>{formatDate(pendingRequest.created_at)}</Text>
                                    </HStack>
                                    {pendingRequest.remarks && (
                                        <Box>
                                            <Text fontWeight="bold" mb={2}>Remarks:</Text>
                                            <Text>{pendingRequest.remarks}</Text>
                                        </Box>
                                    )}
                                    <Button
                                        colorScheme="red"
                                        variant="outline"
                                        onClick={() => handleCancelClick(pendingRequest.request_id)}
                                    >
                                        Cancel Request
                                    </Button>
                                </VStack>
                            </CardBody>
                        </Card>
                    )}

                    {/* Submit New Request Button */}
                    {!pendingRequest && (
                        <Card bg={cardBg} borderColor={cardBorder}>
                            <CardBody>
                                <VStack spacing={4}>
                                    <Text textAlign="center" color="gray.600">
                                        No pending requests. Submit a new product request below.
                                    </Text>
                                    <Button
                                        colorScheme="blue"
                                        size="lg"
                                        onClick={onOpen}
                                    >
                                        Submit New Request
                                    </Button>
                                </VStack>
                            </CardBody>
                        </Card>
                    )}

                    {/* Request History */}
                    <Card bg={cardBg} borderColor={cardBorder}>
                        <CardHeader>
                            <Heading size="md">Request History</Heading>
                        </CardHeader>
                        <CardBody>
                            {requestHistory.length === 0 ? (
                                <Text color="gray.500" textAlign="center" py={8}>
                                    No request history found.
                                </Text>
                            ) : (
                                <TableContainer>
                                    <Table variant="simple">
                                        <Thead>
                                            <Tr>
                                                <Th>Request ID</Th>
                                                <Th>Amount</Th>
                                                <Th>Status</Th>
                                                <Th>Created</Th>
                                                <Th>Remarks</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {requestHistory.map((request) => (
                                                <Tr key={request.request_id}>
                                                    <Td>{request.request_id}</Td>
                                                    <Td>₹{parseFloat(request.amount).toFixed(2)}</Td>
                                                    <Td>
                                                        <Badge colorScheme={getStatusColor(request.status)}>
                                                            {request.status.toUpperCase()}
                                                        </Badge>
                                                    </Td>
                                                    <Td>{formatDate(request.created_at)}</Td>
                                                    <Td>{request.remarks || '-'}</Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardBody>
                    </Card>
                </VStack>
            </Box>

            {/* Modals */}
            <ProductRequestModal
                isOpen={isOpen}
                onClose={onClose}
                url={url}
                onRequestSuccess={handleRequestSuccess}
            />

            <CancelRequestModal
                isOpen={isCancelOpen}
                onClose={onCancelClose}
                requestId={selectedRequestId}
                url={url}
                onCancelSuccess={handleCancelSuccess}
            />
        </Flex>
    );
};

export default CoordinatorProductRequestPage;
