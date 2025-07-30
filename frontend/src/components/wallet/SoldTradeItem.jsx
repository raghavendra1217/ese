import React from 'react';
import { Flex, Image, Box, Text, Stat, StatNumber, StatHelpText, StatArrow, useColorModeValue } from '@chakra-ui/react';

const SoldTradeItem = ({ item }) => {
    // --- CONSOLE LOG FOR DEBUGGING ---
    console.log("Image URL for Sold Item:", item.product_image_url);

    const itemBg = useColorModeValue('green.50', 'rgba(46, 139, 87, 0.15)');
    const itemBorder = useColorModeValue('green.200', 'green.400');

    // --- Robust Data Handling ---
    const purchasePrice = parseFloat(item.purchase_price);
    const salePrice = parseFloat(item.sale_price);

    const displayPurchasePrice = !isNaN(purchasePrice)
        ? `₹${purchasePrice.toLocaleString('en-IN')}`
        : 'N/A';
    
    const displaySalePrice = !isNaN(salePrice)
        ? `₹${salePrice.toLocaleString('en-IN')}`
        : 'N/A';

    const profitPerStock = !isNaN(purchasePrice) && !isNaN(salePrice)
        ? salePrice - purchasePrice
        : NaN;

    const displayProfit = !isNaN(profitPerStock)
        ? `₹${profitPerStock.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        : 'N/A';

    return (
        <Flex align="center" mb={4} p={4} borderWidth="1px" borderRadius="md" bg={itemBg} borderColor={itemBorder}>
            <Image 
                src={item.product_image_url} 
                alt={item.paper_type || 'Product Image'} 
                boxSize="80px" 
                objectFit="cover" 
                borderRadius="md" 
                mr={4}
                fallbackSrc="https://placehold.co/80" 
            />
            <Box flex="1">
                <Text fontWeight="bold" fontSize="lg">{item.paper_type || 'Unknown Product'}</Text>
                <Text fontSize="sm">Stocks: {item.no_of_stock_bought || 0}</Text>
                <Text fontSize="sm">Purchase Price: {displayPurchasePrice}</Text>
                <Text fontSize="sm" fontWeight="bold">Sale Price: {displaySalePrice}</Text>
            </Box>
            <Stat textAlign="right">
                <StatNumber color={!isNaN(profitPerStock) && profitPerStock >= 0 ? 'green.500' : 'red.500'}>
                    {displayProfit}
                </StatNumber>
                <StatHelpText>
                    {!isNaN(profitPerStock) && <StatArrow type={profitPerStock >= 0 ? 'increase' : 'decrease'} />}
                    Profit/Loss per Stock
                </StatHelpText>
            </Stat>
        </Flex>
    );
};

export default SoldTradeItem;