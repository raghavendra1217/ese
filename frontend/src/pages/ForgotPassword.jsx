import React, { useState, useEffect } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input, VStack,
  Heading, useToast, Center, Text, Alert, AlertIcon
} from '@chakra-ui/react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const ForgotPassword = ({ url }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const prefilledEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(prefilledEmail);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('email');

  useEffect(() => {
    setEmail(prefilledEmail);
  }, [prefilledEmail]);

  const handleSendOTP = async () => {
  setIsLoading(true);
  setError('');
  try {
    const response = await fetch(`${url}/api/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const text = await response.text(); // Get raw response

    let data;
    try {
      data = JSON.parse(text); // Try parsing JSON
    } catch (jsonErr) {
      throw new Error('Server error. Please contact admin.');
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("This email doesn't exist in our system. Please contact admin to update or register correctly.");
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    }

    toast({
      title: 'OTP Sent',
      description: 'Check your email for the OTP',
      status: 'success',
      duration: 4000,
      isClosable: true,
    });
    setStep('otp');
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

  const handleVerifyOTP = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${url}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'OTP verification failed');

      setOtpVerified(true);
      toast({
        title: 'OTP Verified',
        description: 'You can now reset your password',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${url}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Reset failed');

      toast({
        title: 'Password Reset',
        description: 'Your password has been updated successfully!',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Center py={10}>
      <Box w="full" maxW="400px" p={6} borderWidth={1} borderRadius="lg" boxShadow="md">
        <VStack spacing={6}>
          <Heading size="lg" color="blue.600">Forgot Password</Heading>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {/* Step 1: Enter Email */}
          {step === 'email' && (
            <>
              <FormControl isRequired>
                <FormLabel>Email Address</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </FormControl>
              <Button colorScheme="blue" width="full" onClick={handleSendOTP} isLoading={isLoading}>
                Send OTP
              </Button>
            </>
          )}

          {/* Step 2: Enter OTP + Show password if verified */}
          {step === 'otp' && (
            <>
              <FormControl isRequired>
                <FormLabel>Enter OTP</FormLabel>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP sent to your email"
                />
              </FormControl>
              <Button colorScheme="blue" width="full" onClick={handleVerifyOTP} isLoading={isLoading}>
                Verify OTP
              </Button>

              {otpVerified && (
                <>
                  <FormControl isRequired mt={4}>
                    <FormLabel>New Password</FormLabel>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Confirm Password</FormLabel>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </FormControl>
                  <Button colorScheme="green" width="full" onClick={handleResetPassword} isLoading={isLoading}>
                    Reset Password
                  </Button>
                </>
              )}
            </>
          )}
        </VStack>
      </Box>
    </Center>
  );
};

export default ForgotPassword;
