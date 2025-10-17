import React from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Text,
    VStack,
    Alert,
    AlertIcon,
    Box,
    useColorModeValue
} from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmColorScheme = "red",
    isLoading = false,
    loadingText = "Processing...",
    icon = null,
    alertType = "warning"
}) => {
    const modalBg = useColorModeValue('white', 'gray.800');
    const textColor = useColorModeValue('gray.600', 'gray.300');

    const handleConfirm = () => {
        onConfirm();
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} isCentered size="md">
            <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
            <ModalContent bg={modalBg} mx={4}>
                <ModalHeader pb={2}>
                    <VStack spacing={3} align="center">
                        {icon || (
                            <Box
                                p={3}
                                borderRadius="full"
                                bg={`${confirmColorScheme}.100`}
                                color={`${confirmColorScheme}.600`}
                            >
                                <AlertTriangle size={24} />
                            </Box>
                        )}
                        <Text fontSize="lg" fontWeight="bold" textAlign="center">
                            {title}
                        </Text>
                    </VStack>
                </ModalHeader>
                
                <ModalCloseButton isDisabled={isLoading} />
                
                <ModalBody py={4}>
                    <VStack spacing={4}>
                        <Alert status={alertType} borderRadius="md" variant="subtle">
                            <AlertIcon />
                            <Box>
                                <Text fontSize="sm" color={textColor} textAlign="center">
                                    {message}
                                </Text>
                            </Box>
                        </Alert>
                    </VStack>
                </ModalBody>

                <ModalFooter pt={2}>
                    <VStack spacing={3} w="full">
                        <Button
                            colorScheme={confirmColorScheme}
                            onClick={handleConfirm}
                            isLoading={isLoading}
                            loadingText={loadingText}
                            size="md"
                            w="full"
                            isDisabled={isLoading}
                        >
                            {confirmText}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleClose}
                            size="md"
                            w="full"
                            isDisabled={isLoading}
                        >
                            {cancelText}
                        </Button>
                    </VStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ConfirmationModal;
