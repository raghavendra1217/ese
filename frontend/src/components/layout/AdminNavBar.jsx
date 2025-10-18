// // // import React, { useEffect } from 'react';
// // // import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
// // // import {
// // //   VStack, Button, Tooltip, Box, Divider, Spacer, IconButton,
// // //   Drawer, DrawerBody, DrawerContent, DrawerOverlay, useDisclosure,
// // //   Flex, Text
// // // } from '@chakra-ui/react';
// // // import { HamburgerIcon } from '@chakra-ui/icons';
// // // import { useAuth } from '../../AppContext'; // Adjust path if needed
// // // import ThemeToggle from '../ThemeToggle';

// // // import { GoHome, GoGraph } from 'react-icons/go';
// // // import { BsPersonCheckFill, BsCart3 } from 'react-icons/bs';
// // // import { FaPowerOff } from 'react-icons/fa';

// // // const SidebarIcon = ({ icon, label, to = "#", onClick, active = false, showLabel = false }) => (
// // //   <Tooltip label={label} placement="right" hasArrow isDisabled={showLabel}>
// // //     <Button
// // //   as={to !== "#" ? RouterLink : 'button'}
// // //   to={to}
// // //   onClick={onClick}
// // //   justifyContent="flex-start"
// // //   pl={4}
// // //   w="full"
// // //   py={4}
// // //   variant="ghost"
// // //   bg={active ? '#3182ce' : 'transparent'}
// // //   color={active ? 'white' : 'gray.400'}
// // //   _hover={{ bg: '#2b6cb0', color: 'white' }}
// // //   _active={{ bg: '#2c5282' }}

// // //   aria-label={label}
// // // >

// // //       <Flex align="center">
// // //         {icon}
// // //         {showLabel && (
// // //   <Text ml={3} display={{ base: 'inline', lg: 'none' }}>
// // //     {label}
// // //   </Text>
// // // )}
// // //       </Flex>
// // //     </Button>
// // //   </Tooltip>
// // // );

// // // const AdminNavContent = ({ onLinkClick, isDrawer = false }) => {
// // //   const { logout } = useAuth();
// // //   const location = useLocation();
// // //   const navigate = useNavigate();

// // //   const handleLogout = () => {
// // //     logout();
// // //     navigate('/login');
// // //     if (onLinkClick) onLinkClick();
// // //   };

// // //   const navLinks = [
// // //     { icon: <GoHome size={22} />, label: "Dashboard", to: "/admin/dashboard" },
// // //     { icon: <BsPersonCheckFill size={20} />, label: "Vendor Approvals", to: "/admin/manage-approvals" },
// // //     { icon: <GoGraph size={20} />, label: "Trading Approvals", to: "/admin/manage-trading-approvals" },
// // //     { icon: <BsCart3 size={20} />, label: "Products", to: "/admin/manage-products" },
// // //   ];

// // //   return (
// // //     <VStack h="full" w="full" spacing={3} py={2}>
// // //       {navLinks.map(link => (
// // //         <SidebarIcon
// // //           key={link.to}
// // //           {...link}
// // //           active={location.pathname === link.to}
// // //           onClick={onLinkClick}
// // //           showLabel={isDrawer}
// // //         />
// // //       ))}
// // //       <Spacer />
// // //       <SidebarIcon
// // //         icon={<FaPowerOff />}
// // //         label="Logout"
// // //         onClick={handleLogout}
// // //         showLabel={isDrawer}
// // //       />
// // //       <Divider w="80%" borderColor="gray.700" />
// // //       <Box w="full" px={isDrawer ? 4 : 0}><ThemeToggle /></Box>
// // //     </VStack>
// // //   );
// // // };


// // // const AdminNavBar = ({ variant}) => {
// // //   const { isOpen, onOpen, onClose } = useDisclosure();
// // //   const location = useLocation();
// // //   const navBarWidth = '80px';
 

// // // //   useEffect(() => {
// // // //     const lgBreakpoint = 992;
// // // //     const adjustBodyPadding = () => {
// // // //       if (window.innerWidth >= lgBreakpoint) {
// // // //         document.body.style.paddingLeft = navBarWidth;
// // // //       } else {
// // // //         document.body.style.paddingLeft = '0px';
// // // //       }
// // // //     };
// // // //     adjustBodyPadding();
// // // //     window.addEventListener('resize', adjustBodyPadding);
// // // //     return () => {
// // // //       document.body.style.paddingLeft = '0px';
// // // //       window.removeEventListener('resize', adjustBodyPadding);
// // // //     };
// // // //   }, [navBarWidth]);

