import React, { useState, useEffect } from 'react';
import { Button } from '@chakra-ui/react';

const CountdownButton = ({ unlockDate }) => {
    const [timeLeft, setTimeLeft] = useState(unlockDate - new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(unlockDate - new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, [unlockDate]);

    const days = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60 * 24)));
    const hours = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    const minutes = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));
    const seconds = Math.max(0, Math.floor((timeLeft % (1000 * 60)) / 1000));
    
    return (
        <Button isDisabled colorScheme="gray" variant="outline" w="180px">
            Unlocks in {days}d {hours}h {minutes}m {seconds}s
        </Button>
    );
};

export default CountdownButton;