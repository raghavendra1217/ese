// // import React, { useState, useEffect, useCallback } from 'react';
// // import { Box, Heading, Text, VStack, Flex, Spinner, Center, useToast, Button, HStack, Tag } from '@chakra-ui/react';
// // import { useAuth } from '../../AppContext';

// // const ReferralPage = ({ url, cardBg, pageBg }) => {
// //     const [referralData, setReferralData] = useState(null);
// //     const [isLoading, setIsLoading] = useState(true);
// //     const [isClaiming, setIsClaiming] = useState(null);
// //     const [activeView, setActiveView] = useState('claims'); // 'claims' or 'active'
// //     const { token } = useAuth();
// //     const toast = useToast();

// //     const fetchData = useCallback(async () => {
// //         setIsLoading(true);
// //         try {
// //             const response = await fetch(`${url}/api/vendor/referred-list`, {
// //                 headers: { 'Authorization': `Bearer ${token}` }
// //             });
// //             if (!response.ok) {
// //                 const errorData = await response.json().catch(() => ({ message: 'Failed to fetch referral data' }));
// //                 throw new Error(errorData.message);
// //             }
// //             const data = await response.json();
// //             setReferralData(data);
// //         } catch (error) {
// //             toast({ title: 'Error', description: error.message, status: 'error', duration: 4000 });
// //             setReferralData({ allReferredUsers: [], claimedReferralIds: [] });
// //         } finally {
// //             setIsLoading(false);
// //         }
// //     }, [token, url, toast]);

// //     useEffect(() => {
// //         if (token) {
// //             fetchData();
// //         }
// //     }, [token, fetchData]);

// //     const handleClaim = async (referralId) => {
// //         setIsClaiming(referralId);
// //         try {
// //             const response = await fetch(`${url}/api/vendor/claim-referral`, {
// //                 method: 'POST',
// //                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
// //                 body: JSON.stringify({ referralId })
// //             });
// //             const data = await response.json();
// //             if (!response.ok) throw new Error(data.message || 'Failed to claim referral.');
// //             toast({ title: 'Success', description: data.message, status: 'success', duration: 3000 });
// //             await fetchData(); // Refresh data to update UI
// //         } catch (error) {
// //             toast({ title: 'Claim Error', description: error.message, status: 'error', duration: 4000 });
// //         } finally {
// //             setIsClaiming(null);
// //         }
// //     };

// //     if (isLoading) {
// //         return <Center p={10}><Spinner color="purple.400" size="xl" /></Center>;
// //     }

// //     // --- NEW FILTERING LOGIC ---
// //     // Create a Set of claimed IDs for efficient lookups
// //     const claimedIdsSet = new Set(referralData?.claimedReferralIds || []);
    
// //     // Get all users who have NOT been claimed
// //     const unclaimedUsers = referralData?.allReferredUsers.filter(u => !claimedIdsSet.has(u.id)) || [];

// //     // Split unclaimed users into two groups: those ready to claim and those pending approval
// //     const readyToClaim = unclaimedUsers.filter(u => u.is_approved === true);
// //     const pendingApproval = unclaimedUsers.filter(u => u.is_approved !== true);

// //     // Get the list of users who have already been claimed for the history view
// //     const claimedHistory = referralData?.allReferredUsers.filter(u => claimedIdsSet.has(u.id)) || [];
// //     // --- END OF NEW FILTERING LOGIC ---

// //     return (
// //         <Box bg={cardBg} p={6} borderRadius="lg" shadow="md">
// //             <Flex justifyContent="space-between" alignItems="center" mb={6}>
// //                 <Heading size="lg" color="purple.300">Referrals</Heading>
// //                 <HStack>
// //                     <Button size="sm" isActive={activeView === 'claims'} onClick={() => setActiveView('claims')}>Initial Claims</Button>
// //                     <Button size="sm" isActive={activeView === 'active'} onClick={() => setActiveView('active')}>Active Referrals</Button>
// //                 </HStack>
// //             </Flex>

