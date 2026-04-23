// // // // // // import React from 'react';
// // // // // // import { Box, Flex, Grid, Heading, useColorModeValue } from '@chakra-ui/react';
// // // // // // import StatCard from '../shared/cards/StatCard'; // Assuming path to your reusable card is correct
// // // // // // import VendorProductStatCard from './cards/VendorProductStatCard';
// // // // // // import { BsPersonCheckFill, BsCart3, BsCheckCircle } from 'react-icons/bs';

// // // // // // const VendorTradingSection = ({ stats }) => {
// // // // // //     const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');

// // // // // //     return (
// // // // // //         <Box as="section" mb={8} pl={{ base: 3, md: 3, lg: 3 }}>
// // // // // //             <Flex justify="space-between" align="center" mb={4}>
// // // // // //                 <Heading as="h2" size="lg" color={secondaryTextColor}>ESE Paper Trading</Heading>
// // // // // //                 {/* The "Add Member" button has been moved to the VendorDashboardHeader component */}
// // // // // //             </Flex>
// // // // // //             <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
// // // // // //                 <VendorProductStatCard value={stats.availableProducts} />
// // // // // //                 <StatCard
// // // // // //                     label="My Approved Purchases"
// // // // // //                     value={stats.purchasedProducts.toLocaleString()}
// // // // // //                     icon={<BsPersonCheckFill size={24} />}
// // // // // //                     iconBgColor="sky.500"
// // // // // //                     to="/vendor/purchase-history" // Links to the general history page
// // // // // //                 />
// // // // // //                 {/* --- UPDATED CARD --- */}
// // // // // //                 {/* This card now links to the detailed spending history page */}
// // // // // //                 <StatCard 
// // // // // //                     label="Total Spent" 
// // // // // //                     value={stats.purchasedValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} 
// // // // // //                     icon={<BsCart3 size={24} />} 
// // // // // //                     iconBgColor="green.500" 
// // // // // //                     to="/vendor/spending-history"
// // // // // //                 />
// // // // // //                 <StatCard 
// // // // // //                     label="Purchases Pending Approval" 
// // // // // //                     value={stats.pendingTradeApprovals.toLocaleString()} 
// // // // // //                     icon={<BsCheckCircle size={24} />} 
// // // // // //                     iconBgColor="purple.500" 
// // // // // //                 />
// // // // // //             </Grid>
// // // // // //         </Box>
// // // // // //     );
// // // // // // };

// // // // // // export default VendorTradingSection;


// // // // // import React from 'react';
// // // // // import {
// // // // //   Box,
// // // // //   Flex,
// // // // //   Grid,
// // // // //   Heading,
// // // // //   useColorModeValue,
// // // // //   IconButton,
// // // // //   useDisclosure,
// // // // //   useToast
// // // // // } from '@chakra-ui/react';
// // // // // import { useNavigate } from 'react-router-dom';
// // // // // import { FaWallet, FaUserPlus } from 'react-icons/fa';
// // // // // import {
// // // // //   BsPersonCheckFill,
// // // // //   BsCart3,
// // // // //   BsCheckCircle
// // // // // } from 'react-icons/bs';

// // // // // import StatCard from '../shared/cards/StatCard';
// // // // // import VendorProductStatCard from './cards/VendorProductStatCard';
// // // // // import AddMemberModal from '../shared/AddMemberModal'; // <- Extract this from your header file if needed
// // // // // import { useAuth } from '../../AppContext';

// // // // // import VendorDashboardHeader from './VendorDashboardHeader';

// // // // // const VendorTradingSection = ({ stats }) => {
// // // // //   const { user, logout } = useAuth();
// // // // //   const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');
// // // // //   const navigate = useNavigate();
// // // // //   const toast = useToast();
// // // // //   const { isOpen, onOpen, onClose } = useDisclosure();

// // // // //   const referralLink = user?.id
// // // // //     ? `https://esepapertrading.onrender.com/register?ref=${user.id}`
// // // // //     : '';

// // // // //   const handleRegisterAndLogout = () => {
// // // // //     logout();
// // // // //     window.location.href = referralLink;
// // // // //   };

// // // // //   return (
// // // // //     <Box as="section" mb={8} pl={{ base: 3, md: 3, lg: 3 }}>

// // // // // <Flex justify="space-between"    align="flex-start" alignItems="flex-start" mb={4}>
// // // // //   {/* Top Left: Heading */}
// // // // //   <Heading
// // // // //     as="h1"
// // // // //     fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
// // // // //     size={{ base: 'md', md: 'lg' }}
// // // // //     color={secondaryTextColor}
// // // // //     mt={{ base: 1, md: 2 }}
// // // // //   >
// // // // //     ESE Paper Trading
// // // // //   </Heading>

