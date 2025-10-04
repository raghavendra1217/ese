// // // // import React from 'react';
// // // // import { Box, Center, Icon, Text } from '@chakra-ui/react';
// // // // import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
// // // // import { AreaChart } from 'lucide-react'; 
// // // // import useApi from '../../hooks/useApi';
// // // // import WidgetCard from './WidgetCard';

// // // // // Helper to format currency
// // // // const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value);

// // // // const EarningsChartWidget = ({ url }) => {
// // // //     const { data, isLoading, error } = useApi(url, '/api/vendor/dashboard/earnings-over-time');

// // // //     // Data handling logic
// // // //     let chartData = []; 
// // // //     const hasData = !isLoading && !error && data && data.length > 0;

// // // //     if (hasData) {
// // // //         if (data.length === 1) {
// // // //             chartData = [{ name: 'Start', earnings: 0 }, ...data];
// // // //         } else {
// // // //             chartData = data;
// // // //         }
// // // //     }

// // // //     return (
// // // //         <WidgetCard title="Earnings Growth (Last 10 Weeks)" isLoading={isLoading} error={error} height="400px">
// // // //         {
// // // //             hasData ? (
// // // //                 <Box 
// // // //                     width="100%" 
// // // //                     height="100%" 
// // // //                     _focus={{ outline: 'none' }}
// // // //                     sx={{
// // // //                         "-webkit-user-select": "none",
// // // //                         "-moz-user-select": "none",
// // // //                         "-ms-user-select": "none",
// // // //                         "user-select": "none",
// // // //                     }}
// // // //                 >
// // // //                     <ResponsiveContainer width="100%" height="100%">
// // // //                         <LineChart data={chartData} margin={{ top: 20, right: 30, left: 5, bottom: 30 }}>
// // // //                             <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
// // // //                             <XAxis 
// // // //                                 dataKey="name" 
// // // //                                 angle={-45} 
// // // //                                 textAnchor="end" 
// // // //                                 height={60} 
// // // //                                 tick={{ fontSize: 12 }}
// // // //                                 // ✅ THIS IS THE NEW LINE THAT ADDS THE SPACE
// // // //                                 // padding={{ left: 30 }}
// // // //                             />
// // // //                             <YAxis tickFormatter={(value) => `₹${value / 1000}k`} tick={{ fontSize: 12 }} />
                            
// // // //                             <Line
// // // //                                 type="natural"
// // // //                                 dataKey="earnings"
// // // //                                 stroke="#0088FE" 
// // // //                                 strokeWidth={3}
// // // //                                 dot={{ r: 4, fill: '#0088FE' }}
// // // //                                 activeDot={false}
// // // //                             />
// // // //                         </LineChart>
// // // //                     </ResponsiveContainer>
// // // //                 </Box>
// // // //             ) : (
// // // //                 !isLoading && !error && (
// // // //                     <Center h="100%" flexDir="column" gap={2}>
// // // //                         <Icon as={AreaChart} boxSize={10} color="gray.400" />
// // // //                         <Text color="gray.500" textAlign="center">
// // // //                             No earnings data to display yet.
// // // //                         </Text>
// // // //                         <Text fontSize="sm" color="gray.400" textAlign="center">
// // // //                             Sales and commission claims will appear here.
// // // //                         </Text>
// // // //                     </Center>
// // // //                 )
// // // //             )
// // // //         }
// // // //         </WidgetCard>
// // // //     );
// // // // };

// // // // export default EarningsChartWidget;
// // // import React from 'react';
// // // import { Box, Center, Icon, Text } from '@chakra-ui/react';
// // // import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
// // // import { AreaChart } from 'lucide-react'; 
// // // import useApi from '../../hooks/useApi';
// // // import WidgetCard from './WidgetCard';

// // // // Helper to format currency
// // // const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value);

// // // const EarningsChartWidget = ({ url }) => {
// // //     const { data, isLoading, error } = useApi(url, '/api/vendor/dashboard/earnings-over-time');

// // //     // Data handling logic
// // //     let chartData = []; 
// // //     const hasData = !isLoading && !error && data && data.length > 0;

