// import React, { useState, useEffect } from 'react';
// import {
//     Box, VStack, Heading, Text, useColorModeValue, Spinner,
//     Center, SimpleGrid, Button, useToast, Image, Modal,
//     ModalOverlay, Drawer, DrawerOverlay, DrawerContent, ModalContent, ModalHeader, ModalCloseButton, ModalBody, useDisclosure, Divider
// } from '@chakra-ui/react';
// import { Flex } from '@chakra-ui/react';
// import { useAuth } from '../../AppContext';
// import AdminNavBar from '../../components/layout/AdminNavBar';


// const VendorApprovalCard = ({ vendor, onApprove, onReject }) => {
//     // The `url` prop is no longer needed or passed to this component.
//     const cardBg = useColorModeValue('white', 'gray.700');
//     const { isOpen, onOpen, onClose } = useDisclosure();
//     const [currentImage, setCurrentImage] = useState('');

//     const employeeCount = parseInt(vendor.employee_count, 10) || 0;
//     const perEmployeeFee = 5000;
//     const oneTimeFee = 9999;
//     const totalAmount = (employeeCount * perEmployeeFee) + oneTimeFee;

//     const viewImage = (imageUrl) => {
//         setCurrentImage(imageUrl);
//         onOpen();
//     };

//     return (
//         <>
//             <VStack bg={cardBg} p={5} borderRadius="lg" boxShadow="md" align="stretch" spacing={3}>
//                 <Heading size="md">{vendor.vendor_name}</Heading>
//                 <Text><strong>Email:</strong> {vendor.email}</Text>
//                 <Text><strong>Phone:</strong> {vendor.phone_number}</Text>
//                 <Divider />
//                 <Box>
//                     <Text fontWeight="bold">Payment Details:</Text>
//                     <Text pl={4}><strong>Employees:</strong> {employeeCount}</Text>
//                     <Text pl={4}><strong>Calculated Amount:</strong> ₹{totalAmount.toLocaleString('en-IN')}</Text>
//                     <Text pl={4}><strong>Transaction ID:</strong> {vendor.transaction_id}</Text>
//                 </Box>
//                 <SimpleGrid columns={2} spacing={2} pt={2}>
//                     {/* --- THE FIX IS HERE --- */}
//                     {/* The `url` prefix is removed. We use the full URL from the vendor object directly. */}
//                     <Button size="sm" onClick={() => viewImage(vendor.passport_photo_url)} isDisabled={!vendor.passport_photo_url}>View Photo</Button>
//                     <Button size="sm" onClick={() => viewImage(vendor.payment_screenshot_url)} isDisabled={!vendor.payment_screenshot_url}>View Payment SS</Button>
//                 </SimpleGrid>
//                 <SimpleGrid columns={2} spacing={2} pt={2}>
//                     <Button colorScheme="red" onClick={() => onReject(vendor.id)}>Mark as Rejected</Button>
//                     <Button colorScheme="teal" onClick={() => onApprove(vendor.id)}>Approve</Button>
//                 </SimpleGrid>
//             </VStack>

//             {/* The Modal component remains unchanged and will work correctly with the full URL */}
//             <Modal isOpen={isOpen} onClose={onClose} size="xl">
//                 <ModalOverlay />
//                 <ModalContent>
//                     <ModalHeader>Image Preview</ModalHeader>
//                     <ModalCloseButton />
//                     <ModalBody>
//                         <Center><Image src={currentImage} alt="Preview" maxH="80vh" /></Center>
//                     </ModalBody>
//                 </ModalContent>
//             </Modal>
//         </>
//     );
// };

// // =================================================================
// // --- Main Page Component ---
// // =================================================================
// const ManageVendorApprovalsPage = ({ url }) => {
//     const mainBg = useColorModeValue('#F9FAFB', 'gray.800');
//     const toast = useToast();
//     const { token } = useAuth();
    
//     const [vendors, setVendors] = useState([]);
//     const [isLoading, setIsLoading] = useState(true);

//     // Fetch pending vendors (This part is correct and needs no changes)
//     useEffect(() => {
//         const fetchPendingVendors = async () => {
//             if (!token) return;
//             setIsLoading(true);
//             try {
//                 const response = await fetch(`${url}/api/admin/pending-vendors`, {
//                     headers: { 'Authorization': `Bearer ${token}` }
//                 });
//                 if (!response.ok) throw new Error('Failed to fetch pending vendors.');
                
