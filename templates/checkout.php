<?php

/*

Template Name: Checkout

*/



get_header(); ?>

<section class="checkout woocommerce">
    <div class="content-width">
        <ul class="breadcrumb">
            <li><a href="<?= home_url() ?>"><img src="<?= get_template_directory_uri() ?>/img/icon-9.svg" alt="">חזרה</a></li>
        </ul>
        <h1>ביצוע הזמנה</h1>

        <?php

while (have_posts()) {
    the_post();
    the_content();
}
?>



    </div>
</section>

    <div id="auto-popup" class="auto-popup"  dir="rtl" style="display: none">
        <div class="main">

            <?php the_field('terms','option') ?>


            <div class="form-default">
                <div class="input-wrap-checked">
                    <input type="checkbox" name="agree" id="agree" value="1">
                    <label for="agree">אני מאשר את מדיניות האתר</label>
                </div>
            </div>

            <div class="btn-wrap">
                <a href="#" class="btn-default btn-blue btn-mini" disabled data-fancybox-close>המשך הזמנה</a>
            </div>


        </div>
    </div>

        <?php
get_footer();
