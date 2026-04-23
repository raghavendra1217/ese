/**
 * Utility functions for handling date formatting
 * Note: Backend already converts UTC to IST, so frontend just needs to format
 */

/**
 * Parse a DD/MM/YYYY date string correctly (JavaScript Date constructor defaults to MM/DD/YYYY)
 * @param {string} dateString - Date string in DD/MM/YYYY format
 * @returns {Date} Parsed date object
 */
const parseDDMMYYYYDate = (dateString) => {
  // Split the date string
  const parts = dateString.split('/');
  if (parts.length !== 3) {
    throw new Error('Invalid date format. Expected DD/MM/YYYY');
  }

  // Extract components (assuming DD/MM/YYYY format)
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JavaScript Date
  const year = parseInt(parts[2], 10);

  // Validate components
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    throw new Error('Invalid date components');
  }

  if (day < 1 || day > 31 || month < 0 || month > 11) {
    throw new Error('Invalid date range');
  }

  // Create date object (year, month, day)
  return new Date(year, month, day);
};

/**
 * Format a timestamp (UTC or pre-formatted IST from backend)
 * @param {string|Date} timestamp - Timestamp from backend (UTC or pre-formatted IST)
 * @param {boolean} includeTime - Whether to include time in the output
 * @param {boolean} alreadyInIST - True if backend sends pre-formatted IST strings
 * @returns {string} Formatted date/time string
 */
export const formatISTDate = (timestamp, includeTime = true, alreadyInIST = true) => {
  if (!timestamp) return 'N/A';

  // If backend sends pre-formatted IST strings, return as-is
  if (alreadyInIST && typeof timestamp === 'string' && (timestamp.includes('/') || timestamp.includes(','))) {
    // Validate that the date part is in DD/MM/YYYY format
    const datePart = timestamp.split(',')[0];
    if (datePart && datePart.includes('/')) {
      try {
        const testDate = parseDDMMYYYYDate(datePart);
        if (!isNaN(testDate.getTime())) {
          return timestamp;
        }
      } catch (error) {
        // If parsing fails, fall through to UTC conversion
      }
    }
  }

  // Otherwise, convert UTC timestamp to IST
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'N/A';

  if (includeTime) {
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  } else {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  }
};

/**
 * Format a timestamp to Indian time with date (DEPRECATED - use formatISTDate instead)
 * @param {string|Date} timestamp - Timestamp from backend (UTC or pre-formatted IST)
 * @param {boolean} includeTime - Whether to include time in the output
 * @param {boolean} alreadyInIST - True if backend sends pre-formatted IST strings
 * @returns {string} Formatted date/time string
 */
export const formatToIST = (timestamp, includeTime = true, alreadyInIST = true) => {
  return formatISTDate(timestamp, includeTime, alreadyInIST);
};

/**
 * Format a timestamp to Indian time only (without date)
 * @param {string|Date} timestamp - Timestamp from backend (UTC or pre-formatted IST)
 * @param {boolean} alreadyInIST - True if backend sends pre-formatted IST strings
 * @returns {string} Formatted time string
 */
export const formatTimeToIST = (timestamp, alreadyInIST = true) => {
  if (!timestamp) return 'N/A';

  // If backend sends pre-formatted IST strings, extract time part
  if (alreadyInIST && typeof timestamp === 'string' && timestamp.includes(',')) {
    // Validate the date part first
    const datePart = timestamp.split(',')[0];
    if (datePart && datePart.includes('/')) {
      try {
        const testDate = parseDDMMYYYYDate(datePart);
        if (!isNaN(testDate.getTime())) {
          const timeMatch = timestamp.match(/(\d{1,2}:\d{2}\s(?:AM|PM))/);
          return timeMatch ? timeMatch[1] : 'N/A';
        }
      } catch (error) {
        // If parsing fails, fall through to UTC conversion
      }
    }
  }

  // Otherwise, convert UTC timestamp to IST time
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'N/A';

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });
};

/**
 * Format a timestamp to Indian date only (without time)
 * @param {string|Date} timestamp - Timestamp from backend (UTC or pre-formatted IST)
 * @param {boolean} alreadyInIST - True if backend sends pre-formatted IST strings
 * @returns {string} Formatted date string
 */
export const formatDateToIST = (timestamp, alreadyInIST = true) => {
  if (!timestamp) return 'N/A';

  // If backend sends pre-formatted IST strings, return as-is
  if (alreadyInIST && typeof timestamp === 'string' && timestamp.includes('/')) {
    // Validate that it's a proper DD/MM/YYYY format before returning
    try {
      const testDate = parseDDMMYYYYDate(timestamp);
      if (!isNaN(testDate.getTime())) {
        return timestamp;
      }
    } catch (error) {
      // If parsing fails, fall through to UTC conversion
    }
  }

  // Otherwise, convert UTC timestamp to IST date
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'N/A';

  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Kolkata'
  });
};

/**
 * Format a timestamp to Indian date in DD/MM/YYYY format
 * @param {string|Date} timestamp - Timestamp from backend (UTC or pre-formatted IST)
 * @param {boolean} alreadyInIST - True if backend sends pre-formatted IST strings
 * @returns {string} Date in DD/MM/YYYY format
 */
export const formatDateDDMMYYYY = (timestamp, alreadyInIST = true) => {
  if (!timestamp) return 'N/A';

  // If backend sends pre-formatted IST strings, convert to DD/MM/YYYY format
  if (alreadyInIST && typeof timestamp === 'string' && timestamp.includes('/')) {
    try {
      const date = parseDDMMYYYYDate(timestamp);
      if (isNaN(date.getTime())) return 'N/A';

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error parsing date:', error);
      return 'N/A';
    }
  }

  // Otherwise, convert UTC timestamp to IST date
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'N/A';

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Get current time in IST
 * @returns {Date} Current time in IST
 */
export const getCurrentIST = () => {
  // Use Intl API for reliable timezone conversion
  const istString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  return new Date(istString);
};

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 * @param {string|Date} timestamp - IST timestamp from backend
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'N/A';
  
  const now = getCurrentIST();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};
