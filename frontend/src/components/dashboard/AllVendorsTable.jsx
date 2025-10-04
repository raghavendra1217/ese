
// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import {
//   Box, Text, Flex, Input, Table, Thead, Tbody, Tr, Th, Td, Avatar,
//   IconButton, useColorModeValue, Spinner, Tag, Icon, Select, Button,
//   HStack, CloseButton, Popover, PopoverTrigger, PopoverContent,
//   PopoverBody, PopoverArrow, PopoverHeader, PopoverCloseButton,
//   useDisclosure, Divider,
// } from '@chakra-ui/react';
// import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
// import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
// import { useAuth } from '../../AppContext';
// import { useDebounce } from '../../hooks/useDebounce';
// import { CSVLink } from 'react-csv';
// import { useNavigate } from 'react-router-dom';

// const AllVendorsTable = ({ url }) => {
//   const { token } = useAuth();
//   const navigate = useNavigate();

//   // server data
//   const [vendors, setVendors] = useState([]);
//   const [totalCount, setTotalCount] = useState(0);
//   const [loading, setLoading] = useState(true);

//   // client controls
//   const [page, setPage] = useState(1);
//   const [limit, setLimit] = useState(10);
//   const [sortBy, setSortBy] = useState('id');       // default sort by ID
//   const [sortOrder, setSortOrder] = useState('desc');
//   const [search, setSearch] = useState('');
//   const debouncedSearch = useDebounce(search, 500);

//   // date filters + popover
//   const [dateFilters, setDateFilters] = useState([]);      // ['YYYY-MM-DD']
//   const [dateRanges, setDateRanges] = useState([]);        // [{start,end}]
//   const datePop = useDisclosure();
//   const [pendingDate, setPendingDate] = useState('');
//   const [rangeStart, setRangeStart] = useState('');
//   const [rangeEnd, setRangeEnd] = useState('');

//   // theme
//   const cardBg = useColorModeValue('white', 'gray.800');
//   const headerColor = useColorModeValue('gray.600', 'gray.400');
//   const rowHoverBg = useColorModeValue('gray.50', 'gray.700');
//   const idColor = useColorModeValue('gray.500', 'gray.500');

//   // fetch paginated (server pagination)
//   const fetchVendors = useCallback(async () => {
//     setLoading(true);
//     try {
//       const query = new URLSearchParams({
//         page, limit, sortBy, sortOrder, search: debouncedSearch,
//       }).toString();

//       const res = await fetch(`${url}/api/admin/vendors/paginated?${query}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error('Failed to fetch vendors');
//       const data = await res.json();

//       setVendors(data.data || []);
//       const serverTotal =
//         data.total ?? data.totalCount ?? data.count ?? (Array.isArray(data.data) ? data.data.length : 0);
//       setTotalCount(serverTotal);
//     } catch (e) {
//       console.error(e);
//       setVendors([]);
//       setTotalCount(0);
//     } finally {
//       setLoading(false);
//     }
//   }, [page, limit, sortBy, sortOrder, debouncedSearch, token, url]);

//   useEffect(() => { if (token) fetchVendors(); }, [fetchVendors, token]);

//   const getStatusColor = (status) => {
//     switch ((status || '').toLowerCase()) {
//       case 'approved': return 'green';
//       case 'pending':
//       case 'pending_approval': return 'orange';
//       case 'rejected': return 'red';
//       default: return 'gray';
//     }
//   };

//   const formatDateKey = (d) => {
//     const dt = new Date(d);
//     if (Number.isNaN(dt.getTime())) return '';
//     const y = dt.getFullYear();
//     const m = String(dt.getMonth() + 1).padStart(2, '0');
//     const day = String(dt.getDate()).padStart(2, '0');
//     return `${y}-${m}-${day}`;
//   };

//   // client-side filters (applied to the current server page ONLY)
//   const pageData = useMemo(() => {
//     let arr = vendors;

//     if (dateFilters.length > 0) {
//       const daySet = new Set(dateFilters);
//       arr = arr.filter(v => {
//         const join = v.joining_date || v.created_at;
//         const key = join ? formatDateKey(join) : '';
//         return key && daySet.has(key);
//       });
//     }

//     if (dateRanges.length > 0) {
//       arr = arr.filter(v => {
//         const join = v.joining_date || v.created_at;
//         if (!join) return false;
//         const t = new Date(join).getTime();
//         return dateRanges.some(r => {
//           if (!r.start || !r.end) return false;
//           const s = new Date(r.start + 'T00:00:00').getTime();
//           const e = new Date(r.end + 'T23:59:59').getTime();
//           return t >= s && t <= e;
//         });
//       });
//     }

//     // local sort (current page only) to keep UI consistent
//     const key = sortBy === 'vendor_name' ? 'id' : sortBy;
//     return [...arr].sort((a, b) => {
//       let av = a[key], bv = b[key];
//       if (key === 'id') {
//         const ai = parseInt(String(av || '').split('_')[1] || '0', 10);
//         const bi = parseInt(String(bv || '').split('_')[1] || '0', 10);
//         av = Number.isNaN(ai) ? 0 : ai;
//         bv = Number.isNaN(bi) ? 0 : bi;
//       } else if (key === 'wallet_balance' || key === 'percentage') {
//         av = Number(av ?? 0); bv = Number(bv ?? 0);
//       } else if (key === 'created_at' || key === 'joining_date') {
//         av = new Date(a.joining_date || a.created_at || 0).getTime();
//         bv = new Date(b.joining_date || b.created_at || 0).getTime();
//       } else {
//         av = String(av ?? '').toLowerCase();
//         bv = String(bv ?? '').toLowerCase();
//       }
//       if (av < bv) return sortOrder === 'asc' ? -1 : 1;
//       if (av > bv) return sortOrder === 'asc' ? 1 : -1;
//       return 0;
//     });
//   }, [vendors, dateFilters, dateRanges, sortBy, sortOrder]);