// // // // //   {/* Top Right: Icons */}
// // // // //  <Flex
// // // // //     position="absolute"
// // // // //     top={{ base: '8px', md: '12px' }}
// // // // //     right={{ base: '4px', md: '12px' }}
// // // // //     gap={{ base: 2, md: 4 }}
// // // // //   >
// // // // //     <IconButton
// // // // //       icon={<FaWallet size={24} />}
// // // // //       aria-label="Wallet"
// // // // //       size="lg"
// // // // //       variant="ghost"
// // // // //       onClick={() => navigate('/vendor/wallet')}
// // // // //     />
// // // // //     <IconButton
// // // // //       icon={<FaUserPlus size={24} />}
// // // // //       aria-label="Add Member"
// // // // //       size="lg"
// // // // //       variant="ghost"
// // // // //       onClick={onOpen}
// // // // //     />
// // // // //   </Flex>
// // // // // </Flex>


// // // // //     <VendorDashboardHeader/>

// // // // //       <Grid
// // // // //         templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
// // // // //         gap={6}
// // // // //       >
// // // // //         <VendorProductStatCard value={stats.availableProducts} />

// // // // //         <StatCard
// // // // //           label="My Approved Purchases"
// // // // //           value={stats.purchasedProducts.toLocaleString()}
// // // // //           icon={<BsPersonCheckFill size={24} />}
// // // // //           iconBgColor="sky.500"
// // // // //           to="/vendor/purchase-history"
// // // // //         />

// // // // //         <StatCard
// // // // //           label="Total Spent"
// // // // //           value={stats.purchasedValue.toLocaleString('en-IN', {
// // // // //             style: 'currency',
// // // // //             currency: 'INR'
// // // // //           })}
// // // // //           icon={<BsCart3 size={24} />}
// // // // //           iconBgColor="green.500"
// // // // //           to="/vendor/spending-history"
// // // // //         />

// // // // //         <StatCard
// // // // //           label="Purchases Pending Approval"
// // // // //           value={stats.pendingTradeApprovals.toLocaleString()}
// // // // //           icon={<BsCheckCircle size={24} />}
// // // // //           iconBgColor="purple.500"
// // // // //         />
// // // // //       </Grid>

// // // // //       {/* Modal for Add Member */}
// // // // //       <AddMemberModal
// // // // //         isOpen={isOpen}
// // // // //         onClose={onClose}
// // // // //         referralLink={referralLink}
// // // // //         onRegisterAndLogout={handleRegisterAndLogout}
// // // // //       />
// // // // //     </Box>
// // // // //   );
// // // // // };

// // // // // export default VendorTradingSection;



// // // // import React from 'react';
// // // // import { Box, Grid } from '@chakra-ui/react';
// // // // import {
// // // //   BsPersonCheckFill,
// // // //   BsCart3,
// // // //   BsCheckCircle
// // // // } from 'react-icons/bs';

// // // // import StatCard from '../shared/cards/StatCard';
// // // // import VendorProductStatCard from './cards/VendorProductStatCard';
// // // // import VendorDashboardHeader from './VendorDashboardHeader'; // We still import it to render it

// // // // const VendorTradingSection = ({ stats }) => {
// // // //   return (
// // // //     <Box as="section" mb={8} pl={{ base: 3, md: 3, lg: 3 }}>
// // // //       {/* 1. Render the new, complete header */}
// // // //       <VendorDashboardHeader />

// // // //       {/* 2. Render the grid of stats */}
// // // //       <Grid
// // // //         templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
// // // //         gap={6}
// // // //       >
// // // //         <VendorProductStatCard value={stats.availableProducts} />

// // // //         <StatCard
// // // //           label="My Approved Purchases"
// // // //           value={stats.purchasedProducts.toLocaleString()}
// // // //           icon={<BsPersonCheckFill size={24} />}
// // // //           iconBgColor="sky.500"
// // // //           to="/vendor/purchase-history"
// // // //         />

// // // //         <StatCard
// // // //           label="Total Spent"
// // // //           value={stats.purchasedValue.toLocaleString('en-IN', {
// // // //             style: 'currency',
// // // //             currency: 'INR'
// // // //           })}
// // // //           icon={<BsCart3 size={24} />}
// // // //           iconBgColor="green.500"
// // // //           to="/vendor/spending-history"
// // // //         />

// // // //         <StatCard
// // // //           label="Purchases Pending Approval"
// // // //           value={stats.pendingTradeApprovals.toLocaleString()}
// // // //           icon={<BsCheckCircle size={24} />}
// // // //           iconBgColor="purple.500"
// // // //         />
// // // //       </Grid>
// // // //     </Box>
// // // //   );
// // // // };

