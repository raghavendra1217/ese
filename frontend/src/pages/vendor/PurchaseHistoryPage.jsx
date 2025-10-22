// // import React, { useEffect, useState, useCallback, useMemo } from 'react';
// // import {
// //     Box, VStack, Heading, Text, Spinner, Alert, AlertIcon,
// //     Container, Image, Badge, Flex, Divider, Input,
// //     useColorModeValue, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
// //     Center,
// //     HStack,
// //     // ✅ --- NEW IMPORTS FOR LAYOUT ---
// //     IconButton,
// //     useDisclosure,
// // import { formatISTDate } from '../../utils/dateUtils';
// //     Drawer,
// //     DrawerOverlay,
// //     DrawerContent,
// //     DrawerBody,
// // } from '@chakra-ui/react';
// // import { HamburgerIcon } from '@chakra-ui/icons';
// // import { useAuth } from '../../AppContext';

// // // ✅ --- NEW COMPONENT IMPORT ---
// // import VendorNavBar from '../../components/layout/VendorNavBar';

// // // ✅ --- NEW LAYOUT CONSTANTS ---
// // const DESKTOP_SIDEBAR_WIDTH = '200px';
// // const MOBILE_SIDEBAR_WIDTH = '60px';


// // const PurchaseHistoryPage = ({ url }) => {
// //     const { token } = useAuth();
// //     const { isOpen, onOpen, onClose } = useDisclosure(); // ✅ Hook for mobile drawer

// //     // This state now holds the original, complete list from the API
// //     const [allPurchases, setAllPurchases] = useState([]);
// //     const [loading, setLoading] = useState(true);
// //     const [error, setError] = useState('');
    
// //     const [searchTerm, setSearchTerm] = useState('');
    
// //     // --- Styling ---
// //     const pageBg = useColorModeValue('gray.50', '#181C27');
// //     const sidebarBg = '#212734';
// //     const sidebarBorder = 'gray.700';
// //     const cardBg = useColorModeValue('white', 'gray.800');
// //     const textColor = useColorModeValue('gray.600', 'gray.400');
// //     const borderColor = useColorModeValue('gray.200', 'gray.700');

// //     // --- Data Fetching & Logic (No Changes) ---
// //     const fetchHistory = useCallback(async () => {
// //         if (!token) {
// //             setError("Authentication token not found. Please log in.");
// //             setLoading(false);
// //             return;
// //         }
// //         setLoading(true);
// //         setError('');
        
// //         try {
// //             const response = await fetch(`${url}/api/trading/history`, {
// //                 headers: { 'Authorization': `Bearer ${token}` }
// //             });
// //             if (!response.ok) {
// //                 throw new Error('Failed to fetch your purchase history.');
// //             }
// //             const data = await response.json();
// //             setAllPurchases(data);
// //         } catch (err) {
// //             setError(err.message);
// //         } finally {
// //             setLoading(false);
// //         }
// //     }, [token, url]);

// //     useEffect(() => {
// //         fetchHistory();
// //     }, [fetchHistory]);

// //     const filteredPurchases = useMemo(() => {
// //         if (!searchTerm.trim()) {
// //             return allPurchases;
// //         }
// //         const lowercasedFilter = searchTerm.toLowerCase();
// //         return allPurchases.filter(p => 
// //             p.paper_type?.toLowerCase().includes(lowercasedFilter) ||
// //             p.no_of_stock_bought?.toString().includes(lowercasedFilter) ||
// //             p.total_amount_paid?.toString().includes(lowercasedFilter) ||
// //             p.is_approved?.toLowerCase().includes(lowercasedFilter) ||
// //             (p.comment && p.comment.toLowerCase().includes(lowercasedFilter)) ||
// //             new Date(p.date).toLocaleString().toLowerCase().includes(lowercasedFilter)
// //         );
// //     }, [allPurchases, searchTerm]);

