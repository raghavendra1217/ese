import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  useToast,
  Spinner,
  Center,
  Button,
  Badge,
  Collapse
} from '@chakra-ui/react';
import { 
  FaSeedling, 
  FaUser, 
  FaChevronDown, 
  FaChevronRight,
  FaTree,
  FaNetworkWired,
  FaUsers
} from 'react-icons/fa';
import { useAuth } from '../../AppContext';

// Individual Referral Node Component
const ReferralNode = ({ referral, level = 0, isExpanded, onToggle, expandedNodes, isRoot = false }) => {
  const textColor = useColorModeValue('gray.800', 'white');
  const rootColor = useColorModeValue('blue.500', 'blue.300');
  const connectorColor = useColorModeValue('gray.300', 'gray.600');

  // Better level-based colors
  const levelColors = [
    useColorModeValue('blue.50', 'blue.900'),      // Level 1 - Blue
    useColorModeValue('green.50', 'green.900'),   // Level 2 - Green
    useColorModeValue('purple.50', 'purple.900'),  // Level 3 - Purple
    useColorModeValue('orange.50', 'orange.900'), // Level 4 - Orange
    useColorModeValue('red.50', 'red.900'),        // Level 5 - Red
    useColorModeValue('teal.50', 'teal.900'),      // Level 6 - Teal
    useColorModeValue('pink.50', 'pink.900')       // Level 7 - Pink
  ];

  const levelBorderColors = [
    useColorModeValue('blue.300', 'blue.600'),
    useColorModeValue('green.300', 'green.600'),
    useColorModeValue('purple.300', 'purple.600'),
    useColorModeValue('orange.300', 'orange.600'),
    useColorModeValue('red.300', 'red.600'),
    useColorModeValue('teal.300', 'teal.600'),
    useColorModeValue('pink.300', 'pink.600')
  ];

  const levelBadgeColors = [
    'blue', 'green', 'purple', 'orange', 'red', 'teal', 'pink'
  ];

  // Font sizes that decrease as level increases
  const levelFontSizes = [
    'sm',    // Level 1
    'sm',    // Level 2
    'xs',    // Level 3
    'xs',    // Level 4
    'xs',    // Level 5
    'xs',    // Level 6
    'xs'     // Level 7
  ];

  const hasChildren = referral.children && referral.children.length > 0;
  const canExpand = hasChildren && level < 7; // Max level 7
  
  const currentLevelColor = levelColors[Math.min(level, levelColors.length - 1)];
  const currentLevelBorderColor = levelBorderColors[Math.min(level, levelBorderColors.length - 1)];
  const currentLevelBadgeColor = levelBadgeColors[Math.min(level, levelBadgeColors.length - 1)];
  const currentFontSize = levelFontSizes[Math.min(level, levelFontSizes.length - 1)];

  return (
    <Box position="relative">
      {/* Main Referral Card */}
      <Box
        p={4}
        bg={isRoot ? rootColor : currentLevelColor}
        color={isRoot ? 'white' : textColor}
        border="2px solid"
        borderColor={isRoot ? 'blue.600' : currentLevelBorderColor}
        borderRadius="xl"
        boxShadow="md"
        transition="all 0.3s ease"
        position="relative"
        zIndex={10}
        display="flex"
        alignItems="center"
        gap={4}
        _hover={{ 
          transform: 'translateY(-2px)',
          boxShadow: 'lg',
          borderColor: isRoot ? 'blue.400' : currentLevelBorderColor
        }}
        cursor={canExpand ? "pointer" : "default"}
        onClick={() => canExpand && onToggle(referral.id)}
      >
        <Box fontSize="2xl" color={isRoot ? 'white' : currentLevelBadgeColor}>
          <FaUser />
        </Box>
        
        <Box flexGrow={1}>
          <Text fontWeight="600" fontSize={currentFontSize} lineHeight={1}>
            {referral.name}
          </Text>
        </Box>
        
        {/* Only show referral count if it's greater than 0 */}
        {!isRoot && (referral.referralCount || 0) > 0 && (
          <Badge 
            colorScheme={currentLevelBadgeColor}
            variant="solid"
            fontSize="sm"
            px={3}
            py={2}
            borderRadius="full"
            display="flex"
            alignItems="center"
            gap={2}
          >
            <FaUsers size={16} />
            {referral.referralCount || 0}
          </Badge>
        )}

        {canExpand && (
          <Box color={isRoot ? 'white' : currentLevelBadgeColor}>
            {isExpanded ? (
              <FaChevronDown size={12} />
            ) : (
              <FaChevronRight size={12} />
            )}
          </Box>
        )}
      </Box>

      {/* Recursive Children */}
      {canExpand && (
        <Collapse in={isExpanded} animateOpacity>
          <Box mt={4} pl={8} position="relative">
            <Box
              position="absolute"
              left="0"
              top="0"
              w="2px"
              h="100%"
              bg={connectorColor}
            />
            
            <VStack spacing={4} align="stretch">
              {referral.children.map((child, index) => (
                <Box key={child.id || index} position="relative">
                  <Box
                    position="absolute"
                    left="-8px"
                    top="50%"
                    w="8px"
                    h="2px"
                    bg={connectorColor}
                  />
                  
                  <ReferralNode
                    referral={child}
                    level={level + 1}
                    isExpanded={expandedNodes.has(child.id)}
                    onToggle={onToggle}
                    expandedNodes={expandedNodes}
                  />
                </Box>
              ))}
            </VStack>
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

// Main ReferralTree Component
const ReferralTree = ({ url }) => {
  const { token } = useAuth();
  const toast = useToast();
  const [treeData, setTreeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [isAllExpanded, setIsAllExpanded] = useState(false);

  const treeBg = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('blue.200', 'blue.700');
  const connectorColor = useColorModeValue('gray.300', 'gray.600');

  useEffect(() => {
    fetchReferralTree();
  }, [token, url]);

  const fetchReferralTree = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${url}/api/vendor/referral-tree`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch referral tree');
      }
      
      const data = await response.json();
      setTreeData(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const toggleAll = () => {
    if (isAllExpanded) {
      setExpandedNodes(new Set());
      setIsAllExpanded(false);
    } else {
      if (!treeData) return;
      const allNodeIds = new Set();
      const collectNodeIds = (node) => {
        if (node.children && node.children.length > 0) {
          allNodeIds.add(node.id);
          node.children.forEach(collectNodeIds);
        }
      };
      collectNodeIds(treeData);
      setExpandedNodes(allNodeIds);
      setIsAllExpanded(true);
    }
  };

  // Calculate direct and indirect referrals
  const calculateReferralStats = (node) => {
    let direct = 0;
    let indirect = 0;
    
    if (node.children && node.children.length > 0) {
      direct = node.children.length;
      node.children.forEach(child => {
        const childStats = calculateReferralStats(child);
        indirect += childStats.direct + childStats.indirect;
      });
    }
    
    return { direct, indirect };
  };

  if (isLoading) {
    return (
      <Center p={8}>
        <VStack spacing={4}>
          <Spinner size="lg" color="blue.500" />
          <Text>Loading your referral network...</Text>
        </VStack>
      </Center>
    );
  }

  if (!treeData) {
    return (
      <Center p={8}>
        <VStack spacing={4}>
          <FaSeedling size={48} color="blue" />
          <Text color="gray.500">No referral data available</Text>
          <Button onClick={fetchReferralTree} colorScheme="blue" leftIcon={<FaSeedling />}>
            Refresh
          </Button>
        </VStack>
      </Center>
    );
  }

  const { direct: directReferrals, indirect: indirectReferrals } = calculateReferralStats(treeData);

  return (
    <Box p={6} bg={treeBg} borderRadius="2xl" boxShadow="xl" border="2px solid" borderColor={borderColor}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Center>
          <VStack spacing={2} textAlign="center">
            <HStack spacing={3}>
              <FaTree color="#3182CE" size={24} />
              <Text fontSize="2xl" fontWeight="bold" color="blue.700">
                Multi-Level Referral Network
              </Text>
              <FaTree color="#3182CE" size={24} />
            </HStack>
            <Text color="blue.600">
              {directReferrals + indirectReferrals} total referrals across all levels
            </Text>
          </VStack>
        </Center>

        {/* Stats */}
        <Box p={4} bg="white" borderRadius="xl" border="2px solid" borderColor={borderColor} textAlign="center">
          <HStack justify="space-around" wrap="wrap" spacing={4}>
            <VStack>
              <Text fontSize="xl" fontWeight="bold" color="green.500">{directReferrals}</Text>
              <Text color="gray.600" fontSize="sm">Direct Referrals</Text>
            </VStack>
            <VStack>
              <Text fontSize="xl" fontWeight="bold" color="purple.500">{indirectReferrals}</Text>
              <Text color="gray.600" fontSize="sm">Indirect Referrals</Text>
            </VStack>
          </HStack>
        </Box>

        {/* Control Panel */}
        <Box p={4} bg="white" borderRadius="xl" border="2px solid" borderColor={borderColor}>
          <Center>
            <Button 
              onClick={toggleAll} 
              colorScheme={isAllExpanded ? "red" : "blue"} 
              variant="outline" 
              size="sm" 
              leftIcon={isAllExpanded ? <FaChevronRight /> : <FaChevronDown />}
            >
              {isAllExpanded ? 'Collapse All' : 'Expand All'}
            </Button>
          </Center>
        </Box>

        {/* Tree Container */}
        <Box bg="white" p={6} borderRadius="xl" border="2px solid" borderColor={borderColor} minH="400px">
          <ReferralNode
            referral={treeData}
            level={0}
            isExpanded={true}
            onToggle={toggleNode}
            expandedNodes={expandedNodes}
            isRoot={true}
          />
        </Box>

        <Center>
          <Button onClick={fetchReferralTree} colorScheme="blue" leftIcon={<FaNetworkWired />}>
            Refresh Tree
          </Button>
        </Center>
      </VStack>
    </Box>
  );
};

export default ReferralTree;
