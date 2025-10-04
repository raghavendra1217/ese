// Status monitoring utility for external services
const https = require('https');
const http = require('http');

/**
 * Check the status of the compressor service
 * @returns {Promise<Object>} Status check result
 */
async function checkCompressorStatus() {
    const statusUrl = 'https://compressor-ljk9.onrender.com/status';
    
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        // Use https module for the request
        const request = https.get(statusUrl, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                const responseTime = Date.now() - startTime;
                
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: 'online',
                        statusCode: response.statusCode,
                        responseTime: `${responseTime}ms`,
                        data: jsonData,
                        timestamp: new Date().toISOString(),
                        url: statusUrl
                    });
                } catch (parseError) {
                    resolve({
                        status: 'online_but_invalid_json',
                        statusCode: response.statusCode,
                        responseTime: `${responseTime}ms`,
                        rawData: data,
                        error: 'Failed to parse JSON response',
                        timestamp: new Date().toISOString(),
                        url: statusUrl
                    });
                }
            });
        });
        
        request.on('error', (error) => {
            const responseTime = Date.now() - startTime;
            resolve({
                status: 'offline',
                statusCode: null,
                responseTime: `${responseTime}ms`,
                error: error.message,
                timestamp: new Date().toISOString(),
                url: statusUrl
            });
        });
        
        // Set timeout for the request (10 seconds)
        request.setTimeout(10000, () => {
            request.destroy();
            const responseTime = Date.now() - startTime;
            resolve({
                status: 'timeout',
                statusCode: null,
                responseTime: `${responseTime}ms`,
                error: 'Request timeout (10s)',
                timestamp: new Date().toISOString(),
                url: statusUrl
            });
        });
    });
}

/**
 * Log status check results with proper formatting
 * @param {Object} result - Status check result
 */
function logStatusResult(result) {
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    switch (result.status) {
        case 'online':
            console.log(`✅ [${timestamp}] Compressor Service Status: ONLINE`);
            console.log(`   📊 Response: ${result.statusCode} | ⏱️  ${result.responseTime}`);
            console.log(`   📄 Data:`, result.data);
            break;
            
        case 'online_but_invalid_json':
            console.log(`⚠️  [${timestamp}] Compressor Service Status: ONLINE (Invalid JSON)`);
            console.log(`   📊 Response: ${result.statusCode} | ⏱️  ${result.responseTime}`);
            console.log(`   📄 Raw Data: ${result.rawData}`);
            break;
            
        case 'offline':
            console.log(`❌ [${timestamp}] Compressor Service Status: OFFLINE`);
            console.log(`   🚨 Error: ${result.error} | ⏱️  ${result.responseTime}`);
            break;
            
        case 'timeout':
            console.log(`⏰ [${timestamp}] Compressor Service Status: TIMEOUT`);
            console.log(`   🚨 Error: ${result.error} | ⏱️  ${result.responseTime}`);
            break;
            
        default:
            console.log(`❓ [${timestamp}] Compressor Service Status: UNKNOWN`);
            console.log(`   📄 Result:`, result);
    }
}

/**
 * Start monitoring the compressor service with adaptive intervals
 * @param {number} intervalMinutes - Normal check interval in minutes (default: 15)
 * @returns {Object} Monitor control functions
 */
