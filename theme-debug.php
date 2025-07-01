<?php
/**
 * Theme Debug File
 * Adds a notice to the footer showing which theme is currently active
 */

// Add this to functions.php to display active theme info in footer
function mitnafun_display_theme_info() {
    $current_theme = wp_get_theme();
    $theme_name = $current_theme->get('Name');
    $theme_path = get_stylesheet_directory();
    
    echo '<div style="position:fixed; bottom:0; left:0; right:0; background:#f8d7da; color:#721c24; padding:10px; z-index:9999; text-align:center; font-size:14px; border-top:1px solid #f5c6cb;">';
    echo '<strong>Active Theme:</strong> ' . esc_html($theme_name) . ' | ';
    echo '<strong>Theme Path:</strong> ' . esc_html($theme_path);
    echo '</div>';
}

// Display theme info in footer
add_action('wp_footer', 'mitnafun_display_theme_info');
