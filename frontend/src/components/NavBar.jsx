// import React from 'react';
// import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
// import {
//   Box, Flex, VStack, Button, Tooltip, IconButton, Spacer, Divider,
//   Drawer, DrawerOverlay, DrawerContent, DrawerBody, useDisclosure, Text,Image,
// } from '@chakra-ui/react';
// import { HamburgerIcon } from '@chakra-ui/icons';
// import { useAuth } from '../AppContext';
// import ThemeToggle from './ThemeToggle';
// import {
//   FaUserShield, FaStore, FaUserTie,
//   FaSignInAlt, FaUserPlus, FaPowerOff
// } from 'react-icons/fa';

// // --- Define widths for a single source of truth ---
// const DESKTOP_SIDEBAR_WIDTH = "220px";
// const MOBILE_SIDEBAR_WIDTH = "60px";

// // --- Helper: The content inside the navigation bar (links, buttons, etc.) ---
// const NavContent = ({ onLinkClick }) => {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//     if (onLinkClick) onLinkClick();
//   };

//   const links = {
//     admin: [{ icon: <FaUserShield size={20} />, label: "Admin Dashboard", to: "/admin/dashboard" }],
//     vendor: [{ icon: <FaStore size={20} />, label: "Vendor Dashboard", to: "/vendor/dashboard" }],
//     employee: [{ icon: <FaUserTie size={20} />, label: "Employee Dashboard", to: "/employee/dashboard" }],
//     guest: [
//       { icon: <FaSignInAlt size={18} />, label: "Login", to: "/login" },
//       { icon: <FaUserPlus size={18} />, label: "Register", to: "/register" }
//     ]
//   };

//   const userLinks = user ? (links[user.role] || []) : links.guest;

//   return (
//     <VStack h="full" w="full" spacing={2} py={4} align="stretch">

//       {/* <Box px={4} pb={4} as={RouterLink} to="/" onClick={onLinkClick}>
//           <Image src="https://pub-8f7d5f81a3294be18dbe97ddb794a4ae.r2.dev/Esepaper.jpg" alt="Esepaper Logo" h="40px" objectFit="contain" />
//       </Box> */}


//       {userLinks.map(link => (
//         <Button
//           key={link.to}
//           as={RouterLink}
//           to={link.to}
//           onClick={onLinkClick}
//           justifyContent="flex-start"
//           w="full"
//           py={6}
//           px={4}
//           variant="ghost"
//           leftIcon={link.icon}
//           color={location.pathname.startsWith(link.to) ? 'blue.300' : 'gray.400'}
//           bg={location.pathname.startsWith(link.to) ? 'rgba(66, 153, 225, 0.1)' : 'transparent'}
//           _hover={{ bg: 'gray.700', color: 'white' }}
//         >
//           {link.label}
//         </Button>
//       ))}
//       <Spacer />
//       {user && (
//         <Button
//           onClick={handleLogout}
//           justifyContent="flex-start"
//           w="full"
//           py={6}
//           px={4}
//           variant="ghost"
//           leftIcon={<FaPowerOff />}
//           color='gray.400'
//           _hover={{ bg: 'red.900', color: 'white' }}
//         >
//           Logout
//         </Button>
//       )}
//       <Divider w="80%" alignSelf="center" borderColor="gray.700" my={2} />
//       <Box w="full" px={4} py={2}>
//         <ThemeToggle />
//       </Box>
//     </VStack>
//   );
// };

// const AppLayout = ({ children }) => {
//   const { isOpen, onOpen, onClose } = useDisclosure();
//   const sidebarBg = 'gray.900';

//   return (
//     <Flex>
//       {/* --- 1. Desktop Sidebar --- */}
//       <Box
//         as="nav"
//         pos="fixed"
//         top="0"
//         left="0"
//         zIndex="sticky"
//         h="100vh"
//         w={DESKTOP_SIDEBAR_WIDTH}
//         bg={sidebarBg}
//         borderRight="1px"
//         borderColor="gray.700"
//         display={{ base: 'none', md: 'block' }}
//       >
//         <NavContent />
//       </Box>

//       {/* --- 2. Mobile: Thin Bar with Hamburger --- */}
//       <Box
//         as="nav"
//         pos="fixed"
//         top="0"
//         left="0"
//         zIndex="docked"
//         h="100vh"
//         w={MOBILE_SIDEBAR_WIDTH}
//         bg={sidebarBg}
//         borderRight="1px"
//         borderColor="gray.700"
//         display={{ base: 'flex', md: 'none' }}
//         flexDir="column"
//         alignItems="center"
//         pt={4}
//       >
//         <IconButton
//           aria-label="Open menu"
//           icon={<HamburgerIcon w={6} h={6} />}
//           onClick={onOpen}
//           variant="ghost"
//           color="gray.400"
//           _hover={{ bg: 'rgba(66, 153, 225, 0.1)', color: 'white' }}
//         />
//       </Box>
      
//       {/* --- 3. Mobile: Drawer that opens from the side --- */}
//       <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
//         <DrawerOverlay />
//         <DrawerContent bg={sidebarBg} w={DESKTOP_SIDEBAR_WIDTH}>
//           <DrawerBody p={0}>
//             <NavContent onLinkClick={onClose} />
//           </DrawerBody>
//         </DrawerContent>
//       </Drawer>

//       {/* --- 4. Main Content Area --- */}
//       <Box
//         flex="1"
//         ml={{ base: MOBILE_SIDEBAR_WIDTH, md: DESKTOP_SIDEBAR_WIDTH }}
//         p={{ base: 4, md: 8 }}
//       >
//         {children}
//       </Box>
//     </Flex>
//   );
// };

