import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Text, useColorModeValue, Tooltip, IconButton,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton, VStack, HStack, Button
} from '@chakra-ui/react';
import { useClipboard } from '@chakra-ui/react';
import { FaRegUserCircle, FaUserPlus, FaBolt, FaWallet } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../AppContext';
import useApi from '../../hooks/useApi';

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
  const hasPendingWalletApprovals = stats?.pendingWalletApprovals > 0;

  // Modal state management
  const { isOpen, onOpen, onClose } = useDisclosure();
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
      <Flex
        justify="space-between"
        align="center"
        mb={8}
        w="100%"
        px={{ base: 4, lg: 8 }}
      >
        <Flex align="center" gap={3}>
          <Box color={textAndIconColor}>
            <FaRegUserCircle size={42} />
          </Box>
          <Text
            fontWeight="semibold"
            fontSize="lg"
            color={textAndIconColor}
          >
            Hello, {coordinatorName}
          </Text>
        </Flex>

        <Flex align="center" gap={4}>
          <Tooltip label="Add Member" hasArrow>
            <IconButton
              variant="ghost"
              color={textAndIconColor}
              onClick={onOpen}
              aria-label="Add Member"
              fontSize={{ base: '24px', lg: '26px' }}
              icon={<FaUserPlus />}
            />
          </Tooltip>

          <Tooltip label="Quick Registration" hasArrow>
            <IconButton
              as={RouterLink}
              to="/admin/quick-registration-management"
              variant="ghost"
              aria-label="Quick Registration"
              color={textAndIconColor}
              fontSize={{ base: '24px', lg: '26px' }}
              icon={<FaBolt />}
            />
          </Tooltip>

          <Tooltip label="Manage Wallet Approvals" hasArrow>
            <Box position="relative">
              <IconButton
                as={RouterLink}
                to="/admin/wallet-approvals"
                variant="ghost"
                aria-label="Wallet Approvals"
                color={textAndIconColor}
                fontSize={{ base: '24px', lg: '26px' }}
                icon={<FaWallet />}
              />
              {hasPendingWalletApprovals && (
                <Box
                  as="span"
                  position="absolute"
                  top="1"
                  right="1"
                  fontSize="xs"
                  w={2}
                  h={2}
                  bg="red.500"
                  borderRadius="full"
                />
              )}
            </Box>
          </Tooltip>
        </Flex>
      </Flex>

      <AddMemberModal
        isOpen={isOpen}
        onClose={onClose}
        referralLink={referralLink}
        onRegisterAndLogout={handleRegisterAndLogout}
      />
    </>
  );
};

export default CoordinatorDashboardHeader;