// //             {activeView === 'claims' && (
// //                 <VStack spacing={8} align="stretch">
// //                     {/* --- Section 1: Approved & Ready to Claim --- */}
// //                     <Box>
// //                         <Heading size="md" mb={4} color="gray.300">Approved & Ready to Claim</Heading>
// //                         {readyToClaim.length > 0 ? (
// //                             <VStack spacing={3} align="stretch">
// //                                 {readyToClaim.map((user) => (
// //                                     <Flex key={user.id} bg={pageBg} p={3} borderRadius="md" justifyContent="space-between" alignItems="center">
// //                                         <VStack align="start" spacing={0}><Text fontWeight="semibold">{user.name}</Text><Text color="gray.500" fontSize="sm">ID: {user.id}</Text></VStack>
// //                                         <Button colorScheme="green" isLoading={isClaiming === user.id} onClick={() => handleClaim(user.id)}>Claim</Button>
// //                                     </Flex>
// //                                 ))}
// //                             </VStack>
// //                         ) : <Text color="gray.500">No approved referrals are available to claim.</Text>}
// //                     </Box>

// //                     {/* --- NEW Section 2: Referrals under Pending Approval --- */}
// //                     <Box>
// //                         <Heading size="md" mb={4} color="gray.300">Referrals under Pending Approval</Heading>
// //                         {pendingApproval.length > 0 ? (
// //                             <VStack spacing={3} align="stretch">
// //                                 {pendingApproval.map((user) => (
// //                                     <Flex key={user.id} bg={pageBg} p={3} borderRadius="md" justifyContent="space-between" alignItems="center">
// //                                         <Text fontWeight="semibold">{user.name}</Text>
// //                                         <Tag colorScheme="yellow">Pending</Tag>
// //                                     </Flex>
// //                                 ))}
// //                             </VStack>
// //                         ) : <Text color="gray.500">No referrals are currently pending approval.</Text>}
// //                     </Box>

// //                     {/* --- Section 3: Claimed History --- */}
// //                     <Box>
// //                         <Heading size="md" mb={4} color="gray.300">Claimed History</Heading>
// //                         {claimedHistory.length > 0 ? (
// //                             <VStack spacing={3} align="stretch">
// //                                 {claimedHistory.map((user) => (
// //                                     <Flex key={user.id} bg={pageBg} p={3} borderRadius="md" justifyContent="space-between" alignItems="center">
// //                                         <Text fontWeight="semibold">{user.name}</Text>
// //                                         <Tag colorScheme="purple">Claimed</Tag>
// //                                     </Flex>
// //                                 ))}
// //                             </VStack>
// //                         ) : <Text color="gray.500">You have not claimed any referrals yet.</Text>}
// //                     </Box>
// //                 </VStack>
// //             )}

// //             {activeView === 'active' && (
// //                  <Box>
// //                     <Heading size="md" mb={4} color="gray.300">All Referred Users Overview</Heading>
// //                     {referralData?.allReferredUsers.length > 0 ? (
// //                         <VStack spacing={3} align="stretch">
// //                             {referralData.allReferredUsers.map((user) => (
// //                                 <Flex key={user.id} bg={pageBg} p={3} borderRadius="md" justifyContent="space-between" alignItems="center">
// //                                     <Text fontWeight="semibold">{user.name}</Text>
// //                                     <Tag colorScheme={user.is_approved ? 'green' : 'yellow'}>{user.is_approved ? 'Approved' : 'Pending'}</Tag>
// //                                 </Flex>
// //                             ))}
// //                         </VStack>
// //                     ) : <Text color="gray.500">You haven't referred anyone yet.</Text>}
// //                  </Box>
// //             )}
// //         </Box>
// //     );
// // };

// // export default ReferralPage;

// import React, { useState, useEffect, useCallback } from 'react';
// import { Box, Heading, Text, VStack, Flex, Spinner, Center, useToast, Button, HStack, Tag } from '@chakra-ui/react';
// import { useAuth } from '../../AppContext';

// // --- NEW: Helper function to format numbers as Indian Rupees ---
// const formatCurrency = (amount) => {
//     // Gracefully handle null or undefined values
//     if (amount === null || amount === undefined) {
//         amount = 0;
//     }
//     // Use the built-in Intl API for robust currency formatting
//     return new Intl.NumberFormat('en-IN', {
//         style: 'currency',
//         currency: 'INR',
//         minimumFractionDigits: 2,
//     }).format(amount);
// };


// const ReferralPage = ({ url, cardBg, pageBg }) => {
//     // All state and fetching logic is correct and remains unchanged.
//     const [referralData, setReferralData] = useState(null);
//     const [isLoading, setIsLoading] = useState(true);
//     const [isClaiming, setIsClaiming] = useState(null);
//     const [activeView, setActiveView] = useState('claims');
//     const { token } = useAuth();
//     const toast = useToast();

