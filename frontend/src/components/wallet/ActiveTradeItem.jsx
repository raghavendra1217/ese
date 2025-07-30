import React from 'react';
import { Flex, Image, Box, Text, Button, useColorModeValue } from '@chakra-ui/react';
import CountdownButton from './CountdownButton';

const ActiveTradeItem = ({ item, onSell, isSelling }) => {
    // --- CONSOLE LOG FOR DEBUGGING ---
    console.log("Image URL for Active Item:", item.product_image_url);

    const itemBg = useColorModeValue('gray.50', 'gray.800');
    
    // --- Robust Data Handling ---
    const purchasePrice = parseFloat(item.purchase_price);
    const displayPurchasePrice = !isNaN(purchasePrice)
        ? `₹${purchasePrice.toLocaleString('en-IN')}`
        : 'N/A';

    const currentSellingPrice = parseFloat(item.current_selling_price);
    const displayCurrentSellingPrice = !isNaN(currentSellingPrice)
        ? `₹${currentSellingPrice.toLocaleString('en-IN')}`
        : 'N/A';
    
    // Precise 8-day lock logic
    const purchaseTimestamp = new Date(item.purchase_date).getTime();
    const eightDaysInMilliseconds = 8 * 24 * 60 * 60 * 1000;
    const unlockDate = new Date(purchaseTimestamp + eightDaysInMilliseconds);
    const isLocked = new Date() < unlockDate;

    return (
        <Flex align="center" mb={4} p={4} borderWidth="1px" borderRadius="md" bg={itemBg}>
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
                <Text fontSize="sm">Purchase Price/Stock: {displayPurchasePrice}</Text>
                <Text fontSize="sm" color="gray.500">Purchased On: {new Date(item.purchase_date).toLocaleDateString('en-GB')}</Text>
            </Box>
            <Box textAlign="right" mr={4}>
                <Text fontSize="sm">Current Price/Stock</Text>
                <Text fontWeight="bold" color="blue.400">{displayCurrentSellingPrice}</Text>
            </Box>
            
            {isLocked ? (
                <CountdownButton unlockDate={unlockDate} />
            ) : (
                <Button 
                    colorScheme="teal" 
                    onClick={() => onSell(item)} 
                    isLoading={isSelling === item.trade_id} 
                    loadingText="Selling"
                    w="180px"
                >
                    Sell Now
                </Button>
            )}
        </Flex>
    );
};

export default ActiveTradeItem;