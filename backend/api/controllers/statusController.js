// Controller for external service status monitoring
const { checkCompressorStatus: checkServiceStatus } = require('../utils/statusMonitor');

/**
 * Manually check compressor service status
 */
exports.checkCompressorStatus = async (req, res) => {
    try {
        console.log('🔍 Manual status check requested via API');
        const result = await checkServiceStatus();
        
        res.status(200).json({
            success: true,
            serviceStatus: result,
            checkedAt: new Date().toISOString(),
            message: `Compressor service is ${result.status}`
        });
    } catch (error) {
        console.error('❌ Error checking compressor status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check compressor service status',
            error: error.message
        });
    }
};

/**
 * Get monitoring system information
 */
exports.getMonitoringInfo = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            monitoring: {
                service: 'Compressor Service',
                url: 'https://compressor-ljk9.onrender.com/status',
                normalInterval: '15 minutes',
                aggressiveInterval: '30 seconds (when service is down)',
                status: 'Active',
                description: 'Adaptive monitoring: 15min intervals when online, 30s intervals when offline until recovery'
            },
            features: {
                adaptiveMonitoring: 'Switches to 30-second checks when service goes down',
                recoveryDetection: 'Automatically detects when service comes back online',
                failureTracking: 'Counts consecutive failures for analysis',
                istTimestamps: 'All logs use Indian Standard Time'
            },
            instructions: {
                manualCheck: 'GET /api/status/compressor',
                logs: 'Check server console for automatic status check logs',
                recovery: 'System automatically returns to normal interval when service recovers'
            }
        });
    } catch (error) {
        console.error('❌ Error getting monitoring info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get monitoring information',
            error: error.message
        });
    }
};
