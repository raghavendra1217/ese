# Indian Timezone Utility Functions

This directory contains utility functions for handling Indian Standard Time (IST) conversions and formatting consistently across the application.

## Problem Solved

Previously, the application was displaying timestamps in the user's local timezone instead of Indian Standard Time (IST). This caused confusion for users in India who expected to see times in their local timezone.

## Solution

Created a comprehensive set of utility functions that:
1. Convert UTC timestamps to Indian Standard Time (IST = UTC+5:30)
2. Format dates and times consistently in Indian format
3. Handle edge cases and provide fallbacks

## Available Functions

### `convertToIST(timestamp)`
Converts a UTC timestamp to Indian Standard Time.
- **Input**: UTC timestamp string or Date object
- **Output**: Date object in IST
- **Example**: `convertToIST('2024-01-15T10:30:00.000Z')`

### `formatToIST(timestamp, includeTime = true)`
Formats a timestamp to Indian time with date and optionally time.
- **Input**: UTC timestamp, boolean for including time
- **Output**: Formatted string in IST
- **Example**: `formatToIST('2024-01-15T10:30:00.000Z', true)` → "Jan 15, 2024 at 4:00 PM"

### `formatDateDDMMYYYY(timestamp)`
Formats a timestamp to Indian date in DD/MM/YYYY format.
- **Input**: UTC timestamp
- **Output**: Date string in DD/MM/YYYY format
- **Example**: `formatDateDDMMYYYY('2024-01-15T10:30:00.000Z')` → "15/01/2024"

### `formatTimeToIST(timestamp)`
Formats a timestamp to Indian time only (without date).
- **Input**: UTC timestamp
- **Output**: Time string in IST
- **Example**: `formatTimeToIST('2024-01-15T10:30:00.000Z')` → "4:00 PM"

### `formatDateToIST(timestamp)`
Formats a timestamp to Indian date only (without time).
- **Input**: UTC timestamp
- **Output**: Date string in IST
- **Example**: `formatDateToIST('2024-01-15T10:30:00.000Z')` → "15/01/2024"

### `getCurrentIST()`
Gets the current time in Indian Standard Time.
- **Output**: Current Date object in IST
- **Example**: `getCurrentIST()`

### `formatRelativeTime(timestamp)`
Formats a timestamp as relative time (e.g., "2 hours ago").
- **Input**: UTC timestamp
- **Output**: Relative time string
- **Example**: `formatRelativeTime('2024-01-15T10:30:00.000Z')` → "2 hours ago"

## Usage Examples

### In React Components

```jsx
import { formatToIST, formatDateDDMMYYYY } from '../../utils/dateUtils';

// Display full date and time
<Text>{formatToIST(transaction.created_at, true)}</Text>

// Display date only
<Text>Bought on {formatDateDDMMYYYY(item.purchase_date)}</Text>

// Display time only
<Text>Time: {formatTimeToIST(transaction.created_at)}</Text>
```

### For Search/Filtering

```jsx
// Use in search filters
const filtered = data.filter(item => 
  formatDateToIST(item.date).toLowerCase().includes(searchTerm)
);
```

## Migration Guide

### Before (Old Way)
```jsx
// ❌ Shows time in user's local timezone
{new Date(tx.created_at).toLocaleString()}

// ❌ Shows date in user's local timezone
{new Date(tx.created_at).toLocaleDateString()}

// ❌ date-fns without timezone handling
{format(new Date(tx.created_at), "MMM d, yyyy 'at' h:mm a")}
```

### After (New Way)
```jsx
// ✅ Shows time in Indian Standard Time
{formatToIST(tx.created_at, true)}

// ✅ Shows date in Indian Standard Time
{formatDateToIST(tx.created_at)}

// ✅ Shows date in DD/MM/YYYY format
{formatDateDDMMYYYY(tx.created_at)}
```

## Technical Details

- **Timezone Offset**: IST is UTC+5:30 (5.5 hours ahead)
- **Fallback**: Functions return 'N/A' for invalid timestamps
- **Performance**: Lightweight functions with minimal overhead
- **Browser Support**: Uses standard JavaScript Date methods with timezone handling

## Testing

To test the utility functions, open the browser console and run:
```javascript
// Import and test the functions
import('./dateUtils.js').then(module => {
  const { formatToIST, formatDateDDMMYYYY } = module;
  console.log(formatToIST('2024-01-15T10:30:00.000Z'));
});
```

## Components Updated

The following components have been updated to use these utility functions:

- `TransactionList.jsx` - Transaction timestamps
- `SoldTradeItem.jsx` - Purchase and sale dates
- `ActiveTradeItem.jsx` - Purchase dates
- `ReferralPage.jsx` - Trade dates
- `RecentActivityPage.jsx` - Activity timestamps
- `DashboardOverview.jsx` - Recent activity dates
- `PurchaseHistoryPage.jsx` - Purchase dates
- `Transactions.jsx` (Admin) - Transaction timestamps

## Benefits

1. **Consistency**: All timestamps now display in Indian Standard Time
2. **User Experience**: Indian users see times in their expected timezone
3. **Maintainability**: Centralized timezone logic in utility functions
4. **Flexibility**: Multiple formatting options for different use cases
5. **Reliability**: Proper handling of edge cases and invalid data
