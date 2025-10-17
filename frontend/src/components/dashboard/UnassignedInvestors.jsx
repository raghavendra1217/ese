import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, Button, IconButton, useToast, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td,
  useColorModeValue, Text, Badge, HStack
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

const UnassignedInvestors = ({ url }) => {
  const { token } = useAuth();
  const toast = useToast();

  const [investors, setInvestors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assigningInvestors, setAssigningInvestors] = useState(new Set());

  // Color mode values
  const tableBg = useColorModeValue('white', 'gray.800');

  // Assign investor to current coordinator
  const assignInvestor = async (investorId, investorName) => {
    if (assigningInvestors.has(investorId)) {
      return; // Prevent double-click
    }

    setAssigningInvestors(prev => new Set(prev).add(investorId));

    try {
      const response = await fetch(`${url}/api/coordinator/investors/assign/${investorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to assign investor');
      }

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Success',
          description: `Investor ${investorName} assigned to you successfully`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Remove from unassigned list
        setInvestors(prev => prev.filter(inv => inv.id !== investorId));
      } else {
        throw new Error(result.message || 'Failed to assign investor');
      }
    } catch (error) {
      console.error('Error assigning investor:', error);
      toast({
        title: 'Error',
        description: error.message || 'Network error occurred while assigning investor',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setAssigningInvestors(prev => {
        const newSet = new Set(prev);
        newSet.delete(investorId);
        return newSet;
      });
    }
  };

  // Load real data from API
  const loadInvestors = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${url}/api/coordinator/investors/unassigned`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unassigned investors');
      }

      const result = await response.json();
      if (result.success) {
        setInvestors(result.data.investors || []);
      }
    } catch (error) {
      console.error('Error loading unassigned investors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load unassigned investors',
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
  }, [loadInvestors]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <>
      {/* Unassigned Investors Table */}
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
                  <Td>{investor.coordinator || 'Unassigned'}</Td>
                  <Td>
                    <Badge colorScheme="blue">
                      {investor.plan_type || 'N/A'} - {investor.select_plan || 'N/A'}
                    </Badge>
                  </Td>
                  <Td>{formatDate(investor.investment_date)}</Td>
                  <Td>{formatDate(investor.created_at)}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => assignInvestor(investor.id, investor.first_name)}
                        isLoading={assigningInvestors.has(investor.id)}
                        loadingText="Assigning..."
                      >
                        Assign to Me
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </>
  );
};

export default UnassignedInvestors;
