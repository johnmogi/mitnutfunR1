<?php
/**
 * Rental Pricing Functions
 *
 * Handles rental product pricing calculations and display
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Initialize rental pricing hooks
 */
function mitnafun_init_rental_pricing() {
    // Apply discounts to cart items
    add_filter('woocommerce_cart_item_price', 'mitnafun_rental_display_price', 10, 3);
    add_filter('woocommerce_cart_item_subtotal', 'mitnafun_rental_display_subtotal', 10, 3);
    
    // Modify cart item data display
    add_filter('woocommerce_get_item_data', 'mitnafun_add_rental_days_item_data', 10, 2);
    
    // Handle rental days calculation and discounts
    add_action('woocommerce_before_calculate_totals', 'mitnafun_apply_rental_pricing', 20, 1);
}
add_action('init', 'mitnafun_init_rental_pricing');

/**
 * Calculate the number of rental days between two dates
 * Handles special cases like Saturday (counts as 0 days)
 *
 * @param string $start_date Start date in any recognizable format
 * @param string $end_date End date in any recognizable format
 * @return int Number of rental days
 */
function mitnafun_calculate_rental_days($start_date, $end_date) {
    if (empty($start_date) || empty($end_date)) {
        return 1; // Default to 1 day if no dates provided
    }
    
    // Parse dates to ensure consistent format
    $start = is_numeric($start_date) ? $start_date : strtotime($start_date);
    $end = is_numeric($end_date) ? $end_date : strtotime($end_date);
    
    if (!$start || !$end) {
        return 1; // Return default if parsing failed
    }
    
    // Special case: Friday to Sunday counts as 1 day
    $start_day = date('w', $start);
    $end_day = date('w', $end);
    
    // If the rental starts on Friday (5) and ends on Sunday (0), count as 1 day
    if ($start_day == 5 && $end_day == 0 && $end <= strtotime('+2 days', $start)) {
        return 1;
    }
    
    // Initialize days counter
    $days = 0;
    $current = $start;
    
    // Loop through each day and count (skipping Saturdays)
    while ($current <= $end) {
        $day_of_week = date('w', $current);
        
        // Saturday is day 6, don't count it
        if ($day_of_week != 6) {
            $days++;
        }
        
        // Move to next day
        $current = strtotime('+1 day', $current);
    }
    
    // Ensure we always have at least 1 day
    return max(1, $days);
}

/**
 * Apply rental pricing and discounts to cart items
 *
 * @param WC_Cart $cart Cart object
 */
function mitnafun_apply_rental_pricing($cart) {
    if (is_admin() && !defined('DOING_AJAX')) {
        return;
    }

    if (did_action('woocommerce_before_calculate_totals') >= 2) {
        return; // Avoid infinite loops
    }
    
    // Process each cart item
    foreach ($cart->get_cart() as $cart_item_key => $cart_item) {
        // Skip if not a rental product (no rental dates)
        if (!mitnafun_is_rental_item($cart_item)) {
            continue;
        }
        
        // Get rental dates
        $rental_dates = mitnafun_get_rental_dates($cart_item);
        if (!$rental_dates) {
            continue;
        }
        
        // Parse dates to calculate rental days
        $dates_array = explode(' - ', $rental_dates);
        if (count($dates_array) !== 2) {
            continue;
        }
        
        // Calculate rental days
        $rental_days = mitnafun_calculate_rental_days($dates_array[0], $dates_array[1]);
        
        // Store rental days in cart item for later use
        $cart_item['rental_days'] = $rental_days;
        
        // Apply appropriate pricing
        $product_id = $cart_item['product_id'];
        $original_price = $cart_item['data']->get_price();
        
        // Products 150, 153 don't get the discount
        $excluded_products = array(150, 153);
        
        if (!in_array($product_id, $excluded_products) && $rental_days > 1) {
            // First day at full price, additional days at 50%
            $discounted_price = $original_price + ($original_price * 0.5 * ($rental_days - 1));
            
            // Store original price for display purposes
            $cart_item['original_rental_price'] = $original_price * $rental_days;
            $cart_item['rental_discount'] = $cart_item['original_rental_price'] - $discounted_price;
            
            // Set the new price
            $cart_item['data']->set_price($discounted_price);
        } else {
            // For excluded products or single-day rentals, just multiply by days
            $cart_item['data']->set_price($original_price * $rental_days);
        }
    }
}

