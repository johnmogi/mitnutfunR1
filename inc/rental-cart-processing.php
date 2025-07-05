<?php
/**
 * Rental Cart Processing Functions
 * Handles validation and processing of rental dates for the cart
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Validate rental dates before adding to cart
 * This provides server-side validation to prevent invalid date selections
 * 
 * @param bool $passed Whether validation passed
 * @param int $product_id Product ID being added to cart
 * @param int $quantity Quantity being added
 * @return bool Whether validation passed
 */
function mitnafun_validate_rental_dates_before_cart($passed, $product_id, $quantity) {
    // Enable error logging for this function
    $debug = true;
    
    if ($debug) {
        error_log('=== STARTING CART VALIDATION ===');
        error_log('Product ID: ' . $product_id);
        error_log('Quantity: ' . $quantity);
        return $passed;
    }
    
    // Only validate when the form is submitted
    if (!isset($_REQUEST['add-to-cart']) || !isset($_REQUEST['rental_dates'])) {
        if ($debug) error_log('Form not submitted or no rental dates, skipping validation');
        return $passed;
    }
    
    // Check if rental dates were provided
    if (!isset($_REQUEST['rental_dates']) || empty($_REQUEST['rental_dates'])) {
        $error_msg = __('יש לבחור תאריכי השכרה לפני הוספה לסל.', 'mitnafun-upro');
        if ($debug) error_log('No rental dates provided: ' . $error_msg);
        wc_add_notice($error_msg, 'error');
        return false;
    }
    
    // Get and sanitize the rental dates
    $rental_dates = sanitize_text_field(wp_unslash($_REQUEST['rental_dates']));
    if ($debug) error_log('Processing rental dates: ' . $rental_dates);
    
    $date_parts = array_map('trim', explode(' - ', $rental_dates));
    
    // Validate date format
    if (count($date_parts) !== 2) {
        $error_msg = __('פורמט תאריכי השכרה לא תקין.', 'mitnafun-upro');
        if ($debug) error_log('Invalid date format: ' . $rental_dates);
        wc_add_notice($error_msg, 'error');
        return false;
    }
    
    // Parse dates with error handling
    $start_date = DateTime::createFromFormat('d.m.Y', $date_parts[0]);
    $end_date = DateTime::createFromFormat('d.m.Y', $date_parts[1]);
    
    if (!$start_date || !$end_date) {
        $error_msg = __('תאריכי השכרה לא תקינים.', 'mitnafun-upro');
        if ($debug) {
            error_log('Failed to parse dates. Start: ' . $date_parts[0] . 
                    ', End: ' . $date_parts[1]);
            error_log('Start date valid: ' . ($start_date ? 'Yes' : 'No'));
            error_log('End date valid: ' . ($end_date ? 'Yes' : 'No'));
        }
        wc_add_notice($error_msg, 'error');
        return false;
    }
    
    // Check if start date is before end date
    if ($start_date > $end_date) {
        $error_msg = __('תאריך ההתחלה חייב להיות לפני תאריך הסיום.', 'mitnafun-upro');
        if ($debug) error_log('Start date after end date');
        wc_add_notice($error_msg, 'error');
        return false;
    }
    
    // Check if dates are in the past
    $today = new DateTime('today');
    if ($start_date < $today) {
        $error_msg = __('לא ניתן להזמין לתאריכים שעברו.', 'mitnafun-upro');
        if ($debug) error_log('Start date in the past');
        wc_add_notice($error_msg, 'error');
        return false;
    }
    
    // Get initial stock (total available) - hook into existing function if available
    $initial_stock = 1; // Default value
    if (function_exists('mitnafun_get_initial_stock')) {
        $initial_stock = mitnafun_get_initial_stock($product_id);
    }
    if ($debug) error_log('Initial stock: ' . print_r($initial_stock, true));
    
    // If we can't determine initial stock, log and allow the order
    if ($initial_stock === false || $initial_stock === '') {
        if ($debug) error_log('No initial stock found, allowing order');
        return $passed;
    }
    
    // Get reserved dates for this product
    $reserved_dates = [];
    if (function_exists('get_product_reserved_dates')) {
        $reserved_dates = get_product_reserved_dates($product_id);
        if ($debug) error_log('Found ' . count($reserved_dates) . ' reserved date ranges');
    }
    
    // Count reservations per day
    $reservations_by_day = [];
    foreach ($reserved_dates as $range) {
        $range_parts = array_map('trim', explode(' - ', $range));
        if (count($range_parts) === 2) {
            $range_start = DateTime::createFromFormat('d.m.Y', $range_parts[0]);
            $range_end = DateTime::createFromFormat('d.m.Y', $range_parts[1]);
            
            if ($range_start && $range_end) {
                $current = clone $range_start;
                while ($current <= $range_end) {
                    $day_key = $current->format('Y-m-d');
                    if (!isset($reservations_by_day[$day_key])) {
                        $reservations_by_day[$day_key] = 0;
                    }
                    $reservations_by_day[$day_key]++;
                    $current->modify('+1 day');
                }
            }
        }
    }
    
    // Check if any day in the selected range is fully booked
    $current = clone $start_date;
    $end_date_clone = clone $end_date;
    
    if ($debug) {
        error_log('Checking availability from ' . $start_date->format('Y-m-d') . 
                 ' to ' . $end_date->format('Y-m-d'));
    }
    
    while ($current <= $end_date_clone) {
        $day_key = $current->format('Y-m-d');
        $reservations = isset($reservations_by_day[$day_key]) ? $reservations_by_day[$day_key] : 0;
        
        if ($debug) {
            error_log('Checking date: ' . $day_key . 
                    ', Reservations: ' . $reservations . 
                    ', Initial stock: ' . $initial_stock);
        }
        
        // If reservations for this day equal or exceed stock, it's not available
        if ($reservations >= $initial_stock) {
            $formatted_date = $current->format('d.m.Y');
            $error_msg = sprintf(
                __('התאריך %s אינו זמין להזמנה - אין מספיק מלאי זמין.', 'mitnafun-upro'), 
                $formatted_date
            );
            
            if ($debug) {
                error_log('Date not available: ' . $formatted_date . 
                         ' (Reservations: ' . $reservations . 
                         ', Stock: ' . $initial_stock . ')');
            }
            
            wc_add_notice($error_msg, 'error');
            return false;
        }
        
        $current->modify('+1 day');
    }
    
    // Now, CRITICALLY IMPORTANT: Add rental dates as cart item data
    // This ensures the dates are stored with the cart item and passed through checkout
    add_filter('woocommerce_add_cart_item_data', function($cart_item_data, $product_id) use ($rental_dates, $debug) {
        if ($debug) error_log('Adding rental dates to cart item data: ' . $rental_dates);
        
        if (!empty($rental_dates)) {
            $cart_item_data['rental_dates'] = $rental_dates;
            
            // Also store the date parts for easier access
            $date_parts = array_map('trim', explode(' - ', $rental_dates));
            if (count($date_parts) === 2) {
                $cart_item_data['rental_start_date'] = $date_parts[0];
                $cart_item_data['rental_end_date'] = $date_parts[1];
            }
        }
        
        return $cart_item_data;
    }, 10, 2);
    
    if ($debug) {
        error_log('All dates available');
        error_log('=== END CART VALIDATION (SUCCESS) ===');
    }
    
    // All checks passed
    return $passed;
}
add_filter('woocommerce_add_to_cart_validation', 'mitnafun_validate_rental_dates_before_cart', 10, 3);

