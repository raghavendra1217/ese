import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useColorModeValue,
  Center,
  Text,
  Link,
  Alert,
  AlertIcon,
  HStack,
  useToast,
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

const LoginPage = ({ url }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  

  const [step, setStep] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordInputRef = useRef(null);
  const setPasswordInputRef = useRef(null);

  useEffect(() => {
    if (step === 'password' && passwordInputRef.current) {
      setTimeout(() => passwordInputRef.current.focus(), 0);
    }
    if (step === 'setPassword' && setPasswordInputRef.current) {
      setTimeout(() => setPasswordInputRef.current.focus(), 0);
    }
  }, [step]);

  const cardBg = useColorModeValue('white', 'gray.700');

  // Redirect to the correct dashboard after login
  const navigateToDashboard = (userRole) => {
    switch (userRole) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'vendor':
        navigate('/vendor/dashboard');
        break;
      case 'employee':
        navigate('/employee/dashboard');
        break;
      default:
        navigate('/login');
    }
  };

  const handleEmailCheck = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${url}/api/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An unexpected server error occurred.');
      }
      
      switch (data.status) {
        case 'approved':
          setStep('password');
          break;
        case 'pending':
          setStep('pending');
          break;
        case 'setPassword':
          setStep('setPassword');
          break;
        case 'notFound':
          setError(data.message || 'No account found with this email.');
          break;
        default:
          throw new Error('Received an unexpected status from the server.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${url}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        throw new Error(data.message || 'Invalid credentials. Please try again.');
      }

      login(data.token, data.user);
      navigateToDashboard(data.user.role);
    } catch (err) {
      toast({
        title: 'Login Failed',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      const errorMessage = "Passwords do not match.";
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setIsLoading(true);
    setError('');
    
    try {
        const response = await fetch(`${url}/api/auth/set-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok || !data.token) {
            throw new Error(data.message || 'Could not set password. Please try again.');
        }

        login(data.token, data.user);
        navigateToDashboard(data.user.role);
    } catch(err) {
        toast({
          title: 'Error',
          description: err.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  }
  const handleGoBack = () => {
    setError('');
    setPassword('');
    setConfirmPassword('');
    setStep('email');
  };

  return (
    <Center py={8}>
      <Box
        p={8}
        borderWidth={1}
        borderRadius="lg"
        boxShadow="lg"
        bg={cardBg}
        w={{ base: '90%', sm: '400px' }}
      >
        <VStack spacing={6}>
          <Heading size="lg" color="blue.600">
            Sign In
          </Heading>

          <FormControl isRequired isReadOnly={step !== 'email'}>
            <FormLabel>Email Address</FormLabel>
            <HStack>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                isDisabled={step !== 'email'}
              />
              {step !== 'email' && (
                <Button variant="ghost" onClick={handleGoBack} size="sm">
                  Change
                </Button>
              )}
            </HStack>
          </FormControl>

          {step === 'pending' && (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Account Approval Pending</Text>
                <Text fontSize="sm">
                  Your account is waiting for administrator approval. Please check back later or contact support.
                </Text>
              </Box>
            </Alert>
          )}

          {step === 'setPassword' && (
            <VStack as="form" onSubmit={handleSetPassword} spacing={4} width="full">
                <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    Account approved! Please set your password to continue.
                </Alert>
                <FormControl isRequired>
                    <FormLabel>New Password</FormLabel>
                    <Input
                    ref={setPasswordInputRef}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Confirm New Password</FormLabel>
                    <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </FormControl>
                {error && <Text color="red.500" fontSize="sm" textAlign="center">{error}</Text>}
                <Button
                    type="submit"
                    colorScheme="blue"
                    width="full"
                    isLoading={isLoading}
                    disabled={!password || !confirmPassword}
                >
                    Set Password and Login
                </Button>
            </VStack>
          )}

          {step === 'password' && (
            <VStack as="form" onSubmit={handleLogin} spacing={4} width="full">
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  ref={passwordInputRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormControl>
              <HStack width="full" justify="flex-end">
                <Link color="blue.500" fontSize="sm" onClick={() => alert('Forgot Password flow initiated!')}>
                  Forgot Password?
                </Link>
              </HStack>
              {error && <Text color="red.500" fontSize="sm" textAlign="center">{error}</Text>}
              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                isLoading={isLoading}
                disabled={!password}
              >
                Login
              </Button>
            </VStack>
          )}

          {step === 'email' && (
            <VStack as="form" onSubmit={handleEmailCheck} spacing={4} width="full">
              {error && <Text color="red.500" fontSize="sm" textAlign="center">{error}</Text>}
              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                isLoading={isLoading}
                disabled={!email.trim()}
              >
                Continue
              </Button>
            </VStack>
          )}
        </VStack>
      </Box>
    </Center>
  );
};

export default LoginPage;