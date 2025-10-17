import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  Box,
  Text,
  HStack,
  Button,
  useColorModeValue,
  useClipboard,
} from '@chakra-ui/react';


const AddMemberModal = ({ isOpen, onClose, referralLink, onRegisterAndLogout }) => {
  const { onCopy, hasCopied } = useClipboard(referralLink);
  const linkBg = useColorModeValue('gray.100', 'gray.700');

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add a New Member</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <Text textAlign="center">
              Copy the referral link to invite a new vendor or log out to register one yourself.
            </Text>
            <Box p={3} bg={linkBg} borderRadius="md" w="full">
              <HStack justify="space-between">
                <Text fontFamily="monospace" fontSize="sm" noOfLines={1} w="80%">
                  {referralLink}
                </Text>
                <Button onClick={onCopy} size="sm" colorScheme={hasCopied ? 'green' : 'gray'}>
                  {hasCopied ? 'Copied!' : 'Copy'}
                </Button>
              </HStack>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
                              <Button 
                        colorScheme="blue" 
                        onClick={() => {
                            console.log('Button clicked in AddMemberModal');
                            console.log('onRegisterAndLogout function:', onRegisterAndLogout);
                            if (onRegisterAndLogout) {
                                onRegisterAndLogout();
                            } else {
                                console.error('onRegisterAndLogout function is not defined!');
                            }
                        }}
                    >
                        Logout & Register
                    </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddMemberModal;
