// components/dashboard/ManagePercentageModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    Button, useToast, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td, Input, HStack, Text
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

const ManagePercentageModal = ({ isOpen, onClose, url }) => {
    const { token } = useAuth();
    const toast = useToast();

    const [wallets, setWallets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [percentageInputs, setPercentageInputs] = useState({});
    const [isSaving, setIsSaving] = useState(null); // Tracks the ID of the user being saved

    const fetchWallets = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${url}/api/admin/wallets-with-percentages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch wallet data.');
            const data = await response.json();
            setWallets(data);
        } catch (error) {
            toast({ title: 'Error', description: error.message, status: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [token, url, toast]);

    useEffect(() => {
        if (isOpen) {
            fetchWallets();
        }
    }, [isOpen, fetchWallets]);

    const handleInputChange = (userId, value) => {
        setPercentageInputs(prev => ({ ...prev, [userId]: value }));
    };

    const handleSave = async (userId) => {
        setIsSaving(userId);
        const newPercentage = parseFloat(percentageInputs[userId]);

        if (isNaN(newPercentage)) {
            toast({ title: 'Invalid Input', description: 'Please enter a valid number.', status: 'warning' });
            setIsSaving(null);
            return;
        }

        try {
            const response = await fetch(`${url}/api/admin/update-percentage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId, newPercentage })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            toast({ title: 'Success', description: data.message, status: 'success' });
            await fetchWallets(); // Refresh the list to show the updated "Current %"
        } catch (error) {
            toast({ title: 'Error', description: error.message, status: 'error' });
        } finally {
            setIsSaving(null);
            // Clear the input for this user after saving
            setPercentageInputs(prev => ({ ...prev, [userId]: '' }));
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Manage Referral Percentages</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {isLoading ? (
                        <Center h="200px"><Spinner /></Center>
                    ) : (
                        <Table variant="simple">
                            <Thead>
                                <Tr>
                                    <Th>User</Th>
                                    <Th isNumeric>Current %</Th>
                                    <Th>Set New %</Th>
                                    <Th>Action</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {wallets.map((wallet) => (
                                    <Tr key={wallet.user_id}>
                                        <Td>
                                            <Text fontWeight="bold">{wallet.name}</Text>
                                            <Text fontSize="xs" color="gray.500">{wallet.user_id}</Text>
                                        </Td>
                                        <Td isNumeric fontWeight="bold">
                                            {wallet.current_percentage !== null ? `${wallet.current_percentage}%` : 'Not Set'}
                                        </Td>
                                        <Td>
                                            <Input
                                                type="number"
                                                placeholder="e.g., 5"
                                                size="sm"
                                                w="100px"
                                                value={percentageInputs[wallet.user_id] || ''}
                                                onChange={(e) => handleInputChange(wallet.user_id, e.target.value)}
                                            />
                                        </Td>
                                        <Td>
                                            <Button
                                                size="sm"
                                                colorScheme="green"
                                                isLoading={isSaving === wallet.user_id}
                                                onClick={() => handleSave(wallet.user_id)}
                                            >
                                                Save
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button onClick={onClose}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ManagePercentageModal;