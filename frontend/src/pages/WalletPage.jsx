// import React, { useEffect, useState, useCallback } from 'react';

// import { useSearchParams } from 'react-router-dom';
// import {
//     Box,
//     Heading,
//     Text,
//     Flex,
//     Spinner,
//     Container,
//     Alert,
//     AlertIcon,
//     useToast,
//     Center,
//     Button,
//     VStack,
//     useColorModeValue,
//     Grid,
//     GridItem,
//     Tooltip,
//     IconButton,
//     useDisclosure,
//     Drawer,
//     DrawerOverlay,
//     DrawerContent,
//     DrawerBody,
// } from '@chakra-ui/react';
// import { HamburgerIcon } from '@chakra-ui/icons';
// import { useAuth } from '../AppContext';

// import VendorNavBar from '../components/layout/VendorNavBar';
// import ActiveTradeItem from '../components/wallet/ActiveTradeItem';
// import SoldTradeItem from '../components/wallet/SoldTradeItem';
// import AddMoneyModal from '../components/wallet/AddMoneyModal';
// import WithdrawModal from '../components/wallet/WithdrawModal';
// import WalletHeader from '../components/wallet/WalletHeader';
// import ReferralPage from '../components/wallet/ReferralPage';
// import InitialClaimsPage from '../components/wallet/InitialClaimsPage';
// import { LineChart, History, Users, Gift, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
// import TransactionList from '../components/wallet/TransactionList';

// const DESKTOP_SIDEBAR_WIDTH = '200px';
// const MOBILE_SIDEBAR_WIDTH = '60px';


// const WalletPage = ({ url }) => {
//     // --- Styles and Hooks ---
//     const { token } = useAuth();
//     const toast = useToast();
//     const { isOpen, onOpen, onClose } = useDisclosure();
    
//     // ✅ --- NEW HOOK: To read URL parameters ---
//     const [searchParams] = useSearchParams();

//     // --- Styling (No Changes) ---
//     const mainBg = useColorModeValue('gray.50', '#181C27');
//     const sidebarBg = '#212734';
//     const sidebarBorder = 'gray.700';
//     const cardBg = useColorModeValue('white', 'gray.800');
//     const textColor = useColorModeValue('gray.800', 'whiteAlpha.900');
//     const inactiveBorderColor = useColorModeValue('gray.200', 'gray.700');

//     const tabColorSchemes = {
//         investments: {
//             defaultBg: useColorModeValue('blue.50', 'blue.900'),
//             activeBg: useColorModeValue('blue.500', 'blue.500'),
//             hoverBg: useColorModeValue('blue.100', 'blue.800'),
//             defaultColor: useColorModeValue('blue.700', 'blue.200'),
//             spinner: 'blue.400'
//         },
//         history: {
//             defaultBg: useColorModeValue('green.50', 'green.900'),
//             activeBg: useColorModeValue('green.500', 'green.500'),
//             hoverBg: useColorModeValue('green.100', 'green.800'),
//             defaultColor: useColorModeValue('green.700', 'green.200'),
//             spinner: 'green.400'
//         },
//         claims: {
//             defaultBg: useColorModeValue('purple.50', 'purple.900'),
//             activeBg: useColorModeValue('purple.500', 'purple.500'),
//             hoverBg: useColorModeValue('purple.100', 'purple.800'),
//             defaultColor: useColorModeValue('purple.700', 'purple.200')
//         },
//         earnings: {
//             defaultBg: useColorModeValue('orange.50', 'orange.900'),
//             activeBg: useColorModeValue('orange.500', 'orange.500'),
//             hoverBg: useColorModeValue('orange.100', 'orange.800'),
//             defaultColor: useColorModeValue('orange.700', 'orange.200')
//         },
//         deposits: {
//             defaultBg: useColorModeValue('red.50', 'red.900'),
//             activeBg: useColorModeValue('red.500', 'red.500'),
//             hoverBg: useColorModeValue('red.100', 'red.800'),
//             defaultColor: useColorModeValue('red.700', 'red.200'),
//             spinner: 'teal.400'
//         },
//         withdrawals: {
//             defaultBg: useColorModeValue('cyan.50', 'cyan.900'),
//             activeBg: useColorModeValue('cyan.500', 'cyan.500'),
//             hoverBg: useColorModeValue('cyan.100', 'cyan.800'),
//             defaultColor: useColorModeValue('cyan.700', 'cyan.200'),
//             spinner: 'cyan.400'
//         },
//     };
    
//     // --- State Management (No Changes Here) ---
    
//     const [activeView, setActiveView] = useState(searchParams.get('view') || 'investments');
    
//     const [activeTrades, setActiveTrades] = useState(null);
//     const [soldTrades, setSoldTrades] = useState(null);
//     const [digitalMoney, setDigitalMoney] = useState(null);
//     const [error, setError] = useState('');
//     const [hasPendingWithdrawal, setHasPendingWithdrawal] = useState(false);
//     const [isSelling, setIsSelling] = useState(null);
//     const [isAddMoneyOpen, setAddMoneyOpen] = useState(false);
//     const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);
//     const [depositHistory, setDepositHistory] = useState(null);
//     const [withdrawalHistory, setWithdrawalHistory] = useState(null);

