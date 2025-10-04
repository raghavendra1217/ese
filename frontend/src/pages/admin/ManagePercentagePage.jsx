
// import React, { useState, useEffect, useCallback } from 'react';
// import {
//     Box, Flex, Heading, Text, Button, useToast, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td, Input, useColorModeValue, VStack, InputGroup, InputLeftElement
// } from '@chakra-ui/react';
// import { SearchIcon } from '@chakra-ui/icons';
// import { useAuth } from '../../AppContext';
// import AdminNavBar from '../../components/layout/AdminNavBar';

// // Helper to format currency
// const formatCurrency = (amount) => {
//     if (amount === null || amount === undefined) amount = 0;
//     return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
// };

// // Helper to convert array of objects to CSV and trigger download
// const downloadCSV = (data) => {
//     if (!data || data.length === 0) return;

//     const headers = ["Vendor Name", "User ID", "Total Referrals", "Total Spent by Referrals (INR)", "Commission %"];
//     const rows = data.map((vendor) => [
//         `"${vendor.name}"`,
//         `"${vendor.user_id}"`,
//         vendor.total_referrals,
//         vendor.total_spent_by_referrals,
//         vendor.current_percentage !== null ? `${vendor.current_percentage}%` : 'Not Set'
//     ]);

//     const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
//     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);

//     const link = document.createElement("a");
//     link.setAttribute("href", url);
//     link.setAttribute("download", "vendor_referrals.csv");
//     link.click();
// };


// const ManagePercentagePage = ({ url }) => {
//     const { token } = useAuth();
//     const toast = useToast();
//     const [vendorsData, setVendorsData] = useState([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [isSaving, setIsSaving] = useState(null);
//     const [editingCell, setEditingCell] = useState({ userId: null, value: '' });
//     const [searchQuery, setSearchQuery] = useState('');

//     const pageBg = useColorModeValue('gray.50', 'gray.900');
//     const mainBg = useColorModeValue('gray.100', 'gray.800');
//     const cardBg = useColorModeValue('white', 'gray.700');
//     const searchInputBg = useColorModeValue('white', 'gray.800');

//     const fetchVendorStats = useCallback(async () => {
//         if (!token) return;
//         setIsLoading(true);
//         try {
//             const response = await fetch(`${url}/api/admin/wallets-with-percentages`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             if (!response.ok) {
//                 const errorData = await response.json().catch(() => ({}));
//                 throw new Error(errorData.message || 'Failed to fetch vendor data.');
//             }
//             const data = await response.json();
            
//             const sortedData = data.sort((a, b) => b.total_referrals - a.total_referrals);
//             setVendorsData(sortedData);
//         } catch (error) {
//             toast({ title: 'Error', description: error.message, status: 'error' });
//         } finally {
//             setIsLoading(false);
//         }
//     }, [token, url, toast]);

//     useEffect(()=> {
//         if (token) {
//             fetchVendorStats();
//         }
//     }, [token, fetchVendorStats]);

//     const handleEditClick = (userId, currentPercentage) => {
//         setEditingCell({ userId, value: currentPercentage !== null ? String(currentPercentage) : '' });
//     };

//     const handleCancelEdit = () => {
//         setEditingCell({ userId: null, value: '' });
//     };

//     const handleInputChange = (e) => {
//         setEditingCell(prev => ({ ...prev, value: e.target.value }));
//     };

//     const handleSave = async (userId) => {
//         setIsSaving(userId);
//         const newPercentage = editingCell.value;

//         if (newPercentage === undefined || String(newPercentage).trim() === '') {
//             toast({ title: 'Invalid Input', description: 'Percentage cannot be empty.', status: 'warning' });
//             setIsSaving(null);
//             return;
//         }

//         try {
//             const response = await fetch(`${url}/api/admin/update-percentage`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//                 body: JSON.stringify({ userId, newPercentage: parseFloat(newPercentage) })
//             });
//             const data = await response.json();
//             if (!response.ok) throw new Error(data.message);
            
//             toast({ title: 'Success', description: data.message, status: 'success' });
//             handleCancelEdit(); // Exit editing mode on success
//             await fetchVendorStats();
//         } catch (error) {
//             toast({ title: 'Error', description: error.message, status: 'error' });
//         } finally {
//             setIsSaving(null);
//         }
//     };

//     const filteredVendors = vendorsData.filter(vendor =>
//         vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         vendor.user_id.toLowerCase().includes(searchQuery.toLowerCase())
//     );

//     return (
//         <Flex minH="100vh" bg={pageBg}>
//             <AdminNavBar />
//             <Box flex="1" ml="80px" p={{ base: 4, md: 8 }} bg={mainBg}>
//                 <Heading as="h1" size="lg" mb={6}>Vendor Referral Management</Heading>
                
