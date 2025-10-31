// // import React from 'react';
// // import {
// //     Flex,
// //     Box,
// //     Heading,
// //     Text,
// //     Button,
// //     HStack,
// //     Icon,
// //     Tooltip,
// //     useColorModeValue,
// // } from '@chakra-ui/react';
// // import { Plus , Banknote } from 'lucide-react';
// // import useWindowDimensions from '../../hooks/useWindowDimensions';

// // const WalletHeader = ({ digitalMoney, onAddMoneyClick, onWithdrawClick, hasPendingWithdrawal }) => {
// //     const { width } = useWindowDimensions();

// //     const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
// //     const coinColor = useColorModeValue('yellow.500', 'yellow.300');

// //     const isMobile = width <= 480;
// //     const isTablet = width > 480 && width <= 1024;

// //     // ✅ --- SIZES INCREASED BY ~20% ---
// //     // Increased font sizes for better readability
// //     const headingSize = isMobile ? 'md' : isTablet ? 'lg' : 'xl';
// //     const balanceFontSize = isMobile ? 'lg' : isTablet ? 'xl' : '2xl';
    
// //     // Increased icon sizes
// //     const iconSize = isMobile ? 18 : isTablet ? 22 : 24;
    
// //     // Increased button sizes
// //     const buttonSize = isMobile ? 'sm' : 'md';
    
// //     // Adjusted padding for the new sizes
// //     const paddingX = isMobile ? 3 : 5;
// //     const paddingY = isMobile ? 3 : 5;

// //     const displayBalance =
// //         typeof digitalMoney === 'number'
// //             ? digitalMoney.toLocaleString('en-IN', {
// //                   minimumFractionDigits: 2,
// //                   maximumFractionDigits: 2,
// //               })
// //             : '...';

// //     return (
// //         <Box position="relative" w="100%" px={paddingX} py={paddingY} mb={4}>
// //             {/* Top-right icon */}
// //             <Box position="absolute" top={paddingY} right={paddingX}>
// //             </Box>

// //             <Flex
// //                 direction="row"
// //                 align="center"
// //                 justify="space-between"
// //                 wrap="wrap"
// //                 gap={4}
// //                 w="100%"
// //             >
// //                 {/* Left Section */}
// //                 <Box>
// //                     <Heading as="h1" size={headingSize} mb={1}>
// //                         My Wallet
// //                     </Heading>
// //                     <Text fontSize={balanceFontSize} fontWeight="bold" color={secondaryTextColor}>
// //                         ₹ {displayBalance}
// //                     </Text>
// //                 </Box>

// //                 {/* Right Section */}
// //                 <HStack spacing={3}>
// //                     <Button
// //                         size={buttonSize}
// //                         leftIcon={<Plus size={iconSize} />}
// //                         colorScheme="green"
// //                         onClick={onAddMoneyClick}
// //                     >
// //                         Add
// //                     </Button>

// //                     <Tooltip
// //                         label="A withdrawal request is already pending"
// //                         isDisabled={!hasPendingWithdrawal}
// //                         hasArrow
// //                         placement="top"
// //                     >
// //                         <Box>
// //                             <Button
// //                                 size={buttonSize}
// //                                 colorScheme="orange"
// //                                 variant="outline"
// //                                 onClick={onWithdrawClick}
// //                                 isDisabled={hasPendingWithdrawal}
// //                             >
// //                                 Withdraw
// //                             </Button>
// //                         </Box>
// //                     </Tooltip>
// //                 </HStack>
// //             </Flex>
// //         </Box>
// //     );
// // };

// // // #hello


// // export default WalletHeader;









// import React from 'react';
// import {
//   Flex,
//   Box,
//   Heading,
//   Text,
//   Button,
//   HStack,
//   Tooltip,
//   useColorModeValue,
//   IconButton,
//   VStack,
// } from '@chakra-ui/react';
// import { HamburgerIcon } from '@chakra-ui/icons';
// import { Plus } from 'lucide-react';
// import useWindowDimensions from '../../hooks/useWindowDimensions';

// const WalletHeader = ({
//   digitalMoney,
//   onAddMoneyClick,
//   onWithdrawClick,
//   hasPendingWithdrawal,
//   onOpenNav, // opens the drawer (passed from parent)
// }) => {
//   const { width } = useWindowDimensions();

//   const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
//   const iconColor = useColorModeValue('black', 'whiteAlpha.900'); // ✅ dark-mode friendly

//   // Breakpoints
//   const isMobile = width <= 480;
//   const isTablet = width > 480 && width <= 1024;

//   // ✅ Smaller on smaller screens
//   const headingSize = isMobile ? 'sm' : isTablet ? 'md' : 'lg';
//   const balanceFontSize = isMobile ? 'md' : isTablet ? 'lg' : 'xl';

//   // Icon & button sizes
//   const iconSize = isMobile ? 16 : isTablet ? 20 : 22;
//   const buttonSize = isMobile ? 'sm' : 'md';

//   // ✅ Less padding (standard header height feel)
//   const paddingX = isMobile ? 2 : 4;
//   const paddingY = isMobile ? 2 : 4;

//   const displayBalance =
//     typeof digitalMoney === 'number'
//       ? digitalMoney.toLocaleString('en-IN', {
//           minimumFractionDigits: 2,
//           maximumFractionDigits: 2,
//         })
//       : '...';

