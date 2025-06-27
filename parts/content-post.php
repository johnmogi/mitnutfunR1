<?php if (has_post_thumbnail()): ?>
	<figure>
		<a href="<?php the_permalink() ?>">
			<?php the_post_thumbnail('full') ?>
		</a>
	</figure>
<?php endif ?>

<div class="text-wrap">
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

		<div class="link-share">
			<a href="<?php the_permalink() ?>"><img src="<?= get_stylesheet_directory_uri() ?>/img/icon-11.svg" alt=""></a>
		</div>
	</div>
	<h6 class="title"><a href="<?php the_permalink() ?>"><?php the_title() ?></a></h6>
	<p class="info"><?php the_excerpt() ?></p>
	<div class="link-share">
		<a href="<?php the_permalink() ?>"><img src="img/icon-12.svg" alt=""><?php _e('קרא עוד', 'Mitnafun') ?></a>
	</div>
</div>