/**
 * Check if a cart item is a rental product
 *
 * @param array $cart_item Cart item data
 * @return bool True if the item is a rental product
 */
function mitnafun_is_rental_item($cart_item) {
    // Check various potential rental date fields
    return 
        !empty($cart_item['rental_dates']) || 
        !empty($cart_item['Rental Dates']) || 
        !empty($cart_item['rental_date']);
}

/**
 * Get rental dates from a cart item
 *
 * @param array $cart_item Cart item data
 * @return string|false Rental dates in format 'start - end' or false if not found
 */
function mitnafun_get_rental_dates($cart_item) {
    if (!empty($cart_item['rental_dates'])) {
        return $cart_item['rental_dates'];
    }
    
    if (!empty($cart_item['Rental Dates'])) {
        return $cart_item['Rental Dates'];
    }
    
    if (!empty($cart_item['rental_date'])) {
        return $cart_item['rental_date'];
    }
    
    // Search for any meta field containing rental dates
    if (isset($cart_item['data']) && isset($cart_item['data']->legacy_values) && is_array($cart_item['data']->legacy_values)) {
        foreach ($cart_item['data']->legacy_values as $key => $value) {
            if (strpos(strtolower($key), 'rental') !== false && strpos(strtolower($key), 'date') !== false) {
                return $value;
            }
        }
    }
    
    return false;
}

/**
 * Display rental days in cart item data
 *
 * @param array $item_data Existing item data
 * @param array $cart_item Cart item data
 * @return array Modified item data
 */
function mitnafun_add_rental_days_item_data($item_data, $cart_item) {
    if (!mitnafun_is_rental_item($cart_item)) {
        return $item_data;
    }
    
    // Get rental days
    $rental_days = isset($cart_item['rental_days']) ? $cart_item['rental_days'] : 0;
    
    if ($rental_days > 0) {
        $item_data[] = array(
            'key'   => 'ימי השכרה',  // Rental Days in Hebrew
            'value' => $rental_days,
            'display' => $rental_days,
        );
    }
    
    return $item_data;
}

/**
 * Display rental item price with discount information
 *
 * @param string $price Formatted price HTML
 * @param array $cart_item Cart item data
 * @param string $cart_item_key Cart item key
 * @return string Modified price HTML
 */
function mitnafun_rental_display_price($price, $cart_item, $cart_item_key) {
    // Only modify rental items with discount
    if (!mitnafun_is_rental_item($cart_item) || empty($cart_item['original_rental_price'])) {
        return $price;
    }
    
    $rental_days = isset($cart_item['rental_days']) ? $cart_item['rental_days'] : 1;
    if ($rental_days <= 1) {
        return $price; // No discount for 1 day
    }
    
    // Display the first day price only
    $first_day_price = $cart_item['data']->get_price() / ($rental_days - 0.5);
    $formatted_price = wc_price($first_day_price);
    
    // Add discount info
    $discount_info = sprintf(
        '<div class="rental-discount-info">יום ראשון: 100%%, ימים נוספים: 50%%</div>',
        $rental_days - 1
    );
    
    return $formatted_price . $discount_info;
}

/**
 * Display rental item subtotal with discount information
 *
 * @param string $subtotal Formatted subtotal HTML
 * @param array $cart_item Cart item data
 * @param string $cart_item_key Cart item key
 * @return string Modified subtotal HTML
 */
function mitnafun_rental_display_subtotal($subtotal, $cart_item, $cart_item_key) {
    // Only modify rental items with discount
    if (!mitnafun_is_rental_item($cart_item) || empty($cart_item['original_rental_price'])) {
        return $subtotal;
    }
    
    $rental_days = isset($cart_item['rental_days']) ? $cart_item['rental_days'] : 1;
    if ($rental_days <= 1) {
        return $subtotal; // No discount for 1 day
    }
    
    // Show original price with strikethrough
    $original_price = wc_price($cart_item['original_rental_price']);
    $savings = wc_price($cart_item['rental_discount']);
    
    // Create HTML for price breakdown
    $subtotal_html = sprintf(
        '%s <div class="rental-savings">מחיר מקורי: <span class="original-price">%s</span><br>חסכת: %s</div>',
        $subtotal,
        $original_price,
        $savings
    );
    
    return $subtotal_html;
}