/**
 * Add rental dates to cart item display
 * This adds the rental dates to the cart item so they're visible in the cart page
 */
function mitnafun_add_rental_dates_to_cart_display($item_data, $cart_item) {
    if (isset($cart_item['rental_dates']) && !empty($cart_item['rental_dates'])) {
        $item_data[] = array(
            'key'   => __('תאריכי השכרה', 'mitnafun-upro'),
            'value' => wc_clean($cart_item['rental_dates']),
            'display' => '',
        );
    }
    return $item_data;
}
add_filter('woocommerce_get_item_data', 'mitnafun_add_rental_dates_to_cart_display', 10, 2);

/**
 * Add rental dates to order item meta
 * This ensures the rental dates are saved with the order when placed
 */
function mitnafun_add_rental_dates_to_order_items($item, $cart_item_key, $values, $order) {
    if (isset($values['rental_dates']) && !empty($values['rental_dates'])) {
        $item->add_meta_data(__('תאריכי השכרה', 'mitnafun-upro'), $values['rental_dates']);
        
        // Also add the individual parts if available
        if (isset($values['rental_start_date'])) {
            $item->add_meta_data('_rental_start_date', $values['rental_start_date']);
        }
        if (isset($values['rental_end_date'])) {
            $item->add_meta_data('_rental_end_date', $values['rental_end_date']);
        }
    }
}
add_action('woocommerce_checkout_create_order_line_item', 'mitnafun_add_rental_dates_to_order_items', 10, 4);
