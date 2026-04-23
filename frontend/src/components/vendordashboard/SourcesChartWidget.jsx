// // import React from 'react';
// // import { Box, Center, Icon, Text, useBreakpointValue } from '@chakra-ui/react';
// // import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
// // import useApi from '../../hooks/useApi';
// // import WidgetCard from './WidgetCard';
// // import { PieChart as PieChartIcon } from 'lucide-react';

// // // Helper to format currency
// // const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value);

// // // ✅ NEW: Helper function to rename the legend labels
// // const getDisplayName = (originalName) => {
// //     switch (originalName) {
// //         case 'Profit from Sales':
// //             return 'Trades';
// //         case 'Referral Commissions':
// //             return 'Referral Claims';
// //         case 'Sign-up Bonuses':
// //             return 'Referral Bonus';
// //         default:
// //             return originalName;
// //     }
// // };

// // const SourcesChartWidget = ({ url }) => {
// //     const { data, isLoading, error } = useApi(url, '/api/vendor/dashboard/earnings-sources');
// //     const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
    
// //     // ✅ NEW: We transform the data here before using it
// //     const formattedData = React.useMemo(() => {
// //         if (!data) return [];
// //         return data.map(entry => ({
// //             ...entry,
// //             name: getDisplayName(entry.name),
// //         }));
// //     }, [data]);

// //     const hasData = !isLoading && !error && formattedData && formattedData.length > 0;

// //     // Responsive layout logic (no changes here)
// //     const legendLayout = useBreakpointValue({ base: 'horizontal', md: 'vertical' });
// //     const legendVerticalAlign = useBreakpointValue({ base: 'bottom', md: 'middle' });
// //     const legendAlign = useBreakpointValue({ base: 'center', md: 'right' });
// //     const pieCenterX = useBreakpointValue({ base: '50%', md: '40%' });
// //     const pieCenterY = useBreakpointValue({ base: '45%', md: '50%' });

// //     return (
// //         <WidgetCard title="Earnings Sources" isLoading={isLoading} error={error} height="400px">
// //             {
// //                 hasData ? (
// //                     // ✅ DEFINITIVE FIX: Wrapper box to remove all interactivity and focus ring
// //                     <Box
// //                         width="100%"
// //                         height="100%"
// //                         sx={{
// //                             "& .recharts-wrapper": {
// //                                 pointerEvents: "none",
// //                             },
// //                             userSelect: "none",
// //                         }}
// //                     >
// //                         <ResponsiveContainer width="100%" height="100%">
// //                             {/* ✅ Added margin to tighten the layout and "bring it up" */}
// //                             <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
// //                                 <Pie
// //                                     data={formattedData} // ✅ Use the new formatted data
// //                                     dataKey="value"
// //                                     nameKey="name"
// //                                     cx={pieCenterX}
// //                                     cy={pieCenterY}
// //                                     outerRadius={90}
// //                                     fill="#8884d8"
// //                                     label
// //                                     activeShape={null} 
// //                                 >
// //                                     {formattedData.map((entry, index) => (
// //                                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
// //                                     ))}
// //                                 </Pie>
                                
// //                                 {/* Tooltip is removed to prevent interaction */}

// //                                 <Legend
// //                                     layout={legendLayout}
// //                                     verticalAlign={legendVerticalAlign}
// //                                     align={legendAlign}
// //                                 />
// //                             </PieChart>
// //                         </ResponsiveContainer>
// //                     </Box>
// //                 ) : (
// //                     !isLoading && !error && (
// //                         <Center h="100%" flexDir="column" gap={2}>
// //                             <Icon as={PieChartIcon} boxSize={10} color="gray.400" />
// //                             <Text color="gray.500">No earnings sources to show.</Text>
// //                         </Center>
// //                     )
// //                 )
// //             }
// //         </WidgetCard>
// //     );
// // };

// // export default SourcesChartWidget;

// import React from 'react';
// import { Box, Center, Icon, Text, useBreakpointValue } from '@chakra-ui/react';
// import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
// import useApi from '../../hooks/useApi';
// import WidgetCard from './WidgetCard';
// import { PieChart as PieChartIcon } from 'lucide-react';

// // Helper to format currency
// const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value);

// // Helper function to rename the legend labels
// const getDisplayName = (originalName) => {
//     switch (originalName) {
//         case 'Profit from Sales':
//             return 'Trades';
//         case 'Referral Commissions':
//             return 'Referral Claims';
//         case 'Sign-up Bonuses':
//             return 'Referral Bonus';
//         default:
//             return originalName;
//     }
// };

// const SourcesChartWidget = ({ url }) => {
//     const { data, isLoading, error } = useApi(url, '/api/vendor/dashboard/earnings-sources');
    
