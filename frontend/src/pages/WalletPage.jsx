import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, Flex, Image, Button, useColorModeValue, Spinner, Container, Alert, AlertIcon, useToast, Stat, StatNumber, StatHelpText, StatArrow } from '@chakra-ui/react';
import VendorNavBar from '../components/layout/VendorNavBar';
import { useAuth } from '../AppContext';

const WalletPage = ({ url = '' }) => {
    // --- Styles and Hooks ---
    const bg = useColorModeValue('gray.50', 'gray.900');
    const cardBg = useColorModeValue('white', 'gray.700');
    const activeItemBg = useColorModeValue('gray.50', 'gray.800');
    const soldItemBg = useColorModeValue('green.50', 'rgba(46, 139, 87, 0.15)'); // A slightly more subtle green
    const soldItemBorder = useColorModeValue('green.200', 'green.400');
    const { token } = useAuth();
    const toast = useToast();

    // --- State Management (Rejected trades removed) ---
    const [activeTrades, setActiveTrades] = useState([]);
    const [soldTrades, setSoldTrades] = useState([]);
    const [digitalMoney, setDigitalMoney] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSelling, setIsSelling] = useState(null);

    // --- Data Fetching (Reverted to fetch only relevant data) ---
    useEffect(() => {
        const fetchWalletData = async () => {
            if (!token) {
                setError('Not authenticated.');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                // Fetch only active, sold, and wallet balance
                const [activeRes, soldRes, walletRes] = await Promise.all([
                    fetch(`${url}/api/trading/active`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${url}/api/trading/sold`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${url}/api/wallet`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (!activeRes.ok || !soldRes.ok || !walletRes.ok) {
                    throw new Error('Failed to fetch portfolio data.');
                }
                
                setActiveTrades(await activeRes.json());
                setSoldTrades(await soldRes.json());
                setDigitalMoney((await walletRes.json()).digital_money || 0);

            } catch (err) {
                setError(err.message);
                toast({ title: 'Error', description: err.message, status: 'error', duration: 4000 });
            } finally {
                setLoading(false);
            }
        };
        fetchWalletData();
    }, [token, url, toast]);

    // --- Sell Handler (No changes needed) ---
    const handleSell = async (tradeToSell) => {
        setIsSelling(tradeToSell.trade_id);
        try {
            const response = await fetch(`${url}/api/trading/sell`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ trade_id: tradeToSell.trade_id }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to sell item.');
            toast({ title: 'Success!', description: data.message, status: 'success', duration: 3000 });
            setDigitalMoney(data.digital_money);
            const soldItem = { ...tradeToSell, sale_price: data.sold_at };
            setSoldTrades(prevSold => [soldItem, ...prevSold]);
            setActiveTrades(prevActive => prevActive.filter(item => item.trade_id !== tradeToSell.trade_id));
        } catch (err) {
            toast({ title: 'Sell Error', description: err.message, status: 'error', duration: 4000 });
        } finally {
            setIsSelling(null);
        }
    };
    
    // --- Render Logic ---
    if (loading) return <Container centerContent py={20}><Spinner size="xl" /></Container>;
    if (error) return <Container centerContent py={20}><Alert status="error"><AlertIcon />{error}</Alert></Container>;

    return (
        <Flex minH="100vh" bg={bg}>
            <VendorNavBar />
            <Box flex="1" ml="80px" p={8}>
                <Flex justify="space-between" align="center" mb={8}>
                    <Heading> My Wallet</Heading>
                    <Box bg="teal.500" color="white" px={4} py={2} borderRadius="md" shadow="md">
                        <Text fontSize="xl" fontWeight="bold">
                            Digital Money: ₹{parseFloat(digitalMoney).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Text>
                    </Box>
                </Flex>
                
                {/* SECTION 1: ACTIVE INVESTMENTS */}
                <Box bg={cardBg} p={6} borderRadius="lg" shadow="md" mb={8}>
                    <Heading size="lg" mb={4} color="blue.400">Active Investments</Heading>
                    {activeTrades.length === 0 ? <Text>You have no active investments.</Text> : (
                        activeTrades.map((item) => (
                            <Flex key={item.trade_id} align="center" mb={4} p={4} borderWidth="1px" borderRadius="md" bg={activeItemBg}>
                                <Image src={`${url}${item.product_image_url}`} alt={item.paper_type} boxSize="80px" objectFit="cover" borderRadius="md" mr={4} />
                                <Box flex="1">
                                    <Text fontWeight="bold" fontSize="lg">{item.paper_type}</Text>
                                    <Text fontSize="sm">Stocks: {item.no_of_stock_bought}</Text>
                                    <Text fontSize="sm">Purchase Price/Stock: ₹{parseFloat(item.purchase_price).toLocaleString('en-IN')}</Text>
                                    <Text fontSize="sm" color="gray.500">Purchased On: {new Date(item.purchase_date).toLocaleDateString('en-GB')}</Text>
                                </Box>
                                <Box textAlign="right" mr={4}>
                                    <Text fontSize="sm">Current Price/Stock</Text>
                                    <Text fontWeight="bold" color="blue.400">₹{parseFloat(item.current_selling_price).toLocaleString('en-IN')}</Text>
                                </Box>
                                <Button colorScheme="teal" onClick={() => handleSell(item)} isLoading={isSelling === item.trade_id} loadingText="Selling">
                                    Sell Now
                                </Button>
                            </Flex>
                        ))
                    )}
                </Box>

                {/* SECTION 2: TRADE HISTORY */}
                <Box bg={cardBg} p={6} borderRadius="lg" shadow="md">
                    <Heading size="lg" mb={4} color="green.400">Trade History (Sold)</Heading>
                    {soldTrades.length === 0 ? <Text>You have not sold any items yet.</Text> : (
                        soldTrades.map((item) => {
                            const profitPerStock = parseFloat(item.sale_price) - parseFloat(item.purchase_price);
                            return (
                                <Flex key={item.trade_id} align="center" mb={4} p={4} borderWidth="1px" borderRadius="md" bg={soldItemBg} borderColor={soldItemBorder}>
                                    <Image src={`${url}${item.product_image_url}`} alt={item.paper_type} boxSize="80px" objectFit="cover" borderRadius="md" mr={4} />
                                    <Box flex="1">
                                        <Text fontWeight="bold" fontSize="lg">{item.paper_type}</Text>
                                        <Text fontSize="sm">Stocks: {item.no_of_stock_bought}</Text>
                                        <Text fontSize="sm">Purchase Price: ₹{parseFloat(item.purchase_price).toLocaleString('en-IN')}</Text>
                                        <Text fontSize="sm" fontWeight="bold">Sale Price: ₹{parseFloat(item.sale_price).toLocaleString('en-IN')}</Text>
                                    </Box>
                                    <Stat textAlign="right">
                                        <StatNumber color={profitPerStock >= 0 ? 'green.500' : 'red.500'}>₹{profitPerStock.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</StatNumber>
                                        <StatHelpText><StatArrow type={profitPerStock >= 0 ? 'increase' : 'decrease'} /> Profit/Loss per Stock</StatHelpText>
                                    </Stat>
                                </Flex>
                            )
                        })
                    )}
                </Box>
                
                {/* The Rejected Trades section has been correctly removed from this page. */}
            </Box>
        </Flex>
    );
};

export default WalletPage;