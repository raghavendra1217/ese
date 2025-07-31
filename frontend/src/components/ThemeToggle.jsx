// src/components/ThemeToggle.jsx

import React from 'react';
import { IconButton, useColorMode } from '@chakra-ui/react';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';

const ThemeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <IconButton
      aria-label="Toggle color mode"
      icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
      onClick={toggleColorMode}
      variant="ghost"
      color="gray.400"
      w="full"
      py={6}
      _hover={{ bg: 'gray.700', color: 'white' }}
    />
  );
};

export default ThemeToggle;
