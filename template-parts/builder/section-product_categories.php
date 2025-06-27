<?php 
if($args['row']):
	foreach($args['row'] as $key=>$arg) $$key = $arg; ?>

	<?php if ($categories): ?>
		<section class="title-item-2x">

			<?php if ($background): ?>
				<div class="bg">
					<?= wp_get_attachment_image($field['ID'], 'full') ?>
				</div>
			<?php endif ?>
			
			<div class="content-width">

				<?php if ($title): ?>
					<h2 class="title-h2"><?= $title ?></h2>
				<?php endif ?>

				<?php if ($text): ?>
					<p class="top"><?= $text ?></p>
				<?php endif ?>

				<div class="content">

					<?php foreach ($categories as $term): ?>
						<div class="item">
							<div class="text">
								<h3 class="title"><?= $term->name ?></h3>

								<?= term_description($term->term_id) ?>
								
								<div class="btn-wrap">
									<a href="<?= get_term_link($term->term_id) ?>" class="btn-default btn-blue btn-mini"><?php _e('פרטים נוספים', 'Mitnafun') ?></a>
								</div>
							</div>

							<?php if ($thumbnail_id = get_term_meta($term->term_id, 'thumbnail_id', true)): ?>
								<figure>
									<a href="<?= get_term_link($term->term_id) ?>">
										<?= wp_get_attachment_image($thumbnail_id, 'full') ?>
									</a>
								</figure>
							<?php endif ?>
							
						</div>
					<?php endforeach ?>
					
				</div>
			</div>
		</section>
	<?php endif ?>

	<?php endif; ?>