// // //   useEffect(() => {
// // //     onClose(); // close drawer on navigation
// // //   }, [location.pathname, onClose]);

// // //   return (
// // //     <>
// // //       {/* --- DESKTOP SIDEBAR --- */}
// // //       {/* --- DESKTOP SIDEBAR --- */} 
// // //       <Box
// // //   as="nav"
// // //   pos="fixed"
// // //   top="0"
// // //   left="0"
// // //   zIndex="sticky"
// // //   h="100vh"
// // //   w={navBarWidth}
// // //   bg="gray.900"
// // //   display={{ base: 'none', lg: 'flex' }}
// // // >
// // //   <AdminNavContent isDrawer={false} />
// // // </Box>
// // // {/* --- MOBILE MINI SIDEBAR with Hamburger ONLY --- */}
// // // <Box
// // //   display={{ base: 'flex', lg: 'none' }}
// // //   flexDirection="column"
// // //   alignItems="center"
// // //   justifyContent="flex-start"
// // //   bg="gray.900"
// // //   w="60px"
// // //   h="100vh"
// // //   position="fixed"
// // //   top={0}
// // //   left={0}
// // //   zIndex={10}
// // //   borderRight="1px solid #1f1f2e"
// // //   py={4}
// // // >
// // //   <IconButton
// // //     aria-label="Open menu"
// // //     icon={<HamburgerIcon />}
// // //     onClick={onOpen}
// // //     mt={4}
// // //     bg="#3182ce"
// // //     color="white"
// // //     _hover={{ bg: "#2b6cb0" }}
// // //     size="md"
// // //     isRound={false} 
// // //   />
// // // </Box>






// // //       {/* --- MOBILE DRAWER MENU --- */}
// // //       <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
// // //         <DrawerOverlay />
// // //         <DrawerContent bg="gray.900" w={navBarWidth}>
// // //           <DrawerBody p={0}>
// // //             <AdminNavContent onLinkClick={onClose} isDrawer={true} />
// // //           </DrawerBody>
// // //         </DrawerContent>
// // //       </Drawer>
// // //     </>
// // //   );
// // // };

// // // export default AdminNavBar;












// // // src/components/layout/AdminNavBar.jsx
// // import React from 'react';
// // import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
// // import {
// //   VStack,
// //   Button,
// //   Tooltip,
// //   Box,
// //   Divider,
// //   Spacer,
// //   Flex,
// //   Text,
// //   useColorModeValue,
// // } from '@chakra-ui/react';
// // import { useAuth } from '../../AppContext';
// // import ThemeToggle from '../ThemeToggle';

// // import { GoHome, GoGraph } from 'react-icons/go';
// // import { BsPersonCheckFill, BsCart3 } from 'react-icons/bs';
// // import { FaPowerOff } from 'react-icons/fa';

// // const NAV_W = '80px';

// // const SidebarIcon = ({ icon, label, to = '#', onClick, active = false, showLabel = false }) => {
// //   const activeBg = useColorModeValue('#3182ce', '#2b6cb0');
// //   const activeColor = 'white';

// //   return (
// //     <Tooltip label={label} placement="right" hasArrow isDisabled={showLabel}>
// //       <Button
// //         as={to !== '#' ? RouterLink : 'button'}
// //         to={to}
// //         onClick={onClick}
// //         justifyContent="flex-start"
// //         pl={4}
// //         w="full"
// //         py={4}
// //         variant="ghost"
// //         bg={active ? activeBg : 'transparent'}
// //         color={active ? activeColor : 'gray.400'}
// //         _hover={{ bg: active ? activeBg : 'whiteAlpha.200', color: 'white' }}
// //         _active={{ bg: active ? activeBg : 'whiteAlpha.300' }}
// //         aria-label={label}
// //       >
// //         <Flex align="center">
// //           {icon}
// //           {showLabel && <Text ml={3}>{label}</Text>}
// //         </Flex>
// //       </Button>
// //     </Tooltip>
// //   );
// // };

