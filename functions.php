<?php
// Suppress PHP notices and deprecation warnings in debug.log
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_USER_DEPRECATED);
ini_set('display_errors', 'Off');

// Include rental cart processing functions
include_once 'inc/rental-cart-processing.php';

/**
 * CRITICAL FIX: Selective WooCommerce template loader
 * Only loads WooCommerce default templates for problematic files, uses theme templates for all others
 */
function mitnafun_selective_template_loader($template, $template_name, $args) {
    // Get theme and plugin directories
    $theme_dir = get_stylesheet_directory() . '/woocommerce/';
    $plugin_dir = WC()->plugin_path() . '/templates/';
    
    // Check if we're on the cart page and it should be using the default WooCommerce template
    if (is_cart() && !empty($_POST['add-to-cart']) || isset($_GET['add-to-cart'])) {
        if ($template_name === 'cart/cart.php' || $template_name === 'cart/cart-empty.php') {
            // Force use of WooCommerce's default cart template when adding items
            error_log('WooCommerce cart template override: Using default ' . $template_name);
            return $plugin_dir . $template_name;
        }
    }
    
    // Always use WooCommerce default cart-empty template if cart is NOT empty
    // This prevents the bug where cart-empty.php shows even when cart has items
    if ($template_name === 'cart/cart-empty.php' && function_exists('WC') && WC()->cart && !WC()->cart->is_empty()) {
        error_log('Cart has items but empty template was selected. Forcing regular cart template.');
        return $plugin_dir . 'cart/cart.php';
    }
    
    // For all other templates, use the theme's version if it exists
    if (file_exists($theme_dir . $template_name)) {
        return $theme_dir . $template_name;
    }
    
    // Fall back to plugin's version
    return $template;
}
// Add with very high priority (1) to override any other template selection logic
add_filter('woocommerce_locate_template', 'mitnafun_selective_template_loader', 1, 3);

/**
 * Custom error handler to suppress specific notices
 */
function custom_error_handler($errno, $errstr, $errfile, $errline) {
    // Suppress BeRocket translation loading notice
    if (strpos($errstr, '_load_textdomain_just_in_time') !== false) {
        return true;
    }
    
    // Let the default error handler handle other errors
    return false;
}

// Set custom error handler
set_error_handler('custom_error_handler', E_NOTICE);

include 'inc/checkout.php';
include 'inc/ajax-actions.php';
include 'inc/kama_pagenavi.php';
include 'inc/bookings.php';
include 'inc/rental-pricing.php';

// show_admin_bar( false );

// Ensure WooCommerce cart fragments are properly loaded
function ensure_wc_cart_fragments() {
    if (function_exists('is_woocommerce')) {
        wp_enqueue_script('wc-cart-fragments');
        
        // Force cart data to session on checkout page to prevent empty cart
        if (is_checkout() && !WC()->cart->is_empty()) {
            // Log debug information
            error_log('Checkout page loaded with ' . WC()->cart->get_cart_contents_count() . ' items in cart');
            
            // Force WooCommerce to save cart to session
            WC()->cart->get_cart_from_session();
            WC()->cart->set_session();
            
            // Make sure each cart item has its rental dates properly set
            foreach (WC()->cart->get_cart() as $cart_item_key => $cart_item) {
                // Check if this is a rental product that should have dates
                if (isset($cart_item['rental_dates']) && !empty($cart_item['rental_dates'])) {
                    // Log the rental dates being preserved
                    error_log('Preserving rental dates for product ' . $cart_item['product_id'] . ': ' . $cart_item['rental_dates']);
                }
            }
            
            // Add debug info to page
            add_action('woocommerce_before_checkout_form', function() {
                echo '<!-- CHECKOUT DEBUG: Cart has ' . WC()->cart->get_cart_contents_count() . ' items -->';
                echo '<!-- Cart Hash: ' . md5(serialize(WC()->cart->get_cart())) . ' -->';
                
                // Add rental dates debug info
                foreach (WC()->cart->get_cart() as $cart_item_key => $cart_item) {
                    if (isset($cart_item['rental_dates']) && !empty($cart_item['rental_dates'])) {
                        echo '<!-- Product ' . $cart_item['product_id'] . ' rental dates: ' . $cart_item['rental_dates'] . ' -->';
                    }
                }
            }, 1);
        }
    }
}

