import React, { useEffect } from 'react';
import { useAuth } from '../AppContext';
import { Box, VStack, Heading, Text, Spinner, Center } from '@chakra-ui/react';

const NotFound = () => {
  const { logout } = useAuth();

  useEffect(() => {
    // Automatically logout and redirect to login after showing the error
    const timer = setTimeout(() => {
      logout();
    }, 3000);

    return () => clearTimeout(timer);
  }, [logout]);

  return (
    <Center h="100vh">
      <Box textAlign="center" p={8}>
        <VStack spacing={6}>
          <Heading size="lg" color="red.500">
            Page Not Found
          </Heading>
          <Text>
            The page you're looking for doesn't exist. You will be automatically logged out and redirected to login.
          </Text>
          <Spinner size="xl" color="blue.500" />
          <Text fontSize="sm" color="gray.500">
            Redirecting to login in 3 seconds...
          </Text>
        </VStack>
      </Box>
    </Center>
  );
};

export default NotFound;
