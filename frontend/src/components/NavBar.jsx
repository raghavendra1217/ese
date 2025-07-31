import React from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { VStack, Button, IconButton, Spacer, Tooltip, Box, Divider } from '@chakra-ui/react';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';
import { useAuth } from '../AppContext';
import ThemeToggle from './ThemeToggle';

import {
    FaUserShield, FaCheckDouble, FaBoxOpen, FaStore, FaUserTie,
    FaSignInAlt, FaUserPlus, FaPowerOff
} from 'react-icons/fa';

// --- Reusable Icon Component (same as in AdminNavBar) ---
// This makes each navigation item consistent
const SidebarIcon = ({ icon, label, to = "#", onClick, active = false, colorScheme = 'blue' }) => (
    <Tooltip label={label} placement="right" hasArrow>
        <Button
            as={to !== "#" ? RouterLink : 'button'}
            to={to}
            onClick={onClick}
            justifyContent="center"
            w="full"
            py={6}
            variant={active ? 'solid' : 'ghost'}
            colorScheme={active ? colorScheme : 'gray'}
            color={active ? 'white' : 'gray.400'}
            _hover={{ bg: 'gray.700', color: 'white' }}
            aria-label={label}
        >
            {icon}
        </Button>
    </Tooltip>
);


const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define links for different roles to keep the JSX cleaner
  const adminLinks = [
    { icon: <FaUserShield size={22} />, label: "Admin Dashboard", to: "/admin/dashboard", colorScheme: 'blue' },
    { icon: <FaCheckDouble size={20} />, label: "Approvals", to: "/admin/manage-approvals", colorScheme: 'blue' },
    { icon: <FaBoxOpen size={20} />, label: "Products", to: "/admin/manage-products", colorScheme: 'blue' }
  ];

  const vendorLinks = [
    { icon: <FaStore size={22} />, label: "Vendor Dashboard", to: "/vendor/dashboard", colorScheme: 'teal' },
    { icon: <FaBoxOpen size={20} />, label: "My Products", to: "/vendor/products", colorScheme: 'teal' }
  ];

  const employeeLinks = [
    { icon: <FaUserTie size={22} />, label: "Employee Dashboard", to: "/employee/dashboard", colorScheme: 'green' }
  ];

  const guestLinks = [
    { icon: <FaSignInAlt size={22} />, label: "Login", to: "/login", colorScheme: 'teal' },
    { icon: <FaUserPlus size={22} />, label: "Register", to: "/register", colorScheme: 'teal', activePaths: ['/register', '/payment'] }
  ];


  return (
    
    <VStack
      as="nav"
      h="100vh"
      w="80px"
      position="fixed"
      left={0}
      top={0}
      bg="gray.900" // Using fixed dark theme for consistency
      boxShadow="md"
      spacing={2} // Reduced spacing for a tighter look
      py={6}
      zIndex={10}
    >
      {/* Logo/Home Button */}
      <Tooltip label="Home" placement="right" hasArrow>
        <Box as={RouterLink} to="/" boxSize="40px" bg="teal.400" borderRadius="md" cursor="pointer" mb={4} _hover={{ opacity: 0.9 }}/>
      </Tooltip>
      
      {/* Role-based navigation */}
      {user ? (
        <>
          {user.role === 'admin' && adminLinks.map(link => (
            <SidebarIcon key={link.to} {...link} active={location.pathname === link.to} />
          ))}
          {user.role === 'vendor' && vendorLinks.map(link => (
            <SidebarIcon key={link.to} {...link} active={location.pathname === link.to} />
          ))}
          {user.role === 'employee' && employeeLinks.map(link => (
            <SidebarIcon key={link.to} {...link} active={location.pathname === link.to} />
          ))}
          
          <Spacer />

          {/* Logout Button */}
          <SidebarIcon icon={<FaPowerOff />} label="Logout" onClick={handleLogout} colorScheme="red" />
        </>
      ) : (
        <>
          {/* Guest (Logged Out) Links */}
          {guestLinks.map(link => (
             <SidebarIcon 
                key={link.to} 
                {...link} 
                active={link.activePaths ? link.activePaths.includes(location.pathname) : location.pathname === link.to} 
             />
          ))}
        </>
      )}

      <Spacer />
      <Divider borderColor="gray.700" />

      {/* Color Mode Toggle - Kept for utility */}
      <Tooltip label="Toggle Theme" placement="right" hasArrow>
       <Box w="full">
     <ThemeToggle />
  </Box>
</Tooltip>

    </VStack>
  );
};

export default NavBar;