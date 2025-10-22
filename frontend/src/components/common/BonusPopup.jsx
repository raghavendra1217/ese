import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  Image
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { FaCoins, FaGift, FaStar } from 'react-icons/fa';

// Party shower animation keyframes
const confettiAnimation = keyframes`
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
`;

const bounceAnimation = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-30px);
  }
  60% {
    transform: translateY(-15px);
  }
`;

const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
`;

const BonusPopup = ({ isOpen, onClose, bonusAmount, daysHeld }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const accentColor = useColorModeValue('green.500', 'green.300');
  
  useEffect(() => {
    if (isOpen && bonusAmount > 0) {
      setShowConfetti(true);
      // Stop confetti after 3 seconds
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, bonusAmount]);

  // Generate confetti pieces
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)]
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent bg={bgColor} borderRadius="xl" overflow="hidden">
        <ModalBody p={8}>
          {/* Confetti Animation */}
          {showConfetti && (
            <Box position="absolute" top={0} left={0} right={0} bottom={0} pointerEvents="none">
              {confettiPieces.map((piece) => (
                <Box
                  key={piece.id}
                  position="absolute"
                  left={`${piece.left}%`}
                  top="-10px"
                  w="8px"
                  h="8px"
                  bg={piece.color}
                  borderRadius="50%"
                  animation={`${confettiAnimation} 3s linear infinite`}
                  style={{
                    animationDelay: `${piece.delay}s`,
                    transform: `rotate(${Math.random() * 360}deg)`
                  }}
                />
              ))}
            </Box>
          )}

          <VStack spacing={6} align="center">
            {/* Celebration Icon */}
            <Box
              animation={`${bounceAnimation} 2s infinite`}
              position="relative"
            >
              <Icon
                as={FaGift}
                boxSize={16}
                color={accentColor}
                filter="drop-shadow(0 0 10px rgba(0,0,0,0.3))"
              />
              <Box
                position="absolute"
                top="-5px"
                right="-5px"
                animation={`${pulseAnimation} 1.5s infinite`}
              >
                <Icon as={FaStar} boxSize={6} color="yellow.400" />
              </Box>
            </Box>

            {/* Bonus Message */}
            <VStack spacing={3} textAlign="center">
              <Text
                fontSize="2xl"
                fontWeight="bold"
                color={accentColor}
                animation={`${pulseAnimation} 2s infinite`}
              >
                🎉 BONUS EARNED! 🎉
              </Text>
              
              <Text fontSize="lg" color={textColor} fontWeight="medium">
                You held your product for <Text as="span" color={accentColor} fontWeight="bold">{daysHeld} days</Text>
              </Text>
              
              <HStack spacing={2} align="center">
                <Icon as={FaCoins} color="yellow.500" boxSize={6} />
                <Text fontSize="3xl" fontWeight="bold" color="yellow.500">
                  +₹{bonusAmount}
                </Text>
              </HStack>
              
              <Text fontSize="sm" color="gray.500" textAlign="center" maxW="300px">
                Extra bonus for holding your product beyond day 8!
                You earned up to ₹2 per stock as a reward for your patience (₹1 on day 9, ₹2 maximum thereafter).
              </Text>
            </VStack>

            {/* Celebration Emojis */}
            <HStack spacing={4} fontSize="2xl">
              <Text animation={`${bounceAnimation} 1s infinite`} style={{ animationDelay: '0s' }}>🎊</Text>
              <Text animation={`${bounceAnimation} 1s infinite`} style={{ animationDelay: '0.2s' }}>💰</Text>
              <Text animation={`${bounceAnimation} 1s infinite`} style={{ animationDelay: '0.4s' }}>🎉</Text>
              <Text animation={`${bounceAnimation} 1s infinite`} style={{ animationDelay: '0.6s' }}>🏆</Text>
              <Text animation={`${bounceAnimation} 1s infinite`} style={{ animationDelay: '0.8s' }}>🎊</Text>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default BonusPopup;
