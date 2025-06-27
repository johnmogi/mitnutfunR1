<?php
/**
 * Cross-sells
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/cart/cross-sells.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 4.4.0
 */

defined( 'ABSPATH' ) || exit;

$cross_sells = (WC()->cart->get_cross_sells());


if (!($cross_sells))
{
    $q = new WP_Query([
        'post_type' => 'product',
        'posts_per_page' => 3,
        'orderby' => 'rand',
        'fields' => 'ids'
    ]);

    $cross_sells = $q->posts;

}

 ?>
<div class="category">
	<div class="cross-sells content">

            <?php if ( $cross_sells ) : ?>


			<?php foreach ( $cross_sells as $cross_sell ) : ?>

				<?php
					$post_object = get_post( $cross_sell );

					setup_postdata( $GLOBALS['post'] =& $post_object ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited, Squiz.PHP.DisallowMultipleAssignments.Found

					wc_get_template_part( 'content', 'product' );
				?>

			<?php endforeach; ?>

            <?php endif; ?>
	</div>
	<?php


wp_reset_postdata();

?>
</div>
