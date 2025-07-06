<?php
/**
 * Cart Pricing Fix
 * 
 * Fixes the rental pricing calculation in cart and checkout by ensuring the cart session data
 * is properly updated with discount calculations.
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Fix rental pricing calculations in cart
 * This runs after the original pricing function with a higher priority (30 vs 20)
 * to ensure proper discounting is applied and stored in the session
 */
function mitnafun_fix_rental_pricing($cart) {
    if (is_admin() && !defined('DOING_AJAX')) {
        return;
    }
    
    // Only run once to avoid infinite loops
    static $run = false;
    if ($run) return;
    $run = true;
    
    // Debug info
    $debug = array(
        'fixed_items' => 0,
        'items_processed' => 0,
        'discounts_applied' => 0
    );
    
    // Process each cart item
    foreach ($cart->get_cart() as $cart_item_key => $cart_item) {
        $debug['items_processed']++;
        
        // Skip if not a rental product (no rental dates)
        if (!isset($cart_item['rental_dates']) || empty($cart_item['rental_dates'])) {
            continue;
        }
        
        // Get rental dates
        $rental_dates = $cart_item['rental_dates'];
        
        // Parse dates to calculate rental days
        $dates_array = explode(' - ', $rental_dates);
        if (count($dates_array) !== 2) {
            continue;
        }
        
        // Calculate rental days using the same function as the original code
        $rental_days = 0;
        
        if (function_exists('mitnafun_calculate_rental_days')) {
            $rental_days = mitnafun_calculate_rental_days($dates_array[0], $dates_array[1]);
        } else {
            // Fallback calculation if the function doesn't exist
            $start = strtotime($dates_array[0]);
            $end = strtotime($dates_array[1]);
            
            if ($start && $end) {
                // Count days excluding Saturdays
                $days = 0;
                $current = $start;
                
                while ($current <= $end) {
                    $day_of_week = date('w', $current);
                    if ($day_of_week != 6) { // Skip Saturdays
                        $days++;
                    }
                    $current = strtotime('+1 day', $current);
                }
                
                $rental_days = max(1, $days);
            } else {
                $rental_days = 1; // Default to 1 if parsing fails
            }
        }
        
        // Store rental days in cart item for later use
        $cart->cart_contents[$cart_item_key]['rental_days'] = $rental_days;
        
        // Apply appropriate pricing
        $product_id = $cart_item['product_id'];
        $original_price = $cart_item['data']->get_price();
        
        // Products 150, 153 don't get the discount
        $excluded_products = array(150, 153);
        
        if (!in_array($product_id, $excluded_products) && $rental_days > 1) {
            // First day at full price, additional days at 50%
            $discounted_price = $original_price + ($original_price * 0.5 * ($rental_days - 1));
            
            // Store original price and discount for display purposes
            $cart->cart_contents[$cart_item_key]['original_rental_price'] = $original_price * $rental_days;
            $cart->cart_contents[$cart_item_key]['rental_discount'] = ($original_price * $rental_days) - $discounted_price;
            
            // Set the new price
            $cart_item['data']->set_price($discounted_price);
            $debug['discounts_applied']++;
        } else {
            // For excluded products or single-day rentals, just multiply by days
            $cart_item['data']->set_price($original_price * $rental_days);
        }
        
        $debug['fixed_items']++;
    }
    
    // Write debug info to log if debugging is enabled
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log('Cart pricing fix applied: ' . json_encode($debug));
    }
}

// Add the fix with a higher priority than the original function (which uses 20)
add_action('woocommerce_before_calculate_totals', 'mitnafun_fix_rental_pricing', 30);