//     // --- Data Fetching Callbacks & useEffect (No Changes Here) ---
//     const fetchWalletBalance = useCallback(async () => {
//         try {
//             const res = await fetch(`${url}/api/wallet`, { headers: { 'Authorization': `Bearer ${token}` } });
//             if (!res.ok) throw new Error('Could not load wallet data');
//             const data = await res.json();
//             setDigitalMoney(data.digital_money || 0);
//             setHasPendingWithdrawal(data.hasPendingWithdrawal || false);
//         } catch (err) {
//             toast({ title: 'Error', description: err.message, status: 'error', duration: 3000 });
//         }
//     }, [token, url, toast]);

//     const fetchActiveTrades = useCallback(async () => {
//         try {
//             const res = await fetch(`${url}/api/trading/active`, { headers: { 'Authorization': `Bearer ${token}` } });
//             if (!res.ok) throw new Error('Could not load active trades');
//             setActiveTrades(await res.json());
//         } catch (err) {
//             setError('Could not fetch active trades.');
//         }
//     }, [token, url]);

//     const fetchSoldTrades = useCallback(async () => {
//         try {
//             const res = await fetch(`${url}/api/trading/sold`, { headers: { 'Authorization': `Bearer ${token}` } });
//             if (!res.ok) throw new Error('Could not load trade history');
//             setSoldTrades(await res.json());
//         } catch (err) {
//             setError('Could not fetch trade history.');
//         }
//     }, [token, url]);
    
//     const fetchDepositHistory = useCallback(async () => {
//         setError('');
//         try {
//             const res = await fetch(`${url}/api/wallet/deposits`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             if (!res.ok) throw new Error('Could not load deposit history');
//             setDepositHistory(await res.json());
//         } catch (err) {
//             setError(err.message);
//         }
//     }, [token, url]);

//     const fetchWithdrawalHistory = useCallback(async () => {
//         setError('');
//         try {
//             const res = await fetch(`${url}/api/wallet/withdrawals`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             if (!res.ok) throw new Error('Could not load withdrawal history');
//             setWithdrawalHistory(await res.json());
//         } catch (err) {
//             setError(err.message);
//         }
//     }, [token, url]);

//     useEffect(() => {
//         if (!token) return;
//         fetchWalletBalance();
//         switch (activeView) {
//             case 'investments': fetchActiveTrades(); break;
//             case 'history': fetchSoldTrades(); break;
//             case 'deposits': fetchDepositHistory(); break;
//             case 'withdrawals': fetchWithdrawalHistory(); break;
//             default: break;
//         }
//     }, [token, activeView, fetchWalletBalance, fetchActiveTrades, fetchSoldTrades, fetchDepositHistory, fetchWithdrawalHistory]);

//     useEffect(() => {
//         // If the current view is not 'investments', we do nothing and stop here.
//         if (activeView !== 'investments') {
//             return;
//         }

//         // Set up the interval to call fetchActiveTrades every 60 seconds.
//         const pollingInterval = setInterval(() => {
//             console.log('Polling for active trade updates...'); // You can check your browser console to see this message every minute
//             fetchActiveTrades();
//         }, 60000); // 60,000 milliseconds = 1 minute

//         // This is the CRUCIAL cleanup function. React runs this when the user
//         // navigates to another tab or leaves the page. It stops the timer.
//         return () => {
//             clearInterval(pollingInterval);
//         };
//     }, [activeView, fetchActiveTrades]); // Dependencies: This effect re-runs if the activeView changes.



//     const handleSell = useCallback(async (tradeToSell) => {
//         setIsSelling(tradeToSell.trade_id);
//         try {
//             const response = await fetch(`${url}/api/trading/sell`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//                 body: JSON.stringify({ trade_id: tradeToSell.trade_id }),
//             });
//             const data = await response.json();
//             if (!response.ok) throw new Error(data.message || 'Failed to sell item.');
            
//             toast({ title: 'Success!', description: `Sold`, status: 'success', duration: 3000 });

//             fetchWalletBalance();
//             fetchActiveTrades();
//             fetchSoldTrades();
//         } catch (err) {
//             toast({ title: 'Sell Error', description: err.message, status: 'error', duration: 4000 });
//         } finally {
//             setIsSelling(null);
//         }
//     }, [token, url, toast, fetchWalletBalance, fetchActiveTrades, fetchSoldTrades]);

//     if (!token) return <Container centerContent py={20}><Alert status="warning"><AlertIcon />Please log in to view your wallet.</Alert></Container>;
    
