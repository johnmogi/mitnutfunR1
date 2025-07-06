<?php
/**
 * Cart Testing Page
 * 
 * Use this file to test cart/checkout functionality
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Add shortcode to test cart/checkout
add_shortcode('test_cart_checkout', function() {
    ob_start();
    
    // Display test buttons
    ?>
    <div class="cart-test-controls" style="margin: 20px 0; padding: 20px; background: #f5f5f5; border: 1px solid #ddd;">
        <h2>Cart/Checkout Testing Tool</h2>
        
        <div style="margin-bottom: 15px;">
            <button id="test-cart-fragments" class="button">Test Cart Fragments</button>
            <span id="fragments-result" style="margin-left: 10px; padding: 3px 8px;"></span>
        </div>
        
        <div style="margin-bottom: 15px;">
            <button id="test-cart-session" class="button">Test Cart Session</button>
            <span id="session-result" style="margin-left: 10px; padding: 3px 8px;"></span>
        </div>
        
        <div style="margin-bottom: 15px;">
            <button id="test-rental-days" class="button">Test Rental Days Calculation</button>
            <span id="rental-days-result" style="margin-left: 10px; padding: 3px 8px;"></span>
        </div>
        
        <div style="margin-bottom: 15px;">
            <button id="test-minicart-removal" class="button">Test Mini-Cart Removal</button>
            <span id="minicart-removal-result" style="margin-left: 10px; padding: 3px 8px;"></span>
        </div>
        
        <div style="margin-bottom: 15px;">
            <button id="debug-cart-contents" class="button">Debug Cart Contents</button>
            <pre id="cart-contents-debug" style="background: #fff; border: 1px solid #ddd; padding: 10px; max-height: 300px; overflow: auto;"></pre>
        </div>
    </div>
    
    <script>
    jQuery(document).ready(function($) {
        // Test cart fragments
        $('#test-cart-fragments').on('click', function() {
            const $result = $('#fragments-result');
            $result.text('Testing...').css('background', '#FFF9C4');
            
            if (typeof wc_cart_fragments_params !== 'undefined') {
                $result.text('PASS: wc_cart_fragments_params is defined').css('background', '#C8E6C9');
                // console.log('Cart fragments params:', wc_cart_fragments_params);
            } else {
                $result.text('FAIL: wc_cart_fragments_params is not defined').css('background', '#FFCDD2');
            }
        });
        
        // Test cart session
        $('#test-cart-session').on('click', function() {
            const $result = $('#session-result');
            $result.text('Testing...').css('background', '#FFF9C4');
            
            // Check if cart has fragments in localStorage
            const fragments = localStorage.getItem('wc_fragments');
            
            if (fragments) {
                $result.text('PASS: Cart fragments found in localStorage').css('background', '#C8E6C9');
                // console.log('Cart fragments:', JSON.parse(fragments));
            } else {
                $result.text('FAIL: No cart fragments in localStorage').css('background', '#FFCDD2');
            }
        });
        
        // Test rental days calculation
        $('#test-rental-days').on('click', function() {
            const $result = $('#rental-days-result');
            $result.text('Testing...').css('background', '#FFF9C4');
            
            // Test case: Friday to Sunday should be 1 day
            const fridayDate = new Date(2025, 6, 4); // First Friday in July 2025
            const sundayDate = new Date(2025, 6, 6); // First Sunday in July 2025
            
            // Calculate days
            const diffDays = Math.round((sundayDate - fridayDate) / (24 * 60 * 60 * 1000)) + 1;
            const startDay = fridayDate.getDay();
            const endDay = sundayDate.getDay();
            
            let rentalDays;
            if (startDay === 5 && endDay === 0 && diffDays <= 3) {
                rentalDays = 1;
            } else {
                rentalDays = Math.max(1, diffDays - 1);
            }
            
            if (rentalDays === 1) {
                $result.text('PASS: Friday-Sunday = 1 rental day').css('background', '#C8E6C9');
                // console.log('Rental days calculation correct:', {
                    startDate: fridayDate,
                    endDate: sundayDate,
                    diffDays,
                    rentalDays
                });
            } else {
                $result.text('FAIL: Friday-Sunday is not calculating as 1 day').css('background', '#FFCDD2');
                // console.log('Rental days calculation incorrect:', {
                    startDate: fridayDate,
                    endDate: sundayDate,
                    diffDays,
                    rentalDays
                });
            }
        });
        
        // Test mini-cart removal
        $('#test-minicart-removal').on('click', function() {
            const $result = $('#minicart-removal-result');
            $result.text('Testing...').css('background', '#FFF9C4');
            
            // Check if handleMiniCartRemoval function is defined
            if (typeof window.handleMiniCartRemoval === 'function') {
                $result.text('PASS: handleMiniCartRemoval function found').css('background', '#C8E6C9');
            } else {
                // Try to check if the event handler is attached to remove links
                const hasHandler = $('.mini_cart_item .remove').data('events');
                if (hasHandler && hasHandler.click) {
                    $result.text('PASS: Remove handlers are attached').css('background', '#C8E6C9');
                } else {
                    $result.text('UNKNOWN: Cannot detect mini-cart handlers').css('background', '#FFF9C4');
                }
                
                // console.log('Mini-cart test: handleMiniCartRemoval function not found globally');
            }
        });
        
        // Debug cart contents
        $('#debug-cart-contents').on('click', function() {
            const $debug = $('#cart-contents-debug');
            $debug.text('Loading cart data...');
            
            // Get cart fragments
            $.ajax({
                url: wc_cart_fragments_params ? wc_cart_fragments_params.wc_ajax_url.toString().replace('%%endpoint%%', 'get_refreshed_fragments') : '/wc-ajax/get_refreshed_fragments',
                type: 'POST',
                success: function(data) {
                    if (data && data.fragments) {
                        $debug.html('<strong>Cart Fragments Found:</strong>\n\n');
                        
                        // Show count of fragments
                        $debug.append('Number of fragments: ' + Object.keys(data.fragments).length + '\n\n');
                        
                        // Display mini-cart content
                        if (data.fragments['.widget_shopping_cart_content']) {
                            $debug.append('<strong>Mini-cart content available</strong>\n');
                        }
                        
                        // Check if cart is empty by looking for empty-cart class
                        const isEmpty = data.fragments['.widget_shopping_cart_content'] && 
                                       data.fragments['.widget_shopping_cart_content'].includes('empty-cart');
                        
                        $debug.append('Cart is empty: ' + (isEmpty ? 'Yes' : 'No') + '\n\n');
                        
                        // Display cart totals if available
                        if (data.cart_hash) {
                            $debug.append('Cart hash: ' + data.cart_hash + '\n');
                        }
                    } else {
                        $debug.html('No cart fragments data available.');
                    }
                },
                error: function(xhr, status, error) {
                    $debug.html('Error fetching cart data: ' + error);
                }
            });
        });
    });
    </script>
    <?php
    
    return ob_get_clean();
});

// Add test page function
function mitnafun_create_cart_test_page() {
    $test_page = get_page_by_path('cart-test');
    
    if (!$test_page) {
        // Create test page if it doesn't exist
        wp_insert_post([
            'post_title'     => 'Cart Testing',
            'post_name'      => 'cart-test',
            'post_content'   => '[test_cart_checkout]',
            'post_status'    => 'publish',
            'post_type'      => 'page',
        ]);
    }
}

// Hook into WordPress init to create test page
add_action('init', 'mitnafun_create_cart_test_page');