// // const AdminNavContent = ({ onLinkClick, isDrawer = false }) => {
// //   const { logout } = useAuth();
// //   const location = useLocation();
// //   const navigate = useNavigate();

// //   const handleLogout = () => {
// //     logout();
// //     navigate('/login');
// //     if (onLinkClick) onLinkClick();
// //   };

// //   const navLinks = [
// //     { icon: <GoHome size={22} />, label: 'Dashboard', to: '/admin/dashboard' },
// //     { icon: <BsPersonCheckFill size={20} />, label: 'Vendor Approvals', to: '/admin/manage-approvals' },
// //     { icon: <GoGraph size={20} />, label: 'Trading Approvals', to: '/admin/manage-trading-approvals' },
// //     { icon: <BsCart3 size={20} />, label: 'Products', to: '/admin/manage-products' },
// //   ];

// //   return (
// //     <VStack h="full" w="full" spacing={3} py={2}>
// //       {/* show text labels in drawer; icons-only on desktop */}
// //       {navLinks.map(link => (
// //         <SidebarIcon
// //           key={link.to}
// //           {...link}
// //           active={location.pathname === link.to}
// //           onClick={onLinkClick}
// //           showLabel={isDrawer}
// //         />
// //       ))}
// //       <Spacer />
// //       <SidebarIcon icon={<FaPowerOff />} label="Logout" onClick={handleLogout} showLabel={isDrawer} />
// //       <Divider w="80%" borderColor="gray.700" />
// //       <Box w="full" px={isDrawer ? 4 : 0}>
// //         <ThemeToggle />
// //       </Box>
// //     </VStack>
// //   );
// // };

// // /**
// //  * AdminNavBar
// //  * - variant="static": fixed desktop sidebar (hidden on mobile)
// //  * - variant="drawer": content for DrawerBody (use inside your page-controlled <Drawer>)
// //  *
// //  * Your pages should render:
// //  *   <AdminNavBar variant="static" />
// //  *   <Drawer ...><AdminNavBar variant="drawer" onClose={drawer.onClose} /></Drawer>
// //  * And place the Hamburger button next to the page title (mobile) to open the drawer.
// //  */
// // const AdminNavBar = ({ variant = 'static', onClose }) => {
// //   const bg = useColorModeValue('gray.900', 'gray.900');

// //   if (variant === 'drawer') {
// //     return (
// //       <Box bg={bg} w={NAV_W} minH="100%">
// //         <AdminNavContent onLinkClick={onClose} isDrawer />
// //       </Box>
// //     );
// //   }

// //   return (
// //     <Box
// //       as="nav"
// //       pos="fixed"
// //       top="0"
// //       left="0"
// //       zIndex="sticky"
// //       h="100vh"
// //       w={NAV_W}
// //       bg={bg}
// //       display={{ base: 'none', lg: 'flex' }}
// //     >
// //       <AdminNavContent />
// //     </Box>
// //   );
// // };

// // export default AdminNavBar;




// // src/components/layout/AdminNavBar.jsx

// import React from 'react';
// import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
// import {
//   VStack,
//   Button,
//   Tooltip,
//   Box,
//   Divider,
//   Spacer,
//   Flex,
//   Text,
//   useColorModeValue,
// } from '@chakra-ui/react';
// import { useAuth } from '../../AppContext';
// import ThemeToggle from '../ThemeToggle';

// // Icons (lucide-react)
// import {
//   LayoutDashboard,
//   BadgeCheck,   // Approvals
//   Package,      // Products
//   Users,        // Referrals
//   Wallet,       // Wallet Approvals
//   LogOut,       // Logout
// } from 'lucide-react';

// // Exported so pages can use the same width on DrawerContent
// export const NAV_WIDTH = '220px';

// const SidebarLink = ({
//   icon,
//   label,
//   to = '#',
//   onClick,
//   active = false,
//   showLabel = true,
//   justify = 'flex-start',
// }) => {
//   const activeBg = useColorModeValue('rgba(66, 153, 225, 0.15)', 'rgba(66, 153, 225, 0.15)');
//   const hoverBg = useColorModeValue('rgba(66, 153, 225, 0.08)', 'rgba(66, 153, 225, 0.08)');
//   const activeColor = useColorModeValue('blue.500', 'blue.300');
//   const idleColor = useColorModeValue('gray.600', 'gray.400');

