// // // // // import React, { useMemo } from 'react';
// // // // // import { Box, Text, Heading, useColorModeValue, useBreakpointValue } from '@chakra-ui/react';
// // // // // import { keyframes } from '@emotion/react';

// // // // // const COMPANIES = [
// // // // //   'Paper dis mart',
// // // // //   'S.K. Enterprises',
// // // // //   'Galaxy Super Paper',
// // // // //   'Laskhmi paper',
// // // // //   'Shree Krishna Traders',
// // // // //   'Shree Paper Mart',
// // // // //   'Silver Distributors',
// // // // // ];

// // // // // const slide = keyframes`
// // // // //   from { transform: translateX(0); }
// // // // //   to   { transform: translateX(-50%); }   /* seamless loop (list is duplicated) */
// // // // // `;

// // // // // export default function TrustedCompanies() {
// // // // //   const headingColor = useColorModeValue('gray.700', 'gray.200');
// // // // //   const cardBg = useColorModeValue('white', 'gray.700');
// // // // //   const cardBorder = useColorModeValue('gray.200', 'gray.600');

// // // // //   // responsive sizes
// // // // //   const containerMaxW = useBreakpointValue({ base: '100%', md: '900px' });
// // // // //   const cardWidth = useBreakpointValue({ base: '260px', md: '260px' }); // fixed so the row never wraps
// // // // //   const cardPaddingY = useBreakpointValue({ base: 2, md: 2.5 });

// // // // //   // duplicate for seamless marquee
// // // // //   const marquee = useMemo(() => [...COMPANIES, ...COMPANIES], []);

// // // // //   return (
// // // // //     <Box mt={8} w="full" maxW={containerMaxW} mx="auto">
// // // // //       <Heading as="h3" size="sm" mb={3} color={headingColor} textAlign="center">
// // // // //         Our trusted paper partners
// // // // //       </Heading>

// // // // //       {/* Viewport */}
// // // // //       <Box
// // // // //         position="relative"
// // // // //         overflow="hidden"
// // // // //         w="100%"
// // // // //         // lock a single row height so wrapping can’t happen
// // // // //         h={{ base: '64px', md: '72px' }}
// // // // //       >
// // // // //         {/* Track */}
// // // // //         <Box
// // // // //           as="div"
// // // // //           display="block"
// // // // //           minW="200%"
// // // // //           whiteSpace="nowrap"              // 🔒 never wrap
// // // // //           willChange="transform"
// // // // //           animation={`${slide} ${/* slower on mobile */ ''}${window?.matchMedia && window.matchMedia('(max-width: 48em)').matches ? '22s' : '28s'} linear infinite`}
// // // // //           _hover={{ animationPlayState: 'paused' }}
// // // // //         >
// // // // //           {marquee.map((name, i) => (
// // // // //             <Box
// // // // //               as="span"
// // // // //               key={`${name}-${i}`}
// // // // //               display="inline-block"        // 🔒 inline cards within a single line
// // // // //               verticalAlign="middle"
// // // // //               width={cardWidth}
// // // // //               mr={3}
// // // // //               px={4}
// // // // //               py={cardPaddingY}
// // // // //               bg={cardBg}
// // // // //               borderWidth="1px"
// // // // //               borderColor={cardBorder}
// // // // //               borderRadius="md"
// // // // //               textAlign="center"
// // // // //             >
// // // // //               <Text fontWeight="semibold" noOfLines={1}>{name}</Text>
// // // // //             </Box>
// // // // //           ))}
// // // // //         </Box>
// // // // //       </Box>
// // // // //     </Box>
// // // // //   );
// // // // // }


// // // // import React, { useMemo } from 'react';
// // // // import { Box, Text, Heading, useColorModeValue, Image, Flex } from '@chakra-ui/react';
// // // // import { keyframes } from '@emotion/react';

// // // // const PARTNERS = [
// // // //   { name: 'Paper dis mart', logo: 'https://picsum.photos/seed/paper-dis-mart/140/70' },
// // // //   { name: 'S.K. Enterprises', logo: 'https://picsum.photos/seed/sk-enterprises/140/70' },
// // // //   { name: 'Galaxy Super Paper', logo: 'https://picsum.photos/seed/galaxy-paper/140/70' },
// // // //   { name: 'Laskhmi paper', logo: 'https://picsum.photos/seed/laskhmi-paper/140/70' },
// // // //   { name: 'Shree Krishna Traders', logo: 'https://picsum.photos/seed/shree-krishna/140/70' },
// // // //   { name: 'Shree Paper Mart', logo: 'https://picsum.photos/seed/shree-paper/140/70' },
// // // //   { name: 'Silver Distributors', logo: 'https://picsum.photos/seed/silver-dist/140/70' },
// // // // ];