// Ensure rental dates are passed to order meta
function add_rental_dates_to_order_items($item, $cart_item_key, $values, $order) {
    // Check if this item has rental dates
    if (isset($values['rental_dates']) && !empty($values['rental_dates'])) {
        // Add rental dates as order item meta
        $item->add_meta_data('rental_dates', $values['rental_dates']);
        
        // Add rental days calculation to order item meta
        if (isset($values['rental_days']) && !empty($values['rental_days'])) {
            $item->add_meta_data('rental_days', $values['rental_days']);
        }
        
        // Log that we're adding the rental dates to the order
        error_log('Added rental dates to order item: ' . $values['rental_dates']);
    }
}

/**
 * Display rental dates information in cart and checkout
 */
function display_rental_dates_in_cart_checkout($item_data, $cart_item) {
    // Check if this item has rental dates
    if (isset($cart_item['rental_dates']) && !empty($cart_item['rental_dates'])) {
        // Add rental dates to cart/checkout display
        $item_data[] = array(
            'key'     => 'תאריכי השכרה',
            'value'   => wc_clean($cart_item['rental_dates']),
            'display' => '',
        );
        
        // If we have calculated rental days, show them as well
        if (isset($cart_item['rental_days']) && !empty($cart_item['rental_days'])) {
            // Add rental days (with special pricing info if applicable)
            $rental_days = intval($cart_item['rental_days']);
            $day_text = $rental_days == 1 ? 'יום' : 'ימים';
            
            $item_data[] = array(
                'key'     => 'תקופת השכרה',
                'value'   => $rental_days . ' ' . $day_text,
                'display' => '',
            );
        }
    }
    
    return $item_data;
}
add_filter('woocommerce_get_item_data', 'display_rental_dates_in_cart_checkout', 10, 2);

/**
 * Setup checkout page AJAX helper endpoint
 * This ensures we can restore cart data if checkout seems empty
 */
function register_checkout_cart_ajax_endpoint() {
    add_action('wp_ajax_get_checkout_cart_status', 'get_checkout_cart_status_callback');
    add_action('wp_ajax_nopriv_get_checkout_cart_status', 'get_checkout_cart_status_callback');
}
add_action('init', 'register_checkout_cart_ajax_endpoint');

/**
 * AJAX callback to check cart status and send cart items data
 */
function get_checkout_cart_status_callback() {
    // Security check
    check_ajax_referer('checkout_cart_nonce', 'security');
    
    $response = array(
        'success' => false,
        'cart_count' => 0,
        'cart_items' => array(),
        'message' => ''
    );
    
    if (function_exists('WC') && WC()->cart) {
        // Get cart contents
        $cart_count = WC()->cart->get_cart_contents_count();
        $cart_items = WC()->cart->get_cart();
        
        $response['success'] = true;
        $response['cart_count'] = $cart_count;
        $response['message'] = sprintf('Cart has %d items', $cart_count);
        
        // Add basic item info
        foreach($cart_items as $cart_item_key => $cart_item) {
            $product = $cart_item['data'];
            $response['cart_items'][] = array(
                'key' => $cart_item_key,
                'product_id' => $cart_item['product_id'],
                'quantity' => $cart_item['quantity'],
                'name' => $product->get_name(),
                'rental_dates' => isset($cart_item['rental_dates']) ? $cart_item['rental_dates'] : ''
            );
        }
        
        // Force WC session save
        WC()->cart->set_session();
    } else {
        $response['message'] = 'WooCommerce cart not available';
    }
    
    wp_send_json($response);
}
add_action('woocommerce_checkout_create_order_line_item', 'add_rental_dates_to_order_items', 10, 4);
add_action('wp_enqueue_scripts', 'ensure_wc_cart_fragments', 20);

// Force correct template on checkout page
add_filter('woocommerce_located_template', 'mitnafun_ensure_checkout_template', 100, 3);
function mitnafun_ensure_checkout_template($template, $template_name, $template_path) {
    // Only run on checkout page
    if (!is_checkout()) {
        return $template;
    }
    
    // Check if the cart is not empty but an empty template is being loaded
    if (function_exists('WC') && WC()->cart && !WC()->cart->is_empty() && 
        ($template_name === 'checkout/form-checkout.php' || $template_name === 'cart/cart-empty.php')) {
        
        // Log debug information
        error_log('Checkout template override: Cart has items but ' . $template_name . ' was selected');
        
        // Force the correct template from WooCommerce core
        if ($template_name === 'cart/cart-empty.php') {
            return WC()->plugin_path() . '/templates/checkout/form-checkout.php';
        }
    }
    
    return $template;
}

