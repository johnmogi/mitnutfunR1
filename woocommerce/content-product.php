<?php
/**
 * The template for displaying product content within loops
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/content-product.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 3.6.0
 */

defined( 'ABSPATH' ) || exit;

global $product;

// Ensure visibility.
if ( empty( $product ) || ! $product->is_visible() ) {
	return;
}
?>

<div class="item">
    <figure>
        <a href="<?php the_permalink() ?>">
            <?= $product->get_image('large')  ?>
        </a>
    </figure>
    <div class="text">
        <h6 class="title"><a href="<?php the_permalink() ?>"><?php the_title() ?></a></h6>
        <ul>
            <li><?= woocommerce_template_loop_price() ?></li>
            <li>24 שע'</li>
        </ul>
        <div class="btn-wrap">
            <a href="<?php the_permalink() ?>" class="btn-default btn-blue btn-mini">פרטים נוספים</a>
        </div>
    </div>
</div>


