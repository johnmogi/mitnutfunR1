<?php
/**
 * JS Blocker
 *
 * This file blocks problematic JS files that interfere with proper price calculation.
 * Include this file from functions.php to prevent price calculation issues.
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Deregister problematic JavaScript files
 */
function mitnafun_block_problematic_js() {
    // List of problematic scripts to block
    $scripts_to_block = array(
        'checkout-fixes-new',       // Prevents price increases after removing items
        'checkout-price-fix',       // Legacy checkout price fixer
        'cart-fix-critical',        // Critical cart fixes that override pricing
        'mini-cart-fix',            // Mini cart price fixing script
        'cart-rental-fix',          // Cart rental calculation fixer
        'checkout-robust-fix',      // Additional checkout fixes
        'price-recalculator',      // Price recalculation scripts
        'checkout-fix',            // General checkout fixes
    );
    
    // Log which scripts we're attempting to block
    error_log('JS BLOCKER: Attempting to block problematic scripts');
    
    // Loop through and deregister each script
    foreach ($scripts_to_block as $script) {
        // Check if the script is registered before deregistering
        if (wp_script_is($script, 'registered')) {
            wp_deregister_script($script);
            error_log('JS BLOCKER: Successfully blocked ' . $script);
        } else {
            error_log('JS BLOCKER: Script not found: ' . $script);
        }
    }
}

// Use a high priority to ensure this runs after all scripts are registered
add_action('wp_enqueue_scripts', 'mitnafun_block_problematic_js', 999);

/**
 * Create an inline script to block dynamically loaded scripts
 */
function mitnafun_add_js_blocker_inline() {
    ?>
    <script type="text/javascript">
    // Block dynamic script loading of problematic files
    (function() {
        // Original createElement function
        var originalCreateElement = document.createElement;
        
        // List of problematic script filenames
        var blockedScripts = [
            'checkout-fixes-new.js',
            'checkout-price-fix.js',
            'cart-fix-critical.js',
            'mini-cart-fix.js',
            'cart-rental-fix.js',
            'checkout-robust-fix.js',
            'price-recalculator.js',
            'checkout-fix.js'
        ];
        
        // Override createElement to block specific script additions
        document.createElement = function(tagName) {
            // Create the element using the original function
            var element = originalCreateElement.apply(this, arguments);
            
            // Only intercept script elements
            if (tagName.toLowerCase() === 'script') {
                // Override the setAttribute method for this element
                var originalSetAttribute = element.setAttribute;
                element.setAttribute = function(name, value) {
                    if (name === 'src') {
                        // Check if the script source contains any of our blocked scripts
                        var isBlocked = blockedScripts.some(function(scriptName) {
                            return value.indexOf(scriptName) !== -1;
                        });
                        
                        if (isBlocked) {
                            console.warn('Blocked loading of problematic script:', value);
                            return; // Don't set the src attribute
                        }
                    }
                    
                    // Default behavior for all other attributes
                    return originalSetAttribute.call(this, name, value);
                };
            }
            
            return element;
        };
        
        console.log('JS Blocker: Script blocking protection installed');
    })();
    </script>
    <?php
}

// Add to wp_head with priority 1 to ensure it runs before other scripts
add_action('wp_head', 'mitnafun_add_js_blocker_inline', 1);
