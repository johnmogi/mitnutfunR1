<?php 
if($args['row']):
	foreach($args['row'] as $key=>$arg) $$key = $arg; ?>

	<section class="text-img">

		<?php if ($background_mobile): ?>
			<div class="bg bg-mob">
				<?= wp_get_attachment_image($background_mobile['ID'], 'full') ?>
			</div>
		<?php endif ?>

		<?php if ($background): ?>
			<div class="bg bg-1">
				<?= wp_get_attachment_image($background['ID'], 'full') ?>
			</div>
		<?php endif ?>

		<div class="content-width">
			<div class="text">

				<?php if ($icon): ?>
					<div class="img-wrap">
						<?= wp_get_attachment_image($icon['ID'], 'full') ?>
					</div>
				<?php endif ?>

				<?php if ($title): ?>
					<h2 class="title"><?= $title ?></h2>
				<?php endif ?>

				<?php if ($text): ?>
					<?= $text ?>
				<?php endif ?>

			</div>
			
			<?php if ($image): ?>
				<figure>
					<?= wp_get_attachment_image($image['ID'], 'full') ?>
				</figure>
			<?php endif ?>
			
		</div>
	</section>

	<?php endif; ?>