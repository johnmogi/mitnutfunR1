<?php 
if($args['row']):
	foreach($args['row'] as $key=>$arg) $$key = $arg; ?>

	<section class="time-work">

		<?php if ($field = get_field('background_2', 'option')): ?>
			<div class="bg">
				<?= wp_get_attachment_image($field['ID'], 'full') ?>
			</div>
		<?php endif ?>
		
		<div class="content-width">
			<div class="content">

				<?php if ($field = get_field('title_2', 'option')): ?>
					<div class="text">
						<h3 class="title"><?= $field ?></h3>
					</div>
				<?php endif ?>
				
				<div class="info">

					<?php if ($field = get_field('icon_2', 'option')): ?>
						<figure>
							<?= wp_get_attachment_image($field['ID'], 'full') ?>
						</figure>
					<?php endif ?>

					<?php if ($field = get_field('text_2', 'option')): ?>
						<?= $field ?>
					<?php endif ?>
					
				</div>
			</div>
		</div>
	</section>

	<?php endif; ?>