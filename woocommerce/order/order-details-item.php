<?php
/**
 * Order Item Details
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/order/order-details-item.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 5.2.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! apply_filters( 'woocommerce_order_item_visible', true, $item ) ) {
	return;
}
?>
<tr class="<?php echo esc_attr( apply_filters( 'woocommerce_order_item_class', 'woocommerce-table__line-item order_item', $item, $order ) ); ?>">

	<td class="woocommerce-table__product-name product-name">
		<?php
		$is_visible        = $product && $product->is_visible();
		$product_permalink = apply_filters( 'woocommerce_order_item_permalink', $is_visible ? $product->get_permalink( $item ) : '', $item, $order );

		echo wp_kses_post( apply_filters( 'woocommerce_order_item_name', $product_permalink ? sprintf( '<a href="%s">%s</a>', $product_permalink, $item->get_name() ) : $item->get_name(), $item, $is_visible ) );

		$qty          = $item->get_quantity();
		$refunded_qty = $order->get_qty_refunded_for_item( $item_id );

		if ( $refunded_qty ) {
			$qty_display = '<del>' . esc_html( $qty ) . '</del> <ins>' . esc_html( $qty - ( $refunded_qty * -1 ) ) . '</ins>';
		} else {
			$qty_display = esc_html( $qty );
		}

		echo apply_filters( 'woocommerce_order_item_quantity_html', ' <strong class="product-quantity">' . sprintf( '&times;&nbsp;%s', $qty_display ) . '</strong>', $item ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		do_action( 'woocommerce_order_item_meta_start', $item_id, $item, $order, false );

		// Display standard item meta
		wc_display_item_meta( $item ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		// Check if this is a rental product by looking for rental dates in the meta
		$is_rental = false;
		$rental_dates = '';
		$rental_days = 0;

		// Get the item meta data
		$item_meta = $item->get_meta_data();
		foreach ($item_meta as $meta) {
			$data = $meta->get_data();
			$key = $data['key'];
			$value = $data['value'];
			
			// Look for rental dates in meta
			if (strpos(strtolower($key), 'rental') !== false && strpos(strtolower($key), 'date') !== false) {
				$is_rental = true;
				$rental_dates = $value;
				
				// Calculate rental days if dates are found
				if (function_exists('mitnafun_calculate_rental_days') && strpos($value, ' - ') !== false) {
					$date_parts = explode(' - ', $value);
					if (count($date_parts) === 2) {
						$rental_days = mitnafun_calculate_rental_days($date_parts[0], $date_parts[1]);
					}
				}
			}
		}

		// Display rental days if available
		if ($is_rental && $rental_days > 0) {
			echo '<div class="rental-order-days"><strong>ימי השכרה:</strong> ' . intval($rental_days) . '</div>';
		}

		do_action( 'woocommerce_order_item_meta_end', $item_id, $item, $order, false );
		?>
	</td>

	<td class="woocommerce-table__product-total product-total">
		<?php 
		// Standard subtotal display
		$subtotal = $order->get_formatted_line_subtotal( $item );
		
		// If this is a rental item with multiple days, add discount explanation
		if (isset($is_rental) && $is_rental && isset($rental_days) && $rental_days > 1) {
			$product_id = $item->get_product_id();
			
			// Check if this product gets the discount (excluded products: 150, 153)
			$excluded_products = array(150, 153);
			
			if (!in_array($product_id, $excluded_products)) {
				// Calculate the original and discounted price for display
				$item_total = $item->get_total();
				$product_price = $item->get_product()->get_price();
				$original_price = $product_price * $rental_days;
				$savings = $original_price - $item_total;
				
				// Show discount info with original price and savings
				$subtotal = $subtotal . '<div class="rental-discount-info">יום ראשון: 100%, ימים נוספים: 50%</div>';
				
				if ($savings > 0) {
					$subtotal .= '<div class="rental-savings">מחיר מקורי: <span class="original-price">' . wc_price($original_price) . '</span><br>חסכת: ' . wc_price($savings) . '</div>';
				}
			}
		}
		
		echo $subtotal;
		?>
	</td>

</tr>

<?php if ( $show_purchase_note && $purchase_note ) : ?>

<tr class="woocommerce-table__product-purchase-note product-purchase-note">

	<td colspan="2"><?php echo wpautop( do_shortcode( wp_kses_post( $purchase_note ) ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></td>

</tr>

<?php endif; ?>