function startCompressorMonitoring(intervalMinutes = 15) {
    const normalIntervalMs = intervalMinutes * 60 * 1000; // Normal interval in milliseconds
    const aggressiveIntervalMs = 30 * 1000; // 30 seconds when service is down
    
    let monitorTimeout = null;
    let isRunning = false;
    let isServiceDown = false;
    let consecutiveFailures = 0;
    let lastKnownStatus = 'unknown';
    
    const scheduleNextCheck = (interval, mode) => {
        if (monitorTimeout) {
            clearTimeout(monitorTimeout);
        }
        
        const nextCheckTime = new Date(Date.now() + interval).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        
        if (mode === 'aggressive') {
            console.log(`⚡ Next aggressive check in ${interval/1000}s at: ${nextCheckTime}`);
        } else {
            console.log(`🕐 Next normal check in ${interval/1000/60}min at: ${nextCheckTime}`);
        }
        
        monitorTimeout = setTimeout(performCheck, interval);
    };
    
    const performCheck = async () => {
        if (!isRunning) return; // Stop if monitoring was disabled
        
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        console.log(`🔍 [${timestamp}] Checking compressor service status...`);
        
        try {
            const result = await checkCompressorStatus();
            logStatusResult(result);
            
            // Check if service is online
            const isOnline = result.status === 'online';
            
            if (isOnline) {
                // Service is online
                if (isServiceDown) {
                    // Service was down but now recovered
                    console.log(`🎉 [${timestamp}] 🚀 COMPRESSOR SERVICE RECOVERED! 🚀`);
                    console.log(`   📊 Was down for ${consecutiveFailures} checks`);
                    console.log(`   🔄 Switching back to normal monitoring (${intervalMinutes} minutes)`);
                    isServiceDown = false;
                    consecutiveFailures = 0;
                    
                    // Switch back to normal interval
                    scheduleNextCheck(normalIntervalMs, 'normal');
                } else {
                    // Service continues to be online
                    consecutiveFailures = 0;
                    scheduleNextCheck(normalIntervalMs, 'normal');
                }
                lastKnownStatus = 'online';
            } else {
                // Service is down/offline/timeout
                consecutiveFailures++;
                
                if (!isServiceDown) {
                    // Service just went down
                    console.log(`🚨 [${timestamp}] ⚠️  COMPRESSOR SERVICE WENT DOWN! ⚠️`);
                    console.log(`   🔄 Switching to aggressive monitoring (every 30 seconds)`);
                    isServiceDown = true;
                } else {
                    // Service continues to be down
                    console.log(`🔄 [${timestamp}] Service still down (failure #${consecutiveFailures})`);
                }
                
                lastKnownStatus = result.status;
                
                // Use aggressive interval when service is down
                scheduleNextCheck(aggressiveIntervalMs, 'aggressive');
            }
        } catch (error) {
            consecutiveFailures++;
            console.error(`❌ [${timestamp}] Status check failed:`, error);
            
            if (!isServiceDown) {
                console.log(`🚨 [${timestamp}] Monitoring error - switching to aggressive mode`);
                isServiceDown = true;
            }
            
            lastKnownStatus = 'error';
            scheduleNextCheck(aggressiveIntervalMs, 'aggressive');
        }
    };
    
    const start = () => {
        if (isRunning) {
            console.log('⚠️  Status monitor is already running');
            return;
        }
        
        console.log(`🚀 Starting compressor service monitoring`);
        console.log(`   📊 Normal interval: ${intervalMinutes} minutes`);
        console.log(`   ⚡ Aggressive interval: 30 seconds (when service is down)`);
        console.log(`   🎯 Target: https://compressor-ljk9.onrender.com/status`);
        
        // Reset state
        isServiceDown = false;
        consecutiveFailures = 0;
        lastKnownStatus = 'unknown';
        isRunning = true;
        
        // Perform initial check
        performCheck();
        
        console.log(`✅ Status monitoring started successfully`);
    };
    
    const stop = () => {
        if (!isRunning) {
            console.log('⚠️  Status monitor is not running');
            return;
        }
        
        if (monitorTimeout) {
            clearTimeout(monitorTimeout);
            monitorTimeout = null;
        }
        
        isRunning = false;
        isServiceDown = false;
        consecutiveFailures = 0;
        console.log(`🛑 Status monitoring stopped`);
    };
    
    const getStatus = () => {
        return {
            isRunning,
            intervalMinutes,
            isServiceDown,
            consecutiveFailures,
            lastKnownStatus,
            currentMode: isServiceDown ? 'aggressive (30s)' : `normal (${intervalMinutes}min)`,
            nextCheck: isRunning ? new Date(Date.now() + (isServiceDown ? aggressiveIntervalMs : normalIntervalMs)).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not scheduled'
        };
    };
    
    return {
        start,
        stop,
        getStatus,
        performCheck
    };
}

module.exports = {
    checkCompressorStatus,
    logStatusResult,
    startCompressorMonitoring
};
