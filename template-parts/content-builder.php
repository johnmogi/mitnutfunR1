<?php 

if(get_field('content'))
    foreach(get_field('content') as $index => $row):

        get_template_part('template-parts/builder/section', $row['acf_fc_layout'], ['row' => $row]);

        endforeach; ?>