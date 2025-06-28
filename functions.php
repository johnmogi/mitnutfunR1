<?php

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
    wp_enqueue_style('my-styles', get_stylesheet_directory_uri() . '/css/styles.css', array(), time());
    wp_enqueue_style('my-responsive', get_stylesheet_directory_uri() . '/css/responsive.css', array(), time());
    wp_enqueue_style('my-style-main', get_stylesheet_directory_uri() . '/style.css', array(), time());

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
}


add_action('after_setup_theme', function(){
    register_nav_menus( array(
        'header' => 'Header menu',
        'footer' => 'Footer menu'
    ) );
});


add_theme_support( 'title-tag' );
add_theme_support('html5');
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


function get_rental_dates_for_product($product_id) {
    // Ensure WooCommerce is available
    if (!class_exists('WooCommerce')) {
        return;
    }

    // Initialize the dates array
    $rental_dates = [];

    // Get all orders
    $args = array(
        'limit' => -1, // Get all orders
        'status' => 'any', // Any status
    );
    $orders = wc_get_orders($args);

    // Loop through each order
    foreach ($orders as $order) {
        // Loop through each item in the order
        foreach ($order->get_items() as $item_id => $item) {
            // Check if the item is the product we're interested in
            if ($item->get_product_id() == $product_id) {
                $product = new WC_Product($product_id);
                $inventory = $product->get_stock_quantity();
                if ($inventory > 1)
                    continue;
                // Get the rental dates (assuming they are stored as item meta)
                $dates = wc_get_order_item_meta($item_id, 'Rental Dates', true);
                if ($dates) {
                    $rental_dates[] = $dates;
                }
            }
        }
    }

    return $rental_dates;
}