// // // // const totalWidth = PARTNERS.length * 200; // 200px is the card width
// // // // const slide = keyframes`
// // // //   from { transform: translateX(0); }
// // // //   to { transform: translateX(-${totalWidth}px); }
// // // // `;

// // // // export default function TrustedCompanies() {
// // // //   const headingColor = useColorModeValue('gray.700', 'gray.200');
  
// // // //   // --- FIX ---
// // // //   // Hooks are now called at the top level of the component.
// // // //   const cardBg = useColorModeValue('white', 'gray.700');
// // // //   const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
// // // //   const logoFilter = useColorModeValue('none', 'invert(1) grayscale(1) contrast(100)');
  
// // // //   const marqueePartners = useMemo(() => [...PARTNERS, ...PARTNERS], []);
// // // //   const animationDuration = `${PARTNERS.length * 5}s`;

// // // //   return (
// // // //     <Box mt={12} w="full" mx="auto" py={6}>
// // // //       <Heading as="h3" size="md" mb={6} color={headingColor} textAlign="center">
// // // //         Our trusted paper partners
// // // //       </Heading>

// // // //       <Box
// // // //         position="relative"
// // // //         overflow="hidden"
// // // //         maskImage="linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 90%, rgba(0,0,0,0) 100%)"
// // // //         sx={{
// // // //           '-webkit-mask-image': 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 90%, rgba(0,0,0,0) 100%)'
// // // //         }}
// // // //       >
// // // //         <Flex
// // // //           display="flex"
// // // //           gap={{ base: 4, md: 6 }}
// // // //           py={4}
// // // //           sx={{
// // // //             animation: `${slide} ${animationDuration} linear infinite`,
// // // //             '@media (prefers-reduced-motion: no-preference)': {
// // // //               '&:hover': {
// // // //                 animationPlayState: 'paused',
// // // //               },
// // // //             },
// // // //             '@media (prefers-reduced-motion: reduce)': {
// // // //               animation: 'none',
// // // //               overflowX: 'auto', 
// // // //               scrollSnapType: 'x mandatory'
// // // //             },
// // // //           }}
// // // //         >
// // // //           {marqueePartners.map((partner, i) => (
// // // //             <Flex
// // // //               key={`${partner.name}-${i}`}
// // // //               align="center"
// // // //               justify="center"
// // // //               flexShrink={0}
// // // //               w={{ base: '160px', md: '200px' }}
// // // //               h="70px"
// // // //               // Use the variables defined above instead of calling the hook here.
// // // //               bg={cardBg}
// // // //               border="1px solid"
// // // //               borderColor={cardBorderColor}
// // // //               borderRadius="lg"
// // // //               boxShadow="sm"
// // // //               p={4}
// // // //               scrollSnapAlign="start"
// // // //             >
// // // //               <Image 
// // // //                 src={partner.logo} 
// // // //                 alt={`${partner.name} logo`}
// // // //                 htmlWidth="140"
// // // //                 htmlHeight="70"
// // // //                 objectFit="contain"
// // // //                 // Use the variable here as well.
// // // //                 filter={logoFilter}
// // // //               />
// // // //             </Flex>
// // // //           ))}
// // // //         </Flex>
// // // //       </Box>
// // // //     </Box>
// // // //   );
// // // // }


// // // import React, { useMemo } from 'react';
// // // import { Box, Heading, useColorModeValue, Image, Flex } from '@chakra-ui/react';
// // // import { keyframes } from '@emotion/react';

// // // const PARTNERS = [
// // //   { name: 'Paper dis mart', logo: 'https://picsum.photos/seed/paper-dis-mart/140/70' },
// // //   { name: 'S.K. Enterprises', logo: 'https://picsum.photos/seed/sk-enterprises/140/70' },
// // //   { name: 'Galaxy Super Paper', logo: 'https://picsum.photos/seed/galaxy-paper/140/70' },
// // //   { name: 'Laskhmi paper', logo: 'https://picsum.photos/seed/laskhmi-paper/140/70' },
// // //   { name: 'Shree Krishna Traders', logo: 'https://picsum.photos/seed/shree-krishna/140/70' },
// // //   { name: 'Shree Paper Mart', logo: 'https://picsum.photos/seed/shree-paper/140/70' },
// // //   { name: 'Silver Distributors', logo: 'https://picsum.photos/seed/silver-dist/140/70' },
// // // ];

