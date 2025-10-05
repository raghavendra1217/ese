import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, Heading, Button, useToast, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td,
  useDisclosure, useColorModeValue, Text, Badge, HStack
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';

// Import the InvestorModal component (exact copy from admin page)
import InvestorModal from './InvestorModal';

const MyInvestors = ({ url }) => {
  const { token } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure(); // For Add Investor Modal

  const [investors, setInvestors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [coordinators, setCoordinators] = useState([]);

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
        description: 'Investor has been added successfully',
        status: 'success',
        isClosable: true,
      });

      // Auto-open HTML report for new investors
      if (data.investor?.id) {
        console.log('🌐 Opening HTML report for investor:', {
          investorId: data.investor.id,
          investorName: `${data.investor.first_name}`
        });

        const htmlUrl = `${url}/api/html/investor/${data.investor.id}`;
        console.log('🌐 Opening HTML URL:', htmlUrl);

        // Open HTML report in new window with print parameter
        const printUrl = `${htmlUrl}?print=true`;
        window.open(printUrl, '_blank');

        toast({
          title: 'HTML Report Opened',
          description: 'Investor report has been opened and print dialog triggered',
          status: 'success',
          isClosable: true,
          duration: 3000,
        });
      }

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

  return (
    <>
      {/* Action buttons */}
      <Flex justify="space-between" align="center" mb={6}>
        <HStack spacing={4}>
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleAdd}>
            Add Investor
          </Button>
        </HStack>
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
                <Th>Created</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {investors.map((investor) => (
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
                  <Td>{formatDate(investor.created_at)}</Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="green"
                      variant="outline"
                      onClick={() => handleViewHTML(investor)}
                    >
                      View HTML
                    </Button>
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
