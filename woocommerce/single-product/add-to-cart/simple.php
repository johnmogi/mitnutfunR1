<?php
/**
 * Simple product add to cart
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/single-product/add-to-cart/simple.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 7.0.1
 */

defined( 'ABSPATH' ) || exit;

global $product;

if ( ! $product->is_purchasable() ) {
	return;
}

echo wc_get_stock_html( $product ); // WPCS: XSS ok.

if ( $product->is_in_stock() ) : ?>

	<?php do_action( 'woocommerce_before_add_to_cart_form' ); ?>

	<form class="cart" action="<?php echo esc_url( apply_filters( 'woocommerce_add_to_cart_form_action', $product->get_permalink() ) ); ?>" method="post" enctype='multipart/form-data'>
		<?php do_action( 'woocommerce_before_add_to_cart_button' ); ?>

        <div style="display: none">
		<?php
		do_action( 'woocommerce_before_add_to_cart_quantity' );

		woocommerce_quantity_input(
			array(
				'min_value'   => apply_filters( 'woocommerce_quantity_input_min', $product->get_min_purchase_quantity(), $product ),
				'max_value'   => apply_filters( 'woocommerce_quantity_input_max', $product->get_max_purchase_quantity(), $product ),
				'input_value' => isset( $_POST['quantity'] ) ? wc_stock_amount( wp_unslash( $_POST['quantity'] ) ) : $product->get_min_purchase_quantity(), // WPCS: CSRF ok, input var ok.
			)
		);

		do_action( 'woocommerce_after_add_to_cart_quantity' );
		?>
        </div>
        <div class="btn-wrap">
		    <button disabled type="submit" name="add-to-cart" value="<?php echo esc_attr( $product->get_id() ); ?>" class="btn-default btn-blue btn-mini">הוסף לסל</button>
		    <a href="<?php echo esc_url( wc_get_checkout_url() ); ?>" class="btn-default btn-yellow btn-mini checkout-direct">להזמנה</a>
        </div>
        <script>
        // Script to handle direct-to-checkout functionality
        jQuery(document).ready(function($) {
            // IMPORTANT: Always ensure the checkout button is enabled
            $('.checkout-direct').removeAttr('disabled');
            $('.checkout-direct').css({
                'opacity': '1',
                'pointer-events': 'auto',
                'cursor': 'pointer'
            });
            
            // Store rental dates when available
            const existingDates = $('#rental_dates').val();
            if (existingDates && existingDates !== '') {
                sessionStorage.setItem('rental_dates', existingDates);
            }
            
            // Update rental dates when changed
            $(document).on('change', '#rental_dates', function() {
                const dates = $(this).val();
                if (dates) {
                    sessionStorage.setItem('rental_dates', dates);
                }
            });
            
            // Force enable button after a short delay
            setTimeout(function() {
                $('.checkout-direct').removeAttr('disabled');
                $('.checkout-direct').css({
                    'opacity': '1',
                    'pointer-events': 'auto',
                    'cursor': 'pointer'
                });
            }, 100);
            
            // Handle direct checkout click
            $('.checkout-direct').on('click', function(e) {
                e.preventDefault();
                
                const productId = $('button[name="add-to-cart"]').val();
                const quantity = $('input[name="quantity"]').val() || 1;
                const rentalDates = $('#rental_dates').val();
                
                console.log('Direct checkout clicked with:', { productId, quantity, rentalDates });
                
                if (!productId || !rentalDates) {
                    alert('בבקשה בחר תאריכי השכרה לפני ההמשך לתשלום');
                    return false;
                }
                
                // Show loading state
                $(this).text('מעבד...').css('opacity', '0.7');
                
                // Simple add to cart and redirect approach
                // This works more reliably than complex AJAX
                const formData = new FormData();
                formData.append('action', 'woocommerce_ajax_add_to_cart');
                formData.append('product_id', productId);
                formData.append('quantity', quantity);
                formData.append('rental_dates', rentalDates);
                
                fetch(wc_add_to_cart_params.ajax_url, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Add to cart response:', data);
                    if (data.error) {
                        alert(data.message || 'שגיאה בהוספת המוצר לסל. אנא נסה שוב.');
                        $(this).text('להזמנה').css('opacity', '1');
                    } else {
                        // Successfully added to cart, now redirect to checkout
                        sessionStorage.setItem('rental_dates', rentalDates);
                        window.location.href = '<?php echo esc_url( wc_get_checkout_url() ); ?>';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('שגיאה בתקשורת עם השרת. אנא נסה שוב.');
                    $(this).text('להזמנה').css('opacity', '1');
                });
                return false;
            });
        });
        </script>
		<?php do_action( 'woocommerce_after_add_to_cart_button' ); ?>
        <input type="hidden" name="redirect" value="">
	</form>

	<?php do_action( 'woocommerce_after_add_to_cart_form' ); ?>

<?php endif; ?>
