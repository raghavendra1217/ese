// // import React, { useEffect, useState } from 'react';
// // import {
// //   Box, Heading, Text, Spinner, VStack, HStack, Avatar, Tag,
// //   Stat, StatLabel, StatNumber, Table, Thead, Tr, Th, Td, Tbody, TableContainer,
// //   useColorModeValue, Badge, Button
// // } from '@chakra-ui/react';
// // import { useParams, Link as RouterLink } from 'react-router-dom';
// // import { useAuth } from '../../AppContext';

// // const ManageProfile = ({ url }) => {
// //   const { id } = useParams();
// //   const [profile, setProfile] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const borderColor = useColorModeValue('gray.200', 'gray.600');
// //   const { token } = useAuth();


// //   useEffect(() => {
// //     const fetchProfile = async () => {
// //       try {
// //         const res = await fetch(`${url}/api/admin/vendor-profile/${id}`, {
// //         headers: {
// //           'Content-Type': 'application/json',
// //           'Authorization': `Bearer ${token}`, // <-- important!
// //         },
// //       });

// //         if (!res.ok) {
// //           throw new Error(`HTTP error! status: ${res.status}`);
// //         }

// //         const contentType = res.headers.get("content-type");
// //         if (!contentType || !contentType.includes("application/json")) {
// //           throw new Error("Invalid content-type: expected application/json");
// //         }

// //         const data = await res.json();
// //         setProfile(data);
// //       } catch (err) {
// //         console.error('Failed to load profile:', err);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchProfile();
// //   }, [id, url,token]);

// //   if (loading) {
// //     return <Box p={10}><Spinner size="xl" /></Box>;
// //   }

// //   if (!profile) {
// //     return <Box p={10}><Text color="red.500">Profile not found or an error occurred.</Text></Box>;
// //   }

// //   const { vendor, wallet, trades, transactions, referrals } = profile;

// //   return (
// //     <Box p={{ base: 4, md: 8 }}>
// //       <Button
// //         as={RouterLink}
// //         to="/admin/all-vendors"
// //         mb={4}
// //         colorScheme="blue"
// //         variant="outline"
// //       >
// //         ← Back to All Vendors
// //       </Button>

// //       <Heading size="lg" mb={4}>Manage Vendor Profile</Heading>

// //       {/* Section 1: Vendor Info */}
// //       <Box borderWidth="1px" borderRadius="lg" p={5} mb={6}>
// //         <HStack spacing={6}>
// //           <Avatar src={`${url}${vendor.passport_photo_url}`} size="lg" />
// //           <VStack align="start" spacing={1}>
// //             <Text fontSize="xl" fontWeight="bold">{vendor.vendor_name}</Text>
// //             <Text>Email: {vendor.email}</Text>
// //             <Text>Phone: {vendor.phone_number}</Text>
// //             <Text>Aadhar: {vendor.aadhar_number}</Text>
// //             <Text>PAN: {vendor.pan_card_number}</Text>
// //             <Text>Bank: {vendor.bank_name} ({vendor.account_number})</Text>
// //             <Text>IFSC: {vendor.ifsc_code}</Text>
// //           </VStack>
// //         </HStack>
// //       </Box>

// //       {/* Section 2: Wallet Info */}
// //       <Box borderWidth="1px" borderRadius="lg" p={5} mb={6}>
// //         <Heading size="md" mb={3}>Wallet Overview</Heading>
// //         <HStack spacing={10}>
// //           <Stat>
// //             <StatLabel>Wallet Balance</StatLabel>
// //             <StatNumber>₹ {wallet.digital_money?.toFixed(2)}</StatNumber>
// //           </Stat>
// //           <Stat>
// //             <StatLabel>Referral Percentage</StatLabel>
// //             <StatNumber>{wallet.percentage}%</StatNumber>
// //           </Stat>
// //           <Stat>
// //             <StatLabel>Last Updated</StatLabel>
// //             <StatNumber fontSize="md">{new Date(wallet.last_updated_on).toLocaleDateString()}</StatNumber>
// //           </Stat>
// //         </HStack>
// //       </Box>

