import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, Heading, Button, useToast, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td,
  useDisclosure, useColorModeValue, Text, Badge, HStack, InputGroup, InputLeftElement, Input, IconButton, Tooltip
} from '@chakra-ui/react';
import { AddIcon, SearchIcon } from '@chakra-ui/icons';
import { FaWhatsapp } from 'react-icons/fa';
import { useAuth } from '../../AppContext';

// Import the InvestorModal component (exact copy from admin page)
import InvestorModal from './InvestorModal';

const MyInvestors = ({ url }) => {
  const { token } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure(); // For Add Investor Modal

  const [investors, setInvestors] = useState([]);
  const [filteredInvestors, setFilteredInvestors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [coordinators, setCoordinators] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Color mode values
  const tableBg = useColorModeValue('white', 'gray.800');

  // Fetch coordinators for dropdown
  const fetchCoordinators = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${url}/api/coordinator`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCoordinators(data.coordinators || []);
      } else {
        throw new Error('Failed to fetch coordinators');
      }
    } catch (error) {
      console.error('Error fetching coordinators:', error);
      toast({
        title: 'Error fetching coordinators',
        description: error.message,
        status: 'error',
        isClosable: true
      });
    }
  }, [token, url, toast]);

  // Load real data from API
  const loadInvestors = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${url}/api/coordinator/investors/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch investors');
      }

      const result = await response.json();
      if (result.success) {
        setInvestors(result.data.investors || []);
        setFilteredInvestors(result.data.investors || []);
      }
    } catch (error) {
      console.error('Error loading investors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load investors',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setInvestors([]);
    } finally {
      setIsLoading(false);
    }
  }, [url, token, toast]);

  useEffect(() => {
    loadInvestors();
    fetchCoordinators();
  }, [loadInvestors, fetchCoordinators]);

  // Search filtering effect
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredInvestors(investors);
    } else {
      const filtered = investors.filter(investor => 
        investor.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.mobile_number?.includes(searchTerm) ||
        investor.id?.toString().includes(searchTerm) ||
        investor.coordinator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.plan_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.approval_status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredInvestors(filtered);
    }
  }, [searchTerm, investors]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleAdd = () => {
    onOpen();
  };

  const handleSave = async (formData) => {
    try {
      const apiUrl = `${url}/api/investors`;
      
      // For coordinators creating new investors, don't send coordinator_id
      // The backend will automatically assign the investor to the current coordinator
      const requestData = { ...formData };
      if (!formData.coordinator_id) {
        // Remove coordinator_id from request if not provided (coordinator will be auto-assigned)
        delete requestData.coordinator_id;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save investor');

      toast({
        title: 'Investor Added',
        description: 'Investor has been added successfully and is pending admin approval',
        status: 'success',
        isClosable: true,
      });

      // DON'T auto-open HTML report for new investors
      // The HTML will only be accessible after admin approval

      loadInvestors();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        isClosable: true,
      });
      throw error;
    }
  };


  const handleViewHTML = (investor) => {
    // Check if investor is approved
    if (investor.approval_status !== 'approved') {
      toast({
        title: 'Access Denied',
        description: 'This investment has not been approved yet. Please wait for admin approval.',
        status: 'warning',
        isClosable: true,
        duration: 5000,
      });
      return;
    }

    console.log('🌐 Opening HTML report for investor:', {
      investorId: investor.id,
      investorName: `${investor.first_name}`
    });

    const htmlUrl = `${url}/api/html/investor/${investor.id}`;
    console.log('🌐 Opening HTML URL:', htmlUrl);

    // Open HTML report in new window with print parameter
    const printUrl = `${htmlUrl}?print=true`;
    window.open(printUrl, '_blank');

    toast({
      title: 'HTML Report Opened',
      description: `Investor report for ${investor.first_name} has been opened`,
      status: 'success',
      isClosable: true,
      duration: 3000,
    });
  };

  const handleWhatsAppClick = (investor) => {
    const phoneNumber = investor.mobile_number?.replace(/\D/g, '') || '';
    const fullPhoneNumber = `91${phoneNumber}`;
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=${fullPhoneNumber}&type=phone_number&app_absent=0`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      {/* Action buttons and search */}
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <HStack spacing={4}>
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleAdd}>
            Add Investor
          </Button>
        </HStack>
        
        {/* Search bar */}
        <Box minW={{ base: 'full', md: '300px' }}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search investors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg={useColorModeValue('white', 'gray.700')}
              borderColor={useColorModeValue('gray.300', 'gray.600')}
            />
          </InputGroup>
        </Box>
      </Flex>

      {/* Investors Table */}
      {isLoading ? (
        <Center py={8}>
          <Spinner size="xl" />
        </Center>
      ) : (
        <Box bg={tableBg} borderRadius="lg" overflow="hidden" boxShadow="sm">
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>ID</Th>
                <Th>Name</Th>
                <Th>Mobile</Th>
                <Th>Coordinator</Th>
                <Th>Plan Type</Th>
                <Th>Investment Date</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredInvestors.map((investor) => (
                <Tr key={investor.id}>
                  <Td fontFamily="monospace" fontSize="sm">
                    {investor.id}
                  </Td>
                  <Td fontWeight="medium">
                    {investor.first_name}
                  </Td>
                  <Td>{investor.mobile_number}</Td>
                  <Td>{investor.coordinator || 'N/A'}</Td>
                  <Td>
                    <Badge colorScheme="blue">
                      {investor.plan_type || 'N/A'} - {investor.select_plan || 'N/A'}
                    </Badge>
                  </Td>
                  <Td>{formatDate(investor.investment_date)}</Td>
                  <Td>
                    <Badge 
                      colorScheme={
                        investor.approval_status === 'approved' ? 'green' :
                        investor.approval_status === 'rejected' ? 'red' : 'yellow'
                      }
                      variant="solid"
                    >
                      {investor.approval_status || 'pending'}
                    </Badge>
                  </Td>
                  <Td>{formatDate(investor.created_at)}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <Tooltip label="Contact on WhatsApp" hasArrow>
                        <IconButton
                          aria-label="Contact on WhatsApp"
                          icon={<FaWhatsapp />}
                          size="sm"
                          colorScheme="whatsapp"
                          variant="ghost"
                          onClick={() => handleWhatsAppClick(investor)}
                        />
                      </Tooltip>
                      <Button
                        size="sm"
                        colorScheme="green"
                        variant="outline"
                        onClick={() => handleViewHTML(investor)}
                        isDisabled={investor.approval_status !== 'approved'}
                        title={investor.approval_status !== 'approved' ? 'Investment not approved yet' : 'View HTML Report'}
                      >
                        View HTML
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Add Investor Modal */}
      <InvestorModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSave}
        investor={null}
        isEditing={false}
        coordinators={coordinators}
        url={url}
        token={token}
      />

    </>
  );
};

export default MyInvestors;
