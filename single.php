<?php get_header(); ?>

<section class="page-default">
	<div class="content-width">
		<ul class="breadcrumb">
			<li><a href="<?php the_permalink(22) ?>"><img src="<?= get_stylesheet_directory_uri() ?>/img/icon-9.svg" alt=""><?php _e('חזרה', 'Mitnafun') ?></a></li>
		</ul>
		<div class="content">
			<h1><?php the_title() ?></h1>

			<?php if (has_post_thumbnail()): ?>
				<figure>
					<?php the_post_thumbnail('full') ?>
				</figure>
			<?php endif ?>

			<div class="user-wrap">

				<?php 
				$author_id = get_post_field('post_author', get_the_ID());
				?>

				<?php if ($field = get_field('avatar', 'user_' . $author_id)): ?>
					<div class="img-wrap">
						<?= wp_get_attachment_image($field['ID'], 'full') ?>
					</div>
				<?php endif ?>

				<div class="text">
					<p class="name"><?= get_the_author_meta('display_name', $author_id) ?></p>
					<p><?= get_the_date('H:i j F Y') ?></p>
				</div>
			</div>
			
			<?php the_content() ?>

		</div>

	</div>
</section>

<?php 
$args = array(
	'post_type' => 'post', 
	'post__not_in' => [get_the_ID()], 
	'paged' => get_query_var('paged')
);
$wp_query = new WP_Query($args);
if($wp_query->have_posts()): 
	?>

	<section class="blog-slider-wrap">
		<div class="content-width">
			<h2 class="title-h3"><?php _e('ראה מאמרים אחרים', 'Mitnafun') ?></h2>
			<div class="slider-wrap">
				<div class="swiper blog-slider">
					<div class="swiper-wrapper">

						<?php while ($wp_query->have_posts()): $wp_query->the_post(); ?>

							<div class="swiper-slide">
								<?php get_template_part('parts/content', 'post') ?>
							</div>
							
						<?php endwhile; ?>
						
					</div>
				</div>
				<div class="nav-wrap">
					<div class="swiper-button-next blog-next blog-btn"><img src="<?= get_stylesheet_directory_uri() ?>/img/icon-15.svg" alt=""></div>
					<div class="swiper-button-prev blog-prev blog-btn"><img src="<?= get_stylesheet_directory_uri() ?>/img/icon-15.svg" alt=""></div>
				</div>

			</div>

		</div>
	</section>

	<?php 
endif;
wp_reset_query(); 
?>

<?php get_footer(); ?>