//     // --- getTabButtonStyle & NavButton (No Changes Here) ---
//     const getTabButtonStyle = (viewName, scheme) => {
//         const isActive = activeView === viewName;
//         return {
//             bg: isActive ? scheme.activeBg : scheme.defaultBg,
//             color: isActive ? 'white' : scheme.defaultColor,
//             fontWeight: isActive ? 'bold' : 'medium',
//             borderRadius: "lg",
//             w: '100%',
//             h: '100%',
//             py: 3,
//             px: { base: 2, md: 4 },
//             border: '1px solid',
//             borderColor: isActive ? scheme.activeBg : inactiveBorderColor,
//             _hover: { 
//                 bg: isActive ? scheme.activeBg : scheme.hoverBg,
//             }
//         };
//     };

//     const NavButton = ({ view, scheme, icon, label }) => (
//         <GridItem>
//             <Tooltip label={label} placement="bottom" hasArrow>
//                 <Button {...getTabButtonStyle(view, scheme)} onClick={() => setActiveView(view)}>
//                     {icon}
//                     <Text as="span" display={{ base: 'none', md: 'inline' }} ml={2}>{label}</Text>
//                 </Button>
//             </Tooltip>
//         </GridItem>
//     );

//     return (
//         <>
//             {/* ✅ --- NEW LAYOUT WRAPPER --- */}
//             <Flex minH="100vh" bg={mainBg}>
//                 {/* --- Desktop Sidebar (Fixed) --- */}
//                 <Box as="nav" pos="fixed" top="0" left="0" zIndex="sticky" h="full" w={DESKTOP_SIDEBAR_WIDTH} bg={sidebarBg} borderRight="1px" borderColor={sidebarBorder} display={{ base: 'none', md: 'block' }}>
//                     <VendorNavBar />
//                 </Box>

//                 {/* --- Mobile: Thin Sidebar with Hamburger Icon --- */}
//                 <Box as="nav" pos="fixed" top="0" left="0" zIndex="docked" h="full" w={MOBILE_SIDEBAR_WIDTH} bg={sidebarBg} borderRight="1px" borderColor={sidebarBorder} display={{ base: 'flex', md: 'none' }} flexDirection="column" alignItems="center" pt={4}>
//                     <IconButton aria-label="Open menu" icon={<HamburgerIcon w={6} h={6} />} onClick={onOpen} variant="ghost" color="gray.400" _hover={{ bg: 'rgba(66, 153, 225, 0.1)', color: 'white' }} />
//                 </Box>

//                 {/* --- Mobile: Drawer for Full Navigation --- */}
//                 <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
//                     <DrawerOverlay />
//                     <DrawerContent bg={sidebarBg} w={DESKTOP_SIDEBAR_WIDTH}>
//                         <DrawerBody p={0}>
//                             <VendorNavBar onLinkClick={onClose} />
//                         </DrawerBody>
//                     </DrawerContent>
//                 </Drawer>

//                 {/* ✅ --- NEW MAIN CONTENT AREA --- */}
//                 <Box flex="1" ml={{ base: MOBILE_SIDEBAR_WIDTH, md: DESKTOP_SIDEBAR_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
//                     <Container maxW="container.xl" p={0}>
//                         {error && <Alert status="error" mb={4}><AlertIcon />{error}</Alert>}

//                         <WalletHeader
//                             digitalMoney={digitalMoney}
//                             onAddMoneyClick={() => setAddMoneyOpen(true)}
//                             onWithdrawClick={() => setWithdrawModalOpen(true)}
//                             hasPendingWithdrawal={hasPendingWithdrawal}
//                         />
                        
//                         <Grid templateColumns={{ base: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }} gap={{ base: 2, md: 3 }} my={{ base: 6, md: 8 }}>
//                              <NavButton view="investments" scheme={tabColorSchemes.investments} icon={<LineChart size={20} />} label="Investments" />
//                              <NavButton view="history" scheme={tabColorSchemes.history} icon={<History size={20} />} label="History" />
//                              <NavButton view="claims" scheme={tabColorSchemes.claims} icon={<Gift size={20} />} label="Claims" />
//                              <NavButton view="earnings" scheme={tabColorSchemes.earnings} icon={<Users size={20} />} label="Earnings" />
//                              <NavButton view="deposits" scheme={tabColorSchemes.deposits} icon={<ArrowDownToLine size={20} />} label="Deposits" />
//                              <NavButton view="withdrawals" scheme={tabColorSchemes.withdrawals} icon={<ArrowUpFromLine size={20} />} label="Withdrawals" />
//                         </Grid>
                        
