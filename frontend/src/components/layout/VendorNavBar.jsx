import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { VStack, Button, IconButton, Spacer, Tooltip } from '@chakra-ui/react';
import { FaUsers, FaFolder, FaCog, FaPowerOff } from 'react-icons/fa';
import { GoHome, GoGraph } from 'react-icons/go';
import { BsCart3 } from 'react-icons/bs';
import { useAuth } from '../../AppContext'; // Adjust path as needed

const VendorSidebarIcon = ({ icon, label, to = "#", active = false }) => (
    <Tooltip label={label} placement="right" hasArrow>
        <Button as={RouterLink} to={to} justifyContent="center" w="full" py={6} variant={active ? 'solid' : 'ghost'} colorScheme={active ? 'blue' : 'gray'} color={active ? 'white' : 'gray.400'} _hover={{ bg: 'gray.700', color: 'white' }} aria-label={label}>
            {icon}
        </Button>
    </Tooltip>
);

const VendorNavBar = () => {
    const { logout } = useAuth();
    const location = useLocation();
    
    return (
        <VStack as="nav" h="100vh" w="80px" position="fixed" left={0} top={0} bg="gray.900" boxShadow="md" spacing={2} py={6} zIndex={10}>
            <VendorSidebarIcon icon={<GoHome size={22} />} label="Dashboard" to="/vendor/dashboard" active={location.pathname === '/vendor/dashboard'} />
            <VendorSidebarIcon icon={<BsCart3 size={20} />} label="Products" to="/vendor/products" active={location.pathname === '/vendor/products'} />
            <VendorSidebarIcon icon={<FaFolder size={20} />} label="My Resumes" to="#" />
            <VendorSidebarIcon icon={<GoGraph size={20} />} label="My Payouts" to="#" />
            <VendorSidebarIcon icon={<FaUsers size={20} />} label="Wallet" to="/vendor/wallet" active={location.pathname === '/vendor/wallet'} />
            <Spacer />
            <VendorSidebarIcon icon={<FaCog size={20} />} label="My Profile" to="#" />
            <Tooltip label="Logout" placement="right" hasArrow>
                <IconButton aria-label="Logout" icon={<FaPowerOff />} onClick={logout} variant="ghost" colorScheme="red" w="full" />
            </Tooltip>
        </VStack>
    );
};

export default VendorNavBar;