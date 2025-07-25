// src/components/NavBar.jsx

import React from 'react';
import { VStack, Button, IconButton, useColorMode, Spacer, Divider, useColorModeValue, Box } from '@chakra-ui/react';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';
import { useAuth } from '../AppContext';
import { useNavigate, useLocation } from 'react-router-dom';

const NavBar = () => {
  const { user, logout } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const location = useLocation();

  const navBg = useColorModeValue('gray.800', 'white');
  const navItemColor = useColorModeValue('gray.300', 'gray.600');
  const hoverBg = useColorModeValue('whiteAlpha.400', 'blackAlpha.200');
  const activeBg = useColorModeValue('whiteAlpha.300', 'blackAlpha.200');
  const dividerColor = useColorModeValue('whiteAlpha.400', 'blackAlpha.400');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <VStack
      as="nav"
      h="100vh"
      w="80px"
      position="fixed"
      left={0}
      top={0}
      bg={navBg}
      boxShadow="md"
      spacing={6}
      py={6}
      zIndex={10}
    >
      <Box boxSize="40px" bg="teal.400" borderRadius="md" onClick={() => navigate('/')} cursor="pointer" />
      <Divider borderColor={dividerColor} />

      {user ? (
        <>
          {/* Role-based navigation */}
          {user.role === 'admin' && (
            <>
              <Button onClick={() => navigate('/admin/dashboard')} variant={location.pathname === '/admin/dashboard' ? 'solid' : 'ghost'} colorScheme="blue" h="120px" sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} aria-label="Admin Dashboard" color={navItemColor} _hover={{ bg: hoverBg }} _active={{ bg: activeBg }}>Admin</Button>
              <Button onClick={() => navigate('/admin/manage-approvals')} variant={location.pathname === '/admin/manage-approvals' ? 'solid' : 'ghost'} colorScheme="blue" h="120px" sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} aria-label="Approvals" color={navItemColor} _hover={{ bg: hoverBg }} _active={{ bg: activeBg }}>Approvals</Button>
              <Button onClick={() => navigate('/admin/manage-products')} variant={location.pathname === '/admin/manage-products' ? 'solid' : 'ghost'} colorScheme="blue" h="120px" sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} aria-label="Products" color={navItemColor} _hover={{ bg: hoverBg }} _active={{ bg: activeBg }}>Products</Button>
            </>
          )}
          {user.role === 'vendor' && (
            <>
              <Button onClick={() => navigate('/vendor/dashboard')} variant={location.pathname === '/vendor/dashboard' ? 'solid' : 'ghost'} colorScheme="teal" h="120px" sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} aria-label="Vendor Dashboard" color={navItemColor} _hover={{ bg: hoverBg }} _active={{ bg: activeBg }}>Vendor</Button>
              <Button onClick={() => navigate('/vendor/products')} variant={location.pathname === '/vendor/products' ? 'solid' : 'ghost'} colorScheme="teal" h="120px" sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} aria-label="Products" color={navItemColor} _hover={{ bg: hoverBg }} _active={{ bg: activeBg }}>Products</Button>
            </>
          )}
          {user.role === 'employee' && (
            <Button onClick={() => navigate('/employee/dashboard')} variant={location.pathname === '/employee/dashboard' ? 'solid' : 'ghost'} colorScheme="green" h="120px" sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} aria-label="Employee Dashboard" color={navItemColor} _hover={{ bg: hoverBg }} _active={{ bg: activeBg }}>Employee</Button>
          )}
          <Spacer />
          <Button onClick={handleLogout} colorScheme="red" w="100%" variant="ghost" color="red.400" _hover={{ bg: hoverBg }} _active={{ bg: activeBg }}>Logout</Button>
        </>
      ) : (
        <>
          <Button onClick={() => navigate('/login')} variant={location.pathname === '/login' ? 'solid' : 'ghost'} colorScheme="teal" h="120px" sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} aria-label="Login" color={navItemColor} _hover={{ bg: hoverBg }} _active={{ bg: activeBg }}>Login</Button>
          <Button onClick={() => navigate('/register')} variant={['/register', '/payment'].includes(location.pathname) ? 'solid' : 'ghost'} colorScheme="teal" h="120px" sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} aria-label="Register" color={navItemColor} _hover={{ bg: hoverBg }} _active={{ bg: activeBg }}>Register</Button>
        </>
      )}

      {!user && <Spacer />}

      <IconButton aria-label="Toggle color mode" icon={colorMode === 'light' ? <SunIcon /> : <MoonIcon />} onClick={toggleColorMode} variant="ghost" color={navItemColor} _hover={{ bg: hoverBg }} _active={{ bg: activeBg }} />
    </VStack>
  );
};

export default NavBar;