//   return (
//     <Tooltip label={label} placement="right" hasArrow isDisabled={showLabel}>
//       <Button
//         as={to !== '#' ? RouterLink : 'button'}
//         to={to}
//         onClick={onClick}
//         justifyContent={justify}
//         w="full"
//         py={5}
//         pl={justify === 'flex-start' ? 5 : 0}
//         variant="ghost"
//         bg={active ? activeBg : 'transparent'}
//         color={active ? activeColor : idleColor}
//         _hover={{ bg: hoverBg, color: activeColor }}
//         _active={{ bg: activeBg }}
//         aria-label={label}
//       >
//         <Flex align="center">
//           {icon}
//           {showLabel && (
//             <Text ml={justify === 'flex-start' ? 3 : 2} fontWeight="medium">
//               {label}
//             </Text>
//           )}
//         </Flex>
//       </Button>
//     </Tooltip>
//   );
// };

// const AdminNavContent = ({ onLinkClick, showLabels = true }) => {
//   const { logout } = useAuth();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//     if (onLinkClick) onLinkClick();
//   };

//   const navLinks = [
//     { icon: <LayoutDashboard size={20} />, label: 'Dashboard', to: '/admin/dashboard' },
//     { icon: <BadgeCheck size={20} />, label: 'Manage Approvals', to: '/admin/manage-approvals' },
//     { icon: <Package size={20} />, label: 'Manage Products', to: '/admin/manage-products' },
//     { icon: <Users size={20} />, label: 'Manage Referrals', to: '/admin/manage-referrals' },
//     { icon: <Wallet size={20} />, label: 'Manage Wallet Approvals', to: '/admin/manage-wallet-approvals' },
//   ];

//   return (
//     <VStack h="full" w="full" spacing={1} py={4} align="stretch">
//       {navLinks.map(link => (
//         <SidebarLink
//           key={link.to}
//           {...link}
//           active={location.pathname.startsWith(link.to)}
//           onClick={onLinkClick}
//           showLabel={showLabels}
//         />
//       ))}

//       <Spacer />

//       <SidebarLink
//         icon={<LogOut size={20} />}
//         label="Logout"
//         to="#"
//         onClick={handleLogout}
//         justify="center"
//         showLabel={showLabels}
//       />

//       <Divider w="80%" alignSelf="center" borderColor="gray.700" my={2} />

//       <Box w="full" px={showLabels ? 4 : 0} py={2}>
//         <ThemeToggle />
//       </Box>
//     </VStack>
//   );
// };


// const AdminNavBar = ({ variant = 'static', onClose }) => {
//   const bg = useColorModeValue('gray.900', 'gray.900');
//   const color = useColorModeValue('gray.100', 'gray.100');

//   if (variant === 'drawer') {
//     // Drawer body content (mobile)
//     return (
//       <Box bg={bg} color={color} w="100%" minH="100%">
//         <AdminNavContent onLinkClick={onClose} showLabels />
//       </Box>
//     );
//   }

//   // Fixed desktop sidebar (labels visible on laptop/desktop)
//   return (
//     <Box
//       as="nav"
//       pos="fixed"
//       top="0"
//       left="0"
//       zIndex="sticky"
//       h="100vh"
//       w={NAV_WIDTH}
//       bg={bg}
//       color={color}
//       display={{ base: 'none', lg: 'flex' }} // hidden on mobile; you use a page hamburger to open the drawer
//       px={2}
//     >
//       <AdminNavContent showLabels />
//     </Box>
//   );
// };

// export default AdminNavBar;













import React from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  VStack,
  Button,
  Tooltip,
  Box,
  Divider,
  Spacer,
  Flex,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';
import ThemeToggle from '../ThemeToggle';

// lucide-react icons
import {
  LayoutDashboard,
  BadgeCheck,  // Manage Approvals
  Package,     // Manage Products
  Package2,    // Wild Products
  Users,       // Manage Referrals
  Wallet,      // Manage Wallet Approvals
  ShoppingCart, // Product Requests
  Handshake,   // Investor Management
  UserCog,     // Coordinator Management
  LogOut,
} from 'lucide-react';

// Sidebar widths
export const NAV_WIDTH = '80px';       // desktop (icons only)
export const DRAWER_WIDTH = '220px';   // mobile drawer (icons + labels)

