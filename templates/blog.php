<?php
/*
Template Name: Blog
*/
?>

<?php get_header(); ?>


<section class="blog">
	<div class="content-width">
		<h1><?php the_title() ?></h1>

		<?php 
		$args = array(
			'post_type' => 'post', 
			'posts_per_page' => 4, 
			'paged' => get_query_var('paged')
		);
		$wp_query = new WP_Query($args);
		if($wp_query->have_posts()): 
			?>

			<div class="content">

				<?php while ($wp_query->have_posts()): $wp_query->the_post(); ?>

					<div class="item">
						<div class="text">
							<div class="user-wrap">

								<?php 
								$author_id = get_post_field('post_author', get_the_ID());
								?>

								<?php if ($field = get_field('avatar', 'user_' . $author_id)): ?>
									<div class="img-wrap">
										<?= wp_get_attachment_image($field['ID'], 'full') ?>
									</div>
								<?php endif ?>

								<div class="user-text">
									<p class="name"><?= get_the_author_meta('display_name', $author_id) ?></p>
									<p><?= get_the_date('H:i j F Y') ?></p>
								</div>

								<div class="link-share">
									<a href="<?php the_permalink() ?>"><img src="<?= get_stylesheet_directory_uri() ?>/img/icon-11.svg" alt=""></a>
								</div>
							</div>
							<div class="wrap">
								<h2 class="title">
									<a href="<?php the_permalink() ?>"><?php the_title() ?></a>
								</h2>
								<p><?php the_excerpt() ?></p>
								<div class="link-wrap">
									<a href="<?php the_permalink() ?>"><img src="<?= get_stylesheet_directory_uri() ?>/img/icon-12.svg" alt=""><?php _e('קרא עוד', 'Mitnafun') ?></a>
								</div>
							</div>
						</div>

						<?php if (has_post_thumbnail()): ?>
							<figure>
								<a href="<?php the_permalink() ?>">
									<?php the_post_thumbnail('full') ?>
								</a>
							</figure>
						<?php endif ?>

					</div>

				<?php endwhile; ?>

			</div>

			<?php 
		endif;
		kama_pagenavi([], $wp_query);
		wp_reset_query(); 
		?>

	</div>
</section>

<?php get_footer(); ?>