import React from 'react';
import { Box, Flex, Grid, Heading, Text, Button, useColorModeValue } from '@chakra-ui/react';
import { FaUsers } from 'react-icons/fa';
import { BsCheckCircle, BsPersonCheckFill, BsCart3 } from 'react-icons/bs';
// Import Card Components
import StatCard from './cards/StatCard';
import ApprovalStatCard from './cards/ApprovalStatCard';
import UploadResumeCard from './cards/UploadResumeCard';

const ResumeStatsSection = ({ stats, onUploadSuccess, url }) => {
    const textColor = useColorModeValue('gray.800', 'white');
    const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');

    return (
        <Box as="section" mb={8}>
            <Flex justify="space-between" align="center" mb={4}>
                <Box>
                    <Heading as="h1" size="xl" color={textColor}>Dashboard</Heading>
                    <Text color={secondaryTextColor}>Resume Uploading</Text>
                </Box>
                <Flex gap={2}>
                    <Button variant="outline">Manage</Button>
                    <Button colorScheme="blue">Add Member</Button>
                </Flex>
            </Flex>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
                <StatCard label="Available Vacancies" value={stats.availableVacancies} icon={<FaUsers size={24} />} iconBgColor="blue.500" />
                <ApprovalStatCard value={stats.pendingVendorApprovals} />
                <UploadResumeCard count={stats.uploadedResume} onUploadSuccess={onUploadSuccess} url={url} />
                <StatCard label="Pending Resumes" value={stats.pendingForApproval} icon={<BsCheckCircle size={24} />} iconBgColor="purple.500" />
                <StatCard label="Verified Resumes" value={stats.verifiedResumes} icon={<FaUsers size={24} />} iconBgColor="blue.500" />
                <StatCard label="Employees on Hold" value={stats.employeesOnHold} icon={<BsPersonCheckFill size={24} />} iconBgColor="sky.500" />
                <StatCard label="Received Bill" value={stats.receivedBill} icon={<BsCart3 size={24} />} iconBgColor="green.500" />
                <StatCard label="Pending Bill" value={stats.pendingBill} icon={<BsCheckCircle size={24} />} iconBgColor="purple.500" />
            </Grid>
        </Box>
    );
};

export default ResumeStatsSection;