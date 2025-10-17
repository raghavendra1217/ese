// // import React, { useState, useEffect } from 'react';
// // import { Button } from '@chakra-ui/react';

// // const CountdownButton = ({ unlockDate }) => {
// //     const [timeLeft, setTimeLeft] = useState(unlockDate - new Date());

// //     useEffect(() => {
// //         const timer = setInterval(() => {
// //             setTimeLeft(unlockDate - new Date());
// //         }, 1000); // update every second for < 1 hour case

// //         return () => clearInterval(timer);
// //     }, [unlockDate]);

// //     const days = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60 * 24)));
// //     const hours = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
// //     const minutes = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));
// //     const seconds = Math.max(0, Math.floor((timeLeft % (1000 * 60)) / 1000));

// //     let label = 'Sell in ';
// //     if (days > 1) {
// //         label += `${days}d`;
// //     } else if (hours >= 1) {
// //         label += `${hours}h ${minutes}m`;
// //     } else {
// //         label += `${minutes}m ${seconds}s`;
// //     }

// //     return (
// //         <Button isDisabled colorScheme="gray" variant="outline" w="180px">
// //             {label}
// //         </Button>
// //     );
// // };

// // export default CountdownButton;

// import React, { useState, useEffect } from 'react';
// import { Button } from '@chakra-ui/react';

// // Get current time in UTC (ms since epoch)
// const getUTCNow = () => {
//     const now = new Date();
//     const utcNow = Date.UTC(
//         now.getUTCFullYear(),
//         now.getUTCMonth(),
//         now.getUTCDate(),
//         now.getUTCHours(),
//         now.getUTCMinutes(),
//         now.getUTCSeconds(),
//         now.getUTCMilliseconds()
//     );

//     return utcNow;
// };
// // #hello

// const CountdownButton = ({ unlockDate }) => {
//     const [timeLeft, setTimeLeft] = useState(unlockDate - getUTCNow());

//     useEffect(() => {
//         const timer = setInterval(() => {
//             const nowUTC = getUTCNow();
//             const remaining = unlockDate - nowUTC;

//             setTimeLeft(remaining);
//         }, 1000);

//         return () => clearInterval(timer);
//     }, [unlockDate]);

//     const days = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60 * 24)));
//     const hours = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
//     const minutes = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));
//     const seconds = Math.max(0, Math.floor((timeLeft % (1000 * 60)) / 1000));

//     let label = 'Sell in ';
//     if (days > 1) {
//         label += `${days}d`;
//     } else if (hours >= 1) {
//         label += `${hours}h ${minutes}m`;
//     } else {
//         label += `${minutes}m ${seconds}s`;
//     }

//     const isLocked = timeLeft > 0;

//     return (
//         <Button
//             isDisabled={isLocked}
//             colorScheme={isLocked ? 'gray' : 'green'}
//             variant="outline"
//             w="180px"
//         >
//             {isLocked ? label : 'Sell Now'}
//         </Button>
//     );
// };

// export default CountdownButton;









// src/components/your-folder/CountdownDisplay.js

import React, { useState, useEffect } from 'react';
import { Button } from '@chakra-ui/react';

const CountdownDisplay = ({ unlockTimestamp }) => {
    const [timeLeft, setTimeLeft] = useState(unlockTimestamp - Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            const remaining = unlockTimestamp - Date.now();
            setTimeLeft(remaining > 0 ? remaining : 0);
        }, 1000);

        return () => clearInterval(timer);
    }, [unlockTimestamp]);

    // Format the remaining time for display
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // Show unlock date/time if time is up
    if (timeLeft <= 0) {
        const unlockDate = new Date(unlockTimestamp);
        return (
            <Button
                isDisabled
                colorScheme="gray"
                variant="outline"
                w={{ base: '100%', md: '180px' }}
            >
                Unlocked: {unlockDate.toLocaleDateString()}
            </Button>
        );
    }

    let label = 'Sell in ';
    if (days > 0) {
        label += `${days}d ${hours}h`;
    } else if (hours > 0) {
        label += `${hours}h ${minutes}m`;
    } else {
        label += `${minutes}m ${seconds}s`;
    }

    return (
        <Button
            isDisabled
            colorScheme="gray"
            variant="outline"
            w={{ base: '100%', md: '180px' }}
        >
            {label}
        </Button>
    );
};

export default CountdownDisplay;