// // //     if (hasData) {
// // //         if (data.length === 1) {
// // //             chartData = [{ name: 'Start', earnings: 0 }, ...data];
// // //         } else {
// // //             chartData = data;
// // //         }
// // //     }

// // //     return (
// // //         <WidgetCard title="Earnings Growth (Last 10 Weeks)" isLoading={isLoading} error={error} height="400px">
// // //         {
// // //             hasData ? (
// // //                 // ✅ DEFINITIVE FIX: The sx prop applies the CSS to disable all mouse events.
// // //                 <Box 
// // //                     width="100%" 
// // //                     height="100%" 
// // //                     sx={{
// // //                         "& .recharts-wrapper": {
// // //                            pointerEvents: "none",
// // //                         },
// // //                         // Also prevents text selection on double click for a cleaner feel
// // //                         userSelect: "none",
// // //                     }}
// // //                 >
// // //                     <ResponsiveContainer width="100%" height="100%">
// // //                         {/* ✅ Tightened up the bottom margin to reduce empty space */}
// // //                         <LineChart data={chartData} margin={{ top: 20, right: 30, left: 5, bottom: 10 }}>
// // //                             <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
// // //                             <XAxis 
// // //                                 dataKey="name" 
// // //                                 angle={-45} 
// // //                                 textAnchor="end" 
// // //                                 height={60} 
// // //                                 tick={{ fontSize: 12 }}
// // //                                 padding={{ left: 30 }}
// // //                             />
// // //                             <YAxis tickFormatter={(value) => `₹${value / 1000}k`} tick={{ fontSize: 12 }} />
                            
// // //                             <Line
// // //                                 type="natural"
// // //                                 dataKey="earnings"
// // //                                 stroke="#0088FE" 
// // //                                 strokeWidth={3}
// // //                                 dot={{ r: 4, fill: '#0088FE' }}
// // //                                 activeDot={false} // This remains to disable line-specific hover effects
// // //                             />
// // //                         </LineChart>
// // //                     </ResponsiveContainer>
// // //                 </Box>
// // //             ) : (
// // //                 !isLoading && !error && (
// // //                     <Center h="100%" flexDir="column" gap={2}>
// // //                         <Icon as={AreaChart} boxSize={10} color="gray.400" />
// // //                         <Text color="gray.500" textAlign="center">
// // //                             No earnings data to display yet.
// // //                         </Text>
// // //                         <Text fontSize="sm" color="gray.400" textAlign="center">
// // //                             Sales and commission claims will appear here.
// // //                         </Text>
// // //                     </Center>
// // //                 )
// // //             )
// // //         }
// // //         </WidgetCard>
// // //     );
// // // };

// // // export default EarningsChartWidget;
// // import React from 'react';
// // import { Box, Center, Icon, Text, useBreakpointValue } from '@chakra-ui/react';
// // import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
// // import { AreaChart } from 'lucide-react'; 
// // import useApi from '../../hooks/useApi';
// // import WidgetCard from './WidgetCard';

// // // Helper to format currency
// // const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value);

// // const EarningsChartWidget = ({ url }) => {
// //     const { data, isLoading, error } = useApi(url, '/api/vendor/dashboard/earnings-over-time');

// //     // --- RESPONSIVE LAYOUT LOGIC ---
// //     const responsiveHeight = useBreakpointValue({ base: '300px', md: '400px' });
// //     const chartMargin = useBreakpointValue({
// //         base: { top: 20, right: 20, left: -5, bottom: 10 },
// //         md: { top: 20, right: 30, left: 5, bottom: 10 }
// //     });
// //     const xAxisPadding = useBreakpointValue({
// //         base: { left: 15 },
// //         md: { left: 30 }
// //     });

// //     // --- DATA HANDLING LOGIC ---
// //     let chartData = []; 
// //     const hasData = !isLoading && !error && data && data.length > 0;

// //     if (hasData) {
// //         if (data.length === 1) {
// //             chartData = [{ name: 'Start', earnings: 0 }, ...data];
// //         } else {
// //             chartData = data;
// //         }
// //     }