//                 setVendors(await response.json());
//             } catch (error) {
//                 toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 });
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//         fetchPendingVendors();
//     }, [toast, token, url]);

//     // Handler for Approving (This part is correct and needs no changes)
//     const handleApproveVendor = async (vendorId) => {
//         try {
//             const response = await fetch(`${url}/api/admin/approve-vendor/${vendorId}`, {
//                 method: 'PUT',
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             const data = await response.json();
//             if (!response.ok) throw new Error(data.message || 'Failed to approve vendor.');
            
//             toast({ title: 'Success', description: 'Vendor approved!', status: 'success', duration: 3000 });
//             setVendors(current => current.filter(v => v.id !== vendorId));
//         } catch (error) {
//             toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 });
//         }
//     };

//     // Handler for Rejecting (This part is correct and needs no changes)
//     const handleRejectVendor = async (vendorId) => {
//         if (!window.confirm('Are you sure you want to reject this vendor? They will not be deleted, but marked as rejected.')) {
//             return;
//         }

//         try {
//             const response = await fetch(`${url}/api/admin/reject-vendor/${vendorId}`, {
//                 method: 'PUT',
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             const data = await response.json();
//             if (!response.ok) throw new Error(data.message || 'Failed to reject vendor.');
            
//             toast({ title: 'Success', description: 'Vendor has been rejected.', status: 'success', duration: 3000 });
//             setVendors(current => current.filter(v => v.id !== vendorId));
//         } catch (error) {
//             toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 });
//         }
//     };

//     const { isOpen, onOpen, onClose } = useDisclosure();

// return (
//   <Flex minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
//     {/* Static Sidebar (shown on lg and above) */}
//     <AdminNavBar variant="static" onOpen={onOpen} />

//     {/* Drawer Sidebar (shown on mobile) */}
//     <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
//       <DrawerOverlay />
//       <DrawerContent bg="gray.900">
//         <AdminNavBar variant="drawer" onClose={onClose} />
//       </DrawerContent>
//     </Drawer>

//     {/* Page Content */}
//     <Box flex="1" ml={{ base: '60px', lg: '80px' }} p={{ base: 4, md: 8 }} bg={mainBg}>
//       <VStack spacing={8} align="stretch">
//         <Box>
//           <Heading as="h1" size="xl">Manage Vendor Approvals</Heading>
//           <Text color="gray.500">Review and approve new vendor registrations.</Text>
//         </Box>

//         {isLoading ? (
//           <Center h="200px"><Spinner size="xl" /></Center>
//         ) : vendors.length > 0 ? (
//           <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
//             {vendors.map(vendor => (
//               <VendorApprovalCard 
//                 key={vendor.id} 
//                 vendor={vendor} 
//                 onApprove={handleApproveVendor}
//                 onReject={handleRejectVendor}
//               />
//             ))}
//           </SimpleGrid>
//         ) : (
//           <Center h="200px">
//             <Text fontSize="lg">No pending vendor approvals at this time.</Text>
//           </Center>
//         )}
//       </VStack>
//     </Box>
//   </Flex>
// );
// }
// export default ManageVendorApprovalsPage;









