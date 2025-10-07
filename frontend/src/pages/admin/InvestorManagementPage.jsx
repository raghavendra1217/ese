import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, Heading, Button, IconButton, useToast, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, NumberInput, NumberInputField, AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useColorModeValue, Text, Badge, HStack,
  Select, Textarea, Grid, GridItem, Tabs, TabList, TabPanels, Tab, TabPanel, VStack, InputGroup, InputLeftElement,
  Tooltip
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon, HamburgerIcon, ExternalLinkIcon, SearchIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import AdminNavBar from '../../components/layout/AdminNavBar';
import InvestorDashboard from '../../components/admin/InvestorDashboard';

const ADMIN_SIDEBAR_W = '80px';

const InvestorModal = ({
  isOpen,
  onClose,
  onSave,
  investor, // Passed correctly now
  isEditing,
  coordinators,
  url,
  token,
  // These props are not used directly in InvestorModal, but were passed down.
  // Removing them from here to simplify, as the parent handles coordinator editing.
  // handleEditCoordinator,
  // updateInvestorCoordinator,
  // isCoordEditOpen,
  // onCoordEditClose,
  // editingCoordinator,
  // selectedCoordinator,
  // setSelectedCoordinator,
  // isLoading, // The internal isLoading state handles form submission
}) => {
  const initialFormState = {
    first_name: '',
    mobile_number: '',
    pan_card: '',
    coordinator_id: '',
    co_name: '',
    bank_account_number: '',
    bank_name: '',
    branch_name: '',
    ifsc_code: '',
    mode_of_payment: '',
    plan_type: '',
    select_plan: '',
    transaction_id: '',
    address: '',
    investment_date: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(false); // Internal loading for the modal form submission

  useEffect(() => {
    if (isOpen) {
      if (isEditing && investor) {
        console.log('🔍 Setting form data for editing:', {
          investor,
          isEditing,
          investorData: {
            first_name: investor.first_name,
            mobile_number: investor.mobile_number
          }
        });
        setFormData({
          first_name: investor.first_name || '',
          mobile_number: investor.mobile_number || '',
          pan_card: investor.pan_card || '',
          coordinator_id: investor.coordinator_id || '', // Use coordinator_id for editing
          co_name: investor.co_name || '',
          bank_account_number: investor.bank_account_number || '',
          bank_name: investor.bank_name || '',
          branch_name: investor.branch_name || '',
          ifsc_code: investor.ifsc_code || '',
          mode_of_payment: investor.mode_of_payment || '',
          plan_type: investor.plan_type || '',
          select_plan: investor.select_plan || '',
          transaction_id: investor.transaction_id || '',
          address: investor.address || '',
          investment_date: investor.investment_date ? investor.investment_date.split('T')[0] : ''
        });
      } else {
        console.log('🔍 Setting form data for new investor');
        setFormData(initialFormState);
      }
    }
  }, [isOpen, isEditing, investor]); // Add investor to dependencies

  const handleChange = (e) => {
    console.log('🔍 Form field changed:', {
      fieldName: e.target.name,
      fieldValue: e.target.value,
      fieldType: e.target.type,
      currentFormData: formData
    });

    if (e.target.type === 'file') {
      const file = e.target.files[0];
      if (file) {
        // File handling removed - attachment_path field deleted, so this block is now effectively a no-op
      }
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSelectChange = (name, value) => {
    let newFormData = { ...formData, [name]: value };

    // Validation: 10k can only be combined with 30 days
    if (name === 'select_plan' && value === '10k') {
      if (newFormData.plan_type && newFormData.plan_type !== '30 days') {
        newFormData.plan_type = '30 days'; // Force 30 days
      }
    } else if (name === 'plan_type' && newFormData.select_plan === '10k' && value !== '30 days') {
      newFormData.select_plan = ''; // Clear plan if type changes and it's 10k
    }

    setFormData(newFormData);
  };

  // handleNumberChange was not used in the provided JSX, but kept for completeness
  const handleNumberChange = (value, name) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving investor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "6xl" }} scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH={{ base: "100vh", md: "95vh" }} maxW={{ base: "100vw", md: "90vw" }} borderRadius={{ base: "none", md: "lg" }}>
        <ModalHeader fontSize="xl" fontWeight="bold" color="gray.700" textAlign="center" borderBottom="1px" borderColor="gray.200" position="relative">
          {isEditing ? 'Edit Investor Details' : 'Add New Investor'}
          <IconButton
            aria-label="Close"
            icon={<Text fontSize="lg">×</Text>}
            size="sm"
            variant="ghost"
            position="absolute"
            right={4}
            top="50%"
            transform="translateY(-50%)"
            onClick={onClose}
            _hover={{ bg: "gray.100" }}
          />
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody overflowY="auto" maxH={{ base: "80vh", md: "70vh" }} px={{ base: 4, md: 6 }} py={4}>
            {/* Single 3-column grid for all fields */}
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
              gap={4}
              h="auto"
            >
              {/* Row 1: First Name, Mobile Number, PAN Card */}
              <GridItem>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium" color="gray.700" fontSize="sm" mb={1}>
                    First Name
                  </FormLabel>
                  <Input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    size="md"
                    borderRadius="md"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce"
                    }}
                    transition="all 0.2s ease"
                  />
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium" color="gray.700" fontSize="sm" mb={1}>
                    Mobile Number
                  </FormLabel>
                  <Input
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleChange}
                    placeholder="Enter mobile number"
                    size="md"
                    borderRadius="md"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce"
                    }}
                    transition="all 0.2s ease"
                  />
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.700" fontSize="sm" mb={1}>
                    PAN Card
                  </FormLabel>
                  <Input
                    name="pan_card"
                    value={formData.pan_card}
                    onChange={handleChange}
                    placeholder="Enter PAN card number"
                    size="md"
                    borderRadius="md"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce"
                    }}
                    transition="all 0.2s ease"
                  />
                </FormControl>
              </GridItem>

              {/* Row 2: Coordinator, Bank Account Number, Bank Name */}
              <GridItem>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.700" fontSize="sm" mb={1}>
                    Coordinator
                  </FormLabel>
                  <Select
                    name="coordinator_id"
                    value={formData.coordinator_id}
                    onChange={handleChange}
                    placeholder="Select Coordinator"
                    size="md"
                    borderRadius="md"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce"
                    }}
                    transition="all 0.2s ease"
                  >
                    {coordinators.map((coord) => (
                      <option key={coord.coordinator_id} value={coord.coordinator_id}>
                        {coord.name} ({coord.coordinator_id})
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.700" fontSize="sm" mb={1}>
                    Bank Account Number
                  </FormLabel>
                  <Input
                    name="bank_account_number"
                    value={formData.bank_account_number}
                    onChange={handleChange}
                    placeholder="Enter bank account number"
                    size="md"
                    borderRadius="md"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce"
                    }}
                    transition="all 0.2s ease"
                  />
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.700" fontSize="sm" mb={1}>
                    Bank Name
                  </FormLabel>
                  <Input
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleChange}
                    placeholder="Enter bank name"
                    size="md"
                    borderRadius="md"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce"
                    }}
                    transition="all 0.2s ease"
                  />
                </FormControl>
              </GridItem>

              {/* Row 3: Branch Name, IFSC Code, C/O */}
              <GridItem>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.700" fontSize="sm" mb={1}>
                    Branch Name
                  </FormLabel>
                  <Input
                    name="branch_name"
                    value={formData.branch_name}
                    onChange={handleChange}
                    placeholder="Enter branch name"
                    size="md"
                    borderRadius="md"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce"
                    }}
                    transition="all 0.2s ease"
                  />
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.700" fontSize="sm" mb={1}>
                    IFSC Code
                  </FormLabel>
                  <Input
                    name="ifsc_code"
                    value={formData.ifsc_code}
                    onChange={handleChange}
                    placeholder="Enter IFSC code"
                    size="md"
                    borderRadius="md"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce"
                    }}
                    transition="all 0.2s ease"
                  />
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.700" fontSize="sm" mb={1}>
                    C/O
                  </FormLabel>
                  <Input
                    name="co_name"
                    value={formData.co_name}
                    onChange={handleChange}
                    placeholder="Enter C/O name"
                    size="md"
                    borderRadius="md"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce"
                    }}
                    transition="all 0.2s ease"
                  />
                </FormControl>
              </GridItem>

              {/* Row 4: Investment Date, Mode of Payment, Plan Type */}
              <GridItem>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.700" fontSize="sm" mb={1}>
                    Investment Date
                  </FormLabel>
                  <Input
                    name="investment_date"
                    value={formData.investment_date}
                    onChange={handleChange}
                    type="date"
                    size="md"
                    borderRadius="md"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce"
                    }}
                    transition="all 0.2s ease"
                  />
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.700" fontSize="sm" mb={1}>
                    Mode of Payment
                  </FormLabel>
                  <Select
                    name="mode_of_payment"
                    value={formData.mode_of_payment}
                    onChange={(e) => handleSelectChange('mode_of_payment', e.target.value)}
                    placeholder="Select payment mode"
                    size="md"
                    borderRadius="md"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce"
                    }}
                    transition="all 0.2s ease"
                  >
                    <option value="Phone Pe">Phone Pe</option>
                    <option value="GPay">GPay</option>
                    <option value="Netbanking">Netbanking</option>
                    <option value="Cash">Cash</option>
                    <option value="Paytm">Paytm</option>
                    <option value="Banks">Banks</option>
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.700" fontSize="sm" mb={1}>
                    Plan Type
                  </FormLabel>
                  <Select
                    name="plan_type"
                    value={formData.plan_type}
                    onChange={(e) => handleSelectChange('plan_type', e.target.value)}
                    placeholder="Select plan type"
                    size="md"
                    borderRadius="md"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce"
                    }}
                    transition="all 0.2s ease"
                  >
                    <option value="30 days">30 days</option>
                    <option value="32 days">32 days</option>
                    <option value="60 days">60 days</option>
                    <option value="120 days">120 days</option>
                    <option value="180 days">180 days</option>
                    <option value="240 days">240 days</option>
                  </Select>
                </FormControl>
              </GridItem>

              {/* Row 5: Select Plan, Transaction ID, Empty */}
              <GridItem>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.700" fontSize="sm" mb={1}>
                    Select Plan
                  </FormLabel>
                  <Select
                    name="select_plan"
                    value={formData.select_plan}
                    onChange={(e) => handleSelectChange('select_plan', e.target.value)}
                    placeholder="Select plan"
                    size="md"
                    borderRadius="md"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce"
                    }}
                    transition="all 0.2s ease"
                  >
                    <option value="5k">5k</option>
                    <option value="10k">10k</option>
                    <option value="50k">50k</option>
                    <option value="1 lakh">1 lakh</option>
                    <option value="5 lakh">5 lakh</option>
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.700" fontSize="sm" mb={1}>
                    Transaction ID
                  </FormLabel>
                  <Input
                    name="transaction_id"
                    value={formData.transaction_id}
                    onChange={handleChange}
                    placeholder="Enter transaction ID"
                    size="md"
                    borderRadius="md"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce"
                    }}
                    transition="all 0.2s ease"
                  />
                </FormControl>
              </GridItem>

              <GridItem></GridItem> {/* Empty GridItem to maintain 3-column layout */}

              {/* Row 6: Address (full width) */}
              <GridItem colSpan={{ base: 1, md: 3 }}>
                <FormControl>
                  <FormLabel fontWeight="medium" color="gray.700" fontSize="sm" mb={1}>
                    Address
                  </FormLabel>
                  <Textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter full address"
                    size="md"
                    borderRadius="md"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce"
                    }}
                    transition="all 0.2s ease"
                    rows={3}
                  />
                </FormControl>
              </GridItem>
            </Grid>

            {/* Disbursement Schedule Preview */}
            {formData.select_plan && formData.plan_type && formData.investment_date && (
              <Box mt={6} p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                <Text fontSize="lg" fontWeight="bold" color="blue.700" mb={3}>
                  Disbursement Schedule Preview
                </Text>

                <Box mb={3}>
                  <Text fontSize="sm" color="gray.600" mb={1}>
                    <strong>Investment Plan:</strong> ₹{(() => {
                      if (formData.select_plan === '5k') return '5,000';
                      if (formData.select_plan === '10k') return '10,000';
                      if (formData.select_plan === '50k') return '50,000';
                      if (formData.select_plan === '1 lakh') return '1,00,000';
                      if (formData.select_plan === '5 lakh') return '5,00,000';
                      return '0';
                    })()} → Return ₹{(() => {
                      if (formData.select_plan === '5k' && formData.plan_type === '32 days') return '6,000';
                      if (formData.select_plan === '10k' && formData.plan_type === '30 days') return '11,500';
                      if (formData.select_plan === '50k' && formData.plan_type === '60 days') return '60,000';
                      if (formData.select_plan === '1 lakh' && formData.plan_type === '60 days') return '1,20,000';
                      if (formData.select_plan === '50k' && formData.plan_type === '120 days') return '68,000';
                      if (formData.select_plan === '1 lakh' && formData.plan_type === '120 days') return '1,38,000';
                      if (formData.select_plan === '50k' && formData.plan_type === '180 days') return '80,000';
                      if (formData.select_plan === '50k' && formData.plan_type === '240 days') return '90,000';
                      if (formData.select_plan === '1 lakh' && formData.plan_type === '180 days') return '1,60,000';
                      if (formData.select_plan === '1 lakh' && formData.plan_type === '240 days') return '1,80,000';
                      if (formData.select_plan === '5 lakh' && formData.plan_type === '240 days') return '9,00,000';
                      return '0';
                    })()}
                  </Text>
                  <Text fontSize="sm" color="gray.600" mb={1}>
                    <strong>Duration:</strong> {formData.plan_type} | <strong>Disbursements:</strong> {(() => {
                      if (formData.plan_type === '30 days') return '2';
                      if (formData.plan_type === '32 days') return '4';
                      if (formData.plan_type === '60 days') return '4';
                      if (formData.plan_type === '120 days') return '8';
                      if (formData.plan_type === '180 days') return '13';
                      if (formData.plan_type === '240 days') return '17';
                      return '0';
                    })()} payments every {(() => {
                      if (formData.plan_type === '32 days') return '8';
                      return '15';
                    })()} days
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    <strong>Amount per Disbursement:</strong> ₹{(() => {
                      if (formData.select_plan === '5k' && formData.plan_type === '32 days') return '1,500';
                      if (formData.select_plan === '10k' && formData.plan_type === '30 days') return '5,750';
                      if (formData.select_plan === '50k' && formData.plan_type === '60 days') return '15,000';
                      if (formData.select_plan === '1 lakh' && formData.plan_type === '60 days') return '30,000';
                      if (formData.select_plan === '50k' && formData.plan_type === '120 days') return '8,500';
                      if (formData.select_plan === '1 lakh' && formData.plan_type === '120 days') return '17,250';
                      if (formData.select_plan === '50k' && formData.plan_type === '180 days') return '2,500 (first 12) + 50,000 (13th)';
                      if (formData.select_plan === '50k' && formData.plan_type === '240 days') return '2,500 (first 16) + 50,000 (17th)';
                      if (formData.select_plan === '1 lakh' && formData.plan_type === '180 days') return '5,000 (first 12) + 1,00,000 (13th)';
                      if (formData.select_plan === '1 lakh' && formData.plan_type === '240 days') return '5,000 (first 16) + 1,00,000 (17th)';
                      if (formData.select_plan === '5 lakh' && formData.plan_type === '240 days') return '25,000 (first 16) + 5,00,000 (17th)';
                      return '0';
                    })()}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>
                    Scheduled Disbursement Dates:
                  </Text>
                  {(() => {
                    if (!formData.investment_date) return <Text fontSize="sm" color="gray.500">Please select an Investment Date.</Text>;

                    const investmentDate = new Date(formData.investment_date);
                    const disbursements = [];

                    // Get disbursement count and interval based on plan
                    const getPlanConfig = () => {
                      if (formData.select_plan === '5k' && formData.plan_type === '32 days') {
                        return { count: 4, interval: 8, amount: '1,500' };
                      } else if (formData.select_plan === '10k' && formData.plan_type === '30 days') {
                        return { count: 2, interval: 15, amount: '5,750' };
                      } else if (formData.select_plan === '50k' && formData.plan_type === '60 days') {
                        return { count: 4, interval: 15, amount: '15,000' };
                      } else if (formData.select_plan === '1 lakh' && formData.plan_type === '60 days') {
                        return { count: 4, interval: 15, amount: '30,000' };
                      } else if (formData.select_plan === '50k' && formData.plan_type === '120 days') {
                        return { count: 8, interval: 15, amount: '8,500' };
                      } else if (formData.select_plan === '1 lakh' && formData.plan_type === '120 days') {
                        return { count: 8, interval: 15, amount: '17,250' };
                      } else if (formData.select_plan === '50k' && formData.plan_type === '180 days') {
                        return { count: 13, interval: 15, amount: '2,500', specialPlan: true, principleReturnDay: 181, principleAmount: '50,000' };
                      } else if (formData.select_plan === '50k' && formData.plan_type === '240 days') {
                        return { count: 17, interval: 15, amount: '2,500', specialPlan: true, principleReturnDay: 241, principleAmount: '50,000' };
                      } else if (formData.select_plan === '1 lakh' && formData.plan_type === '180 days') {
                        return { count: 13, interval: 15, amount: '5,000', specialPlan: true, principleReturnDay: 181, principleAmount: '1,00,000' };
                      } else if (formData.select_plan === '1 lakh' && formData.plan_type === '240 days') {
                        return { count: 17, interval: 15, amount: '5,000', specialPlan: true, principleReturnDay: 241, principleAmount: '1,00,000' };
                      } else if (formData.select_plan === '5 lakh' && formData.plan_type === '240 days') {
                        return { count: 17, interval: 15, amount: '25,000', specialPlan: true, principleReturnDay: 241, principleAmount: '5,00,000' };
                      }
                      return { count: 0, interval: 15, amount: '0' };
                    };

                    const config = getPlanConfig();

                    for (let i = 1; i <= config.count; i++) {
                      const disbursementDate = new Date(investmentDate);

                      if (config.specialPlan) {
                        // General logic for special plans
                        if (i < config.count) {
                          disbursementDate.setDate(investmentDate.getDate() + (i * config.interval));
                          disbursements.push({
                            number: i,
                            date: disbursementDate.toLocaleDateString('en-IN'),
                            amount: config.amount
                          });
                        } else if (i === config.count) {
                          // Last disbursement for special plans is principle return
                          disbursementDate.setDate(investmentDate.getDate() + config.principleReturnDay);
                          disbursements.push({
                            number: i,
                            date: disbursementDate.toLocaleDateString('en-IN'),
                            amount: `${config.principleAmount} (Principle)`
                          });
                        }
                      } else {
                        // Regular plan handling
                        disbursementDate.setDate(investmentDate.getDate() + (i * config.interval));
                        disbursements.push({
                          number: i,
                          date: disbursementDate.toLocaleDateString('en-IN'),
                          amount: config.amount
                        });
                      }
                    }

                    return disbursements.map((disbursement, index) => (
                      <Text key={index} fontSize="sm" color="gray.600" mb={1}>
                        {disbursement.number}. {disbursement.date} → ₹{disbursement.amount}
                      </Text>
                    ));
                  })()}
                </Box>
              </Box>
            )}
          </ModalBody>
          <ModalFooter borderTop="1px" borderColor="gray.200" bg="gray.50" py={4}>
            <Button
              type="button"
              variant="ghost"
              mr={3}
              onClick={onClose}
              borderRadius="md"
              isDisabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              borderRadius="md"
              px={6}
              isLoading={isLoading}
              loadingText={isEditing ? 'Updating' : 'Adding'}
              >
                {isEditing ? 'Update Investor' : 'Add Investor'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    );
  };
  
  const InvestorManagementPage = ({ url }) => {
    const { token } = useAuth();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure(); // For Add/Edit Investor Modal
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure(); // For Delete Confirmation
    const { isOpen: isMobileNavOpen, onOpen: onMobileNavOpen, onClose: onMobileNavClose } = useDisclosure(); // For Mobile Navigation
    const { isOpen: isCoordEditOpen, onOpen: onCoordEditOpen, onClose: onCoordEditClose } = useDisclosure(); // For Coordinator Edit Modal
  
    const [investors, setInvestors] = useState([]);
    const [filteredInvestors, setFilteredInvestors] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // For main table loading
    const [coordinators, setCoordinators] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentInvestor, setCurrentInvestor] = useState(null);
    const [investorToDelete, setInvestorToDelete] = useState(null);
    const [editingCoordinator, setEditingCoordinator] = useState(null); // State for the investor being assigned a coordinator
    const [selectedCoordinator, setSelectedCoordinator] = useState(''); // State for the selected coordinator in the dropdown
    const [searchTerm, setSearchTerm] = useState('');
    const cancelRef = React.useRef();
  
    // Color mode values
    const mainBg = useColorModeValue('gray.50', '#181C27');
    const sidebarBg = '#212734';
    const sidebarBorder = 'gray.700';
    const headingColor = useColorModeValue('gray.800', 'gray.200');
    const iconColor = useColorModeValue('black', 'whiteAlpha.900');
    const tableBg = useColorModeValue('white', 'gray.800');
  
    // Fetch coordinators for dropdown
    const fetchCoordinators = useCallback(async () => {
      if (!token) return;
      try {
        const response = await fetch(`${url}/api/coordinator`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
  
        if (response.ok) {
          const data = await response.json();
          setCoordinators(data.coordinators || []);
        } else {
          throw new Error('Failed to fetch coordinators');
        }
      } catch (error) {
        console.error('Error fetching coordinators:', error);
        toast({
          title: 'Error fetching coordinators',
          description: error.message,
          status: 'error',
          isClosable: true
        });
      }
    }, [token, url, toast]);
  
    const fetchInvestors = useCallback(async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const response = await fetch(`${url}/api/investors`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch investors');
        console.log('🔍 Fetched investors:', data);
        setInvestors(data);
        setFilteredInvestors(data);
      } catch (error) {
        toast({
          title: 'Error fetching investors',
          description: error.message,
          status: 'error',
          isClosable: true
        });
      } finally {
        setIsLoading(false);
      }
    }, [token, toast, url]);
  
    useEffect(() => {
      fetchInvestors();
      fetchCoordinators();
    }, [fetchInvestors, fetchCoordinators]);

    // Search filtering effect
    useEffect(() => {
      if (!searchTerm.trim()) {
        setFilteredInvestors(investors);
      } else {
        const filtered = investors.filter(investor => 
          investor.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          investor.mobile_number?.includes(searchTerm) ||
          investor.id?.toString().includes(searchTerm) ||
          investor.coordinator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          investor.plan_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          investor.approval_status?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredInvestors(filtered);
      }
    }, [searchTerm, investors]);
  
    const handleSave = async (formData) => {
      const apiUrl = isEditing ? `${url}/api/investors/${currentInvestor.id}` : `${url}/api/investors`;
      const method = isEditing ? 'PUT' : 'POST';
  
      try {
        const response = await fetch(apiUrl, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
  
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to save investor');
  
        toast({
          title: isEditing ? 'Investor Updated' : 'Investor Added',
          description: isEditing ? 'Investor has been updated successfully' : 'Investor has been added successfully',
          status: 'success',
          isClosable: true,
        });
  
        // Auto-open HTML report for new investors
        if (!isEditing && data.investor?.id) {
          console.log('🌐 Opening HTML report for investor:', {
            investorId: data.investor.id,
            investorName: `${data.investor.first_name}`
          });
  
          const htmlUrl = `${url}/api/html/investor/${data.investor.id}`;
          console.log('🌐 Opening HTML URL:', htmlUrl);
  
          // Open HTML report in new window with print parameter
          const printUrl = `${htmlUrl}?print=true`;
          window.open(printUrl, '_blank');
  
          toast({
            title: 'HTML Report Opened',
            description: 'Investor report has been opened and print dialog triggered',
            status: 'success',
            isClosable: true,
            duration: 3000,
          });
        }
  
        fetchInvestors();
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
          isClosable: true,
        });
        throw error;
      }
    };
  
    const handleAdd = () => {
      setCurrentInvestor(null);
      setIsEditing(false);
      onOpen();
    };
  
    const handleEdit = (investor) => {
      console.log('🔍 Edit button clicked:', {
        investor,
        isEditing: true,
        investorId: investor.id,
        investorName: `${investor.first_name}`
      });
      setCurrentInvestor(investor);
      setIsEditing(true);
      onOpen();
    };
  
    const handleDelete = async () => {
      try {
        const response = await fetch(`${url}/api/investors/${investorToDelete.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
  
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete investor');
        }
  
        toast({
          title: 'Investor Deleted',
          description: 'Investor has been deleted successfully',
          status: 'success',
          isClosable: true,
        });
  
        onDeleteClose();
        fetchInvestors();
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
          isClosable: true,
        });
      }
    };
  
    const handleDeleteClick = (investor) => {
      setInvestorToDelete(investor);
      onDeleteOpen();
    };
  
    const handleOpenHTML = (investor) => {
      console.log('🌐 Opening HTML report for investor:', {
        id: investor.id,
        name: `${investor.first_name}`,
        selectPlan: investor.select_plan
      });
  
      const htmlUrl = `${url}/api/html/investor/${investor.id}`;
      console.log('🌐 Opening HTML URL:', htmlUrl);
  
      // Open HTML report in new window with print parameter
      const printUrl = `${htmlUrl}?print=true`;
      window.open(printUrl, '_blank');
  
      toast({
        title: 'HTML Report Opened',
        description: `Investment summary for ${investor.first_name} has been opened and print dialog triggered.`,
        status: 'success',
        isClosable: true,
        duration: 3000,
      });
    };
  
    const handleEditCoordinator = (investor) => {
      setEditingCoordinator(investor);
      setSelectedCoordinator(investor.coordinator_id || ''); // Set current coordinator_id or empty string
      onCoordEditOpen();
    };
  
    const updateInvestorCoordinator = async () => {
      if (!editingCoordinator) return;
  
      try {
        const response = await fetch(`${url}/api/investors/${editingCoordinator.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ coordinator_id: selectedCoordinator || null }) // Send null if no coordinator selected
        });
  
        const data = await response.json();
        if (response.ok) {
          toast({
            title: 'Coordinator Assigned',
            description: 'The coordinator has been successfully assigned to this investor!',
            status: 'success',
            isClosable: true
          });
          fetchInvestors(); // Refresh investors data
          onCoordEditClose();
          setEditingCoordinator(null);
          setSelectedCoordinator('');
        } else {
          throw new Error(data.message || 'Failed to update investor coordinator');
        }
      } catch (error) {
        console.error('Error updating investor coordinator:', error);
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
          isClosable: true,
        });
      }
    };
  
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      // Backend now sends IST timestamps, so we can format directly
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
  
    return (
      <Flex minH="100vh" bg={mainBg}>
        {/* Sidebar (desktop only) */}
        <Box
          as="nav"
          pos="fixed"
          top="0"
          left="0"
          zIndex="sticky"
          h="full"
          w={ADMIN_SIDEBAR_W}
          bg={sidebarBg}
          borderRight="1px"
          borderColor={sidebarBorder}
          display={{ base: 'none', md: 'block' }}
        >
          <AdminNavBar />
        </Box>
  
        {/* Main content */}
        <Box flex="1" ml={{ base: 0, md: ADMIN_SIDEBAR_W }} p={{ base: 4, sm: 6, md: 8 }}>
          {/* Mobile header */}
          <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
            <IconButton
              aria-label="Open menu"
              icon={<HamburgerIcon w={5} h={5} />}
              onClick={onMobileNavOpen}
              size="sm"
              variant="ghost"
              color={iconColor}
            />
            <Heading as="h1" fontSize="lg" color={headingColor}>
              Investor Management
            </Heading>
          </Flex>
  
          {/* Desktop title */}
          <Heading as="h1" fontSize="2xl" color={headingColor} mb={6} display={{ base: 'none', md: 'block' }}>
            Investor Management
          </Heading>
  
          {/* Tabs for Dashboard and Investors */}
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>Dashboard</Tab>
              <Tab>Investors</Tab>
            </TabList>
  
            <TabPanels>
              {/* Dashboard Tab */}
              <TabPanel px={0}>
                <InvestorDashboard url={url} />
              </TabPanel>
  
              {/* Investors Tab */}
              <TabPanel px={0}>
                {/* Action buttons and search */}
                <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
                  <HStack spacing={4}>
                    <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleAdd}>
                      Add Investor
                    </Button>
                  </HStack>
                  
                  {/* Search bar */}
                  <Box minW={{ base: 'full', md: '300px' }}>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.300" />
                      </InputLeftElement>
                      <Input
                        placeholder="Search investors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        bg={useColorModeValue('white', 'gray.700')}
                        borderColor={useColorModeValue('gray.300', 'gray.600')}
                      />
                    </InputGroup>
                  </Box>
                </Flex>
  
                {/* Investors Table */}
                {isLoading ? (
                  <Center py={8}>
                    <Spinner size="xl" />
                  </Center>
                ) : (
                  <Box bg={tableBg} borderRadius="lg" overflow="hidden" boxShadow="sm">
                    <Table variant="simple">
                      <Thead bg="gray.50">
                        <Tr>
                          <Th>ID</Th>
                          <Th>Name</Th>
                          <Th>Mobile</Th>
                          <Th>Coordinator</Th>
                          <Th>Plan Type</Th>
                          <Th>Investment Date</Th>
                          <Th>Status</Th>
                          <Th>Created</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredInvestors.map((investor) => (
                          <Tr key={investor.id}>
                            <Td fontFamily="monospace" fontSize="sm">
                              {investor.id}
                            </Td>
                            <Td fontWeight="medium">
                              {investor.first_name}
                            </Td>
                            <Td>{investor.mobile_number}</Td>
                            <Td>{investor.coordinator || 'N/A'}</Td>
                            <Td>
                              <Badge colorScheme="blue">
                                {investor.plan_type || 'N/A'}
                              </Badge>
                            </Td>
                            <Td>{formatDate(investor.investment_date)}</Td>
                            <Td>
                              <Badge 
                                colorScheme={
                                  investor.approval_status === 'approved' ? 'green' :
                                  investor.approval_status === 'rejected' ? 'red' : 'yellow'
                                }
                                variant="solid"
                              >
                                {investor.approval_status || 'pending'}
                              </Badge>
                            </Td>
                            <Td>{formatDate(investor.created_at)}</Td>
                            <Td>
                              <HStack spacing={2}>
                                <IconButton
                                  aria-label="Open HTML Report"
                                  icon={<ExternalLinkIcon />}
                                  size="sm"
                                  colorScheme="green"
                                  variant="ghost"
                                  onClick={() => handleOpenHTML(investor)}
                                />
                                <Tooltip label="Edit coordinator" hasArrow>
                                  <IconButton
                                    aria-label="Edit coordinator"
                                    icon={<EditIcon />}
                                    size="sm"
                                    colorScheme="green"
                                    variant="solid"
                                    bg="green.500"
                                    _hover={{ bg: "green.600" }}
                                    onClick={() => handleEditCoordinator(investor)}
                                  />
                                </Tooltip>
                                <IconButton
                                  aria-label="Edit investor"
                                  icon={<EditIcon />}
                                  size="sm"
                                  colorScheme="blue"
                                  variant="ghost"
                                  onClick={() => handleEdit(investor)}
                                />
                                <IconButton
                                  aria-label="Delete investor"
                                  icon={<DeleteIcon />}
                                  size="sm"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => handleDeleteClick(investor)}
                                />
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
  
          {/* Add/Edit Investor Modal */}
          <InvestorModal
            isOpen={isOpen}
            onClose={onClose}
            onSave={handleSave}
            investor={currentInvestor}
            isEditing={isEditing}
            coordinators={coordinators}
            url={url}
            token={token}
          />
  
          {/* Coordinator Edit Modal */}
          <Modal isOpen={isCoordEditOpen} onClose={onCoordEditClose} size="lg">
            <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
            <ModalContent borderRadius="xl" boxShadow="2xl">
              <ModalHeader
                bg="purple.50"
                borderBottom="1px"
                borderColor="purple.100"
                borderTopRadius="xl"
                py={6}
                fontSize="lg"
                fontWeight="bold"
              >
                Edit Investor Coordinator
              </ModalHeader>
              <ModalCloseButton top={4} right={4} />
              <ModalBody py={6}>
                {editingCoordinator && (
                  <VStack spacing={6} align="stretch">
                    <Box
                      p={4}
                      bg="gray.50"
                      borderRadius="md"
                      border="1px"
                      borderColor="gray.200"
                    >
                      <VStack spacing={2} align="stretch">
                        <Text fontWeight="semibold" color="gray.700">
                          Investor Details:
                        </Text>
                        <Text><strong>Name:</strong> {editingCoordinator.first_name}</Text>
                        <Text><strong>ID:</strong> {editingCoordinator.id}</Text>
                        <Text><strong>Current Coordinator:</strong>
                          <Badge colorScheme={editingCoordinator.coordinator ? "purple" : "gray"} ml={2}>
                            {editingCoordinator.coordinator || 'No Coordinator'}
                          </Badge>
                        </Text>
                      </VStack>
                    </Box>
  
                    <FormControl>
                      <FormLabel fontWeight="medium" color="gray.700">Select Coordinator</FormLabel>
                      <Select
                        value={selectedCoordinator}
                        onChange={(e) => setSelectedCoordinator(e.target.value)}
                        placeholder="Choose a coordinator"
                        size="lg"
                        borderRadius="md"
                        bg="white"
                        border="2px solid"
                        borderColor="gray.200"
                        _hover={{ borderColor: "purple.300" }}
                        _focus={{
                          borderColor: "purple.500",
                          boxShadow: "0 0 0 1px #805ad5"
                        }}
                      >
                        <option value="">No Coordinator</option>
                        {coordinators.map((coord) => (
                          <option key={coord.coordinator_id} value={coord.coordinator_id}>
                            {coord.name} ({coord.coordinator_id})
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </VStack>
                )}
              </ModalBody>
              <ModalFooter
                borderTop="1px"
                borderColor="gray.100"
                bg="gray.50"
                borderBottomRadius="xl"
                py={4}
              >
                <Button
                  variant="ghost"
                  mr={3}
                  onClick={onCoordEditClose}
                  borderRadius="md"
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="purple"
                  onClick={updateInvestorCoordinator}
                  isDisabled={selectedCoordinator === undefined} // Disable if nothing is explicitly selected/deselected
                  borderRadius="md"
                  px={6}
                >
                  {selectedCoordinator ? 'Update Coordinator' : 'Remove Coordinator'}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
  
          {/* Delete Confirmation Dialog */}
          <AlertDialog
            isOpen={isDeleteOpen}
            leastDestructiveRef={cancelRef}
            onClose={onDeleteClose}
          >
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Delete Investor
                </AlertDialogHeader>
                <AlertDialogBody>
                  Are you sure you want to delete {investorToDelete?.first_name}?
                  This action cannot be undone.
                </AlertDialogBody>
                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={onDeleteClose}>
                    Cancel
                  </Button>
                  <Button colorScheme="red" onClick={handleDelete} ml={3}>
                    Delete
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
  
          {/* Mobile Navigation Drawer */}
          <Modal isOpen={isMobileNavOpen} onClose={onMobileNavClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Navigation</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <AdminNavBar variant="drawer" onClose={onMobileNavClose} />
              </ModalBody>
            </ModalContent>
          </Modal>
        </Box>
      </Flex>
    );
  };
  
  export default InvestorManagementPage;