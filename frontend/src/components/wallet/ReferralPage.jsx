

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Flex,
  Spinner,
  Center,
  useToast,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Alert,
  AlertIcon,
  useColorModeValue,
  TableContainer,
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) amount = 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const ReferralPage = ({ url }) => {
  const [unclaimedTrades, setUnclaimedTrades] = useState([]);
  const [claimedHistory, setClaimedHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [activeTab, setActiveTab] = useState('unclaimed'); // 'unclaimed' or 'history'
  const { token } = useAuth();
  const toast = useToast();

  // --- LOGIC (UNCHANGED) ---
  const fetchUnclaimedTrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${url}/api/vendor/unclaimed-commissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch earnings data' }));
        throw new Error(errorData.message);
      }
      const data = await response.json();
      setUnclaimedTrades(data);
    } catch (error) {
      toast({ title: 'Fetch Error', description: error.message, status: 'error' });
      setUnclaimedTrades([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, url, toast]);

  const fetchClaimedHistory = useCallback(async () => {
    try {
      const response = await fetch(`${url}/api/vendor/claimed-commissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch history data' }));
        throw new Error(errorData.message);
      }
      const data = await response.json();
      setClaimedHistory(data);
    } catch (error) {
      toast({ title: 'History Fetch Error', description: error.message, status: 'error' });
      setClaimedHistory([]);
    }
  }, [token, url, toast]);

  useEffect(() => {
    if (token) {
      fetchUnclaimedTrades();
      fetchClaimedHistory();
    }
  }, [token, fetchUnclaimedTrades, fetchClaimedHistory]);

  const handleClaimAll = async () => {
    setIsClaiming(true);
    try {
      const response = await fetch(`${url}/api/vendor/claim-all-commissions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to claim commissions.');
      
      toast({ title: 'Success!', description: data.message, status: 'success', duration: 5000 });
      await Promise.all([fetchUnclaimedTrades(), fetchClaimedHistory()]);
    } catch (error) {
      toast({ title: 'Claim Error', description: error.message, status: 'error' });
    } finally {
      setIsClaiming(false);
    }
  };

  const totalClaimable = useMemo(() => {
    return unclaimedTrades.reduce((acc, trade) => {
      const earning = trade.total_amount_paid * (trade.percentage / 100);
      return acc + earning;
    }, 0);
  }, [unclaimedTrades]);


  // --- STYLING ---
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('purple.600', 'purple.300');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const accentGreen = useColorModeValue('green.500', 'green.300');
  // ✅ THE FIX IS HERE: Corrected the typo from useColorMdeValue to useColorModeValue
  const borderColor = useColorModeValue('gray.200', 'gray.700'); 
  const alertBg = useColorModeValue('blue.50', 'blue.900');

  if (isLoading) {
    return <Center p={10} minH="300px"><Spinner color="purple.500" size="xl" /></Center>;
  }

  return (
    <Box bg={pageBg} p={{ base: 2, md: 4 }} minH="100vh">
        <Box 
            bg={cardBg} 
            p={{ base: 4, md: 6 }} 
            borderRadius="xl" 
            shadow="lg"
            w={{ base: '100%', lg: '80%' }}
            mx="auto"
        >
            <VStack spacing={8} align="stretch">
                <Flex
                    direction={{ base: 'column', md: 'row' }}
                    justify="space-between"
                    align={{ base: 'stretch', md: 'center' }}
                    p={5}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={borderColor}
                >
                    <Heading size="lg" color={headingColor} mb={{ base: 4, md: 0 }}>
                        Referral Earnings
                    </Heading>
                    <VStack align={{ base: 'start', md: 'end' }} spacing={1}>
                        <Text fontSize="md" color={textColor}>Total Claimable Amount</Text>
                        <Text fontSize="3xl" fontWeight="bold" color={accentGreen}>
                            {formatCurrency(totalClaimable)}
                        </Text>
                    </VStack>
                </Flex>

                <Box>
                    <Button
                        colorScheme="green"
                        onClick={handleClaimAll}
                        isLoading={isClaiming}
                        isDisabled={isLoading || unclaimedTrades.length === 0}
                        w={{ base: 'full', md: 'auto' }}
                        size="lg"
                    >
                        Claim All Earnings
                    </Button>
                </Box>

                {/* Tab Navigation */}
                <Flex borderBottom="1px" borderColor={borderColor}>
                    <Button
                        variant={activeTab === 'unclaimed' ? 'solid' : 'ghost'}
                        colorScheme="purple"
                        onClick={() => setActiveTab('unclaimed')}
                        borderRadius="0"
                        borderBottom="2px"
                        borderColor={activeTab === 'unclaimed' ? 'purple.500' : 'transparent'}
                    >
                        Unclaimed ({unclaimedTrades.length})
                    </Button>
                    <Button
                        variant={activeTab === 'history' ? 'solid' : 'ghost'}
                        colorScheme="purple"
                        onClick={() => setActiveTab('history')}
                        borderRadius="0"
                        borderBottom="2px"
                        borderColor={activeTab === 'history' ? 'purple.500' : 'transparent'}
                    >
                        History ({claimedHistory.length})
                    </Button>
                </Flex>

                <VStack spacing={4} align="stretch">
                    {activeTab === 'unclaimed' ? (
                        <>
                            <Heading size="md" color={textColor}>Unclaimed Commissions</Heading>
                            
                            {unclaimedTrades.length > 0 ? (
                                <>
                                    <TableContainer display={{ base: 'none', md: 'block' }}>
                                        <Table variant="simple" size="md">
                                            <Thead>
                                                <Tr>
                                                    <Th>Purchaser</Th>
                                                    <Th>Date</Th>
                                                    <Th isNumeric>Purchase Amount</Th>
                                                    <Th isNumeric>Your %</Th>
                                                    <Th isNumeric>Your Earning</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {unclaimedTrades.map((trade) => (
                                                    <Tr key={trade.trade_id}>
                                                        <Td fontWeight="medium">{trade.purchaser_name}</Td>
                                                        <Td>{formatDate(trade.date)}</Td>
                                                        <Td isNumeric>{formatCurrency(trade.total_amount_paid)}</Td>
                                                        <Td isNumeric color="yellow.400">{trade.percentage}%</Td>
                                                        <Td isNumeric fontWeight="bold" color={accentGreen}>
                                                            {formatCurrency(trade.total_amount_paid * (trade.percentage / 100))}
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </TableContainer>

                                    <VStack spacing={4} display={{ base: 'flex', md: 'none' }}>
                                        {unclaimedTrades.map((trade) => (
                                            <Box key={trade.trade_id} w="100%" p={4} borderWidth="1px" borderRadius="lg" shadow="sm">
                                                <Flex justify="space-between" align="start">
                                                    <Text fontWeight="bold" fontSize="lg">{trade.purchaser_name}</Text>
                                                    <Text fontSize="sm" color={textColor}>{formatDate(trade.date)}</Text>
                                                </Flex>
                                                <VStack align="stretch" mt={4} spacing={2}>
                                                    <Flex justify="space-between">
                                                        <Text color={textColor}>Purchase:</Text>
                                                        <Text>{formatCurrency(trade.total_amount_paid)}</Text>
                                                    </Flex>
                                                    <Flex justify="space-between">
                                                        <Text color={textColor}>Your Rate:</Text>
                                                        <Text color="yellow.400">{trade.percentage}%</Text>
                                                    </Flex>
                                                    <Flex justify="space-between" fontWeight="bold" fontSize="lg" pt={2} borderTop="1px" borderColor="gray.700">
                                                        <Text>Your Earning:</Text>
                                                        <Text color={accentGreen}>{formatCurrency(trade.total_amount_paid * (trade.percentage / 100))}</Text>
                                                    </Flex>
                                                </VStack>
                                            </Box>
                                        ))}
                                    </VStack>
                                </>
                            ) : (
                                <Alert status="info" bg={alertBg} borderRadius="md" p={4}>
                                    <AlertIcon />
                                    You have no pending referral earnings to claim.
                                </Alert>
                            )}
                        </>
                    ) : (
                        <>
                            <Heading size="md" color={textColor}>Claimed Commissions History</Heading>
                            
                            {claimedHistory.length > 0 ? (
                                <>
                                    <TableContainer display={{ base: 'none', md: 'block' }}>
                                        <Table variant="simple" size="md">
                                            <Thead>
                                                <Tr>
                                                    <Th>Purchaser</Th>
                                                    <Th>Date</Th>
                                                    <Th isNumeric>Purchase Amount</Th>
                                                    <Th isNumeric>Your %</Th>
                                                    <Th isNumeric>Your Earning</Th>
                                                    <Th>Claimed Date</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {claimedHistory.map((trade) => (
                                                    <Tr key={trade.trade_id}>
                                                        <Td fontWeight="medium">{trade.purchaser_name}</Td>
                                                        <Td>{formatDate(trade.date)}</Td>
                                                        <Td isNumeric>{formatCurrency(trade.total_amount_paid)}</Td>
                                                        <Td isNumeric color="yellow.400">{trade.percentage}%</Td>
                                                        <Td isNumeric fontWeight="bold" color={accentGreen}>
                                                            {formatCurrency(trade.total_amount_paid * (trade.percentage / 100))}
                                                        </Td>
                                                        <Td>{formatDate(trade.claimed_date || trade.date)}</Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </TableContainer>

                                    <VStack spacing={4} display={{ base: 'flex', md: 'none' }}>
                                        {claimedHistory.map((trade) => (
                                            <Box key={trade.trade_id} w="100%" p={4} borderWidth="1px" borderRadius="lg" shadow="sm">
                                                <Flex justify="space-between" align="start">
                                                    <Text fontWeight="bold" fontSize="lg">{trade.purchaser_name}</Text>
                                                    <Text fontSize="sm" color={textColor}>{formatDate(trade.date)}</Text>
                                                </Flex>
                                                <VStack align="stretch" mt={4} spacing={2}>
                                                    <Flex justify="space-between">
                                                        <Text color={textColor}>Purchase:</Text>
                                                        <Text>{formatCurrency(trade.total_amount_paid)}</Text>
                                                    </Flex>
                                                    <Flex justify="space-between">
                                                        <Text color={textColor}>Your Rate:</Text>
                                                        <Text color="yellow.400">{trade.percentage}%</Text>
                                                    </Flex>
                                                    <Flex justify="space-between" fontWeight="bold" fontSize="lg" pt={2} borderTop="1px" borderColor="gray.700">
                                                        <Text>Your Earning:</Text>
                                                        <Text color={accentGreen}>{formatCurrency(trade.total_amount_paid * (trade.percentage / 100))}</Text>
                                                    </Flex>
                                                    <Flex justify="space-between" pt={2} borderTop="1px" borderColor="gray.700">
                                                        <Text color={textColor}>Claimed:</Text>
                                                        <Text color="green.500">{formatDate(trade.claimed_date || trade.date)}</Text>
                                                    </Flex>
                                                </VStack>
                                            </Box>
                                        ))}
                                    </VStack>
                                </>
                            ) : (
                                <Alert status="info" bg={alertBg} borderRadius="md" p={4}>
                                    <AlertIcon />
                                    You have no claimed referral earnings history.
                                </Alert>
                            )}
                        </>
                    )}
                </VStack>
            </VStack>
        </Box>
    </Box>
  );
};


export default ReferralPage;