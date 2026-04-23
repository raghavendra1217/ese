import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  HStack,
  Text,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Flex
} from '@chakra-ui/react';
import { RepeatIcon, DownloadIcon } from '@chakra-ui/icons';
import DashboardStats from './DashboardStats';
import DisbursementTable from './DisbursementTable';
import { useAuth } from '../../AppContext';

const InvestorDashboard = ({ url }) => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [disbursements, setDisbursements] = useState([]);
  const [upcomingDisbursements, setUpcomingDisbursements] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingDisbursements, setIsLoadingDisbursements] = useState(true);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 50
  });
  const [pagination, setPagination] = useState(null);
  const [upcomingPagination, setUpcomingPagination] = useState(null);

  const { token } = useAuth();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');


  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await fetch(`${url}/api/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }

      const data = await response.json();
      if (data.success) {
        setDashboardStats(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch dashboard statistics');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set default stats to prevent page break
      setDashboardStats({
        thisMonth: { total_amount: 0, disbursement_count: 0 },
        totalDisbursed: { total_amount: 0, disbursement_count: 0 },
        totalInvested: { total_amount: 0, investor_count: 0 },
        pendingDisbursements: { disbursement_count: 0 },
        upcomingThisWeek: { disbursement_count: 0 },
        overdueDisbursements: { disbursement_count: 0 }
      });
      toast({
        title: 'Warning',
        description: 'Dashboard statistics temporarily unavailable',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch disbursements
  const fetchDisbursements = useCallback(async () => {
    try {
      setIsLoadingDisbursements(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`${url}/api/dashboard/disbursements?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch disbursements');
      }

      const data = await response.json();
      if (data.success) {
        setDisbursements(data.data.disbursements);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.message || 'Failed to fetch disbursements');
      }
    } catch (error) {
      console.error('Error fetching disbursements:', error);
      // Set empty disbursements to prevent page break
      setDisbursements([]);
      setPagination(null);
      toast({
        title: 'Warning',
        description: 'Disbursements temporarily unavailable',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingDisbursements(false);
    }
  }, [filters, token, url]);

  // Fetch upcoming disbursements
  const fetchUpcomingDisbursements = useCallback(async () => {
    try {
      setIsLoadingUpcoming(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`${url}/api/dashboard/disbursements/upcoming?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch upcoming disbursements');
      }

      const data = await response.json();
      if (data.success) {
        setUpcomingDisbursements(data.data.disbursements);
        setUpcomingPagination(data.data.pagination);
      } else {
        throw new Error(data.message || 'Failed to fetch upcoming disbursements');
      }
    } catch (error) {
      console.error('Error fetching upcoming disbursements:', error);
      setUpcomingDisbursements([]);
      setUpcomingPagination(null);
      toast({
        title: 'Warning',
        description: 'Upcoming disbursements temporarily unavailable',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingUpcoming(false);
    }
  }, [filters, token, url]);


  // Update disbursement status
  const handleUpdateDisbursement = async (id, data) => {
    try {
      const response = await fetch(`${url}/api/dashboard/disbursements/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update disbursement');
      }

      const result = await response.json();
      if (result.success) {
        // Refresh both stats and disbursements
        await Promise.all([fetchDashboardStats(), fetchDisbursements()]);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to update disbursement');
      }
    } catch (error) {
      console.error('Error updating disbursement:', error);
      throw error;
    }
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  // Handle page changes
  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  const handleUpcomingPageChange = (page) => {
    setFilters({ ...filters, page });
  };

  // Refresh all data
  const handleRefresh = async () => {
    await Promise.all([
      fetchDashboardStats(), 
      fetchDisbursements(), 
      fetchUpcomingDisbursements()
    ]);
    toast({
      title: 'Data refreshed',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // Export disbursements
  const handleExport = () => {
    // Create CSV content
    const headers = ['ID', 'Investor', 'Mobile', 'Coordinator', 'Plan', 'Amount', 'Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...disbursements.map(d => [
        d.id,
        d.first_name,
        d.mobile_number,
        d.coordinator || 'N/A',
        `${d.plan_type} - ${d.select_plan}`,
        d.disbursement_amount,
        d.disbursement_date,
        d.status
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disbursements-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export successful',
      description: 'Disbursements data exported to CSV',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    fetchDisbursements();
    fetchUpcomingDisbursements();
  }, [filters, token, url, fetchDisbursements, fetchUpcomingDisbursements]);

  if (error) {
    return (
      <Alert status="error" borderRadius="lg">
        <AlertIcon />
        <Box>
          <AlertTitle>Error loading dashboard!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Box>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Dashboard Stats */}
      <DashboardStats stats={dashboardStats} isLoading={isLoadingStats} />


      {/* Disbursements Table */}
      <DisbursementTable
        disbursements={disbursements}
        isLoading={isLoadingDisbursements}
        onUpdateDisbursement={handleUpdateDisbursement}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </Box>
  );
};

export default InvestorDashboard;