import React, { useState, useEffect } from 'react';
import {
  Box, VStack, Heading, Text, useColorModeValue, Spinner, Center, SimpleGrid,
  Button, useToast, Image, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, useDisclosure, Divider, Flex, IconButton, Drawer, DrawerOverlay, DrawerContent
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';
import AdminNavBar from '../../components/layout/AdminNavBar';

const ADMIN_SIDEBAR_W = '80px';

const VendorApprovalCard = ({ vendor, onApprove, onReject, registrationFee }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentImage, setCurrentImage] = useState('');

  // Use registrationFee from backend config so UI matches current settings
  const normalizedRegistrationFee = typeof registrationFee === 'number' && !isNaN(registrationFee)
    ? registrationFee
    : 0;

  const viewImage = (imageUrl) => { setCurrentImage(imageUrl); onOpen(); };

  return (
    <>
      <VStack bg={cardBg} p={5} borderRadius="lg" boxShadow="md" align="stretch" spacing={3}>
        <Heading size="md">{vendor.vendor_name}</Heading>
        <Text><strong>Email:</strong> {vendor.email}</Text>
        <Text><strong>Phone:</strong> {vendor.phone_number}</Text>
        <Divider />
        <Box>
          <Text fontWeight="bold">Payment Details:</Text>
          <Text pl={4}>
            <strong>Registration Fee:</strong> ₹{normalizedRegistrationFee.toLocaleString('en-IN')}
          </Text>
          <Text pl={4}><strong>Transaction ID:</strong> {vendor.transaction_id}</Text>
        </Box>
        <SimpleGrid columns={2} spacing={2} pt={2}>
          <Button size="sm" onClick={() => viewImage(vendor.passport_photo_url)} isDisabled={!vendor.passport_photo_url}>View Photo</Button>
          <Button size="sm" onClick={() => viewImage(vendor.payment_screenshot_url)} isDisabled={!vendor.payment_screenshot_url}>View Payment SS</Button>
        </SimpleGrid>
        <SimpleGrid columns={2} spacing={2} pt={2}>
          <Button colorScheme="red" onClick={() => onReject(vendor.id)}>Mark as Rejected</Button>
          <Button colorScheme="teal" onClick={() => onApprove(vendor.id)}>Approve</Button>
        </SimpleGrid>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Image Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Center><Image src={currentImage} alt="Preview" maxH="80vh" /></Center>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

const ManageVendorApprovalsPage = ({ url }) => {
  const mainBg = useColorModeValue('gray.50', 'gray.900');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const toast = useToast();
  const { token } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [registrationFee, setRegistrationFee] = useState(0);

  useEffect(() => {
    const fetchPendingVendors = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const response = await fetch(`${url}/api/admin/pending-vendors`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch pending vendors.');
        setVendors(await response.json());
      } catch (error) {
        toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 });
      } finally { setIsLoading(false); }
    };
    fetchPendingVendors();
  }, [toast, token, url]);

  // Fetch current registration fee so the calculated amount reflects REGISTRATION_FEE (including zero)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${url}/api/payment/easebuzz/config`);
        if (!response.ok) return;
        const data = await response.json();
        if (typeof data.registrationFee === 'number') {
          setRegistrationFee(data.registrationFee);
        }
      } catch (err) {
        console.error('Failed to fetch registration fee for ManageVendorApprovalsPage:', err);
      }
    };
    fetchConfig();
  }, [url]);

  const handleApproveVendor = async (vendorId) => {
    try {
      const response = await fetch(`${url}/api/admin/approve-vendor/${vendorId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to approve vendor.');
      toast({ title: 'Success', description: 'Vendor approved!', status: 'success', duration: 3000 });
      setVendors(current => current.filter(v => v.id !== vendorId));
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 });
    }
  };

  const handleRejectVendor = async (vendorId) => {
    if (!window.confirm('Are you sure you want to reject this vendor?')) return;
    try {
      const response = await fetch(`${url}/api/admin/reject-vendor/${vendorId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reject vendor.');
      toast({ title: 'Success', description: 'Vendor has been rejected.', status: 'success', duration: 3000 });
      setVendors(current => current.filter(v => v.id !== vendorId));
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 });
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
          <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">Manage Vendor Approvals</Heading>
        </Flex>

        <VStack spacing={8} align="stretch">
          <Box>
            <Heading as="h1" size="xl" color={headingColor} display={{ base: 'none', md: 'block' }}>
              Manage Vendor Approvals
            </Heading>
            <Text color="gray.500" display={{ base: 'none', md: 'block' }}>
              Review and approve new vendor registrations.
            </Text>
          </Box>

          {isLoading ? (
            <Center h="200px"><Spinner size="xl" /></Center>
          ) : vendors.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {vendors.map(vendor => (
                <VendorApprovalCard
                  key={vendor.id}
                  vendor={vendor}
                  registrationFee={registrationFee}
                  onApprove={handleApproveVendor}
                  onReject={handleRejectVendor}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Center h="200px"><Text fontSize="lg">No pending vendor approvals at this time.</Text></Center>
          )}
        </VStack>
      </Box>
    </Flex>
  );
};

export default ManageVendorApprovalsPage;