<?php
/**
 * Mini-cart
 *
 * Contains the markup for the mini-cart, used by the cart widget.
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/cart/mini-cart.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 7.9.0
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_before_mini_cart' ); ?>

<?php if ( ! WC()->cart->is_empty() ) : ?>

 		<?php
		do_action( 'woocommerce_before_mini_cart_contents' );

		foreach ( WC()->cart->get_cart() as $cart_item_key => $cart_item ) {
			$_product   = apply_filters( 'woocommerce_cart_item_product', $cart_item['data'], $cart_item, $cart_item_key );
			$product_id = apply_filters( 'woocommerce_cart_item_product_id', $cart_item['product_id'], $cart_item, $cart_item_key );

			if ( $_product && $_product->exists() && $cart_item['quantity'] > 0 && apply_filters( 'woocommerce_widget_cart_item_visible', true, $cart_item, $cart_item_key ) ) {
				/**
				 * This filter is documented in woocommerce/templates/cart/cart.php.
				 *
				 * @since 2.1.0
				 */
				$product_name      = apply_filters( 'woocommerce_cart_item_name', $_product->get_name(), $cart_item, $cart_item_key );
				$thumbnail         = apply_filters( 'woocommerce_cart_item_thumbnail', $_product->get_image(), $cart_item, $cart_item_key );
				$product_price     = apply_filters( 'woocommerce_cart_item_price', WC()->cart->get_product_price( $_product ), $cart_item, $cart_item_key );
				$product_permalink = apply_filters( 'woocommerce_cart_item_permalink', $_product->is_visible() ? $_product->get_permalink( $cart_item ) : '', $cart_item, $cart_item_key );
				?>

                <div class="item">
                    <figure>
                        <?php if ( empty( $product_permalink ) ) : ?>
                            <?php echo $thumbnail  ; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                        <?php else : ?>
                            <a href="<?php echo esc_url( $product_permalink ); ?>">
                                <?php echo $thumbnail ; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                            </a>
                        <?php endif; ?>
                    </figure>
                    <div class="text">
                        <div class="info">
                            <p class="name"><a href="<?= $product_permalink ?>"><?= $product_name ?></a></p>
                            <?php 
                            // Try different meta keys where rental dates might be stored
                            $rental_dates = '';
                            $rental_days = 0;
                            
                            // Debug to check all cart item data
                            $debug_data = [];
                            
                            // Look in the cart item meta array
                            if (!empty($cart_item['rental_dates'])) {
                                $rental_dates = $cart_item['rental_dates'];
                                $debug_data['source'] = 'rental_dates';
                            } elseif (!empty($cart_item['Rental Dates'])) {
                                $rental_dates = $cart_item['Rental Dates'];
                                $debug_data['source'] = 'Rental Dates';
                            } elseif (!empty($cart_item['rental_date'])) {
                                $rental_dates = $cart_item['rental_date'];
                                $debug_data['source'] = 'rental_date';
                            }
                            
                            // Get rental days if available
                            if (!empty($cart_item['rental_days'])) {
                                $rental_days = intval($cart_item['rental_days']);
                            }
                            
                            // Look in item meta data
                            if (empty($rental_dates) && function_exists('wc_get_order_item_meta')) {
                                $item_key = !empty($cart_item['key']) ? $cart_item['key'] : '';
                                if (!empty($item_key)) {
                                    $meta_data = wc_get_order_item_meta($item_key, '_rental_dates', true);
                                    if (!empty($meta_data)) {
                                        $rental_dates = $meta_data;
                                        $debug_data['source'] = 'wc_get_order_item_meta';
                                    }
                                }
                            }
                            
                            // Look for meta data in any key of the cart item
                            if (empty($rental_dates)) {
                                foreach ($cart_item as $key => $value) {
                                    if (is_string($value) && strpos(strtolower($key), 'rental') !== false && strpos(strtolower($key), 'date') !== false) {
                                        $rental_dates = $value;
                                        $debug_data['source'] = 'cart_item_key_' . $key;
                                        break;
                                    }
                                }
                            }
                            
                            // Add calculation method to debug data
                            $debug_data['calculation'] = 'mini-cart.php';
                            $debug_data['found'] = !empty($rental_dates);
                            $debug_data['dates'] = $rental_dates;
                            $debug_data['days'] = $rental_days;
                            
                            // Output the rental dates if found - only once inside the container
                            if (!empty($rental_dates)) {
                                // Calculate rental days if we have dates and it's not already set
                                if (function_exists('mitnafun_calculate_rental_days') && strpos($rental_dates, ' - ') !== false) {
                                    $date_parts = explode(' - ', $rental_dates);
                                    if (count($date_parts) === 2) {
                                        $rental_days = mitnafun_calculate_rental_days($date_parts[0], $date_parts[1]);
                                        $cart_item['rental_days'] = $rental_days; // Update cart item with calculated days
                                        $debug_data['rental_days'] = $rental_days;
                                        $debug_data['calculation'] = 'mini-cart.php';
                                    }
                                }
                                
                                // Output container with data attributes for JavaScript
                                echo '<div class="rental-dates-container" data-cart-item="' . esc_attr(json_encode($debug_data)) . '" data-rental-dates="' . esc_attr($rental_dates) . '" data-rental-days="' . esc_attr($rental_days) . '">';
                                // Output the actual dates
                                echo '<div class="rental-dates"><strong>תאריכי השכרה:</strong> ' . esc_html($rental_dates) . '</div>';
                                echo '</div>';
                            } else if (current_user_can('manage_options')) {
                                // Only show missing dates in debug mode for admins
                                echo '<div class="missing-dates" style="color:#999;font-size:0.9em;">(No dates)</div>';
                            }
                            ?>
                        </div>
                        <div class="cost">
                            <?php 
                            // Check if this is a rental product
                            $is_rental = !empty($cart_item['rental_dates']) || !empty($cart_item['Rental Dates']) || !empty($cart_item['rental_date']);
                            
                            if ($is_rental) {
                                // For rentals, show the price with any discounts
                                // The price is already calculated by the rental-pricing.php code
                                $price = apply_filters('woocommerce_cart_item_price', WC()->cart->get_product_price($_product), $cart_item, $cart_item_key);
                                
                                // Display price with discount info if available
                                echo '<div class="mini-cart rental-price">' . $price;
                                
                                // Add discount info if rental days > 1
                                if (!empty($cart_item['rental_days']) && $cart_item['rental_days'] > 1) {
                                    // Check if this product gets the discount (excluded products: 150, 153)
                                    $excluded_products = array(150, 153);
                                    if (!in_array($cart_item['product_id'], $excluded_products)) {
                                        echo '<div class="rental-discount-info">יום ראשון: 100%, ימים נוספים: 50%</div>';
                                    }
                                }
                                
                                echo '</div>';
                            } else {
                                // For regular products, show price × quantity
                                echo '<p>' . $_product->get_price_html() . ' x ' . $cart_item['quantity'] . '</p>';
                            }
                            ?>
                        </div>
                        <div class="delete">
                            <?php
                            echo apply_filters( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                                'woocommerce_cart_item_remove_link',
                                sprintf(
                                    '<a href="%s" class="remove remove_from_cart_button" aria-label="%s" data-product_id="%s" data-cart_item_key="%s" data-product_sku="%s">%s</a>',
                                    esc_url( wc_get_cart_remove_url( $cart_item_key ) ),
                                    /* translators: %s is the product name */
                                    esc_attr( sprintf( __( 'Remove %s from cart', 'woocommerce' ), wp_strip_all_tags( $product_name ) ) ),
                                    esc_attr( $product_id ),
                                    esc_attr( $cart_item_key ),
                                    esc_attr( $_product->get_sku() ),
                                    '<img src="'. get_template_directory_uri().'/img/del.svg" alt="">'
                                ),
                                $cart_item_key
                            );
                            ?>
                        </div>
                    </div>
                </div>


 				<?php
			}
		}

		do_action( 'woocommerce_mini_cart_contents' );
		?>



        <?php if (!is_checkout()) { ?>
        <div class="btn-wrap">
            <a href="<?= wc_get_checkout_url() ?>" class="btn-default btn-blue btn-mini">להזמנה</a>
        </div>
        <?php } ?>

<?php else : ?>

	<p class="woocommerce-mini-cart__empty-message"><?php esc_html_e( 'No products in the cart.', 'woocommerce' ); ?></p>

<?php endif; ?>

<?php do_action( 'woocommerce_after_mini_cart' ); ?>
