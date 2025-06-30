/**
 * Mini Cart Fix
 * Fixes alignment, RTL, and item removal issues in the floating cart
 */
jQuery(document).ready(function($) {
    'use strict';
    
    console.log('MINI CART FIX LOADED');
    
    // Configuration
    const EXCLUDED_PRODUCT_IDS = [150, 153]; // Products excluded from the discount
    
    /**
     * Fix Mini Cart UI and recalculate prices
     */
    function fixMiniCart() {
        // Target the mini cart elements
        const $miniCart = $('.check-popup');
        if (!$miniCart.length) return;
        
        console.log('Fixing mini cart UI and calculations');
        
        // Ensure RTL is properly applied
        $miniCart.attr('dir', 'rtl');
        
        // Fix alignment of items
        $('.item', $miniCart).css({
            'display': 'flex',
            'flex-direction': 'row',
            'align-items': 'flex-start',
            'justify-content': 'space-between',
            'text-align': 'right',
            'direction': 'rtl'
        });
        
        // Fix text alignment
        $('.text', $miniCart).css({
            'text-align': 'right',
            'direction': 'rtl'
        });
        
        // Ensure the proper calculation of rental days
        $('.item', $miniCart).each(function() {
            const $item = $(this);
            const $rentalDates = $item.find('.rental-dates');
            
            if ($rentalDates.length) {
                const datesText = $rentalDates.text();
                const datesMatch = datesText.match(/(\d{1,2}\.\d{1,2}\.\d{4})\s*-\s*(\d{1,2}\.\d{1,2}\.\d{4})/);
                
                if (datesMatch && datesMatch.length === 3) {
                    const startDateStr = datesMatch[1];
                    const endDateStr = datesMatch[2];
                    
                    // Parse dates for calculation
                    const startParts = startDateStr.split('.');
                    const endParts = endDateStr.split('.');
                    
                    if (startParts.length === 3 && endParts.length === 3) {
                        const startDate = new Date(startParts[2], parseInt(startParts[1])-1, parseInt(startParts[0]));
                        const endDate = new Date(endParts[2], parseInt(endParts[1])-1, parseInt(endParts[0]));
                        
                        // Calculate days between
                        const diffTime = Math.abs(endDate - startDate);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        
                        // Calculate rental days per the rule
                        let rentalDays = diffDays;
                        
                        // Check if range spans Friday to Sunday
                        const startDay = startDate.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
                        const endDay = endDate.getDay();
                        
                        if (startDay === 5 && endDay === 0 && diffDays <= 3) {
                            rentalDays = 1;
                        } else {
                            // Apply the regular rental days calculation (2=1, 3=2, 4=3, etc.)
                            if (diffDays === 2) rentalDays = 1;
                            else if (diffDays > 2) rentalDays = diffDays - 1;
                        }
                        
                        // Update any rental days container
                        const $container = $item.find('.rental-dates-container');
                        if ($container.length) {
                            // Parse the data attribute and update rental days
                            let data = {};
                            try {
                                data = JSON.parse($container.attr('data-cart-item') || '{}');
                                data.rental_days = rentalDays;
                                $container.attr('data-cart-item', JSON.stringify(data));
                                $container.attr('data-rental-days', rentalDays);
                            } catch (e) {
                                console.error('Failed to parse rental data', e);
                            }
                        }
                        
                        // Update the breakdown if it exists
                        const $breakdown = $item.next('.rental-item-breakdown');
                        if ($breakdown.length) {
                            $('.rental-item-days', $breakdown).text('ימי השכרה: ' + rentalDays);
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Handle Mini Cart Item Removal
     * Fixes UI after removing an item
     */
    function handleMiniCartRemoval() {
        $(document).on('click', '.check-popup .remove_from_cart_button', function(e) {
            // Get the cart item container
            const $item = $(this).closest('.item');
            const $breakdown = $item.next('.rental-item-breakdown');
            
            // Add a loading state
            $item.css('opacity', '0.5').append('<div class="removing">מסיר פריט...</div>');
            
            // Hide the breakdown immediately to prevent UI glitches
            if ($breakdown.length) {
                $breakdown.hide();
            }
            
            // After AJAX completes, make sure the UI is restored properly
            $(document).ajaxComplete(function(event, xhr, settings) {
                // Check if this is a cart update or remove item request
                if (settings.url && (settings.url.includes('remove_item') || settings.url.includes('cart'))) {
                    // Wait a moment then reapply fixes
                    setTimeout(function() {
                        fixMiniCart();
                        
                        // Remove any error states
                        $('.check-popup .removing').remove();
                        $('.check-popup .item').css('opacity', '1');
                    }, 500);
                }
            });
        });
    }
    
    /**
     * Initialize all fixes
     */
    function init() {
        // Apply fixes whenever the cart is shown
        $(document).on('click', '.cart-open', function() {
            // Wait for the popup to fully open
            setTimeout(fixMiniCart, 300);
        });
        
        // Apply fixes after any AJAX completion
        $(document).ajaxComplete(function() {
            setTimeout(fixMiniCart, 300);
        });
        
        // Watch for mini cart removals
        handleMiniCartRemoval();
        
        // Also fix at page load if cart is visible
        setTimeout(fixMiniCart, 1000);
    }
    
    // Initialize
    init();
});
