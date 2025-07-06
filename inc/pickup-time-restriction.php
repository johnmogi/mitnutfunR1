<?php
/**
 * Pickup Time Restriction functionality
 * 
 * Handles restrictions for pickup times based on booking edge dates
 * For joined bookings, early morning pickup times are disabled if the item needs to be returned first
 * 
 * @version 1.0
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Add necessary scripts and hooks
 */
function mitnafun_init_pickup_time_restriction() {
    // Only load on frontend
    if (is_admin()) {
        return;
    }

    // Enqueue the JS script
    wp_enqueue_script(
        'pickup-time-restriction',
        get_template_directory_uri() . '/js/pickup-time-restriction.js',
        array('jquery'),
        filemtime(get_template_directory() . '/js/pickup-time-restriction.js'),
        true
    );

    // Register AJAX action to check for edge bookings in cart
    add_action('wp_ajax_check_edge_bookings_in_cart', 'mitnafun_check_edge_bookings_in_cart');
    add_action('wp_ajax_nopriv_check_edge_bookings_in_cart', 'mitnafun_check_edge_bookings_in_cart');
}
add_action('init', 'mitnafun_init_pickup_time_restriction');

/**
 * AJAX handler to check for edge bookings in cart
 */
function mitnafun_check_edge_bookings_in_cart() {
    // Verify nonce for security
    check_ajax_referer('update-order-review', 'security');

    $has_edge_booking = false;
    $return_time = '11:00'; // Default return time

    // Check each cart item for rental dates that end on the same day as another booking starts
    if (WC()->cart && !WC()->cart->is_empty()) {
        $cart_items = WC()->cart->get_cart();
        $start_dates = array();
        $end_dates = array();

        // First pass: collect all rental start and end dates
        foreach ($cart_items as $cart_item_key => $cart_item) {
            if (isset($cart_item['rental_dates'])) {
                $dates = explode(' - ', $cart_item['rental_dates']);
                if (count($dates) === 2) {
                    $start_date = trim($dates[0]);
                    $end_date = trim($dates[1]);
                    
                    $start_dates[$cart_item_key] = $start_date;
                    $end_dates[$cart_item_key] = $end_date;
                }
            }
        }

        // Second pass: check for edge bookings
        foreach ($start_dates as $item_key => $start_date) {
            foreach ($end_dates as $other_key => $end_date) {
                // Skip comparing an item with itself
                if ($item_key === $other_key) {
                    continue;
                }
                
                // If one booking's start date is the same as another booking's end date, we have an edge booking
                if ($start_date === $end_date) {
                    $has_edge_booking = true;
                    break 2; // Exit both loops
                }
            }
        }
    }

    // Get actual return time from settings if available
    $return_time = apply_filters('mitnafun_booking_return_time', $return_time);

    // Return the result
    wp_send_json_success(array(
        'has_edge_booking' => $has_edge_booking,
        'return_time' => $return_time
    ));
}

/**
 * Filter to allow customizing the return time
 */
function mitnafun_set_booking_return_time($return_time) {
    // You can customize the return time here or pull from theme options
    $custom_return_time = get_option('mitnafun_booking_return_time', '10:00');
    return !empty($custom_return_time) ? $custom_return_time : $return_time;
}
add_filter('mitnafun_booking_return_time', 'mitnafun_set_booking_return_time');

/**
 * Add an admin setting for return time
 */
function mitnafun_add_return_time_setting($settings) {
    $settings[] = array(
        'title'    => __('Return Time', 'mitnafun'),
        'desc'     => __('Set the time when rentals must be returned by (format: HH:MM)', 'mitnafun'),
        'id'       => 'mitnafun_booking_return_time',
        'default'  => '10:00',
        'type'     => 'text',
    );
    return $settings;
}
add_filter('woocommerce_general_settings', 'mitnafun_add_return_time_setting');
