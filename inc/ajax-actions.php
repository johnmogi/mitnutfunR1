<?php
$actions = [
    'apply_coupon',
    'woocommerce_ajax_add_to_cart'
];

foreach($actions as $action){
    add_action('wp_ajax_'.$action, $action);
    add_action('wp_ajax_nopriv_'.$action, $action);
}



/* apply_coupon */

function apply_coupon(){

    $coupon = $_GET['coupon'];
    $coupon_obj =  new WC_Coupon($coupon);
    $exclude = $coupon_obj->get_exclude_sale_items();
    $coupon_code = wc_get_coupon_id_by_code($coupon);

    if ($exclude)
        $msg = __('-' );
    if ($coupon_code) {
        WC()->cart->apply_coupon($coupon);

        $total = WC()->cart->get_cart_total();
        $discount = WC()->cart->get_cart_discount_total();

        wp_send_json([
           // 'message' => '<span class="text-color-warning">'.__('Промокод успішно застосуваний', 'yos') . $msg .'</span>',
            'total' => $total,
            'discount' => $discount,
            'coupon' => $_POST['coupon'],
        ]);
    }else{
        $total = WC()->cart->get_cart_total();
        $discount = WC()->cart->get_cart_discount_total();
        wp_send_json(['message' => 'קופון לא חוקי',
            'total' => $total,
            'discount' => $discount,

            'exclude' => $exclude
        ]);
    }

    die();
}

/**
 * AJAX add to cart handler for direct checkout
 */
function woocommerce_ajax_add_to_cart() {
    ob_start();

    $product_id = apply_filters('woocommerce_add_to_cart_product_id', absint($_POST['product_id']));
    $quantity = empty($_POST['quantity']) ? 1 : wc_stock_amount($_POST['quantity']);
    $variation_id = 0;
    $variation = array();
    $passed_validation = apply_filters('woocommerce_add_to_cart_validation', true, $product_id, $quantity);

    // Get rental dates if provided
    $rental_dates = !empty($_POST['rental_dates']) ? sanitize_text_field($_POST['rental_dates']) : '';
    $cart_item_data = array();
    
    // Add rental dates to cart item data if available
    if (!empty($rental_dates)) {
        $cart_item_data['rental_dates'] = $rental_dates;
        // Also save in session for retrieval during checkout
        WC()->session->set('rental_dates_' . $product_id, $rental_dates);
    }

    // Try to add to cart
    if ($passed_validation && WC()->cart->add_to_cart($product_id, $quantity, $variation_id, $variation, $cart_item_data)) {
        do_action('woocommerce_ajax_added_to_cart', $product_id);

        // Return success
        $data = array(
            'success' => true,
            'product_id' => $product_id,
            'cart_hash' => WC()->cart->get_cart_hash(),
            'cart_quantity' => WC()->cart->get_cart_contents_count(),
        );

        // Get mini cart HTML to return
        ob_start();
        woocommerce_mini_cart();
        $mini_cart_html = ob_get_clean();

        if (!empty($mini_cart_html)) {
            $data['mini_cart'] = $mini_cart_html;
        }

        wp_send_json($data);
    } else {
        // Return error
        wp_send_json(array(
            'error' => true,
            'message' => __('Error adding product to cart. Please try again.', 'woocommerce')
        ));
    }

    wp_die();
}