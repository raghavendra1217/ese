import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Flex, Heading, Button, IconButton, useToast, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useColorModeValue, Text, Badge, HStack,
  Textarea, Drawer, DrawerContent, DrawerOverlay, VStack, useClipboard, NumberInput, NumberInputField,
  Select, RadioGroup, Radio, Stack
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon, HamburgerIcon, ViewIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import AdminNavBar from '../../components/layout/AdminNavBar';

const ADMIN_SIDEBAR_W = '80px';

const PayslipModal = ({ isOpen, onClose, onSave, payslip, isEditing }) => {
  const initialFormState = {
    employee_id: '',
    employee_name: '',
    designation: '',
    month: '',
    year: '',
    basic_salary: '',
    total_working_days: '',
    provident_fund: '',
    esi: '',
    da: '',
    professional_tax: '',
    hra: '',
    other_deductions: '',
    ta: '',
    total_addition: '',
    total_deductions: '',
    salary_paid_by: 'cash'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && payslip) {
        setFormData({
          employee_id: payslip.employee_id || '',
          employee_name: payslip.employee_name || '',
          designation: payslip.designation || '',
          month: payslip.month || '',
          year: payslip.year || '',
          basic_salary: payslip.basic_salary || '',
          total_working_days: payslip.total_working_days || '',
          provident_fund: payslip.provident_fund || '',
          esi: payslip.esi || '',
          da: payslip.da || '',
          professional_tax: payslip.professional_tax || '',
          hra: payslip.hra || '',
          other_deductions: payslip.other_deductions || '',
          ta: payslip.ta || '',
          total_addition: payslip.total_addition || '',
          total_deductions: payslip.total_deductions || '',
          salary_paid_by: payslip.salary_paid_by || 'cash'
        });
      } else {
        setFormData(initialFormState);
      }
    }
  }, [isOpen, payslip, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNumberChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const calculateTotals = () => {
    const da = parseFloat(formData.da) || 0;
    const hra = parseFloat(formData.hra) || 0;
    const ta = parseFloat(formData.ta) || 0;
    const totalAddition = da + hra + ta;

    const pf = parseFloat(formData.provident_fund) || 0;
    const esi = parseFloat(formData.esi) || 0;
    const pt = parseFloat(formData.professional_tax) || 0;
    const other = parseFloat(formData.other_deductions) || 0;
    const totalDeductions = pf + esi + pt + other;

    setFormData(prev => ({
      ...prev,
      total_addition: totalAddition.toString(),
      total_deductions: totalDeductions.toString()
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [formData.da, formData.hra, formData.ta, formData.provident_fund, formData.esi, formData.professional_tax, formData.other_deductions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving payslip:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "6xl" }}>
      <ModalOverlay />
      <ModalContent maxH="90vh" overflowY="auto" mx={{ base: 0, md: 4 }}>
        <ModalHeader>
          {isEditing ? 'Edit Payslip' : 'Add Payslip'}
        </ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={6}>
              {/* Employee Information */}
              <Box w="full" p={4} bg="gray.50" borderRadius="md">
                <Heading size="md" mb={4}>Employee Information</Heading>
                <VStack spacing={4}>
                  <Flex gap={4} w="full" direction={{ base: "column", md: "row" }}>
                    <FormControl isRequired>
                      <FormLabel>Employee ID</FormLabel>
                      <Input
                        name="employee_id"
                        value={formData.employee_id}
                        onChange={handleChange}
                        placeholder="Enter employee ID"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Employee Name</FormLabel>
                      <Input
                        name="employee_name"
                        value={formData.employee_name}
                        onChange={handleChange}
                        placeholder="Enter employee name"
                      />
                    </FormControl>
                  </Flex>
                  <Flex gap={4} w="full" direction={{ base: "column", md: "row" }}>
                    <FormControl isRequired>
                      <FormLabel>Designation</FormLabel>
                      <Input
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        placeholder="Enter designation"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Month</FormLabel>
                      <Select name="month" value={formData.month} onChange={handleChange}>
                        <option value="">Select Month</option>
                        <option value="JAN">January</option>
                        <option value="FEB">February</option>
                        <option value="MAR">March</option>
                        <option value="APR">April</option>
                        <option value="MAY">May</option>
                        <option value="JUN">June</option>
                        <option value="JUL">July</option>
                        <option value="AUG">August</option>
                        <option value="SEP">September</option>
                        <option value="OCT">October</option>
                        <option value="NOV">November</option>
                        <option value="DEC">December</option>
                      </Select>
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Year</FormLabel>
                      <Input
                        name="year"
                        type="number"
                        value={formData.year}
                        onChange={handleChange}
                        placeholder="2024"
                        min="2020"
                        max="2030"
                      />
                    </FormControl>
                  </Flex>
                  <Flex gap={4} w="full" direction={{ base: "column", md: "row" }}>
                    <FormControl isRequired>
                      <FormLabel>Basic Salary</FormLabel>
                      <NumberInput value={formData.basic_salary} onChange={(value) => handleNumberChange('basic_salary', value)}>
                        <NumberInputField placeholder="0" />
                      </NumberInput>
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Total Working Days</FormLabel>
                      <NumberInput value={formData.total_working_days} onChange={(value) => handleNumberChange('total_working_days', value)}>
                        <NumberInputField placeholder="30" min="1" max="31" />
                      </NumberInput>
                    </FormControl>
                  </Flex>
                </VStack>
              </Box>

              {/* Earnings */}
              <Box w="full" p={4} bg="green.50" borderRadius="md">
                <Heading size="md" mb={4}>Earnings</Heading>
                <VStack spacing={4}>
                  <Flex gap={4} w="full" direction={{ base: "column", md: "row" }}>
                    <FormControl>
                      <FormLabel>DA (Dearness Allowance)</FormLabel>
                      <NumberInput value={formData.da} onChange={(value) => handleNumberChange('da', value)}>
                        <NumberInputField placeholder="0" />
                      </NumberInput>
                    </FormControl>
                    <FormControl>
                      <FormLabel>HRA (House Rent Allowance)</FormLabel>
                      <NumberInput value={formData.hra} onChange={(value) => handleNumberChange('hra', value)}>
                        <NumberInputField placeholder="0" />
                      </NumberInput>
                    </FormControl>
                    <FormControl>
                      <FormLabel>TA (Travel Allowance)</FormLabel>
                      <NumberInput value={formData.ta} onChange={(value) => handleNumberChange('ta', value)}>
                        <NumberInputField placeholder="0" />
                      </NumberInput>
                    </FormControl>
                  </Flex>
                  <FormControl>
                    <FormLabel>Total Addition (Auto-calculated)</FormLabel>
                    <Input value={formData.total_addition} isReadOnly bg="gray.100" />
                  </FormControl>
                </VStack>
              </Box>

              {/* Deductions */}
              <Box w="full" p={4} bg="red.50" borderRadius="md">
                <Heading size="md" mb={4}>Deductions</Heading>
                <VStack spacing={4}>
                  <Flex gap={4} w="full" direction={{ base: "column", md: "row" }}>
                    <FormControl>
                      <FormLabel>Provident Fund</FormLabel>
                      <NumberInput value={formData.provident_fund} onChange={(value) => handleNumberChange('provident_fund', value)}>
                        <NumberInputField placeholder="0" />
                      </NumberInput>
                    </FormControl>
                    <FormControl>
                      <FormLabel>ESI</FormLabel>
                      <NumberInput value={formData.esi} onChange={(value) => handleNumberChange('esi', value)}>
                        <NumberInputField placeholder="0" />
                      </NumberInput>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Professional Tax</FormLabel>
                      <NumberInput value={formData.professional_tax} onChange={(value) => handleNumberChange('professional_tax', value)}>
                        <NumberInputField placeholder="0" />
                      </NumberInput>
                    </FormControl>
                  </Flex>
                  <Flex gap={4} w="full" direction={{ base: "column", md: "row" }}>
                    <FormControl>
                      <FormLabel>Other Deductions</FormLabel>
                      <NumberInput value={formData.other_deductions} onChange={(value) => handleNumberChange('other_deductions', value)}>
                        <NumberInputField placeholder="0" />
                      </NumberInput>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Total Deductions (Auto-calculated)</FormLabel>
                      <Input value={formData.total_deductions} isReadOnly bg="gray.100" />
                    </FormControl>
                  </Flex>
                </VStack>
              </Box>

              {/* Salary Payment Method */}
              <Box w="full" p={4} bg="blue.50" borderRadius="md">
                <Heading size="md" mb={4}>Salary Payment</Heading>
                <FormControl>
                  <FormLabel>Salary Paid By</FormLabel>
                  <RadioGroup value={formData.salary_paid_by} onChange={(value) => setFormData({...formData, salary_paid_by: value})}>
                    <Stack direction="row" spacing={6}>
                      <Radio value="cash">Cash</Radio>
                      <Radio value="cheque">Cheque</Radio>
                      <Radio value="net_banking">Net Banking/Other Transfer</Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" type="submit" isLoading={isLoading}>
              {isEditing ? 'Update' : 'Add'} Payslip
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

const PayslipManagementPage = ({ url }) => {
  const { token } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isMobileNavOpen, onOpen: onMobileNavOpen, onClose: onMobileNavClose } = useDisclosure();
  const cancelRef = useRef();

  const [payslips, setPayslips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Color mode values
  const mainBg = useColorModeValue('gray.50', 'gray.900');
  const sidebarBg = useColorModeValue('white', 'gray.800');
  const sidebarBorder = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const iconColor = useColorModeValue('gray.600', 'gray.400');
  const tableBg = useColorModeValue('white', 'gray.800');

  const fetchPayslips = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${url}/api/payslip/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayslips(data.data || []);
      } else {
        throw new Error('Failed to fetch payslips');
      }
    } catch (error) {
      console.error('Error fetching payslips:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payslips',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [url, token, toast]);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  const handleAdd = () => {
    setSelectedPayslip(null);
    setIsEditing(false);
    onOpen();
  };

  const handleEdit = (payslip) => {
    setSelectedPayslip(payslip);
    setIsEditing(true);
    onOpen();
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    onDeleteOpen();
  };

  const handleSave = async (formData) => {
    try {
      const endpoint = isEditing 
        ? `${url}/api/payslip/admin/${selectedPayslip.id}`
        : `${url}/api/payslip/create`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (isEditing) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: isEditing ? 'Payslip updated successfully' : 'Payslip added successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        fetchPayslips();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save payslip');
      }
    } catch (error) {
      console.error('Error saving payslip:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save payslip',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`${url}/api/payslip/admin/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Payslip deleted successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        fetchPayslips();
      } else {
        throw new Error('Failed to delete payslip');
      }
    } catch (error) {
      console.error('Error deleting payslip:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete payslip',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
      setDeleteId(null);
    }
  };

  const calculateNetSalary = (payslip) => {
    const basicSalary = parseFloat(payslip.basic_salary) || 0;
    const totalAddition = parseFloat(payslip.total_addition) || 0;
    const totalDeductions = parseFloat(payslip.total_deductions) || 0;
    return basicSalary + totalAddition - totalDeductions;
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

      {/* Mobile drawer */}
      <Drawer isOpen={isMobileNavOpen} placement="left" onClose={onMobileNavClose}>
        <DrawerOverlay />
        <DrawerContent>
          <AdminNavBar variant="drawer" onClose={onMobileNavClose} />
        </DrawerContent>
      </Drawer>

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
            Payslip Management
          </Heading>
        </Flex>

        {/* Desktop title */}
        <Heading as="h1" fontSize="2xl" color={headingColor} mb={6} display={{ base: 'none', md: 'block' }}>
          Payslip Management
        </Heading>

        {/* Action buttons */}
        <Flex justify="space-between" align="center" mb={6}>
          <HStack spacing={4}>
            <Button leftIcon={<AddIcon />} colorScheme="purple" onClick={handleAdd}>
              Add Payslip
            </Button>
          </HStack>
        </Flex>

        {/* Payslips Table */}
        {isLoading ? (
          <Center py={8}>
            <Spinner size="xl" />
          </Center>
        ) : (
          <>
            {/* Desktop Table View */}
            <Box bg={tableBg} borderRadius="lg" overflow="hidden" boxShadow="sm" display={{ base: 'none', md: 'block' }}>
              <Box overflowX="auto">
                <Table variant="simple" minW="1200px">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>ID</Th>
                      <Th>Employee ID</Th>
                      <Th>Employee Name</Th>
                      <Th>Designation</Th>
                      <Th>Month/Year</Th>
                      <Th>Basic Salary</Th>
                      <Th>Gross Salary</Th>
                      <Th>Net Salary</Th>
                      <Th>Payment Method</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {payslips.map((payslip) => {
                      const grossSalary = parseFloat(payslip.basic_salary) + parseFloat(payslip.total_addition);
                      const netSalary = calculateNetSalary(payslip);
                      
                      return (
                        <Tr key={payslip.id}>
                          <Td fontFamily="monospace" fontSize="sm">
                            {payslip.id}
                          </Td>
                          <Td fontWeight="medium">
                            {payslip.employee_id}
                          </Td>
                          <Td>{payslip.employee_name}</Td>
                          <Td>{payslip.designation}</Td>
                          <Td>{payslip.month}-{payslip.year}</Td>
                          <Td>₹{parseFloat(payslip.basic_salary).toLocaleString()}</Td>
                          <Td>₹{grossSalary.toLocaleString()}</Td>
                          <Td fontWeight="bold" color="green.600">
                            ₹{netSalary.toLocaleString()}
                          </Td>
                          <Td>
                            <Badge colorScheme={
                              payslip.salary_paid_by === 'cash' ? 'green' :
                              payslip.salary_paid_by === 'cheque' ? 'blue' : 'purple'
                            }>
                              {payslip.salary_paid_by === 'net_banking' ? 'Net Banking' : 
                               payslip.salary_paid_by.charAt(0).toUpperCase() + payslip.salary_paid_by.slice(1)}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="View HTML"
                                icon={<ViewIcon />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => window.open(`${url}/api/html/payslip/${payslip.id}?print=true`, '_blank')}
                              />
                              <IconButton
                                aria-label="Edit"
                                icon={<EditIcon />}
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(payslip)}
                              />
                              <IconButton
                                aria-label="Delete"
                                icon={<DeleteIcon />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleDelete(payslip.id)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            </Box>

            {/* Mobile Card View */}
            <VStack spacing={4} display={{ base: 'flex', md: 'none' }}>
              {payslips.map((payslip) => {
                const grossSalary = parseFloat(payslip.basic_salary) + parseFloat(payslip.total_addition);
                const netSalary = calculateNetSalary(payslip);
                
                return (
                  <Box
                    key={payslip.id}
                    bg={tableBg}
                    borderRadius="lg"
                    p={4}
                    w="full"
                    boxShadow="sm"
                    border="1px"
                    borderColor="gray.200"
                  >
                    <VStack align="start" spacing={3}>
                      {/* Header with ID and Actions */}
                      <Flex justify="space-between" align="center" w="full">
                        <Text fontSize="sm" color="gray.500" fontFamily="monospace">
                          ID: {payslip.id}
                        </Text>
                        <HStack spacing={1}>
                          <IconButton
                            aria-label="View HTML"
                            icon={<ViewIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={() => window.open(`${url}/api/html/payslip/${payslip.id}?print=true`, '_blank')}
                          />
                          <IconButton
                            aria-label="Edit"
                            icon={<EditIcon />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(payslip)}
                          />
                          <IconButton
                            aria-label="Delete"
                            icon={<DeleteIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDelete(payslip.id)}
                          />
                        </HStack>
                      </Flex>

                      {/* Employee Info */}
                      <Box>
                        <Text fontWeight="bold" fontSize="lg" color="blue.600">
                          {payslip.employee_name}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {payslip.employee_id} • {payslip.designation}
                        </Text>
                      </Box>

                      {/* Month/Year */}
                      <Text fontSize="sm" color="gray.700">
                        <Text as="span" fontWeight="medium">Period:</Text> {payslip.month}-{payslip.year}
                      </Text>

                      {/* Salary Details */}
                      <VStack align="start" spacing={2} w="full">
                        <Flex justify="space-between" w="full">
                          <Text fontSize="sm" color="gray.600">Basic Salary:</Text>
                          <Text fontSize="sm" fontWeight="medium">₹{parseFloat(payslip.basic_salary).toLocaleString()}</Text>
                        </Flex>
                        <Flex justify="space-between" w="full">
                          <Text fontSize="sm" color="gray.600">Gross Salary:</Text>
                          <Text fontSize="sm" fontWeight="medium">₹{grossSalary.toLocaleString()}</Text>
                        </Flex>
                        <Flex justify="space-between" w="full" borderTop="1px" borderColor="gray.200" pt={2}>
                          <Text fontSize="sm" fontWeight="bold" color="green.600">Net Salary:</Text>
                          <Text fontSize="sm" fontWeight="bold" color="green.600">₹{netSalary.toLocaleString()}</Text>
                        </Flex>
                      </VStack>

                      {/* Payment Method */}
                      <Flex justify="space-between" align="center" w="full">
                        <Text fontSize="sm" color="gray.600">Payment:</Text>
                        <Badge colorScheme={
                          payslip.salary_paid_by === 'cash' ? 'green' :
                          payslip.salary_paid_by === 'cheque' ? 'blue' : 'purple'
                        }>
                          {payslip.salary_paid_by === 'net_banking' ? 'Net Banking' : 
                           payslip.salary_paid_by.charAt(0).toUpperCase() + payslip.salary_paid_by.slice(1)}
                        </Badge>
                      </Flex>
                    </VStack>
                  </Box>
                );
              })}
            </VStack>
          </>
        )}

        {/* Add/Edit Modal */}
        <PayslipModal
          isOpen={isOpen}
          onClose={onClose}
          onSave={handleSave}
          payslip={selectedPayslip}
          isEditing={isEditing}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Payslip
              </AlertDialogHeader>
              <AlertDialogBody>
                Are you sure you want to delete this payslip? This action cannot be undone.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </Flex>
  );
};

export default PayslipManagementPage;
