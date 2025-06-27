<?php if(have_rows('items_3', 'option')): ?>

    <section class="faq">
        <div class="content-width">

            <?php if ($field = get_field('title_3', 'option')): ?>
                <h2 class="title-h2"><?= $field ?></h2>
            <?php endif ?>
            
            <ul class="accordion">

                <?php while(have_rows('items_3', 'option')): the_row() ?>

                    <li class="accordion-item">

                        <?php if ($field = get_sub_field('title')): ?>
                            <div class="accordion-thumb">
                                <p><?= $field ?></p>
                            </div>
                        <?php endif ?>
                        
                        <?php if ($field = get_sub_field('text')): ?>
                            <div class="accordion-panel">
                                <div class="wrap"><?= $field ?></div>
                            </div>
                        <?php endif ?>
                        
                    </li>

                <?php endwhile ?>

            </ul>
        </div>
    </section>

    <?php endif ?>