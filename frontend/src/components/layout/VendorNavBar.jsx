// import React from 'react';
// import { Link as RouterLink, useLocation } from 'react-router-dom';
// import {
//     VStack,
//     Button,
//     Tooltip,
//     Box,
//     Divider,
//     Spacer,
//     Flex,
//     Text,
// } from '@chakra-ui/react';
// import { useAuth } from '../../AppContext';
// import ThemeToggle from '../ThemeToggle';
// import {
//     LayoutDashboard,
//     Package,
//     Wallet,
//     User,
//     LogOut,
//     // ✅ --- NEW ICONS ---
//     Receipt, // For Purchases
//     Gift,    // For Claims
// } from 'lucide-react';

// // ✅ MODIFIED: The SidebarLink component now accepts a 'justify' prop to control alignment.
// const SidebarLink = ({ icon, label, to = "#", onClick, active, showLabel = true, justify = "flex-start" }) => (
//     <Tooltip label={label} placement="right" hasArrow isDisabled={showLabel}>
//         <Button
//             as={to !== "#" ? RouterLink : 'button'}
//             to={to}
//             onClick={onClick}
//             justifyContent={justify} // ✅ Use the new prop here
//             w="full"
//             py={6}
//             pl={justify === 'flex-start' ? 6 : 0} // No left padding if centered
//             variant="ghost"
//             bg={active ? 'rgba(66, 153, 225, 0.15)' : 'transparent'}
//             color={active ? 'blue.400' : 'gray.400'}
//             _hover={{
//                 bg: 'rgba(66, 153, 225, 0.05)',
//                 color: 'blue.400'
//             }}
//             _active={{ bg: 'rgba(66, 153, 225, 0.25)' }}
//             aria-label={label}
//         >
//             <Flex align="center">
//                 {icon}
//                 {showLabel && <Text ml={justify === 'flex-start' ? 4 : 2}>{label}</Text>}
//             </Flex>
//         </Button>
//     </Tooltip>
// );

// const VendorNavBar = ({ onLinkClick }) => {
//     const { logout } = useAuth();
//     const location = useLocation();

//     const handleLogout = () => {
//         logout();
//         if (onLinkClick) onLinkClick();
//     };

//     // ✅ UPDATED: Added new links in a logical order.
//     const navLinks = [
//         { icon: <LayoutDashboard size={20} />, label: 'Dashboard', to: '/vendor/dashboard' },
//         { icon: <Package size={20} />, label: 'Products', to: '/vendor/products' },
//         { icon: <Receipt size={20} />, label: 'Purchases', to: '/vendor/purchase-history' },
//         { icon: <Wallet size={20} />, label: 'Wallet', to: '/vendor/wallet' },
//         { icon: <Gift size={20} />, label: 'Claims', to: '/vendor/wallet?view=earnings' },
//         { icon: <User size={20} />, label: 'Profile', to: '/vendor/profile' },
//     ];

//     return (
//         <VStack h="full" w="full" spacing={1} py={4} align="stretch">
//             {navLinks.map(link => (
//                 <SidebarLink
//                     key={link.to}
//                     {...link}
//                     active={location.pathname.startsWith(link.to.split('?')[0])} // Handles active state for URLs with parameters
//                     onClick={onLinkClick}
//                 />
//             ))}
//             <Spacer />
//             {/* ✅ UPDATED: The Logout button is now centered by passing justify="center" */}
//             <SidebarLink
//                 icon={<LogOut size={20} />}
//                 label="Logout"
//                 to="#"
//                 onClick={handleLogout}
//                 justify="center" 
//             />
//             <Divider w="80%" alignSelf="center" borderColor="gray.700" my={2} />
//             <Box w="full" px={4} py={2}>
//                 <ThemeToggle />
//             </Box>
//         </VStack>
//     );
// };

// export default VendorNavBar;








import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  VStack,
  Button,
  Tooltip,
  Box,
  Divider,
  Spacer,
  Flex,
  Text,
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';
import ThemeToggle from '../ThemeToggle';
import {
  LayoutDashboard,
  Package,
  Package2, // Wild Products
  Wallet,
  User,
  LogOut,
  Receipt, // Purchases
  Gift,    // Claims
} from 'lucide-react';

// SidebarLink supports icon-only or icon+label via showLabel.
// justify controls alignment (e.g., center for Logout).
const SidebarLink = ({
  icon,
  label,
  to = '#',
  onClick,
  active,
  showLabel = true,
  justify = 'flex-start',
}) => (
  <Tooltip label={label} placement="right" hasArrow isDisabled={showLabel}>
    <Button
      as={to !== '#' ? RouterLink : 'button'}
      to={to}
      onClick={onClick}
      justifyContent={justify}
      w="full"
      py={6}
      pl={justify === 'flex-start' ? 6 : 0}
      variant="ghost"
      bg={active ? 'rgba(66, 153, 225, 0.15)' : 'transparent'}
      color={active ? 'blue.400' : 'gray.400'}
      _hover={{ bg: 'rgba(66, 153, 225, 0.05)', color: 'blue.400' }}
      _active={{ bg: 'rgba(66, 153, 225, 0.25)' }}
      aria-label={label}
    >
      <Flex align="center">
        {icon}
        {showLabel && <Text ml={justify === 'flex-start' ? 4 : 2}>{label}</Text>}
      </Flex>
    </Button>
  </Tooltip>
);

const VendorNavBar = ({ onLinkClick }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    if (onLinkClick) onLinkClick();
  };

  const navLinks = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', to: '/vendor/dashboard' },
    { icon: <Package size={20} />, label: 'Products', to: '/vendor/products' },
    { icon: <Package2 size={20} />, label: 'Wild Products', to: '/vendor/wild-products' },
    { icon: <Receipt size={20} />, label: 'Purchases', to: '/vendor/purchase-history' },
    { icon: <Wallet size={20} />, label: 'Wallet', to: '/vendor/wallet' },
    { icon: <Gift size={20} />, label: 'Claims', to: '/vendor/wallet?view=earnings' },
    { icon: <User size={20} />, label: 'Profile', to: '/vendor/profile' },
  ];

  return (
    <VStack h="full" w="full" spacing={1} py={4} align="stretch">
      {navLinks.map(link => (
        <SidebarLink
          key={link.to}
          {...link}
          active={location.pathname.startsWith(link.to.split('?')[0])}
          onClick={onLinkClick}
        />
      ))}

      <Spacer />

      <SidebarLink
        icon={<LogOut size={20} />}
        label="Logout"
        to="#"
        onClick={handleLogout}
        justify="center"
      />

      <Divider w="80%" alignSelf="center" borderColor="gray.700" my={2} />

      <Box w="full" px={4} py={2}>
        <ThemeToggle />
      </Box>
    </VStack>
  );
};

export default VendorNavBar;