//                 {isLoading ? (
//                     <Center h="200px"><Spinner size="xl" /></Center>
//                 ) : (
//                     <VStack spacing={6} align="stretch">
//                         <Box bg={cardBg} p={5} borderRadius="lg" shadow="md">
//                             <InputGroup mb={4} maxW="400px">
//                                 <InputLeftElement pointerEvents="none">
//                                     <SearchIcon color="gray.400" />
//                                 </InputLeftElement>
//                                 <Input
//                                     placeholder="Search by name or ID..."
//                                     value={searchQuery}
//                                     onChange={(e) => setSearchQuery(e.target.value)}
//                                     bg={searchInputBg}
//                                 />
//                             </InputGroup>

//                             <Table variant="simple">
//                                 <Thead>
//                                     <Tr>
//                                         <Th>Vendor</Th>
//                                         <Th isNumeric>Total Referrals</Th>
//                                         <Th isNumeric>Total Spent by Referrals</Th>
//                                         <Th isNumeric>Commission %</Th>
//                                         <Th textAlign="center">Action</Th>
//                                     </Tr>
//                                 </Thead>
//                                 <Tbody>
//                                     {filteredVendors.map((vendor) => (
//                                         <Tr key={vendor.user_id}>
//                                             <Td>
//                                                 <Text fontWeight="bold">{vendor.name}</Text>
//                                                 <Text fontSize="xs" color="gray.500">{vendor.user_id}</Text>
//                                             </Td>
//                                             <Td isNumeric fontWeight="bold">{vendor.total_referrals}</Td>
//                                             <Td isNumeric color="green.300">{formatCurrency(vendor.total_spent_by_referrals)}</Td>
//                                             <Td isNumeric>
//                                                 {editingCell.userId === vendor.user_id ? (
//                                                     <Input
//                                                         type="number"
//                                                         size="sm"
//                                                         w="80px"
//                                                         value={editingCell.value}
//                                                         onChange={handleInputChange}
//                                                         autoFocus
//                                                         // onBlur is REMOVED
//                                                         onKeyDown={(e) => e.key === 'Enter' && handleSave(vendor.user_id)}
//                                                     />
//                                                 ) : (
//                                                     <Text fontWeight="bold">
//                                                         {vendor.current_percentage !== null ? `${vendor.current_percentage}%` : 'Not Set'}
//                                                     </Text>
//                                                 )}
//                                             </Td>
//                                             <Td textAlign="center">
//                                                 {editingCell.userId === vendor.user_id ? (
//                                                     <Flex justify="center" gap={2}>
//                                                         <Button
//                                                             size="sm"
//                                                             colorScheme="green"
//                                                             isLoading={isSaving === vendor.user_id}
//                                                             onClick={() => handleSave(vendor.user_id)}
//                                                         >
//                                                             Save
//                                                         </Button>
//                                                         <Button
//                                                             size="sm"
//                                                             variant="outline"
//                                                             onClick={handleCancelEdit}
//                                                         >
                                                            
//                                                             Cancel
//                                                         </Button>
//                                                     </Flex>
//                                                 ) : (
//                                                     <Button
//                                                         size="sm"
//                                                         onClick={() => handleEditClick(vendor.user_id, vendor.current_percentage)}
//                                                     >
//                                                         Edit
//                                                     </Button>
//                                                 )}
//                                             </Td>
//                                         </Tr>
//                                     ))}
//                                 </Tbody>
//                             </Table>
//                         </Box>
//                         <Flex justify="flex-end" gap={4}>
//     <Button
//         colorScheme="teal"
//         onClick={() => downloadCSV(filteredVendors)}
//     >
//         Download CSV
//     </Button>
//     <Button
//         colorScheme="blue"
//         isLoading={isLoading}
//         onClick={fetchVendorStats}
//     >
//         Refetch Data
//     </Button>
// </Flex>

//                     </VStack>
//                 )}
//             </Box>
//         </Flex>
//     );
// };

// export default ManagePercentagePage;








import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, Heading, Button, useToast, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td,
  useColorModeValue, VStack, InputGroup, InputLeftElement, Input, Text, IconButton,
  Drawer, DrawerOverlay, DrawerContent ,useDisclosure
} from '@chakra-ui/react';
import { SearchIcon, HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import AdminNavBar from '../../components/layout/AdminNavBar';

const ADMIN_SIDEBAR_W = '80px';

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) amount = 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const downloadCSV = (data) => {
  if (!data || data.length === 0) return;
  const headers = ["Vendor Name", "User ID", "Total Referrals", "Total Spent by Referrals (INR)", "Commission %"];
  const rows = data.map((vendor) => [
    `"${vendor.name}"`, `"${vendor.user_id}"`, vendor.total_referrals, vendor.total_spent_by_referrals,
    vendor.current_percentage !== null ? `${vendor.current_percentage}%` : 'Not Set'
  ]);
  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", "vendor_referrals.csv"); link.click();
};

