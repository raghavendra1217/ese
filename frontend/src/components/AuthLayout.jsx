// src/components/AuthLayout.jsx

import React from 'react';
import { Box } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom'; // Import Outlet
import NavBar from './NavBar';

const AuthLayout = () => {
  return (
    <Box>
      <NavBar />
      {/* The main content area where pages will be rendered */}
      {/* We add a left margin to prevent content from going under the NavBar */}
      <Box ml="80px" p={4}>
        <Outlet /> {/* Child routes render here */}
      </Box>
    </Box>
  );
};

export default AuthLayout;