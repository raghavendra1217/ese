import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Spinner,
  VStack,
  HStack,
  Avatar,
  Tag,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Thead,
  Tr,
  Th,
  Td,
  Tbody,
  TableContainer,
  useColorModeValue,
  Badge,
  Button,
  Flex,
  Center,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  IconButton,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../AppContext';
import CoordinatorNavBar, { NAV_WIDTH } from '../../components/layout/CoordinatorNavBar';
import AdminReferralTree from '../../components/admin/AdminReferralTree';
import { formatISTDate } from '../../utils/dateUtils';

const CoordinatorVendorProfile = ({ url }) => {
  const { id } = useParams();
  const { token } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${url}/api/admin/vendor-profile/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid content-type: expected application/json');
        }

        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchProfile();
  }, [id, url, token]);

  if (loading) {
    return (
      <Flex minH="100vh" bg={pageBg}>
        {/* Desktop sidebar */}
        <CoordinatorNavBar variant="static" />
        <Box flex="1" ml={{ base: 0, md: NAV_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
          <Center h="60vh">
            <Spinner size="xl" />
          </Center>
        </Box>
      </Flex>
    );
  }

  if (!profile) {
    return (
      <Flex minH="100vh" bg={pageBg}>
        {/* Desktop sidebar */}
        <CoordinatorNavBar variant="static" />
        <Box flex="1" ml={{ base: 0, md: NAV_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
          {/* Mobile header */}
          <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
            <IconButton
              aria-label="Open menu"
              icon={<HamburgerIcon w={5} h={5} />}
              onClick={onOpen}
              size="sm"
              variant="ghost"
            />
            <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">
              Vendor Profile
            </Heading>
          </Flex>

          <Text color="red.500">Profile not found or an error occurred.</Text>

          {/* Mobile Drawer */}
          <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
            <DrawerOverlay />
            <DrawerContent>
              <CoordinatorNavBar variant="drawer" onClose={onClose} />
            </DrawerContent>
          </Drawer>
        </Box>
      </Flex>
    );
  }

  const { vendor, wallet, trades, transactions, referrals } = profile;

  return (
    <Flex minH="100vh" bg={pageBg}>
      {/* Desktop sidebar (md and up) */}
      <CoordinatorNavBar variant="static" />
      
      <Box flex="1" ml={{ base: 0, md: NAV_WIDTH }} p={{ base: 4, sm: 6, md: 8 }}>
        {/* Mobile header */}
        <Flex align="center" gap={2} mb={4} display={{ base: 'flex', md: 'none' }}>
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon w={5} h={5} />}
            onClick={onOpen}
            size="sm"
            variant="ghost"
          />
          <Heading as="h1" fontSize="lg" color={headingColor} lineHeight="1.2">
            Vendor Profile
          </Heading>
        </Flex>

        {/* Desktop header */}
        <Flex align="center" gap={4} mb={6} display={{ base: 'none', md: 'flex' }}>
          <Heading as="h1" fontSize="2xl" color={headingColor} lineHeight="1.2">
            Vendor Profile
          </Heading>
        </Flex>

        <VStack spacing={{ base: 4, md: 8 }} align="stretch">
          <Button
            as={RouterLink}
            to="/coordinator/all-vendors"
            alignSelf="flex-start"
            colorScheme="blue"
            variant="outline"
          >
            ← Back to All Vendors
          </Button>

          {/* Vendor Info */}
          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
            <HStack spacing={6} align="start">
              <Avatar src={vendor.passport_photo_url} size="lg" />
              <VStack align="start" spacing={1}>
                <Text fontSize="xl" fontWeight="bold">
                  {vendor.vendor_name}
                </Text>
                <Text>Email: {vendor.email}</Text>
                <Text>Phone: {vendor.phone_number || '—'}</Text>
                <Text>Aadhar: {vendor.aadhar_number || '—'}</Text>
                <Text>PAN: {vendor.pan_card_number || '—'}</Text>
                <Text>
                  Bank: {vendor.bank_name || '—'}{' '}
                  {vendor.account_number ? `(${vendor.account_number})` : ''}
                </Text>
                <Text>IFSC: {vendor.ifsc_code || '—'}</Text>
                {vendor.address && <Text>Address: {vendor.address}</Text>}
              </VStack>
            </HStack>
          </Box>

          {/* Wallet Overview */}
          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
            <Heading size="md" mb={4}>Wallet Overview</Heading>
            <HStack spacing={8}>
              <Stat>
                <StatLabel>Balance</StatLabel>
                <StatNumber color="green.500">
                  ₹{Number.parseFloat(wallet.digital_money || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Commission %</StatLabel>
                <StatNumber>
                  {wallet.percentage !== null ? `${wallet.percentage}%` : 'N/A'}
                </StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Last Updated</StatLabel>
                <StatNumber fontSize="sm">
                  {wallet.last_updated_on ? formatISTDate(wallet.last_updated_on) : 'Never'}
                </StatNumber>
              </Stat>
            </HStack>
          </Box>

          {/* Recent Transactions */}
          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
            <Heading size="md" mb={4}>Recent Transactions</Heading>
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Type</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {transactions.slice(0, 10).map((tx) => (
                    <Tr key={tx.id}>
                      <Td>{formatISTDate(tx.created_at)}</Td>
                      <Td>
                        <Tag size="sm" colorScheme="blue">
                          {tx.transaction_type}
                        </Tag>
                      </Td>
                      <Td>₹{Number.parseFloat(tx.amount || 0).toLocaleString('en-IN')}</Td>
                      <Td>
                        <Badge colorScheme={tx.status === 'approved' ? 'green' : 'yellow'}>
                          {tx.status}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>

          {/* Recent Trades */}
          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
            <Heading size="md" mb={4}>Recent Trades</Heading>
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Product</Th>
                    <Th>Quantity</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {trades.slice(0, 10).map((trade) => (
                    <Tr key={trade.id}>
                      <Td>{formatISTDate(trade.date)}</Td>
                      <Td>{trade.paper_type}</Td>
                      <Td>{trade.quantity}</Td>
                      <Td>₹{Number.parseFloat(trade.total_amount_paid || 0).toLocaleString('en-IN')}</Td>
                      <Td>
                        <Badge colorScheme={trade.is_approved === 'approved' ? 'green' : 'yellow'}>
                          {trade.is_approved}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>

          {/* Referral Tree */}
          {referrals && referrals.length > 0 && (
            <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={5}>
              <Heading size="md" mb={4}>Referral Tree</Heading>
              <AdminReferralTree referrals={referrals} />
            </Box>
          )}
        </VStack>

        {/* Mobile Drawer */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <CoordinatorNavBar variant="drawer" onClose={onClose} />
          </DrawerContent>
        </Drawer>
      </Box>
    </Flex>
  );
};

export default CoordinatorVendorProfile;
