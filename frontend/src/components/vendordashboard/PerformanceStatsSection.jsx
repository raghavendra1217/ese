import React from 'react';
import { Box, Flex, Grid, Heading, Text, useColorModeValue } from '@chakra-ui/react';
import StatCard from '../shared/cards/StatCard';
import { FaUsers } from 'react-icons/fa';
import { BsPersonCheckFill, BsCart3, BsCheckCircle } from 'react-icons/bs';
import { GoGraph } from 'react-icons/go';

const PerformanceStatsSection = ({ stats }) => {
    const textColor = useColorModeValue('gray.800', 'white');
    const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');

    return (
        <Box as="section" mb={8}>
            <Flex justify="space-between" align="center" mb={4}>
                <Box>
                    <Heading as="h1" size="xl" color={textColor}>Vendor Dashboard</Heading>
                    <Text color={secondaryTextColor}>Your Performance Overview</Text>
                </Box>
            </Flex>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
                <StatCard label="Assigned Resumes" value={stats.assignedResumes.toLocaleString()} icon={<BsCart3 size={24} />} iconBgColor="green.500" />
                <StatCard label="Completed Resumes" value={stats.completedResumes.toLocaleString()} icon={<BsCheckCircle size={24} />} iconBgColor="purple.500" />
                <StatCard label="Pending Payouts" value={stats.pendingPayOuts.toLocaleString()} icon={<GoGraph size={24} />} iconBgColor="orange.500" />
                <StatCard label="Available Vacancies" value={stats.availableVacancies.toLocaleString()} icon={<FaUsers size={24} />} iconBgColor="blue.500" />
                <StatCard label="Employees on Hold" value={stats.employeesOnHold.toLocaleString()} icon={<BsPersonCheckFill size={24} />} iconBgColor="sky.500" />
                <StatCard label="Received Bill" value={stats.receivedBill} icon={<BsCart3 size={24} />} iconBgColor="green.500" />
                <StatCard label="Pending Bill" value={stats.pendingBill.toLocaleString()} icon={<BsCheckCircle size={24} />} iconBgColor="purple.500" />
            </Grid>
        </Box>
    );
};

export default PerformanceStatsSection;