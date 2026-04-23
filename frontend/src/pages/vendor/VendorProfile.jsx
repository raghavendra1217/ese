
// import React, { useEffect, useState, useRef } from 'react';
// import {
//   Box, Button, Spinner, Text, useToast, VStack, FormControl, FormLabel, Heading, SimpleGrid, GridItem,
//   useColorModeValue, Avatar, Divider, Flex, Spacer, Input, Center, useDisclosure, AlertDialog, AlertDialogBody,
//   AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, IconButton, HStack, Drawer,
//   DrawerOverlay, DrawerContent, DrawerBody,
// } from '@chakra-ui/react';
// import { HamburgerIcon } from '@chakra-ui/icons';
// import axios from 'axios';
// import { useAuth } from '../../AppContext';
// import VendorNavBar from '../../components/layout/VendorNavBar';

// const DESKTOP_SIDEBAR_WIDTH = '200px';

// const ProfileInfoField = ({ label, value }) => (
//   <Box w="full">
//     <Text fontSize="sm" color="gray.500">{label}</Text>
//     <Text fontWeight="medium" noOfLines={1} title={value}>{value || '-'}</Text>
//   </Box>
// );

// const VendorProfile = ({ url }) => {
//   const { token } = useAuth();
//   const toast = useToast();

//   const { isOpen: isNavOpen, onOpen: onNavOpen, onClose: onNavClose } = useDisclosure();
//   const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();

//   const [profile, setProfile] = useState(null);
//   const [initialProfile, setInitialProfile] = useState(null);
//   const [newImageFile, setNewImageFile] = useState(null);
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);

//   const cancelRef = useRef();
//   const fileInputRef = useRef(null);

//   // Styling
//   const mainBg = useColorModeValue('gray.50', '#181C27');
//   const sidebarBg = '#212734';
//   const sidebarBorder = 'gray.700';
//   const cardBg = useColorModeValue('white', 'gray.800');
//   const headingColor = useColorModeValue('gray.800', 'gray.200');
//   const iconColor = useColorModeValue('black', 'whiteAlpha.900');

//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         const res = await axios.get(`${url}/api/vendor/profile`, { headers: { Authorization: `Bearer ${token}` } });
//         setProfile(res.data);
//         setInitialProfile(res.data);
//       } catch (err) {
//         toast({ title: 'Error', description: 'Failed to load profile data.', status: 'error' });
//       }
//     };
//     if (token) fetchProfile();
//   }, [url, toast, token]);

//   const handleImageChange = (e) => { const file = e.target.files[0]; if (file) { setNewImageFile(file); setPreviewUrl(URL.createObjectURL(file)); } };
//   const handleChange = (e) => { const { id, value } = e.target; setProfile((prev) => ({ ...prev, [id]: value })); };
//   const handleCancel = () => { setProfile(initialProfile); setNewImageFile(null); setPreviewUrl(null); setIsEditing(false); };

//   const handleSave = async () => {
//     onAlertClose(); setIsSaving(true);
//     let updatedProfileData = { ...profile };
//     try {
//       if (newImageFile) {
//         const formData = new FormData();
//         formData.append('profileImage', newImageFile);
//         const res = await axios.post(`${url}/api/vendor/profile-image`, formData, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } });
//         updatedProfileData.passportPhotoUrl = res.data.imageUrl;
//       }
//       await axios.put(`${url}/api/vendor/profile`, { bankName: profile.bankName, accountNumber: profile.accountNumber, ifscCode: profile.ifscCode }, { headers: { Authorization: `Bearer ${token}` } });
//       toast({ title: 'Profile Updated', status: 'success' });
//       setInitialProfile(updatedProfileData);
//       setNewImageFile(null);
//       setIsEditing(false);
//     } catch (err) {
//       toast({ title: 'Update Failed', description: err?.response?.data?.message || 'Could not save changes.', status: 'error' });
//     } finally { setIsSaving(false); }
//   };

//   const hasChanges = JSON.stringify(profile) !== JSON.stringify(initialProfile) || newImageFile !== null;

//   return (
//     <Flex minH="100vh" bg={mainBg}>
//       {/* Desktop Sidebar */}
//       <Box as="nav" pos="fixed" top="0" left="0" zIndex="sticky" h="full" w={DESKTOP_SIDEBAR_WIDTH} bg={sidebarBg} borderRight="1px" borderColor={sidebarBorder} display={{ base: 'none', md: 'block' }}>
//         <VendorNavBar />
//       </Box>

