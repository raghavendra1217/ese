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
  Text,
  Link,
  Alert,
  AlertIcon,
  HStack,
  useToast,
  useBreakpointValue,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';

const LoginPage = ({ url }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const isMobile = useBreakpointValue({ base: true, md: false });

  const [step, setStep] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [identifier, setIdentifier] = useState(''); // renamed from email
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      case 'coordinator':
        navigate('/coordinator/dashboard');
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
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Unexpected error.');

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
          setError(data.message || 'No account found.');
          break;
        default:
          throw new Error('Unexpected status from server.');
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
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        throw new Error(data.message || 'Invalid credentials');
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
      const msg = 'Passwords do not match.';
      setError(msg);
      toast({ title: 'Error', description: msg, status: 'error', duration: 5000, isClosable: true });
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${url}/api/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        throw new Error(data.message || 'Could not set password.');
      }

      login(data.token, data.user);
      navigateToDashboard(data.user.role);
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error', duration: 5000, isClosable: true });
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    setError('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setStep('email');
  };

  const content = (
    <Box
      w="full"
      maxW="400px"
      mx="auto"
      mt={8}
      px={{ base: 4, md: 8 }}
      py={6}
      bg={cardBg}
      borderWidth="1px"
      borderRadius="lg"
      boxShadow="lg"
    >
      <VStack spacing={6} align="stretch">
        <Heading size="lg" color="blue.600" textAlign="center">
          Login
        </Heading>

        {/* Identifier Field */}
        <FormControl isRequired isReadOnly={step !== 'email'}>
          <FormLabel>Email or Phone Number</FormLabel>
          <HStack>
            <Input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter email or phone number"
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

        {/* Pending */}
        {step === 'pending' && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Account Approval Pending</Text>
              <Text fontSize="sm">Please check back later or contact support.</Text>
            </Box>
          </Alert>
        )}

        {/* Set Password */}
        {step === 'setPassword' && (
          <VStack as="form" onSubmit={handleSetPassword} spacing={4}>
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              Account approved! Please set your password.
            </Alert>
            <FormControl isRequired>
              <FormLabel>New Password</FormLabel>
              <InputGroup>
                <Input
                  ref={setPasswordInputRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Confirm New Password</FormLabel>
              <InputGroup>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
            {error && <Text color="red.500" fontSize="sm" textAlign="center">{error}</Text>}
            <Button type="submit" colorScheme="blue" isLoading={isLoading} width="full">
              Set Password and Login
            </Button>
          </VStack>
        )}

        {/* Login */}
        {step === 'password' && (
          <VStack as="form" onSubmit={handleLogin} spacing={4}>
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  ref={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
            <HStack justify="flex-end" w="full">
              <Link
                color="blue.500"
                fontSize="sm"
                as="button"
                onClick={() => navigate(`/forgot-password?identifier=${encodeURIComponent(identifier)}`)}
              >
                Forgot Password?
              </Link>
            </HStack>
            {error && <Text color="red.500" fontSize="sm" textAlign="center">{error}</Text>}
            <Button type="submit" colorScheme="blue" isLoading={isLoading} width="full">
              Login
            </Button>
          </VStack>
        )}

        {/* Email Step */}
        {step === 'email' && (
          <VStack as="form" onSubmit={handleEmailCheck} spacing={4}>
            {error && <Text color="red.500" fontSize="sm" textAlign="center">{error}</Text>}
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isLoading}
              disabled={!identifier.trim()}
              width="full"
            >
              Continue
            </Button>
          </VStack>
        )}
      </VStack>
    </Box>
  );

  return (
    <Box bg={useColorModeValue('gray.5', 'gray.800')} minH="80vh" p={4} overflow="hidden">
      {content}
    </Box>
  );
};

export default LoginPage;