const ManagePercentagePage = ({ url }) => {
  const { token } = useAuth();
  const toast = useToast();
  const [vendorsData, setVendorsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(null);
  const [editingCell, setEditingCell] = useState({ userId: null, value: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const drawer = useDisclosure();

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.700');
  const searchInputBg = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('gray.800', 'gray.200');

  const fetchVendorStats = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${url}/api/admin/wallets-with-percentages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch vendor data.');
      }
      const data = await response.json();
      const sortedData = data.sort((a, b) => b.total_referrals - a.total_referrals);
      setVendorsData(sortedData);
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error' });
    } finally { setIsLoading(false); }
  }, [token, url, toast]);

  useEffect(()=> { if (token) fetchVendorStats(); }, [token, fetchVendorStats]);

  const handleEditClick = (userId, currentPercentage) => { setEditingCell({ userId, value: currentPercentage !== null ? String(currentPercentage) : '' }); };
  const handleCancelEdit = () => { setEditingCell({ userId: null, value: '' }); };
  const handleInputChange = (e) => { setEditingCell(prev => ({ ...prev, value: e.target.value })); };

  const handleSave = async (userId) => {
    setIsSaving(userId);
    const newPercentage = editingCell.value;
    if (newPercentage === undefined || String(newPercentage).trim() === '') {
      toast({ title: 'Invalid Input', description: 'Percentage cannot be empty.', status: 'warning' });
      setIsSaving(null); return;
    }
    try {
      const response = await fetch(`${url}/api/admin/update-percentage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, newPercentage: parseFloat(newPercentage) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast({ title: 'Success', description: data.message, status: 'success' });
      handleCancelEdit();
      await fetchVendorStats();
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error' });
    } finally { setIsSaving(null); }
  };

  const filteredVendors = vendorsData.filter(vendor =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Flex minH="100vh" bg={pageBg}>
      {/* Desktop sidebar */}
      <AdminNavBar variant="static" onOpen={drawer.onOpen} />
      {/* Mobile drawer */}
      <Drawer isOpen={drawer.isOpen} placement="left" onClose={drawer.onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <AdminNavBar variant="drawer" onClose={drawer.onClose} />
        </DrawerContent>
      </Drawer>

      <Box flex="1" ml={{ base: 0, md: ADMIN_SIDEBAR_W }} p={{ base: 4, sm: 6, md: 8 }} bg={useColorModeValue('gray.100', 'gray.800')}>
        {/* Mobile header */}
        <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
          <IconButton aria-label="Open menu" icon={<HamburgerIcon w={5} h={5} />} onClick={drawer.onOpen} size="sm" variant="ghost" />
          <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">Vendor Referral Management</Heading>
        </Flex>

        <Heading as="h1" size="lg" mb={6} display={{ base: 'none', md: 'block' }}>
          Vendor Referral Management
        </Heading>

        {isLoading ? (
          <Center h="200px"><Spinner size="xl" /></Center>
        ) : (
          <VStack spacing={6} align="stretch">
            <Box bg={cardBg} p={5} borderRadius="lg" shadow="md">
              <InputGroup mb={4} maxW="400px">
                <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" /></InputLeftElement>
                <Input
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg={searchInputBg}
                />
              </InputGroup>

              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Vendor</Th>
                    <Th isNumeric>Total Referrals</Th>
                    <Th isNumeric>Total Spent by Referrals</Th>
                    <Th isNumeric>Commission %</Th>
                    <Th textAlign="center">Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredVendors.map((vendor) => (
                    <Tr key={vendor.user_id}>
                      <Td>
                        <Text fontWeight="bold">{vendor.name}</Text>
                        <Text fontSize="xs" color="gray.500">{vendor.user_id}</Text>
                      </Td>
                      <Td isNumeric fontWeight="bold">{vendor.total_referrals}</Td>
                      <Td isNumeric color="green.300">{formatCurrency(vendor.total_spent_by_referrals)}</Td>
                      <Td isNumeric>
                        {editingCell.userId === vendor.user_id ? (
                          <Input
                            type="number"
                            size="sm"
                            w="80px"
                            value={editingCell.value}
                            onChange={handleInputChange}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSave(vendor.user_id)}
                          />
                        ) : (
                          <Text fontWeight="bold">
                            {vendor.current_percentage !== null ? `${vendor.current_percentage}%` : 'Not Set'}
                          </Text>
                        )}
                      </Td>
                      <Td textAlign="center">
                        {editingCell.userId === vendor.user_id ? (
                          <Flex justify="center" gap={2}>
                            <Button size="sm" colorScheme="green" isLoading={isSaving === vendor.user_id} onClick={() => handleSave(vendor.user_id)}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                          </Flex>
                        ) : (
                          <Button size="sm" onClick={() => handleEditClick(vendor.user_id, vendor.current_percentage)}>Edit</Button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>

            <Flex justify="flex-end" gap={4}>
              <Button colorScheme="teal" onClick={() => downloadCSV(filteredVendors)}>Download CSV</Button>
              <Button colorScheme="blue" isLoading={isLoading} onClick={fetchVendorStats}>Refetch Data</Button>
            </Flex>
          </VStack>
        )}
      </Box>
    </Flex>
  );
};

export default ManagePercentagePage;
