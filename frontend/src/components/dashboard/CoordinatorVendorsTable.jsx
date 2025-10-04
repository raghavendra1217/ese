import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Text, Flex, Input, Table, Thead, Tbody, Tr, Th, Td, Avatar,
  IconButton, useColorModeValue, Spinner, Tag, Icon, Select, Button, Badge,
  HStack, CloseButton, Popover, PopoverTrigger, PopoverContent,
  PopoverBody, PopoverArrow, PopoverHeader, PopoverCloseButton,
  useDisclosure, Divider, VStack, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel,
  useToast,
} from '@chakra-ui/react';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../AppContext';
import { useDebounce } from '../../hooks/useDebounce';
import { CSVLink } from 'react-csv';
import { useNavigate } from 'react-router-dom';

const CoordinatorVendorsTable = ({ url, viewType = 'all' }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Real vendor data from API
  const [vendors, setVendors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [assigningVendors, setAssigningVendors] = useState(new Set());
  const [removingVendors, setRemovingVendors] = useState(new Set());

  // client controls
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  // date filters + popover
  const [dateFilters, setDateFilters] = useState([]);
  const [dateRanges, setDateRanges] = useState([]);
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

  // Assign vendor to current coordinator
  const assignVendor = async (vendorId, vendorName) => {
    console.log('🚀 Assign button clicked:', { vendorId, vendorName, url, token: token ? 'Present' : 'Missing' });
    
    if (assigningVendors.has(vendorId)) {
      console.log('⚠️ Assignment already in progress for vendor:', vendorId);
      return; // Prevent double-click
    }

    setAssigningVendors(prev => new Set(prev).add(vendorId));
    console.log('🔄 Starting assignment process...');

    try {
      const apiUrl = `${url}/api/coordinator/assign-vendor/${vendorId}`;
      console.log('📡 Making API call to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 API Response status:', response.status, response.statusText);
      const data = await response.json();
      console.log('📡 API Response data:', data);

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message || `Vendor ${vendorName} assigned successfully`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Refresh the vendors data to reflect the assignment
        fetchVendors();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to assign vendor',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error assigning vendor:', error);
      toast({
        title: 'Error',
        description: 'Network error occurred while assigning vendor',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setAssigningVendors(prev => {
        const newSet = new Set(prev);
        newSet.delete(vendorId);
        return newSet;
      });
    }
  };

  // Remove vendor from current coordinator
  const removeVendor = async (vendorId, vendorName) => {
    console.log('🗑️ Remove button clicked:', { vendorId, vendorName, url, token: token ? 'Present' : 'Missing' });
    
    if (removingVendors.has(vendorId)) {
      console.log('⚠️ Removal already in progress for vendor:', vendorId);
      return; // Prevent double-click
    }

    setRemovingVendors(prev => new Set(prev).add(vendorId));
    console.log('🔄 Starting removal process...');

    try {
      const apiUrl = `${url}/api/coordinator/remove-vendor/${vendorId}`;
      console.log('📡 Making API call to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 API Response status:', response.status, response.statusText);
      const data = await response.json();
      console.log('📡 API Response data:', data);

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message || `Vendor ${vendorName} removed from your coordination successfully`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Refresh the vendors data to reflect the removal
        fetchVendors();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to remove vendor',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error removing vendor:', error);
      toast({
        title: 'Error',
        description: 'Network error occurred while removing vendor',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setRemovingVendors(prev => {
        const newSet = new Set(prev);
        newSet.delete(vendorId);
        return newSet;
      });
    }
  };

  // Fetch real vendors data from API
  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page, limit, sortBy, sortOrder, search: debouncedSearch,
      }).toString();

      const res = await fetch(`${url}/api/coordinator/vendors/paginated?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch vendors');
      const data = await res.json();

      let filteredVendors = data.data || [];
      
      // Apply client-side filtering based on viewType
      switch (viewType) {
        case 'my':
          // Show only vendors assigned to current coordinator
          // Note: This would need the current coordinator ID from JWT token
          // For now, we'll filter vendors that have any coordinator assigned
          filteredVendors = filteredVendors.filter(v => v.coordinator_id !== null);
          break;
        case 'unassigned':
          // Show only vendors without coordinator
          filteredVendors = filteredVendors.filter(v => v.coordinator_id === null);
          break;
        case 'all':
        default:
          // Show all vendors (no additional filtering needed)
          break;
      }

      setVendors(filteredVendors);
      const serverTotal = data.total ?? data.totalCount ?? data.count ?? (Array.isArray(data.data) ? data.data.length : 0);
      setTotalCount(serverTotal);
    } catch (e) {
      console.error('Failed to fetch vendors:', e);
      setVendors([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, debouncedSearch, token, url, viewType]);

  useEffect(() => {
    if (token) fetchVendors();
  }, [fetchVendors, token]);

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
      { key: 'status', label: 'Status' },
      { key: 'percentage', label: 'Commission %' },
      { key: 'wallet_balance', label: 'Wallet' },
      { key: 'created_at', label: 'Joined' },
      ...((viewType === 'unassigned' || viewType === 'my') ? [{ key: 'actions', label: 'Actions' }] : []),
    ], [viewType]
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
      // Fetch all vendors for CSV export
      const res = await fetch(`${url}/api/coordinator/vendors/paginated?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch CSV data');
      const data = await res.json();
      setCsvData(data.data || []);
    } catch (e) { 
      console.error('Failed to fetch CSV data:', e);
      setCsvData(vendors); // Fallback to current page data
    }
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

  // Get tab title based on viewType
  const getTabTitle = () => {
    switch (viewType) {
      case 'my': return 'My Vendors';
      case 'unassigned': return 'Unassigned Vendors';
      case 'all':
      default: return 'All Vendors';
    }
  };

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
        <Text fontSize="xl" fontWeight="bold">{getTabTitle()}</Text>
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
            <CSVLink data={csvData} filename={`vendors-${viewType}.csv`} target="_blank">
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
                      onClick={() => {
                        // Dummy function - no real navigation
                        alert(`View details for ${vendor.vendor_name}`);
                      }}
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
                      {viewType === 'unassigned' && (
                        <Td>
                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                assignVendor(vendor.id, vendor.vendor_name);
                              }}
                              isLoading={assigningVendors.has(vendor.id)}
                              loadingText="Assigning..."
                            >
                              Assign
                            </Button>
                          </HStack>
                        </Td>
                      )}
                      {viewType === 'my' && (
                        <Td>
                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeVendor(vendor.id, vendor.vendor_name);
                              }}
                              isLoading={removingVendors.has(vendor.id)}
                              loadingText="Removing..."
                            >
                              Remove
                            </Button>
                          </HStack>
                        </Td>
                      )}
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
                  onClick={() => {
                    // Dummy function - no real navigation
                    alert(`View details for ${vendor.vendor_name}`);
                  }}
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
                            Coordinator: {vendor.coordinator_name || 'No Coordinator'}
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

                    {/* Action Button for Unassigned view */}
                    {viewType === 'unassigned' && (
                      <Flex justify="center" pt={2}>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            assignVendor(vendor.id, vendor.vendor_name);
                          }}
                          isLoading={assigningVendors.has(vendor.id)}
                          loadingText="Assigning..."
                          w="100%"
                        >
                          Assign to Me
                        </Button>
                      </Flex>
                    )}

                    {/* Action Button for My Vendors view */}
                    {viewType === 'my' && (
                      <Flex justify="center" pt={2}>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeVendor(vendor.id, vendor.vendor_name);
                          }}
                          isLoading={removingVendors.has(vendor.id)}
                          loadingText="Removing..."
                          w="100%"
                        >
                          Remove from My Coordination
                        </Button>
                      </Flex>
                    )}
                  </VStack>
                </Box>
              );
            })}
          </VStack>
        </>
      )}

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

export default CoordinatorVendorsTable;