// // Export the main layout component
// export default AppLayout;





import React from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Flex, VStack, Button, Spacer, Divider,
  Drawer, DrawerOverlay, DrawerContent, DrawerBody, useDisclosure,
  IconButton, useColorModeValue,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../AppContext';
import ThemeToggle from './ThemeToggle';
import {
  FaUserShield, FaStore, FaUserTie, FaUserCog,
  FaSignInAlt, FaUserPlus, FaPowerOff
} from 'react-icons/fa';

const DESKTOP_SIDEBAR_WIDTH = '220px';
const MOBILE_SIDEBAR_WIDTH = '60px';

const NavContent = ({ onLinkClick }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    if (onLinkClick) onLinkClick();
    logout();
  };

  const links = {
    admin: [{ icon: <FaUserShield size={20} />, label: 'Admin Dashboard', to: '/admin/dashboard' }],
    vendor: [{ icon: <FaStore size={20} />, label: 'Vendor Dashboard', to: '/vendor/dashboard' }],
    employee: [{ icon: <FaUserTie size={20} />, label: 'Employee Dashboard', to: '/employee/dashboard' }],
    coordinator: [{ icon: <FaUserCog size={20} />, label: 'Coordinator Dashboard', to: '/coordinator/dashboard' }],
    guest: [
      { icon: <FaSignInAlt size={18} />, label: 'Login', to: '/login' },
      { icon: <FaUserPlus size={18} />, label: 'Register', to: '/register' },
    ],
  };

  const userLinks = user ? (links[user.role] || []) : links.guest;

  return (
    <VStack h="full" w="full" spacing={2} py={4} align="stretch">
      {userLinks.map(link => (
        <Button
          key={link.to}
          as={RouterLink}
          to={link.to}
          onClick={onLinkClick}
          justifyContent="flex-start"
          w="full"
          py={6}
          px={4}
          variant="ghost"
          leftIcon={link.icon}
          color={location.pathname.startsWith(link.to) ? 'blue.300' : 'gray.400'}
          bg={location.pathname.startsWith(link.to) ? 'rgba(66, 153, 225, 0.1)' : 'transparent'}
          _hover={{ bg: 'gray.700', color: 'white' }}
        >
          {link.label}
        </Button>
      ))}
      <Spacer />
      {user && (
        <Button
          onClick={handleLogout}
          justifyContent="flex-start"
          w="full"
          py={6}
          px={4}
          variant="ghost"
          leftIcon={<FaPowerOff />}
          color="gray.400"
          _hover={{ bg: 'red.900', color: 'white' }}
        >
          Logout
        </Button>
      )}
      <Divider w="80%" alignSelf="center" borderColor="gray.700" my={2} />
      <Box w="full" px={4} py={2}>
        <ThemeToggle />
      </Box>
    </VStack>
  );
};

const AppLayout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuth();
  const location = useLocation();

  const sidebarBg = 'gray.900';
  const iconColor = useColorModeValue('black', 'whiteAlpha.900');

  // Public routes show a floating hamburger (no reserved 60px bar)
  const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
  const isPublicRoute = !user || publicPaths.some(p => location.pathname.startsWith(p));

  return (
    <Flex>
      {/* Desktop sidebar */}
      <Box
        as="nav"
        pos="fixed"
        top="0"
        left="0"
        zIndex="sticky"
        h="100vh"
        w={DESKTOP_SIDEBAR_WIDTH}
        bg={sidebarBg}
        borderRight="1px"
        borderColor="gray.700"
        display={{ base: 'none', md: 'block' }}
      >
        <NavContent />
      </Box>

      {/* Mobile thin bar (non-public pages only) */}
      {!isPublicRoute && (
        <Box
          as="nav"
          pos="fixed"
          top="0"
          left="0"
          zIndex="docked"
          h="100vh"
          w={MOBILE_SIDEBAR_WIDTH}
          bg={sidebarBg}
          borderRight="1px"
          borderColor="gray.700"
          display={{ base: 'flex', md: 'none' }}
          flexDir="column"
          alignItems="center"
          pt={4}
        >
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon w={6} h={6} />}
            onClick={onOpen}
            variant="ghost"
            color="gray.400"
            _hover={{ bg: 'rgba(66, 153, 225, 0.1)', color: 'white' }}
          />
        </Box>
      )}

      {/* Floating hamburger for public pages (HIDDEN while drawer is open) */}
      {isPublicRoute && (
        <IconButton
          aria-label="Open menu"
          icon={<HamburgerIcon w={5} h={5} />}
          onClick={onOpen}
          size="sm"
          variant="ghost"
          color={iconColor}
          p={1}
          mt="-1"
          position="fixed"
          top="10px"
          left="10px"
          // Hide when drawer is open to prevent overlap
          display={{ base: isOpen ? 'none' : 'inline-flex', md: 'none' }}
          zIndex="popover"
          _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.200' } }}
          aria-expanded={isOpen}
        />
      )}

      {/* Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg={sidebarBg} w={DESKTOP_SIDEBAR_WIDTH}>
          <DrawerBody p={0}>
            <NavContent onLinkClick={onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <Box
        flex="1"
        ml={{ base: isPublicRoute ? 0 : MOBILE_SIDEBAR_WIDTH, md: DESKTOP_SIDEBAR_WIDTH }}
        p={{ base: 4, md: 8 }}
      >
        {children}
      </Box>
    </Flex>
  );
};

export default AppLayout;