const SidebarLink = ({
  icon,
  label,
  to = '#',
  onClick,
  active = false,
  showLabel = false,   // <-- when true, show text next to icon
}) => {
  const activeBg   = useColorModeValue('rgba(66, 153, 225, 0.15)', 'rgba(66, 153, 225, 0.15)');
  const hoverBg    = useColorModeValue('rgba(66, 153, 225, 0.08)', 'rgba(66, 153, 225, 0.08)');
  const activeColor= useColorModeValue('blue.500', 'blue.300');
  const idleColor  = useColorModeValue('gray.600', 'gray.400');

  return (
    <Tooltip label={label} placement="right" hasArrow isDisabled={showLabel}>
      <Button
        as={to !== '#' ? RouterLink : 'button'}
        to={to}
        onClick={onClick}
        w="full"
        py={showLabel ? 5 : 6}
        px={showLabel ? 5 : 0}
        variant="ghost"
        bg={active ? activeBg : 'transparent'}
        color={active ? activeColor : idleColor}
        _hover={{ bg: hoverBg, color: activeColor }}
        _active={{ bg: activeBg }}
        aria-label={label}
      >
        <Flex
          align="center"
          w="full"
          justify={showLabel ? 'flex-start' : 'center'}
        >
          {icon}
          {showLabel && (
            <Text ml={3} fontWeight="medium">
              {label}
            </Text>
          )}
        </Flex>
      </Button>
    </Tooltip>
  );
};

const AdminNavContent = ({ onLinkClick, showLabels }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLinkClick) onLinkClick();
    logout();
  };

  const links = [
    { icon: <LayoutDashboard size={22} />, label: 'Dashboard',                to: '/admin/dashboard' },
    { icon: <BadgeCheck       size={22} />, label: 'Manage Approvals',        to: '/admin/manage-approvals' },
    { icon: <Package          size={22} />, label: 'Manage Products',         to: '/admin/manage-products' },
    { icon: <Package2         size={22} />, label: 'Wild Products',           to: '/admin/wild-products' },
    { icon: <Users            size={22} />, label: 'Manage Referrals',        to: '/admin/manage-percentages' },
    { icon: <Wallet           size={22} />, label: 'Manage Wallet Approvals', to: '/admin/wallet-approvals' },
    { icon: <ShoppingCart     size={22} />, label: 'Product Requests',         to: '/admin/product-requests' },
    { icon: <Handshake        size={22} />, label: 'Investor Management',      to: '/admin/investors' },
    { icon: <UserCog          size={22} />, label: 'Manage Coordinators',     to: '/admin/manage-coordinators' },
  ];

  return (
    <VStack h="full" w="full" spacing={2} py={4} align="stretch">
      {links.map(link => (
        <SidebarLink
          key={link.to}
          {...link}
          active={location.pathname.startsWith(link.to)}
          onClick={onLinkClick}
          showLabel={showLabels}
        />
      ))}

      <Spacer />

      <SidebarLink
        icon={<LogOut size={22} />}
        label="Logout"
        to="#"
        onClick={handleLogout}
        showLabel={showLabels}
      />

      <Divider w={showLabels ? '85%' : '70%'} alignSelf="center" borderColor="gray.700" my={2} />

      <Box w="full" px={showLabels ? 4 : 0} py={2}>
        <ThemeToggle />
      </Box>
    </VStack>
  );
};

const AdminNavBar = ({ variant = 'static', onClose }) => {
  const bg    = useColorModeValue('gray.900', 'gray.900');
  const color = useColorModeValue('gray.100', 'gray.100');

  if (variant === 'drawer') {
    // MOBILE drawer: show labels
    return (
      <Box bg={bg} color={color} w="100%" minH="100%">
        <AdminNavContent onLinkClick={onClose} showLabels />
      </Box>
    );
  }

  // DESKTOP/LAPTOP: icons only
  return (
    <Box
      as="nav"
      pos="fixed"
      top="0"
      left="0"
      zIndex="sticky"
      h="100vh"
      w={NAV_WIDTH}
      bg={bg}
      color={color}
      display={{ base: 'none', lg: 'flex' }}
      px={1}
    >
      <AdminNavContent showLabels={false} />
    </Box>
  );
};

export default AdminNavBar;
