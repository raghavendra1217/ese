import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Heading, Input, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
    Spinner, Center, Text, VStack, useColorModeValue,
    Flex, useDisclosure, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Avatar, HStack, Button, Tag
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const AllVendorsPage = ({ url, mode = 'fullpage' }) => {
    const [allVendors, setAllVendors] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [recentVendors, setRecentVendors] = useState([]);
    const [widgetLoading, setWidgetLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { token } = useAuth();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const navigate = useNavigate();

    const cardBg = useColorModeValue('white', 'gray.800');
    const headerColor = useColorModeValue('gray.600', 'gray.400');
    const hoverBg = useColorModeValue('gray.100', 'gray.600');
    const boxBg = useColorModeValue('white', 'gray.800');
    const modalBg = useColorModeValue('white', 'gray.800');
    const modalTextColor = useColorModeValue('black', 'white');

    // ✅ Moved out of useEffect
    const handleDownloadExcel = (vendors) => {
        const data = vendors.map(v => ({
            'Vendor Name': v.vendor_name,
            'Vendor ID': v.vendor_id,
            'Email': v.email,
            'Phone': v.phone_number,
            'Aadhar': v.aadhar_number,
            'PAN': v.pan_card_number,
            'Bank Name': v.bank_name,
            'Account No': v.account_number,
            'IFSC': v.ifsc_code,
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Vendors");
        XLSX.writeFile(workbook, "AllVendors.xlsx");
    };

    const downloadAsExcel = () => {
        const dataToExport = filteredVendors.map(v => ({
            ID: v.vendor_id,
            Name: v.vendor_name,
            Email: v.email,
            Phone: v.phone_number,
            Aadhar: v.aadhar_number,
            PAN: v.pan_card_number,
            Bank_Name: v.bank_name,
            Account_Number: v.account_number,
            IFSC_Code: v.ifsc_code,
            Status: v.status,
            Role: v.role
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Vendors");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, "All_Vendors_List.xlsx");
    };

    useEffect(() => {
        const fetchRequiredVendors = async () => {
            if (!token) return;

            if (mode === 'dashboard') {
                setWidgetLoading(true);
                try {
                    const response = await fetch(`${url}/api/admin/vendors/recent`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('Failed to fetch recent vendors');
                    const data = await response.json();
                    setRecentVendors(data);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setWidgetLoading(false);
                }
            }

            if (mode === 'fullpage') {
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
            }
        };
        fetchRequiredVendors();
    }, [mode, token, url]);

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

    const filteredVendors = useMemo(() => {
        if (!searchTerm) return allVendors;
        return allVendors.filter(vendor =>
            (vendor.vendor_name && vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (vendor.email && vendor.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [allVendors, searchTerm]);

    // ---------- UI Rendering ----------
    if (mode === 'dashboard') {
        return (
            <>
                <Box bg={boxBg} p={6} borderRadius="lg" mt={8} boxShadow="md">
                    <Flex justify="space-between" align="center" mb={4}>
                        <Heading size="md">Recent Vendors</Heading>
                        <Button onClick={onOpen} size="sm" colorScheme="blue">View All</Button>
                    </Flex>
                    {widgetLoading ? (
                        <Center h="100px"><Spinner /></Center>
                    ) : error ? (
                        <Text color="red.400">{error}</Text>
                    ) : (
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

                <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
                    <ModalOverlay />
                    <ModalContent bg={modalBg} color={modalTextColor}>
                        <ModalHeader>
                            All Registered Vendors ({pageLoading ? '...' : filteredVendors.length})
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Button
                                size="sm"
                                colorScheme="green"
                                mb={4}
                                onClick={() => handleDownloadExcel(filteredVendors)}
                            >
                                Download All Vendors
                            </Button>
                            <Input
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                mb={4}
                            />
                            {pageLoading ? (
                                <Center h="400px"><Spinner size="xl" /></Center>
                            ) : (
                                <Box maxH="60vh" overflowY="auto">
                                    <TableContainer>
                                        <Table variant="simple">
                                            <Thead><Tr><Th>Vendor</Th><Th>Contact</Th></Tr></Thead>
                                            <Tbody>
                                                {filteredVendors.length > 0 ? (
                                                    filteredVendors.map(vendor => (
                                                        <Tr key={vendor.vendor_id}
                                                            _hover={{ bg: 'gray.100', cursor: 'pointer' }}
                                                            onClick={() => {
                                                                navigate(`/admin/vendors/${vendor.vendor_id}`);
                                                                onClose();
                                                            }}>
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
                        <ModalFooter>
                            <Button colorScheme="blue" onClick={onClose}>Close</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </>
        );
    }

    // Full Page Mode
    return (
        <Box p={{ base: 4, md: 8 }}>
            <VStack align="stretch" spacing={6}>
                <Flex justify="space-between" align="center">
                    <Heading as="h1" size="xl">All Vendors</Heading>
                    <HStack spacing={4}>
                        {!pageLoading && !error && (
                            <Tag size="lg" colorScheme="blue" borderRadius="full">
                                {filteredVendors.length} Total
                            </Tag>
                        )}
                        <Button onClick={downloadAsExcel} size="sm" colorScheme="green">Download Excel</Button>
                    </HStack>
                </Flex>
                <Box bg={cardBg} borderRadius="lg" p={6} boxShadow="base">
                    <Input
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        mb={4}
                    />
                    {pageLoading ? (
                        <Center h="400px"><Spinner size="xl" /></Center>
                    ) : error ? (
                        <Center h="200px"><Text color="red.500">Error: {error}</Text></Center>
                    ) : (
                        <TableContainer>
                            <Table variant="simple">
                                <Thead><Tr><Th>Vendor</Th><Th>Contact</Th></Tr></Thead>
                                <Tbody>
                                    {filteredVendors.length > 0 ? (
                                        filteredVendors.map(vendor => (
                                            <Tr
                                                key={vendor.vendor_id}
                                                _hover={{ bg: 'gray.100', cursor: 'pointer' }}
                                                onClick={() => navigate(`/admin/vendors/${vendor.vendor_id}`)}
                                            >
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
