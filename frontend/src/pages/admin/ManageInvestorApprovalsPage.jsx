import React, { useState, useEffect } from 'react';
import {
  Box, VStack, Heading, Text, useColorModeValue, Spinner, Center, SimpleGrid,
  Button, useToast, Badge, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, useDisclosure, Divider, Flex, IconButton, 
  Drawer, DrawerOverlay, DrawerContent, HStack, Grid, GridItem, 
  FormControl, FormLabel, Textarea
} from '@chakra-ui/react';
import { HamburgerIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { FaHandshake, FaMoneyBillWave, FaCalendarAlt, FaUser, FaBuilding, FaWhatsapp } from 'react-icons/fa';
import { useAuth } from '../../AppContext';
import AdminNavBar from '../../components/layout/AdminNavBar';

const ADMIN_SIDEBAR_W = '80px';

const InvestorApprovalCard = ({ investor, onApprove, onReject, url }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
  };

  const getPlanAmount = () => {
    const plan = investor.select_plan;
    switch (plan) {
      case '5k': return '₹5,000';
      case '10k': return '₹10,000';
      case '50k': return '₹50,000';
      case '1 lakh': return '₹1,00,000';
      case '5 lakh': return '₹5,00,000';
      default: return '₹0';
    }
  };

  const handleApprove = () => {
    onApprove(investor.id);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      return;
    }
    onReject(investor.id, rejectionReason);
    setRejectionReason('');
    onClose();
  };

  const handleWhatsAppClick = () => {
    const phoneNumber = investor.mobile_number?.replace(/\D/g, '') || '';
    const fullPhoneNumber = `91${phoneNumber}`;
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=${fullPhoneNumber}&type=phone_number&app_absent=0`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleViewHTML = () => {
    const htmlUrl = `${url}/api/html/investor/${investor.id}`;
    window.open(htmlUrl, '_blank');
  };

  return (
    <>
      <VStack bg={cardBg} p={6} borderRadius="xl" boxShadow="lg" align="stretch" spacing={4} position="relative">
        {/* Header with ID and Status */}
        <HStack justify="space-between" align="flex-start">
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="lg" fontWeight="bold" color="gray.800">
              {investor.first_name}
            </Text>
            <Text fontSize="sm" color="gray.600" fontFamily="monospace">
              ID: #{investor.id}
            </Text>
          </VStack>
          <Badge colorScheme="yellow" variant="solid" borderRadius="full" px={3} py={1}>
            Pending
          </Badge>
        </HStack>

        <Divider />

        {/* Investment Details */}
        <VStack spacing={3} align="stretch">
          <HStack spacing={4}>
            <Box flex="1">
              <HStack spacing={2} mb={1}>
                <FaMoneyBillWave size={14} color="#3182ce" />
                <Text fontSize="sm" fontWeight="medium" color="gray.700">Investment Plan</Text>
              </HStack>
              <Text fontSize="lg" fontWeight="bold" color="blue.600">
                {investor.plan_type} - {investor.select_plan}
              </Text>
              <Text fontSize="sm" color="gray.600">
                Amount: {getPlanAmount()}
              </Text>
            </Box>
          </HStack>

          <HStack spacing={4}>
            <Box flex="1">
              <HStack spacing={2} mb={1}>
                <FaUser size={14} color="#3182ce" />
                <Text fontSize="sm" fontWeight="medium" color="gray.700">Contact</Text>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                {investor.mobile_number}
              </Text>
              {investor.coordinator && (
                <Text fontSize="sm" color="gray.600">
                  Coordinator: {investor.coordinator}
                </Text>
              )}
            </Box>
          </HStack>

          <HStack spacing={4}>
            <Box flex="1">
              <HStack spacing={2} mb={1}>
                <FaCalendarAlt size={14} color="#3182ce" />
                <Text fontSize="sm" fontWeight="medium" color="gray.700">Dates</Text>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                Investment: {formatDate(investor.investment_date)}
              </Text>
              <Text fontSize="sm" color="gray.600">
                Created: {formatDate(investor.created_at)}
              </Text>
            </Box>
          </HStack>

          {/* Banking Details */}
          {investor.bank_name && (
            <Box>
              <HStack spacing={2} mb={1}>
                <FaBuilding size={14} color="#3182ce" />
                <Text fontSize="sm" fontWeight="medium" color="gray.700">Banking</Text>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                {investor.bank_name} - {investor.branch_name}
              </Text>
              <Text fontSize="sm" color="gray.600" fontFamily="monospace">
                A/C: {investor.bank_account_number}
              </Text>
              <Text fontSize="sm" color="gray.600" fontFamily="monospace">
                IFSC: {investor.ifsc_code}
              </Text>
            </Box>
          )}

          {/* Payment Details */}
          {investor.transaction_id && (
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Transaction ID</Text>
              <Text fontSize="sm" color="gray.600" fontFamily="monospace">
                {investor.transaction_id}
              </Text>
              <Text fontSize="sm" color="gray.600">
                Payment Mode: {investor.mode_of_payment}
              </Text>
            </Box>
          )}
        </VStack>

        <Divider />

        {/* Action Buttons */}
        <HStack spacing={3}>
          <IconButton
            aria-label="Contact on WhatsApp"
            icon={<FaWhatsapp />}
            size="sm"
            colorScheme="whatsapp"
            variant="outline"
            onClick={handleWhatsAppClick}
          />
          <Button
            size="sm"
            colorScheme="blue"
            variant="outline"
            leftIcon={<ExternalLinkIcon />}
            onClick={handleViewHTML}
            flex="1"
          >
            View Details
          </Button>
          <Button
            size="sm"
            colorScheme="red"
            variant="outline"
            onClick={onOpen}
            flex="1"
          >
            Reject
          </Button>
          <Button
            size="sm"
            colorScheme="green"
            onClick={handleApprove}
            flex="1"
          >
            Approve
          </Button>
        </HStack>
      </VStack>

      {/* Rejection Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reject Investment</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4} color="gray.600">
              Please provide a reason for rejecting this investment:
            </Text>
            <FormControl>
              <FormLabel>Rejection Reason</FormLabel>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={4}
                resize="vertical"
              />
            </FormControl>
            <HStack spacing={3} mt={6}>
              <Button variant="ghost" onClick={onClose} flex="1">
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleReject}
                flex="1"
                isDisabled={!rejectionReason.trim()}
                isLoading={isSubmitting}
              >
                Reject Investment
              </Button>
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

const ManageInvestorApprovalsPage = ({ url }) => {
  const mainBg = useColorModeValue('gray.50', 'gray.900');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const toast = useToast();
  const { token } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [investors, setInvestors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPendingInvestors = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const response = await fetch(`${url}/api/admin/pending-investors`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch pending investors.');
        const data = await response.json();
        setInvestors(data.investors || []);
      } catch (error) {
        toast({ 
          title: 'Error', 
          description: error.message, 
          status: 'error', 
          duration: 5000 
        });
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchPendingInvestors();
  }, [toast, token, url]);

  const handleApproveInvestor = async (investorId) => {
    try {
      const response = await fetch(`${url}/api/admin/approve-investor/${investorId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to approve investor.');
      
      toast({ 
        title: 'Success', 
        description: 'Investment approved successfully!', 
        status: 'success', 
        duration: 3000 
      });
      setInvestors(current => current.filter(inv => inv.id !== investorId));
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error.message, 
        status: 'error', 
        duration: 5000 
      });
    }
  };

  const handleRejectInvestor = async (investorId, reason) => {
    try {
      const response = await fetch(`${url}/api/admin/reject-investor/${investorId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reject investor.');
      
      toast({ 
        title: 'Success', 
        description: 'Investment rejected successfully.', 
        status: 'success', 
        duration: 3000 
      });
      setInvestors(current => current.filter(inv => inv.id !== investorId));
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error.message, 
        status: 'error', 
        duration: 5000 
      });
    }
  };

  return (
    <Flex minH="100vh" bg={mainBg}>
      {/* Desktop sidebar */}
      <AdminNavBar variant="static" onOpen={onOpen} />
      {/* Mobile drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <AdminNavBar variant="drawer" onClose={onClose} />
        </DrawerContent>
      </Drawer>

      <Box flex="1" ml={{ base: 0, md: ADMIN_SIDEBAR_W }} p={{ base: 4, sm: 6, md: 8 }}>
        {/* Mobile header */}
        <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
          <IconButton aria-label="Open menu" icon={<HamburgerIcon w={5} h={5} />} onClick={onOpen} size="sm" variant="ghost" />
          <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">
            Approve Investments
          </Heading>
        </Flex>

        <VStack spacing={8} align="stretch">
          <Box>
            <Heading as="h1" size="xl" color={headingColor} display={{ base: 'none', md: 'block' }}>
              Approve Investments
            </Heading>
            <Text color="gray.500" display={{ base: 'none', md: 'block' }}>
              Review and approve pending investment applications from coordinators.
            </Text>
          </Box>

          {isLoading ? (
            <Center h="200px">
              <Spinner size="xl" />
            </Center>
          ) : investors.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {investors.map(investor => (
                <InvestorApprovalCard
                  key={investor.id}
                  investor={investor}
                  onApprove={handleApproveInvestor}
                  onReject={handleRejectInvestor}
                  url={url}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Center h="200px" bg="white" borderRadius="lg" boxShadow="sm">
              <VStack spacing={4}>
                <FaHandshake size={48} color="#a0aec0" />
                <Text fontSize="lg" color="gray.500">
                  No pending investment approvals at this time.
                </Text>
                <Text fontSize="sm" color="gray.400">
                  All investments have been reviewed.
                </Text>
              </VStack>
            </Center>
          )}
        </VStack>
      </Box>
    </Flex>
  );
};

export default ManageInvestorApprovalsPage;
