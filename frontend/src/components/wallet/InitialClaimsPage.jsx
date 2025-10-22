// src/components/wallet/InitialClaimsPage.js

import React, { useState, useEffect, useCallback } from 'react';
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
  Tag,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

const InitialClaimsPage = ({ url, cardBg, pageBg }) => {
  const [referralData, setReferralData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(null); // Tracks which user ID is being claimed
  const { token } = useAuth();
  const toast = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${url}/api/vendor/referred-list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch referral data' }));
        throw new Error(errorData.message);
      }
      const data = await response.json();
      setReferralData(data);
    } catch (error) {
      toast({ title: 'Fetch Error', description: error.message, status: 'error' });
      setReferralData({ allReferredUsers: [], claimedReferralIds: [] }); // Set default on error
    } finally {
      setIsLoading(false);
    }
  }, [token, url, toast]);

  useEffect(() => {
    if (token) fetchData();
  }, [token, fetchData]);

  const handleClaim = async (referralId) => {
    setIsClaiming(referralId);
    try {
      const response = await fetch(`${url}/api/vendor/claim-referral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ referralId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to claim referral.');
      toast({ title: 'Success', description: data.message, status: 'success' });
      await fetchData(); // Refresh data after successful claim
    } catch (error) {
      toast({ title: 'Claim Error', description: error.message, status: 'error' });
    } finally {
      setIsClaiming(null);
    }
  };

  if (isLoading) {
    return <Center p={10}><Spinner color="purple.400" size="xl" /></Center>;
  }

  // Memoize derived data for performance
  const claimedIdsSet = new Set(referralData?.claimedReferralIds || []);
  const unclaimedUsers = referralData?.allReferredUsers.filter((u) => !claimedIdsSet.has(u.id)) || [];
  const readyToClaim = unclaimedUsers.filter((u) => u.is_approved === true);
  const pendingApproval = unclaimedUsers.filter((u) => u.is_approved !== true);
  const claimedHistory = referralData?.allReferredUsers.filter((u) => claimedIdsSet.has(u.id)) || [];

  return (
    <Box bg={cardBg} p={6} borderRadius="lg" shadow="md" maxW="100%">
      <Heading size="lg" color="purple.300" mb={6}>Initial Referral Claims</Heading>
      <VStack spacing={8} align="stretch">
        
        {/* Approved & Ready to Claim */}
        <Box>
          <Heading size="md" mb={4} color="gray.300">Approved Referrals</Heading>
          {readyToClaim.length > 0 ? (
            <VStack spacing={3} align="stretch">
              {readyToClaim.map((user) => (
                <Flex
                  key={user.id}
                  direction={{ base: 'column', sm: 'row' }}
                  bg={pageBg}
                  p={4}
                  borderRadius="md"
                  justify="space-between"
                  align={{ base: 'start', sm: 'center' }}
                >
                  <VStack align="start" spacing={0} mb={{ base: 2, sm: 0 }}>
                    <Text fontWeight="semibold">{user.name}</Text>
                    <Text color="gray.500" fontSize="sm">ID: {user.id}</Text>
                  </VStack>
                  <Button
                    colorScheme="green"
                    isLoading={isClaiming === user.id}
                    onClick={() => handleClaim(user.id)}
                  >
                    Claim Bonus
                  </Button>
                </Flex>
              ))}
            </VStack>
          ) : (
            <Alert status="info" bg={pageBg} borderRadius="md">
              <AlertIcon />
              No approved referrals.
            </Alert>
          )}
        </Box>

        {/* Pending Approval */}
        <Box>
          <Heading size="md" mb={4} color="gray.300"> Pending Referrals</Heading>
          {pendingApproval.length > 0 ? (
            <VStack spacing={3} align="stretch">
              {pendingApproval.map((user) => (
                <Flex key={user.id} bg={pageBg} p={3} borderRadius="md" justify="space-between" align="center">
                  <Text fontWeight="semibold">{user.name}</Text>
                  <Tag colorScheme="yellow">Pending</Tag>
                </Flex>
              ))}
            </VStack>
          ) : (
            <Text color="gray.500">No pending Referrals.</Text>
          )}
        </Box>

        {/* Claimed History */}
        <Box>
          <Heading size="md" mb={4} color="gray.300">Claimed Referrals History</Heading>
          {claimedHistory.length > 0 ? (
            <VStack spacing={3} align="stretch">
              {claimedHistory.map((user) => (
                <Flex key={user.id} bg={pageBg} p={3} borderRadius="md" justify="space-between" align="center">
                  <Text fontWeight="semibold">{user.name}</Text>
                  <Tag colorScheme="purple">Claimed</Tag>
                </Flex>
              ))}
            </VStack>
          ) : (
            <Text color="gray.500">You have not claimed any signup bonuses yet.</Text>
          )}
        </Box>
      </VStack>
    </Box>
  );
};


export default InitialClaimsPage;