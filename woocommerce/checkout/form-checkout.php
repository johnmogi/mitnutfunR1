<?php
/**
 * Checkout Form
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/checkout/form-checkout.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see https://docs.woocommerce.com/document/template-structure/
 * @package WooCommerce/Templates
 * @version 3.5.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// CRITICAL FIX: Force check the cart state before proceeding
if (function_exists('WC') && WC()->cart) {
    // Get the cart contents count
    $cart_count = WC()->cart->get_cart_contents_count();
    
    // Debug information
    echo '<!-- CHECKOUT DEBUG: Cart has ' . $cart_count . ' items -->';
    
    // If the cart is empty but we have session fragments, try to recover
    if ($cart_count == 0 && WC()->session && WC()->session->get('cart')) {
        // Force cart reload from session
        WC()->cart->get_cart_from_session();
        
        // Check again after reload
        $cart_count = WC()->cart->get_cart_contents_count();
        echo '<!-- CHECKOUT DEBUG: After session reload, cart now has ' . $cart_count . ' items -->';
    }
    
    // If cart is still empty, redirect to shop
    if ($cart_count == 0) {
        // Only redirect if not already done so (prevent loops)
        if (!isset($_GET['cart_empty'])) {
            echo '<div class="woocommerce-info">העגלה ריקה, מוביל לחנות...</div>';
            echo '<script>setTimeout(function(){ window.location.href = "/shop/"; }, 1500);</script>';
            exit;
        }
    }
}

do_action( 'woocommerce_before_checkout_form', $checkout );

//

// If checkout registration is disabled and not logged in, the user cannot checkout.
if ( ! $checkout->is_registration_enabled() && $checkout->is_registration_required() && ! is_user_logged_in() ) {
	echo esc_html( apply_filters( 'woocommerce_checkout_must_be_logged_in_message', __( 'You must be logged in to checkout.', 'woocommerce' ) ) );
	return;
}

?>


        <?php wc_print_notices(); ?>
        <form name="checkout" method="post" class="checkout woocommerce-checkout " action="<?php echo esc_url( wc_get_checkout_url() ); ?>">
            <div class="content">
                <div class="main">
                    <h3 class="title">איסוף עצמי</h3>
                    <div class="form-wrap form-default">
                        <div class="input-wrap">
                            <input type="text" name="billing_first_name" id="name" placeholder="" required>
                            <label for="name">שם פרטי *</label>
                        </div>
                        <div class="input-wrap">
                            <input type="text" name="billing_last_name" id="surname" placeholder="" required>
                            <label for="surname">שם משפחה *</label>
                        </div>
                        <div class="input-wrap">
                            <input type="email" name="billing_email" id="email" placeholder="example@gmail.com" required>
                            <label for="email">שם משפחה *</label>
                        </div>
                        <div class="input-wrap">
                            <input type="tel" name="billing_phone" id="tel" placeholder="" required class="tel">
                            <label for="tel">מספר טלפון *</label>
                        </div>
                        <div class="input-wrap">
                            <input type="number" name="billing_guests" id="number" placeholder="10" required>
                            <label for="number">כמות המשתתפים *</label>
                        </div>


                        <?php //do_action( 'woocommerce_checkout_shipping' ); ?>
                        <div class="input-wrap">
                            <span class="woocommerce-input-wrapper">
                                <select class="select select2-time" data-placeholder="שעת איסוף" name="order_comments">
                                    <option></option>
                                    <?php foreach (get_field('pickup_time', 'option') as $time) { ?>
                                        <option value="<?= $time ?>"><?= $time ?></option>
                                    <?php } ?>

                                </select>
                            </span>
                        </div>
                        
                        <div class="input-wrap-checked">
                            <input type="checkbox" name="billing_check" id="check"  value="1">
                            <label for="check">הנני מאשר כי קיבלתי לידי את התנאים הכלליים המצורפים על נספחיהם, אלה הוסברו לי ואני מסכים לתוכנם</label>
                        </div>

                        <div class="input-wrap-checked" style="margin-top: 20px;">
                            <input type="checkbox" name="billing_check2" id="check2"  value="1">
                            <label for="check">החזרת המוצר תעשה עד 11:00 בבוקר למחרת יום ההשכרה, למעט השכרות בסוף השבוע בהן יוחזר המוצר ביום ראשון.</label>
                        </div>
                    </div>




                </div>
                <?php do_action( 'woocommerce_checkout_order_review' ); ?>

            </div>


            <div class="content">
                <div class="main">

                    <h3 class="title"><?= __( 'You may be interested in&hellip;', 'woocommerce' ) ?></h3>
                    <?php wc_get_template('cart/cross-sells.php') ?>
                </div>
                <div class="aside">
                    <h3 class="title">Payment</h3>
                    <?php woocommerce_checkout_payment(); ?>
                </div>
            </div>
        </form>







