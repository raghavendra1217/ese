import React from 'react';
import {
  Box,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Text,
  Badge,
  HStack,
  Icon
} from '@chakra-ui/react';
import { 
  FaRupeeSign, 
  FaUsers, 
  FaClock, 
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';

const StatCard = ({ title, value, count, countType = 'disbursement', icon, color, trend, isLoading }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'green';
      case 'pending': return 'orange';
      case 'overdue': return 'red';
      default: return 'blue';
    }
  };

  return (
    <Box
      bg={bgColor}
      p={6}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
      boxShadow="sm"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
      transition="all 0.2s ease"
    >
      <Stat>
        <HStack justify="space-between" align="flex-start" mb={4}>
          <Box>
            <StatLabel fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
              {title}
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" color={color}>
              {isLoading ? '...' : formatCurrency(value)}
            </StatNumber>
            {count !== undefined && (
              <StatHelpText fontSize="sm" color="gray.500" mt={1}>
                {count} {count === 1 ? countType : countType + 's'}
              </StatHelpText>
            )}
          </Box>
          <Icon as={icon} boxSize={8} color={color} opacity={0.7} />
        </HStack>
        
        {trend && (
          <HStack spacing={2}>
            <StatArrow type={trend.type} />
            <Text fontSize="sm" color={trend.type === 'increase' ? 'green.500' : 'red.500'}>
              {trend.value}%
            </Text>
          </HStack>
        )}
      </Stat>
    </Box>
  );
};

const DashboardStats = ({ stats, isLoading }) => {
  const statsData = [
    {
      title: "Pending (Today)",
      value: stats?.thisMonth?.amount || 0,
      count: stats?.thisMonth?.count || 0,
      icon: FaCalendarAlt,
      color: "blue.500",
      trend: { type: 'increase', value: 12 }
    },
    {
      title: "Total Disbursed",
      value: stats?.totalDisbursed?.amount || 0,
      count: stats?.totalDisbursed?.count || 0,
      icon: FaCheckCircle,
      color: "green.500",
      trend: { type: 'increase', value: 8 }
    },
    {
      title: "Total Invested",
      value: stats?.totalInvested?.amount || 0,
      count: stats?.totalInvested?.count || 0,
      countType: "investor",
      icon: FaRupeeSign,
      color: "purple.500",
      trend: { type: 'increase', value: 15 }
    },
    {
      title: "Pending (Tomorrow)",
      value: stats?.pending?.amount || 0,
      count: stats?.pending?.count || 0,
      icon: FaClock,
      color: "orange.500"
    },
    {
      title: "Upcoming (Future)",
      value: stats?.upcoming?.amount || 0,
      count: stats?.upcoming?.count || 0,
      icon: FaCalendarAlt,
      color: "teal.500"
    },
    {
      title: "Overdue (Past)",
      value: stats?.overdue?.amount || 0,
      count: stats?.overdue?.count || 0,
      icon: FaExclamationTriangle,
      color: "red.500"
    },
    {
      title: "Future 15 Days",
      value: stats?.future15Days?.amount || 0,
      count: stats?.future15Days?.count || 0,
      icon: FaCalendarAlt,
      color: "purple.500",
      trend: { type: 'increase', value: 25 }
    }
  ];

  return (
    <Box mb={8}>
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
        {statsData.map((stat, index) => (
          <GridItem key={index}>
            <StatCard
              title={stat.title}
              value={stat.value}
              count={stat.count}
              icon={stat.icon}
              color={stat.color}
              trend={stat.trend}
              isLoading={isLoading}
            />
          </GridItem>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardStats;