// // // // --- FIX: Define dimensions as constants for accuracy ---
// // // const CARD_WIDTH_PX = 200;
// // // const GAP_PX = 24; // Chakra UI's theme value for gap `6` is 1.5rem, which is 24px.

// // // // --- FIX: Calculate the total width including gaps ---
// // // const totalWidth = PARTNERS.length * (CARD_WIDTH_PX + GAP_PX);

// // // const slide = keyframes`
// // //   from { transform: translateX(0); }
// // //   to { transform: translateX(-${totalWidth}px); }
// // // `;

// // // export default function TrustedCompanies() {
// // //   const headingColor = useColorModeValue('gray.700', 'gray.200');
// // //   const cardBg = useColorModeValue('white', 'gray.700');
// // //   const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
// // //   const logoFilter = useColorModeValue('none', 'invert(1) grayscale(1) contrast(100)');

// // //   const marqueePartners = useMemo(() => [...PARTNERS, ...PARTNERS], []);
// // //   const animationDuration = `${PARTNERS.length * 5}s`;

// // //   return (
// // //     <Box w="full" mx="auto" py={6}>
// // //       <Heading as="h3" size="md" mb={6} color={headingColor} textAlign="center">
// // //         Our trusted paper partners
// // //       </Heading>

// // //       <Box
// // //         position="relative"
// // //         overflow="hidden"
// // //         maskImage="linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)"
// // //         sx={{
// // //           '-webkit-mask-image': 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
// // //         }}
// // //       >
// // //         <Flex
// // //           display="flex"
// // //           // --- FIX: Use a consistent gap value ---
// // //           gap={`${GAP_PX}px`}
// // //           py={4}
// // //           sx={{
// // //             animation: `${slide} ${animationDuration} linear infinite`,
// // //             '@media (prefers-reduced-motion: no-preference)': {
// // //               '&:hover': {
// // //                 animationPlayState: 'paused',
// // //               },
// // //             },
// // //             '@media (prefers-reduced-motion: reduce)': {
// // //               animation: 'none',
// // //               overflowX: 'auto',
// // //               scrollSnapType: 'x mandatory',
// // //             },
// // //           }}
// // //         >
// // //           {marqueePartners.map((partner, i) => (
// // //             <Flex
// // //               key={`${partner.name}-${i}`}
// // //               align="center"
// // //               justify="center"
// // //               flexShrink={0}
// // //               // --- FIX: Use the constant for width ---
// // //               w={`${CARD_WIDTH_PX}px`}
// // //               h="70px"
// // //               bg={cardBg}
// // //               border="1px solid"
// // //               borderColor={cardBorderColor}
// // //               borderRadius="lg"
// // //               boxShadow="sm"
// // //               p={4}
// // //               scrollSnapAlign="start"
// // //             >
// // //               <Image
// // //                 src={partner.logo}
// // //                 alt={`${partner.name} logo`}
// // //                 htmlWidth="140"
// // //                 htmlHeight="70"
// // //                 objectFit="contain"
// // //                 filter={logoFilter}
// // //               />
// // //             </Flex>
// // //           ))}
// // //         </Flex>
// // //       </Box>
// // //     </Box>
// // //   );
// // // }








// // import React from 'react';
// // import { Box, Heading, useColorModeValue, Image, Flex } from '@chakra-ui/react';

// // const PARTNERS = [
// //   { name: 'Paper dis mart', logo: 'https://picsum.photos/seed/paper-dis-mart/140/70' },
// //   { name: 'S.K. Enterprises', logo: 'https://picsum.photos/seed/sk-enterprises/140/70' },
// //   { name: 'Galaxy Super Paper', logo: 'https://picsum.photos/seed/galaxy-paper/140/70' },
// //   { name: 'Laskhmi paper', logo: 'https://picsum.photos/seed/laskhmi-paper/140/70' },
// //   { name: 'Shree Krishna Traders', logo: 'https://picsum.photos/seed/shree-krishna/140/70' },
// //   { name: 'Shree Paper Mart', logo: 'https://picsum.photos/seed/shree-paper/140/70' },
// //   { name: 'Silver Distributors', logo: 'https://picsum.photos/seed/silver-dist/140/70' },
// // ];

// // export default function TrustedCompanies() {
// //   const headingColor = useColorModeValue('gray.700', 'gray.200');
// //   const cardBg = useColorModeValue('white', 'gray.700');
// //   const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
// //   const logoFilter = useColorModeValue('none', 'invert(1) grayscale(1) contrast(100)');

