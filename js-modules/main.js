/**
 * Main JS Module Loader
 * Handles loading and initializing all MitnaFun modules
 */

(function($) {
    'use strict';
    
    // Module loading status
    const moduleStatus = {
        logger: false,
        checkoutValidator: false,
        cartIntegration: false
    };
    
    // Initialize logger first
    if (typeof MitnaFunLogger !== 'undefined') {
        // Configure logger
        MitnaFunLogger.configure({
            enabled: true,
            logLevel: 'info',  // 'debug', 'info', 'warn', 'error'
            prefix: '[MitnaFun]',
            maxLogsPerSecond: 5
        });
        
        moduleStatus.logger = true;
        MitnaFunLogger.info('Logger initialized');
    } else {
        console.warn('[MitnaFun] Logger module not found');
    }
    
    // Common logging function
    const log = window.MitnaFunLogger || {
        info: console.info.bind(console, '[MitnaFun]'),
        warn: console.warn.bind(console, '[MitnaFun]'),
        error: console.error.bind(console, '[MitnaFun]')
    };
    
    // Initialize checkout validator
    if (typeof CheckoutValidator !== 'undefined') {
        moduleStatus.checkoutValidator = true;
        log.info('CheckoutValidator initialized');
    } else {
        log.warn('CheckoutValidator module not found');
    }
    
    // Initialize cart integration
    if (typeof CartIntegration !== 'undefined') {
        moduleStatus.cartIntegration = true;
        log.info('CartIntegration initialized');
    } else {
        log.warn('CartIntegration module not found');
    }
    
    // Log module loading status
    log.info('Module loading complete', moduleStatus);
    
    // Add module status to window for debugging
    window.MitnaFunModuleStatus = moduleStatus;
    
})(jQuery);