// //     const getStatusInfo = (status) => {
// //         switch (status) {
// //             case 'approved': return { color: 'green', text: 'Approved' };
// //             case 'rejected': return { color: 'red', text: 'Rejected' };
// //             default: return { color: 'yellow', text: 'Pending' };
// //         }
// //     };

// //     if (error) {
// //         return <Container centerContent py={20}><Alert status="error"><AlertIcon />{error}</Alert></Container>;
// //     }

// //     return (
// //         // ✅ --- NEW LAYOUT WRAPPER ---
// //         <Flex minH="100vh" bg={pageBg}>
// //             {/* --- Desktop Sidebar (Fixed) --- */}
// //             <Box as="nav" pos="fixed" top="0" left="0" zIndex="sticky" h="full" w={DESKTOP_SIDEBAR_WIDTH} bg={sidebarBg} borderRight="1px" borderColor={sidebarBorder} display={{ base: 'none', md: 'block' }}>
// //                 <VendorNavBar />
// //             </Box>

// //             {/* --- Mobile: Thin Sidebar with Hamburger Icon --- */}
// //             <Box as="nav" pos="fixed" top="0" left="0" zIndex="docked" h="full" w={MOBILE_SIDEBAR_WIDTH} bg={sidebarBg} borderRight="1px" borderColor={sidebarBorder} display={{ base: 'flex', md: 'none' }} flexDirection="column" alignItems="center" pt={4}>
// //                 <IconButton aria-label="Open menu" icon={<HamburgerIcon w={6} h={6} />} onClick={onOpen} variant="ghost" color="gray.400" _hover={{ bg: 'rgba(66, 153, 225, 0.1)', color: 'white' }} />
// //             </Box>

// //             {/* --- Mobile: Drawer for Full Navigation --- */}
// //             <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
// //                 <DrawerOverlay />
// //                 <DrawerContent bg={sidebarBg} w={DESKTOP_SIDEBAR_WIDTH}>
// //                     <DrawerBody p={0}>
// //                         <VendorNavBar onLinkClick={onClose} />
// //                     </DrawerBody>
// //                 </DrawerContent>
// //             </Drawer>

// //             {/* ✅ --- NEW MAIN CONTENT AREA --- */}
// //             <Box flex="1" ml={{ base: MOBILE_SIDEBAR_WIDTH, md: DESKTOP_SIDEBAR_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
// //                 {/* Your original page content now goes inside this Box */}
// //                 <Box 
// //                     bg={cardBg} 
// //                     p={{ base: 4, md: 6 }} 
// //                     borderRadius="lg" 
// //                     boxShadow="lg"
// //                     w={{ base: '100%', lg: '80%' }}
// //                     mx="auto"
// //                 >
// //                     <VStack spacing={6} align="stretch">
// //                         <Heading as="h1" size="xl">My Transaction Log</Heading>
                        
// //                         <Box>
// //                             <Input 
// //                                 placeholder="Search by product, status, amount, date..."
// //                                 value={searchTerm}
// //                                 onChange={(e) => setSearchTerm(e.target.value)}
// //                             />
// //                         </Box>
                        
// //                         <Divider />

