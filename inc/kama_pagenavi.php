<?php 
/**
 * A wp_pagenavi alternative. Creates pagination links on archive pages.
 *
 * @param array    $args      Function arguments.
 * @param WP_Query $wp_query  WP_Query object on which pagination is based. Defaults to global variable $wp_query.
 *
 * @return string Pagination HTML code.
 *
 * @link     https://wp-kama.ru/8
 * @author   Timur Kamaev
 * @require  WP 5.9
 * @version  3.0
 */
function kama_pagenavi( $args = [], $wp_query = null ){

	$default = [
		'before'          => '',           // Text before the navigation.
		'after'           => '',           // Text after the navigation.
		'echo'            => true,         // Return or output the result.
		'text_num_page'   => '',           // Text before the pagination.
										   // {current} - current.
										   // {last} - last (eg: 'Page {current} of {last}' will result in: "Page 4 of 60").
		'num_pages'       => 10,           // How many links to show.
		'step_link'       => 10,           // Links with step (if 10, then: 1,2,3...10,20,30. Use 0 if such links are not needed.
		'dotright_text'   => '…',          // Intermediate text "before".
		'dotright_text2'  => '…',          // Intermediate text "after".
		'back_text'       => '<img src="' . get_stylesheet_directory_uri() . '/img/icon-13.svg" alt="">',     // Text "go to the previous page". Use 0 if this link is not needed.
		'next_text'       => '<img src="' . get_stylesheet_directory_uri() . '/img/icon-13.svg" alt="">',  // Text "go to the next page". Use 0 if this link is not needed.
		'first_page_text' => '« to start', // Text "to the first page". Use 0 if the page number should be shown instead of the text.
		'last_page_text'  => 'to end »',   // Text "to the last page". Use 0 if the page number should be shown instead of the text.
	];

	// Compat with v2.5: kama_pagenavi( $before = '', $after = '', $echo = true, $args = [] )
	$fargs = func_get_args();
	if( $fargs && is_string( $fargs[0] ) ){
		$default['before'] = $fargs[0] ?? '';
		$default['after']  = $fargs[1] ?? '';
		$default['echo']   = $fargs[2] ?? true;
		$args              = $fargs[3] ?? [];
		$wp_query = $GLOBALS['wp_query']; // !!! after $default
	}

	if( ! $wp_query ){
		wp_reset_query();
		global $wp_query;
	}

	if( ! $args ){
		$args = [];
	}

	/**
	 * Allows you to set default parameters.
	 *
	 * @param array $default_args
	 */
	$default = apply_filters( 'kama_pagenavi_args', $default );

	$rg = (object) array_merge( $default, $args );

	$paged = (int) ( $wp_query->get( 'paged' ) ?: 1 );
	$max_page = (int) $wp_query->max_num_pages;

	// navigation no needed
	if( $max_page < 2 ){
		return '';
	}

	$pages_to_show = (int) $rg->num_pages;
	$pages_to_show_minus_1 = $pages_to_show - 1;

	$half_page_start = (int) floor( $pages_to_show_minus_1 / 2 ); // how many links before the current page
	$half_page_end   = (int) ceil(  $pages_to_show_minus_1 / 2 ); // how many links after the current page

	$start_page = $paged - $half_page_start; // first page
	$end_page   = $paged + $half_page_end;   // last page (conventionally)

	if( $start_page <= 0 ){
		$start_page = 1;
	}
	if( (int) ( $end_page - $start_page ) !== (int) $pages_to_show_minus_1 ){
		$end_page = $start_page + $pages_to_show_minus_1;
	}

	if( $end_page > $max_page ){
		$start_page = $max_page - $pages_to_show_minus_1;
		$end_page =  $max_page;
	}

	if( $start_page <= 0 ){
		$start_page = 1;
	}

	// create a base to call get_pagenum_link once
	$link_base = str_replace( PHP_INT_MAX, '___', get_pagenum_link( PHP_INT_MAX ) );
	$first_url = get_pagenum_link( 1 );
	if( ! str_contains( $first_url, '?' ) ){
		$first_url = user_trailingslashit( $first_url );
	}

	// gather elements
	$els = [];

	if( $rg->text_num_page ){
		$rg->text_num_page = preg_replace( '/{current}|{last}/', '%s', $rg->text_num_page );
		$els['pages'] = sprintf( '<span class="pages">' . $rg->text_num_page . '</span>', $paged, $max_page );
	}
	// back
	if( $rg->back_text && $paged !== 1 ){
		$els['prev'] = sprintf( '<li class="first"><a href="%s">%s</a></li>',
			( ( $paged - 1 ) === 1 ? $first_url : str_replace( '___', ( $paged - 1 ), $link_base ) ),
			$rg->back_text
		);
	}
	// to the beginning
	if( $start_page >= 2 && $pages_to_show < $max_page ){
		$els['first'] = sprintf( '<li><a class="first" href="%s">%s</a></li>', $first_url, ( $rg->first_page_text ?: 1 ) );
		if( $rg->dotright_text && $start_page !== 2 ){
			$els[] = '<span class="extend">' . $rg->dotright_text . '</span>';
		}
	}

	// pagination
	for( $i = $start_page; $i <= $end_page; $i++ ){
		if( $i === $paged ){
			$els['current'] = '<li><span>' . $i . '</span></li>';
		}
		elseif( $i === 1 ){
			$els[] = sprintf( '<li><a href="%s">1</a></li>', $first_url );
		}
		else{
			$els[] = sprintf( '<li><a href="%s">%s</a></li>', str_replace( '___', (string) $i, $link_base ), $i );
		}
	}

	// links with step
	$dd = 0;
	if( $rg->step_link && $end_page < $max_page ){
		for( $i = $end_page + 1; $i <= $max_page; $i++ ){
			if( 0 === ( $i % $rg->step_link) && $i !== $rg->num_pages ){
				if( ++$dd === 1 ){
					$els[] = '<span class="extend">' . $rg->dotright_text2 . '</span>';
				}
				$els[] = sprintf( '<li><a href="%s">%s</a></li>', str_replace( '___', (string) $i, $link_base ), $i );
			}
		}
	}
	// to the end
	if( $end_page < $max_page ){
		if( $rg->dotright_text && $end_page !== ( $max_page - 1 ) ){
			$els[] = '<span class="extend">' . $rg->dotright_text2 . '</span>';
		}
		$els['last'] = sprintf( '<li><a class="last" href="%s">%s</a></li>',
			str_replace( '___', $max_page, $link_base ),
			$rg->last_page_text ?: $max_page
		);
	}
	// forward
	if( $rg->next_text && $paged !== $end_page ){
		$els['next'] = sprintf( '<li class="last"><a href="%s">%s</a></li>',
			str_replace( '___', ( $paged + 1 ), $link_base ),
			$rg->next_text
		);
	}

	/**
	 * Allow to change pagenavi elements.
	 *
	 * @param array $elements
	 */
	$els = apply_filters( 'kama_pagenavi_elements', $els );

	$html = $rg->before . '<div class="pagination-wrap"><ul class="pagination">' . implode( '', $els ) . '</ul></div>' . $rg->after;

	/**
	 * Allow to change final output HTML code of pagenavi.
	 *
	 * @param string $html
	 */
	$html = apply_filters( 'kama_pagenavi', $html );

	if( $rg->echo ){
		echo $html;
	}

	return $html;
}

/**
 * CHANGELOG:
 *
 * 3.0 (14.12.2023)
 *   - Requires at least PHP 7.0.
 *   - Requires at least WP 5.9.
 *   - PHP 8.1 support. Typehint improvements.
 *   - Removed capability to pass $wp_query in first parameter.
 * 2.8 (14.02.2022)
 *   - Minor improvements.
 * 2.7 (02.11.2018)
 *   - In $args you can specify the second parameter $wp_query, when $args can be left empty.
 *   - Code edits - fixed bugs, rebuilt the collection of elements into an array.
 *   - New hook `kama_pagenavi_elements`.
 * 2.6 (20.10.2018)
 *   - Removed extract().
 *   - Moved parameters $before, $after, $echo to $args (old version will work).
 * 2.5 - 2.5.1
 *   - Automatic reset of the main query.
 */