//   return (
//     <Box w="100%" px={paddingX} py={paddingY} mb={3}>
//       <Flex
//         align="center"
//         justify="space-between"
//         wrap="wrap"
//         gap={3}
//         w="100%"
//       >
//         {/* Left: hamburger + (title + amount) stacked together */}
//         <Flex align="center" gap={2}>
//           <IconButton
//             aria-label="Open menu"
//             icon={<HamburgerIcon w={iconSize / 2.5} h={iconSize / 2.5} />} // keeps icon crisp
//             onClick={onOpenNav}
//             size="sm"
//             variant="ghost"
//             color={iconColor}
//             display={{ base: 'inline-flex', md: 'none' }}  // phone only
//             p={1}                     // ✅ tighter tap area
//             mt="-1"                   // ✅ nudge icon slightly up
//             _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.200' } }}
//           />
//           <VStack align="start" spacing={0.5}>
//             <Heading as="h1" size={headingSize} lineHeight="1.2">
//               My Wallet
//             </Heading>
//             <Text
//               fontSize={balanceFontSize}
//               fontWeight="bold"
//               color={secondaryTextColor}
//               lineHeight="1.2"
//             >
//               ₹ {displayBalance}
//             </Text>
//           </VStack>
//         </Flex>

//         {/* Right: actions */}
//         <HStack spacing={2}>
//           <Button
//             size={buttonSize}
//             leftIcon={<Plus size={iconSize} />}
//             colorScheme="green"
//             onClick={onAddMoneyClick}
//           >
//             Add
//           </Button>

//           <Tooltip
//             label="A withdrawal request is already pending"
//             isDisabled={!hasPendingWithdrawal}
//             hasArrow
//             placement="top"
//           >
//             <Box>
//               <Button
//                 size={buttonSize}
//                 colorScheme="orange"
//                 variant="outline"
//                 onClick={onWithdrawClick}
//                 isDisabled={hasPendingWithdrawal}
//               >
//                 Withdraw
//               </Button>
//             </Box>
//           </Tooltip>
//         </HStack>
//       </Flex>
//     </Box>
//   );
// };





// export default WalletHeader;












import React from 'react';
import {
  Flex, Box, Text, Button, HStack, useColorModeValue, IconButton, VStack, Heading, useToast,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Plus } from 'lucide-react';
import useWindowDimensions from '../../hooks/useWindowDimensions';

const WalletHeader = ({
  digitalMoney,
  onAddMoneyClick,
  onWithdrawClick,
  hasPendingWithdrawal,
  onOpenNav,
  withdrawalWindow,
}) => {
  const toast = useToast();
  const { width } = useWindowDimensions();
  const isMobile = width <= 480;
  const isTablet = width > 480 && width <= 1024;

  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const iconColor = useColorModeValue('black', 'whiteAlpha.900');

  const buttonSize = isMobile ? 'sm' : 'md';
  const iconSize = isMobile ? 16 : isTablet ? 20 : 22;

  const isDisabled = hasPendingWithdrawal || (withdrawalWindow && !withdrawalWindow.allowed);
  const disabledReason = hasPendingWithdrawal
    ? 'A withdrawal request is already pending'
    : (withdrawalWindow && !withdrawalWindow.allowed ? (withdrawalWindow.reason || 'Withdrawals are closed right now') : '');

  const balanceText =
    typeof digitalMoney === 'number'
      ? `₹ ${digitalMoney.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '₹ ...';

  const handleWithdrawClick = () => {
    if (isDisabled) {
      toast({
        title: 'Withdrawal Unavailable',
        description: disabledReason,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    onWithdrawClick();
  };

  return (
    <Box w="100%" px={{ base: 2, md: 4 }} py={{ base: 2, md: 4 }} mb={3}>
      {/* Mobile header */}
      <Flex
        align="center"
        justify="space-between"
        gap={2}
        mb={4}
        display={{ base: 'flex', md: 'none' }}
      >
        <Flex align="center" gap={2}>
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon w={5} h={5} />}
            onClick={onOpenNav}
            size="sm"
            variant="ghost"
            color={iconColor}
            p={1}
            mt="-5"                  // a little higher
            ml={{ base: '-2', md: 0 }} // a little left (cancels container left padding)
            _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.200' } }}
          />
          <VStack align="start" spacing={0.5}>
            <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">
              My Wallet
            </Heading>
            <Text fontSize="md" fontWeight="bold" color={secondaryTextColor} lineHeight="1.2">
              {balanceText}
            </Text>
          </VStack>
        </Flex>

        <HStack spacing={2}>
          <Button
            size={buttonSize}
            leftIcon={<Plus size={iconSize} />}
            colorScheme="green"
            onClick={onAddMoneyClick}
          >
            Add
          </Button>
          <Box
            onClick={handleWithdrawClick}
            cursor={isDisabled ? 'not-allowed' : 'pointer'}
            display="inline-block"
          >
            <Button
              size={buttonSize}
              colorScheme="orange"
              variant="outline"
              pointerEvents="none"
              isDisabled={isDisabled}
            >
              Withdraw
            </Button>
          </Box>
        </HStack>
      </Flex>

      {/* Desktop header */}
      <Flex
        align="center"
        justify="space-between"
        wrap="wrap"
        gap={3}
        w="100%"
        display={{ base: 'none', md: 'flex' }}
      >
        <Box>
          <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" lineHeight="1.2">
            My Wallet
          </Text>
          <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color={secondaryTextColor} lineHeight="1.2">
            {balanceText}
          </Text>
        </Box>
        <HStack spacing={2}>
          <Button
            size={buttonSize}
            leftIcon={<Plus size={iconSize} />}
            colorScheme="green"
            onClick={onAddMoneyClick}
          >
            Add
          </Button>
          <Box
            onClick={handleWithdrawClick}
            cursor={isDisabled ? 'not-allowed' : 'pointer'}
            display="inline-block"
          >
            <Button
              size={buttonSize}
              colorScheme="orange"
              variant="outline"
              pointerEvents="none"
              isDisabled={isDisabled}
            >
              Withdraw
            </Button>
          </Box>
        </HStack>
      </Flex>
    </Box>
  );
};







export default WalletHeader;