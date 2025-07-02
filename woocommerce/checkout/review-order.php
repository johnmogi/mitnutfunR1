    <div class="aside woocommerce-checkout-review-order-table">
    <h3 class="title">פרטי השירות</h3>

    <?php
    do_action( 'woocommerce_before_mini_cart_contents' );
    
    // Modified mini_cart function to ensure rental dates appear
    foreach ( WC()->cart->get_cart() as $cart_item_key => $cart_item ) {
        $_product   = apply_filters( 'woocommerce_cart_item_product', $cart_item['data'], $cart_item, $cart_item_key );
        $product_id = apply_filters( 'woocommerce_cart_item_product_id', $cart_item['product_id'], $cart_item, $cart_item_key );

        if ( $_product && $_product->exists() && $cart_item['quantity'] > 0 ) {
            $product_name      = apply_filters( 'woocommerce_cart_item_name', $_product->get_name(), $cart_item, $cart_item_key );
            ?>
            <div class="item">
                <div class="text">
                    <div class="info">
                        <p class="name"><?php echo esc_html($product_name); ?></p>
                        <?php 
                        // Try different meta keys where rental dates might be stored
                        $rental_dates = '';
                        if (!empty($cart_item['rental_dates'])) {
                            $rental_dates = $cart_item['rental_dates'];
                        } elseif (!empty($cart_item['Rental Dates'])) {
                            $rental_dates = $cart_item['Rental Dates'];
                        } elseif (!empty($cart_item['rental_date'])) {
                            $rental_dates = $cart_item['rental_date'];
                        }
                        
                        // Display the rental dates if available
                        if (!empty($rental_dates)) {
                            echo '<p class="rental-dates"><strong>תאריכי השכרה:</strong> ' . esc_html($rental_dates) . '</p>';
                            // Removed rental days display here to avoid duplication
                        }
                        ?>
                    </div>
                    <div class="cost">
                        <?php 
                        // Always show the total price for rental items
                        $is_rental = !empty($rental_dates);
                        if ($is_rental) {
                            // Use the filtered subtotal which includes our discount info
                            $price = apply_filters('woocommerce_cart_item_subtotal', WC()->cart->get_product_subtotal($_product, $cart_item['quantity']), $cart_item, $cart_item_key);
                            
                            // Check for original price and discount data
                            if (!empty($cart_item['original_rental_price'])) {
                                $original_price = wc_price($cart_item['original_rental_price']);
                                $savings = !empty($cart_item['rental_discount']) ? wc_price($cart_item['rental_discount']) : 0;
                                
                                // Get the filtered price without our additional savings info
                                $price_only = preg_replace('/<div class="rental-discount-info">.*?<\/div>/', '', $price);
                                
                                echo '<div class="checkout-review rental-price">' . $price_only;
                                echo ' <div class="rental-savings">מחיר מקורי: <span class="original-price">' . $original_price . '</span>';
                                if ($savings) {
                                    echo '<br>חסכת: ' . $savings . '</span>';
                                }
                                echo '</div></div>';
                            } else {
                                echo '<div class="checkout-review rental-price">' . $price . '</div>';
                            }
                        } else {
                            echo apply_filters('woocommerce_cart_item_price', WC()->cart->get_product_price($_product), $cart_item, $cart_item_key);
                            echo ' x ' . $cart_item['quantity'];
                        }
                        ?>
                    </div>
                </div>
            </div>
            <?php
        }
    }
    
    // Add rental price breakdown if there are rentals in cart
    // We've removed the rental breakdown section to simplify the display
    // The discounts are already shown on each line item in the cart
    ?>
    <!-- Styles for rental items (kept for reference but no longer needed for breakdown) -->
    <style>
    .rental-item-days, .rental-item-discount {
        color: #666;
        font-size: 0.9em;
        margin: 3px 0;
    }
    .rental-item-savings {
        color: #4CAF50;
        font-weight: bold;
        margin-top: 5px;
    }
    </style>

<div class="text">
    <?php if ( wc_coupons_enabled() ) { ?>
        <div class="coupon">
            <label for="coupon_code" class="screen-reader-text"><?php esc_html_e( 'Coupon:', 'woocommerce' ); ?></label> <input type="text" name="coupon_code" class="input-text" id="coupon_code" value="" placeholder="<?php esc_attr_e( 'Coupon code', 'woocommerce' ); ?>" /> <button type="submit" class="button<?php echo esc_attr( wc_wp_theme_get_element_class_name( 'button' ) ? ' ' . wc_wp_theme_get_element_class_name( 'button' ) : '' ); ?>" name="apply_coupon" value="<?php esc_attr_e( 'Apply coupon', 'woocommerce' ); ?>"><?php esc_html_e( 'Apply coupon', 'woocommerce' ); ?></button>
            <?php do_action( 'woocommerce_cart_coupon' ); ?>
        </div>
    <?php } ?>

    <div class="line"></div>
    <ul>

        <?php foreach ( WC()->cart->get_coupons() as $code => $coupon ) : ?>
            <li class="cart-discount coupon-<?php echo esc_attr( sanitize_title( $code ) ); ?>">
                <p><?php wc_cart_totals_coupon_label( $coupon ); ?></p>
                <p><?php wc_cart_totals_coupon_html( $coupon ); ?></p>
            </li>
        <?php endforeach; ?>

        <?php foreach ( WC()->cart->get_fees() as $fee ) : ?>
            <li class="fee">
                <p><?php echo esc_html( $fee->name ); ?></p>
                <p data-title="<?php echo esc_attr( $fee->name ); ?>"><?php wc_cart_totals_fee_html( $fee ); ?></p>
            </li>
        <?php endforeach; ?>


        <li><p>פרטי התשלום</p></li>
        <li>
            <p>סך הכל</p>
            <p><?php wc_cart_totals_order_total_html(); ?></p>
        </li>


    </ul>

    <div class="link-wrap">
        <a href="#" class="show-text"><img src="<?= get_template_directory_uri() ?>/img/icon-17.svg" alt=""> מדיניות ביטולים</a>
        <div class="info-text">
            <p><?php the_field('info', 'options') ?> </p>
        </div>
    </div>
</div>



</div>