// // // // export default VendorTradingSection;




// // // import React from 'react';
// // // import { Box, Grid } from '@chakra-ui/react';
// // // import {
// // //   BsPersonCheckFill,
// // //   BsCart3,
// // // } from 'react-icons/bs';
// // // import { FaMoneyBillWave } from 'react-icons/fa'; // ✅ CHANGE: New icon

// // // import StatCard from '../shared/cards/StatCard';
// // // import VendorProductStatCard from './cards/VendorProductStatCard';
// // // import VendorDashboardHeader from './VendorDashboardHeader';

// // // const VendorTradingSection = ({ stats,url }) => {
// // //   return (
// // //     <Box as="section" mb={8} pl={{ base: 3, md: 3, lg: 3 }}>
// // //       {/* 1. Render the header */}
// // //       <VendorDashboardHeader url={url}/>

// // //       {/* 2. Render the grid of stats */}
// // //       <Grid
// // //         templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
// // //         gap={6}
// // //       >
// // //         <VendorProductStatCard value={stats.availableProducts} />

// // //         <StatCard
// // //           label="My Approved Purchases"
// // //           value={stats.purchasedProducts.toLocaleString()}
// // //           icon={<BsPersonCheckFill size={24} />}
// // //           iconBgColor="sky.900"
// // //           to="/vendor/purchase-history"
// // //         />

// // //         <StatCard
// // //           label="Total Spent"
// // //           value={stats.purchasedValue.toLocaleString('en-IN', {
// // //             style: 'currency',
// // //             currency: 'INR'
// // //           })}
// // //           icon={<BsCart3 size={24} />}
// // //           iconBgColor="green.500"
// // //           to="/vendor/purchase-history"
// // //         />

// // //         {/* ✅ CHANGE: This is the updated card */}
// // //         <StatCard
// // //           label="Items Ready to Sell"
// // //           value={stats.sellableTradesCount.toLocaleString()}
// // //           icon={<FaMoneyBillWave size={24} />}
// // //           iconBgColor="teal.500"
// // //           to="/vendor/wallet" // Links to the wallet where active investments are
// // //         />
// // //       </Grid>
// // //     </Box>
// // //   );
// // // };

// // // export default VendorTradingSection;

// // import React from 'react';
// // import { Box, Grid } from '@chakra-ui/react';
// // // ✅ CHANGE: Import the new, correct icon
// // import { BsBagCheckFill, BsCart3 } from 'react-icons/bs';
// // import { FaMoneyBillWave } from 'react-icons/fa';

// // import StatCard from '../shared/cards/StatCard';
// // import VendorProductStatCard from './cards/VendorProductStatCard';
// // import VendorDashboardHeader from './VendorDashboardHeader';

// // const VendorTradingSection = ({ stats, url }) => {
// //   return (
// //     <Box as="section" mb={8}>
// //       <VendorDashboardHeader url={url}/>

// //       <Grid
// //         templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
// //         gap={6}
// //       >
// //         <VendorProductStatCard value={stats.availableProducts} />

// //         {/* ✅ CHANGE: Use the new BsBagCheckFill icon here */}
// //         <StatCard
// //           label="My Approved Purchases"
// //           value={stats.purchasedProducts.toLocaleString()}
// //           icon={<BsBagCheckFill size={24} />}
// //           iconBgColor="sky.500" // Changed from sky.900 to match other colors
// //           to="/vendor/purchase-history"
// //         />

// //         <StatCard
// //           label="Total Spent"
// //           value={stats.purchasedValue.toLocaleString('en-IN', {
// //             style: 'currency',
// //             currency: 'INR'
// //           })}
// //           icon={<BsCart3 size={24} />}
// //           iconBgColor="green.500"
// //           to="/vendor/purchase-history"
// //         />
        
// //         <StatCard
// //           label="Items Ready to Sell"
// //           value={stats.sellableTradesCount.toLocaleString()}
// //           icon={<FaMoneyBillWave size={24} />}
// //           iconBgColor="teal.500"
// //           to="/vendor/wallet"
// //         />
// //       </Grid>
// //     </Box>
// //   );
// // };

// // export default VendorTradingSection;

// import React from 'react';
// import { Box, Grid } from '@chakra-ui/react';
// // ✅ CHANGE: Import the new, more appropriate icon
// import { BsBagCheckFill, BsCart3 } from 'react-icons/bs'; 
// import { FaMoneyBillWave } from 'react-icons/fa';

// import StatCard from '../shared/cards/StatCard';
// import VendorProductStatCard from './cards/VendorProductStatCard';
// import VendorDashboardHeader from './VendorDashboardHeader';