//     const fetchData = useCallback(async () => {
//         setIsLoading(true);
//         try {
//             const response = await fetch(`${url}/api/vendor/referred-list`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             if (!response.ok) {
//                 const errorData = await response.json().catch(() => ({ message: 'Failed to fetch referral data' }));
//                 throw new Error(errorData.message);
//             }
//             const data = await response.json();
//             setReferralData(data);
//         } catch (error) {
//             toast({ title: 'Error', description: error.message, status: 'error', duration: 4000 });
//             setReferralData({ allReferredUsers: [], claimedReferralIds: [] });
//         } finally {
//             setIsLoading(false);
//         }
//     }, [token, url, toast]);

//     useEffect(() => {
//         if (token) fetchData();
//     }, [token, fetchData]);

//     const handleClaim = async (referralId) => {
//         setIsClaiming(referralId);
//         try {
//             const response = await fetch(`${url}/api/vendor/claim-referral`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//                 body: JSON.stringify({ referralId })
//             });
//             const data = await response.json();
//             if (!response.ok) throw new Error(data.message || 'Failed to claim referral.');
//             toast({ title: 'Success', description: data.message, status: 'success', duration: 3000 });
//             await fetchData();
//         } catch (error) {
//             toast({ title: 'Claim Error', description: error.message, status: 'error', duration: 4000 });
//         } finally {
//             setIsClaiming(null);
//         }
//     };

//     if (isLoading) {
//         return <Center p={10}><Spinner color="purple.400" size="xl" /></Center>;
//     }

//     // Filtering logic remains correct and unchanged.
//     const claimedIdsSet = new Set(referralData?.claimedReferralIds || []);
//     const unclaimedUsers = referralData?.allReferredUsers.filter(u => !claimedIdsSet.has(u.id)) || [];
//     const readyToClaim = unclaimedUsers.filter(u => u.is_approved === true);
//     const pendingApproval = unclaimedUsers.filter(u => u.is_approved !== true);
//     const claimedHistory = referralData?.allReferredUsers.filter(u => claimedIdsSet.has(u.id)) || [];

//     return (
//         <Box bg={cardBg} p={6} borderRadius="lg" shadow="md">
//             <Flex justifyContent="space-between" alignItems="center" mb={6}>
//                 <Heading size="lg" color="purple.300">Referrals</Heading>
//                 <HStack>
//                     <Button size="sm" isActive={activeView === 'claims'} onClick={() => setActiveView('claims')}>Initial Claims</Button>
//                     <Button size="sm" isActive={activeView === 'active'} onClick={() => setActiveView('active')}>Active Referrals</Button>
//                 </HStack>
//             </Flex>

//             {activeView === 'claims' && (
//                 <VStack spacing={8} align="stretch">
//                     {/* This entire section for the 'claims' view is unchanged. */}
//                     <Box>
//                         <Heading size="md" mb={4} color="gray.300">Approved & Ready to Claim</Heading>
//                         {readyToClaim.length > 0 ? ( <VStack spacing={3} align="stretch">{readyToClaim.map((user) => ( <Flex key={user.id} bg={pageBg} p={3} borderRadius="md" justifyContent="space-between" alignItems="center"><VStack align="start" spacing={0}><Text fontWeight="semibold">{user.name}</Text><Text color="gray.500" fontSize="sm">ID: {user.id}</Text></VStack><Button colorScheme="green" isLoading={isClaiming === user.id} onClick={() => handleClaim(user.id)}>Claim</Button></Flex>))}</VStack>) : <Text color="gray.500">No approved referrals are available to claim.</Text>}
//                     </Box>
//                     <Box>
//                         <Heading size="md" mb={4} color="gray.300">Referrals under Pending Approval</Heading>
//                         {pendingApproval.length > 0 ? ( <VStack spacing={3} align="stretch">{pendingApproval.map((user) => ( <Flex key={user.id} bg={pageBg} p={3} borderRadius="md" justifyContent="space-between" alignItems="center"><Text fontWeight="semibold">{user.name}</Text><Tag colorScheme="yellow">Pending</Tag></Flex>))}</VStack>) : <Text color="gray.500">No referrals are currently pending approval.</Text>}
//                     </Box>
//                     <Box>
//                         <Heading size="md" mb={4} color="gray.300">Claimed History</Heading>
//                         {claimedHistory.length > 0 ? ( <VStack spacing={3} align="stretch">{claimedHistory.map((user) => ( <Flex key={user.id} bg={pageBg} p={3} borderRadius="md" justifyContent="space-between" alignItems="center"><Text fontWeight="semibold">{user.name}</Text><Tag colorScheme="purple">Claimed</Tag></Flex>))}</VStack>) : <Text color="gray.500">You have not claimed any referrals yet.</Text>}
//                     </Box>
//                 </VStack>
//             )}

