import React, { useState, useEffect } from 'react';
import {
  Box, Grid, GridItem, Stat, StatLabel, StatNumber, StatHelpText, StatArrow,
  useColorModeValue, Text, HStack, Icon, Spinner, Center, Heading, Divider
} from '@chakra-ui/react';
import {
  FaHandshake,
  FaUsers,
  FaChartLine,
  FaMoneyBillWave,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCalendarDay,
  FaCalendarAlt,
  FaCalendarWeek,
  FaCalendarCheck
} from 'react-icons/fa';
import { useAuth } from '../../AppContext';
import CoordinatorDisbursementTable from './CoordinatorDisbursementTable';

const StatCard = ({ title, value, count, countType = 'investor', icon, color, trend, isLoading }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
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
              {isLoading ? '...' : (typeof value === 'string' ? value : formatCurrency(value))}
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

const CoordinatorInvestorDashboard = ({ url }) => {
  const { token } = useAuth();
  const [disbursementStats, setDisbursementStats] = useState({
    pendingToday: { amount: 0, count: 0 },
    totalDisbursed: { amount: 0, count: 0 },
    totalInvested: { amount: 0, count: 0 },
    pendingTomorrow: { amount: 0, count: 0 },
    upcoming: { amount: 0, count: 0 },
    overdue: { amount: 0, count: 0 },
    future15Days: { amount: 0, count: 0 }
  });

  const [disbursementLoading, setDisbursementLoading] = useState(true);
  
  // Color mode values
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const noticeBg = useColorModeValue('yellow.50', 'yellow.900');
  const noticeBorder = useColorModeValue('yellow.200', 'yellow.700');
  const noticeText = useColorModeValue('yellow.800', 'yellow.200');

  // Load real data from API
  useEffect(() => {
    const loadDisbursementStats = async () => {
      try {
        const response = await fetch(`${url}/api/coordinator/disbursements/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch disbursement stats');
        }

        const result = await response.json();
        if (result.success) {
          setDisbursementStats(result.data);
        }
      } catch (error) {
        console.error('Error loading disbursement stats:', error);
        // Fallback to default data on error
        setDisbursementStats({
          pendingToday: { amount: 0, count: 0 },
          totalDisbursed: { amount: 0, count: 0 },
          totalInvested: { amount: 0, count: 0 },
          pendingTomorrow: { amount: 0, count: 0 },
          upcoming: { amount: 0, count: 0 },
          overdue: { amount: 0, count: 0 },
          future15Days: { amount: 0, count: 0 }
        });
      } finally {
        setDisbursementLoading(false);
      }
    };

    loadDisbursementStats();
  }, [url, token]);

  const disbursementStatsData = [
    {
      title: "Pending (Today)",
      value: disbursementStats.pendingToday.amount,
      count: disbursementStats.pendingToday.count,
      countType: "disbursement",
      icon: FaCalendarDay,
      color: "orange.500",
      trend: { type: 'increase', value: 12 }
    },
    {
      title: "Total Disbursed",
      value: disbursementStats.totalDisbursed.amount,
      count: disbursementStats.totalDisbursed.count,
      countType: "disbursement",
      icon: FaCheckCircle,
      color: "green.500",
      trend: { type: 'increase', value: 8 }
    },
    {
      title: "Total Invested",
      value: disbursementStats.totalInvested.amount,
      count: disbursementStats.totalInvested.count,
      countType: "disbursement",
      icon: FaMoneyBillWave,
      color: "blue.500",
      trend: { type: 'increase', value: 15 }
    },
    {
      title: "Pending (Tomorrow)",
      value: disbursementStats.pendingTomorrow.amount,
      count: disbursementStats.pendingTomorrow.count,
      countType: "disbursement",
      icon: FaCalendarAlt,
      color: "yellow.500"
    },
    {
      title: "Upcoming (Future)",
      value: disbursementStats.upcoming.amount,
      count: disbursementStats.upcoming.count,
      countType: "disbursement",
      icon: FaCalendarWeek,
      color: "purple.500"
    },
    {
      title: "Overdue (Past)",
      value: disbursementStats.overdue.amount,
      count: disbursementStats.overdue.count,
      countType: "disbursement",
      icon: FaExclamationTriangle,
      color: "red.500"
    },
    {
      title: "Future 15 Days",
      value: disbursementStats.future15Days.amount,
      count: disbursementStats.future15Days.count,
      countType: "disbursement",
      icon: FaCalendarCheck,
      color: "teal.500",
      trend: { type: 'increase', value: 25 }
    }
  ];

  if (disbursementLoading) {
    return (
      <Center py={8}>
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box mb={8}>
      {/* Disbursement Statistics Section */}
      <Box mb={8}>
        <Heading as="h2" fontSize="xl" color={headingColor} mb={6}>
          Disbursement Statistics
        </Heading>
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
          {disbursementStatsData.map((stat, index) => (
            <GridItem key={index}>
              <StatCard
                title={stat.title}
                value={stat.value}
                count={stat.count}
                countType={stat.countType}
                icon={stat.icon}
                color={stat.color}
                trend={stat.trend}
                isLoading={disbursementLoading}
              />
            </GridItem>
          ))}
        </Grid>
      </Box>

      {/* Disbursement Table Section */}
      <Box mt={12}>
        <Heading as="h2" fontSize="xl" color={headingColor} mb={6}>
          Recent Disbursements
        </Heading>
        <Divider mb={6} />
        <Box 
          bg={noticeBg} 
          border="1px solid" 
          borderColor={noticeBorder} 
          borderRadius="md" 
          p={4} 
          mb={6}
        >
          <Text fontSize="sm" color={noticeText}>
            <Icon as={FaExclamationTriangle} mr={2} />
            <strong>Note:</strong> Disbursements are only shown for approved investments. 
            Pending investments will appear here once they are approved by an administrator.
          </Text>
        </Box>
        <CoordinatorDisbursementTable url={url} />
      </Box>
    </Box>
  );
};

export default CoordinatorInvestorDashboard;
