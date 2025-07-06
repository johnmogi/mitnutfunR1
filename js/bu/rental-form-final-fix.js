/**
 * Final Rental Form Fix - Aggressive Version
 * Forces rental dates to appear in cart/checkout
 */
jQuery(document).ready(function($) {
    'use strict';
    
    console.log('FINAL RENTAL FORM FIX LOADED');
    
    // Global storage for rental dates
    window.lastSelectedRentalDates = '';
    
    // Function to extract rental dates from the page and store globally
    function captureRentalDates() {
        // Try various sources for rental dates
        let rentalDates = '';
        
        // Source 1: Check the dedicated rental_dates input
        const $rentalInput = $('input[name="rental_dates"]');
        if ($rentalInput.length && $rentalInput.val()) {
            rentalDates = $rentalInput.val();
        }
        
        // Source 2: Check the visible display elements
        if (!rentalDates) {
            const $startDate = $('#selected-start-date');
            const $endDate = $('#selected-end-date');
            if ($startDate.length && $endDate.length && $startDate.text() && $endDate.text()) {
                rentalDates = $startDate.text() + ' - ' + $endDate.text();
            }
        }
        
        // Source 3: Check for any date range displayed on page
        if (!rentalDates) {
            const $dateRange = $('.rental-dates-display, .date-range, .rental-period');
            if ($dateRange.length && $dateRange.text().includes('-')) {
                const rangeText = $dateRange.text();
                const matches = rangeText.match(/(\d{1,2}\.\d{1,2}\.\d{4})\s*-\s*(\d{1,2}\.\d{1,2}\.\d{4})/);
                if (matches && matches.length === 3) {
                    rentalDates = matches[1] + ' - ' + matches[2];
                }
            }
        }
        
        // If found, store globally and in all possible locations
        if (rentalDates) {
            console.log('Final Fix - Captured rental dates:', rentalDates);
            
            // Store globally
            window.lastSelectedRentalDates = rentalDates;
            
            // Update/create the hidden input
            if ($rentalInput.length) {
                $rentalInput.val(rentalDates);
            } else {
                $('.single_add_to_cart_button').before('<input type="hidden" name="rental_dates" value="' + rentalDates + '">'); 
            }
            
            // Store in sessionStorage for recovery
            try {
                sessionStorage.setItem('rental_dates', rentalDates);
            } catch (e) { console.warn('Failed to store in sessionStorage', e); }
            
            // Add a data attribute to the form and buttons
            $('form.cart').attr('data-rental-dates', rentalDates);
            $('.single_add_to_cart_button').attr('data-rental-dates', rentalDates);
            
            // Return the found dates
            return rentalDates;
        }
        
        // Try to restore from storage if not found on page
        if (!rentalDates) {
            try {
                rentalDates = sessionStorage.getItem('rental_dates') || window.lastSelectedRentalDates || '';
                if (rentalDates) {
                    console.log('Final Fix - Restored rental dates from storage:', rentalDates);
                }
            } catch (e) { console.warn('Failed to restore from sessionStorage', e); }
        }
        
        return rentalDates;
    }
    
    // Enhancement for add to cart form
    function enhanceAddToCartForm() {
        const $form = $('form.cart');
        if (!$form.length) return;
        
        // Store original form submit handler
        const originalSubmit = $form[0].onsubmit;
        
        // Override form submit to ensure rental dates are included
        $form[0].onsubmit = function(e) {
            // Always capture dates before submission
            const rentalDates = captureRentalDates();
            
            // Force-update the hidden input
            let $input = $form.find('input[name="rental_dates"]');
            if ($input.length === 0) {
                $input = $('<input type="hidden" name="rental_dates">').appendTo($form);
            }
            $input.val(rentalDates);
            
            console.log('Final Fix - Form submission with rental dates:', rentalDates);
            
            // Call original handler if it exists
            if (typeof originalSubmit === 'function') {
                return originalSubmit.call(this, e);
            }
        };
        
        // Enhance AJAX add to cart
        $(document.body).on('adding_to_cart', function(e, $button, data) {
            const rentalDates = captureRentalDates();
            if (rentalDates) {
                console.log('Final Fix - Adding rental dates to AJAX data:', rentalDates);
                data.rental_dates = rentalDates;
            }
        });
        
        console.log('Final Fix - Enhanced add to cart form');
    }
    
    // Display rental dates in cart/checkout even if they're missing
    function enhanceCartDisplay() {
        // Only run on cart or checkout pages
        if (!$('.woocommerce-cart-form,.woocommerce-checkout').length) return;
        
        console.log('Final Fix - Enhancing cart display for rental dates');
        
        // Try to extract dates from URL parameters (they might be passed this way)
        function getUrlParam(name) {
            const results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.search);
            return results ? decodeURIComponent(results[1]) : null;
        }
        
        const urlDates = getUrlParam('rental_dates');
        if (urlDates) {
            console.log('Final Fix - Found rental dates in URL:', urlDates);
            window.lastSelectedRentalDates = urlDates;
        }
        
        // Function to enhance cart item display
        function addRentalInfoToItems() {
            // Get saved dates
            const rentalDates = captureRentalDates() || window.lastSelectedRentalDates;
            if (!rentalDates) return;
            
            // Add rental dates to cart items that don't have them
            $('.cart_item, .cart-item, .order-item').each(function() {
                const $item = $(this);
                
                // Only add if there isn't already rental info
                if (!$item.find('.rental-dates').length && !$item.find('.rental-info').length) {
                    console.log('Final Fix - Adding rental dates to cart item');
                    
                    // Create rental info display
                    const $rentalInfo = $(
                        '<div class="rental-info" style="margin: 10px 0; font-weight: bold;">' +
                        '<span class="rental-label">תאריכי השכרה: </span>' +
                        '<span class="rental-dates">' + rentalDates + '</span>' +
                        '</div>'
                    );
                    
                    // Add to item details
                    const $target = $item.find('.product-name, .info');
                    if ($target.length) {
                        $target.append($rentalInfo);
                    } else {
                        $item.append($rentalInfo);
                    }
                }
            });
            
            // Add rental info to checkout order review if not present
            const $review = $('.woocommerce-checkout-review-order');
            if ($review.length && !$review.find('.rental-dates').length) {
                const $items = $review.find('.item');
                if ($items.length) {
                    $items.each(function() {
                        const $item = $(this);
                        const $info = $item.find('.info');
                        
                        if ($info.length && !$item.find('.rental-dates').length) {
                            $info.append(
                                '<div class="rental-info" style="margin-top: 5px;">' +
                                '<span class="rental-label">תאריכי השכרה: </span>' +
                                '<span class="rental-dates">' + rentalDates + '</span>' +
                                '</div>'
                            );
                        }
                    });
                }
            }
        }
        
        // Run immediately and set up mutation observer to catch dynamic updates
        addRentalInfoToItems();
        
        // Set up observer to catch any dynamically added/updated cart items
        const observer = new MutationObserver(function(mutations) {
            addRentalInfoToItems();
        });
        
        // Start observing cart/checkout containers for changes
        $('.woocommerce-cart-form, .cart_totals, .woocommerce-checkout-review-order-table').each(function() {
            observer.observe(this, { childList: true, subtree: true });
        });
    }
    
    // Run all enhancements
    function initFinalFix() {
        captureRentalDates(); // Initial capture
        enhanceAddToCartForm();
        enhanceCartDisplay();
        
        // Re-run on AJAX completion
        $(document).ajaxComplete(function() {
            setTimeout(captureRentalDates, 300);
            setTimeout(enhanceCartDisplay, 500);
        });
    }
    
    // Initialize with a delay
    setTimeout(initFinalFix, 1000);
});