//             {/* --- THIS IS THE UPDATED VIEW --- */}
//             {activeView === 'active' && (
//                  <Box>
//                     <Heading size="md" mb={2} color="gray.300">All Referred Users Overview</Heading>
//                     <Text fontSize="sm" color="gray.400" mb={4}>Sorted by total amount spent.</Text>

//                     {referralData?.allReferredUsers.length > 0 ? (
//                         <VStack spacing={3} align="stretch">
//                             {referralData.allReferredUsers.map((user) => (
//                                 <Flex key={user.id} bg={pageBg} p={3} borderRadius="md" justifyContent="space-between" alignItems="center">
//                                     <VStack align="start" spacing={0}>
//                                         <Text fontWeight="semibold">{user.name}</Text>
//                                         <Text fontSize="sm" color="green.300">
//                                             Total Spent: {formatCurrency(user.total_transaction)}
//                                         </Text>
//                                     </VStack>
//                                     <Tag colorScheme={user.is_approved ? 'green' : 'yellow'}>
//                                         {user.is_approved ? 'Approved' : 'Pending'}
//                                     </Tag>
//                                 </Flex>
//                             ))}
//                         </VStack>
//                     ) : (
//                         <Text color="gray.500">You haven't referred anyone yet.</Text>
//                     )}
//                  </Box>
//             )}
//         </Box>
//     );
// };

// export default ReferralPage;

import React, { useState, useEffect, useCallback } from 'react';
// Import Table components from Chakra UI
import { 
    Box, 
    Heading, 
    Text, 
    VStack, 
    Flex, 
    Spinner, 
    Center, 
    useToast, 
    Button, 
    HStack, 
    Tag,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td
} from '@chakra-ui/react';
import { useAuth } from '../../AppContext';

// Helper function to format numbers as Indian Rupees
const formatCurrency = (amount) => {
    // Gracefully handle null or undefined values
    if (amount === null || amount === undefined) {
        amount = 0;
    }
    // Use the built-in Intl API for robust currency formatting
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount);
};

/**
 * A self-contained component to display and manage user referrals.
 * It features two main views: 'Initial Claims' and 'Active Referrals'.
 * It fetches its own data and handles claim submissions.
 * @param {object} props - The component props.
 * @param {string} props.url - The base URL for the API.
 * @param {string} props.cardBg - The background color for the main container card.
 * @param {string} props.pageBg - The background color for the page (used for contrast).
 */