// //   return (
// //     <Box w="full" mx="auto" py={6}>
// //       <Heading as="h3" size="md" mb={6} color={headingColor} textAlign="center">
// //         Our trusted paper partners
// //       </Heading>

// //       <Flex
// //         wrap="wrap"
// //         justify="center"
// //         align="center"
// //         gap={6} // Consistent spacing
// //         py={4}
// //       >
// //         {PARTNERS.map((partner) => (
// //           <Flex
// //             key={partner.name}
// //             align="center"
// //             justify="center"
// //             flexShrink={0}
// //             w="200px"
// //             h="70px"
// //             bg={cardBg}
// //             border="1px solid"
// //             borderColor={cardBorderColor}
// //             borderRadius="lg"
// //             boxShadow="sm"
// //             p={4}
// //           >
// //             <Image
// //               src={partner.logo}
// //               alt={`${partner.name} logo`}
// //               htmlWidth="140"
// //               htmlHeight="70"
// //               objectFit="contain"
// //               filter={logoFilter}
// //             />
// //           </Flex>
// //         ))}
// //       </Flex>
// //     </Box>
// //   );
// // }





// import React from 'react';
// import { Box, Heading, useColorModeValue, VStack, Text } from '@chakra-ui/react';

// const PARTNERS = [
//   { name: 'Paper dis mart', logo: 'https://picsum.photos/seed/paper-dis-mart/140/70' },
//   { name: 'S.K. Enterprises', logo: 'https://picsum.photos/seed/sk-enterprises/140/70' },
//   { name: 'Galaxy Super Paper', logo: 'https://picsum.photos/seed/galaxy-paper/140/70' },
//   { name: 'Laskhmi paper', logo: 'https://picsum.photos/seed/laskhmi-paper/140/70' },
//   { name: 'Shree Krishna Traders', logo: 'https://picsum.photos/seed/shree-krishna/140/70' },
//   { name: 'Shree Paper Mart', logo: 'https://picsum.photos/seed/shree-paper/140/70' },
//   { name: 'Silver Distributors', logo: 'https://picsum.photos/seed/silver-dist/140/70' },
// ];

// export default function TrustedCompanies() {
//   const headingColor = useColorModeValue('gray.700', 'gray.200');
//   const textColor = useColorModeValue('gray.600', 'gray.400');

//   return (
//     <Box w="full" mx="auto" py={6} textAlign="center">
//       <Heading as="h3" size="md" mb={6} color={headingColor}>
//         Our trusted paper partners
//       </Heading>

//       <VStack spacing={2}>
//         {PARTNERS.map((partner) => (
//           <Text key={partner.name} color={textColor}>
//             {partner.name}
//           </Text>
//         ))}
//       </VStack>
//     </Box>
//   );
// }



import React from 'react';
import { Box, Heading, useColorModeValue, Flex, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';

// Create motion-enabled Chakra components
const MotionFlex = motion(Flex);
const MotionBox = motion(Box);

const PARTNERS = [
  { name: 'Paper dis mart' },
  { name: 'S.K. Enterprises' },
  { name: 'Galaxy Super Paper' },
  { name: 'Laskhmi paper' },
  { name: 'Shree Krishna Traders' },
  { name: 'Shree Paper Mart' },
  { name: 'Silver Distributors' },
];

// Animation variants for the container to orchestrate the children's animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Stagger the animation of children by 0.1s
    },
  },
};

// Animation variants for each card
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

export default function TrustedCompanies() {
  const headingColor = useColorModeValue('gray.700', 'gray.200');
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.100');

  return (
    <Box w="full" mx="auto" py={6} px={4}>
      <Heading as="h3" size="md" mb={8} color={headingColor} textAlign="center">
        Our trusted paper partners
      </Heading>

      <MotionFlex
        wrap="wrap"
        justify="center"
        gap={4}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {PARTNERS.map((partner) => (
          <MotionBox
            key={partner.name}
            p={4}
            bg={cardBg}
            border="1px solid"
            borderColor={cardBorderColor}
            borderRadius="lg"
            boxShadow="sm"
            minW="180px"
            textAlign="center"
            variants={itemVariants}
            transition="all 0.2s ease-in-out"
            _hover={{
              transform: 'translateY(-4px)',
              boxShadow: 'md',
            }}
          >
            <Text fontWeight="medium" color={textColor}>
              {partner.name}
            </Text>
          </MotionBox>
        ))}
      </MotionFlex>
    </Box>
  );
}