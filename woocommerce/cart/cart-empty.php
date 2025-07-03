<?php
/**
 * Empty cart page
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/cart/cart-empty.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 7.0.1
 */

defined( 'ABSPATH' ) || exit;

// DEBUG: Check why empty cart template is loading
echo '<!-- CART-EMPTY TEMPLATE DEBUG: Empty cart template loaded -->\n';
echo '<!-- Cart has ' . WC()->cart->get_cart_contents_count() . ' items -->\n';
echo '<!-- Cart total: ' . WC()->cart->get_cart_total() . ' -->\n';
echo '<!-- URL: ' . esc_url($_SERVER['REQUEST_URI']) . ' -->\n';
echo '<!-- Query String: ' . esc_html($_SERVER['QUERY_STRING'] ?? '') . ' -->\n';

// CRITICAL FIX: If cart actually has items, force load the correct cart template
if (WC()->cart && !WC()->cart->is_empty()) {
    echo '<!-- FIX APPLIED: Redirecting to standard cart template since cart is NOT empty -->\n';
    
    // Load the correct cart template
    wc_get_template('cart/cart.php');
    
    // Exit to prevent the empty cart template from loading
    exit;
}

// Only proceed with empty cart template if cart is actually empty
echo '<!-- Confirmed cart is actually empty, proceeding with empty cart template -->\n';

// ENHANCED DEBUG: Check if this template should really be loading
if (WC()->cart && WC()->cart->get_cart_contents_count() > 0) {
    echo '<!-- ERROR: Empty cart template is still loading even though cart has ' . WC()->cart->get_cart_contents_count() . ' items! -->\n';
    echo '<!-- This indicates a theme/plugin conflict or template loading issue -->\n';
    
    // Display debug info about cart contents
    echo '<!-- CART DEBUG - Cart Contents: -->\n';
    foreach (WC()->cart->get_cart() as $cart_item_key => $cart_item) {
        $product_id = $cart_item['product_id'];
        $product_name = isset($cart_item['data']) ? $cart_item['data']->get_name() : 'Unknown';
        echo '<!-- Item: ' . esc_html($product_name) . ' (ID: ' . esc_html($product_id) . ') -->\n';
    }
    
    // Display debug hooks that might be interfering
    echo '<!-- Checking for potentially interfering hooks -->\n';
    global $wp_filter;
    $relevant_hooks = ['woocommerce_before_cart', 'woocommerce_cart_is_empty'];
    
    foreach ($relevant_hooks as $hook) {
        if (isset($wp_filter[$hook])) {
            $count = count($wp_filter[$hook]->callbacks);
            echo '<!-- Hook: ' . esc_html($hook) . ' has ' . esc_html($count) . ' callbacks -->\n';
        } else {
            echo '<!-- Hook: ' . esc_html($hook) . ' not found -->\n';
        }
    }
}

/*
 * @hooked wc_empty_cart_message - 10
 */
do_action( 'woocommerce_cart_is_empty' );

if ( wc_get_page_id( 'shop' ) > 0 ) : ?>
	<p class="return-to-shop">
		<a class="button wc-backward<?php echo esc_attr( wc_wp_theme_get_element_class_name( 'button' ) ? ' ' . wc_wp_theme_get_element_class_name( 'button' ) : '' ); ?>" href="<?php echo esc_url( apply_filters( 'woocommerce_return_to_shop_redirect', wc_get_page_permalink( 'shop' ) ) ); ?>">
			<?php
				/**
				 * Filter "Return To Shop" text.
				 *
				 * @since 4.6.0
				 * @param string $default_text Default text.
				 */
				echo esc_html( apply_filters( 'woocommerce_return_to_shop_text', __( 'Return to shop', 'woocommerce' ) ) );
			?>
		</a>
	</p>
<?php endif; ?>