//   // rely on SERVER total for pages (no extra slicing)
//   const totalPages = Math.max(1, Math.ceil((totalCount || 0) / limit));
//   const currentPage = Math.min(page, totalPages);

//   // reset to page 1 on filters/search/limit so server query aligns
//   useEffect(() => { setPage(1); }, [debouncedSearch, limit]);
//   useEffect(() => { setPage(1); }, [dateFilters, dateRanges]);

//   // columns
//   const columns = useMemo(
//     () => [
//       { key: 'vendor_name', label: 'Vendor' },
//       { key: 'id', label: 'ID' },
//       { key: 'status', label: 'Status' },       // sort only
//       { key: 'percentage', label: 'Commission %' },
//       { key: 'wallet_balance', label: 'Wallet' },
//       { key: 'created_at', label: 'Joined' },   // opens date popover
//     ], []
//   );

//   const SortIconEl = ({ column }) => {
//     const active = column === 'vendor_name' ? sortBy === 'id' : sortBy === column;
//     if (!active) return <Icon as={FaSort} color="gray.400" ml={2} />;
//     return sortOrder === 'asc' ? <Icon as={FaSortUp} ml={2} /> : <Icon as={FaSortDown} ml={2} />;
//   };

//   const handleSort = (column) => {
//     const mapped = column === 'vendor_name' ? 'id' : column;
//     // Joined column opens popover instead of toggling sort directly
//     if (mapped === 'created_at') { datePop.onOpen(); return; }
//     if (sortBy === mapped) setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
//     else { setSortBy(mapped); setSortOrder('asc'); }
//   };

//   // CSV
//   const [csvData, setCsvData] = useState([]);
//   const [csvLoading, setCsvLoading] = useState(false);
//   const fetchCSVData = async () => {
//     setCsvLoading(true);
//     try {
//       const res = await fetch(`${url}/api/admin/vendors/all`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error('Failed to fetch CSV');
//       const data = await res.json();
//       setCsvData(Array.isArray(data) ? data : []);
//     } catch (e) { console.error(e); }
//     finally { setCsvLoading(false); }
//   };

//   // date helpers
//   const addDateFilter = () => {
//     if (!pendingDate || dateFilters.includes(pendingDate)) return;
//     setDateFilters(prev => [...prev, pendingDate]);
//     setPendingDate('');
//   };
//   const addRange = () => {
//     if (!rangeStart || !rangeEnd || rangeStart > rangeEnd) return;
//     setDateRanges(prev => [...prev, { start: rangeStart, end: rangeEnd }]);
//     setRangeStart(''); setRangeEnd('');
//   };
//   const removeDate = (d) => setDateFilters(prev => prev.filter(x => x !== d));
//   const removeRange = (idx) => setDateRanges(prev => prev.filter((_, i) => i !== idx));
//   const clearAllFilters = () => { setDateFilters([]); setDateRanges([]); };

//   return (
//     <Box
//       bg={cardBg}
//       borderRadius="lg"
//       p={4}
//       boxShadow="sm"
//       overflowX="hidden"         // no bottom scrollbar
//       maxW="1180px"
//       w="100%"                   // keep same width even with no data
//       mx="auto"
//     >
//       {(dateFilters.length > 0 || dateRanges.length > 0) && (
//         <Box mb={3}>
//           <HStack spacing={3} wrap="wrap">
//             {dateFilters.map(d => (
//               <Tag key={`d-${d}`} colorScheme="purple" borderRadius="full">
//                 <Text mr={1}>{d}</Text>
//                 <CloseButton size="sm" onClick={() => removeDate(d)} />
//               </Tag>
//             ))}
//             {dateRanges.map((r, i) => (
//               <Tag key={`r-${i}`} colorScheme="pink" borderRadius="full">
//                 <Text mr={1}>{r.start} → {r.end}</Text>
//                 <CloseButton size="sm" onClick={() => removeRange(i)} />
//               </Tag>
//             ))}
//             <Button size="xs" variant="ghost" onClick={clearAllFilters}>Clear all</Button>
//           </HStack>
//         </Box>
//       )}

//       <Flex justify="space-between" align="center" mb={3} gap={2} wrap="wrap">
//         <Text fontSize="xl" fontWeight="bold">All Vendors</Text>
//         <Flex gap={2} align="center">
//           <Input
//             placeholder="Search vendors..."
//             w={{ base: '180px', md: '300px' }}
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//           <Button colorScheme="green" size="sm" onClick={fetchCSVData} isLoading={csvLoading}>
//             Prepare CSV
//           </Button>
//           {csvData.length > 0 && (
//             <CSVLink data={csvData} filename="vendors.csv" target="_blank">
//               <Button colorScheme="blue" size="sm">Download CSV</Button>
//             </CSVLink>
//           )}
//         </Flex>
//       </Flex>