// const VendorTradingSection = ({ stats, url }) => {
//   return (
//     <Box as="section" mb={8}>
//       <VendorDashboardHeader url={url}/>

//       <Grid
//         templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
//         gap={6}
//       >
//         <VendorProductStatCard value={stats.availableProducts} />

//         {/* ✅ CHANGE: Use the BsBagCheckFill icon for this card */}
//         <StatCard
//           label="My Approved Purchases"
//           value={stats.purchasedProducts.toLocaleString()}
//           icon={<BsBagCheckFill size={24} />} 
//           iconBgColor="sky.500" // A slightly brighter blue looks nice
//           to="/vendor/purchase-history"
//         />

//         <StatCard
//           label="Total Spent"
//           value={stats.purchasedValue.toLocaleString('en-IN', {
//             style: 'currency',
//             currency: 'INR'
//           })}
//           icon={<BsCart3 size={24} />}
//           iconBgColor="green.500"
//           to="/vendor/purchase-history"
//         />
        
//         <StatCard
//           label="Items Ready to Sell"
//           value={stats.sellableTradesCount.toLocaleString()}
//           icon={<FaMoneyBillWave size={24} />}
//           iconBgColor="teal.500"
//           to="/vendor/wallet"
//         />
//       </Grid>
//     </Box>
//   );
// };

// export default VendorTradingSection;


import React from 'react';
// ✅ CHANGE: Import VStack for the new layout
import { Box, VStack } from '@chakra-ui/react';
// ✅ CHANGE: Import all necessary icons
import { BsBoxSeam, BsBagCheckFill, BsCart3 } from 'react-icons/bs';
import { FaMoneyBillWave } from 'react-icons/fa';

import StatCard from '../shared/cards/StatCard';
// We no longer need the special VendorProductStatCard
import VendorDashboardHeader from './VendorDashboardHeader';

const VendorTradingSection = ({ stats, url }) => {
  return (
    <Box as="section" mb={8}>
      <VendorDashboardHeader url={url}/>

      {/* ✅ CHANGE: Use a VStack for a vertical layout */}
      <VStack spacing={4} align="stretch">
        {/* ✅ CHANGE: "Products" card is now a generic StatCard */}
        <StatCard
          label="Products Available to Buy"
          value={stats.availableProducts.toLocaleString()}
          icon={<BsBoxSeam size={24} />}
          iconBgColor="blue.400" // A nice blue color for the background
          to="/vendor/products"
        />

        {/* ✅ NEW: Wild Products card */}
        <StatCard
          label="Wild Products Available"
          value={stats.availableWildProducts.toLocaleString()}
          icon={<BsBoxSeam size={24} />}
          iconBgColor="purple.400" // Purple color to distinguish from regular products
          to="/vendor/wild-products"
        />

        {/* ✅ FIX: Added a visible background color and the correct icon */}
        <StatCard
          label="My Approved Purchases"
          value={stats.purchasedProducts.toLocaleString()}
          icon={<BsBagCheckFill size={24} />}
          iconBgColor="gray.700" // A visible color to fix the white-on-white issue
          to="/vendor/purchase-history"
        />

        <StatCard
          label="Total Spent"
          value={stats.purchasedValue.toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR'
          })}
          icon={<BsCart3 size={24} />}
          iconBgColor="green.500"
          to="/vendor/purchase-history"
        />
        
        <StatCard
          label="Items Ready to Sell"
          value={stats.sellableTradesCount.toLocaleString()}
          icon={<FaMoneyBillWave size={24} />}
          iconBgColor="teal.500"
          to="/vendor/wallet"
        />

        {/* Total Profit Earned Box */}
        <Box
          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          borderRadius="xl"
          p={3}
          boxShadow="xl"
          border="2px solid"
          borderColor="purple.200"
          position="relative"
          overflow="hidden"
          h="50%"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            pointerEvents: 'none'
          }}
        >
          <Box position="relative" zIndex={1}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              mb={2}
            >
              <Box textAlign="center">
                <Box
                  fontSize="md"
                  fontWeight="bold"
                  color="gray.900"
                  mb={1}
                >
                  Total Profit Earned
                </Box>
                <Box
                  fontSize="2xl"
                  fontWeight="extrabold"
                  color="gray.900"
                  textShadow="0 1px 2px rgba(255,255,255,0.3)"
                >
                  ₹{stats.totalProfitEarned ? stats.totalProfitEarned.toFixed(2) : '0.00'}
                </Box>
              </Box>
            </Box>
            <Box
              fontSize="xs"
              color="gray.900"
              fontStyle="italic"
            >
              Lifetime earnings from all your successful trades
            </Box>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default VendorTradingSection;