// //                         {loading ? (
// //                             <Center p={20}><Spinner size="xl" /></Center>
// //                         ) : filteredPurchases.length === 0 ? (
// //                             <Alert status="info" borderRadius="md">
// //                                 <AlertIcon />
// //                                 {searchTerm ? 'No purchases match your search.' : 'You have no purchase history.'}
// //                             </Alert>
// //                         ) : (
// //                             <>
// //                                 {/* The table now maps over `filteredPurchases` */}
// //                                 <TableContainer display={{ base: 'none', md: 'block' }}>
// //                                     <Table variant="simple">
// //                                         <Thead>
// //                                             <Tr>
// //                                                 <Th>Product</Th>
// //                                                 <Th>Details</Th>
// //                                                 <Th isNumeric>Total Paid</Th>
// //                                                 <Th>Status</Th>
// //                                             </Tr>
// //                                         </Thead>
// //                                         <Tbody>
// //                                             {filteredPurchases.map(p => {
// //                                                 const status = getStatusInfo(p.is_approved);
// //                                                 return (
// //                                                     <Tr key={p.trade_id}>
// //                                                         <Td>
// //                                                             <HStack>
// //                                                                 <Image src={p.product_image_url} boxSize="50px" borderRadius="md" fallbackSrc='https://via.placeholder.com/50' />
// //                                                                 <Text fontWeight="bold">{p.paper_type}</Text>
// //                                                             </HStack>
// //                                                         </Td>
// //                                                         <Td>
// //                                                             <Text>Qty: <strong>{p.no_of_stock_bought}</strong></Text>
// //                                                             <Text fontSize="sm" color={textColor}>On: {new Date(p.date).toLocaleDateString()}</Text>
// //                                                         </Td>
// //                                                         <Td isNumeric fontWeight="bold">₹{parseFloat(p.total_amount_paid).toFixed(2)}</Td>
// //                                                         <Td><Badge colorScheme={status.color}>{status.text}</Badge></Td>
// //                                                     </Tr>
// //                                                 );
// //                                             })}
// //                                         </Tbody>
// //                                     </Table>
// //                                 </TableContainer>

// //                                 {/* The mobile view also maps over `filteredPurchases` */}
// //                                 <VStack spacing={4} align="stretch" display={{ base: 'flex', md: 'none' }}>
// //                                     {filteredPurchases.map(p => {
// //                                         const status = getStatusInfo(p.is_approved);
// //                                         return (
// //                                             <Box key={p.trade_id} p={4} borderWidth="1px" borderColor={borderColor} borderRadius="lg">
// //                                                 <VStack align="stretch" spacing={3}>
// //                                                     <Flex align="center" justify="space-between">
// //                                                         <HStack>
// //                                                             <Image src={p.product_image_url} boxSize="60px" borderRadius="md" fallbackSrc='https://via.placeholder.com/60' />
// //                                                             <VStack align="start" spacing={0}>
// //                                                                 <Text fontWeight="bold">{p.paper_type}</Text>
// //                                                                 <Text fontSize="xs" color={textColor}>Qty: {p.no_of_stock_bought}</Text>
// //                                                             </VStack>
// //                                                         </HStack>
// //                                                         <Badge colorScheme={status.color}>{status.text}</Badge>
// //                                                     </Flex>
                                                    
// //                                                     {p.is_approved === 'rejected' && p.comment && (
// //                                                         <Alert status='error' size='sm' borderRadius='md'>
// //                                                             <AlertIcon boxSize='16px'/>
// //                                                             <Text fontSize='xs'><strong>Admin:</strong> {p.comment}</Text>
// //                                                         </Alert>
// //                                                     )}

// //                                                     <Flex align="center" justify="space-between" pt={2} borderTop="1px" borderColor={borderColor}>
// //                                                         <Text fontSize="sm" color={textColor}>{new Date(p.date).toLocaleDateString()}</Text>
// //                                                         <Text fontWeight="bold" fontSize="lg">₹{parseFloat(p.total_amount_paid).toFixed(2)}</Text>
// //                                                     </Flex>
// //                                                 </VStack>
// //                                             </Box>
// //                                         );
// //                                     })}
// //                                 </VStack>
// //                             </>
// //                         )}
// //                     </VStack>
// //                 </Box>
// //             </Box>
// //         </Flex>
// //     );
// // };

// // export default PurchaseHistoryPage;







// import React, { useEffect, useState, useCallback, useMemo } from 'react';
// import {
//   Box, VStack, Heading, Text, Spinner, Alert, AlertIcon,
//   Container, Image, Badge, Flex, Divider, Input,
//   useColorModeValue, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
//   Center, HStack,
//   IconButton, useDisclosure, Drawer, DrawerOverlay, DrawerContent, DrawerBody,
// } from '@chakra-ui/react';
// import { HamburgerIcon } from '@chakra-ui/icons';
// import { useAuth } from '../../AppContext';
// import VendorNavBar from '../../components/layout/VendorNavBar';

