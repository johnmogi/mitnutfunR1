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
        <div class="content">


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
                <div id="datepicker-container"></div>
                <br>
                <script>

                    jQuery(document).ready(function($) {
                        const bookedDates = <?php echo $rental_dates ? json_encode($rental_dates) : '[]'; ?>;

                        function formatDate(date) {
                            let d = new Date(date);
                            let month = '' + (d.getMonth() + 1);
                            let day = '' + d.getDate();
                            let year = d.getFullYear();

                            if (month.length < 2) month = '0' + month;
                            if (day.length < 2) day = '0' + day;

                            return [day, month, year].join('.');
                        }

                        const formattedBookedDates = bookedDates.flatMap(dateRange => {
                            if (!dateRange || typeof dateRange !== 'string' || !dateRange.includes(' - ')) {
                                return [];
                            }

                            const [startDate, endDate] = dateRange.split(' - ');
                            const dates = [];
                            let currentDate = new Date(startDate.split('.').reverse().join('-'));
                            const end = new Date(endDate.split('.').reverse().join('-'));

                            while (currentDate <= end) {
                                dates.push(formatDate(currentDate));
                                currentDate.setDate(currentDate.getDate() + 1);
                            }

                            return dates;
                        });

                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);

                        const datepicker = new AirDatepicker('#datepicker-container', {
                            inline: true,
                            range: true,
                            locale: {
                                days: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
                                daysShort: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
                                daysMin: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
                                months: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
                                monthsShort: ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'],
                                today: 'היום',
                                clear: 'נקה',
                                dateFormat: 'dd.MM.yyyy',
                                timeFormat: 'HH:mm',
                                firstDay: 0
                            },
                            minDate: tomorrow,
                            onSelect({date, formattedDate}) {
                                if (date) {
                                    let diffDays;
                                    if (date.length === 1) {
                                        // Single day selected
                                        $('#rental_dates').val(formattedDate[0]);
                                    } else {
                                        // Range selected
                                        const diffTime = Math.abs(date[1] - date[0]);
                                        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end dates
                                        $('#rental_dates').val(formattedDate.join(' - '));
                                    }
                                    $('[name="quantity"]').val(diffDays - 1);
                                    if (diffDays)
                                        $('.btn-wrap button').prop('disabled', false);
                                    else
                                        $('.btn-wrap button').prop('disabled', true);
                                }
                            },
                            onRenderCell({date, cellType}) {
                                if (cellType === 'day') {
                                    const formattedDate = formatDate(date);
                                    if (formattedBookedDates.includes(formattedDate)) {
                                        return {
                                            disabled: true
                                        };
                                    }
                                }
                            }
                        });
                    });




                </script>
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
