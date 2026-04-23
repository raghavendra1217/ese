import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AppContext';
import { Box, VStack, Heading, Text, Spinner, Center } from '@chakra-ui/react';

const ErrorBoundary = ({ error, resetError }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If there's an error, automatically logout and redirect to login
    if (error) {
      console.error('Error boundary caught error:', error);
      
      // Wait a moment to show the error, then logout
      const timer = setTimeout(() => {
        logout();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [error, logout]);

  if (error) {
    return (
      <Center h="100vh">
        <Box textAlign="center" p={8}>
          <VStack spacing={6}>
            <Heading size="lg" color="red.500">
              Something went wrong
            </Heading>
            <Text>
              An error occurred while loading this page. You will be automatically logged out and redirected to login.
            </Text>
            <Spinner size="xl" color="blue.500" />
            <Text fontSize="sm" color="gray.500">
              Redirecting to login...
            </Text>
          </VStack>
        </Box>
      </Center>
    );
  }

  return null;
};

export default ErrorBoundary;