// //     return (
// //         <WidgetCard title="Earnings Growth (Last 10 Weeks)" isLoading={isLoading} error={error} height={responsiveHeight}>
// //         {
// //             hasData ? (
// //                 <Box 
// //                     width="100%" 
// //                     height="100%" 
// //                     sx={{
// //                         "& .recharts-wrapper": {
// //                            pointerEvents: "none",
// //                         },
// //                         userSelect: "none",
// //                     }}
// //                 >
// //                     <ResponsiveContainer width="100%" height="100%">
// //                         <LineChart data={chartData} margin={chartMargin}>
// //                             <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
// //                             <XAxis 
// //                                 dataKey="name" 
// //                                 angle={-45} 
// //                                 textAnchor="end" 
// //                                 height={60} 
// //                                 tick={{ fontSize: 12 }}
// //                                 padding={xAxisPadding}
// //                             />
// //                             <YAxis tickFormatter={(value) => `₹${value / 1000}k`} tick={{ fontSize: 12 }} />
                            
// //                             <Line
// //                                 type="natural"
// //                                 dataKey="earnings"
// //                                 stroke="#0088FE" 
// //                                 strokeWidth={3}
// //                                 dot={{ r: 4, fill: '#0088FE' }}
// //                                 activeDot={false}
// //                             />
// //                         </LineChart>
// //                     </ResponsiveContainer>
// //                 </Box>
// //             ) : (
// //                 !isLoading && !error && (
// //                     <Center h="100%" flexDir="column" gap={2}>
// //                         <Icon as={AreaChart} boxSize={10} color="gray.400" />
// //                         <Text color="gray.500" textAlign="center">
// //                             No earnings data to display yet.
// //                         </Text>
// //                         <Text fontSize="sm" color="gray.400" textAlign="center">
// //                             Sales and commission claims will appear here.
// //                         </Text>
// //                     </Center>
// //                 )
// //             )
// //         }
// //         </WidgetCard>
// //     );
// // };

// // export default EarningsChartWidget;

// import React from 'react';
// import { Box, Center, Icon, Text, useBreakpointValue } from '@chakra-ui/react';
// import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
// import { AreaChart } from 'lucide-react'; 
// import useApi from '../../hooks/useApi';
// import WidgetCard from './WidgetCard';

// // Helper to format currency
// const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value);

// const EarningsChartWidget = ({ url }) => {
//     const { data, isLoading, error } = useApi(url, '/api/vendor/dashboard/earnings-over-time');

//     // --- RESPONSIVE LAYOUT LOGIC ---
//     // ✅ INCREASED PHONE HEIGHT: The height on mobile is now taller.
//     const responsiveHeight = useBreakpointValue({ base: '350px', md: '400px' });
    
//     // ✅ PUSHED UP: The top margin on mobile is now smaller, pushing the chart up.
//     const chartMargin = useBreakpointValue({
//         base: { top: 10, right: 20, left: -5, bottom: 10 }, 
//         md: { top: 20, right: 30, left: 5, bottom: 10 }
//     });
//     const xAxisPadding = useBreakpointValue({
//         base: { left: 15 },
//         md: { left: 30 }
//     });

//     // Data handling logic
//     let chartData = []; 
//     const hasData = !isLoading && !error && data && data.length > 0;

//     if (hasData) {
//         if (data.length === 1) {
//             chartData = [{ name: 'Start', earnings: 0 }, ...data];
//         } else {
//             chartData = data;
//         }
//     }

//     return (
//         <WidgetCard title="Earnings Growth (Last 10 Weeks)" isLoading={isLoading} error={error} height={responsiveHeight}>
//         {
//             hasData ? (
//                 <Box 
//                     width="100%" 
//                     height="90%" 
//                     sx={{
//                         "& .recharts-wrapper": {
//                            pointerEvents: "none",
//                         },
//                         userSelect: "none",
//                     }}
//                 >
//                     <ResponsiveContainer width="100%" height="100%">
//                         <LineChart data={chartData} margin={chartMargin}>
//                             <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
//                             <XAxis 
//                                 dataKey="name" 
//                                 angle={-45} 
//                                 textAnchor="end" 
//                                 height={60} 
//                                 tick={{ fontSize: 12 }}
//                                 padding={xAxisPadding}
//                             />
//                             <YAxis tickFormatter={(value) => `₹${value / 1000}k`} tick={{ fontSize: 12 }} />
                            
