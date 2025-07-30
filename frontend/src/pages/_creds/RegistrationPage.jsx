import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input, VStack, Heading,
  useColorModeValue, Center, Divider, Textarea, FormHelperText,
  useToast
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

// --- Validation Helper Functions ---
const validatePhoneNumber = (phone) => /^\d{10}$/.test(phone);
const validateAadharNumber = (aadhar) => /^\d{12}$/.test(aadhar);
const validatePanCardNumber = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
// ---

const RegistrationPage = ({ url }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- UPDATED: 'employeeCount' is removed from the initial state ---
  const initialFormData = {
    email: '',
    vendorName: '',
    phoneNumber: '',
    aadharNumber: '',
    panCardNumber: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    address: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [passportPhoto, setPassportPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    sessionStorage.removeItem('registrationData');
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const finalValue = id === 'panCardNumber' ? value.toUpperCase() : value;
    setFormData({ ...formData, [id]: finalValue });

    let error = '';
    if (id === 'phoneNumber' && finalValue && !validatePhoneNumber(finalValue)) {
      error = 'Phone number must be exactly 10 digits.';
    } else if (id === 'aadharNumber' && finalValue && !validateAadharNumber(finalValue)) {
      error = 'Aadhar number must be exactly 12 digits.';
    } else if (id === 'panCardNumber' && finalValue && !validatePanCardNumber(finalValue)) {
      error = 'Invalid PAN card format.';
    }
    setFormErrors({ ...formErrors, [id]: error });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!validatePhoneNumber(formData.phoneNumber)) errors.phoneNumber = 'Phone number must be exactly 10 digits.';
    if (!validateAadharNumber(formData.aadharNumber)) errors.aadharNumber = 'Aadhar number must be exactly 12 digits.';
    if (!validatePanCardNumber(formData.panCardNumber)) errors.panCardNumber = 'Invalid PAN card format.';

    if (Object.values(errors).some(error => error)) {
      setFormErrors(prev => ({...prev, ...errors}));
      toast({
        title: 'Validation Error',
        description: 'Please correct the errors in the form before submitting.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    const uploadData = new FormData();
    for (const key in formData) {
      uploadData.append(key, formData[key]);
    }
    if (passportPhoto) {
      uploadData.append('passportPhoto', passportPhoto);
    }

    try {
      const response = await fetch(`${url}/api/auth/register`, {
        method: 'POST',
        body: uploadData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      toast({
        title: 'Details Saved!',
        description: 'Your information has been saved. Redirecting to payment...',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // --- UPDATED: 'employeeCount' is removed from data passed to sessionStorage ---
      const registrationData = {
        email: formData.email,
        vendorName: formData.vendorName,
      };
      sessionStorage.setItem('registrationData', JSON.stringify(registrationData));

      navigate('/payment');

    } catch (err) {
      toast({ title: 'Submission Error', description: err.message, status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = !Object.values(formData).some(val => val === '') && !Object.values(formErrors).some(err => err !== '');

  return (
    <Center minH="100vh" py={10} px={4}>
      <VStack spacing={6} w="100%" maxW="700px">
        <VStack spacing={2} align="flex-start" w="100%">
          <Heading as="h1" size="xl" color={useColorModeValue('gray.700', 'white')}>
            Vendor Registration
          </Heading>
          <Divider borderColor="red.400" borderWidth="1px" />
        </VStack>

        <Box p={8} borderWidth={1} borderColor={cardBorder} borderRadius="xl" boxShadow="lg" bg={cardBg} w="100%">
            <VStack spacing={4} as="form" onSubmit={handleSubmit}>
              <Heading size="md" color="teal.500" alignSelf="flex-start">Fill Your Details</Heading>

              <FormControl isRequired isInvalid={!!formErrors.email}>
                <FormLabel htmlFor="email">Email Address</FormLabel>
                <Input id="email" type="email" value={formData.email} onChange={handleInputChange} />
              </FormControl>

              <FormControl isRequired>
                <FormLabel htmlFor="vendorName">Vendor Name</FormLabel>
                <Input id="vendorName" value={formData.vendorName} onChange={handleInputChange} />
              </FormControl>

              <FormControl isRequired isInvalid={!!formErrors.phoneNumber}>
                <FormLabel htmlFor="phoneNumber">Phone Number</FormLabel>
                <Input id="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleInputChange} maxLength="10"/>
                {formErrors.phoneNumber ? ( <FormHelperText color="red.500">{formErrors.phoneNumber}</FormHelperText> ) : ( <FormHelperText>Enter a 10-digit mobile number.</FormHelperText> )}
              </FormControl>

              <FormControl isRequired isInvalid={!!formErrors.aadharNumber}>
                <FormLabel htmlFor="aadharNumber">Aadhar Number</FormLabel>
                <Input id="aadharNumber" value={formData.aadharNumber} onChange={handleInputChange} maxLength="12" />
                {formErrors.aadharNumber ? ( <FormHelperText color="red.500">{formErrors.aadharNumber}</FormHelperText> ) : ( <FormHelperText>Enter your 12-digit Aadhar number without spaces.</FormHelperText> )}
              </FormControl>

              <FormControl isRequired isInvalid={!!formErrors.panCardNumber}>
                <FormLabel htmlFor="panCardNumber">PAN Card Number</FormLabel>
                <Input id="panCardNumber" value={formData.panCardNumber} onChange={handleInputChange} maxLength="10"/>
                {formErrors.panCardNumber ? ( <FormHelperText color="red.500">{formErrors.panCardNumber}</FormHelperText> ) : ( <FormHelperText>Format: ABCDE1234F</FormHelperText> )}
              </FormControl>

              {/* --- FIELD REMOVED --- */}
              {/* The "No. of Employees" FormControl block was here and has been deleted. */}

              <Divider my={4} />
              <Heading size="sm" color="gray.600" alignSelf="flex-start">Bank Account Details</Heading>

              <FormControl isRequired>
                <FormLabel htmlFor="bankName">Bank Name</FormLabel>
                <Input id="bankName" value={formData.bankName} onChange={handleInputChange} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel htmlFor="accountNumber">Account Number</FormLabel>
                <Input id="accountNumber" value={formData.accountNumber} onChange={handleInputChange} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel htmlFor="ifscCode">IFSC Code</FormLabel>
                <Input id="ifscCode" value={formData.ifscCode} onChange={handleInputChange} />
              </FormControl>
              
              <Divider my={4} />

              <FormControl isRequired>
                <FormLabel htmlFor="passportPhoto">Passport-size Photo</FormLabel>
                <Input ref={fileInputRef} id="passportPhoto" type="file" p={1.5} onChange={(e) => setPassportPhoto(e.target.files[0])} accept="image/*"/>
                <FormHelperText>Accepted formats: PNG, JPG ,JPEG </FormHelperText>
              </FormControl>

              <FormControl isRequired>
                <FormLabel htmlFor="address">Full Address</FormLabel>
                <Textarea id="address" value={formData.address} onChange={handleInputChange} placeholder="Enter your full address" />
              </FormControl>
              
              <Button type="submit" colorScheme="teal" width="full" size="lg" isLoading={isLoading} isDisabled={!isFormValid} mt={6}>
                Submit and Proceed to Payment
              </Button>
            </VStack>
        </Box>
      </VStack>
    </Center>
  );
};

export default RegistrationPage;