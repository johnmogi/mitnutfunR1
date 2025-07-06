<?php
/**
 * Rental Availability Validator
 * 
 * Prevents orders from being placed when a rental product is fully booked
 * for the selected dates.
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Rental_Availability_Validator {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        // Add validation before checkout processing
        add_action('woocommerce_checkout_process', array($this, 'validate_rental_availability'));
        
        // Add validation for AJAX add to cart
        add_filter('woocommerce_add_to_cart_validation', array($this, 'validate_add_to_cart'), 10, 6);
        
        // Add validation for cart updates
        add_filter('woocommerce_update_cart_validation', array($this, 'validate_cart_update'), 10, 4);
        
        // Add AJAX handler for direct availability checks
        add_action('wp_ajax_check_rental_availability', array($this, 'ajax_check_availability'));
        add_action('wp_ajax_nopriv_check_rental_availability', array($this, 'ajax_check_availability'));
    }
    
    /**
     * Validate rental availability before checkout
     */
    public function validate_rental_availability() {
        if (!WC()->cart) {
            return;
        }
        
        foreach (WC()->cart->get_cart() as $cart_item_key => $cart_item) {
            $product = $cart_item['data'];
            
            // Skip non-rental products
            if (!$this->is_rental_product($product)) {
                continue;
            }
            
            // Get rental dates from cart item
            $rental_dates = $this->get_rental_dates_from_cart_item($cart_item);
            if (!$rental_dates) {
                continue;
            }
            
            // Check availability for each date in the range
            $unavailable_dates = $this->get_unavailable_dates($product, $rental_dates['start_date'], $rental_dates['end_date']);
            
            if (!empty($unavailable_dates)) {
                $date_list = implode(', ', array_keys($unavailable_dates));
                $message = sprintf(
                    __('Sorry, "%s" is not available for the selected dates. The following dates are fully booked: %s', 'mitnafun'),
                    $product->get_name(),
                    $date_list
                );
                wc_add_notice($message, 'error');
            }
        }
    }
    
    /**
     * Validate rental availability when adding to cart
     */
    public function validate_add_to_cart($passed, $product_id, $quantity, $variation_id = 0, $variations = array(), $cart_item_data = array()) {
        $product = wc_get_product($variation_id ? $variation_id : $product_id);
        
        // Skip non-rental products
        if (!$this->is_rental_product($product)) {
            return $passed;
        }
        
        // Get rental dates from request
        $start_date = isset($_POST['rental_start_date']) ? sanitize_text_field($_POST['rental_start_date']) : '';
        $end_date = isset($_POST['rental_end_date']) ? sanitize_text_field($_POST['rental_end_date']) : '';
        
        if (empty($start_date) || empty($end_date)) {
            return $passed;
        }
        
        // Check availability
        $unavailable_dates = $this->get_unavailable_dates($product, $start_date, $end_date);
        
        if (!empty($unavailable_dates)) {
            $date_list = implode(', ', array_keys($unavailable_dates));
            $message = sprintf(
                __('Sorry, "%s" is not available for the selected dates. The following dates are fully booked: %s', 'mitnafun'),
                $product->get_name(),
                $date_list
            );
            wc_add_notice($message, 'error');
            return false;
        }
        
        return $passed;
    }
    
    /**
     * AJAX handler for checking rental availability
     */
    public function ajax_check_availability() {
        check_ajax_referer('rental-availability', 'nonce');
        
        $product_id = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0;
        $start_date = isset($_POST['start_date']) ? sanitize_text_field($_POST['start_date']) : '';
        $end_date = isset($_POST['end_date']) ? sanitize_text_field($_POST['end_date']) : '';
        
        if (!$product_id || !$start_date || !$end_date) {
            wp_send_json_error(__('Missing required parameters', 'mitnafun'));
        }
        
        $product = wc_get_product($product_id);
        if (!$product || !$this->is_rental_product($product)) {
            wp_send_json_error(__('Invalid product', 'mitnafun'));
        }
        
        $unavailable_dates = $this->get_unavailable_dates($product, $start_date, $end_date);
        
        if (!empty($unavailable_dates)) {
            wp_send_json_error([
                'message' => __('Selected dates are not available', 'mitnafun'),
                'unavailable_dates' => $unavailable_dates
            ]);
        }
        
        wp_send_json_success(['message' => __('Dates are available', 'mitnafun')]);
    }
    
    /**
     * Validate cart updates
     */
    public function validate_cart_update($passed, $cart_item_key, $values, $quantity) {
        $cart = WC()->cart->get_cart();
        if (!isset($cart[$cart_item_key])) {
            return $passed;
        }
        
        $product = $cart[$cart_item_key]['data'];
        if (!$this->is_rental_product($product)) {
            return $passed;
        }
        
        $rental_dates = $this->get_rental_dates_from_cart_item($cart[$cart_item_key]);
        if (!$rental_dates) {
            return $passed;
        }
        
        $unavailable_dates = $this->get_unavailable_dates($product, $rental_dates['start_date'], $rental_dates['end_date']);
        
        if (!empty($unavailable_dates)) {
            $date_list = implode(', ', array_keys($unavailable_dates));
            wc_add_notice(
                sprintf(
                    __('Cannot update quantity. The following dates are now fully booked: %s', 'mitnafun'),
                    $date_list
                ),
                'error'
            );
            return false;
        }
        
        return $passed;
    }
    
    /**
     * Check if a product is a rental product
     */
    private function is_rental_product($product) {
        if (!$product) {
            return false;
        }
        // Check for rental product type or category
        return $product->get_type() === 'rental' || has_term('rental', 'product_cat', $product->get_id());
    }
    
    /**
     * Get rental dates from cart item
     */
    /**
     * Get rental dates from cart item
     */
    private function get_rental_dates_from_cart_item($cart_item) {
        // Check if rental dates are stored in the cart item data
        if (!empty($cart_item['rental_dates'])) {
            $dates = explode(' - ', $cart_item['rental_dates']);
            if (count($dates) === 2) {
                return [
                    'start_date' => trim($dates[0]),
                    'end_date' => trim($dates[1])
                ];
            }
        }
        
        // Check for separate start/end date fields
        if (!empty($cart_item['rental_start_date']) && !empty($cart_item['rental_end_date'])) {
            return [
                'start_date' => $cart_item['rental_start_date'],
                'end_date' => $cart_item['rental_end_date']
            ];
        }
        
        return false;
    }
    
    /**
     * Get unavailable dates for a product within a date range
     */
    private function get_unavailable_dates($product, $start_date, $end_date) {
        $unavailable_dates = array();
        $initial_stock = $this->get_initial_stock($product);
        
        // Get all dates in the range
        $dates = $this->get_dates_in_range($start_date, $end_date);
        
        // Get existing bookings for these dates
        $booked_dates = $this->get_booked_dates($product->get_id(), $start_date, $end_date);
        
        // Check each date
        foreach ($dates as $date) {
            $date_str = $date->format('Y-m-d');
            $booked_count = isset($booked_dates[$date_str]) ? $booked_dates[$date_str] : 0;
            
            // Check if this date is fully booked
            if ($booked_count >= $initial_stock) {
                $unavailable_dates[$date_str] = $date->format(get_option('date_format'));
            }
        }
        
        return $unavailable_dates;
    }
    
    /**
     * Get the initial stock level for a product
     */
    private function get_initial_stock($product) {
        // Try to get initial stock from product meta
        $initial_stock = $product->get_meta('_initial_stock', true);
        
        // Fall back to current stock if initial stock not set
        if (empty($initial_stock)) {
            $initial_stock = $product->get_stock_quantity();
        }
        
        return max(1, (int)$initial_stock); // Ensure at least 1
    }
    
    /**
     * Get all dates in a range
     */
    private function get_dates_in_range($start_date, $end_date) {
        $start = new DateTime($start_date);
        $end = new DateTime($end_date);
        $end = $end->modify('+1 day'); // Include end date
        
        $interval = new DateInterval('P1D');
        $period = new DatePeriod($start, $interval, $end);
        
        $dates = array();
        foreach ($period as $date) {
            $dates[] = $date;
        }
        
        return $dates;
    }
    
    /**
     * Get booked dates for a product within a date range
     */
    /**
     * Get all order statuses that should be considered for availability
     */
    private function get_active_order_statuses() {
        return apply_filters('mitnafun_rental_active_order_statuses', [
            'wc-pending',
            'wc-processing',
            'wc-on-hold',
            'wc-completed'
        ]);
    }
    
    /**
     * Log debug information if WP_DEBUG is enabled
     */
    private function log($message, $data = null) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            if (is_array($data) || is_object($data)) {
                $message .= ' ' . print_r($data, true);
            }
            error_log('[Rental Validator] ' . $message);
        }
    }
    
    private function get_booked_dates($product_id, $start_date, $end_date) {
        global $wpdb;
        
        $booked_dates = array();
        
        try {
            // Prepare the date range for the query
            $start_date_obj = new DateTime($start_date);
            $end_date_obj = new DateTime($end_date);
            
            // Get all order statuses that should be considered
            $statuses = array_map('esc_sql', $this->get_active_order_statuses());
            $status_placeholders = implode("','", $statuses);
            
            // Query order items to find bookings for this product within the date range
            $query = $wpdb->prepare(
                "SELECT order_itemmeta.meta_value as rental_dates
                FROM {$wpdb->prefix}woocommerce_order_items as order_items
                LEFT JOIN {$wpdb->prefix}woocommerce_order_itemmeta as order_itemmeta 
                    ON order_items.order_item_id = order_itemmeta.order_item_id
                LEFT JOIN {$wpdb->prefix}woocommerce_order_itemmeta as order_itemmeta2 
                    ON order_items.order_item_id = order_itemmeta2.order_item_id
                WHERE order_items.order_item_type = 'line_item'
                AND order_itemmeta.meta_key = 'rental_dates'
                AND order_itemmeta2.meta_key = '_product_id'
                AND order_itemmeta2.meta_value = %d
                AND order_items.order_id IN (
                    SELECT ID FROM {$wpdb->posts}
                    WHERE post_type = 'shop_order'
                    AND post_status IN ('{$status_placeholders}')
                )",
                $product_id
            );
            
            $results = $wpdb->get_results($query);
            
            if ($wpdb->last_error) {
                $this->log('Database error when checking booked dates', $wpdb->last_error);
                return [];
            }
        
            // Count bookings for each date
            foreach ($results as $row) {
                $dates = explode(' - ', $row->rental_dates);
                if (count($dates) === 2) {
                    $start = new DateTime(trim($dates[0]));
                    $end = new DateTime(trim($dates[1]));
                    $end = $end->modify('+1 day'); // Include end date
                    
                    $interval = new DateInterval('P1D');
                    $period = new DatePeriod($start, $interval, $end);
                    
                    foreach ($period as $date) {
                        $date_str = $date->format('Y-m-d');
                        if (!isset($booked_dates[$date_str])) {
                            $booked_dates[$date_str] = 0;
                        }
                        $booked_dates[$date_str]++;
                    }
                }
            }
            
            return $booked_dates;
        } catch (Exception $e) {
            $this->log('Error processing booked dates', $e->getMessage());
            return [];
        }
    }
}

// Initialize the validator
add_action('woocommerce_init', function() {
    // Only initialize if WooCommerce is loaded
    if (function_exists('WC')) {
        Rental_Availability_Validator::get_instance();
    }
});

// Add nonce for AJAX requests
add_action('wp_enqueue_scripts', function() {
    if (is_product() || is_cart() || is_checkout()) {
        wp_localize_script('jquery', 'rental_availability', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('rental-availability'),
            'i18n' => [
                'dates_not_available' => __('Selected dates are not available', 'mitnafun'),
                'select_valid_dates' => __('Please select valid rental dates', 'mitnafun'),
                'server_error' => __('Server error. Please try again.', 'mitnafun')
            ]
        ]);
    }
});
