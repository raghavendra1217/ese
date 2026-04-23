import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Avatar,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Center,
  useColorModeValue,
} from '@chakra-ui/react';
import { Search2Icon } from '@chakra-ui/icons';
import { useAuth } from '../../AppContext';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value || 0);

const MyReferralsPage = ({ url }) => {
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
        const res = await fetch(`${url}/api/vendor/dashboard/my-referrals`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || 'Failed to fetch referrals');
        setData(Array.isArray(json) ? json : []);
      } catch (e) {
        setErr(e.message || 'Failed to fetch referrals');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token, url]);

  const filtered = useMemo(() => {
    if (!q) return data;
    const term = q.toLowerCase();
    return data.filter((r) => {
      const name = String(r.name || '').toLowerCase();
      const total = String(r.totalSpent || '').toLowerCase();
      const count = String(r.purchaseCount || '').toLowerCase();
      // If your API includes email/id later, these lines will start matching automatically:
      const email = String(r.email || '').toLowerCase();
      const id = String(r.id || '').toLowerCase();
      return name.includes(term) || total.includes(term) || count.includes(term) || email.includes(term) || id.includes(term);
    });
  }, [data, q]);

  return (
    <Box p={{ base: 4, md: 6 }}>
      <Heading size="lg" mb={2}>My Referrals</Heading>
      <Text color="gray.500" mb={4}>Total referrals: <b>{data.length}</b></Text>

      <InputGroup maxW="420px" mb={4}>
        <InputLeftElement pointerEvents="none">
          <Search2Icon color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Search by name, amount, purchases…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          variant="filled"
        />
      </InputGroup>

      {loading ? (
        <Center py={16}><Spinner size="xl" /></Center>
      ) : err ? (
        <Center py={8}><Text color="red.500">{err}</Text></Center>
      ) : filtered.length === 0 ? (
        <Center py={8}><Text>No matching referrals.</Text></Center>
      ) : (
        <VStack spacing={3} align="stretch">
          {filtered.map((ref, idx) => (
            <HStack
              key={`${ref.name}-${idx}`}
              justify="space-between"
              p={3}
              borderRadius="md"
              _hover={{ bg: hoverBg }}
            >
              <HStack>
                <Avatar name={ref.name} size="sm" />
                <Text fontWeight="medium">{ref.name}</Text>
              </HStack>
              <VStack align="flex-end" spacing={0}>
                <Text fontWeight="bold" color="green.500">{formatCurrency(ref.totalSpent)}</Text>
                <Text fontSize="xs" color="gray.500">{ref.purchaseCount || 0} purchases</Text>
              </VStack>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default MyReferralsPage;
