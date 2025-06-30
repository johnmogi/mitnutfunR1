<?php
/**
 * The template for displaying product content in the single-product.php template
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/content-single-product.php.
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

// Example usage
$product_id = $product->get_id(); // Replace with your actual product ID
$rental_dates = get_rental_dates_for_product($product_id);


if ( post_password_required() ) {
	echo get_the_password_form(); // WPCS: XSS ok.
	return;
}
?>


<section class="product-info">
    <div class="bg">
        <img src="<?= get_template_directory_uri() ?>/img/after-7.svg" alt="">
    </div>
    <div class="content-width">

        <?php do_action( 'woocommerce_before_single_product' ); ?>
        <div class="content" data-product-id="<?php echo esc_attr($product_id); ?>">


            <div class="mob-title">
                <h2 class="title"><?php the_title() ?></h2>
            </div>

            <?php woocommerce_show_product_images () ?>

            <div class="text-wrap">
                <h1><?php the_title() ?></h1>
                <ul class="list-info">
                    <li><?= $product->get_price_html()  ?></li>
                    <li>הסדנה 1, כפר סבא</li>
                </ul>
                <?php

             //   if ($_GET['test']) {

                    ?>
                <div class="rental-datepicker-container">
                    <h3 class="rental-dates-heading">בחר תאריכי השכרה</h3>
                    <div id="datepicker-container"></div>
                    <input type="hidden" id="rental_dates" name="rental_dates" value="">
                    
                    <!-- Visible Rental Dates Display -->
                    <div id="rental-dates-display" class="rental-dates-display" style="display: none; margin: 15px 0; padding: 15px; background-color: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 4px;">
                        <h4 style="margin-top: 0; color: #2d3748; font-size: 16px; font-weight: bold;">תאריכי ההשכרה שנבחרו:</h4>
                        <div class="dates-content" style="margin-top: 8px;">
                            <span id="selected-start-date" style="font-weight: bold;"></span> - <span id="selected-end-date" style="font-weight: bold;"></span>
                        </div>
                        <div class="rental-days" style="margin-top: 8px;">
                            <span>מספר ימי השכרה: </span><span id="rental-days-count" style="font-weight: bold;"></span>
                        </div>
                    </div>
                </div>
                <style>
                    .rental-datepicker-container {
                        margin: 20px 0;
                        max-width: 600px;
                    }
                    #datepicker-container {
                        width: 100%;
                    }
                    /* AirDatepicker custom styles */
                    .air-datepicker {
                        --adp-font-size: 14px;
                        --adp-day-name-color: #333;
                        --adp-cell-background-color-selected: #4CAF50;
                        --adp-cell-background-color-selected-hover: #45a049;
                        --adp-cell-background-color-in-range: rgba(76, 175, 80, 0.1);
                        --adp-cell-background-color-in-range-hover: rgba(76, 175, 80, 0.2);
                        --adp-cell-border-color-in-range: #4CAF50;
                    }
                    /* Disabled dates styling */
                    .air-datepicker-cell--disabled {
                        background-color: #f5f5f5;
                        color: #ccc;
                        text-decoration: line-through;
                    }
                    /* Weekend styling */
                    .air-datepicker-cell--weekend {
                        color: #f44336;
                    }
                    /* Partially booked dates */
                    .air-datepicker-cell--partially-booked {
                        background-color: #fff3e0;
                        font-weight: bold;
                    }
                </style>
                <?php // } ?>
                <?php woocommerce_template_single_add_to_cart() ?>

<!--                <h6 class="sub-title">תיאור המתקן:</h6>-->
                <?php if (get_the_content())
                    the_content();
                else
                    echo $product->get_short_description() ; ?>



            </div>
        </div>
    </div>
</section>

<?php if(have_rows('products')): ?>

    <section class="item-2x-text">
        <div class="content-width">
            <h2 class="title-h3">פרטי המוצר</h2>
            <div class="content">

                <?php while(have_rows('products')): the_row() ?>

                    <div class="item">

                        <?php if ($field = get_sub_field('title')): ?>
                            <h6 class="title"><?= $field ?></h6>
                        <?php endif ?>
                        
                        <?php the_sub_field('description') ?>
                        
                    </div>

                <?php endwhile ?>

            </div>
        </div>
    </section>

<?php endif ?>

<section class="title-border-block">
    <div class="bg">
        <img src="<?= get_template_directory_uri() ?>/img/after-8.svg" alt="" class="img-1">
        <img src="<?= get_template_directory_uri() ?>/img/after-9.svg" alt="" class="img-2">
        <img src="<?= get_template_directory_uri() ?>/img/after-10.svg" alt="" class="img-3">
    </div>
    <div class="content-width">

        <?php if ($field = get_field('title_4', 'option')): ?>
            <h2 class="title-h3"><?= $field ?></h2>
        <?php endif ?>
        
        <div class="content">

            <?php if ($field = get_field('text_4', 'option')): ?>
                <div class="text"><?= $field ?></div>
            <?php endif ?>

            <div class="img-wrap">

                <?php if ($field = get_field('icon_4', 'option')): ?>
                    <figure>
                        <?php if (pathinfo($field['url'])['extension'] == 'svg'): ?>
                            <img src="<?= $field['url'] ?>">
                        <?php else: ?>
                            <?= wp_get_attachment_image($field['ID'], 'full') ?>
                        <?php endif ?>
                    </figure>
                <?php endif ?>

                <?php if ($field = get_field('phone_4', 'option')): ?>
                    <div class="wrap">

                        <?php if ($field['title']): ?>
                            <p><?= $field['title'] ?></p>
                        <?php endif ?>
                        
                        <?php if ($field['phone']): ?>
                            <p>
                                <a href="tel:+<?= preg_replace('/[^0-9]/', '', $field['phone']) ?>"><?= $field['phone'] ?></a>
                            </p>
                        <?php endif ?>
                        

                    </div>
                <?php endif ?>

            </div>
        </div>
    </div>
</section>


<?php do_action( 'woocommerce_after_single_product' ); ?>
