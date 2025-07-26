// src/pages/EmployeeDashboard.jsx

import React from 'react';
import { Box, Flex, VStack, Grid, Heading, Text, Button, IconButton, useColorModeValue, Spacer, Tooltip } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaRegUserCircle, FaFolder, FaCog, FaPowerOff } from 'react-icons/fa';
import { GoHome } from 'react-icons/go';
import { useAuth } from '../AppContext';

// Employee-specific components
const EmployeeSidebarIcon = ({ icon, label, to="#", active=false }) => ( <Tooltip label={label} placement="right" hasArrow> <Button as={RouterLink} to={to} justifyContent="center" w="full" py={6} variant={active ? 'solid' : 'ghost'} colorScheme={active ? 'blue' : 'gray'} color={active ? 'white' : 'gray.400'} _hover={{ bg: 'gray.700', color: 'white' }} aria-label={label}>{icon}</Button> </Tooltip> );
const EmployeeNavBar = () => { const { logout } = useAuth(); const location = window.location; return ( <VStack as="nav" h="100vh" w="80px" position="fixed" left={0} top={0} bg="gray.900" boxShadow="md" spacing={2} py={6} zIndex={10}> <EmployeeSidebarIcon icon={<GoHome size={22} />} label="Dashboard" to="/dashboard" active={location.pathname === '/dashboard'} /> <EmployeeSidebarIcon icon={<FaFolder size={20} />} label="My Tasks" to="#" /> <Spacer /> <EmployeeSidebarIcon icon={<FaCog size={20} />} label="My Profile" to="#" /> <Tooltip label="Logout" placement="right" hasArrow> <IconButton aria-label="Logout" icon={<FaPowerOff />} onClick={logout} variant="ghost" colorScheme="red" w="full" /> </Tooltip> </VStack> ); };

// Main Component
const EmployeeDashboard = ({ url }) => {
    const { user } = useAuth();
    const mainBg = useColorModeValue('#F9FAFB', 'gray.800');
    const textColor = useColorModeValue('gray.800', 'white');
    
    // In a real app, this would also fetch stats from an '/api/employee/stats' endpoint
    return (
        <Flex minH="100vh" bg={mainBg}>
            <EmployeeNavBar />
            <Box flex="1" ml="80px" p={{ base: 4, md: 8 }}>
                <Flex justify="space-between" align="center" mb={8}>
                    <Heading as="h1" size="xl" color={textColor}>Employee Dashboard</Heading>
                    <Flex align="center" gap={2}>
                        <FaRegUserCircle size={28} />
                        <Text fontWeight="semibold" display={{ base: 'none', sm: 'block' }}>Hello, {user?.email || 'Employee'}</Text>
                    </Flex>
                </Flex>
                <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
                    <Text>Your assigned tasks and performance metrics will be displayed here.</Text>
                </Grid>
            </Box>
        </Flex>
    );
};

export default EmployeeDashboard;