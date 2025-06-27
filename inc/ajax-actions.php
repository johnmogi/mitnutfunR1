<?php
$actions = [

    'apply_coupon',

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