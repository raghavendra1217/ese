
import React from 'react';
import { formatISTDate } from '../../utils/dateUtils';
import { Box, SimpleGrid, Stat, StatLabel, StatNumber, Text, VStack, HStack, useColorModeValue, Tag, Avatar ,Button } from '@chakra-ui/react';
import useApi from '../../hooks/useApi';
import WidgetCard from './WidgetCard';
// ✅ Import our two new, dedicated chart components
import EarningsChartWidget from './EarningsChartWidget';
import SourcesChartWidget from './SourcesChartWidget';

import { Link as RouterLink } from 'react-router-dom';

// Helper to format currency
const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value);

// --- KPI Widget (Stays here because it's simple) ---
const KpiWidget = ({ url }) => {
    const { data, isLoading, error } = useApi(url, '/api/vendor/dashboard/kpis');

    return (
        <WidgetCard title="Financial Snapshot" isLoading={isLoading} error={error}>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
                <Stat>
                    <StatLabel>Wallet Balance</StatLabel>
                    <StatNumber color="green.500">{formatCurrency(data?.walletBalance || 0)}</StatNumber>
                </Stat>
                <Stat>
                    <StatLabel>Active Investment Value</StatLabel>
                    <StatNumber>{formatCurrency(data?.activeInvestmentValue || 0)}</StatNumber>
                </Stat>
                <Stat>
                    <StatLabel>Unclaimed Commissions</StatLabel>
                    <StatNumber color="blue.500">{formatCurrency(data?.unclaimedCommissions || 0)}</StatNumber>
                </Stat>
                <Stat>
                    <StatLabel>Lifetime Earnings</StatLabel>
                    <StatNumber>{formatCurrency(data?.lifetimeEarnings || 0)}</StatNumber>
                </Stat>
            </SimpleGrid>
        </WidgetCard>
    );
};

// --- Activity and Referrals Widgets (Stay here for now) ---
// const ActivityWidget = ({ url }) => {
//     const { data, isLoading, error } = useApi(url, '/api/vendor/dashboard/recent-activity');
//     const hoverBg = useColorModeValue('gray.100', 'gray.700');
    
//     const getTagColor = (type) => {
//         switch (type) {
//             case 'sale':
//             case 'deposit':
//             case 'commission_claim':
//             case 'referral_bonus':
//                 return 'green';
//             case 'purchase':
//             case 'withdrawal':
//                 return 'red';
//             default:
//                 return 'gray';
//         }
//     };

//     return (
//         <WidgetCard title="Recent Activity" isLoading={isLoading} error={error} height="400px">
//             <VStack spacing={4} align="stretch">
//                 {data?.length > 0 ? data.map(tx => (
//                     <HStack key={tx.trans_id} justify="space-between" p={2} borderRadius="md" _hover={{ bg: hoverBg }}>
//                         <Box>
//                             <Tag colorScheme={getTagColor(tx.transaction_type)} size="sm" mr={2}>
//                                 {tx.transaction_type.replace(/_/g, ' ').toUpperCase()}
//                             </Tag>
//                             <Text as="span" fontSize="sm">{new Date(tx.created_at).toLocaleDateString()}</Text>
//                         </Box>
//                         <Text fontWeight="bold" color={tx.amount > 0 ? 'green.500' : 'red.500'}>
//                             {formatCurrency(tx.amount)}
//                         </Text>
//                     </HStack>
//                 )) : <Text>No recent activity.</Text>}
//             </VStack>
//         </WidgetCard>
//     );
// };



const ActivityWidget = ({ url }) => {
  const { data, isLoading, error } = useApi(url, '/api/vendor/dashboard/recent-activity');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  const getTagColor = (type) => {
    switch (type) {
      case 'sale':
      case 'deposit':
      case 'commission_claim':
      case 'referral_bonus':
        return 'green';
      case 'purchase':
      case 'withdrawal':
        return 'red';
      default:
        return 'gray';
    }
  };

  const recent5 = Array.isArray(data) ? data.slice(0, 5) : [];

  return (
    <WidgetCard
      title="Recent Activity"
      isLoading={isLoading}
      error={error}
      height="400px"
      // Optional: add an action button slot in your WidgetCard if it supports it
    >
      <VStack spacing={4} align="stretch">
        {recent5.length > 0 ? (
          recent5.map((tx) => (
            <HStack
              key={tx.trans_id}
              justify="space-between"
              p={2}
              borderRadius="md"
              _hover={{ bg: hoverBg }}
            >
              <Box>
                <Tag colorScheme={getTagColor(tx.transaction_type)} size="sm" mr={2}>
                  {tx.transaction_type.replace(/_/g, ' ').toUpperCase()}
                </Tag>
                <Text as="span" fontSize="sm">
                  {formatISTDate(tx.created_at, true, true)}
                </Text>
              </Box>
              <Text
                fontWeight="bold"
                color={tx.amount > 0 ? 'green.500' : 'red.500'}
              >
                {formatCurrency(tx.amount)}
              </Text>
            </HStack>
          ))
        ) : (
          <Text>No recent activity.</Text>
        )}

        {/* View more button */}
        <Box pt={2}>
          <Button
            as={RouterLink}
            to="/vendor/activity"
            size="sm"
            colorScheme="blue"
            variant="outline"
          >
            View more
          </Button>
        </Box>
      </VStack>
    </WidgetCard>
  );
};