//                         {/* --- Tab Content (No Changes Here) --- */}
//                         {activeView === 'investments' && (
//                             <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="lg" shadow="md">
//                                 <Heading size="lg" mb={4} color={tabColorSchemes.investments.activeBg}>Active Investments</Heading>
//                                 {activeTrades === null ? <Center p={5}><Spinner color={tabColorSchemes.investments.spinner} /></Center> :
//                                  activeTrades.length === 0 ? <Text>You have no active investments.</Text> :
//                                  <VStack spacing={4} align="stretch">
//                                     {activeTrades.map((item) => <ActiveTradeItem key={item.trade_id} item={item} onSell={handleSell} isSelling={isSelling === item.trade_id} />)}
//                                  </VStack>
//                                 }
//                             </Box>
//                         )}
//                         {activeView === 'history' && (
//                             <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="lg" shadow="md">
//                                 <Heading size="lg" mb={4} color={tabColorSchemes.history.activeBg}>Trade History (Sold)</Heading>
//                                 {soldTrades === null ? <Center p={5}><Spinner color={tabColorSchemes.history.spinner} /></Center> :
//                                  soldTrades.length === 0 ? <Text>You have not sold any items yet.</Text> :
//                                  <VStack spacing={4} align="stretch">
//                                     {soldTrades.map((item) => <SoldTradeItem key={item.trade_id} item={item} />)}
//                                  </VStack>
//                                 }
//                             </Box>
//                         )}
//                         {activeView === 'claims' && <InitialClaimsPage url={url} cardBg={cardBg} />}
//                         {activeView === 'earnings' && <ReferralPage url={url} cardBg={cardBg} />}
//                         {activeView === 'deposits' && (
//                             <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="lg" shadow="md">
//                                 <Heading size="lg" mb={8} color={tabColorSchemes.deposits.activeBg}>Deposit History</Heading>
//                                 {depositHistory === null ? <Center p={5}><Spinner color={tabColorSchemes.deposits.spinner} /></Center> :
//                                  depositHistory.length === 0 ? <Text>You have no deposit history.</Text> :
//                                  (
//                                      <>
//                                          <TransactionList title="Approved" type="deposit" transactions={depositHistory.filter(tx => tx.status === 'approved')} headingColor="green.400" />
//                                          <TransactionList title="Pending" type="deposit" transactions={depositHistory.filter(tx => tx.status === 'pending')} headingColor="yellow.400" />
//                                          <TransactionList title="Rejected" type="deposit" transactions={depositHistory.filter(tx => tx.status === 'rejected')} headingColor="red.400" />
//                                      </>
//                                  )
//                                 }
//                             </Box>
//                         )}
//                         {activeView === 'withdrawals' && (
//                             <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="lg" shadow="md">
//                                 <Heading size="lg" mb={8} color={tabColorSchemes.withdrawals.activeBg}>Withdrawal History</Heading>
//                                 {withdrawalHistory === null ? <Center p={5}><Spinner color={tabColorSchemes.withdrawals.spinner} /></Center> :
//                                  withdrawalHistory.length === 0 ? <Text>You have no withdrawal history.</Text> :
//                                  (
//                                      <>
//                                          <TransactionList title="Approved" type="withdrawal" transactions={withdrawalHistory.filter(tx => tx.status === 'approved')} headingColor="green.400" />
//                                          <TransactionList title="Pending" type="withdrawal" transactions={withdrawalHistory.filter(tx => tx.status === 'pending')} headingColor="yellow.400" />
//                                          <TransactionList title="Rejected" type="withdrawal" transactions={withdrawalHistory.filter(tx => tx.status === 'rejected')} headingColor="red.400" />
//                                      </>
//                                  )
//                                 }
//                             </Box>
//                         )}
//                     </Container>
//                 </Box>
//             </Flex>

//             {/* --- Modals (No Changes Here) --- */}
//             <AddMoneyModal isOpen={isAddMoneyOpen} onClose={() => setAddMoneyOpen(false)} url={url} onTransactionComplete={() => { fetchWalletBalance(); if(activeView === 'deposits') { fetchDepositHistory(); } }} />
//             <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setWithdrawModalOpen(false)} url={url} currentBalance={digitalMoney || 0} onWithdrawalSuccess={() => { fetchWalletBalance(); if(activeView === 'withdrawals') { fetchWithdrawalHistory(); } setWithdrawModalOpen(false); }} />
//         </>
//     );
// };

// export default WalletPage;




import React, { useEffect, useState, useCallback } from 'react';

import { useSearchParams } from 'react-router-dom';
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
  VStack,
  useColorModeValue,
  Grid,
  GridItem,
  Tooltip,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody,
} from '@chakra-ui/react';
import { useAuth } from '../AppContext';

import VendorNavBar from '../components/layout/VendorNavBar';
import ActiveTradeItem from '../components/wallet/ActiveTradeItem';
import SoldTradeItem from '../components/wallet/SoldTradeItem';
import AddMoneyModal from '../components/wallet/AddMoneyModal';
import WithdrawModal from '../components/wallet/WithdrawModal';
import WalletHeader from '../components/wallet/WalletHeader';
import ReferralPage from '../components/wallet/ReferralPage';
import InitialClaimsPage from '../components/wallet/InitialClaimsPage';
import BonusPopup from '../components/common/BonusPopup';
import SellOffersModal from '../components/common/SellOffersModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { LineChart, History, Users, Gift, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import TransactionList from '../components/wallet/TransactionList';

const DESKTOP_SIDEBAR_WIDTH = '200px';