//     // Using lighter shades of the requested colors
//     const COLORS = ['#9F7AEA', '#48BB78', '#63B3ED']; // Purple, Green, Blue

//     const formattedData = React.useMemo(() => {
//         if (!data) return [];
//         return data.map(entry => ({
//             ...entry,
//             name: getDisplayName(entry.name),
//         }));
//     }, [data]);

//     const hasData = !isLoading && !error && formattedData && formattedData.length > 0;

//     // Responsive pie chart radius. Larger on desktop.
//     const responsiveRadius = useBreakpointValue({ base: 100, md: 120 });

//     return (
//         <WidgetCard title="Earnings Sources" isLoading={isLoading} error={error} height="400px">
//             {
//                 hasData ? (
//                     <Box
//                         width="100%"
//                         height="100%"
//                         sx={{
//                             "& .recharts-wrapper": {
//                                 pointerEvents: "none",
//                             },
//                             userSelect: "none",
//                         }}
//                     >
//                         <ResponsiveContainer width="100%" height="100%">
//                             <PieChart margin={{ top: 10, right: 10, bottom: 40, left: 10 }}>
//                                 <Pie
//                                     data={formattedData}
//                                     dataKey="value"
//                                     nameKey="name"
//                                     cx="50%"
//                                     cy="50%"
//                                     outerRadius={responsiveRadius}
//                                     fill="#8884d8"
//                                     label
//                                     activeShape={null} 
//                                 >
//                                     {formattedData.map((entry, index) => (
//                                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                                     ))}
//                                 </Pie>

//                                 <Legend
//                                     wrapperStyle={{
//                                         position: 'absolute',
//                                         bottom: '15px',
//                                         left: 0,
//                                         right: 0,
//                                         display: 'flex',
//                                         justifyContent: 'center',
//                                         zIndex: 10,
//                                     }}
//                                 />
//                             </PieChart>
//                         </ResponsiveContainer>
//                     </Box>
//                 ) : (
//                     !isLoading && !error && (
//                         <Center h="100%" flexDir="column" gap={2}>
//                             <Icon as={PieChartIcon} boxSize={10} color="gray.400" />
//                             <Text color="gray.500">No earnings sources to show.</Text>
//                         </Center>
//                     )
//                 )
//             }
//         </WidgetCard>
//     );
// };

// export default SourcesChartWidget;

import React from 'react';
import { Box, Center, Icon, Text, useBreakpointValue } from '@chakra-ui/react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import useApi from '../../hooks/useApi';
import WidgetCard from './WidgetCard';
import { PieChart as PieChartIcon } from 'lucide-react';

// Helper to format currency
const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value);

// Helper function to rename the legend labels
const getDisplayName = (originalName) => {
    switch (originalName) {
        case 'Profit from Sales':
            return 'Trades';
        case 'Referral Commissions':
            return 'Referral Claims';
        case 'Sign-up Bonuses':
            return 'Referral Bonus';
        default:
            return originalName;
    }
};

const SourcesChartWidget = ({ url }) => {
    const { data, isLoading, error } = useApi(url, '/api/vendor/dashboard/earnings-sources');
    
    const COLORS = ['#9F7AEA', '#48BB78', '#63B3ED']; // Purple, Green, Blue

    const formattedData = React.useMemo(() => {
        if (!data) return [];
        return data.map(entry => ({
            ...entry,
            name: getDisplayName(entry.name),
        }));
    }, [data]);

    const hasData = !isLoading && !error && formattedData && formattedData.length > 0;

    const responsiveRadius = useBreakpointValue({ base: 100, md: 120 });

    return (
        <WidgetCard title="Earnings Sources" isLoading={isLoading} error={error} height="400px">
            {
                hasData ? (
                    <Box
                        width="100%"
                        height="100%"
                        sx={{
                            "& .recharts-wrapper": {
                                pointerEvents: "none",
                            },
                            userSelect: "none",
                        }}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 10, right: 10, bottom: 40, left: 10 }}>
                                <Pie
                                    data={formattedData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={responsiveRadius}
                                    fill="#8884d8"
                                    label
                                    activeShape={null} 
                                >
                                    {formattedData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>

                                <Legend
                                    wrapperStyle={{
                                        position: 'absolute',
                                        // ✅ MOVED UP: Changed from 15px to 45px
                                        bottom: '45px',
                                        left: 0,
                                        right: 0,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        zIndex: 10,
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                ) : (
                    !isLoading && !error && (
                        <Center h="100%" flexDir="column" gap={2}>
                            <Icon as={PieChartIcon} boxSize={10} color="gray.400" />
                            <Text color="gray.500">No earnings sources to show.</Text>
                        </Center>
                    )
                )
            }
        </WidgetCard>
    );
};

export default SourcesChartWidget;