// //       {/* Section 3: Transactions */}
// //       <Box borderWidth="1px" borderRadius="lg" p={5} mb={6}>
// //         <Heading size="md" mb={3}>Transactions</Heading>
// //         <TableContainer>
// //           <Table size="sm">
// //             <Thead>
// //               <Tr>
// //                 <Th>Date</Th>
// //                 <Th>Type</Th>
// //                 <Th>Status</Th>
// //                 <Th>Amount</Th>
// //               </Tr>
// //             </Thead>
// //             <Tbody>
// //               {transactions.map((tx) => (
// //                 <Tr key={tx.trans_id}>
// //                   <Td>{new Date(tx.created_at).toLocaleString()}</Td>
// //                   <Td><Tag colorScheme="blue">{tx.transaction_type}</Tag></Td>
// //                   <Td>
// //                     <Badge colorScheme={
// //                       tx.status === 'approved' ? 'green' :
// //                       tx.status === 'rejected' ? 'red' : 'orange'
// //                     }>
// //                       {tx.status}
// //                     </Badge>
// //                   </Td>
// //                   <Td>₹ {tx.amount.toFixed(2)}</Td>
// //                 </Tr>
// //               ))}
// //             </Tbody>
// //           </Table>
// //         </TableContainer>
// //       </Box>

// //       {/* Section 4: Trades */}
// //       <Box borderWidth="1px" borderRadius="lg" p={5} mb={6}>
// //         <Heading size="md" mb={3}>Trade History</Heading>
// //         <TableContainer>
// //           <Table size="sm">
// //             <Thead>
// //               <Tr>
// //                 <Th>Date</Th>
// //                 <Th>Product</Th>
// //                 <Th>Stock</Th>
// //                 <Th>Total Paid</Th>
// //                 <Th>Status</Th>
// //               </Tr>
// //             </Thead>
// //             <Tbody>
// //               {trades.map((trade) => (
// //                 <Tr key={trade.trade_id}>
// //                   <Td>{new Date(trade.date).toLocaleString()}</Td>
// //                   <Td>{trade.paper_type}</Td>
// //                   <Td>{trade.no_of_stock_bought}</Td>
// //                   <Td>₹ {trade.total_amount_paid.toFixed(2)}</Td>
// //                   <Td>
// //                     <Tag colorScheme={
// //                       trade.is_approved === 'approved' ? 'green' :
// //                       trade.is_approved === 'rejected' ? 'red' : 'gray'
// //                     }>
// //                       {trade.is_approved}
// //                     </Tag>
// //                   </Td>
// //                 </Tr>
// //               ))}
// //             </Tbody>
// //           </Table>
// //         </TableContainer>
// //       </Box>

// //       {/* Section 5: Referrals */}
// //       <Box borderWidth="1px" borderRadius="lg" p={5}>
// //         <Heading size="md" mb={3}>Referrals</Heading>
// //         {referrals.length === 0 ? (
// //           <Text>No referrals found.</Text>
// //         ) : (
// //           <VStack align="start" spacing={3}>
// //             {referrals.map(ref => (
// //               <Box key={ref.id} p={3} borderWidth="1px" borderRadius="md" w="100%">
// //                 <Text fontWeight="bold">{ref.vendor_name} ({ref.email})</Text>
// //                 <Text>Status: <Badge colorScheme={ref.is_approved ? 'green' : 'red'}>
// //                   {ref.is_approved ? 'Approved' : 'Not Approved'}
// //                 </Badge></Text>
// //                 <Text>Total Spent: ₹ {ref.total_spent.toFixed(2)}</Text>
// //               </Box>
// //             ))}
// //           </VStack>
// //         )}
// //       </Box>
// //     </Box>
// //   );
// // };

// // export default ManageProfile;




