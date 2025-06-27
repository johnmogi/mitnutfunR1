<?php 
if($args['row']):
	foreach($args['row'] as $key=>$arg) $$key = $arg; ?>

	<?php if ($slider): ?>
		<section class="home-banner">
			<div class="slider-wrap">
				<div class="swiper banner-slider">
					<div class="swiper-wrapper">

						<?php foreach ($slider as $item): ?>
							<div class="swiper-slide">

								<?php if ($item['background'] || $item['background_mobile']): ?>
									<div class="bg">

										<?php if ($item['background']): ?>
											<?= wp_get_attachment_image($item['background']['ID'], 'full', false, array('class' => 'desk')) ?>
										<?php endif ?>
										
										<?php if ($item['background_mobile']): ?>
											<?= wp_get_attachment_image($item['background_mobile']['ID'], 'full', false, array('class' => 'mob')) ?>
										<?php endif ?>
										
									</div>
								<?php endif ?>

								<?php if ($item['title'] || $item['link']): ?>
									<div class="content">

										<?php if ($item['title']): ?>
											<h1 class="title"><?= $item['title'] ?></h1>
										<?php endif ?>

										<?php if ($item['link']): ?>
											<div class="btn-wrap">
												<a href="<?= $item['link']['url'] ?>" class="btn-default"<?php if($item['link']['target']) echo ' target="_blank"' ?>><?= $item['link']['title'] ?></a>
											</div>
										<?php endif ?>

									</div>
								<?php endif ?>

							</div>
						<?php endforeach ?>
						
					</div>
				</div>

				<?php if (count($slider) > 1): ?>
					<div class="nav-wrap">
						<div class="swiper-button-next banner-next"><img src="<?= get_stylesheet_directory_uri() ?>/img/arrow.svg" alt=""></div>
						<div class="swiper-button-prev banner-prev"><img src="<?= get_stylesheet_directory_uri() ?>/img/arrow.svg" alt=""></div>
					</div>
				<?php endif ?>
				
			</div>
		</section>
	<?php endif ?>

	<?php endif; ?>