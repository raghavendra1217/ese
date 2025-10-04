import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  useColorModeValue,
  Container,
  Grid,
  GridItem,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Button,
  useToast,
  Spinner,
  Center,
  Badge,
  Divider,
  Flex,
  IconButton,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import {
  FaUsers,
  FaChartLine,
  FaTasks,
  FaBell,
  FaUserCheck,
  FaUserTimes,
} from 'react-icons/fa';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import CoordinatorNavBar, { NAV_WIDTH } from '../../components/layout/CoordinatorNavBar';

const CoordinatorDashboard = ({ url }) => {
  const { user, token } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [dashboardData, setDashboardData] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    assignedVendors: 0,
    activeVendors: 0,
    recentActivities: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const grayBg = useColorModeValue('gray.50', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'gray.200');

  // Mock data for now - replace with actual API calls
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - replace with actual API calls
        setDashboardData({
          totalTasks: 25,
          completedTasks: 18,
          pendingTasks: 7,
          assignedVendors: 45,
          activeVendors: 38,
          recentActivities: [
            { id: 1, action: 'Vendor approval completed', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), type: 'success' },
            { id: 2, action: 'New vendor registration', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), type: 'info' },
            { id: 3, action: 'Task assigned to vendor', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), type: 'info' },
            { id: 4, action: 'Vendor profile updated', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), type: 'info' },
            { id: 5, action: 'Monthly report generated', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), type: 'success' },
          ]
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'success':
        return <FaUserCheck color="green" />;
      case 'warning':
        return <FaBell color="orange" />;
      case 'error':
        return <FaUserTimes color="red" />;
      default:
        return <FaTasks color="blue" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'success':
        return 'green.500';
      case 'warning':
        return 'orange.500';
      case 'error':
        return 'red.500';
      default:
        return 'blue.500';
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Unknown';

    const now = new Date();
    const diffInMs = now - new Date(timestamp);
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    } else if (diffInDays < 7) {
      return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    } else {
      return new Date(timestamp).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (isLoading) {
    return (
      <Flex minH="100vh" bg={pageBg}>
        {/* Desktop sidebar */}
        <CoordinatorNavBar variant="static" onOpen={onOpen} />

        {/* Mobile drawer */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <CoordinatorNavBar variant="drawer" onClose={onClose} />
          </DrawerContent>
        </Drawer>

        {/* Main content */}
        <Box flex="1" ml={{ base: 0, md: NAV_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
          <Center h="400px">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text>Loading dashboard...</Text>
            </VStack>
          </Center>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg={pageBg}>
      {/* Desktop sidebar */}
      <CoordinatorNavBar variant="static" onOpen={onOpen} />

      {/* Mobile drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <CoordinatorNavBar variant="drawer" onClose={onClose} />
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <Box flex="1" ml={{ base: 0, md: NAV_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
        {/* Mobile header */}
        <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon w={5} h={5} />}
            onClick={onOpen}
            size="sm"
            variant="ghost"
          />
          <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">
            Coordinator Dashboard
          </Heading>
        </Flex>

        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="lg" color={textColor}>
              Welcome back, {user?.name || 'Coordinator'}! 👋
            </Heading>
            <Text color="gray.500" mt={1}>
              Here's what's happening with your coordinations today
            </Text>
          </Box>

        {/* Stats Grid */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
          {/* Total Tasks */}
          <GridItem>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Tasks</StatLabel>
                  <StatNumber color="blue.500">{dashboardData.totalTasks}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    +3 from last week
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>

          {/* Completed Tasks */}
          <GridItem>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Completed Tasks</StatLabel>
                  <StatNumber color="green.500">{dashboardData.completedTasks}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    {Math.round((dashboardData.completedTasks / dashboardData.totalTasks) * 100)}% completion rate
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>

          {/* Pending Tasks */}
          <GridItem>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Pending Tasks</StatLabel>
                  <StatNumber color="orange.500">{dashboardData.pendingTasks}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="decrease" />
                    -2 from yesterday
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>

          {/* Assigned Vendors */}
          <GridItem>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Assigned Vendors</StatLabel>
                  <StatNumber color="purple.500">{dashboardData.assignedVendors}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    {dashboardData.activeVendors} active
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Main Content Grid */}
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
          {/* Recent Activities */}
          <GridItem>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Heading size="md" color={textColor}>
                      Recent Activities
                    </Heading>
                    <Button size="sm" variant="ghost" colorScheme="blue">
                      View All
                    </Button>
                  </HStack>
                  
                  <Divider />
                  
                  <VStack spacing={3} align="stretch">
                    {dashboardData.recentActivities.map((activity) => (
                      <HStack key={activity.id} spacing={3} p={3} bg={grayBg} borderRadius="md">
                        <Box color={getActivityColor(activity.type)}>
                          {getActivityIcon(activity.type)}
                        </Box>
                        <VStack align="start" spacing={1} flex="1">
                          <Text fontSize="sm" fontWeight="medium">
                            {activity.action}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {formatRelativeTime(activity.timestamp)}
                          </Text>
                        </VStack>
                        <Badge
                          colorScheme={activity.type === 'success' ? 'green' : activity.type === 'warning' ? 'orange' : 'blue'}
                          variant="subtle"
                          size="sm"
                        >
                          {activity.type}
                        </Badge>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Quick Actions */}
          <GridItem>
            <VStack spacing={6} align="stretch">
              {/* Quick Actions Card */}
              <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" color={textColor}>
                      Quick Actions
                    </Heading>
                    
                    <VStack spacing={3} align="stretch">
                      <Button
                        leftIcon={<FaUsers />}
                        colorScheme="blue"
                        variant="outline"
                        size="lg"
                        justifyContent="flex-start"
                      >
                        Manage Vendors
                      </Button>
                      
                      <Button
                        leftIcon={<FaTasks />}
                        colorScheme="green"
                        variant="outline"
                        size="lg"
                        justifyContent="flex-start"
                      >
                        View Tasks
                      </Button>
                      
                      <Button
                        leftIcon={<FaChartLine />}
                        colorScheme="purple"
                        variant="outline"
                        size="lg"
                        justifyContent="flex-start"
                      >
                        Generate Report
                      </Button>
                      
                      <Button
                        leftIcon={<FaBell />}
                        colorScheme="orange"
                        variant="outline"
                        size="lg"
                        justifyContent="flex-start"
                      >
                        Notifications
                      </Button>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Performance Summary */}
              <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" color={textColor}>
                      Performance Summary
                    </Heading>
                    
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">Task Completion Rate</Text>
                        <Text fontSize="sm" fontWeight="bold" color="green.500">
                          {Math.round((dashboardData.completedTasks / dashboardData.totalTasks) * 100)}%
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">Active Vendors</Text>
                        <Text fontSize="sm" fontWeight="bold" color="blue.500">
                          {dashboardData.activeVendors}/{dashboardData.assignedVendors}
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">Pending Tasks</Text>
                        <Text fontSize="sm" fontWeight="bold" color="orange.500">
                          {dashboardData.pendingTasks}
                        </Text>
                      </HStack>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </GridItem>
        </Grid>
        </VStack>
      </Box>
    </Flex>
  );
};

export default CoordinatorDashboard;
