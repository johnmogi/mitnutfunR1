
	<section class="testimonials">
		<div class="content-width">


			<div class="title-wrap">

				<?php if ($field = get_field('title_1', 'option')): ?>
					<div class="title">
						<h2 class="title-h2"><?= $field ?></h2>
					</div>
				<?php endif ?>

				<?php if ($field = get_field('text_1', 'option')): ?>
					<div class="text">
						<p><?= $field ?></p>
					</div>
				<?php endif ?>

			 
			</div>


            <?php echo do_shortcode( '[trustindex no-registration=google]' ); ?>

		</div>
	</section>


