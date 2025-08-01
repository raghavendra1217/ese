// In frontend/src/pages/vendor/AllVendorsPage.jsx
// FINAL VERSION

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Heading, Input, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
    Spinner, Center, Text, VStack, useColorModeValue,
    Flex, useDisclosure, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Avatar, HStack, Button, Tag
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

const AllVendorsPage = ({ url, mode = 'fullpage' }) => {
    // --- STATE ---
    const [allVendors, setAllVendors] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [recentVendors, setRecentVendors] = useState([]);
    const [widgetLoading, setWidgetLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { token } = useAuth();
    const { isOpen, onOpen, onClose } = useDisclosure();

    // --- STYLING ---
    const cardBg = useColorModeValue('white', 'gray.800');
    const headerColor = useColorModeValue('gray.600', 'gray.400');
    const hoverBg = useColorModeValue('gray.100', 'gray.600');
    const boxBg = useColorModeValue('white', 'gray.800');

    const dashboardCardBg = useColorModeValue('gray.700', 'gray.800');


    // --- DATA FETCHING ---

    // Effect 1: Fetches the data needed for the initial view.
    useEffect(() => {
        const fetchRequiredVendors = async () => {
            if (!token) return;

            // For dashboard mode, fetch the 5 most recent vendors.
            if (mode === 'dashboard') {
                setWidgetLoading(true);
                try {
                    const response = await fetch(`${url}/api/admin/vendors/recent`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('Failed to fetch recent vendors');
                    const data = await response.json();
                    setRecentVendors(data); // The backend now correctly sends only vendors.
                } catch (err) {
                    setError(err.message);
                } finally {
                    setWidgetLoading(false);
                }
            }
            
            // For full page mode, fetch all vendors.
            if (mode === 'fullpage') {
                setPageLoading(true);
                try {
                    const response = await fetch(`${url}/api/admin/vendors/all`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('Failed to fetch all vendors');
                    const data = await response.json();
                    setAllVendors(data); // The backend now correctly sends only vendors.
                } catch (err) {
                    setError(err.message);
                } finally {
                    setPageLoading(false);
                }
            }
        };
        fetchRequiredVendors();
    }, [mode, token, url]);

    // Effect 2: Fetches the complete list of vendors ONLY when the modal is opened.
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
                    const data = await response.json();
                    setAllVendors(data);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setPageLoading(false);
                }
            };
            fetchAllForModal();
        }
    }, [isOpen, mode, token, url]);

    // --- SEARCH LOGIC ---
    const filteredVendors = useMemo(() => {
        if (!searchTerm) return allVendors;
        return allVendors.filter(vendor =>
            (vendor.vendor_name && vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (vendor.email && vendor.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [allVendors, searchTerm]);

    // --- RENDER LOGIC ---

    // RENDER: DASHBOARD WIDGET (shows recent vendors)
    if (mode === 'dashboard') {
        return (
            <>
                <Box
                bg={boxBg}
                p={6}
                borderRadius="lg"
                mt={8}
                boxShadow="md"
                >

                    <Flex justify="space-between" align="center" mb={4}>
                        <Heading size="md">Recent Vendors</Heading>
                        <Button onClick={onOpen} size="sm" colorScheme="blue">View All</Button>
                    </Flex>
                    {widgetLoading ? ( <Center h="100px"><Spinner /></Center> ) 
                    : error ? ( <Text color="red.400">{error}</Text> ) 
                    : (
                        <VStack spacing={4} align="stretch">
                            {recentVendors.map((vendor) => (
                                <HStack key={vendor.vendor_id || vendor.email} p={2} borderRadius="md" _hover={{ bg: hoverBg }}>
                                    <Avatar size="sm" src={`${url}${vendor.passport_photo_url}`} name={vendor.vendor_name} />
                                    <Text fontWeight="medium">{vendor.vendor_name}</Text>
                                </HStack>
                            ))}
                        </VStack>
                    )}
                </Box>
                
                {/* This Modal shows ALL vendors when opened */}
                <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
                    <ModalOverlay />
                    <ModalContent bg={dashboardCardBg}>
                        <ModalHeader>All Registered Vendors ({pageLoading ? '...' : filteredVendors.length})</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Input
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                mb={4}
                            />
                            {pageLoading ? (<Center h="400px"><Spinner size="xl" /></Center>) 
                            : (
                                <Box maxH="60vh" overflowY="auto">
                                    <TableContainer>
                                        <Table variant="simple">
                                            <Thead><Tr><Th>Vendor</Th><Th>Contact</Th></Tr></Thead>
                                            <Tbody>
                                                {allVendors.length > 0 ? (
                                                    allVendors.map(vendor => (
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
                                                        </Tr>
                                                    ))
                                                ) : (
                                                    <Tr><Td colSpan={2} textAlign="center">No vendors found.</Td></Tr>
                                                )}
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

    // RENDER: FULL PAGE TABLE VIEW (shows all vendors)
    return (
        <Box p={{ base: 4, md: 8 }}>
            <VStack align="stretch" spacing={6}>
                <Flex justify="space-between" align="center">
                    <Heading as="h1" size="xl">All Vendors</Heading>
                    {!pageLoading && !error && (
                        <Tag size="lg" colorScheme="blue" borderRadius="full">
                            {filteredVendors.length} Total
                        </Tag>
                    )}
                </Flex>
                <Box bg={cardBg} borderRadius="lg" p={6} boxShadow="base">
                   <Input
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                mb={4}
                            />
    {pageLoading ? (<Center h="400px"><Spinner size="xl" /></Center>) 
                    : error ? ( <Center h="200px"><Text color="red.500">Error: {error}</Text></Center> ) 
                    : (
                        <TableContainer>
                            <Table variant="simple">
                                <Thead><Tr><Th>Vendor</Th><Th>Contact</Th></Tr></Thead>
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
                                            </Tr>
                                        ))
                                    ) : (
                                        <Tr><Td colSpan={2} textAlign="center">No vendors found.</Td></Tr>
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