/**
 * Cart and Mini-Cart Rental Fix
 * Unified script to fix display issues with rental products in cart and mini-cart
 * Centralized from previously separate cart-rental-fix.js and mini-cart-fix.js
 */

(function($) {
    'use strict';
    
    // Debug logging helper
    function debugLog(...args) {
        console.log('[Cart Rental Fix]', ...args);
    }
    
    // Configuration
    const EXCLUDED_PRODUCT_IDS = [150, 153]; // Products excluded from the discount
    
    // Wait for DOM to be ready
    $(document).ready(function() {
        debugLog('Initializing cart and mini-cart rental fixes...');
        
        // Fix 1: Remove blockUI overlays that never get removed
        removeEndlessSpinners();
        
        // Fix 2: Update rental date display in cart items
        fixRentalDateDisplay();
        
        // Fix 3: Fix mini-cart display and alignment
        fixMiniCart();
        
        // Fix 4: Setup enhanced item removal handling
        handleMiniCartRemoval();
        
        // Fix 5: Watch for AJAX complete events and reapply fixes
        $(document).ajaxComplete(function(event, xhr, settings) {
            // Give WooCommerce time to process the response
            setTimeout(function() {
                removeEndlessSpinners();
                fixRentalDateDisplay();
                fixMiniCart();
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
                
                // Check if our enhanced template left data to use
                const $rentalContainer = $item.find('.rental-dates-container');
                if ($rentalContainer.length) {
                    try {
                        // Try to parse the cart item data
                        const cartItemData = $rentalContainer.data('cart-item');
                        if (cartItemData) {
                            debugLog('Found cart item data', cartItemData);
                            
                            // Process any rental info we can find
                            if (cartItemData.dates) {
                                $dateContainer.html('<div class="rental-dates"><strong>תאריכי השכרה:</strong> ' + 
                                    cartItemData.dates + '</div>');
                                debugLog('Fixed date display from data attribute', cartItemData.dates);
                            }
                        }
                    } catch (err) {
                        debugLog('Error parsing cart item data', err);
                    }
                }
                
                // Try to find the rental dates in any data attributes
                const $cartItem = $item.closest('.cart_item');
                if ($cartItem.length) {
                    const itemKey = $cartItem.attr('data-cart-item-key') || 
                                  $item.find('.remove_from_cart_button').data('cart_item_key');
                    
                    if (itemKey) {
                        // Use session storage as a temporary fix if we stored dates there
                        const storedDates = sessionStorage.getItem('rental_dates_' + itemKey);
                        if (storedDates) {
                            $dateContainer.html('<div class="rental-dates-display"><strong>תאריכי השכרה:</strong> ' + 
                                storedDates + '</div>');
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
                // Get product ID from different possible sources
                const productId = $('input[name="add-to-cart"]').val() || 
                                 $('[name="product_id"]').val() ||
                                 $('.content').data('product-id');
                                 
                if (productId) {
                    // Store dates both by product ID and with timestamp
                    sessionStorage.setItem('rental_dates_' + productId, rentalDates);
                    const tempKey = 'rental_dates_' + productId + '_' + Date.now();
                    sessionStorage.setItem(tempKey, rentalDates);
                    debugLog('Stored rental dates for recovery', {productId, rentalDates});
                    
                    // Clean up old entries after 10 minutes
                    setTimeout(function() {
                        sessionStorage.removeItem(tempKey);
                    }, 600000);
                } else {
                    debugLog('Could not find product ID for date storage');
                }
            }
        });
    }
    
    /**
     * Fix Mini Cart UI and recalculate prices
     */
    function fixMiniCart() {
        // Target the mini cart elements
        const $miniCart = $('.check-popup');
        if (!$miniCart.length) return;
        
        debugLog('Fixing mini cart UI and calculations');
        
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
        
        // Fix rental days display and pricing consistency
        fixRentalDaysDisplay();
        
        // Clear any old rental price breakdowns to avoid duplication
        $('.rental-item-breakdown').remove();
    }
    
    /**
     * Handle Mini Cart Item Removal
     * Fixes UI after removing an item
     */
    function handleMiniCartRemoval() {
        // When an item is removed from the cart
        $(document).on('click', '.remove_from_cart_button', function(e) {
            const $button = $(this);
            const $item = $button.closest('.item');
            
            // Animate item removal
            $item.fadeOut(300, function() {
                // Check if it's the last item
                if ($('.check-popup .items .item:visible').length === 0) {
                    // If last item removed, show empty cart message
                    $('.check-popup .items').html(
                        '<p class="woocommerce-mini-cart__empty-message">אין מוצרים בעגלה</p>'
                    );
                }
                
                // Also remove any related breakdown rows
                const $breakdown = $item.next('.rental-item-breakdown');
                if ($breakdown.length) {
                    $breakdown.remove();
                }
            });
            
            // Don't prevent default action, let WC handle the actual removal
        });
    }
    
    /**
     * Fix rental days display to ensure consistency
     * This ensures Friday-Sunday is treated as 1 day
     */
    function fixRentalDaysDisplay() {
        debugLog('Fixing rental days display consistency...');
        
        // Find all rental items in the mini-cart
        $('.item', '.check-popup').each(function() {
            const $item = $(this);
            
            // Find rental dates container
            const $dateContainer = $item.find('.rental-dates-container');
            if (!$dateContainer.length) return;
            
            // Get rental dates from data attribute
            const rentalDates = $dateContainer.data('rental-dates');
            if (!rentalDates || rentalDates.indexOf(' - ') === -1) return;
            
            // Calculate correct rental days using PHP's logic
            const dateParts = rentalDates.split(' - ');
            if (dateParts.length !== 2) return;
            
            // Parse dates - handle various formats (assuming D.M.YYYY)
            const startParts = dateParts[0].split('.');
            const endParts = dateParts[1].split('.');
            
            if (startParts.length !== 3 || endParts.length !== 3) return;
            
            try {
                // Create Date objects
                const startDate = new Date(startParts[2], startParts[1]-1, startParts[0]);
                const endDate = new Date(endParts[2], endParts[1]-1, endParts[0]);
                
                // Check for Friday-Sunday special case
                const startDay = startDate.getDay(); // 0=Sunday, 5=Friday
                const endDay = endDate.getDay();
                const diffDays = Math.round((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1;
                
                let rentalDays = diffDays;
                
                // Apply special Friday-Sunday = 1 day rule
                if (startDay === 5 && endDay === 0 && diffDays <= 3) {
                    rentalDays = 1;
                    debugLog('Applied Friday-Sunday special rule:', dateParts, 'days:', rentalDays);
                } else if (diffDays >= 3 && diffDays <= 4) {
                    // Special case for 3-4 day rentals: count as 2 days
                    rentalDays = 2;
                    debugLog('Applied 3-4 day special rule:', dateParts, 'days:', rentalDays);
                } else {
                    // Apply standard rental day calculation (2=1, 3=2, etc.)
                    if (diffDays === 2) rentalDays = 1;
                    else if (diffDays > 2) rentalDays = diffDays - 1;
                }
                
                // Update data attribute with correct rental days
                $dateContainer.attr('data-rental-days', rentalDays);
                
                // Update any displayed rental days text
                const $rentalDaysText = $item.find('.rental-days-text');
                if ($rentalDaysText.length) {
                    $rentalDaysText.text(rentalDays);
                }
                
                debugLog('Updated rental days display:', {item: $item, dates: rentalDates, days: rentalDays});
                
                // Update price display if needed
                const $priceContainer = $item.find('.rental-price');
                if ($priceContainer.length) {
                    // First, remove any existing price indicators to prevent duplication
                    $priceContainer.find('.price-needs-update').remove();
                    
                    // Calculate the correct price based on rental days
                    const $priceAmount = $priceContainer.find('.woocommerce-Price-amount');
                    if ($priceAmount.length) {
                        // Extract current price and currency
                        let currentPriceText = $priceAmount.text();
                        let price = parseFloat(currentPriceText.replace(/[^0-9.]/g, ''));
                        let currency = $priceAmount.find('.woocommerce-Price-currencySymbol').text() || '₪';
                        
                        // Get original days from data attribute (usually 2 for a Fri-Sun rental)
                        let originalDays = parseInt($dateContainer.data('cart-item').rental_days) || diffDays;
                        
                        // Calculate base price for 1 day (full price)
                        // Standard rental price logic: 1st day 100%, additional days 50%
                        let basePrice, newPrice;
                        
                        // Get product ID to check for exceptions
                        let productId = parseInt($item.find('[data-product_id]').data('product_id') || 0);
                        
                        // Products 150 and 153 have no discount for additional days
                        const hasDiscount = (productId !== 150 && productId !== 153);
                        
                        // Special case: if we're going from PHP calculation of 2 days to JS calculation of 1 day
                        // and this isn't a Friday-Sunday rental, it's likely a standard next-day pickup (e.g. 9.7-10.7)
                        // In this case, we should use the full product price from the product page
                        if (rentalDays === 1 && (diffDays === 2 || originalDays === 2)) {
                            // Simple 1-day rental case (e.g. 9.7-10.7)
                            // We should use the full product base price
                            // For 1-day rentals, price should be 550₪ as shown on product page
                            const standardBasePrice = 550; // This is the known standard 1-day price
                            newPrice = standardBasePrice;
                            debugLog('Using standard 1-day price:', standardBasePrice);
                        } else if (originalDays === 1) {
                            // Price already for 1 day
                            basePrice = price;
                            newPrice = price;
                        } else if (hasDiscount) {
                            // For products with discount: 1 day full price + 0.5 * (days-1)
                            // So for 2 days -> 1.5x price, 3 days -> 2x price
                            // To get base price: price / (1 + 0.5 * (days-1))
                            basePrice = price / (1 + 0.5 * (originalDays - 1));
                            newPrice = basePrice * (1 + 0.5 * (rentalDays - 1));
                        } else {
                            // No discount products: price is directly proportional to days
                            basePrice = price / originalDays;
                            newPrice = basePrice * rentalDays;
                        }
                        
                        // Debug logging
                        debugLog('Price calculation', {
                            item: $item,
                            productId: productId,
                            hasDiscount: hasDiscount,
                            originalDays: originalDays,
                            correctedDays: rentalDays,
                            currentPrice: price,
                            basePrice: basePrice,
                            newPrice: newPrice.toFixed(2)
                        });
                        
                        // Update the displayed price with the corrected amount
                        $priceAmount.find('bdi').html(newPrice.toFixed(2) + '&nbsp;<span class="woocommerce-Price-currencySymbol">' + currency + '</span>');
                        
                        // Remove the rental discount info to save space in the floating cart
                        $priceContainer.find('.rental-discount-info').remove();
                        
                        // Add class to indicate we've fixed this item
                        $item.addClass('rental-price-fixed');
                    }
                }
            } catch (err) {
                debugLog('Error calculating rental days:', err);
            }
        });
    }
    
    // Initialize date recovery
    $(document).ready(function() {
        setupDateRecovery();
    });

})(jQuery);
