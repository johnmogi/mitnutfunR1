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
                            <p>
                                <?php 
                                // Try different meta keys where rental dates might be stored
                                $rental_dates = '';
                                
                                // Look in the cart item meta array
                                if (!empty($cart_item['rental_dates'])) {
                                    $rental_dates = $cart_item['rental_dates'];
                                } elseif (!empty($cart_item['Rental Dates'])) {
                                    $rental_dates = $cart_item['Rental Dates'];
                                } elseif (!empty($cart_item['rental_date'])) {
                                    $rental_dates = $cart_item['rental_date'];
                                }
                                
                                // Look for meta data in the product
                                if (empty($rental_dates)) {
                                    foreach ($cart_item as $key => $value) {
                                        if (strpos(strtolower($key), 'rental') !== false && strpos(strtolower($key), 'date') !== false) {
                                            $rental_dates = $value;
                                            break;
                                        }
                                    }
                                }
                                
                                // Display the rental dates if found
                                if (!empty($rental_dates)) {
                                    echo '<strong>תאריכי השכרה:</strong> ' . esc_html($rental_dates);
                                }
                                ?>
                            </p>
                        </div>
                        <div class="cost">
                            <?php 
                            // Check if this is a rental product
                            $is_rental = !empty($cart_item['rental_dates']) || !empty($cart_item['Rental Dates']) || !empty($cart_item['rental_date']);
                            
                            if ($is_rental) {
                                // For rentals, show the total price without multiplier
                                $total_price = $_product->get_price() * $cart_item['quantity'];
                                echo '<p>' . wc_price($total_price) . '</p>';
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
            <a href="<?= get_permalink(12) ?>" class="btn-default btn-blue btn-mini">להזמנה</a>
        </div>
        <?php } ?>

<?php else : ?>

	<p class="woocommerce-mini-cart__empty-message"><?php esc_html_e( 'No products in the cart.', 'woocommerce' ); ?></p>

<?php endif; ?>

<?php do_action( 'woocommerce_after_mini_cart' ); ?>
