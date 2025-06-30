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
                            
                            // Display rental days if available
                            if (!empty($cart_item['rental_days'])) {
                                echo '<p class="rental-days"><strong>ימי השכרה:</strong> ' . intval($cart_item['rental_days']) . '</p>';
                            }
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
                            echo '<div class="checkout-review rental-price">' . $price . '</div>';
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
    $has_rentals = false;
    $rental_items = [];
    
    foreach (WC()->cart->get_cart() as $cart_item_key => $cart_item) {
        $_product = apply_filters('woocommerce_cart_item_product', $cart_item['data'], $cart_item, $cart_item_key);
        
        // Check if this is a rental product (has rental dates)
        $rental_dates = '';
        if (!empty($cart_item['rental_dates'])) {
            $rental_dates = $cart_item['rental_dates'];
        } elseif (!empty($cart_item['Rental Dates'])) {
            $rental_dates = $cart_item['Rental Dates'];
        } elseif (!empty($cart_item['rental_date'])) {
            $rental_dates = $cart_item['rental_date'];
        }
        
        if (!empty($rental_dates)) {
            $has_rentals = true;
            
            // Get the rental days
            $rental_days = !empty($cart_item['rental_days']) ? intval($cart_item['rental_days']) : 0;
            
            // Check if this product gets the discount
            $product_id = apply_filters('woocommerce_cart_item_product_id', $cart_item['product_id'], $cart_item, $cart_item_key);
            $has_discount = $product_id != 150 && $product_id != 153;
            
            // Get price calculations
            $product_price = $_product->get_price();
            
            // Store the data for the breakdown
            $rental_item = [
                'name' => $_product->get_name(),
                'days' => $rental_days,
                'quantity' => $cart_item['quantity'],
                'has_discount' => $has_discount,
                'original_price' => $product_price * $rental_days * $cart_item['quantity'],
                'discounted_price' => 0
            ];
            
            // Calculate discounted price if applicable
            if ($has_discount && $rental_days > 1) {
                // First day at full price, additional days at 50% off
                $first_day_price = $product_price * $cart_item['quantity'];
                $additional_days_price = ($product_price * 0.5) * ($rental_days - 1) * $cart_item['quantity'];
                $total_price = $first_day_price + $additional_days_price;
                $rental_item['discounted_price'] = $total_price;
                $rental_item['savings'] = $rental_item['original_price'] - $total_price;
            }
            
            $rental_items[] = $rental_item;
        }
    }
    
    // Display the rental price breakdown if we have rental items
    if ($has_rentals && !empty($rental_items)) {
        ?>
        <div class="rental-price-breakdown">
        <h4>פירוט הנחות יום נוסף</h4>
        <?php foreach ($rental_items as $item): ?>
            <div class="rental-item-breakdown">
                <div class="rental-item-name"><?php echo esc_html($item['name']); ?> x<?php echo intval($item['quantity']); ?></div>
                <?php if ($item['days'] > 0): ?>
                <div class="rental-item-days"><?php echo intval($item['days']); ?> ימים</div>
                <?php endif; ?>
                <?php if ($item['has_discount'] && $item['days'] > 1): ?>
                    <div class="rental-item-discount">
                        יום ראשון: 100%, ימים נוספים: 50%
                    </div>
                
                <div class="rental-item-savings">
                    מחיר מקורי: <span class="original-price"><?php echo wc_price($item['original_price']); ?></span>
                    <br>
                    חסכת: <?php echo wc_price($item['savings']); ?>
                </div>
                <?php endif; ?>
            </div>
        <?php endforeach; ?>
        </div>
        <style>
        .rental-price-breakdown {
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
            direction: rtl;
        }
        .rental-price-breakdown h4 {
            margin-top: 0;
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        .rental-item-breakdown {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #ddd;
        }
        .rental-item-breakdown:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .rental-item-name {
            font-weight: bold;
            font-size: 1.1em;
        }
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
    <?php
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
