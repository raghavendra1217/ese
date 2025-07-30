// In frontend/src/pages/vendor/AllVendorsPage.jsx
// FINAL VERSION: This component is now a hybrid widget and full page.

import React, { useState, useEffect, useMemo } from 'react';
import {
    // Standard Imports from your working version
    Box, Heading, Input, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
    Spinner, Center, Text, VStack, useColorModeValue, Tag,
    // New Imports needed for the widget/modal functionality
    Flex, useDisclosure, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Avatar, HStack, Button
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

// The component now accepts a 'mode' prop. It defaults to 'fullpage'.
const AllVendorsPage = ({ url, mode = 'fullpage' }) => {
    // --- STATE MANAGEMENT (MERGED) ---
    // State for the full list (used for both the modal and the full page)
    const [allVendors, setAllVendors] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);

    // New state, only for the recent vendors on the dashboard
    const [recentVendors, setRecentVendors] = useState([]);
    const [widgetLoading, setWidgetLoading] = useState(true);
    
    // Other state from your working version
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { token } = useAuth();
    
    // New: Hook to control the modal's open/close state
    const { isOpen, onOpen, onClose } = useDisclosure();

    // --- STYLING HOOKS (from your working version) ---
    const cardBg = useColorModeValue('white', 'gray.800');
    const headerColor = useColorModeValue('gray.600', 'gray.400');
    const dashboardCardBg = useColorModeValue('gray.700', 'gray.800'); // For the widget

    // --- DATA FETCHING (MERGED AND IMPROVED) ---

    // Effect 1: Fetches the correct data based on the mode.
    useEffect(() => {
        const fetchRequiredVendors = async () => {
            if (!token) return;

            // If we are in 'dashboard' mode, fetch only the recent 5 for the widget
            if (mode === 'dashboard') {
                setWidgetLoading(true);
                try {
                    const response = await fetch(`${url}/api/admin/vendors/recent`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('Failed to fetch recent vendors');
                    setRecentVendors(await response.json());
                } catch (err) {
                    setError(err.message);
                } finally {
                    setWidgetLoading(false);
                }
            }
            
            // If we are in 'fullpage' mode, fetch all vendors for the table
            if (mode === 'fullpage') {
                setPageLoading(true);
                try {
                    const response = await fetch(`${url}/api/admin/vendors/all`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('Failed to fetch all vendors');
                    setAllVendors(await response.json());
                } catch (err) {
                    setError(err.message);
                } finally {
                    setPageLoading(false);
                }
            }
        };
        
        fetchRequiredVendors();
    }, [mode, token, url]); // This runs when the component loads or the mode changes

    // Effect 2: Fetches all vendors, but ONLY when the modal is opened from the dashboard
    useEffect(() => {
        if (isOpen && mode === 'dashboard') {
            const fetchAllForModal = async () => {
                if (!token) return;
                setPageLoading(true);
                try {
                    const response = await fetch(`${url}/api/admin/vendors/all`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('Failed to fetch all vendors');
                    setAllVendors(await response.json());
                } catch (err) {
                    setError(err.message);
                } finally {
                    setPageLoading(false);
                }
            };
            fetchAllForModal();
        }
    }, [isOpen, mode, token, url]);

    // --- LOGIC FROM YOUR WORKING VERSION (No changes) ---
    const filteredVendors = useMemo(() => {
        if (!searchTerm) return allVendors;
        return allVendors.filter(vendor =>
            (vendor.vendor_name && vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (vendor.email && vendor.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [allVendors, searchTerm]);

    const StatusBadge = ({ status }) => (
        <Tag colorScheme={status === 'approved' ? 'teal' : 'gray'}>
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
        </Tag>
    );

    // --- RENDER LOGIC (THE FINAL PART) ---

    // RENDER: DASHBOARD WIDGET VIEW
    if (mode === 'dashboard') {
        return (
            <>
                <Box bg={dashboardCardBg} p={6} borderRadius="lg" mt={8}>
                    <Flex justify="space-between" align="center" mb={4}>
                        <Heading size="md">All Registered Vendors</Heading>
                        <Button onClick={onOpen} size="sm" colorScheme="blue">View All</Button>
                    </Flex>
                    {widgetLoading ? (
                        <Center h="100px"><Spinner /></Center>
                    ) : error ? (
                        <Text color="red.400">{error}</Text>
                    ) : (
                        <VStack spacing={4} align="stretch">
                            {recentVendors.map((vendor, index) => (
                                <HStack key={index} p={2} borderRadius="md" _hover={{ bg: 'gray.600' }}>
                                    <Avatar size="sm" src={`${url}${vendor.passport_photo_url}`} name={vendor.vendor_name} />
                                    <Text fontWeight="medium">{vendor.vendor_name}</Text>
                                </HStack>
                            ))}
                        </VStack>
                    )}
                </Box>
                
                <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
                    <ModalOverlay />
                    <ModalContent bg={dashboardCardBg}>
                        <ModalHeader>All Registered Vendors</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            {pageLoading ? (
                                <Center h="400px"><Spinner size="xl" /></Center>
                            ) : (
                                <Box maxH="60vh" overflowY="auto">
                                    {/* Using the same table structure from your working code */}
                                    <TableContainer>
                                        <Table variant="simple">
                                            <Thead><Tr><Th>Vendor</Th><Th>Contact</Th><Th>Status</Th><Th isNumeric>Employees</Th></Tr></Thead>
                                            <Tbody>
                                                {allVendors.map(vendor => (
                                                    <Tr key={vendor.vendor_id}>
                                                        <Td>
                                                            <HStack>
                                                                <Avatar size="sm" src={`${url}${vendor.passport_photo_url}`} name={vendor.vendor_name} />
                                                                <VStack align="start" spacing={0}>
                                                                    <Text fontWeight="bold">{vendor.vendor_name}</Text>
                                                                    <Text fontSize="sm" color={headerColor}>{vendor.vendor_id}</Text>
                                                                </VStack>
                                                            </HStack>
                                                        </Td>
                                                        <Td>{vendor.email}</Td>
                                                        <Td><StatusBadge status={vendor.status} /></Td>
                                                        <Td isNumeric>{vendor.employee_count}</Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}
                        </ModalBody>
                        <ModalFooter><Button colorScheme="blue" onClick={onClose}>Close</Button></ModalFooter>
                    </ModalContent>
                </Modal>
            </>
        );
    }

    // RENDER: FULL PAGE TABLE VIEW (your original working code, slightly adapted)
    return (
        <Box p={{ base: 4, md: 8 }}>
            <VStack align="stretch" spacing={6}>
                <Heading as="h1" size="xl">All Vendors</Heading>
                <Box bg={cardBg} borderRadius="lg" p={6} boxShadow="base">
                    <Input
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        mb={6}
                    />
                    {pageLoading ? (
                        <Center h="200px"><Spinner size="xl" /></Center>
                    ) : error ? (
                        <Center h="200px"><Text color="red.500">Error: {error}</Text></Center>
                    ) : (
                        <TableContainer>
                            <Table variant="simple">
                                <Thead><Tr><Th>Vendor</Th><Th>Contact</Th><Th>Status</Th><Th isNumeric>Employees</Th></Tr></Thead>
                                <Tbody>
                                    {filteredVendors.length > 0 ? (
                                        filteredVendors.map(vendor => (
                                            <Tr key={vendor.vendor_id}>
                                                <Td>
                                                    <HStack>
                                                        <Avatar size="sm" src={`${url}${vendor.passport_photo_url}`} name={vendor.vendor_name} />
                                                        <VStack align="start" spacing={0}>
                                                            <Text fontWeight="bold">{vendor.vendor_name}</Text>
                                                            <Text fontSize="sm" color={headerColor}>{vendor.vendor_id}</Text>
                                                        </VStack>
                                                    </HStack>
                                                </Td>
                                                <Td>{vendor.email}</Td>
                                                <Td><StatusBadge status={vendor.status} /></Td>
                                                <Td isNumeric>{vendor.employee_count}</Td>
                                            </Tr>
                                        ))
                                    ) : (
                                        <Tr><Td colSpan={4} textAlign="center">No vendors found.</Td></Tr>
                                    )}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            </VStack>
        </Box>
    );
};

export default AllVendorsPage;