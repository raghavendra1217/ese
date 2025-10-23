import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Text, useColorModeValue, Tooltip, IconButton,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton, VStack, HStack, Button,
  Grid, GridItem, Avatar, Icon
} from '@chakra-ui/react';
import { useClipboard } from '@chakra-ui/react';
import { FaRegUserCircle, FaUserPlus, FaBolt, FaShoppingCart } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../AppContext';
import useApi from '../../hooks/useApi';
import CoordinatorProductRequestModal from '../coordinator/CoordinatorProductRequestModal';

const AddMemberModal = ({ isOpen, onClose, referralLink, onRegisterAndLogout }) => {
  const { onCopy, hasCopied } = useClipboard(referralLink);
  const linkBg = useColorModeValue('gray.100', 'gray.600');

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add a New Member</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <Text>Copy the link and send it to a new vendor, or log out and register a new account yourself.</Text>
            <Box p={3} bg={linkBg} borderRadius="md" w="full" minH="46px">
              {referralLink && (
                <HStack justify="space-between" align="center">
                  <Text fontFamily="monospace" fontSize="sm" noOfLines={1} title={referralLink}>
                    {referralLink}
                  </Text>
                  <Button onClick={onCopy} size="sm" colorScheme={hasCopied ? "green" : "teal"}>
                    {hasCopied ? "Copied!" : "Copy Link"}
                  </Button>
                </HStack>
              )}
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="gray" mr={3} onClick={onClose}>Cancel</Button>
          <Button colorScheme="blue" onClick={onRegisterAndLogout}>
            Logout & Register
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const CoordinatorDashboardHeader = ({ stats, url }) => {
  const textAndIconColor = useColorModeValue('gray.800', 'white');
  const mobileButtonBg = useColorModeValue('gray.100', 'gray.700');

  // Modal state management
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isProductRequestOpen, onOpen: onProductRequestOpen, onClose: onProductRequestClose } = useDisclosure();
  const { user, logout } = useAuth();
  const referralLink = `https://esepapertrading.onrender.com/register`;
  const handleRegisterAndLogout = () => {
    logout();
    window.location.href = 'https://esepapertrading.onrender.com/register';
  };

  // Fetch coordinator profile data
  const { data: profileData, isLoading: profileLoading, error: profileError } = useApi(url, '/api/coordinator/profile');

  // Get coordinator's name from profile data
  const coordinatorName = profileData?.coordinator?.name || 'Coordinator';

  return (
    <>
      <Grid
        templateColumns={{ base: '1fr', md: '1fr auto' }}
        gap={{ base: 4, md: 6 }}
        mb={8}
        w="100%"
        alignItems="center"
      >
        {/* --- Left Side --- */}
        <GridItem>
          <VStack align="flex-start" spacing={3}>
            <HStack spacing={4}>
              <Avatar size="md" name={coordinatorName} />
              <VStack align="start" spacing={0} maxW="300px">
                <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" lineHeight="1.2">
                  Hello, {coordinatorName}!
                </Text>
                {user?.id && (
                  <Text fontSize="sm" color="gray.500" fontWeight="bold">
                    ID: {user.id}
                  </Text>
                )}
              </VStack>
            </HStack>
          </VStack>
        </GridItem>

        {/* --- Right Side: Action Buttons --- */}
        <GridItem justifySelf={{ base: 'stretch', md: 'flex-end' }}>
          <HStack
            spacing={2}
            w={{ base: 'full', md: 'auto' }}
            bg={{ base: mobileButtonBg, md: 'transparent' }}
            p={{ base: 2, md: 0 }}
            borderRadius={{ base: 'lg', md: 0 }}
          >
            <Button size="md" variant="ghost" onClick={onOpen} flex={1} h="auto" py={2}>
              <VStack spacing={1}>
                <Icon as={FaUserPlus} />
                <Text fontSize="xs">Refer</Text>
              </VStack>
            </Button>
            <Button size="md" variant="ghost" as={RouterLink} to="/coordinator/quick-registration" flex={1} h="auto" py={2}>
              <VStack spacing={1}>
                <Icon as={FaBolt} />
                <Text fontSize="xs">Quick Reg</Text>
              </VStack>
            </Button>
            <Button size="md" variant="ghost" colorScheme="blue" onClick={onProductRequestOpen} flex={1} h="auto" py={2}>
              <VStack spacing={1}>
                <Icon as={FaShoppingCart} />
                <Text fontSize="xs">Request</Text>
              </VStack>
            </Button>
          </HStack>
        </GridItem>
      </Grid>

      <AddMemberModal
        isOpen={isOpen}
        onClose={onClose}
        referralLink={referralLink}
        onRegisterAndLogout={handleRegisterAndLogout}
      />
      
      <CoordinatorProductRequestModal
        isOpen={isProductRequestOpen}
        onClose={onProductRequestClose}
        url={url}
        onRequestSuccess={() => {
          onProductRequestClose();
        }}
      />
    </>
  );
};

export default CoordinatorDashboardHeader;
