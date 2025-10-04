import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Box,
  Text,
  VStack,
  HStack,
  Button,
  useColorModeValue,
  Badge,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider
} from '@chakra-ui/react';

const SellOffersModal = ({ isOpen, onClose, onAcceptOffer, currentPrice, currentPrice2, currentPrice3, productName, stockCount }) => {
  const [step, setStep] = useState(1); // 1: Company selection, 2: Confirmation
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [offers, setOffers] = useState([]);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const companies = [
    'Paper Dis Mart',
    'S.K. Enterprises', 
    'Galaxy Super Paper',
    'Laskhmi Paper',
    'Shree Krishna Traders',
    'Shree Paper Mart',
    'Silver Distributors',
    'Premium Paper Co.',
    'Elite Traders',
    'Royal Paper Works',
    'Golden Distributors',
    'Supreme Paper Mart'
  ];

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedOffer(null);
      generateOffers();
    }
  }, [isOpen]);

  const generateOffers = () => {
    // Shuffle companies and pick 3
    const shuffledCompanies = [...companies].sort(() => Math.random() - 0.5);
    const selectedCompanies = shuffledCompanies.slice(0, 3);
    
    // Shuffle the 3 prices randomly
    const prices = [currentPrice, currentPrice2, currentPrice3];
    const shuffledPrices = [...prices].sort(() => Math.random() - 0.5);
    
    const generatedOffers = [
      { rank: 1, company: selectedCompanies[0], price: shuffledPrices[0], isTop: false },
      { rank: 2, company: selectedCompanies[1], price: shuffledPrices[1], isTop: false },
      { rank: 3, company: selectedCompanies[2], price: shuffledPrices[2], isTop: false },
    ];

    setOffers(generatedOffers);
  };

  const handleOfferSelection = (offer) => {
    setSelectedOffer(offer);
    setStep(2);
  };

  const handleConfirmSell = () => {
    if (selectedOffer) {
      onAcceptOffer(selectedOffer.price, stockCount);
      onClose();
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <VStack spacing={4}>
            <Box textAlign="center">
              <Text fontSize="lg" fontWeight="bold" color={textColor} mb={1}>
                Choose Company
              </Text>
              <Text fontSize="sm" color="gray.500">
                Selling {stockCount} units of {productName}
              </Text>
            </Box>

            <VStack spacing={3} w="full">
              {offers.map((offer, index) => (
                <Box
                  key={offer.rank}
                  w="full"
                  p={4}
                  borderRadius="md"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  cursor="pointer"
                  _hover={{
                    bg: 'blue.50',
                    borderColor: 'blue.300'
                  }}
                  transition="all 0.2s"
                  onClick={() => handleOfferSelection(offer)}
                >
                  <HStack justify="space-between" align="center" flexWrap="wrap">
                    <HStack spacing={3} minW="0" flex="1">
                      <Box
                        w="8"
                        h="8"
                        borderRadius="md"
                        bg="blue.500"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        color="white"
                        fontWeight="bold"
                        fontSize="sm"
                        flexShrink={0}
                      >
                        {index + 1}
                      </Box>
                      <Text fontWeight="medium" color="gray.700" fontSize={{ base: "sm", md: "md" }} isTruncated>
                        {offer.company}
                      </Text>
                    </HStack>
                    <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color="green.600" flexShrink={0}>
                      ₹{offer.price}
                    </Text>
                  </HStack>
                </Box>
              ))}
            </VStack>

            <Box
              bg="blue.50"
              border="1px solid"
              borderColor="blue.200"
              p={3}
              borderRadius="md"
              w="full"
            >
              <Text fontSize="sm" color="blue.700" textAlign="center">
                Click any offer to select it
              </Text>
            </Box>
          </VStack>
        );

      case 2:
        return (
          <VStack spacing={4}>
            <Box textAlign="center">
              <Text fontSize="lg" fontWeight="bold" color={textColor} mb={1}>
                Confirm Sale
              </Text>
              <Text fontSize="sm" color="gray.500">
                Review your transaction details
              </Text>
            </Box>
            
            <Box
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              p={4}
              borderRadius="md"
              w="full"
            >
              <VStack spacing={3} w="full">
                <Text fontWeight="bold" color="gray.800" fontSize="md" mb={2}>
                  Sale Summary
                </Text>
                
                <HStack justify="space-between" w="full" flexWrap="wrap">
                  <Text fontSize="sm" color="gray.600">Product:</Text>
                  <Text fontSize="sm" fontWeight="bold" color="gray.800" textAlign="right" flex="1">{productName}</Text>
                </HStack>
                
                <HStack justify="space-between" w="full" flexWrap="wrap">
                  <Text fontSize="sm" color="gray.600">Quantity:</Text>
                  <Text fontSize="sm" fontWeight="bold" color="gray.800" textAlign="right" flex="1">{stockCount} units</Text>
                </HStack>
                
                <HStack justify="space-between" w="full" flexWrap="wrap">
                  <Text fontSize="sm" color="gray.600">Company:</Text>
                  <Text fontSize="sm" fontWeight="bold" color="gray.800" textAlign="right" flex="1" isTruncated>{selectedOffer?.company}</Text>
                </HStack>
                
                <HStack justify="space-between" w="full" flexWrap="wrap">
                  <Text fontSize="sm" color="gray.600">Price per unit:</Text>
                  <Text fontSize="sm" fontWeight="bold" color="green.600" textAlign="right" flex="1">₹{selectedOffer?.price}</Text>
                </HStack>
                
                <Divider />
                
                <HStack justify="space-between" w="full" p={3} bg="green.50" borderRadius="md" flexWrap="wrap">
                  <Text fontSize={{ base: "sm", md: "md" }} fontWeight="bold" color="green.700">Total Amount:</Text>
                  <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color="green.600" textAlign="right" flex="1">
                    ₹{(selectedOffer?.price * stockCount).toFixed(2)}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "sm", md: "md" }}>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent 
        bg={bgColor} 
        borderRadius="md" 
        mx={4}
        maxW={{ base: "95%", md: "500px" }}
      >
        <ModalHeader textAlign="center" borderBottom="1px solid" borderColor={borderColor}>
          <VStack spacing={2}>
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              {step === 1 && "Choose Company"}
              {step === 2 && "Confirm Sale"}
            </Text>
            <HStack spacing={2}>
              {[1, 2].map((stepNum) => (
                <Box
                  key={stepNum}
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  bg={step >= stepNum ? "blue.500" : "gray.300"}
                />
              ))}
            </HStack>
          </VStack>
        </ModalHeader>
        
        <ModalBody py={6}>
          {renderStepContent()}
        </ModalBody>
        
        <ModalFooter>
          <HStack spacing={3} w="full">
            {step === 2 && (
              <Button
                colorScheme="gray"
                variant="outline"
                onClick={handleBack}
                flex="1"
              >
                Back
              </Button>
            )}
            {step === 2 && (
              <Button
                colorScheme="green"
                onClick={handleConfirmSell}
                flex="1"
              >
                Confirm Sell
              </Button>
            )}
            <Button
              colorScheme="gray"
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SellOffersModal;
