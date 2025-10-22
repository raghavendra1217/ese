import React from 'react';
import {
  Flex,
  Image,
  Box,
  Text,
  Stat,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import useWindowDimensions from '../../hooks/useWindowDimensions';

const SoldTradeItem = ({ item }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Use the utility function for consistent Indian timezone formatting


  // --- Data Calculation ---
  const purchasePrice = parseFloat(item.purchase_price);
  const salePrice = parseFloat(item.sale_price);
  const stocks = parseInt(item.no_of_stock_bought) || 0;
  const profitPerStock =
    !isNaN(purchasePrice) && !isNaN(salePrice) ? salePrice - purchasePrice : NaN;
  const totalProfit =
    !isNaN(profitPerStock) && !isNaN(stocks) ? profitPerStock * stocks : NaN;
  const isProfit = !isNaN(totalProfit) && totalProfit >= 0;

  // --- Dynamic Theme-aware Colors ---
  const itemBg = useColorModeValue(isProfit ? 'green.50' : 'red.50', isProfit ? 'gray.700' : '#2D0000');
  const itemBorder = useColorModeValue(isProfit ? 'green.200' : 'red.200', isProfit ? 'green.700' : 'red.700');
  const textColor = useColorModeValue('gray.800', 'whiteAlpha.900');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const profitColor = useColorModeValue(isProfit ? 'green.600' : 'red.500', isProfit ? 'green.300' : 'red.300');
  const dividerColor = useColorModeValue('gray.200', 'gray.600');

  // --- Formatted Display Values ---
  const displayPurchasePrice = !isNaN(purchasePrice) ? `₹${purchasePrice.toLocaleString('en-IN')}` : 'N/A';
  const displaySalePrice = !isNaN(salePrice) ? `₹${salePrice.toLocaleString('en-IN')}` : 'N/A';
  const displayProfitPerStock = !isNaN(profitPerStock)
    ? `₹${profitPerStock.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    : 'N/A';
  const displayTotalProfit = !isNaN(totalProfit)
    ? `₹${totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    : 'N/A';

  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="lg"
      bg={itemBg}
      borderColor={itemBorder}
      w="100%"
      boxShadow="sm"
    >
      <Grid
        templateColumns={isMobile ? '80px 1fr' : '80px 1.5fr 1fr 1fr auto'}
        gap={{ base: 3, md: 5 }}
        alignItems="center"
      >
        {/* --- Column 1: Image --- */}
        <GridItem colSpan={1} rowSpan={isMobile ? 2 : 1}>
          <Image
            src={item.product_image_url}
            alt={item.paper_type || 'Product Image'}
            boxSize="80px"
            objectFit="cover"
            borderRadius="md"
            fallbackSrc="https://placehold.co/80"
          />
        </GridItem>

        {/* --- Column 2: Product Name & Stock Count --- */}
        <GridItem colSpan={1} alignSelf="center">
          <Text fontWeight="bold" fontSize={{ base: 'md', md: 'lg' }} color={textColor} noOfLines={2}>
            {item.paper_type || 'Unknown Product'}
          </Text>
          <Text fontSize="sm" color={labelColor}>
            Stocks: {item.no_of_stock_bought || 0}
          </Text>
        </GridItem>

        {/* --- DESKTOP ONLY: Purchase Price Column --- */}
        {!isMobile && (
          <GridItem>
            <Text fontSize="sm" color={labelColor}>Buy Price</Text>
            <Text fontWeight="medium" color={textColor}>{displayPurchasePrice}</Text>
            <Text fontSize="xs" color={labelColor} mt={1}>
              Bought on {new Date(item.purchase_date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })}
            </Text>
          </GridItem>
        )}

        {/* --- DESKTOP ONLY: Sale Price Column --- */}
        {!isMobile && (
          <GridItem>
            <Text fontSize="sm" color={labelColor}>Sold At Price</Text>
            <Text fontWeight="medium" color={textColor}>{displaySalePrice}</Text>
            <Text fontSize="xs" color={labelColor} mt={1}>
              Sold on {new Date(item.sale_date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })}
            </Text>
          </GridItem>
        )}

        {/* --- DESKTOP ONLY: Profit/Loss Stat Column --- */}
        {!isMobile && (
          <GridItem justifySelf="end" minW="200px">
            <Stat textAlign="right">
              <Text fontSize="sm" color={labelColor}>Total Profit</Text>
              <StatNumber fontSize="lg" color={profitColor} fontWeight="bold">
                {displayTotalProfit}
              </StatNumber>
              <StatHelpText m={0} fontSize="xs" color={labelColor}>
                <StatArrow type={isProfit ? 'increase' : 'decrease'} />
                Per Stock: {displayProfitPerStock}
              </StatHelpText>
            </Stat>
          </GridItem>
        )}

                 {/* --- MOBILE ONLY: Combined Price Info --- */}
         {isMobile && (
           <GridItem colSpan={1} alignSelf="center">
             <Flex justify="space-between" align="baseline">
               <Box>
                 <Text fontSize="xs" color={labelColor}>Buy Price</Text>
                 <Text fontWeight="medium" color={textColor}>{displayPurchasePrice}</Text>
                 <Text fontSize="xs" color={labelColor} mt={1}>
                   Bought on {new Date(item.purchase_date).toLocaleDateString('en-IN', {
                     year: 'numeric',
                     month: '2-digit',
                     day: '2-digit'
                   })}
                 </Text>
               </Box>
               <Box textAlign="right">
                 <Text fontSize="xs" color={labelColor}>Sold At Price</Text>
                 <Text fontWeight="medium" color={textColor}>{displaySalePrice}</Text>
                 <Text fontSize="xs" color={labelColor} mt={1}>
                   Sold on {new Date(item.sale_date).toLocaleDateString('en-IN', {
                     year: 'numeric',
                     month: '2-digit',
                     day: '2-digit'
                   })}
                 </Text>
               </Box>
             </Flex>
           </GridItem>
         )}
      </Grid>

      {/* --- MOBILE ONLY: Profit/Loss + Dates Section --- */}
      {isMobile && (
        <Flex
          pt={4}
          mt={4}
          borderTopWidth="1px"
          borderColor={dividerColor}
          justifyContent="center"
        >
                     <Stat textAlign="center">
             <Text fontSize="sm" color={labelColor}>Total Profit</Text>
             <StatNumber fontSize="xl" color={profitColor} fontWeight="bold">
               {displayTotalProfit}
             </StatNumber>
             <StatHelpText m={0}>
               <StatArrow type={isProfit ? 'increase' : 'decrease'} />
               Per Stock: {displayProfitPerStock}
             </StatHelpText>
           </Stat>
        </Flex>
      )}
    </Box>
  );
};

export default SoldTradeItem;