//       <Table
//         variant="simple"
//         size="sm"                          // compact rows
//         w="100%"                           // keep width constant
//         sx={{ tableLayout: 'fixed', 'th, td': { py: 2, px: 3 } }} // reduced padding
//       >
//         <Thead>
//           <Tr>
//             {columns.map(col => {
//               const isDate = col.key === 'created_at';
//               return (
//                 <Th
//                   key={col.key}
//                   onClick={(e) => { e.stopPropagation(); handleSort(col.key); }}
//                   cursor="pointer"
//                   color={headerColor}
//                   whiteSpace="nowrap"
//                   position="relative"
//                 >
//                   <Flex align="center" gap={1}>
//                     {col.label} <SortIconEl column={col.key} />
//                   </Flex>

//                   {/* DATE FILTER + SORT POPOVER */}
//                   {isDate && (
//                     <Popover
//                       isOpen={datePop.isOpen}
//                       onClose={datePop.onClose}
//                       placement="bottom-start"
//                       closeOnBlur
//                     >
//                       <PopoverTrigger>
//                         {/* click handled by header; this trigger is just the overlay */}
//                         <Box position="absolute" top={0} left={0} w="100%" h="100%" />
//                       </PopoverTrigger>
//                       <PopoverContent w="360px" zIndex={20} onClick={(e) => e.stopPropagation()}>
//                         <PopoverArrow />
//                         <PopoverCloseButton onClick={datePop.onClose} />
//                         <PopoverHeader fontWeight="bold">Joined — Filter & Sort</PopoverHeader>
//                         <PopoverBody>
//                           <Text fontSize="sm" mb={1} color="gray.600">Add a specific date</Text>
//                           <HStack mb={3} spacing={2}>
//                             <Input type="date" value={pendingDate} onChange={(e) => setPendingDate(e.target.value)} />
//                             <Button size="sm" onClick={addDateFilter}>Add</Button>
//                           </HStack>

//                           <Text fontSize="sm" mb={1} color="gray.600">Add a date range</Text>
//                           <HStack mb={3} spacing={2}>
//                             <Input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
//                             <Input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
//                             <Button size="sm" onClick={addRange}>Add</Button>
//                           </HStack>

//                           {(dateFilters.length > 0 || dateRanges.length > 0) && (
//                             <>
//                               <Divider my={3} />
//                               <Text fontSize="sm" mb={2} color="gray.500">Selected</Text>
//                               <HStack wrap="wrap" spacing={2} mb={2}>
//                                 {dateFilters.map(d => (
//                                   <Tag key={`sel-${d}`} colorScheme="purple">
//                                     {d}<CloseButton size="sm" ml={1} onClick={() => removeDate(d)} />
//                                   </Tag>
//                                 ))}
//                                 {dateRanges.map((r, i) => (
//                                   <Tag key={`selr-${i}`} colorScheme="pink">
//                                     {r.start} → {r.end}
//                                     <CloseButton size="sm" ml={1} onClick={() => removeRange(i)} />
//                                   </Tag>
//                                 ))}
//                               </HStack>
//                             </>
//                           )}

//                           <Divider my={3} />

//                           {/* Sort controls inside the popover */}
//                           <Text fontSize="sm" mb={2} color="gray.600">Sort by Joined</Text>
//                           <HStack spacing={2} mb={3}>
//                             <Button
//                               size="sm"
//                               variant={sortBy === 'created_at' && sortOrder === 'asc' ? 'solid' : 'outline'}
//                               colorScheme="blue"
//                               onClick={() => { setSortBy('created_at'); setSortOrder('asc'); }}
//                             >
//                               Sort Ascending
//                             </Button>
//                             <Button
//                               size="sm"
//                               variant={sortBy === 'created_at' && sortOrder === 'desc' ? 'solid' : 'outline'}
//                               colorScheme="blue"
//                               onClick={() => { setSortBy('created_at'); setSortOrder('desc'); }}
//                             >
//                               Sort Descending
//                             </Button>
//                           </HStack>

//                           <HStack>
//                             <Button size="sm" colorScheme="blue" onClick={datePop.onClose} w="100%">Apply</Button>
//                             <Button size="sm" variant="outline" onClick={datePop.onClose} w="100%">Close</Button>
//                           </HStack>
//                         </PopoverBody>
//                       </PopoverContent>
//                     </Popover>
//                   )}
//                 </Th>
//               );
//             })}
//           </Tr>
//         </Thead>

//         <Tbody>
//           {loading ? (
//             <Tr><Td colSpan={columns.length} textAlign="center"><Spinner /></Td></Tr>
//           ) : pageData.length === 0 ? (
//             <Tr>
//               <Td colSpan={columns.length} textAlign="center" py={8}>
//                 No vendors found.
//               </Td>
//             </Tr>
//           ) : (
//             pageData.map(vendor => {
//               const joinDate = vendor.joining_date || vendor.created_at;
//               return (
//                 <Tr
//                   key={vendor.id}
//                   onClick={() => navigate(`/admin/manage-profile/${vendor.id}`)}
//                   _hover={{ bg: rowHoverBg, cursor: 'pointer' }}
//                 >
//                   {/* Vendor: name + avatar only */}
//                   <Td>
//                     <Flex align="flex-start" gap={2}>
//                       <Avatar size="sm" name={vendor.vendor_name} src={vendor.passport_photo_url} mt={0.5} />
//                       <Box>
//                         <Text
//                           fontSize="sm"            // smaller name
//                           fontWeight="semibold"    // toned down weight
//                           lineHeight="1.2"
//                           noOfLines={1}
//                         >
//                           {vendor.vendor_name}
//                         </Text>
//                       </Box>
//                     </Flex>
//                   </Td>

