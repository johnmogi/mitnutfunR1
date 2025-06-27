<?php 
if($args['row']):
	foreach($args['row'] as $key=>$arg) $$key = $arg; ?>

	<?php if ($items): ?>
		<section class="title-item-4x">
			<div class="content-width">
				<div class="top">

					<?php if ($title): ?>
						<h2 class="title-h2"><?= $title ?></h2>
					<?php endif ?>
					
					<?php if ($text): ?>
						<p><?= $text ?></p>
					<?php endif ?>
					
				</div>
				<div class="content">

					<?php foreach ($items as $item): ?>
						<div class="item">

							<?php if ($item['icon']): ?>
								<figure>
									<?= wp_get_attachment_image($item['icon']['ID'], 'full') ?>
								</figure>
							<?php endif ?>
							
							<div class="text">

								<?php if ($item['title']): ?>
									<h3 class="title"><?= $item['title'] ?></h3>
								<?php endif ?>
								
								<?php if ($item['text']): ?>
									<p><?= $item['text'] ?></p>
								<?php endif ?>
								
							</div>
						</div>
					<?php endforeach ?>
					
				</div>
			</div>
		</section>
	<?php endif ?>

	<?php endif; ?>