// const DESKTOP_SIDEBAR_WIDTH = '200px';

// const PurchaseHistoryPage = ({ url }) => {
//   const { token } = useAuth();
//   const { isOpen, onOpen, onClose } = useDisclosure();

//   const [allPurchases, setAllPurchases] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');

//   // --- Styling ---
//   const pageBg = useColorModeValue('gray.50', '#181C27');
//   const sidebarBg = '#212734';
//   const sidebarBorder = 'gray.700';
//   const cardBg = useColorModeValue('white', 'gray.800');
//   const textColor = useColorModeValue('gray.600', 'gray.400');
//   const borderColor = useColorModeValue('gray.200', 'gray.700');
//   const headingColor = useColorModeValue('gray.700', 'gray.200');

//   // --- Data Fetching ---
//   const fetchHistory = useCallback(async () => {
//     if (!token) {
//       setError('Authentication token not found. Please log in.');
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     setError('');
//     try {
//       const response = await fetch(`${url}/api/trading/history`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!response.ok) throw new Error('Failed to fetch your purchase history.');
//       const data = await response.json();
//       setAllPurchases(data);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, [token, url]);

//   useEffect(() => { fetchHistory(); }, [fetchHistory]);

//   const filteredPurchases = useMemo(() => {
//     if (!searchTerm.trim()) return allPurchases;
//     const q = searchTerm.toLowerCase();
//     return allPurchases.filter(p =>
//       p.paper_type?.toLowerCase().includes(q) ||
//       p.no_of_stock_bought?.toString().includes(q) ||
//       p.total_amount_paid?.toString().includes(q) ||
//       p.is_approved?.toLowerCase().includes(q) ||
//       (p.comment && p.comment.toLowerCase().includes(q)) ||
//       new Date(p.date).toLocaleString().toLowerCase().includes(q)
//     );
//   }, [allPurchases, searchTerm]);

//   if (error) {
//     return (
//       <Container centerContent py={20}>
//         <Alert status="error"><AlertIcon />{error}</Alert>
//       </Container>
//     );
//   }

//   return (
//     <Flex minH="100vh" bg={pageBg}>
//       {/* Sidebar (desktop) */}
//       <Box
//         as="nav"
//         pos="fixed"
//         top="0"
//         left="0"
//         zIndex="sticky"
//         h="full"
//         w={DESKTOP_SIDEBAR_WIDTH}
//         bg={sidebarBg}
//         borderRight="1px"
//         borderColor={sidebarBorder}
//         display={{ base: 'none', md: 'block' }}
//       >
//         <VendorNavBar />
//       </Box>

//       {/* Drawer (mobile nav) */}
//       <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
//         <DrawerOverlay />
//         <DrawerContent bg={sidebarBg} w={DESKTOP_SIDEBAR_WIDTH}>
//           <DrawerBody p={0}>
//             <VendorNavBar onLinkClick={onClose} />
//           </DrawerBody>
//         </DrawerContent>
//       </Drawer>

//       {/* Main content */}
//       <Box
//         flex="1"
//         ml={{ base: 0, md: DESKTOP_SIDEBAR_WIDTH }}
//         p={{ base: 4, sm: 6, md: 8 }}
//       >
//         {/* Mobile header row: hamburger + title (same line) */}
//         <Flex display={{ base: 'flex', md: 'none' }} align="center" gap={3} mb={4}>
//           <IconButton
//             aria-label="Open menu"
//             icon={<HamburgerIcon w={6} h={6} />}
//             onClick={onOpen}
//             variant="ghost"
//             color="black"               // black on phone
//             _hover={{ bg: 'rgba(66, 153, 225, 0.1)', color: 'black' }}
//           />
//           <Heading as="h1" fontSize="lg" color={headingColor}>
//             My Transaction Log
//           </Heading>
//         </Flex>