// import React, { useEffect, useState } from 'react';
// import {
//   Box,
//   Heading,
//   Text,
//   Spinner,
//   VStack,
//   HStack,
//   Avatar,
//   Tag,
//   Stat,
//   StatLabel,
//   StatNumber,
//   Table,
//   Thead,
//   Tr,
//   Th,
//   Td,
//   Tbody,
//   TableContainer,
//   useColorModeValue,
//   Badge,
//   Button,
// } from '@chakra-ui/react';
// import { useParams, Link as RouterLink } from 'react-router-dom';
// import { useAuth } from '../../AppContext';

// const ManageProfile = ({ url }) => {
//   const { id } = useParams();
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const borderColor = useColorModeValue('gray.200', 'gray.600');
//   const { token } = useAuth();

//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         const res = await fetch(`${url}/api/admin/vendor-profile/${id}`, {
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${token}`, // <-- important!
//           },
//         });

//         if (!res.ok) {
//           throw new Error(`HTTP error! status: ${res.status}`);
//         }

//         const contentType = res.headers.get('content-type');
//         if (!contentType || !contentType.includes('application/json')) {
//           throw new Error('Invalid content-type: expected application/json');
//         }

//         const data = await res.json();
//         setProfile(data);
//       } catch (err) {
//         console.error('Failed to load profile:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProfile();
//   }, [id, url, token]);

//   if (loading) {
//     return (
//       <Box p={10}>
//         <Spinner size="xl" />
//       </Box>
//     );
//   }

//   if (!profile) {
//     return (
//       <Box p={10}>
//         <Text color="red.500">Profile not found or an error occurred.</Text>
//       </Box>
//     );
//   }

//   const { vendor, wallet, trades, transactions, referrals } = profile;

//   return (
//     <Box p={{ base: 4, md: 8 }}>
//       <Button as={RouterLink} to="/admin/all-vendors" mb={4} colorScheme="blue" variant="outline">
//         ← Back to All Vendors
//       </Button>

//       <Heading size="lg" mb={4}>
//         Manage Vendor Profile
//       </Heading>

//       {/* Section 1: Vendor Info */}
//       <Box borderWidth="1px" borderRadius="lg" p={5} mb={6} borderColor={borderColor}>
//         <HStack spacing={6} align="start">
//           {/* Use the absolute URL directly, don't prepend base URL */}
//           <Avatar src={vendor.passport_photo_url} size="lg" />
//           <VStack align="start" spacing={1}>
//             <Text fontSize="xl" fontWeight="bold">
//               {vendor.vendor_name}
//             </Text>
//             <Text>Email: {vendor.email}</Text>
//             <Text>Phone: {vendor.phone_number || '—'}</Text>
//             <Text>Aadhar: {vendor.aadhar_number || '—'}</Text>
//             <Text>PAN: {vendor.pan_card_number || '—'}</Text>
//             <Text>
//               Bank: {vendor.bank_name || '—'} {vendor.account_number ? `(${vendor.account_number})` : ''}
//             </Text>
//             <Text>IFSC: {vendor.ifsc_code || '—'}</Text>
//             {vendor.address && <Text>Address: {vendor.address}</Text>}
//           </VStack>
//         </HStack>
//       </Box>

//       {/* Section 2: Wallet Info */}
//       <Box borderWidth="1px" borderRadius="lg" p={5} mb={6} borderColor={borderColor}>
//         <Heading size="md" mb={3}>
//           Wallet Overview
//         </Heading>
//         <HStack spacing={10} wrap="wrap">
//           <Stat>
//             <StatLabel>Wallet Balance</StatLabel>
//             <StatNumber>₹ {(wallet?.digital_money ?? 0).toFixed(2)}</StatNumber>
//           </Stat>
//           <Stat>
//             <StatLabel>Referral Percentage</StatLabel>
//             <StatNumber>{wallet?.percentage ?? '—'}%</StatNumber>
//           </Stat>
//           <Stat>
//             <StatLabel>Last Updated</StatLabel>
//             <StatNumber fontSize="md">
//               {wallet?.last_updated_on ? new Date(wallet.last_updated_on).toLocaleDateString() : '—'}
//             </StatNumber>
//           </Stat>
//         </HStack>
//       </Box>

//       {/* Section 3: Transactions */}
//       <Box borderWidth="1px" borderRadius="lg" p={5} mb={6} borderColor={borderColor}>
//         <Heading size="md" mb={3}>
//           Transactions
//         </Heading>
//         <TableContainer>
//           <Table size="sm">
//             <Thead>
//               <Tr>
//                 <Th>Date</Th>
//                 <Th>Type</Th>
//                 <Th>Status</Th>
//                 <Th isNumeric>Amount</Th>
//               </Tr>
//             </Thead>
//             <Tbody>
//               {(transactions || []).map((tx) => (
//                 <Tr key={tx.trans_id}>
//                   <Td>{formatISTDate(tx.created_at, true, true)}</Td>
//                   <Td>
//                     <Tag colorScheme="blue">{tx.transaction_type}</Tag>
//                   </Td>
//                   <Td>
//                     <Badge
//                       colorScheme={
//                         tx.status === 'approved' ? 'green' : tx.status === 'rejected' ? 'red' : 'orange'
//                       }
//                     >
//                       {tx.status}
//                     </Badge>
//                   </Td>
//                   <Td isNumeric>₹ {Number(tx.amount).toFixed(2)}</Td>
//                 </Tr>
//               ))}
//             </Tbody>
//           </Table>
//         </TableContainer>
//       </Box>

//       {/* Section 4: Trades */}
//       <Box borderWidth="1px" borderRadius="lg" p={5} mb={6} borderColor={borderColor}>
//         <Heading size="md" mb={3}>
//           Trade History
//         </Heading>
//         <TableContainer>
//           <Table size="sm">
//             <Thead>
//               <Tr>
//                 <Th>Date</Th>
//                 <Th>Product</Th>
//                 <Th isNumeric>Stock</Th>
//                 <Th isNumeric>Total Paid</Th>
//                 <Th>Status</Th>
//               </Tr>
//             </Thead>
//             <Tbody>
//                                 {(trades || []).map((trade) => (
//                 <Tr key={trade.trade_id}>
//                   <Td>{trade.date ? formatISTDate(trade.date, true, true) : '—'}</Td>
//                   <Td>{trade.paper_type}</Td>
//                   <Td isNumeric>{trade.no_of_stock_bought}</Td>
//                   <Td isNumeric>₹ {Number(trade.total_amount_paid).toFixed(2)}</Td>
//                   <Td>
//                     <Tag
//                       colorScheme={
//                         trade.is_approved === 'approved'
//                           ? 'green'
//                           : trade.is_approved === 'rejected'
//                           ? 'red'
//                           : 'gray'
//                       }
//                     >
//                       {trade.is_approved}
//                     </Tag>
//                   </Td>
//                 </Tr>
//               ))}
//             </Tbody>
//           </Table>
//         </TableContainer>
//       </Box>

//       {/* Section 5: Referrals */}
//       <Box borderWidth="1px" borderRadius="lg" p={5} borderColor={borderColor}>
//         <Heading size="md" mb={3}>
//           Referrals
//         </Heading>
//         {!referrals || referrals.length === 0 ? (
//           <Text>No referrals found.</Text>
//         ) : (
//           <VStack align="start" spacing={3}>
//             {referrals.map((ref) => (
//               <Box key={ref.id} p={3} borderWidth="1px" borderRadius="md" w="100%" borderColor={borderColor}>
//                 <Text fontWeight="bold">
//                   {ref.vendor_name} ({ref.email})
//                 </Text>
//                 <Text>
//                   Status:{' '}
//                   <Badge colorScheme={ref.is_approved ? 'green' : 'red'}>
//                     {ref.is_approved ? 'Approved' : 'Not Approved'}
//                   </Badge>
//                 </Text>
//                 <Text>Total Spent: ₹ {Number(ref.total_spent || 0).toFixed(2)}</Text>
//               </Box>
//             ))}
//           </VStack>
//         )}
//       </Box>
//     </Box>
//   );
// };

// export default ManageProfile;







// src/pages/admin/ManageProfile.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Spinner,
  VStack,
  HStack,
  Avatar,
  Tag,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Thead,
  Tr,
  Th,
  Td,
  Tbody,
  TableContainer,
  useColorModeValue,
  Badge,
  Button,
  Flex,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  IconButton,
  Center,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useDisclosure } from '@chakra-ui/hooks';
import { useAuth } from '../../AppContext';
import AdminNavBar from '../../components/layout/AdminNavBar';
import AdminReferralTree from '../../components/admin/AdminReferralTree';
import { formatISTDate } from '../../utils/dateUtils';

const ADMIN_SIDEBAR_W = '80px';

const ManageProfile = ({ url }) => {
  const { id } = useParams();
  const { token } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');

  document.title = "NAVIU | Manage Vendor";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${url}/api/admin/vendor-profile/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid content-type: expected application/json');
        }

        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchProfile();
  }, [id, url, token]);

  if (loading) {
    return (
      <Flex minH="100vh" bg={pageBg}>
        {/* Desktop sidebar */}
        <AdminNavBar variant="static" />
        <Box flex="1" ml={{ base: 0, md: ADMIN_SIDEBAR_W }} p={{ base: 4, sm: 6, md: 8 }}>
          <Center h="60vh">
            <Spinner size="xl" />
          </Center>
        </Box>
      </Flex>
    );
  }

  if (!profile) {
    return (
      <Flex minH="100vh" bg={pageBg}>
        {/* Desktop sidebar */}
        <AdminNavBar variant="static" />
        <Box flex="1" ml={{ base: 0, md: ADMIN_SIDEBAR_W }} p={{ base: 4, sm: 6, md: 8 }}>
          {/* Mobile header */}
          <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
            <IconButton
              aria-label="Open menu"
              icon={<HamburgerIcon w={5} h={5} />}
              onClick={onOpen}
              size="sm"
              variant="ghost"
            />
            <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">
              Manage Vendor Profile
            </Heading>
          </Flex>

          <Text color="red.500">Profile not found or an error occurred.</Text>

          {/* Mobile Drawer */}
          <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
            <DrawerOverlay />
            <DrawerContent>
              <AdminNavBar variant="drawer" onClose={onClose} />
            </DrawerContent>
          </Drawer>
        </Box>
      </Flex>
    );
  }

  const { vendor, wallet, trades, transactions, referrals } = profile;

  return (
    <Flex minH="100vh" bg={pageBg}>
      {/* Desktop sidebar (md and up) */}
      <AdminNavBar variant="static" onOpen={onOpen} />

      {/* Mobile drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <AdminNavBar variant="drawer" onClose={onClose} />
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <Box flex="1" ml={{ base: 0, md: ADMIN_SIDEBAR_W }} p={{ base: 4, sm: 6, md: 8 }}>
        {/* Mobile header */}
        <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon w={5} h={5} />}
            onClick={onOpen}
            size="sm"
            variant="ghost"
          />
          <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">
            Manage Vendor Profile
          </Heading>
        </Flex>

        <VStack spacing={{ base: 4, md: 8 }} align="stretch">
          <Button
            as={RouterLink}
            to="/admin/all-vendors"
            alignSelf="flex-start"
            colorScheme="blue"
            variant="outline"
          >
            ← Back to All Vendors
          </Button>

          {/* Vendor Info */}
          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
            <HStack spacing={6} align="start">
              <Avatar src={vendor.passport_photo_url} size="lg" />
              <VStack align="start" spacing={1}>
                <Text fontSize="xl" fontWeight="bold">
                  {vendor.vendor_name}
                </Text>
                <Text>Email: {vendor.email}</Text>
                <Text>Phone: {vendor.phone_number || '—'}</Text>
                <Text>Aadhar: {vendor.aadhar_number || '—'}</Text>
                <Text>PAN: {vendor.pan_card_number || '—'}</Text>
                <Text>
                  Bank: {vendor.bank_name || '—'}{' '}
                  {vendor.account_number ? `(${vendor.account_number})` : ''}
                </Text>
                <Text>IFSC: {vendor.ifsc_code || '—'}</Text>
                {vendor.address && <Text>Address: {vendor.address}</Text>}
              </VStack>
            </HStack>
          </Box>

          {/* Wallet Overview */}
          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
            <Heading size="md" mb={3}>
              Wallet Overview
            </Heading>
            <HStack spacing={10} wrap="wrap">
              <Stat>
                <StatLabel>Wallet Balance</StatLabel>
                <StatNumber>₹ {(wallet?.digital_money ?? 0).toFixed(2)}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Referral Percentage</StatLabel>
                <StatNumber>{wallet?.percentage ?? '—'}%</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Last Updated</StatLabel>
                <StatNumber fontSize="md">
                  {wallet?.last_updated_on
                    ? new Date(wallet.last_updated_on).toLocaleDateString()
                    : '—'}
                </StatNumber>
              </Stat>
            </HStack>
          </Box>

          {/* Transactions */}
          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
            <Heading size="md" mb={3}>
              Transactions
            </Heading>
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Type</Th>
                    <Th>Status</Th>
                    <Th isNumeric>Amount</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {(transactions || []).map((tx) => (
                    <Tr key={tx.trans_id}>
                      <Td>{formatISTDate(tx.created_at, true, true)}</Td>
                      <Td>
                        <Tag colorScheme="blue">{tx.transaction_type}</Tag>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={
                            tx.status === 'approved'
                              ? 'green'
                              : tx.status === 'rejected'
                              ? 'red'
                              : 'orange'
                          }
                        >
                          {tx.status}
                        </Badge>
                      </Td>
                      <Td isNumeric>₹ {Number(tx.amount).toFixed(2)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>

          {/* Trades */}
          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
            <Heading size="md" mb={3}>
              Trade History
            </Heading>
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Product</Th>
                    <Th isNumeric>Stock</Th>
                    <Th isNumeric>Total Paid</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {(trades || []).map((trade) => (
                    <Tr key={trade.trade_id}>
                      <Td>{trade.date ? formatISTDate(trade.date, true, true) : '—'}</Td>
                      <Td>{trade.paper_type}</Td>
                      <Td isNumeric>{trade.no_of_stock_bought}</Td>
                      <Td isNumeric>₹ {Number(trade.total_amount_paid).toFixed(2)}</Td>
                      <Td>
                        <Tag
                          colorScheme={
                            trade.is_approved === 'approved'
                              ? 'green'
                              : trade.is_approved === 'rejected'
                              ? 'red'
                              : 'gray'
                          }
                        >
                          {trade.is_approved}
                        </Tag>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>

          {/* Referrals */}
          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
            <Heading size="md" mb={3}>
              Referrals
            </Heading>
            {!referrals || referrals.length === 0 ? (
              <Text>No referrals found.</Text>
            ) : (
              <VStack align="start" spacing={3}>
                {referrals.map((ref) => (
                  <Box
                    key={ref.id}
                    p={3}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    w="100%"
                  >
                    <Text fontWeight="bold">
                      {ref.vendor_name} ({ref.email})
                    </Text>
                    <Text>
                      Status:{' '}
                      <Badge colorScheme={ref.is_approved ? 'green' : 'red'}>
                        {ref.is_approved ? 'Approved' : 'Not Approved'}
                      </Badge>
                    </Text>
                    <Text>Total Spent: ₹ {Number(ref.total_spent || 0).toFixed(2)}</Text>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>

          {/* Referral Tree */}
          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
            <Heading size="md" mb={3}>
              Referral Tree
            </Heading>
            <Text fontSize="sm" color="gray.500" mb={3}>
              Vendor ID: {id}
            </Text>
            <AdminReferralTree url={url} vendorId={id} />
          </Box>
        </VStack>
      </Box>
    </Flex>
  );
};

export default ManageProfile;
