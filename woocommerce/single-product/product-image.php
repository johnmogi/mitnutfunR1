<?php
/**
 * Single Product Image
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/single-product/product-image.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 7.8.0
 */

defined( 'ABSPATH' ) || exit;

// Note: `wc_get_gallery_image_html` was added in WC 3.3.2 and did not exist prior. This check protects against theme overrides being used on older versions of WC.
if ( ! function_exists( 'wc_get_gallery_image_html' ) ) {
	return;
}

global $product;

$columns           = apply_filters( 'woocommerce_product_thumbnails_columns', 4 );
$post_thumbnail_id = $product->get_image_id();
$wrapper_classes   = apply_filters(
	'woocommerce_single_product_image_gallery_classes',
	array(
		'woocommerce-product-gallery',
		'woocommerce-product-gallery--' . ( $post_thumbnail_id ? 'with-images' : 'without-images' ),
		'woocommerce-product-gallery--columns-' . absint( $columns ),
		'images',
	)
);

$attachment_ids = $product->get_gallery_image_ids();




?>

<div class="slider-wrap">
    <div class="swiper product-slider">
        <div class="swiper-wrapper">
            <?php if ( $post_thumbnail_id ) { ?>
            <div class="swiper-slide">
                <a href="<?= get_the_post_thumbnail_url(get_the_id(), 'full') ?>" data-fancybox="gallery">
                    <?= $product->get_image('large')  ?>
                </a>
            </div>
            <?php } ?>
            <?php
            if ( $attachment_ids && $product->get_image_id() ) {
                foreach ( $attachment_ids as $attachment_id ) {
                   ?>
                    <div class="swiper-slide">
                        <a href="<?= wp_get_attachment_image_url($attachment_id, 'full') ?>" data-fancybox="gallery">
                            <img src="<?= wp_get_attachment_image_url($attachment_id, 'large') ?>" alt="">
                        </a>
                    </div>
                    <?php
                     // phpcs:disable WordPress.XSS.EscapeOutput.OutputNotEscaped
                }
            }?>

        </div>
        <div class="swiper-button-next product-next product-btn"><img src="<?= get_template_directory_uri() ?>/img/icon-7.svg" alt=""></div>
        <div class="swiper-button-prev product-prev product-btn"><img src="<?= get_template_directory_uri() ?>/img/icon-7.svg" alt=""></div>
    </div>
</div>




