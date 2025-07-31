import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import ThemeToggle from './ThemeToggle';

const AuthLayout = () => {
  return (
    <Box>
      {/* Fixed Sidebar (Nav + Theme Toggle) */}
      <Box position="fixed" top="0" left="0" h="100vh" w="80px" bg="gray.900" color="white">
        <Flex direction="column" justify="space-between" h="100%">
          <NavBar />
          <Box p={2}>
            <ThemeToggle />
          </Box>
        </Flex>
      </Box>

      {/* Main content area with left margin for sidebar */}
      <Box ml="80px" p={4}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default AuthLayout;
