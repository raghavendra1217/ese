import React, { useEffect, useMemo, useState } from 'react';
import { formatISTDate } from '../../utils/dateUtils';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Tag,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Spinner,
  Center,
  Button,
} from '@chakra-ui/react';
import { Search2Icon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(value);

const getTagColor = (type) => {
  switch (type) {
    case 'sale':
    case 'deposit':
    case 'commission_claim':
    case 'referral_bonus':
      return 'green';
    case 'purchase':
    case 'withdrawal':
      return 'red';
    default:
      return 'gray';
  }
};

const RecentActivityPage = ({ url }) => {
  const { token } = useAuth();
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  const [data, setData] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      if (!token) return;
      setLoading(true);
      setErr('');
      try {
        // Ask for more (backend may ignore query params; that's fine)
        const res = await fetch(`${url}/api/vendor/dashboard/recent-activity?limit=500`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || 'Failed to fetch activity');
        // If backend doesn’t support limit, we still get what it returns
        setData(Array.isArray(json) ? json : []);
      } catch (e) {
        setErr(e.message || 'Failed to fetch activity');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token, url]);

  const filtered = useMemo(() => {
    if (!q) return data;
    const term = q.toLowerCase();
    return data.filter((tx) => {
      const type = String(tx.transaction_type || '').toLowerCase();
      const desc = String(tx.description || '').toLowerCase();
      const id = String(tx.trans_id || '').toLowerCase();
      const date = tx.created_at ? formatISTDate(tx.created_at, true, true).toLowerCase() : '';
      const amount = (tx.amount != null ? String(tx.amount) : '').toLowerCase();
      const upi = String(tx.upi_transaction_id || '').toLowerCase();
      return (
        type.includes(term) ||
        desc.includes(term) ||
        id.includes(term) ||
        date.includes(term) ||
        amount.includes(term) ||
        upi.includes(term)
      );
    });
  }, [data, q]);

  return (
    <Box p={{ base: 4, md: 6 }}>
      <Heading size="lg" mb={4}>
        Recent Activity
      </Heading>

      <InputGroup maxW="420px" mb={4}>
        <InputLeftElement pointerEvents="none">
          <Search2Icon color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Search by type, amount, date, UPI ID or description…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          variant="filled"
        />
      </InputGroup>

      {loading ? (
        <Center py={16}>
          <Spinner size="xl" />
        </Center>
      ) : err ? (
        <Center py={8}>
          <Text color="red.500">{err}</Text>
        </Center>
      ) : filtered.length === 0 ? (
        <Center py={8}>
          <Text>No matching activity.</Text>
        </Center>
      ) : (
        <VStack spacing={3} align="stretch">
          {filtered.map((tx) => (
            <HStack
              key={tx.trans_id}
              justify="space-between"
              p={3}
              borderRadius="md"
              _hover={{ bg: hoverBg }}
            >
              <Box>
                <HStack spacing={2}>
                  <Tag colorScheme={getTagColor(tx.transaction_type)} size="sm">
                    {String(tx.transaction_type || '').replace(/_/g, ' ').toUpperCase()}
                  </Tag>
                  <Text fontSize="sm" color="gray.500">
                    {tx.created_at ? formatISTDate(tx.created_at, true, true) : '—'}
                  </Text>
                </HStack>
                {tx.description && (
                  <Text mt={1} fontSize="sm" color="gray.600">
                    {tx.description}
                  </Text>
                )}
              </Box>
              <Text fontWeight="bold" color={tx.amount > 0 ? 'green.500' : 'red.500'}>
                {formatCurrency(tx.amount || 0)}
              </Text>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default RecentActivityPage;
