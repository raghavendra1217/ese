import React from 'react';
import { Flex, InputGroup, InputLeftElement, Input, IconButton, Text, useColorModeValue } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FaRegUserCircle, FaChartBar } from 'react-icons/fa';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { HiOutlineMail } from 'react-icons/hi';

const DashboardHeader = () => {
    const cardBg = useColorModeValue('white', 'gray.700');

    return (
        <Flex justify="space-between" align="center" mb={8}>
            <InputGroup w={{ base: '100%', md: 'sm' }}>
                <InputLeftElement pointerEvents="none" children={<SearchIcon color="gray.400" />} />
                <Input type="text" placeholder="Search..." bg={cardBg} borderRadius="md" />
            </InputGroup>
            <Flex align="center" gap={4}>
                <IconButton variant="ghost" aria-label="Mail" icon={<HiOutlineMail size={24} />} />
                <IconButton variant="ghost" aria-label="Notifications" icon={<IoMdNotificationsOutline size={24} />} />
                <IconButton variant="ghost" aria-label="Analytics" icon={<FaChartBar size={20} />} />
                <Flex align="center" gap={2}>
                    <FaRegUserCircle size={28} />
                    <Text fontWeight="semibold" display={{ base: 'none', sm: 'block' }}>Hello, admin</Text>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default DashboardHeader;