//         {/* Card */}
//         <Box
//           bg={cardBg}
//           p={{ base: 4, md: 6 }}
//           borderRadius="lg"
//           boxShadow="lg"
//           w={{ base: '100%', lg: '80%' }}
//           mx="auto"
//         >
//           <VStack spacing={6} align="stretch">
//             {/* Desktop title inside card (hide on phone to avoid duplicate) */}
//             <Heading
//               as="h1"
//               size="xl"
//               color={headingColor}
//               display={{ base: 'none', md: 'block' }}
//             >
//               My Transaction Log
//             </Heading>

//             <Box>
//               <Input
//                 placeholder="Search by product, status, amount, date..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </Box>

//             <Divider />

//             {loading ? (
//               <Center p={20}><Spinner size="xl" /></Center>
//             ) : filteredPurchases.length === 0 ? (
//               <Alert status="info" borderRadius="md">
//                 <AlertIcon />
//                 {searchTerm ? 'No purchases match your search.' : 'You have no purchase history.'}
//               </Alert>
//             ) : (
//               <>
//                 {/* Desktop table */}
//                 <TableContainer display={{ base: 'none', md: 'block' }}>
//                   <Table variant="simple">
//                     <Thead>
//                       <Tr>
//                         <Th>Product</Th>
//                         <Th>Details</Th>
//                         <Th isNumeric>Total Paid</Th>
//                         <Th>Status</Th>
//                       </Tr>
//                     </Thead>
//                     <Tbody>
//                       {filteredPurchases.map(p => {
//                         const status = (() => {
//                           if (p.is_approved === 'approved') return { color: 'green', text: 'Approved' };
//                           if (p.is_approved === 'rejected') return { color: 'red', text: 'Rejected' };
//                           return { color: 'yellow', text: 'Pending' };
//                         })();
//                         return (
//                           <Tr key={p.trade_id}>
//                             <Td>
//                               <HStack>
//                                 <Image src={p.product_image_url} boxSize="50px" borderRadius="md" fallbackSrc="https://via.placeholder.com/50" />
//                                 <Text fontWeight="bold">{p.paper_type}</Text>
//                               </HStack>
//                             </Td>
//                             <Td>
//                               <Text>Qty: <strong>{p.no_of_stock_bought}</strong></Text>
//                               <Text fontSize="sm" color={textColor}>On: {new Date(p.date).toLocaleDateString()}</Text>
//                             </Td>
//                             <Td isNumeric fontWeight="bold">₹{parseFloat(p.total_amount_paid).toFixed(2)}</Td>
//                             <Td><Badge colorScheme={status.color}>{status.text}</Badge></Td>
//                           </Tr>
//                         );
//                       })}
//                     </Tbody>
//                   </Table>
//                 </TableContainer>

//                 {/* Mobile cards */}
//                 <VStack spacing={4} align="stretch" display={{ base: 'flex', md: 'none' }}>
//                   {filteredPurchases.map(p => {
//                     const status = (() => {
//                       if (p.is_approved === 'approved') return { color: 'green', text: 'Approved' };
//                       if (p.is_approved === 'rejected') return { color: 'red', text: 'Rejected' };
//                       return { color: 'yellow', text: 'Pending' };
//                     })();
//                     return (
//                       <Box key={p.trade_id} p={4} borderWidth="1px" borderColor={borderColor} borderRadius="lg">
//                         <VStack align="stretch" spacing={3}>
//                           <Flex align="center" justify="space-between">
//                             <HStack>
//                               <Image src={p.product_image_url} boxSize="60px" borderRadius="md" fallbackSrc="https://via.placeholder.com/60" />
//                               <VStack align="start" spacing={0}>
//                                 <Text fontWeight="bold">{p.paper_type}</Text>
//                                 <Text fontSize="xs" color={textColor}>Qty: {p.no_of_stock_bought}</Text>
//                               </VStack>
//                             </HStack>
//                             <Badge colorScheme={status.color}>{status.text}</Badge>
//                           </Flex>