//       {/* Mobile Drawer */}
//       <Drawer isOpen={isNavOpen} placement="left" onClose={onNavClose}>
//         <DrawerOverlay />
//         <DrawerContent bg={sidebarBg} w={DESKTOP_SIDEBAR_WIDTH}>
//           <DrawerBody p={0}><VendorNavBar onLinkClick={onNavClose} /></DrawerBody>
//         </DrawerContent>
//       </Drawer>

//       {/* Main content */}
//       <Box flex="1" ml={{ base: 0, md: DESKTOP_SIDEBAR_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
//         {!profile ? (
//           <Center h="200px"><Spinner size="xl" /></Center>
//         ) : (
//           <Box maxW="1200px" mx="auto">
//             {/* Consistent mobile header: left (hamburger + title), right (actions) */}
//             <Flex align="center" gap={2} mb={4} justify="space-between" display={{ base: 'flex', md: 'none' }}>
//               <Flex align="center" gap={2}>
//                 <IconButton
//                   aria-label="Open menu"
//                   icon={<HamburgerIcon w={5} h={5} />}
//                   onClick={onNavOpen}
//                   size="sm"
//                   variant="ghost"
//                   color={iconColor}
//                   p={1}
//                   mt="-1"
//                   _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.200' } }}
//                 />
//                 <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">
//                   My Profile
//                 </Heading>
//               </Flex>
//               {!isEditing ? (
//                 <Button colorScheme="blue" onClick={() => setIsEditing(true)}>Edit Profile</Button>
//               ) : (
//                 <HStack>
//                   <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
//                   <Button colorScheme="green" onClick={onAlertOpen} isDisabled={!hasChanges || isSaving} isLoading={isSaving}>
//                     Save Changes
//                   </Button>
//                 </HStack>
//               )}
//             </Flex>

//             {/* Desktop header */}
//             <Flex mb={6} align="center" gap={2} display={{ base: 'none', md: 'flex' }}>
//               <Heading>My Profile</Heading>
//               <Spacer />
//               {!isEditing ? (
//                 <Button colorScheme="blue" onClick={() => setIsEditing(true)}>Edit Profile</Button>
//               ) : (
//                 <HStack>
//                   <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
//                   <Button colorScheme="green" onClick={onAlertOpen} isDisabled={!hasChanges || isSaving} isLoading={isSaving}>
//                     Save Changes
//                   </Button>
//                 </HStack>
//               )}
//             </Flex>

//             <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
//               <GridItem colSpan={1}>
//                 <VStack spacing={6} as={Box} bg={cardBg} p={6} borderRadius="lg" boxShadow="md" align="stretch">
//                   <Avatar size="2xl" name={profile.vendorName} src={previewUrl || (profile.passportPhotoUrl ? `${profile.passportPhotoUrl}` : '')} alignSelf="center" />
//                   {isEditing && (<><Input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} display="none" /><Button w="full" onClick={() => fileInputRef.current.click()}>Change Photo</Button></>)}
//                   <Divider />
//                   <ProfileInfoField label="Vendor Name" value={profile.vendorName} />
//                   <ProfileInfoField label="Email" value={profile.email} />
//                   <ProfileInfoField label="Phone" value={profile.phoneNumber} />
//                 </VStack>
//               </GridItem>

//               <GridItem colSpan={{ base: 1, lg: 2 }}>
//                 <VStack spacing={6} as={Box} bg={cardBg} p={6} borderRadius="lg" boxShadow="md" align="stretch">
//                   <Heading size="md" alignSelf="flex-start">Details</Heading>
//                   <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
//                     <ProfileInfoField label="Aadhar Number" value={profile.aadharNumber} />
//                     <ProfileInfoField label="PAN Card" value={profile.panCardNumber} />
//                   </SimpleGrid>
//                   <ProfileInfoField label="Address" value={profile.address} />
//                   <Divider />
//                   <Heading size="md" alignSelf="flex-start">Bank Details (Editable)</Heading>
//                   <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
//                     <FormControl><FormLabel>Bank Name</FormLabel><Input id="bankName" value={profile.bankName || ''} onChange={handleChange} isReadOnly={!isEditing} /></FormControl>
//                     <FormControl><FormLabel>Account Number</FormLabel><Input id="accountNumber" value={profile.accountNumber || ''} onChange={handleChange} isReadOnly={!isEditing} /></FormControl>
//                   </SimpleGrid>
//                   <FormControl><FormLabel>IFSC Code</FormLabel><Input id="ifscCode" value={profile.ifscCode || ''} onChange={handleChange} isReadOnly={!isEditing} /></FormControl>
//                 </VStack>
//               </GridItem>
//             </SimpleGrid>
//           </Box>
//         )}

