<?php
/**
 * The Template for displaying product archives, including the main shop page which is a post type archive
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/archive-product.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 3.4.0
 */

defined( 'ABSPATH' ) || exit;

get_header( 'shop' );



?>


    <section class="category">
        <div class="content-width">
            <h1><?php the_archive_title('', false)        ?></h1>
            <div action="#">
                <div class="select-line">
                    <div class="wrap">


                        <div class="select-line">
                            <div class="wrap">
                                <?php $terms = get_terms(['taxonomy' => 'product_cat']);

                                foreach ($terms as $term) { ?>
                                <div class="input-wrap-checkbox">
<label>
                                    <a class="<?= get_queried_object_id() == $term->term_id ? 'selected' : ''  ?>" href="<?= get_term_link($term->term_id, 'product_cat') ?>"><?= $term->name ?></a>
</label>    </div>

                                <?php } ?>

                            </div>
                        </div>
                    </div>
                </div>
                <div class="content">

                    <?php
                    while ( have_posts() ) {
                        the_post();

                        /**
                         * Hook: woocommerce_shop_loop.
                         */
                        do_action( 'woocommerce_shop_loop' );

                        wc_get_template_part( 'content', 'product' );
                    }

                    ?>

                </div>
                <div class="">
                    <?php woocommerce_pagination() ?>
                </div>
            </div>
        </div>
    </section>

    <section class="btn-block">
        <div class="bg">
            <img src="<?= get_template_directory_uri() ?>/img/after-6-1.svg" alt="" class="img-1">
            <img src="<?= get_template_directory_uri() ?>/img/after-6-2.svg" alt="" class="img-2">
        </div>
        <div class="content-width">
            <div class="btn-wrap">
                <a href="<?php the_permalink(389) ?>" class="btn-border"><img src="<?= get_template_directory_uri() ?>/img/icon-6.svg" alt=""><span>פתח את המדריך למשתמש</span></a>
            </div>
        </div>
    </section>

    <?php get_template_part('parts/faq') ?>

    <?php get_template_part('template-parts/builder/section-google_reviews') ?>


 <?php get_footer() ?>