//                             <Line
//                                 type="natural"
//                                 dataKey="earnings"
//                                 stroke="#0088FE" 
//                                 strokeWidth={3}
//                                 dot={{ r: 4, fill: '#0088FE' }}
//                                 activeDot={false}
//                             />
//                         </LineChart>
//                     </ResponsiveContainer>
//                 </Box>
//             ) : (
//                 !isLoading && !error && (
//                     <Center h="90%" flexDir="column" gap={2}>
//                         <Icon as={AreaChart} boxSize={10} color="gray.400" />
//                         <Text color="gray.500" textAlign="center">
//                             No earnings data to display yet.
//                         </Text>
//                         <Text fontSize="sm" color="gray.400" textAlign="center">
//                             Sales and commission claims will appear here.
//                         </Text>
//                     </Center>
//                 )
//             )
//         }
//         </WidgetCard>
//     );
// };

// export default EarningsChartWidget;
import React, { useMemo } from 'react';
import { Box, Center, Icon, Text, useBreakpointValue } from '@chakra-ui/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AreaChart } from 'lucide-react'; 
import useApi from '../../hooks/useApi';
import WidgetCard from './WidgetCard';

// Helper to format currency
const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value);

const EarningsChartWidget = ({ url }) => {
    const { data, isLoading, error } = useApi(url, '/api/vendor/dashboard/earnings-over-time');

    const responsiveHeight = useBreakpointValue({ base: '350px', md: '400px' });
    const chartMargin = { top: 20, right: 30, left: 5, bottom: 10 };
    const xAxisPadding = { left: 30 };

    // --- DATA HANDLING & LABEL SAMPLING LOGIC ---
    const { chartData, ticks } = useMemo(() => {
        if (!data || data.length === 0) {
            return { chartData: [], ticks: [] };
        }

        let processedData = data;
        if (data.length === 1) {
            processedData = [{ name: 'Start', earnings: 0 }, ...data];
        }

        // --- Smart Label Sampling ---
        let sampledTicks = [];
        const totalPoints = processedData.length;
        const maxTicks = 4; // We want a maximum of 4 labels

        if (totalPoints <= maxTicks) {
            // If there are few points, use all of them as labels
            sampledTicks = processedData.map(d => d.name);
        } else {
            // If there are many points, sample them evenly
            const interval = Math.floor((totalPoints - 1) / (maxTicks - 1));
            for (let i = 0; i < maxTicks; i++) {
                const index = Math.min(i * interval, totalPoints - 1);
                sampledTicks.push(processedData[index].name);
            }
             // Ensure the last tick is always the last data point's name
            if (!sampledTicks.includes(processedData[totalPoints - 1].name)) {
                sampledTicks[maxTicks-1] = processedData[totalPoints - 1].name;
            }
        }
        
        return { chartData: processedData, ticks: sampledTicks };
    }, [data]);

    const hasData = !isLoading && !error && chartData.length > 0;

    return (
        <WidgetCard title="Total Earnings Growth" isLoading={isLoading} error={error} height={responsiveHeight}>
        {
            hasData ? (
                <Box 
                    width="100%" 
                    height="100%" 
                    sx={{
                        "& .recharts-wrapper": { pointerEvents: "none" },
                        userSelect: "none",
                    }}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={chartMargin}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis 
                                dataKey="name" 
                                angle={-45} 
                                textAnchor="end" 
                                height={60} 
                                tick={{ fontSize: 12 }}
                                padding={xAxisPadding}
                                // ✅ Use our calculated smart labels
                                ticks={ticks} 
                            />
                            <YAxis tickFormatter={(value) => `₹${value / 1000}k`} tick={{ fontSize: 12 }} />
                            
                            <Line
                                type="natural"
                                dataKey="earnings"
                                stroke="#0088FE" 
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#0088FE' }}
                                activeDot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            ) : (
                !isLoading && !error && (
                    <Center h="100%" flexDir="column" gap={2}>
                        <Icon as={AreaChart} boxSize={10} color="gray.400" />
                        <Text color="gray.500" textAlign="center">
                            No earnings data to display yet.
                        </Text>
                    </Center>
                )
            )
        }
        </WidgetCard>
    );
};

export default EarningsChartWidget;