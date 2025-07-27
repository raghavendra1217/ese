import React, { useState, useEffect } from 'react';
import {
    Box, VStack, Heading, Text, useColorModeValue, Spinner,
    Center, SimpleGrid, Button, useToast, Image, Modal,
    ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, useDisclosure, Divider
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

// =================================================================
// --- Vendor Approval Card (with added Reject button) ---
// =================================================================
const VendorApprovalCard = ({ vendor, onApprove, onReject, url }) => {
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
                <Divider />
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
                {/* --- UPDATED: Button group for Approve/Reject --- */}
                <SimpleGrid columns={2} spacing={2} pt={2}>
                    <Button colorScheme="red" onClick={() => onReject(vendor.id)}>Reject</Button>
                    <Button colorScheme="teal" onClick={() => onApprove(vendor.id)}>Approve</Button>
                </SimpleGrid>
            </VStack>

            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Image Preview</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Center><Image src={currentImage} alt="Preview" maxH="80vh" /></Center>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};

// =================================================================
// --- MAIN PAGE: Manage Vendor Approvals (SIMPLIFIED) ---
// =================================================================
const ManageVendorApprovalsPage = ({ url }) => {
    const mainBg = useColorModeValue('#F9FAFB', 'gray.800');
    const toast = useToast();
    const { token } = useAuth();
    
    const [vendors, setVendors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch ONLY pending vendors
    useEffect(() => {
        const fetchPendingVendors = async () => {
            if (!token) return;
            setIsLoading(true);
            try {
                const response = await fetch(`${url}/api/admin/pending-vendors`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch pending vendors.');
                
                setVendors(await response.json());
            } catch (error) {
                toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 });
            } finally {
                setIsLoading(false);
            }
        };
        fetchPendingVendors();
    }, [toast, token, url]);

    // Handler for Approving
    const handleApproveVendor = async (vendorId) => {
        try {
            const response = await fetch(`${url}/api/admin/approve-vendor/${vendorId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to approve vendor.');
            
            toast({ title: 'Success', description: 'Vendor approved!', status: 'success', duration: 3000 });
            setVendors(current => current.filter(v => v.id !== vendorId));
        } catch (error) {
            toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 });
        }
    };

    // --- NEW: Handler for Rejecting ---
    const handleRejectVendor = async (vendorId) => {
        // Optional: Add a confirmation dialog before this destructive action
        if (!window.confirm('Are you sure you want to permanently reject and delete this vendor? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${url}/api/admin/reject-vendor/${vendorId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to reject vendor.');
            
            toast({ title: 'Success', description: 'Vendor has been rejected and deleted.', status: 'success', duration: 3000 });
            setVendors(current => current.filter(v => v.id !== vendorId));
        } catch (error) {
            toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 });
        }
    };

    return (
        <Box flex="1" p={{ base: 4, md: 8 }} bg={mainBg}>
            <VStack spacing={8} align="stretch">
                <Box>
                    <Heading as="h1" size="xl">Manage Vendor Approvals</Heading>
                    <Text color="gray.500">Review and approve new vendor registrations.</Text>
                </Box>
                
                {isLoading ? (
                    <Center h="200px"><Spinner size="xl" /></Center>
                ) : vendors.length > 0 ? (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                        {vendors.map(vendor => (
                            <VendorApprovalCard 
                                key={vendor.id} 
                                vendor={vendor} 
                                onApprove={handleApproveVendor}
                                onReject={handleRejectVendor} // Pass the reject handler
                                url={url}
                            />
                        ))}
                    </SimpleGrid>
                ) : (
                    <Center h="200px">
                        <Text fontSize="lg">No pending vendor approvals at this time.</Text>
                    </Center>
                )}
            </VStack>
        </Box>
    );
};

export default ManageVendorApprovalsPage;