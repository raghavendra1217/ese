import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { VStack, Button, IconButton, Spacer, Tooltip } from '@chakra-ui/react';
import { FaUsers, FaCog, FaPowerOff } from 'react-icons/fa';
import { GoHome, GoGraph } from 'react-icons/go';
import { BsPersonCheckFill, BsCart3 } from 'react-icons/bs';
import { useAuth } from '../../AppContext'; // Adjust path as needed

const SidebarIcon = ({ icon, label, to = "#", active = false }) => (
    <Tooltip label={label} placement="right" hasArrow>
        <Button as={RouterLink} to={to} justifyContent="center" w="full" py={6} variant={active ? 'solid' : 'ghost'} colorScheme={active ? 'blue' : 'gray'} color={active ? 'white' : 'gray.400'} _hover={{ bg: 'gray.700', color: 'white' }} aria-label={label}>
            {icon}
        </Button>
    </Tooltip>
);

const AdminNavBar = () => {
    const { logout } = useAuth();
    const location = useLocation();

    const navLinks = [
        { icon: <GoHome size={22} />, label: "Dashboard", to: "/admin/dashboard" },
        { icon: <BsPersonCheckFill size={20} />, label: "Vendor Approvals", to: "/admin/manage-approvals" },
        { icon: <GoGraph size={20} />, label: "Trading Approvals", to: "/admin/manage-trading-approvals" },
        { icon: <BsCart3 size={20} />, label: "Products", to: "/admin/manage-products" },
        { icon: <FaUsers size={20} />, label: "Members", to: "#" },
    ];

    return (
        <VStack as="nav" h="100vh" w="80px" position="fixed" left={0} top={0} bg="gray.900" boxShadow="md" spacing={2} py={6} zIndex={10}>
            {navLinks.map((link) => (
                <SidebarIcon key={link.label} {...link} active={location.pathname === link.to} />
            ))}
            <Spacer />
            <SidebarIcon icon={<FaCog size={20} />} label="Settings" to="#" />
            <Tooltip label="Logout" placement="right" hasArrow>
                <IconButton aria-label="Logout" icon={<FaPowerOff />} onClick={logout} variant="ghost" colorScheme="red" w="full" />
            </Tooltip>
        </VStack>
    );
};

export default AdminNavBar;