const WalletPage = ({ url }) => {
  // --- Styles and Hooks ---
  const { token } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Read URL params
  const [searchParams] = useSearchParams();

  // --- Styling ---
  const mainBg = useColorModeValue('gray.50', '#181C27');
  const sidebarBg = '#212734';
  const sidebarBorder = 'gray.700';
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'whiteAlpha.900');
  const inactiveBorderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.700', 'gray.200');

  const tabColorSchemes = {
    investments: {
      defaultBg: useColorModeValue('blue.50', 'blue.900'),
      activeBg: useColorModeValue('blue.500', 'blue.500'),
      hoverBg: useColorModeValue('blue.100', 'blue.800'),
      defaultColor: useColorModeValue('blue.700', 'blue.200'),
      spinner: 'blue.400'
    },
    history: {
      defaultBg: useColorModeValue('green.50', 'green.900'),
      activeBg: useColorModeValue('green.500', 'green.500'),
      hoverBg: useColorModeValue('green.100', 'green.800'),
      defaultColor: useColorModeValue('green.700', 'green.200'),
      spinner: 'green.400'
    },
    claims: {
      defaultBg: useColorModeValue('purple.50', 'purple.900'),
      activeBg: useColorModeValue('purple.500', 'purple.500'),
      hoverBg: useColorModeValue('purple.100', 'purple.800'),
      defaultColor: useColorModeValue('purple.700', 'purple.200')
    },
    earnings: {
      defaultBg: useColorModeValue('orange.50', 'orange.900'),
      activeBg: useColorModeValue('orange.500', 'orange.500'),
      hoverBg: useColorModeValue('orange.100', 'orange.800'),
      defaultColor: useColorModeValue('orange.700', 'orange.200')
    },
    deposits: {
      defaultBg: useColorModeValue('red.50', 'red.900'),
      activeBg: useColorModeValue('red.500', 'red.500'),
      hoverBg: useColorModeValue('red.100', 'red.800'),
      defaultColor: useColorModeValue('red.700', 'red.200'),
      spinner: 'teal.400'
    },
    withdrawals: {
      defaultBg: useColorModeValue('cyan.50', 'cyan.900'),
      activeBg: useColorModeValue('cyan.500', 'cyan.500'),
      hoverBg: useColorModeValue('cyan.100', 'cyan.800'),
      defaultColor: useColorModeValue('cyan.700', 'cyan.200'),
      spinner: 'cyan.400'
    },
  };

  // --- State ---
  const [activeView, setActiveView] = useState(searchParams.get('view') || 'investments');
  const [activeTrades, setActiveTrades] = useState(null);
  const [soldTrades, setSoldTrades] = useState(null);
  const [digitalMoney, setDigitalMoney] = useState(null);
  const [error, setError] = useState('');
  const [hasPendingWithdrawal, setHasPendingWithdrawal] = useState(false);
  const [isSelling, setIsSelling] = useState(null);
  const [isAddMoneyOpen, setAddMoneyOpen] = useState(false);
  const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [depositHistory, setDepositHistory] = useState(null);
  const [withdrawalHistory, setWithdrawalHistory] = useState(null);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalProfitLoading, setTotalProfitLoading] = useState(false);
  const [isCancellingWithdrawal, setIsCancellingWithdrawal] = useState(false);
  
  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    transactionId: null,
    amount: 0
  });
  
  // Bonus popup state
  const [bonusPopup, setBonusPopup] = useState({
    isOpen: false,
    bonusAmount: 0,
    daysHeld: 0
  });
  
  // Sell offers modal state
  const [sellOffersModal, setSellOffersModal] = useState({
    isOpen: false,
    trade: null,
    currentPrice: 0,
    productName: '',
    stockCount: 0
  });

  // --- Data Fetching ---
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
      const data = await res.json();
      setSoldTrades(data);
    } catch (err) {
      setError('Could not fetch trade history.');
    }
  }, [token, url]);

  const fetchDepositHistory = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(`${url}/api/wallet/deposits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Could not load deposit history');
      setDepositHistory(await res.json());
    } catch (err) {
      setError(err.message);
    }
  }, [token, url]);

  const fetchWithdrawalHistory = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(`${url}/api/wallet/withdrawals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Could not load withdrawal history');
      setWithdrawalHistory(await res.json());
    } catch (err) {
      setError(err.message);
    }
  }, [token, url]);

  const handleCancelWithdrawal = useCallback((transactionId) => {
    // Find the transaction to get the amount for display
    const transaction = withdrawalHistory?.find(tx => tx.trans_id === transactionId);
    const amount = transaction?.amount || 0;
    
    setConfirmationModal({
      isOpen: true,
      transactionId,
      amount
    });
  }, [withdrawalHistory]);

  const confirmCancelWithdrawal = useCallback(async () => {
    const { transactionId } = confirmationModal;
    
    setIsCancellingWithdrawal(true);
    try {
      const response = await fetch(`${url}/api/wallet/cancel-withdrawal`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transactionId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast({
        title: 'Withdrawal Cancelled',
        description: 'Your withdrawal request has been cancelled successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Refresh withdrawal history and wallet balance
      fetchWithdrawalHistory();
      fetchWalletBalance();

      // Close confirmation modal
      setConfirmationModal({ isOpen: false, transactionId: null, amount: 0 });

    } catch (error) {
      console.error('Error cancelling withdrawal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel withdrawal request',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCancellingWithdrawal(false);
    }
  }, [confirmationModal, url, token, toast, fetchWithdrawalHistory, fetchWalletBalance]);

  const fetchTotalProfit = useCallback(async () => {
    setTotalProfitLoading(true);
    try {
      const res = await fetch(`${url}/api/trading/total-profit`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Could not load total profit');
      const data = await res.json();
      setTotalProfit(data.totalProfit || 0);
    } catch (err) {
      console.error('Error fetching total profit:', err);
      setTotalProfit(0);
    } finally {
      setTotalProfitLoading(false);
    }
  }, [token, url]);

  useEffect(() => {
    if (!token) return;
    fetchWalletBalance();
    switch (activeView) {
      case 'investments': fetchActiveTrades(); break;
      case 'history': 
        fetchSoldTrades(); 
        fetchTotalProfit();
        break;
      case 'deposits': fetchDepositHistory(); break;
      case 'withdrawals': fetchWithdrawalHistory(); break;
      default: break;
    }
  }, [token, activeView, fetchWalletBalance, fetchActiveTrades, fetchSoldTrades, fetchDepositHistory, fetchWithdrawalHistory, fetchTotalProfit]);

  // Fetch total profit when soldTrades changes
  useEffect(() => {
    if (soldTrades && soldTrades.length > 0) {
      fetchTotalProfit();
    }
  }, [soldTrades, fetchTotalProfit]);

  useEffect(() => {
    if (activeView !== 'investments') return;
    const pollingInterval = setInterval(() => {
      fetchActiveTrades();
    }, 60000);
    return () => clearInterval(pollingInterval);
  }, [activeView, fetchActiveTrades]);



  const handleSell = useCallback(async (tradeToSell) => {
    // Show offers modal first
    setSellOffersModal({
      isOpen: true,
      trade: tradeToSell,
      currentPrice: parseFloat(tradeToSell.current_selling_price || tradeToSell.purchase_price),
      currentPrice2: parseFloat(tradeToSell.current_selling_price_2 || tradeToSell.current_selling_price || tradeToSell.purchase_price),
      currentPrice3: parseFloat(tradeToSell.current_selling_price_3 || tradeToSell.current_selling_price || tradeToSell.purchase_price),
      productName: tradeToSell.paper_type,
      stockCount: tradeToSell.no_of_stock_bought
    });
  }, []);

  const handleAcceptOffer = useCallback(async (selectedPrice, stockCount) => {
    const tradeToSell = sellOffersModal.trade;
    if (!tradeToSell) return;

    setIsSelling(tradeToSell.trade_id);
    try {
      const response = await fetch(`${url}/api/trading/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          trade_id: tradeToSell.trade_id,
          selling_price: selectedPrice
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to sell item.');
      
      // Show bonus popup if there's a bonus
      if (data.has_bonus && data.bonus_amount > 0) {
        setBonusPopup({
          isOpen: true,
          bonusAmount: data.bonus_amount,
          daysHeld: data.days_held
        });
      } else {
        toast({ title: 'Success!', description: `Sold`, status: 'success', duration: 3000 });
      }
      
      fetchWalletBalance();
      fetchActiveTrades();
      fetchSoldTrades();
      fetchTotalProfit();
    } catch (err) {
      toast({ title: 'Sell Error', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setIsSelling(null);
    }
  }, [sellOffersModal.trade, token, url, toast, fetchWalletBalance, fetchActiveTrades, fetchSoldTrades, fetchTotalProfit]);

  if (!token) {
    return (
      <Container centerContent py={20}>
        <Alert status="warning"><AlertIcon />Please log in to view your wallet.</Alert>
      </Container>
    );
  }

  // --- Tab Button styling ---
  const getTabButtonStyle = (viewName, scheme) => {
    const isActive = activeView === viewName;
    return {
      bg: isActive ? scheme.activeBg : scheme.defaultBg,
      color: isActive ? 'white' : scheme.defaultColor,
      fontWeight: isActive ? 'bold' : 'medium',
      borderRadius: 'lg',
      w: '100%',
      h: '100%',
      py: 3,
      px: { base: 2, md: 4 },
      border: '1px solid',
      borderColor: isActive ? scheme.activeBg : inactiveBorderColor,
      _hover: { bg: isActive ? scheme.activeBg : scheme.hoverBg },
    };
  };

  const NavButton = ({ view, scheme, icon, label }) => (
    <GridItem>
      <Tooltip label={label} placement="bottom" hasArrow>
        <Button {...getTabButtonStyle(view, scheme)} onClick={() => setActiveView(view)}>
          {icon}
          <Text as="span" display={{ base: 'none', md: 'inline' }} ml={2}>{label}</Text>
        </Button>
      </Tooltip>
    </GridItem>
  );

  return (
    <>
      <Flex minH="100vh" bg={mainBg}>
        {/* Sidebar (desktop only) */}
        <Box
          as="nav"
          pos="fixed"
          top="0"
          left="0"
          zIndex="sticky"
          h="full"
          w={DESKTOP_SIDEBAR_WIDTH}
          bg={sidebarBg}
          borderRight="1px"
          borderColor={sidebarBorder}
          display={{ base: 'none', md: 'block' }}
        >
          <VendorNavBar />
        </Box>

        {/* Drawer (mobile nav) — opened by hamburger in WalletHeader */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent bg={sidebarBg} w={DESKTOP_SIDEBAR_WIDTH}>
            <DrawerBody p={0}>
              <VendorNavBar onLinkClick={onClose} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Main content — no left margin on mobile */}
        <Box
          flex="1"
          ml={{ base: 0, md: DESKTOP_SIDEBAR_WIDTH }}
          p={{ base: 4, sm: 6, md: 8 }}
        >
          <Container maxW="container.xl" p={0}>
            {error && <Alert status="error" mb={4}><AlertIcon />{error}</Alert>}

            {/* Header now contains the mobile hamburger; pass onOpen */}
            <WalletHeader
              digitalMoney={digitalMoney}
              onAddMoneyClick={() => setAddMoneyOpen(true)}
              onWithdrawClick={() => setWithdrawModalOpen(true)}
              hasPendingWithdrawal={hasPendingWithdrawal}
              onOpenNav={onOpen}   // <-- opens Drawer from the header hamburger
            />

            <Grid templateColumns={{ base: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }} gap={{ base: 2, md: 3 }} my={{ base: 6, md: 8 }}>
              <NavButton view="investments" scheme={tabColorSchemes.investments} icon={<LineChart size={20} />} label="Investments" />
              <NavButton view="history" scheme={tabColorSchemes.history} icon={<History size={20} />} label="History" />
              <NavButton view="claims" scheme={tabColorSchemes.claims} icon={<Gift size={20} />} label="Claims" />
              <NavButton view="earnings" scheme={tabColorSchemes.earnings} icon={<Users size={20} />} label="Earnings" />
              <NavButton view="deposits" scheme={tabColorSchemes.deposits} icon={<ArrowDownToLine size={20} />} label="Deposits" />
              <NavButton view="withdrawals" scheme={tabColorSchemes.withdrawals} icon={<ArrowUpFromLine size={20} />} label="Withdrawals" />
            </Grid>

            {/* Tabs */}
            {activeView === 'investments' && (
              <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="lg" shadow="md">
                <Heading size="lg" mb={4} color={tabColorSchemes.investments.activeBg}>Active Investments</Heading>
                {activeTrades === null ? (
                  <Center p={5}><Spinner color={tabColorSchemes.investments.spinner} /></Center>
                ) : activeTrades.length === 0 ? (
                  <Text>You have no active investments.</Text>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {activeTrades.map((item) => (
                      <ActiveTradeItem
                        key={item.trade_id}
                        item={item}
                        onSell={handleSell}
                        isSelling={isSelling === item.trade_id}
                        onRefresh={fetchActiveTrades}
                      />
                    ))}
                  </VStack>
                )}
              </Box>
            )}

            {activeView === 'history' && (
              <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="lg" shadow="md">
                <Heading size="lg" mb={4} color={tabColorSchemes.history.activeBg}>Trade History (Sold)</Heading>
                {soldTrades === null ? (
                  <Center p={5}><Spinner color={tabColorSchemes.history.spinner} /></Center>
                ) : soldTrades.length === 0 ? (
                  <Text>You have not sold any items yet.</Text>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {soldTrades.map((item) => (
                      <SoldTradeItem 
                        key={item.trade_id} 
                        item={item} 
                      />
                    ))}
                    
                                         {/* Total Profit Summary */}
                     {soldTrades.length > 0 && (
                       <Box
                         p={4}
                         borderWidth="2px"
                         borderColor={totalProfit >= 0 ? 'green.300' : 'red.300'}
                         borderRadius="lg"
                         bg={totalProfit >= 0 ? 'green.50' : 'red.50'}
                         textAlign="center"
                       >
                         <Text fontSize="lg" fontWeight="bold" color={totalProfit >= 0 ? 'green.700' : 'red.700'}>
                           Total Profit from All Sold Trades
                         </Text>
                         {totalProfitLoading ? (
                           <Center p={4}>
                             <Spinner size="lg" color={totalProfit >= 0 ? 'green.500' : 'red.500'} />
                           </Center>
                         ) : (
                           <Text fontSize="2xl" fontWeight="bold" color={totalProfit >= 0 ? 'green.600' : 'red.600'}>
                             ₹{totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                           </Text>
                         )}
                         <Text fontSize="sm" color="gray.600">
                           Based on {soldTrades.length} sold trade{ soldTrades.length !== 1 ? 's' : '' }
                         </Text>
                       </Box>
                     )}
                  </VStack>
                )}
              </Box>
            )}

            {activeView === 'claims' && <InitialClaimsPage url={url} cardBg={cardBg} />}
            {activeView === 'earnings' && <ReferralPage url={url} cardBg={cardBg} />}

            {activeView === 'deposits' && (
              <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="lg" shadow="md">
                <Heading size="lg" mb={8} color={tabColorSchemes.deposits.activeBg}>Deposit History</Heading>
                {depositHistory === null ? (
                  <Center p={5}><Spinner color={tabColorSchemes.deposits.spinner} /></Center>
                ) : depositHistory.length === 0 ? (
                  <Text>You have no deposit history.</Text>
                ) : (
                  <>
                    <TransactionList title="Approved" type="deposit" transactions={depositHistory.filter(tx => tx.status === 'approved')} headingColor="green.400" />
                    <TransactionList title="Pending" type="deposit" transactions={depositHistory.filter(tx => tx.status === 'pending')} headingColor="yellow.400" />
                    <TransactionList title="Rejected" type="deposit" transactions={depositHistory.filter(tx => tx.status === 'rejected')} headingColor="red.400" />
                  </>
                )}
              </Box>
            )}

            {activeView === 'withdrawals' && (
              <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="lg" shadow="md">
                <Heading size="lg" mb={8} color={tabColorSchemes.withdrawals.activeBg}>Withdrawal History</Heading>
                {withdrawalHistory === null ? (
                  <Center p={5}><Spinner color={tabColorSchemes.withdrawals.spinner} /></Center>
                ) : withdrawalHistory.length === 0 ? (
                  <Text>You have no withdrawal history.</Text>
                ) : (
                  <>
                    <TransactionList title="Approved" type="withdrawal" transactions={withdrawalHistory.filter(tx => tx.status === 'approved')} headingColor="green.400" />
                    <TransactionList 
                      title="Pending" 
                      type="withdrawal" 
                      transactions={withdrawalHistory.filter(tx => tx.status === 'pending')} 
                      headingColor="yellow.400" 
                      onCancel={handleCancelWithdrawal}
                      isLoading={isCancellingWithdrawal}
                    />
                    <TransactionList title="Rejected" type="withdrawal" transactions={withdrawalHistory.filter(tx => tx.status === 'rejected')} headingColor="red.400" />
                    <TransactionList title="Cancelled" type="withdrawal" transactions={withdrawalHistory.filter(tx => tx.status === 'cancelled')} headingColor="gray.400" />
                  </>
                )}
              </Box>
            )}
          </Container>
        </Box>
      </Flex>

      {/* Modals */}
      <AddMoneyModal
        isOpen={isAddMoneyOpen}
        onClose={() => setAddMoneyOpen(false)}
        url={url}
        onTransactionComplete={() => {
          // Always refresh wallet balance
          fetchWalletBalance();
          // Always refresh deposit history (regardless of active tab)
          fetchDepositHistory();
          // Optionally switch to deposits tab to show the request
          setActiveView('deposits');
        }}
      />
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        url={url}
        currentBalance={digitalMoney || 0}
        onWithdrawalSuccess={() => {
          // Always refresh wallet balance
          fetchWalletBalance();
          // Always refresh withdrawal history (regardless of active tab)
          fetchWithdrawalHistory();
          // Optionally switch to withdrawals tab to show the request
          setActiveView('withdrawals');
          setWithdrawModalOpen(false);
        }}
      />
      
      {/* Sell Offers Modal */}
      <SellOffersModal
        isOpen={sellOffersModal.isOpen}
        onClose={() => setSellOffersModal({ isOpen: false, trade: null, currentPrice: 0, currentPrice2: 0, currentPrice3: 0, productName: '', stockCount: 0 })}
        onAcceptOffer={handleAcceptOffer}
        currentPrice={sellOffersModal.currentPrice}
        currentPrice2={sellOffersModal.currentPrice2}
        currentPrice3={sellOffersModal.currentPrice3}
        productName={sellOffersModal.productName}
        stockCount={sellOffersModal.stockCount}
      />
      
      {/* Bonus Popup */}
      <BonusPopup
        isOpen={bonusPopup.isOpen}
        onClose={() => setBonusPopup({ isOpen: false, bonusAmount: 0, daysHeld: 0 })}
        bonusAmount={bonusPopup.bonusAmount}
        daysHeld={bonusPopup.daysHeld}
      />

      {/* Withdrawal Cancellation Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, transactionId: null, amount: 0 })}
        onConfirm={confirmCancelWithdrawal}
        title="Cancel Withdrawal Request"
        message={`Are you sure you want to cancel your withdrawal request of ₹${confirmationModal.amount?.toLocaleString('en-IN')}? This action cannot be undone.`}
        confirmText="Yes, Cancel Request"
        cancelText="Keep Request"
        confirmColorScheme="red"
        isLoading={isCancellingWithdrawal}
        loadingText="Cancelling..."
        alertType="warning"
      />
    </>
  );
};


export default WalletPage;