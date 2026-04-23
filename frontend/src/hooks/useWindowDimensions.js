// src/hooks/useWindowDimensions.js

import { useState, useEffect } from 'react';

/**
 * A professional, reusable hook to get live browser window dimensions.
 * It sets up an event listener for resize events and cleans it up automatically.
 * @returns {object} An object containing the current `width` and `height`.
 */
export default function useWindowDimensions() {
  // Initialize state with the window's current dimensions
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up the event listener when the component unmounts to prevent memory leaks
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures this effect runs only once on mount and cleanup on unmount

  
  return windowDimensions;
}