//                           {p.is_approved === 'rejected' && p.comment && (
//                             <Alert status="error" size="sm" borderRadius="md">
//                               <AlertIcon boxSize="16px" />
//                               <Text fontSize="xs"><strong>Admin:</strong> {p.comment}</Text>
//                             </Alert>
//                           )}

//                           <Flex align="center" justify="space-between" pt={2} borderTop="1px" borderColor={borderColor}>
//                             <Text fontSize="sm" color={textColor}>{new Date(p.date).toLocaleDateString()}</Text>
//                             <Text fontWeight="bold" fontSize="lg">₹{parseFloat(p.total_amount_paid).toFixed(2)}</Text>
//                           </Flex>
//                         </VStack>
//                       </Box>
//                     );
//                   })}
//                 </VStack>
//               </>
//             )}
//           </VStack>
//         </Box>
//       </Box>
//     </Flex>
//   );
// };



// export default PurchaseHistoryPage;












import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { formatISTDate } from '../../utils/dateUtils';
import {
  Box, VStack, Heading, Text, Spinner, Alert, AlertIcon,
  Container, Image, Badge, Flex, Divider, Input,
  useColorModeValue, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Center, HStack, useDisclosure, Drawer, DrawerOverlay, DrawerContent, DrawerBody,
  IconButton,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import VendorNavBar from '../../components/layout/VendorNavBar';

const DESKTOP_SIDEBAR_WIDTH = '200px';

const PurchaseHistoryPage = ({ url }) => {
  const { token } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [allPurchases, setAllPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const pageBg = useColorModeValue('gray.50', '#181C27');
  const sidebarBg = '#212734';
  const sidebarBorder = 'gray.700';
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const iconColor = useColorModeValue('black', 'whiteAlpha.900');

  const fetchHistory = useCallback(async () => {
    if (!token) { setError('Authentication token not found. Please log in.'); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const response = await fetch(`${url}/api/trading/history`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to fetch your purchase history.');
      const data = await response.json();
      setAllPurchases(data);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [token, url]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const filteredPurchases = useMemo(() => {
    if (!searchTerm.trim()) return allPurchases;
    const q = searchTerm.toLowerCase();
    return allPurchases.filter(p =>
      p.paper_type?.toLowerCase().includes(q) ||
      p.no_of_stock_bought?.toString().includes(q) ||
      p.total_amount_paid?.toString().includes(q) ||
      p.is_approved?.toLowerCase().includes(q) ||
      (p.comment && p.comment.toLowerCase().includes(q)) ||
      new Date(p.date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).toLowerCase().includes(q)
    );
  }, [allPurchases, searchTerm]);

  if (error) {
    return <Container centerContent py={20}><Alert status="error"><AlertIcon />{error}</Alert></Container>;
  }

  return (
    <Flex minH="100vh" bg={pageBg}>
      {/* Sidebar (desktop) */}
      <Box as="nav" pos="fixed" top="0" left="0" zIndex="sticky" h="full" w={DESKTOP_SIDEBAR_WIDTH} bg={sidebarBg} borderRight="1px" borderColor={sidebarBorder} display={{ base: 'none', md: 'block' }}>
        <VendorNavBar />
      </Box>

      {/* Drawer (mobile nav) */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg={sidebarBg} w={DESKTOP_SIDEBAR_WIDTH}>
          <DrawerBody p={0}><VendorNavBar onLinkClick={onClose} /></DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <Box flex="1" ml={{ base: 0, md: DESKTOP_SIDEBAR_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
        {/* Consistent mobile header */}
        <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon w={5} h={5} />}
            onClick={onOpen}
            size="sm"
            variant="ghost"
            color={iconColor}
            p={1}
            mt="-1"
            _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.200' } }}
          />
          <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">
            My Transaction Log
          </Heading>
        </Flex>

        <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="lg" boxShadow="lg" w={{ base: '100%', lg: '80%' }} mx="auto">
          <VStack spacing={6} align="stretch">
            <Heading as="h1" size="xl" color={headingColor} display={{ base: 'none', md: 'block' }}>
              My Transaction Log
            </Heading>

            <Box>
              <Input placeholder="Search by product, status, amount, date..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </Box>

            <Divider />

            {loading ? (
              <Center p={20}><Spinner size="xl" /></Center>
            ) : filteredPurchases.length === 0 ? (
              <Alert status="info" borderRadius="md"><AlertIcon />{searchTerm ? 'No purchases match your search.' : 'You have no purchase history.'}</Alert>
            ) : (
              <>
                {/* Desktop table */}
                <TableContainer display={{ base: 'none', md: 'block' }}>
                  <Table variant="simple">
                    <Thead><Tr><Th>Product</Th><Th>Details</Th><Th isNumeric>Total Paid</Th><Th>Status</Th></Tr></Thead>
                    <Tbody>
                      {filteredPurchases.map(p => {
                        const status = p.is_approved === 'approved' ? { color: 'green', text: 'Approved' }
                          : p.is_approved === 'rejected' ? { color: 'red', text: 'Rejected' }
                          : { color: 'yellow', text: 'Pending' };
                        return (
                          <Tr key={p.trade_id}>
                            <Td>
                              <HStack>
                                <Image src={p.product_image_url} boxSize="50px" borderRadius="md" fallbackSrc="https://via.placeholder.com/50" />
                                <Text fontWeight="bold">{p.paper_type}</Text>
                              </HStack>
                            </Td>
                            <Td>
                              <Text>Qty: <strong>{p.no_of_stock_bought}</strong></Text>
                              <Text fontSize="sm" color={textColor}>On: {formatISTDate(p.date, true, true)}</Text>
                            </Td>
                            <Td isNumeric fontWeight="bold">₹{parseFloat(p.total_amount_paid).toFixed(2)}</Td>
                            <Td><Badge colorScheme={status.color}>{status.text}</Badge></Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>

                {/* Mobile cards */}
                <VStack spacing={4} align="stretch" display={{ base: 'flex', md: 'none' }}>
                  {filteredPurchases.map(p => {
                    const status = p.is_approved === 'approved' ? { color: 'green', text: 'Approved' }
                      : p.is_approved === 'rejected' ? { color: 'red', text: 'Rejected' }
                      : { color: 'yellow', text: 'Pending' };
                    return (
                      <Box key={p.trade_id} p={4} borderWidth="1px" borderColor={borderColor} borderRadius="lg">
                        <VStack align="stretch" spacing={3}>
                          <Flex align="center" justify="space-between">
                            <HStack>
                              <Image src={p.product_image_url} boxSize="60px" borderRadius="md" fallbackSrc="https://via.placeholder.com/60" />
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="bold">{p.paper_type}</Text>
                                <Text fontSize="xs" color={textColor}>Qty: {p.no_of_stock_bought}</Text>
                              </VStack>
                            </HStack>
                            <Badge colorScheme={status.color}>{status.text}</Badge>
                          </Flex>
                          {p.is_approved === 'rejected' && p.comment && (
                            <Alert status="error" size="sm" borderRadius="md"><AlertIcon boxSize="16px" /><Text fontSize="xs"><strong>Admin:</strong> {p.comment}</Text></Alert>
                          )}
                          <Flex align="center" justify="space-between" pt={2} borderTop="1px" borderColor={borderColor}>
                            <Text fontSize="sm" color={textColor}>{p.date ? formatISTDate(p.date, true, true) : p.date}</Text>
                            <Text fontWeight="bold" fontSize="lg">₹{parseFloat(p.total_amount_paid).toFixed(2)}</Text>
                          </Flex>
                        </VStack>
                      </Box>
                    );
                  })}
                </VStack>
              </>
            )}
          </VStack>
        </Box>
      </Box>
    </Flex>
  );
};






export default PurchaseHistoryPage;