//         {/* Confirmation Modal */}
//         <AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef} onClose={onAlertClose}>
//           <AlertDialogOverlay>
//             <AlertDialogContent>
//               <AlertDialogHeader fontSize="lg" fontWeight="bold">Confirm Changes</AlertDialogHeader>
//               <AlertDialogBody>Are you sure you want to save these changes to your profile?</AlertDialogBody>
//               <AlertDialogFooter>
//                 <Button ref={cancelRef} onClick={onAlertClose}>Cancel</Button>
//                 <Button colorScheme="green" onClick={handleSave} ml={3}>Save</Button>
//               </AlertDialogFooter>
//             </AlertDialogContent>
//           </AlertDialogOverlay>
//         </AlertDialog>
//       </Box>
//     </Flex>
//   );
// };

// export default VendorProfile;





import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Button, Spinner, Text, useToast, VStack, FormControl, FormLabel, Heading, SimpleGrid, GridItem,
  useColorModeValue, Avatar, Divider, Flex, Spacer, Input, Center, useDisclosure, AlertDialog, AlertDialogBody,
  AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, IconButton, HStack, Drawer,
  DrawerOverlay, DrawerContent, DrawerBody,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { useAuth } from '../../AppContext';
import VendorNavBar from '../../components/layout/VendorNavBar';

const DESKTOP_SIDEBAR_WIDTH = '200px';

const ProfileInfoField = ({ label, value }) => (
  <Box w="full">
    <Text fontSize="sm" color="gray.500">{label}</Text>
    <Text fontWeight="medium" noOfLines={1} title={value}>{value || '-'}</Text>
  </Box>
);

