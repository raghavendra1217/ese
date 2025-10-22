// src/components/your-folder/ActiveTradeItem.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Flex,
    Image,
    Box,
    Text,
    Button,
    useColorModeValue,
    Grid,
    GridItem,
} from '@chakra-ui/react';
import CountdownDisplay from './CountdownDisplay'; // <-- Import the new component
import useWindowDimensions from '../../hooks/useWindowDimensions';
import { useAuth } from '../../AppContext';

const ActiveTradeItem = ({ item, onSell, isSelling, onRefresh }) => {
    const { width } = useWindowDimensions();
    const { token } = useAuth();
    const isMobile = width < 768;

    // --- Style Values ---
    const itemBg = useColorModeValue('gray.50', 'gray.700');
    const textColor = useColorModeValue('gray.800', 'whiteAlpha.900');
    const labelColor = useColorModeValue('gray.500', 'gray.400');
    const priceColor = useColorModeValue('blue.600', 'blue.400');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // --- Data Formatting ---
    const purchasePrice = parseFloat(item.purchase_price);
    const displayPurchasePrice = !isNaN(purchasePrice) ? `₹${purchasePrice.toLocaleString('en-IN')}` : 'N/A';
    const currentSellingPrice = parseFloat(item.current_selling_price);
    const displayCurrentSellingPrice = !isNaN(currentSellingPrice) ? `₹${currentSellingPrice.toLocaleString('en-IN')}` : 'N/A';

    // Simplified: Just use the backend data directly
    const isLockedByApi = item.is_locked;
    const unlockTimestamp = parseInt(item.unlock_timestamp_utc, 10);

    // Background API polling for locked items
    useEffect(() => {
        if (!isLockedByApi || !onRefresh) return;

        // Calculate time until unlock
        const timeUntilUnlock = unlockTimestamp - Date.now();
        
        // If already unlocked, refresh immediately
        if (timeUntilUnlock <= 0) {
            onRefresh();
            return;
        }

        // Set up polling intervals
        const shortInterval = Math.min(timeUntilUnlock, 30000); // Poll every 30 seconds max
        const longInterval = Math.min(timeUntilUnlock, 300000); // Poll every 5 minutes max

        // Immediate refresh if close to unlock (within 1 minute)
        if (timeUntilUnlock <= 60000) {
            const immediateTimer = setTimeout(() => {
                onRefresh();
            }, timeUntilUnlock + 1000); // Refresh 1 second after unlock time

            return () => clearTimeout(immediateTimer);
        }

        // Short interval polling for items close to unlock
        if (timeUntilUnlock <= 300000) { // Within 5 minutes
            const timer = setInterval(() => {
                onRefresh();
            }, shortInterval);

            return () => clearInterval(timer);
        }

        // Long interval polling for items far from unlock
        const timer = setInterval(() => {
            onRefresh();
        }, longInterval);

        return () => clearInterval(timer);
    }, [isLockedByApi, unlockTimestamp, onRefresh]);
    
    // --- Simplified action button logic ---
    const renderActionButton = () => {
        // If API says it's unlocked, show sell button
        if (!isLockedByApi) {
            return (
                <Button 
                    colorScheme="teal" 
                    onClick={() => onSell(item)} 
                    isLoading={isSelling === item.trade_id} 
                    loadingText="Selling" 
                    w={{ base: '100%', md: '180px' }}
                >
                    Sell Now
                </Button>
            );
        }

        // If API says it's locked, show countdown
        return <CountdownDisplay unlockTimestamp={unlockTimestamp} />;
    };

    return (
        <Box p={4} borderWidth="1px" borderRadius="lg" bg={itemBg} w="100%" boxShadow="sm">
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

                {/* --- DESKTOP ONLY: Purchase Info Column --- */}
                {!isMobile && (
                    <GridItem>
                        <Text fontSize="sm" color={labelColor}>Purchase Price</Text>
                        <Text fontWeight="medium" color={textColor}>{displayPurchasePrice}</Text>
                        <Text fontSize="xs" color={labelColor}>
                            {new Date(item.purchase_date).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                            })}
                        </Text>
                    </GridItem>
                )}
                
                {/* --- DESKTOP ONLY: Current Price Column --- */}
                {!isMobile && (
                    <GridItem textAlign="right">
                        <Text fontSize="sm" color={labelColor}>Current Price</Text>
                        <Text fontWeight="bold" fontSize="lg" color={priceColor}>
                            {displayCurrentSellingPrice}
                        </Text>
                    </GridItem>
                )}

                {/* --- DESKTOP ONLY: Action Button Column --- */}
                {!isMobile && (
                    <GridItem justifySelf="end" minW="180px">
                        {renderActionButton()}
                    </GridItem>
                )}

                {/* --- MOBILE ONLY: Combined Price Info --- */}
                {isMobile && (
                    <GridItem colSpan={1} alignSelf="center">
                        <Flex justify="space-between" align="baseline">
                            <Box>
                                <Text fontSize="xs" color={labelColor}>Purchase</Text>
                                <Text fontWeight="medium" color={textColor}>{displayPurchasePrice}</Text>
                            </Box>
                            <Box textAlign="right">
                                <Text fontSize="xs" color={labelColor}>Current</Text>
                                <Text fontWeight="bold" color={priceColor}>{displayCurrentSellingPrice}</Text>
                            </Box>
                        </Flex>
                    </GridItem>
                )}
            </Grid>

            {/* --- MOBILE ONLY: Action Button Section with Divider --- */}
            {isMobile && (
                <Flex pt={4} mt={4} borderTopWidth="1px" borderColor={borderColor} justifyContent="center">
                    {renderActionButton()}
                </Flex>
            )}
        </Box>
    );
};

export default ActiveTradeItem;