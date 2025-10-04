
import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input, VStack, Heading,
  useColorModeValue, Center, Divider, Textarea, FormHelperText,
  useToast
} from '@chakra-ui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const validatePhoneNumber = (phone) => /^\d{10}$/.test(phone);
const validateAadharNumber = (aadhar) => /^\d{12}$/.test(aadhar);
const validatePanCardNumber = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);

const RegistrationPage = ({ url }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [searchParams] = useSearchParams();

  const initialFormData = {
    vendorName: '', phoneNumber: '', email: '', panCardNumber: '', aadharNumber: '',
    referralId: '', bankName: '', accountNumber: '', ifscCode: '', address: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [passportPhoto, setPassportPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  useEffect(() => {
    const referralCode = searchParams.get('ref');
    if (referralCode) {
      setFormData(prevData => ({ ...prevData, referralId: referralCode }));
    }
    sessionStorage.removeItem('registrationData');
  }, [searchParams]);

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
    if (formData.aadharNumber && !validateAadharNumber(formData.aadharNumber)) errors.aadharNumber = 'Aadhar number must be exactly 12 digits.';
    if (!validatePanCardNumber(formData.panCardNumber)) errors.panCardNumber = 'Invalid PAN card format.';

    if (Object.values(errors).some(error => error)) {
      setFormErrors(prev => ({ ...prev, ...errors }));
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
        if (response.status === 409) {
          throw new Error(data.message || 'An account with this email already exists. Please use a different email address or contact support if you believe this is an error.');
        }
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      toast({
        title: 'Details Saved!',
        description: 'Your information has been saved. Redirecting to payment...',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

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

  const requiredFields = { ...formData };
  delete requiredFields.referralId;
  delete requiredFields.aadharNumber; // Make Aadhar optional
  const isFormValid =
    !Object.values(requiredFields).some(val => val === '') &&
    !Object.values(formErrors).some(err => err !== '') &&
    (passportPhoto !== null || true); // Make passport photo optional

  const isReferralFromLink = !!searchParams.get('ref');

  return (
    <Box
      minH="100vh"
      maxW="100vw"
      overflowX="hidden"
      overflowY="auto"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
      py={8}
      bg={useColorModeValue('gray.5', 'gray.900')}
    >
      <Box
        w="full"
        maxW="lg"
        borderRadius="xl"
        bg={cardBg}
        boxShadow="2xl"
        borderWidth={1}
        borderColor={cardBorder}
        p={{ base: 6, md: 8 }}
      >
        <VStack spacing={6} as="form" onSubmit={handleSubmit}>
          <Heading size="lg" color={textColor} alignSelf="flex-start">
            Vendor Registration
          </Heading>
          <Divider borderColor="teal.400" />

          <FormControl isRequired>
            <FormLabel>Vendor Name</FormLabel>
            <Input id="vendorName" value={formData.vendorName} onChange={handleInputChange} />
          </FormControl>

          <FormControl isRequired isInvalid={!!formErrors.phoneNumber}>
            <FormLabel>Phone Number</FormLabel>
            <Input id="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleInputChange} maxLength="10" />
            <FormHelperText>{formErrors.phoneNumber || '10 digits required'}</FormHelperText>
          </FormControl>

          <FormControl isRequired isInvalid={!!formErrors.email}>
            <FormLabel>Email Address</FormLabel>
            <Input id="email" type="email" value={formData.email} onChange={handleInputChange} />
          </FormControl>

          <FormControl isRequired isInvalid={!!formErrors.panCardNumber}>
            <FormLabel>PAN Card Number</FormLabel>
            <Input id="panCardNumber" value={formData.panCardNumber} onChange={handleInputChange} maxLength="10" />
            <FormHelperText>{formErrors.panCardNumber || 'Format: ABCDE1234F'}</FormHelperText>
          </FormControl>

          <FormControl isInvalid={!!formErrors.aadharNumber}>
            <FormLabel>Aadhar Number (Optional)</FormLabel>
            <Input id="aadharNumber" value={formData.aadharNumber} onChange={handleInputChange} maxLength="12" />
            <FormHelperText>{formErrors.aadharNumber || '12 digits without space (optional)'}</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel>Referral ID</FormLabel>
            <Input
              id="referralId"
              value={formData.referralId}
              onChange={handleInputChange}
              placeholder="e.g., v_001"
              isReadOnly={isReferralFromLink}
              _readOnly={{ bg: useColorModeValue('gray.100', 'gray.600'), cursor: 'not-allowed' }}
            />
          </FormControl>

          <Divider />

          <FormControl isRequired>
            <FormLabel>Bank Name</FormLabel>
            <Input id="bankName" value={formData.bankName} onChange={handleInputChange} />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Account Number</FormLabel>
            <Input id="accountNumber" value={formData.accountNumber} onChange={handleInputChange} />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>IFSC Code</FormLabel>
            <Input id="ifscCode" value={formData.ifscCode} onChange={handleInputChange} />
          </FormControl>

          <FormControl>
            <FormLabel>Passport-size Photo (Optional)</FormLabel>
            <Input ref={fileInputRef} id="passportPhoto" type="file" p={1.5} onChange={(e) => setPassportPhoto(e.target.files[0])} accept="image/*" />
            <FormHelperText>Upload a clear passport-size photo (optional)</FormHelperText>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Full Address</FormLabel>
            <Textarea id="address" value={formData.address} onChange={handleInputChange} />
          </FormControl>

          <Button
            type="submit"
            colorScheme="teal"
            w="full"
            size="lg"
            isLoading={isLoading}
            isDisabled={!isFormValid}
          >
            
            Submit & Proceed
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default RegistrationPage;
