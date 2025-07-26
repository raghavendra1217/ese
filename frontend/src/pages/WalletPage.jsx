import React from 'react';
import { Box, Heading, Text, Flex, useColorModeValue } from '@chakra-ui/react';
import VendorNavBar from '../components/VendorNavBar'; // If you're using sidebar layout

const WalletPage = () => {
  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.700');

  return (
    <Flex minH="100vh" bg={bg}>
      <VendorNavBar />
      <Box flex="1" ml="80px" p={8}>
        <Heading mb={4}>📒 Wallet</Heading>
        <Box bg={cardBg} p={6} borderRadius="lg" shadow="md">
          <Text>This is your wallet overview. Soon you'll see your investments, profits, and returns here.</Text>
        </Box>
      </Box>
    </Flex>
  );
};

export default WalletPage;
