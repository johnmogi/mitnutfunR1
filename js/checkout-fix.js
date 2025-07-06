/**
 * Checkout page fix
 * Removes any stuck spinners on the checkout page
 * UPDATED: Now integrates with the modular JS system
 */
jQuery(document).ready(function($) {
    // Use the centralized logger if available
    const log = window.MitnaFunLogger || {
        debug: function(msg) { /* console.debug(msg); */ },
        info: function(msg) { /* console.info(msg); */ },
        warn: console.warn.bind(console, '[Checkout Fix]'),
        error: console.error.bind(console, '[Checkout Fix]')
    };
    
    log.info('Checkout fix script loaded');
    
    // Function to ensure checkout review table has items
    function ensureCheckoutItems() {
        log.debug('Ensuring checkout items are displayed...');
        
        // If we're on the checkout page
        if (window.location.href.includes('/checkout/')) {
            // Get cart count from WC data if available
            var cartItemCount = 0;
            
            // Try to get the security nonce
            var checkoutNonce = '';
            if ($('form.checkout').length > 0) {
                checkoutNonce = $('form.checkout').find('input[name="_wpnonce"]').val() || '';
            }
            
            // Call our custom AJAX endpoint to check cart status
            $.ajax({
                url: woocommerce_params.ajax_url,
                type: 'POST',
                data: {
                    action: 'get_checkout_cart_status',
                    security: checkoutNonce
                },
                success: function(response) {
                    log.debug('Cart status check response:', response);
                    
                    if (response.success && response.cart_count > 0) {
                        log.info('Server confirms cart has ' + response.cart_count + ' items');
                        
                        // Force update checkout
                        if ($('form.checkout').length) {
                            $(document.body).trigger('update_checkout');
                        }
                    }
                },
                error: function(xhr, status, error) {
                    log.error('Error checking cart status:', error);
                }
            });
            
            // Try different ways to access cart count
            if (typeof wc_cart_fragments_params !== 'undefined') {
                log.debug('WooCommerce cart fragments found');
                
                // Force fragment refresh
                $(document.body).trigger('wc_fragment_refresh');
            }
            
            // Check if review order table exists but is empty
            var $reviewTable = $('.woocommerce-checkout-review-order-table');
            if ($reviewTable.length > 0) {
                var hasItems = $reviewTable.find('tr.cart_item').length > 0;
                log.debug('Review order table found, has items:', hasItems);
                
                if (!hasItems) {
                    log.info('No items in review table, attempting to reload');
                    
                    // Show loading message
                    $reviewTable.prepend('<tr class="loading-items"><td colspan="2">טוען פריטים...</td></tr>');
                    
                    // Instead of force refreshing, try to recover cart first
                    setTimeout(function() {
                        // Check again if items appeared
                        if ($reviewTable.find('tr.cart_item').length === 0) {
                            log.warn('Still no items, attempting cart recovery instead of reload');
                            
                            // Show a more informative message
                            $reviewTable.find('.loading-items').html('<td colspan="2">מנסה לשחזר את עגלת הקניות...</td>');
                            
                            // Try to recover cart state via WooCommerce fragments
                            if (typeof wc_cart_fragments_params !== 'undefined') {
                                log.info('Triggering fragment refresh to recover cart');
                                $(document.body).trigger('wc_fragment_refresh');
                                
                                // Check again after fragment refresh
                                setTimeout(function() {
                                    if ($reviewTable.find('tr.cart_item').length > 0) {
                                        log.info('Cart recovered through fragments');
                                        $reviewTable.find('.loading-items').remove();
                                    } else {
                                        log.warn('Recovery failed, showing error message');
                                        // Instead of reload, show user-friendly error message
                                        $reviewTable.find('.loading-items')
                                            .html('<td colspan="2">העגלה ריקה או שיש בעיה בטעינת הפריטים. <a href="/shop/">חזרה לחנות</a></td>')
                                            .removeClass('loading-items')
                                            .addClass('empty-cart-message');
                                    }
                                }, 2000);
                            } else {
                                // No fragments support, provide message
                                $reviewTable.find('.loading-items')
                                    .html('<td colspan="2">העגלה ריקה או שיש בעיה בטעינת הפריטים. <a href="/shop/">חזרה לחנות</a></td>')
                                    .removeClass('loading-items')
                                    .addClass('empty-cart-message');
                            }
                        } else {
                            log.info('Items appeared, removing loading message');
                            $reviewTable.find('.loading-items').remove();
                        }
                    }, 2000);
                }
            }
            
            // Check session storage for rental dates
            if (sessionStorage.getItem('last_added_rental')) {
                try {
                    const rentalData = JSON.parse(sessionStorage.getItem('last_added_rental'));
                    log.debug('Found rental data in session:', rentalData);
                    
                    // Add debug info
                    $('<div class="rental-debug" style="display:none;">Last added: ' + 
                      rentalData.product_id + ' - ' + rentalData.rental_dates + '</div>')
                      .appendTo('.woocommerce-checkout');
                } catch (e) {
                    log.error('Error parsing rental data:', e);
                }
            }
        }
    }
    
    // Function to remove stuck spinners
    function removeStuckSpinners() {
        $('.blockUI.blockOverlay').remove();
        $('.blockUI.blockMsg').remove();
        $('.processing').removeClass('processing');
        $('.woocommerce-checkout-payment').unblock();
        $('form.checkout').unblock();
    }
    
    // Run initially
    removeStuckSpinners();
    
    // Check if we're using the new modular system
    if (window.CheckoutValidator) {
        log.info('Using new checkout validator module');
    } else {
        log.info('Legacy mode: using built-in checkout validation');
        setTimeout(ensureCheckoutItems, 500);
    }
    
    // Also run on AJAX events
    $(document).ajaxComplete(function() {
        setTimeout(removeStuckSpinners, 100);
    });
    
    // Remove spinners on page load and when fragments are refreshed
    $(document.body).on('updated_checkout', function() {
        setTimeout(removeStuckSpinners, 100);
    });
    
    // Set periodic check to make sure no spinners get stuck
    setInterval(removeStuckSpinners, 2000);
    
    // Use the Cart Integration module if available
    if (window.CartIntegration && typeof CartIntegration.forceShowCart === 'function') {
        log.info('Using Cart Integration module for force show cart');
        // Let the module handle this functionality
    } else {
        log.info('Legacy mode: using built-in force show cart');
    }
});