const VendorProfile = ({ url }) => {
  const { token } = useAuth();
  const toast = useToast();

  const { isOpen: isNavOpen, onOpen: onNavOpen, onClose: onNavClose } = useDisclosure();
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();

  const [profile, setProfile] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Keep this for image editing

  const cancelRef = useRef();
  const fileInputRef = useRef(null);

  // Styling
  const mainBg = useColorModeValue('gray.50', '#181C27');
  const sidebarBg = '#212734';
  const sidebarBorder = 'gray.700';
  const cardBg = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const iconColor = useColorModeValue('black', 'whiteAlpha.900');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${url}/api/vendor/profile`, { headers: { Authorization: `Bearer ${token}` } });
        setProfile(res.data);
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load profile data.', status: 'error' });
      }
    };
    if (token) fetchProfile();
  }, [url, toast, token]);

  const handleImageChange = (e) => { const file = e.target.files[0]; if (file) { setNewImageFile(file); setPreviewUrl(URL.createObjectURL(file)); } };
  // Removed handleChange as text fields are no longer editable

  const handleCancel = () => {
    // Only reset image related states
    setNewImageFile(null);
    setPreviewUrl(null);
    setIsEditing(false); // Exit editing mode
  };

  const handleSave = async () => {
    onAlertClose();
    setIsSaving(true);
    let updatedProfileData = { ...profile }; // Start with current profile data
    try {
      if (newImageFile) {
        const formData = new FormData();
        formData.append('profileImage', newImageFile);
        const res = await axios.post(`${url}/api/vendor/profile-image`, formData, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } });
        updatedProfileData = { ...updatedProfileData, passportPhotoUrl: res.data.imageUrl }; // Update local profile data with new image URL
      }
      // Removed axios.put for bank details as they are no longer editable by user
      toast({ title: 'Profile Updated', description: 'Profile image updated successfully.', status: 'success' }); // Adjusted message
      setProfile(updatedProfileData); // Update profile state with new image URL
      setNewImageFile(null);
      setPreviewUrl(null);
      setIsEditing(false);
    } catch (err) {
      toast({ title: 'Update Failed', description: err?.response?.data?.message || 'Could not save changes.', status: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // hasChanges now only checks for new image file
  const hasChanges = newImageFile !== null;

  return (
    <Flex minH="100vh" bg={mainBg}>
      {/* Desktop Sidebar */}
      <Box as="nav" pos="fixed" top="0" left="0" zIndex="sticky" h="full" w={DESKTOP_SIDEBAR_WIDTH} bg={sidebarBg} borderRight="1px" borderColor={sidebarBorder} display={{ base: 'none', md: 'block' }}>
        <VendorNavBar />
      </Box>

      {/* Mobile Drawer */}
      <Drawer isOpen={isNavOpen} placement="left" onClose={onNavClose}>
        <DrawerOverlay />
        <DrawerContent bg={sidebarBg} w={DESKTOP_SIDEBAR_WIDTH}>
          <DrawerBody p={0}><VendorNavBar onLinkClick={onNavClose} /></DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <Box flex="1" ml={{ base: 0, md: DESKTOP_SIDEBAR_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
        {!profile ? (
          <Center h="200px"><Spinner size="xl" /></Center>
        ) : (
          <Box maxW="1200px" mx="auto">
            {/* Consistent mobile header: left (hamburger + title), right (actions) */}
            <Flex align="center" gap={2} mb={4} justify="space-between" display={{ base: 'flex', md: 'none' }}>
              <Flex align="center" gap={2}>
                <IconButton
                  aria-label="Open menu"
                  icon={<HamburgerIcon w={5} h={5} />}
                  onClick={onNavOpen}
                  size="sm"
                  variant="ghost"
                  color={iconColor}
                  p={1}
                  mt="-1"
                  _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.200' } }}
                />
                <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">
                  My Profile
                </Heading>
              </Flex>
              {!isEditing ? (
                // Only allow editing if there's a specific reason, like changing photo
                <Button colorScheme="blue" onClick={() => setIsEditing(true)}>Edit Photo</Button>
              ) : (
                <HStack>
                  <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                  <Button colorScheme="green" onClick={onAlertOpen} isDisabled={!hasChanges || isSaving} isLoading={isSaving}>
                    Save Changes
                  </Button>
                </HStack>
              )}
            </Flex>

            {/* Desktop header */}
            <Flex mb={6} align="center" gap={2} display={{ base: 'none', md: 'flex' }}>
              <Heading>My Profile</Heading>
              <Spacer />
              {!isEditing ? (
                // Only allow editing if there's a specific reason, like changing photo
                <Button colorScheme="blue" onClick={() => setIsEditing(true)}>Edit Photo</Button>
              ) : (
                <HStack>
                  <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                  <Button colorScheme="green" onClick={onAlertOpen} isDisabled={!hasChanges || isSaving} isLoading={isSaving}>
                    Save Changes
                  </Button>
                </HStack>
              )}
            </Flex>

            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
              <GridItem colSpan={1}>
                <VStack spacing={6} as={Box} bg={cardBg} p={6} borderRadius="lg" boxShadow="md" align="stretch">
                  <Avatar size="2xl" name={profile.vendorName} src={previewUrl || (profile.passportPhotoUrl ? `${profile.passportPhotoUrl}` : '')} alignSelf="center" />
                  {isEditing && (<><Input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} display="none" /><Button w="full" onClick={() => fileInputRef.current.click()}>Change Photo</Button></>)}
                  <Divider />
                  <ProfileInfoField label="Vendor Name" value={profile.vendorName} />
                  <ProfileInfoField label="Email" value={profile.email} />
                  <ProfileInfoField label="Phone" value={profile.phoneNumber} />
                </VStack>
              </GridItem>

              <GridItem colSpan={{ base: 1, lg: 2 }}>
                <VStack spacing={6} as={Box} bg={cardBg} p={6} borderRadius="lg" boxShadow="md" align="stretch">
                  <Heading size="md" alignSelf="flex-start">Details</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
                    <ProfileInfoField label="Aadhar Number" value={profile.aadharNumber} />
                    <ProfileInfoField label="PAN Card" value={profile.panCardNumber} />
                  </SimpleGrid>
                  <ProfileInfoField label="Address" value={profile.address} />
                  <Divider />
                  {/* Changed heading since fields are no longer user-editable */}
                  <Heading size="md" alignSelf="flex-start">Bank Details</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
                    <FormControl><FormLabel>Bank Name</FormLabel><Input id="bankName" value={profile.bankName || ''} isReadOnly={true} /></FormControl>
                    <FormControl><FormLabel>Account Number</FormLabel><Input id="accountNumber" value={profile.accountNumber || ''} isReadOnly={true} /></FormControl>
                  </SimpleGrid>
                  <FormControl><FormLabel>IFSC Code</FormLabel><Input id="ifscCode" value={profile.ifscCode || ''} isReadOnly={true} /></FormControl>
                </VStack>
              </GridItem>
            </SimpleGrid>
          </Box>
        )}

        {/* Confirmation Modal */}
        <AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef} onClose={onAlertClose}>
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">Confirm Changes</AlertDialogHeader>
              <AlertDialogBody>Are you sure you want to save these changes to your profile?</AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onAlertClose}>Cancel</Button>
                <Button colorScheme="green" onClick={handleSave} ml={3}>Save</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </Flex>
  );
};

export default VendorProfile;