// const MyReferralsWidget = ({ url }) => {

//     const { data, isLoading, error } = useApi(url, '/api/vendor/dashboard/my-referrals');
//     const hoverBg = useColorModeValue('gray.100', 'gray.700');

//     return (
//         <WidgetCard title="My Referrals" isLoading={isLoading} error={error} height="400px">
//             <VStack spacing={4} align="stretch">
//                 {data?.length > 0 ? data.map(ref => (
//                     <HStack key={ref.name} justify="space-between" p={2} borderRadius="md" _hover={{ bg: hoverBg }}>
//                         <HStack>
//                             <Avatar name={ref.name} size="sm" />
//                             <Text fontWeight="medium">{ref.name}</Text>
//                         </HStack>
//                         <VStack align="flex-end" spacing={0}>
//                             <Text fontWeight="bold" color="green.500">{formatCurrency(ref.totalSpent)}</Text>
//                             <Text fontSize="xs" color="gray.500">{ref.purchaseCount} purchases</Text>
//                         </VStack>
//                     </HStack>
//                 )) : (
//                     <Text color="gray.500">You have not referred any users yet.</Text>
//                 )}
//             </VStack>
//         </WidgetCard>
//     );
// };

// --- The Main Assembler Component ---
// ✅ This component is now much cleaner. It just arranges the imported widgets.


// const MyReferralsWidget = ({ url }) => {
//   const { data, isLoading, error } = useApi(url, '/api/vendor/dashboard/my-referrals');
//   const hoverBg = useColorModeValue('gray.100', 'gray.700');

//   const list = Array.isArray(data) ? data : [];
//   const top5 = list.slice(0, 5);
//   const count = list.length;

//   return (
//     <WidgetCard
//       title={`My Referrals (${count})`}
//       isLoading={isLoading}
//       error={error}
//       height="400px"
//     >
//       {/* ↓ Reduce vertical space between rows */}
//       <VStack spacing={{ base: 2, md: 2 }} align="stretch">
//         {top5.length > 0 ? (
//           top5.map((ref, idx) => (
//             <HStack
//               key={`${ref.name}-${idx}`}
//               justify="space-between"
//               // ↓ Slightly smaller row padding
//               py={1}
//               px={2}
//               borderRadius="md"
//               _hover={{ bg: hoverBg }}
//             >
//               {/* ↓ Slightly tighter spacing between avatar and name */}
//               <HStack spacing={3}>
//                 <Avatar name={ref.name} size="sm" />
//                 <Text fontWeight="medium">{ref.name}</Text>
//               </HStack>
//               <VStack align="flex-end" spacing={0}>
//                 <Text fontWeight="bold" color="green.500">
//                   {formatCurrency(ref.totalSpent || 0)}
//                 </Text>
//                 <Text fontSize="xs" color="gray.500">
//                   {ref.purchaseCount || 0} purchases
//                 </Text>
//               </VStack>
//             </HStack>
//           ))
//         ) : (
//           <Text color="gray.500">You have not referred any users yet.</Text>
//         )}

//         {/* ↓ Slightly less space above the button */}
//         <Box pt={1}>
//           <Button
//             as={RouterLink}
//             to="/vendor/referrals"
//             size="sm"
//             colorScheme="blue"
//             variant="outline"
//           >
//             View more
//           </Button>
//         </Box>
//       </VStack>
//     </WidgetCard>
//   );
// };


const DashboardOverview = ({ url }) => {
    return (
        <Box>
            <KpiWidget url={url} />
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 4, md: 6 }} mt={{ base: 4, md: 6 }}>
                <EarningsChartWidget url={url} />
                <SourcesChartWidget url={url} />
                <ActivityWidget url={url} />
                {/* <MyReferralsWidget url={url} /> */}
            </SimpleGrid>
        </Box>
    );
};

export default DashboardOverview;