//                   {/* Separate ID column */}
//                   <Td><Text fontSize="sm" color={idColor}>{vendor.id}</Text></Td>

//                   <Td>
//                     <Tag size="sm" colorScheme={getStatusColor(vendor.status)} textTransform="capitalize">
//                       {(vendor.status || 'unknown').replace('_', ' ')}
//                     </Tag>
//                   </Td>

//                   <Td textAlign="center">
//                     {vendor.percentage !== null && vendor.percentage !== undefined ? (
//                       <Tag colorScheme="blue">{vendor.percentage}%</Tag>
//                     ) : (<Tag>N/A</Tag>)}
//                   </Td>

//                   <Td fontWeight="medium">
//                     ₹{Number.parseFloat(vendor.wallet_balance || 0).toLocaleString('en-IN', {
//                       minimumFractionDigits: 0, maximumFractionDigits: 0,
//                     })}
//                   </Td>

//                   <Td>{joinDate ? new Date(joinDate).toLocaleDateString() : '—'}</Td>
//                 </Tr>
//               );
//             })
//           )}
//         </Tbody>
//       </Table>

//       <Flex justify="space-between" align="center" mt={3}>
//         <Flex align="center" gap={2}>
//           <Text fontSize="sm">Rows:</Text>
//           <Select size="sm" w="90px" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
//             <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
//           </Select>
//         </Flex>
//         <Flex align="center" gap={2}>
//           <Text fontSize="sm" mr={2}>Page {currentPage} of {totalPages}</Text>
//           <IconButton icon={<FiChevronLeft />} onClick={() => setPage(p => Math.max(1, p - 1))}
//                       isDisabled={currentPage === 1} size="sm" aria-label="Prev" />
//           <IconButton icon={<FiChevronRight />} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
//                       isDisabled={currentPage === totalPages} size="sm" aria-label="Next" />
//         </Flex>
//       </Flex>
//     </Box>
//   );
// };

// export default AllVendorsTable;
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Text, Flex, Input, Table, Thead, Tbody, Tr, Th, Td, Avatar,
  IconButton, useColorModeValue, Spinner, Tag, Icon, Select, Button, Badge,
  HStack, CloseButton, Popover, PopoverTrigger, PopoverContent,
  PopoverBody, PopoverArrow, PopoverHeader, PopoverCloseButton,
  useDisclosure, Divider, VStack, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel,
} from '@chakra-ui/react';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../AppContext';
import { useDebounce } from '../../hooks/useDebounce';
import { CSVLink } from 'react-csv';
import { useNavigate } from 'react-router-dom';

