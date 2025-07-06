<?php
/**
 * Deactivate Price Scripts
 *
 * This file deactivates all price-related scripts except price-enforcer.js
 * to ensure a single source of truth for price calculations and displays.
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

function mitnafun_deactivate_conflicting_price_scripts() {
    // List of scripts to deactivate
    $scripts_to_deactivate = array(
        'aggressive-price-override-clean',
        'aggressive-price-override-fixed',
        'aggressive-price-override',
        'checkout-detailed-price-fix',
        'checkout-fix',
        'mini-cart-fix',
        'price-override-fixed',
        'price-override-minimal',
        'product-price-transfer',
        'simple-price-override',
        'cart-rental-fix',
        'checkout-price-fix',
        'checkout-robust-fix'
    );
    
    // Deactivate each script
    foreach ($scripts_to_deactivate as $script) {
        wp_dequeue_script($script);
        wp_deregister_script($script);
    }
    
    // Log deactivation
    error_log('PRICE CONFLICT RESOLUTION: Deactivated ' . count($scripts_to_deactivate) . ' conflicting price scripts.');
}

// Run on priority 100 to ensure it runs after all enqueues
add_action('wp_enqueue_scripts', 'mitnafun_deactivate_conflicting_price_scripts', 100);

// Add a comment in the HTML source for debugging
function mitnafun_add_price_scripts_comment() {
    echo "<!-- PRICE SCRIPTS: All price-related scripts deactivated except price-enforcer.js -->\n";
}
add_action('wp_head', 'mitnafun_add_price_scripts_comment');
