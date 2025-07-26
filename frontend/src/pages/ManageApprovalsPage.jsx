// src/pages/ManageApprovalsPage.jsx

import React, { useState, useEffect } from 'react';
import {
    Box, VStack, Heading, Text, useColorModeValue, Spinner,
    Center, SimpleGrid, Button, useToast, Image, Modal,
    ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, useDisclosure, Divider
} from '@chakra-ui/react';
import { useAuth } from '../AppContext';

const VendorApprovalCard = ({ vendor, onApprove, url }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [currentImage, setCurrentImage] = useState('');

    const employeeCount = parseInt(vendor.employee_count, 10) || 0;
    const perEmployeeFee = 5000;
    const oneTimeFee = 9999;
    const totalAmount = (employeeCount * perEmployeeFee) + oneTimeFee;

    const viewImage = (imageUrl) => {
        setCurrentImage(imageUrl);
        onOpen();
    };

    return (
        <>
            <VStack bg={cardBg} p={5} borderRadius="lg" boxShadow="md" align="stretch" spacing={3}>
                <Heading size="md">{vendor.vendor_name}</Heading>
                <Text><strong>Email:</strong> {vendor.email}</Text>
                <Text><strong>Phone:</strong> {vendor.phone_number}</Text>
                <Text><strong>Aadhar:</strong> {vendor.aadhar_number}</Text>
                <Text><strong>PAN:</strong> {vendor.pan_card_number}</Text>
                <Text><strong>Address:</strong> {vendor.address}</Text>
                
                <Box>
                    <Text fontWeight="bold">Bank Details:</Text>
                    <Text pl={4}>- Bank: {vendor.bank_name}</Text>
                    <Text pl={4}>- Account #: {vendor.account_number}</Text>
                    <Text pl={4}>- IFSC: {vendor.ifsc_code}</Text>
                </Box>
                
                <Divider my={2} />

                <Box>
                    <Text fontWeight="bold">Payment Details:</Text>
                    <Text pl={4}><strong>Employees:</strong> {employeeCount}</Text>
                    <Text pl={4}><strong>Calculated Amount:</strong> ₹{totalAmount.toLocaleString('en-IN')}</Text>
                    <Text pl={4}><strong>Transaction ID:</strong> {vendor.transaction_id}</Text>
                </Box>

                <SimpleGrid columns={2} spacing={2} pt={2}>
                    <Button size="sm" onClick={() => viewImage(`${url}/${vendor.passport_photo_url}`)} isDisabled={!vendor.passport_photo_url}>View Photo</Button>
                    <Button size="sm" onClick={() => viewImage(`${url}/${vendor.payment_screenshot_url}`)} isDisabled={!vendor.payment_screenshot_url}>View Payment SS</Button>
                </SimpleGrid>
                <Button colorScheme="teal" onClick={() => onApprove(vendor.id)}>Approve Vendor</Button>
            </VStack>

            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Image Preview</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Center>
                            <Image src={currentImage} alt="Preview" maxH="80vh" />
                        </Center>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};

const ManageApprovalsPage = ({ url }) => {
    const mainBg = useColorModeValue('#F9FAFB', 'gray.800');
    const textColor = useColorModeValue('gray.800', 'white');
    const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');
    const toast = useToast();
    const [vendors, setVendors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { token } = useAuth();

    const fetchPendingVendors = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${url}/api/admin/pending-vendors`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch data.');
            const data = await response.json();
            setVendors(data);
        } catch (error) {
            toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingVendors();
        // eslint-disable-next-line
    }, [toast, token]);

    const handleApprove = async (vendorId) => {
        try {
            const response = await fetch(`${url}/api/admin/approve-vendor/${vendorId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to approve vendor.');
            toast({ title: 'Success', description: 'Vendor approved!', status: 'success', duration: 3000 });
            setVendors(currentVendors => currentVendors.filter(v => v.id !== vendorId));
        } catch (error) {
            toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 });
        }
    };

    return (
        <Box flex="1" p={{ base: 4, md: 8 }} bg={mainBg}>
            <VStack spacing={8} align="stretch">
                <Box>
                    <Heading as="h1" size="xl" color={textColor}>Manage Vendor Approvals</Heading>
                    <Text color={secondaryTextColor}>Review and approve new vendor registrations.</Text>
                </Box>
                {isLoading ? (
                    <Center h="200px"><Spinner /></Center>
                ) : vendors.length > 0 ? (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                        {vendors.map(vendor => (
                            <VendorApprovalCard key={vendor.id} vendor={vendor} onApprove={handleApprove} url={url} />
                        ))}
                    </SimpleGrid>
                ) : (
                    <Center h="200px">
                        <Text>No pending approvals at this time.</Text>
                    </Center>
                )}
            </VStack>
        </Box>
    );
};

export default ManageApprovalsPage;