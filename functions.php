<?php
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

// show_admin_bar( false );

add_action('wp_enqueue_scripts', 'load_style_script');
function load_style_script(){
    // Enqueue select2 from CDN (required for some plugins)
    wp_enqueue_style('select2', 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css');
    
    wp_enqueue_style('my-normalize', get_stylesheet_directory_uri() . '/css/normalize.css');
    wp_enqueue_style('my-Inter', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
    wp_enqueue_style('my-Lunasima', 'https://fonts.googleapis.com/css2?family=Lunasima:wght@400;700&display=swap');
    wp_enqueue_style('my-fancybox', get_stylesheet_directory_uri() . '/css/jquery.fancybox.min.css');
    wp_enqueue_style('my-nice-select', get_stylesheet_directory_uri() . '/css/nice-select.css');
    wp_enqueue_style('my-swiper', get_stylesheet_directory_uri() . '/css/swiper.min.css');
    wp_enqueue_style('air-datepicker', get_stylesheet_directory_uri() . '/css/air-datepicker.css');
    wp_enqueue_style('rental-datepicker', get_stylesheet_directory_uri() . '/css/rental-datepicker.css', array(), filemtime(get_stylesheet_directory() . '/css/rental-datepicker.css'));
    wp_enqueue_style('my-styles', get_stylesheet_directory_uri() . '/css/styles.css', array(), time());
    wp_enqueue_style('my-responsive', get_stylesheet_directory_uri() . '/css/responsive.css', array(), time());
    wp_enqueue_style('main-style', get_stylesheet_uri(), array(), filemtime(get_stylesheet_directory() . '/style.css'));
    
    // Enqueue admin-only CSS to hide debug elements
    wp_enqueue_style('admin-only', get_template_directory_uri() . '/css/admin-only.css', array(), filemtime(get_stylesheet_directory() . '/css/admin-only.css'));
    
    // Add checkout fix script on checkout page
    if (is_checkout()) {
        wp_enqueue_script('checkout-fix', get_template_directory_uri() . '/js/checkout-fix.js', array('jquery'), filemtime(get_stylesheet_directory() . '/js/checkout-fix.js'), true);
    }

    wp_enqueue_script('jquery');
    wp_enqueue_script('my-swiper', get_stylesheet_directory_uri() . '/js/swiper.js', array(), false, true);
    wp_enqueue_script('air-datepicker', get_stylesheet_directory_uri() . '/js/air-datepicker.js', array(), false, true);
    wp_enqueue_script('cuttr', get_stylesheet_directory_uri() . '/js/cuttr.min.js', array(), false, true);
    wp_enqueue_script('jquery.mask', get_stylesheet_directory_uri() . '/js/jquery.mask.min.js', array(), false, true);
    wp_enqueue_script('my-fancybox', get_stylesheet_directory_uri() . '/js/jquery.fancybox.min.js', array(), false, true);
    wp_enqueue_script('my-nice-select', get_stylesheet_directory_uri() . '/js/jquery.nice-select.min.js', array(), false, true);
    
    // Enqueue select2 JS from CDN (must be loaded before scripts that depend on it)
    wp_enqueue_script('select2', 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js', array('jquery'), null, true);
    
    // Localize script with necessary data for select2 initialization
    wp_enqueue_script('my-script', get_stylesheet_directory_uri() . '/js/script.js', array('jquery', 'select2'), time(), true);
    wp_enqueue_script('my-actions', get_stylesheet_directory_uri() . '/js/actions.js', array('jquery', 'select2'), time(), true);
    
    // Add the cart rental fix script
    wp_enqueue_script('cart-rental-fix', get_stylesheet_directory_uri() . '/js/cart-rental-fix.js', array('jquery'), filemtime(get_stylesheet_directory() . '/js/cart-rental-fix.js'), true);
    
    // Enqueue rental datepicker script on product pages
    if (is_product()) {
        wp_enqueue_script('rental-datepicker', 
            get_stylesheet_directory_uri() . '/js/rental-datepicker.js', 
            array('jquery', 'air-datepicker'), 
            filemtime(get_stylesheet_directory() . '/js/rental-datepicker.js'), 
            true
        );
        
        // Localize script with WooCommerce AJAX URL
        wp_localize_script('rental-datepicker', 'rentalDatepickerVars', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('rental-datepicker-nonce')
        ));
        
        // Localize script with necessary data
        wp_localize_script('rental-datepicker', 'wc_add_to_cart_params', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('rental_dates_nonce')
        ));
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
add_filter('woocommerce_cart_item_subtotal', 'fix_rental_cart_subtotal', 10, 3);
add_filter('woocommerce_cart_item_price', 'fix_rental_cart_price', 10, 3);

function fix_rental_cart_price($price, $cart_item, $cart_item_key) {
    // Check if this is a rental product by looking for rental dates
    if (!empty($cart_item['rental_dates']) || !empty($cart_item['Rental Dates']) || !empty($cart_item['rental_date'])) {
        // Get the product
        $_product = $cart_item['data'];
        
        // Calculate the total price (quantity * price)
        $total_price = $_product->get_price() * $cart_item['quantity'];
        
        // Format and return as a single price
        return wc_price($total_price);
    }
    
    return $price;
}

function fix_rental_cart_subtotal($subtotal, $cart_item, $cart_item_key) {
    // Check if this is a rental product by looking for rental dates
    if (!empty($cart_item['rental_dates']) || !empty($cart_item['Rental Dates']) || !empty($cart_item['rental_date'])) {
        // The subtotal is already calculated correctly, we just need to modify the displayed quantity
        // Get the product
        $_product = $cart_item['data'];
        
        // Calculate the total price (quantity * price)
        $total_price = $_product->get_price() * $cart_item['quantity'];
        
        // Format and return as a single price
        return wc_price($total_price);
    }
    
    return $subtotal;
}
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


