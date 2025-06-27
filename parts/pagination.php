<?php 
$args = array(
		'show_all'     => false, 
		'end_size'     => 1,     
		'mid_size'     => 1,     
		'prev_next'    => true,  
		'prev_text'    => __('Previous'),
		'next_text'    => __('Next'),
		'add_args'     => false, 
		'add_fragment' => '',     
		'screen_reader_text' => __( 'Posts navigation' ),
        'type' => 'list',
    );
the_posts_pagination($args); 