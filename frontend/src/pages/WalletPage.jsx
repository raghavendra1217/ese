import React, { useEffect, useState, useCallback } from 'react';
import { Box, Heading, Text, Flex, useColorModeValue, Spinner, Container, Alert, AlertIcon, useToast, Center } from '@chakra-ui/react';
import VendorNavBar from '../components/layout/VendorNavBar';
import { useAuth } from '../AppContext';

// Import the new, modular components from the incoming change
import WalletHeader from '../components/wallet/WalletHeader';
import ActiveTradeItem from '../components/wallet/ActiveTradeItem';
import SoldTradeItem from '../components/wallet/SoldTradeItem';
import AddMoneyModal from '../components/wallet/AddMoneyModal';
import WithdrawModal from '../components/wallet/WithdrawModal';

const WalletPage = ({ url }) => {
    // --- Styles and Hooks (from incoming change) ---
    const bg = useColorModeValue('gray.50', 'gray.900');
    const cardBg = useColorModeValue('white', 'gray.700');
    const { token } = useAuth();
    const toast = useToast();

    // --- State Management (merged from both versions) ---
    const [activeTrades, setActiveTrades] = useState(null);
    const [soldTrades, setSoldTrades] = useState(null);
    const [digitalMoney, setDigitalMoney] = useState(null)
    const [error, setError] = useState('');
    
    // New state from the incoming change for withdrawal feature
    const [hasPendingWithdrawal, setHasPendingWithdrawal] = useState(false);
    
    // UI Interaction states
    const [isSelling, setIsSelling] = useState(null);
    const [isAddMoneyOpen, setAddMoneyOpen] = useState(false);
    const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);

    // --- Data Fetching (from incoming change) ---
    // This structure is better as it allows re-fetching individual parts of the data.
    const fetchWalletBalance = useCallback(async () => {
        try {
            const res = await fetch(`${url}/api/wallet`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Could not load wallet data');
            const data = await res.json();
            
            // Set both pieces of state from the single API call
            setDigitalMoney(data.digital_money || 0);
            setHasPendingWithdrawal(data.hasPendingWithdrawal || false);

        } catch (err) {
            toast({ title: 'Error', description: err.message, status: 'error', duration: 3000 });
        }
    }, [token, url, toast]);

    const fetchActiveTrades = useCallback(async () => {
        try {
            const res = await fetch(`${url}/api/trading/active`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Could not load active trades');
            setActiveTrades(await res.json());
        } catch (err) {
            setError('Could not fetch active trades.');
        }
    }, [token, url]);

    const fetchSoldTrades = useCallback(async () => {
        try {
            const res = await fetch(`${url}/api/trading/sold`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Could not load trade history');
            setSoldTrades(await res.json());
        } catch (err) {
            setError('Could not fetch trade history.');
        }
    }, [token, url]);

    useEffect(() => {
        if (token) {
            fetchActiveTrades();
            fetchSoldTrades();
            fetchWalletBalance();
        }
    }, [token, fetchActiveTrades, fetchSoldTrades, fetchWalletBalance]); // Correct dependencies

    
    // --- RESOLVED 'handleSell' LOGIC ---
    // This version combines the safer wallet update from your local version
    // with the cleaner data flow from the incoming change.
    const handleSell = useCallback(async (tradeToSell) => {
        setIsSelling(tradeToSell.trade_id);
        try {
            const response = await fetch(`${url}/api/trading/sell`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ trade_id: tradeToSell.trade_id }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to sell item.');
            
            // 1. Get the complete sold item object from the backend (from incoming change)
            const soldItem = data.sold_trade;

            // 2. Trust the backend for the new wallet total (from your local version)
            setDigitalMoney(data.digital_money);

            // 3. Update the local lists of trades
            setActiveTrades(prev => prev.filter(t => t.trade_id !== soldItem.trade_id));
            setSoldTrades(prev => [soldItem, ...prev]);

            toast({ title: 'Success!', description: `Sold ${soldItem.paper_type}.`, status: 'success', duration: 3000 });

        } catch (err) {
            toast({ title: 'Sell Error', description: err.message, status: 'error', duration: 4000 });
        } finally {
            setIsSelling(null);
        }
    }, [token, url, toast]);


    if (!token) return <Container centerContent py={20}><Alert status="warning"><AlertIcon />Please log in to view your wallet.</Alert></Container>;

    return (
        <>
            <Flex minH="100vh" bg={bg}>
                <VendorNavBar />
                <Box flex="1" ml={{ base: '0', md: '80px' }} p={8}>
                    {error && <Alert status="error" mb={4}><AlertIcon />{error}</Alert>}

                    {/* Use the new WalletHeader component from the incoming change */}
                    <WalletHeader 
                        digitalMoney={digitalMoney}
                        onAddMoneyClick={() => setAddMoneyOpen(true)}
                        onWithdrawClick={() => setWithdrawModalOpen(true)}
                        hasPendingWithdrawal={hasPendingWithdrawal}
                    />
                    
                    {/* Active Investments Section */}
                    <Box bg={cardBg} p={6} borderRadius="lg" shadow="md" mb={8}>
                        <Heading size="lg" mb={4} color="blue.400">Active Investments</Heading>
                        {activeTrades === null ? (
                            <Center p={5}><Spinner /></Center>
                        ) : activeTrades.length === 0 ? (
                            <Text>You have no active investments.</Text>
                        ) : (
                            activeTrades.map((item) => (
                                <ActiveTradeItem 
                                    key={item.trade_id} 
                                    item={item}
                                    onSell={handleSell}
                                    isSelling={isSelling === item.trade_id}
                                />
                            ))
                        )}
                    </Box>

                    {/* Trade History Section */}
                    <Box bg={cardBg} p={6} borderRadius="lg" shadow="md">
                        <Heading size="lg" mb={4} color="green.400">Trade History (Sold)</Heading>
                        {soldTrades === null ? (
                            <Center p={5}><Spinner /></Center>
                        ) : soldTrades.length === 0 ? (
                            <Text>You have not sold any items yet.</Text>
                        ) : (
                            soldTrades.map((item) => (
                                <SoldTradeItem key={item.trade_id} item={item} />
                            ))
                        )}
                    </Box>
                </Box>
            </Flex>

            {/* Modals for new features from incoming change */}
            <AddMoneyModal 
                isOpen={isAddMoneyOpen}
                onClose={() => setAddMoneyOpen(false)}
                url={url}
                onTransactionComplete={fetchWalletBalance}
            />
            <WithdrawModal
                isOpen={isWithdrawModalOpen}
                onClose={() => setWithdrawModalOpen(false)}
                url={url}
                currentBalance={digitalMoney || 0}
                onWithdrawalSuccess={() => {
                    fetchWalletBalance(); // Refetch wallet to update status
                    setWithdrawModalOpen(false);// Close the modal
                }}
            />
        </>
    );
};

export default WalletPage;