/**
 * Enqueue scripts and styles
 */
add_action('wp_enqueue_scripts', 'load_style_script', 20);
function load_style_script() {
    // Common styles loaded on all pages
    wp_enqueue_style('select2', 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css');
    wp_enqueue_style('my-normalize', get_stylesheet_directory_uri() . '/css/normalize.css');
    wp_enqueue_style('my-Inter', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
    wp_enqueue_style('my-Lunasima', 'https://fonts.googleapis.com/css2?family=Lunasima:wght@400;700&display=swap');
    wp_enqueue_style('my-fancybox', get_stylesheet_directory_uri() . '/css/jquery.fancybox.min.css');
    wp_enqueue_style('my-nice-select', get_stylesheet_directory_uri() . '/css/nice-select.css');
    wp_enqueue_style('my-swiper', get_stylesheet_directory_uri() . '/css/swiper.min.css');
    
    // Main theme styles
    wp_enqueue_style('my-styles', get_stylesheet_directory_uri() . '/css/styles.css', array(), filemtime(get_stylesheet_directory() . '/css/styles.css'));
    wp_enqueue_style('my-responsive', get_stylesheet_directory_uri() . '/css/responsive.css', array(), filemtime(get_stylesheet_directory() . '/css/responsive.css'));
    wp_enqueue_style('main-style', get_stylesheet_uri(), array(), filemtime(get_stylesheet_directory() . '/style.css'));
    
    // Admin-only styles (for frontend admin bar)
    if (is_admin_bar_showing()) {
        wp_enqueue_style('admin-only', get_template_directory_uri() . '/css/admin-only.css', array(), filemtime(get_stylesheet_directory() . '/css/admin-only.css'));
    }
    
    // Common scripts loaded on all pages
    wp_enqueue_script('jquery');
    wp_enqueue_script('my-swiper', get_stylesheet_directory_uri() . '/js/swiper.js', array('jquery'), '1.0', true);
    wp_enqueue_script('cuttr', get_stylesheet_directory_uri() . '/js/cuttr.min.js', array('jquery'), '1.0', true);
    wp_enqueue_script('jquery.mask', get_stylesheet_directory_uri() . '/js/jquery.mask.min.js', array('jquery'), '1.14.16', true);
    wp_enqueue_script('my-fancybox', get_stylesheet_directory_uri() . '/js/jquery.fancybox.min.js', array('jquery'), '3.5.7', true);
    wp_enqueue_script('my-nice-select', get_stylesheet_directory_uri() . '/js/jquery.nice-select.min.js', array('jquery'), '1.1.0', true);
    
    // Select2 for enhanced select fields
    wp_enqueue_script('select2', 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js', array('jquery'), '4.1.0-rc.0', true);
    
    // Main theme scripts
    wp_enqueue_script('my-script', get_stylesheet_directory_uri() . '/js/script.js', array('jquery', 'select2'), filemtime(get_stylesheet_directory() . '/js/script.js'), true);
    wp_enqueue_script('my-actions', get_stylesheet_directory_uri() . '/js/actions.js', array('jquery', 'select2'), filemtime(get_stylesheet_directory() . '/js/actions.js'), true);
    
    // Cart and checkout related scripts
    if (is_cart() || is_checkout() || is_product() || is_shop() || is_product_category()) {
        // Air Datepicker for rental date selection
        wp_enqueue_style('air-datepicker', get_stylesheet_directory_uri() . '/css/air-datepicker.css');
        wp_enqueue_script('air-datepicker', get_stylesheet_directory_uri() . '/js/air-datepicker.js', array('jquery'), '3.6.0', true);
        
        // Rental specific styles and scripts
        wp_enqueue_style('rental-datepicker', get_stylesheet_directory_uri() . '/css/rental-datepicker.css', array(), filemtime(get_stylesheet_directory() . '/css/rental-datepicker.css'));
        wp_enqueue_style('rental-pricing', get_stylesheet_directory_uri() . '/css/rental-pricing.css', array(), filemtime(get_stylesheet_directory() . '/css/rental-pricing.css'));
        
        // Cart and rental fixes - consolidated into one file
        wp_enqueue_script('cart-rental-fix', 
            get_stylesheet_directory_uri() . '/js/cart-rental-fix.js', 
            array('jquery', 'wc-cart-fragments'), 
            filemtime(get_stylesheet_directory() . '/js/cart-rental-fix.js'), 
            true
        );
        
        // Localize cart data
        wp_localize_script('cart-rental-fix', 'cartRentalVars', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('cart-rental-nonce')
        ));
    }
    
    // Checkout page specific scripts
    if (is_checkout()) {
        wp_enqueue_script('checkout-fixes', 
            get_stylesheet_directory_uri() . '/js/checkout-fix.js', 
            array('jquery', 'wc-checkout'), 
            filemtime(get_stylesheet_directory() . '/js/checkout-fix.js'), 
            true
        );
    }
    
    // Product page specific scripts
    if (is_product()) {
        // Enqueue rental datepicker script
        wp_enqueue_script('rental-datepicker', 
            get_stylesheet_directory_uri() . '/js/rental-datepicker.js', 
            array('jquery', 'air-datepicker', 'wc-add-to-cart'), 
            filemtime(get_stylesheet_directory() . '/js/rental-datepicker.js'), 
            true
        );
        
        // Localize script with necessary data
        wp_localize_script('rental-datepicker', 'rentalDatepickerVars', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('rental-datepicker-nonce'),
            'product_id' => get_the_ID(),
            'is_rental' => has_term('rental', 'product_cat', get_the_ID())
        ));
        
        // Add weekend price fix script with fixed version number
        wp_enqueue_script(
            'weekend-price-fix', 
            get_template_directory_uri() . '/js-fixes/weekend-price-fix.js', 
            array('jquery', 'rental-datepicker'), 
            '1.0.0', 
            true
        );
    }
    
    // Debug scripts - only load for admins
    if (current_user_can('manage_options') && (defined('WP_DEBUG') && WP_DEBUG)) {
        wp_enqueue_script('cart-debug', 
            get_stylesheet_directory_uri() . '/js/cart-debug.js', 
            array('jquery'), 
            filemtime(get_stylesheet_directory() . '/js/cart-debug.js'), 
            true
        );
    }
}


add_action('after_setup_theme', function(){
    register_nav_menus( array(
        'header' => 'Header menu',
        'footer' => 'Footer menu'
    ) );
});


add_theme_support( 'title-tag' );
// Add HTML5 support for specific elements
add_theme_support('html5', array(
    'search-form',
    'comment-form',
    'comment-list',
    'gallery',
    'caption',
    'style',
    'script',
    'navigation-widgets'
));
add_theme_support( 'post-thumbnails' );
add_theme_support( 'woocommerce' );


if( function_exists('acf_add_options_page') ) {

    acf_add_options_page(array(
        'page_title' 	=> 'Main settings',
        'menu_title'	=> 'Theme options',
        'menu_slug' 	=> 'theme-general-settings',
        'capability'	=> 'edit_posts',
        'redirect'		=> false
    ));
}


add_filter('wpcf7_autop_or_not', '__return_false');


add_filter('tiny_mce_before_init', 'override_mce_options');
function override_mce_options($initArray) {
    $opts = '*[*]';
    $initArray['valid_elements'] = $opts;
    $initArray['extended_valid_elements'] = $opts;
    return $initArray;
}


add_action('acf/input/admin_head', 'my_acf_admin_head');
function my_acf_admin_head() {
    $siteURL = get_bloginfo('stylesheet_directory').'/img/acf/';
    ?>
    <style>
        .imagePreview { position:absolute; right:100%; bottom:0; z-index:999999; border:1px solid #f2f2f2; box-shadow:0 0 3px #b6b6b6; background-color:#fff; padding:20px;}
        .imagePreview img { width:500px; height:auto; display:block; }
        .acf-tooltip li:hover { background-color:#0074a9; }
    </style>

    <script type="text/javascript">
        jQuery(document).ready(function($) {
            var waitForEl = function(selector, callback) {
                if (jQuery(selector).length) {
                    callback();
                } else {
                    setTimeout(function() {
                        waitForEl(selector, callback);
                    }, 100);
                }
            };
            $(document).on('click', 'a[data-name=add-layout]', function() {
                waitForEl('.acf-tooltip li', function() {
                    $('.acf-tooltip li a').hover(function() {
                        var imageTP = $(this).attr('data-layout');
                        var imageFormt = '.png';
                        $(this).append('<div class="imagePreview"><img src="<?php echo $siteURL; ?>'+ imageTP + imageFormt+'"></div>');
                    }, function() {
                        $('.imagePreview').remove();
                    });
                });
            })
        })
    </script>
    <?php
}


function my_output_images( $prepend_url, $separator = ',', $image_urls ) {
    // Turn the image URLs into an array.
    $image_urls = explode( $separator, $image_urls );

    // Remove empty entries.
    $image_urls = array_filter( $image_urls );

    // Prepend the URL to every image.
    foreach ( $image_urls as $key => $url ) {
        $image_urls[ $key ] = $prepend_url . trim( $url );
    }

    // Return a string of image URLs with the proper separator.
    return implode( $separator, $image_urls );
}

add_filter('get_the_archive_title_prefix','__return_false');


remove_filter('the_excerpt', 'wpautop');


/**
 * Get rental dates for a product
 * 
 * @param int $product_id The product ID
 * @return array Array of booked dates with their reservation counts
 */
function get_rental_dates_for_product($product_id) {
    // Ensure WooCommerce is available
    if (!class_exists('WooCommerce')) {
        return [];
    }

    // Initialize the dates array with counts
    $rental_dates = [];
    $date_counts = [];

    // Get all orders with any status
    $orders = wc_get_orders([
        'limit' => -1,
        'status' => array_keys(wc_get_order_statuses()),
        'date_created' => '>' . (time() - YEAR_IN_SECONDS), // Only check orders from the last year
        'return' => 'ids',
    ]);

    // Get initial stock level
    $product = wc_get_product($product_id);
    $initial_stock = $product ? (int) $product->get_stock_quantity() : 1;

    // Loop through each order
    foreach ($orders as $order_id) {
        $order = wc_get_order($order_id);
        if (!$order) continue;

        // Skip failed/cancelled/refunded orders
        if (in_array($order->get_status(), ['cancelled', 'refunded', 'failed'])) {
            continue;
        }

        // Check order items for this product
        foreach ($order->get_items() as $item) {
            if ($item->get_product_id() == $product_id) {
                // Get rental dates from order item meta
                $dates_meta = wc_get_order_item_meta($item->get_id(), 'Rental Dates', true);
                
                if ($dates_meta) {
                    // If it's a date range (format: YYYY-MM-DD - YYYY-MM-DD)
                    if (strpos($dates_meta, ' - ') !== false) {
                        list($start_date, $end_date) = array_map('trim', explode(' - ', $dates_meta));
                        $start = new DateTime($start_date);
                        $end = new DateTime($end_date);
                        $end->modify('+1 day'); // Include end date in range
                        
                        $interval = new DateInterval('P1D');
                        $period = new DatePeriod($start, $interval, $end);
                        
                        // Add each date in the range to our counts
                        foreach ($period as $date) {
                            $date_str = $date->format('Y-m-d');
                            if (!isset($date_counts[$date_str])) {
                                $date_counts[$date_str] = 0;
                            }
                            $date_counts[$date_str]++;
                        }
                    } else {
                        // Single date
                        $date_str = date('Y-m-d', strtotime($dates_meta));
                        if (!isset($date_counts[$date_str])) {
                            $date_counts[$date_str] = 0;
                        }
                        $date_counts[$date_str]++;
                    }
                }
            }
        }
    }

    // Convert to the format expected by the datepicker
    foreach ($date_counts as $date => $count) {
        if ($count >= $initial_stock) {
            $rental_dates[] = [
                'date' => $date,
                'status' => 'fully_booked',
                'count' => $count
            ];
        } else {
            $rental_dates[] = [
                'date' => $date,
                'status' => 'partially_booked',
                'count' => $count,
                'available' => $initial_stock - $count
            ];
        }
    }

    return $rental_dates;
}

/**
 * AJAX handler for getting rental dates
 */
add_action('wp_ajax_get_rental_dates', 'ajax_get_rental_dates');
add_action('wp_ajax_nopriv_get_rental_dates', 'ajax_get_rental_dates');

/**
 * Fix rental product display in cart
 * Makes rental products display as 1 item in cart regardless of days selected
 */
// Rental cart pricing is now handled in inc/rental-pricing.php

/**
 * Fix for the "Must select rental dates before adding to cart" error
 */
function rental_dates_value_fix() {
    // Only add this fix on single product pages
    if (!is_product()) return;
    
    ?>
    <script type="text/javascript">
    jQuery(document).ready(function($) {
        // Simple fix for the [object HTMLCollection] issue with rental_dates
        $('form.cart').on('submit', function(e) {
            // Get all rental_dates inputs (there might be multiple)
            var $rentalInputs = $('input[name="rental_dates"]');
            
            // If we have multiple inputs, fix the value
            if ($rentalInputs.length > 1) {
                console.log('Found multiple rental_dates inputs, fixing...');
                
                // Find the visible one that likely has the correct value
                var $visibleInput = $rentalInputs.filter(':visible').first();
                var correctValue = '';
                
                // Try to get the value from the visible input first
                if ($visibleInput.length && $visibleInput.val() && !$visibleInput.val().includes('[object')) {
                    correctValue = $visibleInput.val();
                }
                
                // If that didn't work, try to construct it from the displayed dates
                if (!correctValue) {
                    var startDate = $('#selected-start-date').text();
                    var endDate = $('#selected-end-date').text();
                    
                    if (startDate && endDate) {
                        correctValue = startDate + ' - ' + endDate;
                    }
                }
                
                // If we found a valid value, set it on the form's main input
                if (correctValue) {
                    // Set the value on the first input in the form
                    $(this).find('input[name="rental_dates"]').val(correctValue);
                    console.log('Fixed rental_dates value: ' + correctValue);
                } else {
                    // If no valid dates, prevent submission
                    console.log('No valid dates selected');
                    e.preventDefault();
                    alert('יש לבחור תאריכי השכרה לפני הוספה לסל');
                }
            }
        });
    });
    </script>
    <?php
}
add_action('wp_footer', 'rental_dates_value_fix');

// Include cart pricing fix to ensure correct rental pricing in cart/checkout
require_once get_template_directory() . '/js-fixes/cart-pricing-fix.php';

// Include script deactivation to prevent price calculation conflicts
require_once get_template_directory() . '/js-fixes/deactivate-price-scripts.php';

/**
 * Enqueue enhanced rental display script
 * This script improves the display of rental dates and price breakdown throughout the site
 */
function enqueue_enhanced_rental_display() {
    // Only enqueue on front-end pages where rentals might be displayed
    if (!is_admin()) {
        // Add debugging script in header
        wp_enqueue_script(
            'debug-rental',
            get_template_directory_uri() . '/js/debug-rental.js',
            array('jquery'),
            filemtime(get_template_directory() . '/js/debug-rental.js'),
            false // Load in header
        );
        
        // Add critical rental form fix - must load very early
        wp_enqueue_script(
            'rental-form-fix',
            get_template_directory_uri() . '/js/rental-form-fix.js',
            array('jquery'),
            filemtime(get_template_directory() . '/js/rental-form-fix.js'),
            false // Load in header to ensure it loads before other scripts
        );
        
        // Add rental datepicker fix - must load before datepicker
        wp_enqueue_script(
            'rental-datepicker-fix',
            get_template_directory_uri() . '/js/rental-datepicker-fix.js',
            array('jquery'),
            filemtime(get_template_directory() . '/js/rental-datepicker-fix.js'),
            false // Load in header to ensure it loads before other scripts
        );
        
        // Enqueue rental datepicker script on product pages
        if (is_product()) {
            wp_enqueue_script('rental-datepicker', 
                             get_template_directory_uri() . '/js/rental-datepicker.js', 
                             array('jquery', 'rental-datepicker-base'), 
                             filemtime(get_template_directory() . '/js/rental-datepicker.js'), 
                             true);
            
            // Add rental display and debugging scripts
            wp_enqueue_script('debug-rental', get_template_directory_uri() . '/js/debug-rental.js', 
                             array('jquery'), filemtime(get_template_directory() . '/js/debug-rental.js'), 
                             true);
            
            wp_enqueue_script('rental-datepicker-fix', get_template_directory_uri() . '/js/rental-datepicker-fix.js', 
                            array('jquery'), filemtime(get_template_directory() . '/js/rental-datepicker-fix.js'), 
                            true);
            
            wp_enqueue_script('enhanced-rental-display', get_template_directory_uri() . '/js/enhanced-rental-display.js', 
                            array('jquery'), filemtime(get_template_directory() . '/js/enhanced-rental-display.js'), 
                            true);
            
            // Add calendar booking status fix
            wp_enqueue_script('calendar-booking-fix', get_template_directory_uri() . '/js/calendar-booking-fix.js', 
                            array('jquery'), filemtime(get_template_directory() . '/js/calendar-booking-fix.js'), 
                            true);
            
            // Add join bookings logic
            wp_enqueue_script('calendar-join-bookings', get_template_directory_uri() . '/js/calendar-join-bookings.js', 
                             array('jquery'), filemtime(get_template_directory() . '/js/calendar-join-bookings.js'), 
                             true);
                             
            // Add product price breakdown display
            wp_enqueue_script('product-price-breakdown', get_template_directory_uri() . '/js/product-price-breakdown.js', 
                             array('jquery'), filemtime(get_template_directory() . '/js/product-price-breakdown.js'), 
                             true);
            
            // Add enhanced styling for AirDatepicker
            wp_enqueue_script('air-datepicker-enhanced-style', get_template_directory_uri() . '/js/air-datepicker-enhanced-style.js', 
                            array('jquery'), filemtime(get_template_directory() . '/js/air-datepicker-enhanced-style.js'), 
                            true);
            
            // Add join booking notice
            wp_enqueue_script('join-booking-notice', get_template_directory_uri() . '/js/join-booking-notice.js', 
                            array('jquery'), filemtime(get_template_directory() . '/js/join-booking-notice.js'), 
                            true);
<<<<<<< HEAD
        }
        
        // DISABLED: Original aggressive price override script was corrupted
        /*
        wp_enqueue_script(
            'aggressive-price-override',
            get_template_directory_uri() . '/js-fixes/aggressive-price-override.js',
            array('jquery'),
            '1.0.0', // Use fixed version to avoid caching issues
            true
        );
        */
        
        // DISABLED: Previous minimal implementation wasn't aggressive enough
        /*
        wp_enqueue_script(
            'price-override-minimal',
            get_template_directory_uri() . '/js-fixes/price-override-minimal.js',
            array('jquery'),
            '1.0.0', // Use fixed version to avoid caching issues
            true
        );
        */
        
        // DISABLED: Previous price override script had issues
        /*
        wp_enqueue_script(
            'price-override-fixed',
            get_template_directory_uri() . '/js-fixes/price-override-fixed.js',
            array('jquery'),
            '2.0.0', // Use fixed version to avoid caching issues
            true
        );
        */
        
        // NEW: Simple price enforcer script - focuses only on consistent pricing
        wp_enqueue_script(
            'price-enforcer',
            get_template_directory_uri() . '/js-fixes/price-enforcer.js',
            array('jquery'),
            '1.0.0', // Use fixed version to avoid caching issues
            true
        );
=======
            
            // Add calendar range validator
            wp_enqueue_script('calendar-range-validator', get_template_directory_uri() . '/js/calendar-range-validator.js', 
                            array('jquery'), filemtime(get_template_directory() . '/js/calendar-range-validator.js'), 
                            true);
        }    
>>>>>>> 953d390df977f5093e636eb81c68aa0bd44d5e2b
        
        // Add debug flag for development
        wp_localize_script('enhanced-rental-display', 'rentalConfig', array(
            'debug' => true,
            'rentalDebug' => true
        ));
    }
}
add_action('wp_enqueue_scripts', 'enqueue_enhanced_rental_display', 20);

function ajax_get_rental_dates() {
    // Verify nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'rental-datepicker-nonce')) {
        wp_send_json_error(array('message' => 'Invalid nonce'));
        wp_die();
    }
    
    // Get and validate product ID
    $product_id = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0;
    
    if ($product_id <= 0) {
        wp_send_json_error(array('message' => 'Invalid product ID'));
        wp_die();
    }
    
    // Get the dates
    $dates = get_rental_dates_for_product($product_id);
    
    // Send success response
    wp_send_json_success(array(
        'dates' => $dates,
        'product_id' => $product_id,
        'message' => 'Dates retrieved successfully'
    ));
    
    wp_die();
}


require_once( get_stylesheet_directory() . '/cart-test.php' );