const ReferralPage = ({ url, cardBg, pageBg }) => {
    // All state, fetching, and claim handling logic is correct and remains unchanged.
    const [referralData, setReferralData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isClaiming, setIsClaiming] = useState(null);
    const [activeView, setActiveView] = useState('claims');
    const { token } = useAuth();
    const toast = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${url}/api/vendor/referred-list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to fetch referral data' }));
                throw new Error(errorData.message);
            }
            const data = await response.json();
            setReferralData(data);
        } catch (error) {
            toast({ title: 'Error', description: error.message, status: 'error', duration: 4000 });
            setReferralData({ allReferredUsers: [], claimedReferralIds: [] });
        } finally {
            setIsLoading(false);
        }
    }, [token, url, toast]);

    useEffect(() => {
        if (token) fetchData();
    }, [token, fetchData]);

    const handleClaim = async (referralId) => {
        setIsClaiming(referralId);
        try {
            const response = await fetch(`${url}/api/vendor/claim-referral`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ referralId })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to claim referral.');
            toast({ title: 'Success', description: data.message, status: 'success', duration: 3000 });
            await fetchData();
        } catch (error) {
            toast({ title: 'Claim Error', description: error.message, status: 'error', duration: 4000 });
        } finally {
            setIsClaiming(null);
        }
    };

    if (isLoading) {
        return <Center p={10}><Spinner color="purple.400" size="xl" /></Center>;
    }

    // Filtering logic for all views
    const claimedIdsSet = new Set(referralData?.claimedReferralIds || []);
    const unclaimedUsers = referralData?.allReferredUsers.filter(u => !claimedIdsSet.has(u.id)) || [];
    const readyToClaim = unclaimedUsers.filter(u => u.is_approved === true);
    const pendingApproval = unclaimedUsers.filter(u => u.is_approved !== true);
    const claimedHistory = referralData?.allReferredUsers.filter(u => claimedIdsSet.has(u.id)) || [];
    // NEW: Filter for the Active Referrals table (only approved users)
    const activeApprovedReferrals = referralData?.allReferredUsers.filter(u => u.is_approved === true) || [];

    return (
        <Box bg={cardBg} p={6} borderRadius="lg" shadow="md">
            <Flex justifyContent="space-between" alignItems="center" mb={6}>
                <Heading size="lg" color="purple.300">Referrals</Heading>
                <HStack>
                    <Button size="sm" isActive={activeView === 'claims'} onClick={() => setActiveView('claims')}>Initial Claims</Button>
                    <Button size="sm" isActive={activeView === 'active'} onClick={() => setActiveView('active')}>Active Referrals</Button>
                </HStack>
            </Flex>

            {activeView === 'claims' && (
                <VStack spacing={8} align="stretch">
                    {/* --- Section 1: Approved & Ready to Claim --- */}
                    <Box>
                        <Heading size="md" mb={4} color="gray.300">Approved & Ready to Claim</Heading>
                        {readyToClaim.length > 0 ? (
                            <VStack spacing={3} align="stretch">
                                {readyToClaim.map((user) => (
                                    <Flex key={user.id} bg={pageBg} p={3} borderRadius="md" justifyContent="space-between" alignItems="center">
                                        <VStack align="start" spacing={0}><Text fontWeight="semibold">{user.name}</Text><Text color="gray.500" fontSize="sm">ID: {user.id}</Text></VStack>
                                        <Button colorScheme="green" isLoading={isClaiming === user.id} onClick={() => handleClaim(user.id)}>Claim</Button>
                                    </Flex>
                                ))}
                            </VStack>
                        ) : <Text color="gray.500">No approved referrals are available to claim.</Text>}
                    </Box>

                    {/* --- Section 2: Referrals under Pending Approval --- */}
                    <Box>
                        <Heading size="md" mb={4} color="gray.300">Referrals under Pending Approval</Heading>
                        {pendingApproval.length > 0 ? (
                            <VStack spacing={3} align="stretch">
                                {pendingApproval.map((user) => (
                                    <Flex key={user.id} bg={pageBg} p={3} borderRadius="md" justifyContent="space-between" alignItems="center">
                                        <Text fontWeight="semibold">{user.name}</Text>
                                        <Tag colorScheme="yellow">Pending</Tag>
                                    </Flex>
                                ))}
                            </VStack>
                        ) : <Text color="gray.500">No referrals are currently pending approval.</Text>}
                    </Box>
                                        {/* --- Section 3: Claimed History --- */}
                    <Box>
                        <Heading size="md" mb={4} color="gray.300">Claimed History</Heading>
                        {claimedHistory.length > 0 ? (
                            <VStack spacing={3} align="stretch">
                                {claimedHistory.map((user) => (
                                    <Flex key={user.id} bg={pageBg} p={3} borderRadius="md" justifyContent="space-between" alignItems="center">
                                        <Text fontWeight="semibold">{user.name}</Text>
                                        <Tag colorScheme="purple">Claimed</Tag>
                                    </Flex>
                                ))}
                            </VStack>
                        ) : <Text color="gray.500">You have not claimed any referrals yet.</Text>}
                    </Box>
                </VStack>
            )}

            {/* --- VIEW 2: Active Referrals Table --- */}
            {activeView === 'active' && (
                 <Box>
                    <Heading size="md" mb={4} color="gray.300">Active Referrals</Heading>
                    
                    {activeApprovedReferrals.length > 0 ? (
                        <Table variant="simple" colorScheme="whiteAlpha">
                            <Thead>
                                <Tr>
                                    <Th color="gray.400">Name</Th>
                                    <Th isNumeric color="gray.400">Total Spent</Th>
                                    <Th isNumeric color="gray.400">Current %</Th>
                                    <Th isNumeric color="gray.400">Total Claims</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {activeApprovedReferrals.map((user) => (
                                    <Tr key={user.id}>
                                        <Td fontWeight="medium">{user.name}</Td>
                                        <Td isNumeric color="green.300">{formatCurrency(user.total_transaction)}</Td>
                                        {/* Placeholder columns for your future data */}
                                        <Td isNumeric>N/A</Td>
                                        <Td isNumeric>N/A</Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    ) : (
                        <Text color="gray.500">You have no active (approved) referrals.</Text>
                    )}
                 </Box>
            )}
        </Box>
    );
};

export default ReferralPage;