/**
 * Cart Rental Fix
 * Fixes display issues with rental products in cart
 */

(function($) {
    'use strict';
    
    // Debug logging helper
    function debugLog(...args) {
        console.log('[Cart Rental Fix]', ...args);
    }
    
    // Wait for DOM to be ready
    $(document).ready(function() {
        debugLog('Initializing cart rental fixes...');
        
        // Fix 1: Remove blockUI overlays that never get removed
        removeEndlessSpinners();
        
        // Fix 2: Update rental date display in cart items
        fixRentalDateDisplay();
        
        // Fix 3: Watch for AJAX complete events and fix spinners
        $(document).ajaxComplete(function(event, xhr, settings) {
            // Give WooCommerce time to process the response
            setTimeout(function() {
                removeEndlessSpinners();
                fixRentalDateDisplay();
            }, 500);
        });
    });
    
    /**
     * Remove endless spinners from the cart/checkout
     */
    function removeEndlessSpinners() {
        debugLog('Checking for endless spinners...');
        
        // Check if there are blockUI overlays that have been there too long
        const $spinners = $('.blockUI.blockOverlay');
        
        if ($spinners.length > 0) {
            debugLog(`Found ${$spinners.length} potential endless spinners`);  
            
            // Remove blockUI overlays from the cart fragments/checkout
            $spinners.each(function() {
                const $spinner = $(this);
                const $parent = $spinner.parent();
                
                // Only remove spinners that are over cart elements or checkout review
                if ($parent.find('.cart_item').length > 0 || 
                    $parent.find('.cart-container').length > 0 || 
                    $parent.hasClass('woocommerce-checkout-review-order-table') || 
                    $parent.hasClass('cart_totals')) {
                    
                    debugLog('Removing endless spinner', $spinner);
                    $spinner.remove();
                    
                    // Also remove any blockUI message elements
                    $parent.find('.blockUI.blockMsg').remove();
                }
            });
        }
    }
    
    /**
     * Fix rental date display in cart items
     */
    function fixRentalDateDisplay() {
        debugLog('Fixing rental date display...');
        
        // Find all cart items that might be rentals
        $('.item').each(function() {
            const $item = $(this);
            const $dateContainer = $item.find('.info p:nth-child(2)');
            
            // Skip if this doesn't look like the date container
            if (!$dateContainer.length) return;
            
            const dateText = $dateContainer.text().trim();
            
            // If the date text is empty or just contains 'null', try to find it elsewhere
            if (!dateText || dateText === 'null') {
                debugLog('Empty date found, attempting to fix', $item);
                
                // Try to find the rental dates in any data attributes
                const $cartItem = $item.closest('.cart_item');
                if ($cartItem.length) {
                    const itemKey = $cartItem.attr('data-cart-item-key') || 
                                  $item.find('.remove_from_cart_button').data('cart_item_key');
                    
                    if (itemKey) {
                        // Use session storage as a temporary fix if we stored dates there
                        const storedDates = sessionStorage.getItem('rental_dates_' + itemKey);
                        if (storedDates) {
                            $dateContainer.text(storedDates);
                            debugLog('Fixed date display from session storage', storedDates);
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Store currently selected dates in session storage before adding to cart
     * This helps recover dates if they get lost in the cart
     */
    function setupDateRecovery() {
        // When add to cart button is clicked, store the selected dates
        $('.single_add_to_cart_button').on('click', function() {
            const rentalDates = $('input[name="rental_dates"]').val();
            if (rentalDates) {
                const productId = $('input[name="add-to-cart"]').val();
                const tempKey = 'rental_dates_' + productId + '_' + Date.now();
                sessionStorage.setItem(tempKey, rentalDates);
                debugLog('Stored rental dates for recovery', rentalDates);
                
                // Clean up old entries after 10 minutes
                setTimeout(function() {
                    sessionStorage.removeItem(tempKey);
                }, 600000);
            }
        });
    }

})(jQuery);
