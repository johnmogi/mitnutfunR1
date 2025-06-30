    <div class="aside woocommerce-checkout-review-order-table"">
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
                        }
                        ?>
                    </div>
                    <div class="cost">
                        <?php 
                        // Always show the total price for rental items
                        $is_rental = !empty($rental_dates);
                        if ($is_rental) {
                            $price = apply_filters('woocommerce_cart_item_subtotal', WC()->cart->get_product_subtotal($_product, $cart_item['quantity']), $cart_item, $cart_item_key);
                            echo $price;
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
    ?>

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
