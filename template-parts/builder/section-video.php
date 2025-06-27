<?php 
if($args['row']):
	foreach($args['row'] as $key=>$arg) $$key = $arg; ?>

	<?php if ($video['url']): ?>
		<section class="video-full">

			<?php if ($background): ?>
				<div class="bg">
					<?= wp_get_attachment_image($background['ID'], 'full') ?>
				</div>
			<?php endif ?>
			
			<div class="content-width">

				<?php if ($title): ?>
					<h2 class="title-h2"><?= $title ?></h2>
				<?php endif ?>

				<div class="video-block">
					<a data-fancybox href="<?= $video['url'] ?>">

						<?php if ($video['background']): ?>
							<div class="bg-video">
								<?= wp_get_attachment_image($video['background']['ID'], 'full') ?>
							</div>
						<?php endif ?>

						<div class="play-img">
							<img src="<?= get_stylesheet_directory_uri() ?>/img/play.svg" alt="">
						</div>
					</a>
				</div>
			</div>
		</section>
	<?php endif ?>

	<?php endif; ?>