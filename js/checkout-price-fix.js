/**
 * Checkout Price Fix
 * Forces proper rental price calculation and display in checkout
 * Note: Core rental calculation logic is now centralized in rental-pricing.php
 * This file now only handles display and UI aspects in the checkout
 */
jQuery(document).ready(function($) {
    'use strict';
    
    console.log('CHECKOUT PRICE FIX LOADED');
    
    // Configuration
    const EXCLUDED_PRODUCT_IDS = [150, 153]; // Products excluded from the discount
    
    // NOTE: The core rental calculation logic has been centralized in inc/rental-pricing.php
    // This reduces duplication and ensures consistent calculations across all parts of the site.
    // The PHP implementation is used for server-side calculations, and we rely on those values here.
    
    // Helper function to extract rental days from data attributes when available
    function getRentalDaysFromElement($element) {
        // First try to get rental days from data attributes (set by PHP)
        if ($element.data('rental-days')) {
            return parseInt($element.data('rental-days'));
        }
        
        // If no data attribute, look for a rental days text display
        const $rentalDaysText = $element.find('.rental-days-text');
        if ($rentalDaysText.length) {
            const daysText = $rentalDaysText.text();
            const daysMatch = daysText.match(/\d+/);
            if (daysMatch) {
                return parseInt(daysMatch[0]);
            }
        }
        
        // Default to 1 day if we can't find the rental days
        console.warn('Could not determine rental days, using default of 1');
        return 1;
    }
    
    // Function to update the rental price display in checkout
    function updatePriceDisplay() {
        // Only run on checkout page
        if (!$('.woocommerce-checkout').length) return;
        
        console.log('Updating price display in checkout...');
        
        // Find all items in the order
        $('.item').each(function() {
            const $item = $(this);
            const $info = $item.find('.info');
            const $cost = $item.find('.cost');
            
            // Skip if not a rental item
            if (!$item.hasClass('rental-item') && !$info.find('.rental-dates').length) {
                return;
            }
            
            // Get rental days from data attribute (set by PHP) or detect from display
            const rentalDays = getRentalDaysFromElement($item);
            
            // Display rental days if not already shown
            if (!$info.find('.rental-days-text').length) {
                $info.append('<div class="rental-days-text">ימי השכרה: ' + rentalDays + '</div>');
            }
            
            // Ensure the price is displayed correctly
            const $priceEl = $item.find('.rental-price');
            if ($priceEl.length && $cost.length) {
                // Copy the price display to the cost element to ensure consistency
                $cost.html($priceEl.html());
            }
            
            // Remove any duplicate rental breakdown elements
            const $existingBreakdowns = $item.siblings('.rental-price-breakdown, .rental-item-breakdown');
            if ($existingBreakdowns.length > 1) {
                // Keep only the first one
                $existingBreakdowns.not(':first').remove();
            }
        });
    }
    
    // Initial update
    setTimeout(updatePriceDisplay, 1000);
    
    // Debounce function to prevent excessive updates
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    // Use debounced update function
    const debouncedUpdate = debounce(updatePriceDisplay, 3000); // 3-second delay
    
    // Flag to prevent recursive updates
    let isUpdating = false;
    
    // Update when DOM changes (for dynamic checkout updates)
    const observer = new MutationObserver(function(mutations) {
        // Skip if we're already in the middle of an update
        if (isUpdating) return;
        
        // Check if this mutation was triggered by our own price updates
        let skipUpdate = false;
        for (let i = 0; i < mutations.length; i++) {
            const mutation = mutations[i];
            // If price elements were modified, likely our own update
            if (mutation.target && ($(mutation.target).hasClass('cost') || 
                $(mutation.target).hasClass('rental-price') || 
                $(mutation.target).hasClass('woocommerce-Price-amount'))) {
                skipUpdate = true;
                break;
            }
        }
        
        if (skipUpdate) return;
        
        // Use debounced update to prevent rapid-fire changes
        debouncedUpdate();
    });
    
    // Observe changes to checkout content
    if ($('.woocommerce-checkout').length) {
        const checkoutReview = document.querySelector('.woocommerce-checkout-review-order');
        if (checkoutReview) {
            observer.observe(checkoutReview, { 
                childList: true,
                subtree: true,
                characterData: true
            });
        }
    }
    
    // Modify the updatePriceDisplay function to use the isUpdating flag
    const originalUpdatePriceDisplay = updatePriceDisplay;
    updatePriceDisplay = function() {
        isUpdating = true;
        originalUpdatePriceDisplay();
        
        // Reset the flag after DOM has settled
        setTimeout(function() {
            isUpdating = false;
        }, 1000);
    };
    
    // Also update after AJAX calls
    $(document).ajaxComplete(function() {
        setTimeout(updatePriceDisplay, 500);
    });
});
