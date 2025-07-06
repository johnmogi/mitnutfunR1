/**
 * Enhanced Logger Module
 * Provides centralized logging with filtering capabilities to reduce console flooding
 */

const Logger = (function() {
    'use strict';
    
    // Configuration
    const config = {
        enabled: true,
        logLevel: 'info', // 'debug', 'info', 'warn', 'error'
        prefix: '[MitnaFun]',
        maxLogsPerSecond: 5, // Rate limiting
    };
    
    // State
    let logCounter = 0;
    let lastResetTime = Date.now();
    let droppedMessages = 0;
    
    // Log levels with numeric values for comparison
    const LOG_LEVELS = {
        'debug': 0,
        'info': 1,
        'warn': 2,
        'error': 3
    };
    
    /**
     * Check if we should log based on rate limiting
     */
    function shouldLog(level) {
        // Always log errors regardless of rate limiting
        if (level === 'error') return true;
        
        // Check if logging is enabled
        if (!config.enabled) return false;
        
        // Check if level is high enough to log
        if (LOG_LEVELS[level] < LOG_LEVELS[config.logLevel]) return false;
        
        // Rate limiting
        const now = Date.now();
        if (now - lastResetTime > 1000) {
            // Reset counter every second
            logCounter = 0;
            lastResetTime = now;
            
            // Report dropped messages
            if (droppedMessages > 0) {
                console.warn(`${config.prefix} Rate limited: ${droppedMessages} messages dropped`);
                droppedMessages = 0;
            }
        }
        
        if (logCounter >= config.maxLogsPerSecond) {
            droppedMessages++;
            return false;
        }
        
        logCounter++;
        return true;
    }
    
    /**
     * Main logging function
     */
    function log(level, message, ...data) {
        if (!shouldLog(level)) return;
        
        const timestamp = new Date().toISOString().split('T')[1].substring(0, 8);
        const prefix = `${config.prefix} [${timestamp}] [${level.toUpperCase()}]`;
        
        switch (level) {
            case 'debug':
                console.debug(prefix, message, ...data);
                break;
            case 'info':
                console.info(prefix, message, ...data);
                break;
            case 'warn':
                console.warn(prefix, message, ...data);
                break;
            case 'error':
                console.error(prefix, message, ...data);
                break;
        }
    }
    
    // Public API
    return {
        debug: function(message, ...data) {
            log('debug', message, ...data);
        },
        
        info: function(message, ...data) {
            log('info', message, ...data);
        },
        
        warn: function(message, ...data) {
            log('warn', message, ...data);
        },
        
        error: function(message, ...data) {
            log('error', message, ...data);
        },
        
        // Configuration methods
        configure: function(options) {
            Object.assign(config, options);
        },
        
        enable: function() {
            config.enabled = true;
        },
        
        disable: function() {
            config.enabled = false;
        },
        
        setLevel: function(level) {
            if (LOG_LEVELS.hasOwnProperty(level)) {
                config.logLevel = level;
            }
        }
    };
})();

// Export for browser use
window.MitnaFunLogger = Logger;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}
