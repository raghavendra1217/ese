import React from 'react';
import { Flex, Box, Heading, Text, Button, HStack, useColorModeValue, Tooltip } from '@chakra-ui/react';

// --- ACCEPT THE NEW PROP ---
const WalletHeader = ({ digitalMoney, onAddMoneyClick, onWithdrawClick, hasPendingWithdrawal }) => {
    const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
    
    const displayBalance = typeof digitalMoney === 'number'
        ? digitalMoney.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '...';

    return (
        <Flex justify="space-between" align="center" mb={8}>
            <Box>
                <Heading as="h1" size="xl">My Wallet</Heading>
                <Text fontSize="2xl" fontWeight="bold" color={secondaryTextColor}>
                    ₹{displayBalance}
                </Text>
            </Box>

            <HStack spacing={4}>
                <Button colorScheme="green" variant="solid" onClick={onAddMoneyClick}>
                    Add Money
                </Button>

                {/* --- USE TOOLTIP FOR BETTER UX --- */}
                <Tooltip 
                    label="You already have a withdrawal request pending review." 
                    isDisabled={!hasPendingWithdrawal} // Only show tooltip when button is disabled
                    hasArrow
                >
                    {/* The Box is necessary for the Tooltip to work on a disabled button */}
                    <Box>
                        <Button 
                            colorScheme="orange" 
                            variant="outline" 
                            onClick={onWithdrawClick}
                            isDisabled={hasPendingWithdrawal} // <-- DISABLE BUTTON
                        >
                            Withdraw
                        </Button>
                    </Box>
                </Tooltip>
            </HStack>
        </Flex>
    );
};

export default WalletHeader;