import React from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Flex, VStack, Button, Tooltip, IconButton, Spacer, Divider,
  Drawer, DrawerContent, DrawerBody, useDisclosure, Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import ThemeToggle from '../ThemeToggle';
import {
  FaUserCog, FaPowerOff,
} from 'react-icons/fa';

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

const CoordinatorNavContent = ({ onLinkClick, showLabels }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLinkClick) onLinkClick();
    logout();
  };

  const links = [
    { icon: <FaUserCog size={22} />, label: 'Dashboard', to: '/coordinator/dashboard' },
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
        icon={<FaPowerOff size={22} />}
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

const CoordinatorNavBar = ({ variant = 'static', onClose }) => {
  const bg = useColorModeValue('gray.900', 'gray.900');
  const borderColor = useColorModeValue('gray.700', 'gray.600');

  if (variant === 'drawer') {
    return (
      <DrawerContent bg={bg} borderRight="1px" borderColor={borderColor}>
        <DrawerBody p={0}>
          <CoordinatorNavContent onLinkClick={onClose} showLabels={true} />
        </DrawerBody>
      </DrawerContent>
    );
  }

  // Static sidebar (desktop)
  return (
    <Box
      as="nav"
      pos="fixed"
      top="0"
      left="0"
      zIndex="sticky"
      h="full"
      w={NAV_WIDTH}
      bg={bg}
      borderRight="1px"
      borderColor={borderColor}
      display={{ base: 'none', md: 'block' }}
    >
      <CoordinatorNavContent showLabels={false} />
    </Box>
  );
};

export default CoordinatorNavBar;
