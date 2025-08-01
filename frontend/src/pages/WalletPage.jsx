import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    Heading,
    Text,
    Flex,
    Spinner,
    Container,
    Alert,
    AlertIcon,
    useToast,
    Center,
    Button,
    HStack,
    VStack
} from '@chakra-ui/react';
import VendorNavBar from '../components/layout/VendorNavBar';
import { useAuth } from '../AppContext';

// Import the modular components
import ActiveTradeItem from '../components/wallet/ActiveTradeItem';
import SoldTradeItem from '../components/wallet/SoldTradeItem';
import AddMoneyModal from '../components/wallet/AddMoneyModal';
import WithdrawModal from '../components/wallet/WithdrawModal';
// --- Import the self-contained ReferralPage component ---
import ReferralPage from '../components/wallet/ReferralPage';

// This is a helper function to format numbers with commas
const formatMoney = (amount) => {
    if (amount === null || amount === undefined) return '0.00';
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};


const WalletPage = ({ url }) => {
    // --- Styles and Hooks ---
    const pageBg = 'gray.900';
    const cardBg = 'gray.800';
    const { token } = useAuth();
    const toast = useToast();

    // --- State Management (Simplified: No referral state needed here) ---
    const [activeTrades, setActiveTrades] = useState(null);
    const [soldTrades, setSoldTrades] = useState(null);
    const [digitalMoney, setDigitalMoney] = useState(null);
    const [error, setError] = useState('');
    const [hasPendingWithdrawal, setHasPendingWithdrawal] = useState(false);
    const [activeView, setActiveView] = useState('investments');

    // UI Interaction states
    const [isSelling, setIsSelling] = useState(null);
    const [isAddMoneyOpen, setAddMoneyOpen] = useState(false);
    const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);

    // --- Data Fetching Callbacks (Simplified) ---
    const fetchWalletBalance = useCallback(async () => {
        try {
            const res = await fetch(`${url}/api/wallet`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Could not load wallet data');
            const data = await res.json();
            setDigitalMoney(data.digital_money || 0);
            setHasPendingWithdrawal(data.hasPendingWithdrawal || false);
        } catch (err) {
            toast({ title: 'Error', description: err.message, status: 'error', duration: 3000 });
        }
    }, [token, url, toast]);

    const fetchActiveTrades = useCallback(async () => {
        if (activeTrades === null) {
            try {
                const res = await fetch(`${url}/api/trading/active`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!res.ok) throw new Error('Could not load active trades');
                setActiveTrades(await res.json());
            } catch (err) {
                setError('Could not fetch active trades.');
            }
        }
    }, [token, url, activeTrades]);

    const fetchSoldTrades = useCallback(async () => {
        if (soldTrades === null) {
            try {
                const res = await fetch(`${url}/api/trading/sold`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!res.ok) throw new Error('Could not load trade history');
                setSoldTrades(await res.json());
            } catch (err) {
                setError('Could not fetch trade history.');
            }
        }
    }, [token, url, soldTrades]);

    // --- useEffect (Simplified) ---
    useEffect(() => {
        if (token) {
            fetchWalletBalance();
            if (activeView === 'investments') fetchActiveTrades();
            else if (activeView === 'history') fetchSoldTrades();
            // No logic needed for 'referrals' here anymore
        }
    }, [token, activeView, fetchActiveTrades, fetchSoldTrades, fetchWalletBalance]);

    
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
            
            const soldItem = data.sold_trade;
            setDigitalMoney(data.digital_money);
            setActiveTrades(prev => prev.filter(t => t.trade_id !== soldItem.trade_id));
            setSoldTrades(prev => prev ? [soldItem, ...prev] : [soldItem]);

            toast({ title: 'Success!', description: `Sold ${soldItem.paper_type}.`, status: 'success', duration: 3000 });

        } catch (err) {
            toast({ title: 'Sell Error', description: err.message, status: 'error', duration: 4000 });
        } finally {
            setIsSelling(null);
        }
    }, [token, url, toast]);


    if (!token) return <Container centerContent py={20}><Alert status="warning"><AlertIcon />Please log in to view your wallet.</Alert></Container>;
    
    const getTabButtonStyle = (viewName) => ({
        bg: activeView === viewName ? 'gray.600' : 'gray.800',
        color: 'white',
        fontWeight: activeView === viewName ? 'semibold' : 'normal',
        borderRadius: "lg",
        px: 5,
        _hover: { bg: 'gray.500' }
    });

    return (
        <>
            <Flex minH="100vh" bg={pageBg}>
                <VendorNavBar />
                <Box flex="1" ml={{ base: '0', md: '80px' }} p={8} color="white">
                    {error && <Alert status="error" mb={4}><AlertIcon />{error}</Alert>}

                    {/* --- HEADER SECTION --- */}
                    <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={4}>
                        <VStack align="flex-start" spacing={0}>
                            <Heading as="h1" size="2xl" fontWeight="bold">My Wallet</Heading>
                            <Text fontSize="3xl" fontWeight="medium">
                                {digitalMoney === null ? <Spinner size="sm"/> : formatMoney(digitalMoney)}
                            </Text>
                        </VStack>
                        <HStack spacing={4}>
                            <Button bg="green.400" color="black" onClick={() => setAddMoneyOpen(true)} _hover={{ bg: 'green.500' }}>Add Money</Button>
                            <Button variant="outline" borderColor="yellow.400" color="yellow.400" isDisabled={hasPendingWithdrawal} onClick={() => setWithdrawModalOpen(true)} _hover={{ bg: 'yellow.400', color: 'gray.900' }}>
                                {hasPendingWithdrawal ? 'Pending...' : 'Withdraw'}
                            </Button>
                        </HStack>
                    </Flex>

                    {/* --- TAB NAVIGATION SECTION --- */}
                    <Flex justifyContent="flex-end" my={8}>
                        <HStack spacing={4}>
                            <Button {...getTabButtonStyle('investments')} onClick={() => setActiveView('investments')}>Active Investments</Button>
                            <Button {...getTabButtonStyle('history')} onClick={() => setActiveView('history')}>Trade History</Button>
                            <Button {...getTabButtonStyle('referrals')} onClick={() => setActiveView('referrals')}>Referrals</Button>
                        </HStack>
                    </Flex>
                    
                    {/* --- CONDITIONAL CONTENT AREA --- */}
                    {activeView === 'investments' && (
                        <Box bg={cardBg} p={6} borderRadius="lg" shadow="md">
                            <Heading size="lg" mb={4} color="blue.400">Active Investments</Heading>
                            {activeTrades === null ? (
                                <Center p={5}><Spinner color="blue.400"/></Center>
                            ) : activeTrades.length === 0 ? (
                                <Text color="gray.400">You have no active investments.</Text>
                            ) : (
                                <VStack spacing={4} align="stretch">
                                {activeTrades.map((item) => ( <ActiveTradeItem key={item.trade_id} item={item} onSell={handleSell} isSelling={isSelling === item.trade_id} /> ))}
                                </VStack>
                            )}
                        </Box>
                    )}

                    {activeView === 'history' && (
                        <Box bg={cardBg} p={6} borderRadius="lg" shadow="md">
                            <Heading size="lg" mb={4} color="green.400">Trade History (Sold)</Heading>
                            {soldTrades === null ? (
                                <Center p={5}><Spinner color="green.400"/></Center>
                            ) : soldTrades.length === 0 ? (
                                <Text color="gray.400">You have not sold any items yet.</Text>
                            ) : (
                                <VStack spacing={4} align="stretch">
                                    {soldTrades.map((item) => ( <SoldTradeItem key={item.trade_id} item={item} /> ))}
                                </VStack>
                            )}
                        </Box>
                    )}
                    
                    {/* --- CORRECTED: Just render the component and pass the necessary props --- */}
                    {activeView === 'referrals' && (
                        <ReferralPage 
                            url={url} // Pass the API URL down to the child
                            cardBg={cardBg}
                            pageBg={pageBg}
                        />
                    )}
                </Box>
            </Flex>

            {/* --- Modals --- */}
            <AddMoneyModal isOpen={isAddMoneyOpen} onClose={() => setAddMoneyOpen(false)} url={url} onTransactionComplete={fetchWalletBalance} />
            <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setWithdrawModalOpen(false)} url={url} currentBalance={digitalMoney || 0} onWithdrawalSuccess={() => { fetchWalletBalance(); setWithdrawModalOpen(false); }} />
        </>
    );
};

export default WalletPage;