const AllVendorsTable = ({ url }) => {
  const { token } = useAuth();
  const navigate = useNavigate();

  // server data
  const [vendors, setVendors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [coordinators, setCoordinators] = useState([]);
  const [editingVendor, setEditingVendor] = useState(null);
  const [selectedCoordinator, setSelectedCoordinator] = useState('');
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  // Fetch coordinators for dropdown
  const fetchCoordinators = useCallback(async () => {
    console.log('🔄 fetchCoordinators: Starting to fetch coordinators...');
    try {
      const response = await fetch(`${url}/api/coordinator`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('📡 fetchCoordinators: Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ fetchCoordinators: Data received:', data);
        setCoordinators(data.coordinators || []);
        console.log('✅ fetchCoordinators: Coordinators set in state:', data.coordinators?.length || 0);
      } else {
        console.error('❌ fetchCoordinators: Response not ok:', response.status);
      }
    } catch (error) {
      console.error('❌ fetchCoordinators: Error:', error);
    }
  }, [url, token]);

  // Update vendor coordinator
  const updateVendorCoordinator = async () => {
    console.log('🔄 updateVendorCoordinator: Starting update process...');
    console.log('📋 updateVendorCoordinator: editingVendor:', editingVendor);
    console.log('📋 updateVendorCoordinator: selectedCoordinator:', selectedCoordinator);
    
    if (!editingVendor || selectedCoordinator === undefined) {
      console.log('❌ updateVendorCoordinator: Validation failed - missing vendor or coordinator');
      return;
    }

    try {
      console.log('📡 updateVendorCoordinator: Making API call...');
      const requestBody = { coordinator_id: selectedCoordinator };
      console.log('📡 updateVendorCoordinator: Request body:', requestBody);
      
      const response = await fetch(`${url}/api/admin/update-vendor-coordinator/${editingVendor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 updateVendorCoordinator: Response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ updateVendorCoordinator: Success response:', responseData);
        
        // Refresh vendors data
        console.log('🔄 updateVendorCoordinator: Refreshing vendors data...');
        await fetchVendors();
        console.log('✅ updateVendorCoordinator: Vendors data refreshed');
        
        onEditClose();
        setSelectedCoordinator('');
        console.log('✅ updateVendorCoordinator: Modal closed and state reset');
      } else {
        const errorData = await response.json();
        console.error('❌ updateVendorCoordinator: Error response:', errorData);
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('❌ updateVendorCoordinator: Network error:', error);
      alert('Network error occurred while updating coordinator');
    }
  };

  // client controls
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('id');      // default sort by ID
  const [sortOrder, setSortOrder] = useState('desc');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  // date filters + popover
  const [dateFilters, setDateFilters] = useState([]);      // ['YYYY-MM-DD']
  const [dateRanges, setDateRanges] = useState([]);        // [{start,end}]
  const datePop = useDisclosure();
  const [pendingDate, setPendingDate] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');

  // theme
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('gray.600', 'gray.400');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');
  const idColor = useColorModeValue('gray.500', 'gray.500');
  const borderColor = useColorModeValue('gray.200', 'gray.700');


  // fetch paginated (server pagination)
  const fetchVendors = useCallback(async () => {
    console.log('🔄 fetchVendors: Starting to fetch vendors...');
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page, limit, sortBy, sortOrder, search: debouncedSearch,
      }).toString();

      console.log('📡 fetchVendors: Query params:', { page, limit, sortBy, sortOrder, search: debouncedSearch });

      const res = await fetch(`${url}/api/admin/vendors/paginated?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('📡 fetchVendors: Response status:', res.status);
      
      if (!res.ok) throw new Error('Failed to fetch vendors');
      const data = await res.json();
      console.log('✅ fetchVendors: Data received:', data);

      setVendors(data.data || []);
      const serverTotal =
        data.total ?? data.totalCount ?? data.count ?? (Array.isArray(data.data) ? data.data.length : 0);
      setTotalCount(serverTotal);
      console.log('✅ fetchVendors: Vendors set in state:', data.data?.length || 0);
      console.log('✅ fetchVendors: Total count set:', serverTotal);
    } catch (e) {
      console.error('❌ fetchVendors: Error:', e);
      setVendors([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      console.log('✅ fetchVendors: Loading set to false');
    }
  }, [page, limit, sortBy, sortOrder, debouncedSearch, token, url]);

  useEffect(() => {
    if (token) {
      console.log('🔄 useEffect: Token available, fetching vendors and coordinators');
      fetchVendors();
      fetchCoordinators();
    } else {
      console.log('❌ useEffect: No token available');
    }
  }, [fetchVendors, fetchCoordinators, token]);

  // Log state changes
  useEffect(() => {
    console.log('📊 State Update: vendors count:', vendors.length);
    console.log('📊 State Update: coordinators count:', coordinators.length);
    console.log('📊 State Update: editingVendor:', editingVendor);
    console.log('📊 State Update: selectedCoordinator:', selectedCoordinator);
    console.log('📊 State Update: isEditOpen:', isEditOpen);
  }, [vendors, coordinators, editingVendor, selectedCoordinator, isEditOpen]);

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'approved': return 'green';
      case 'pending':
      case 'pending_approval': return 'orange';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  const formatDateKey = (d) => {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // client-side filters (applied to the current server page ONLY)
  const pageData = useMemo(() => {
    let arr = vendors;

    if (dateFilters.length > 0) {
      const daySet = new Set(dateFilters);
      arr = arr.filter(v => {
        const join = v.joining_date || v.created_at;
        const key = join ? formatDateKey(join) : '';
        return key && daySet.has(key);
      });
    }

    if (dateRanges.length > 0) {
      arr = arr.filter(v => {
        const join = v.joining_date || v.created_at;
        if (!join) return false;
        const t = new Date(join).getTime();
        return dateRanges.some(r => {
          if (!r.start || !r.end) return false;
          const s = new Date(r.start + 'T00:00:00').getTime();
          const e = new Date(r.end + 'T23:59:59').getTime();
          return t >= s && t <= e;
        });
      });
    }

    // local sort (current page only) to keep UI consistent
    const key = sortBy === 'vendor_name' ? 'id' : sortBy;
    return [...arr].sort((a, b) => {
      let av = a[key], bv = b[key];
      if (key === 'id') {
        const ai = parseInt(String(av || '').split('_')[1] || '0', 10);
        const bi = parseInt(String(bv || '').split('_')[1] || '0', 10);
        av = Number.isNaN(ai) ? 0 : ai;
        bv = Number.isNaN(bi) ? 0 : bi;
      } else if (key === 'wallet_balance' || key === 'percentage') {
        av = Number(av ?? 0); bv = Number(bv ?? 0);
      } else if (key === 'created_at' || key === 'joining_date') {
        av = new Date(a.joining_date || a.created_at || 0).getTime();
        bv = new Date(b.joining_date || b.created_at || 0).getTime();
      } else {
        av = String(av ?? '').toLowerCase();
        bv = String(bv ?? '').toLowerCase();
      }
      if (av < bv) return sortOrder === 'asc' ? -1 : 1;
      if (av > bv) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [vendors, dateFilters, dateRanges, sortBy, sortOrder]);

  // rely on SERVER total for pages (no extra slicing)
  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / limit));
  const currentPage = Math.min(page, totalPages);

  // reset to page 1 on filters/search/limit so server query aligns
  useEffect(() => { setPage(1); }, [debouncedSearch, limit]);
  useEffect(() => { setPage(1); }, [dateFilters, dateRanges]);


  // columns
  const columns = useMemo(
    () => [
      { key: 'vendor_name', label: 'Vendor' },
      { key: 'id', label: 'ID' },
      { key: 'coordinator_name', label: 'Coordinator' },
      { key: 'status', label: 'Status' },      // sort only
      { key: 'percentage', label: 'Commission %' },
      { key: 'wallet_balance', label: 'Wallet' },
      { key: 'created_at', label: 'Joined' },  // opens date popover
      { key: 'actions', label: 'Actions' },
    ], []
  );

  const SortIconEl = ({ column }) => {
    const active = column === 'vendor_name' ? sortBy === 'id' : sortBy === column;
    if (!active) return <Icon as={FaSort} color="gray.400" ml={2} />;
    return sortOrder === 'asc' ? <Icon as={FaSortUp} ml={2} /> : <Icon as={FaSortDown} ml={2} />;
  };

  const handleSort = (column) => {
    const mapped = column === 'vendor_name' ? 'id' : column;
    // Joined column opens popover instead of toggling sort directly
    if (mapped === 'created_at') { datePop.onOpen(); return; }
    if (sortBy === mapped) setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(mapped); setSortOrder('asc'); }
  };

  // CSV
  const [csvData, setCsvData] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const fetchCSVData = async () => {
    setCsvLoading(true);
    try {
      const res = await fetch(`${url}/api/admin/vendors/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch CSV');
      const data = await res.json();
      setCsvData(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setCsvLoading(false); }
  };

  // date helpers
  const addDateFilter = () => {
    if (!pendingDate || dateFilters.includes(pendingDate)) return;
    setDateFilters(prev => [...prev, pendingDate]);
    setPendingDate('');
  };
  const addRange = () => {
    if (!rangeStart || !rangeEnd || rangeStart > rangeEnd) return;
    setDateRanges(prev => [...prev, { start: rangeStart, end: rangeEnd }]);
    setRangeStart(''); setRangeEnd('');
  };
  const removeDate = (d) => setDateFilters(prev => prev.filter(x => x !== d));
  const removeRange = (idx) => setDateRanges(prev => prev.filter((_, i) => i !== idx));
  const clearAllFilters = () => { setDateFilters([]); setDateRanges([]); };

  return (
    <Box
      bg={cardBg}
      borderRadius="lg"
      p={{ base: 3, md: 4 }}
      boxShadow="sm"
      maxW="1180px"
      w="100%"
      mx="auto"
    >
      {(dateFilters.length > 0 || dateRanges.length > 0) && (
        <Box mb={3}>
          <HStack spacing={3} wrap="wrap">
            {dateFilters.map(d => (
              <Tag key={`d-${d}`} colorScheme="purple" borderRadius="full">
                <Text mr={1}>{d}</Text>
                <CloseButton size="sm" onClick={() => removeDate(d)} />
              </Tag>
            ))}
            {dateRanges.map((r, i) => (
              <Tag key={`r-${i}`} colorScheme="pink" borderRadius="full">
                <Text mr={1}>{r.start} → {r.end}</Text>
                <CloseButton size="sm" onClick={() => removeRange(i)} />
              </Tag>
            ))}
            <Button size="xs" variant="ghost" onClick={clearAllFilters}>Clear all</Button>
          </HStack>
        </Box>
      )}

      <Flex justify="space-between" align="center" mb={4} gap={2} wrap="wrap">
        <Text fontSize="xl" fontWeight="bold">All Vendors</Text>
        <Flex gap={2} align="center" wrap="wrap">
          <Input
            placeholder="Search vendors..."
            w={{ base: 'full', sm: '200px', md: '300px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button colorScheme="green" size="sm" onClick={fetchCSVData} isLoading={csvLoading}>
            Prepare CSV
          </Button>
          {csvData.length > 0 && (
            <CSVLink data={csvData} filename="vendors.csv" target="_blank">
              <Button colorScheme="blue" size="sm">Download CSV</Button>
            </CSVLink>
          )}
        </Flex>
      </Flex>

      {loading ? (
        <Flex justify="center" p={10}><Spinner size="xl" /></Flex>
      ) : pageData.length === 0 ? (
        <Flex justify="center" p={10}><Text>No vendors found.</Text></Flex>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <Box display={{ base: 'none', md: 'block' }} overflowX="auto">
            <Table
              variant="simple"
              size="sm"
              w="100%"
              sx={{ tableLayout: 'fixed', 'th, td': { py: 2, px: 3 } }}
            >
              <Thead>
                <Tr>
                  {columns.map(col => {
                    const isDate = col.key === 'created_at';
                    return (
                      <Th
                        key={col.key}
                        onClick={(e) => { e.stopPropagation(); handleSort(col.key); }}
                        cursor="pointer"
                        color={headerColor}
                        whiteSpace="nowrap"
                        position="relative"
                      >
                        <Flex align="center" gap={1}>
                          {col.label} <SortIconEl column={col.key} />
                        </Flex>
                        {isDate && (
                          <Popover
                            isOpen={datePop.isOpen}
                            onClose={datePop.onClose}
                            placement="bottom-start"
                            closeOnBlur
                          >
                            <PopoverTrigger>
                              <Box position="absolute" top={0} left={0} w="100%" h="100%" />
                            </PopoverTrigger>
                            <PopoverContent w="360px" zIndex={20} onClick={(e) => e.stopPropagation()}>
                              <PopoverArrow />
                              <PopoverCloseButton onClick={datePop.onClose} />
                              <PopoverHeader fontWeight="bold">Joined — Filter & Sort</PopoverHeader>
                              <PopoverBody>
                                <Text fontSize="sm" mb={1} color="gray.600">Add a specific date</Text>
                                <HStack mb={3} spacing={2}>
                                  <Input type="date" value={pendingDate} onChange={(e) => setPendingDate(e.target.value)} />
                                  <Button size="sm" onClick={addDateFilter}>Add</Button>
                                </HStack>

                                <Text fontSize="sm" mb={1} color="gray.600">Add a date range</Text>
                                <HStack mb={3} spacing={2}>
                                  <Input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
                                  <Input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
                                  <Button size="sm" onClick={addRange}>Add</Button>
                                </HStack>

                                {(dateFilters.length > 0 || dateRanges.length > 0) && (
                                  <>
                                    <Divider my={3} />
                                    <Text fontSize="sm" mb={2} color="gray.500">Selected</Text>
                                    <HStack wrap="wrap" spacing={2} mb={2}>
                                      {dateFilters.map(d => (
                                        <Tag key={`sel-${d}`} colorScheme="purple">
                                          {d}<CloseButton size="sm" ml={1} onClick={() => removeDate(d)} />
                                        </Tag>
                                      ))}
                                      {dateRanges.map((r, i) => (
                                        <Tag key={`selr-${i}`} colorScheme="pink">
                                          {r.start} → {r.end}
                                          <CloseButton size="sm" ml={1} onClick={() => removeRange(i)} />
                                        </Tag>
                                      ))}
                                    </HStack>
                                  </>
                                )}

                                <Divider my={3} />

                                <Text fontSize="sm" mb={2} color="gray.600">Sort by Joined</Text>
                                <HStack spacing={2} mb={3}>
                                  <Button
                                    size="sm"
                                    variant={sortBy === 'created_at' && sortOrder === 'asc' ? 'solid' : 'outline'}
                                    colorScheme="blue"
                                    onClick={() => { setSortBy('created_at'); setSortOrder('asc'); }}
                                  >
                                    Sort Ascending
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={sortBy === 'created_at' && sortOrder === 'desc' ? 'solid' : 'outline'}
                                    colorScheme="blue"
                                    onClick={() => { setSortBy('created_at'); setSortOrder('desc'); }}
                                  >
                                    Sort Descending
                                  </Button>
                                </HStack>

                                <HStack>
                                  <Button size="sm" colorScheme="blue" onClick={datePop.onClose} w="100%">Apply</Button>
                                  <Button size="sm" variant="outline" onClick={datePop.onClose} w="100%">Close</Button>
                                </HStack>
                              </PopoverBody>
                            </PopoverContent>
                          </Popover>
                        )}
                      </Th>
                    );
                  })}
                </Tr>
              </Thead>
              <Tbody>
                {pageData.map(vendor => {
                  const joinDate = vendor.joining_date || vendor.created_at;
                  return (
                    <Tr
                      key={vendor.id}
                      onClick={() => navigate(`/admin/manage-profile/${vendor.id}`)}
                      _hover={{ bg: rowHoverBg, cursor: 'pointer' }}
                    >
                      <Td>
                        <Flex align="flex-start" gap={2}>
                          <Avatar size="sm" name={vendor.vendor_name} src={vendor.passport_photo_url} mt={0.5} />
                          <Box>
                            <Text fontSize="sm" fontWeight="semibold" lineHeight="1.2" noOfLines={1}>
                              {vendor.vendor_name}
                            </Text>
                          </Box>
                        </Flex>
                      </Td>
                      <Td><Text fontSize="sm" color={idColor}>{vendor.id}</Text></Td>
                      <Td>
                        <Text fontSize="sm" color={vendor.coordinator_name ? 'inherit' : 'gray.500'}>
                          {vendor.coordinator_name || 'No Coordinator'}
                        </Text>
                      </Td>
                      <Td>
                        <Tag size="sm" colorScheme={getStatusColor(vendor.status)} textTransform="capitalize">
                          {(vendor.status || 'unknown').replace('_', ' ')}
                        </Tag>
                      </Td>
                      <Td textAlign="center">
                        {vendor.percentage !== null && vendor.percentage !== undefined ? (
                          <Tag colorScheme="blue">{vendor.percentage}%</Tag>
                        ) : (<Tag>N/A</Tag>)}
                      </Td>
                      <Td fontWeight="medium">
                        ₹{Number.parseFloat(vendor.wallet_balance || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 0, maximumFractionDigits: 0,
                        })}
                      </Td>
                      <Td>{joinDate ? new Date(joinDate).toLocaleDateString() : '—'}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🔄 Edit Coordinator Button: Clicked for vendor:', vendor);
                              console.log('📋 Edit Coordinator Button: Current coordinator_id:', vendor.coordinator_id);
                              setEditingVendor(vendor);
                              setSelectedCoordinator(vendor.coordinator_id || '');
                              console.log('📋 Edit Coordinator Button: Selected coordinator set to:', vendor.coordinator_id || '');
                              onEditOpen();
                              console.log('✅ Edit Coordinator Button: Modal opened');
                            }}
                          >
                            Edit Coordinator
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>

          {/* MOBILE CARD VIEW */}
          <VStack spacing={4} display={{ base: 'flex', md: 'none' }}>
            {pageData.map(vendor => {
              const joinDate = vendor.joining_date || vendor.created_at;
              return (
                <Box
                  key={vendor.id}
                  w="100%"
                  p={4}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="lg"
                  boxShadow="sm"
                  onClick={() => navigate(`/admin/manage-profile/${vendor.id}`)}
                  _hover={{ bg: rowHoverBg, cursor: 'pointer' }}
                >
                  <VStack spacing={3} align="stretch">
                    {/* Top Row: Info + Wallet */}
                    <Flex justify="space-between" align="flex-start">
                      <Flex align="center" gap={3} flex={1} minW={0}>
                        <Avatar name={vendor.vendor_name} src={vendor.passport_photo_url} />
                        <Box>
                          <Text fontWeight="bold" fontSize="md" noOfLines={1}>
                            {vendor.vendor_name}
                          </Text>
                          <Text fontSize="sm" color={idColor}>
                            ID: {vendor.id}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            Coordinator: {vendor.coordinator_name || 'None'}
                          </Text>
                        </Box>
                      </Flex>
                      <Text fontWeight="bold" fontSize="lg" color="green.500" ml={3} flexShrink={0}>
                        ₹{Number.parseFloat(vendor.wallet_balance || 0).toLocaleString('en-IN')}
                      </Text>
                    </Flex>

                    <Divider />

                    {/* Bottom Row: Details */}
                    <Flex justify="space-between" align="center">
                      <Tag size="sm" colorScheme={getStatusColor(vendor.status)} textTransform="capitalize">
                        {(vendor.status || 'unknown').replace('_', ' ')}
                      </Tag>
                      {vendor.percentage !== null && vendor.percentage !== undefined ? (
                        <Tag size="sm" colorScheme="blue">{vendor.percentage}% Commission</Tag>
                      ) : (<Tag size="sm">N/A</Tag>)}
                      <Text fontSize="xs" color="gray.500">
                        {joinDate ? `Joined: ${new Date(joinDate).toLocaleDateString()}` : ''}
                      </Text>
                    </Flex>
                  </VStack>
                </Box>
              );
            })}
          </VStack>
        </>
      )}

      {/* Coordinator Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => {
        console.log('🔄 Modal: Closing edit coordinator modal');
        onEditClose();
      }} size="lg">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent borderRadius="xl" boxShadow="2xl">
          <ModalHeader
            bg="blue.50"
            borderBottom="1px"
            borderColor="blue.100"
            borderTopRadius="xl"
            py={6}
            fontSize="lg"
            fontWeight="bold"
          >
            Edit Vendor Coordinator
          </ModalHeader>
          <ModalCloseButton top={4} right={4} />
          <ModalBody py={6}>
            {editingVendor && (
              <VStack spacing={6} align="stretch">
                <Box
                  p={4}
                  bg="gray.50"
                  borderRadius="md"
                  border="1px"
                  borderColor="gray.200"
                >
                  <VStack spacing={2} align="stretch">
                    <Text fontWeight="semibold" color="gray.700">
                      Vendor Details:
                    </Text>
                    <Text><strong>Name:</strong> {editingVendor.vendor_name}</Text>
                    <Text><strong>ID:</strong> {editingVendor.id}</Text>
                    <Text><strong>Current Coordinator:</strong>
                      <Badge colorScheme={editingVendor.coordinator_name ? "blue" : "gray"} ml={2}>
                        {editingVendor.coordinator_name || 'No Coordinator'}
                      </Badge>
                    </Text>
                  </VStack>
                </Box>

                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.700">Select Coordinator</FormLabel>
                  <Select
                    value={selectedCoordinator}
                    onChange={(e) => {
                      console.log('🔄 Coordinator Dropdown: Changed to:', e.target.value);
                      setSelectedCoordinator(e.target.value);
                    }}
                    placeholder="Choose a coordinator..."
                    size="lg"
                    borderRadius="md"
                    bg="white"
                    border="2px solid"
                    borderColor="gray.200"
                    _hover={{ borderColor: "blue.300" }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce"
                    }}
                  >
                    <option value="">No Coordinator</option>
                    {coordinators.map((coord) => (
                      <option key={coord.coordinator_id} value={coord.coordinator_id}>
                        {coord.name} ({coord.coordinator_id})
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter
            borderTop="1px"
            borderColor="gray.100"
            bg="gray.50"
            borderBottomRadius="xl"
            py={4}
          >
            <Button
              variant="ghost"
              mr={3}
              onClick={() => {
                console.log('🔄 Cancel Button: Closing modal without saving');
                onEditClose();
              }}
              borderRadius="md"
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={updateVendorCoordinator}
              isDisabled={selectedCoordinator === undefined}
              borderRadius="md"
              px={6}
            >
              {selectedCoordinator ? 'Update Coordinator' : 'Remove Coordinator'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* PAGINATION (visible for both views) */}
      <Flex justify="space-between" align="center" mt={4} flexWrap="wrap" gap={3}>
        <HStack>
          <Text fontSize="sm">Rows:</Text>
          <Select size="sm" w="80px" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
          </Select>
        </HStack>
        <HStack>
          <Text fontSize="sm" whiteSpace="nowrap">Page {currentPage} of {totalPages}</Text>
          <IconButton icon={<FiChevronLeft />} onClick={() => setPage(p => Math.max(1, p - 1))}
            isDisabled={currentPage === 1} size="sm" aria-label="Previous Page" />
          <IconButton icon={<FiChevronRight />} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            isDisabled={currentPage === totalPages} size="sm" aria-label="Next Page" />
        </HStack>
      </Flex>
    </Box>
  );
};

export default AllVendorsTable;