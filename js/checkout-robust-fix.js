/**
 * Checkout Robust Fix
 * Addresses critical checkout issues:
 * 1. Prevents broken UI when cart is cleared
 * 2. Ensures consistent pricing after page refreshes
 */
jQuery(document).ready(function($) {
    'use strict';
    
    console.log('CHECKOUT ROBUST FIX LOADED');
    
    // Configuration
    const EXCLUDED_PRODUCT_IDS = [150, 153]; // Products excluded from the discount
    const DEBUG = true; // Enable console logging
    
    /**
     * Debug logger
     */
    function log(...args) {
        if (DEBUG) {
            console.log('[CHECKOUT-FIX]', ...args);
        }
    }
    
    /**
     * Handle empty cart scenario
     * Prevents blank/broken page when cart is cleared
     */
    function handleEmptyCart() {
        // Watch for cart clearing events
        $(document).on('click', '.woocommerce-remove-coupon, [name="update_cart"], .remove_from_cart_button', function() {
            log('Cart item removal detected');
            
            // Set a flag that we're potentially clearing the cart
            sessionStorage.setItem('potential_cart_clear', 'true');
        });
        
        // Check on page load if cart is empty
        function checkEmptyCart() {
            const $items = $('.woocommerce-checkout-review-order-table .item');
            const isEmpty = $items.length === 0;
            
            log('Checking if cart is empty:', isEmpty);
            
            if (isEmpty) {
                // Handle empty cart scenario
                handleEmptyCartUI();
            }
        }
        
        // Handle UI for empty cart
        function handleEmptyCartUI() {
            log('Handling empty cart UI');
            
            const $checkout = $('.woocommerce-checkout');
            const $emptyMessage = $('.cart-empty, .woocommerce-info:contains("עגלת הקניות שלך ריקה")'); 
            
            // If we already have an empty message, don't add another
            if ($emptyMessage.length) return;
            
            // Clear the flag, but don't redirect
            if (sessionStorage.getItem('potential_cart_clear') === 'true') {
                log('Potential cart clear detected, showing empty cart message');
                sessionStorage.removeItem('potential_cart_clear');
                // No redirect - instead we'll show a message below
            }
            
            // Add empty cart message
            const emptyCartMessage = '<div class="woocommerce-info cart-empty">עגלת הקניות שלך ריקה. <a href="/shop/">חזרה לחנות</a></div>';
            
            // Replace checkout content with empty message
            if ($checkout.length) {
                $checkout.before(emptyCartMessage);
                $checkout.hide();
            }
        }
        
        // Initial check
        setTimeout(checkEmptyCart, 1000);
        
        // After AJAX requests
        $(document).ajaxComplete(function() {
            setTimeout(checkEmptyCart, 500);
        });
    }
    
    /**
     * Fix price inconsistencies in checkout
     * Ensures prices are accurate and consistent throughout the page
     */
    function fixPriceInconsistencies() {
        log('Setting up price consistency fixes');
        
        // Get rental days from data attribute or element (set by server-side PHP)
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
            
            // Look for rental dates to make a basic estimation
            const $rentalDates = $element.find('.rental-dates');
            if ($rentalDates.length) {
                // Just return 1 as a default, this is safer than trying to recalculate
                // The actual calculation should be done on the server in rental-pricing.php
                log('Rental dates found but no days specified, defaulting to 1 day');
                return 1;
            }
            
            // Default to 1 day if we can't find anything rental related
            return 1;
        }
        
        // NOTE: Discount calculation is now centralized in rental-pricing.php
        // This function is only used to get discounted prices from the server-side values
        // when they are available in the DOM
        function getDiscountedPriceFromElement($element) {
            // Try to get the discounted price from data attributes or elements
            // set by the server-side rental pricing logic
            const $priceEl = $element.find('.rental-price, .discounted-price');
            if ($priceEl.length) {
                const priceText = $priceEl.text().trim();
                const priceMatch = priceText.match(/(\d+(?:\.\d+)?)/);
                if (priceMatch) {
                    return parseFloat(priceMatch[0]);
                }
            }
            
            // If we can't find a discounted price element, try the main price
            // (This is a fallback, not ideal since we won't have proper discounts)
            const $costEl = $element.find('.cost .woocommerce-Price-amount');
            if ($costEl.length) {
                const costText = $costEl.text().trim();
                const costMatch = costText.match(/(\d+(?:\.\d+)?)/);
                if (costMatch) {
                    return parseFloat(costMatch[0]);
                }
            }
            
            // Default to 0 if we can't find a price
            return 0;
        }
        
        // Extract numeric price from price string
        function extractPrice(priceString) {
            if (!priceString) return 0;
            const numericString = priceString.replace(/[^\d.]/g, '');
            return parseFloat(numericString) || 0;
        }
        
        // Format price with currency symbol
        function formatPrice(price) {
            return price.toFixed(2) + '&nbsp;₪';
        }
        
        // Update individual item prices
        function updateItemPrices() {
            log('Updating item prices');
            
            // Process each item in the order
            $('.woocommerce-checkout-review-order-table .item').each(function() {
                const $item = $(this);
                const $info = $item.find('.info');
                const $name = $info.find('.name').first();
                const $cost = $item.find('.cost');
                const $priceEl = $cost.find('.woocommerce-Price-amount');
                
                if (!$name.length || !$priceEl.length) {
                    log('Missing required elements for item');
                    return;
                }
                
                const productName = $name.text().trim();
                log('Processing:', productName);
                
                // Get product ID if available
                let productId = $item.data('product-id');
                let isExcluded = false;
                
                // Check if product is excluded from discounts
                if (productId) {
                    isExcluded = EXCLUDED_PRODUCT_IDS.includes(parseInt(productId, 10));
                } else {
                    // Try to check by name if ID is not available
                    const nameBasedCheck = productName.includes('150') || productName.includes('153');
                    isExcluded = nameBasedCheck;
                }
                
                // Find rental dates
                const $rentalDates = $info.find('.rental-dates');
                if (!$rentalDates.length) {
                    log('No rental dates found for', productName);
                    return;
                }
                
                // Get rental days from element
                const rentalDays = getRentalDaysFromElement($item);
                
                if (rentalDays <= 0) {
                    log('Invalid rental days');
                    return;
                }
                
                // Store rental days in data attribute for future reference
                $item.attr('data-rental-days', rentalDays);
                log('Rental days:', rentalDays);
                
                // Get the base price
                const currentPrice = extractPrice($priceEl.text());
                if (currentPrice <= 0) {
                    log('Invalid current price');
                    return;
                }
                
                // Calculate the base price (price for one day)
                let basePrice = currentPrice;
                
                // If we already have multiple days, calculate back to base price
                if (rentalDays > 1 && !isExcluded) {
                    // For 2+ days with discount: price = basePrice + 0.5 * basePrice * (days - 1)
                    // So: basePrice = price / (1 + 0.5 * (days - 1))
                    basePrice = currentPrice / (1 + 0.5 * (rentalDays - 1));
                }
                
                // Get the discounted price from element or calculate it from base price
                const correctPrice = getDiscountedPriceFromElement($item) || basePrice * rentalDays;
                
                // Only update if there's a significant difference
                if (Math.abs(correctPrice - currentPrice) > 0.1) {
                    log(`Price correction for ${productName}: ${currentPrice} -> ${correctPrice}`);
                    $priceEl.html(formatPrice(correctPrice));
                    
                    // Force update of breakdown if it exists
                    const $breakdown = $item.next('.rental-item-breakdown');
                    if ($breakdown.length) {
                        $breakdown.find('.rental-item-discount').first()
                            .text(`מחיר ליום ראשון: ${formatPrice(basePrice)}`);
                            
                        if (!isExcluded && rentalDays > 1) {
                            $breakdown.find('.rental-item-discount').eq(1)
                                .text(`מחיר לימים נוספים: ${formatPrice(basePrice * 0.5)} (הנחה 50%)`);
                                
                            const savings = basePrice * 0.5 * (rentalDays - 1);
                            $breakdown.find('.rental-item-savings')
                                .text(`חסכון: ${formatPrice(savings)}`);
                        }
                    }
                }
            });
            
            // Update order total after updating individual items
            updateOrderTotal();
        }
        
        // Update the order total based on item prices
        function updateOrderTotal() {
            log('Updating order total');
            
            let total = 0;
            
            // Sum up all item prices
            $('.woocommerce-checkout-review-order-table .item').each(function() {
                const $item = $(this);
                const $priceEl = $item.find('.woocommerce-Price-amount');
                
                if ($priceEl.length) {
                    const itemPrice = extractPrice($priceEl.text());
                    total += itemPrice;
                    log('Added item price:', itemPrice);
                }
            });
            
            log('Calculated total:', total);
            
            // Update the total display
            const $totalEl = $('.woocommerce-checkout-review-order-table .line + ul li:last-child p:last-child .woocommerce-Price-amount');
            if ($totalEl.length && total > 0) {
                $totalEl.html(formatPrice(total));
                log('Updated order total display');
            }
        }
        
        // Run the price update routine
        function runPriceUpdate() {
            setTimeout(function() {
                updateItemPrices();
                updateOrderTotal();
            }, 800);
        }
        
        // Run price update on page load
        runPriceUpdate();
        
        // Run after any checkout update
        $(document).on('updated_checkout', function() {
            log('Checkout updated, running price update');
            runPriceUpdate();
        });
        
        // Flag to prevent recursive updates
        let isUpdating = false;
        
        // Debounce timer
        let updateTimer = null;
        
        // Watch for DOM changes in the order review area with debouncing
        const observer = new MutationObserver(function(mutations) {
            // Skip if we're the ones causing the change
            if (isUpdating) {
                return;
            }
            
            // Check if this mutation was triggered by our price updates
            let skipUpdate = false;
            mutations.forEach(function(mutation) {
                // If this is a change to price amounts, likely our own update
                if (mutation.target && $(mutation.target).hasClass('woocommerce-Price-amount')) {
                    skipUpdate = true;
                }
            });
            
            if (skipUpdate) {
                return;
            }
            
            // Clear previous timer
            if (updateTimer) {
                clearTimeout(updateTimer);
            }
            
            // Set new timer with 2 second delay
            updateTimer = setTimeout(function() {
                log('Order review DOM changed, running price update (debounced)');
                
                // Set flag to prevent recursive updates
                isUpdating = true;
                
                // Run price update
                updateItemPrices();
                updateOrderTotal();
                
                // Reset flag after a delay to allow DOM to settle
                setTimeout(function() {
                    isUpdating = false;
                }, 1000);
            }, 2000);
        });
        
        // Start observing the order review table
        const $orderReview = $('.woocommerce-checkout-review-order-table');
        if ($orderReview.length) {
            observer.observe($orderReview[0], {
                childList: true,
                subtree: true,
                attributes: true, // Watch attributes too to catch more changes
                characterData: true
            });
        }
    }
    
    // Initialize all fixes
    function init() {
        // Handle empty cart scenarios
        handleEmptyCart();
        
        // Fix price inconsistencies
        fixPriceInconsistencies();
        
        log('All checkout fixes initialized');
    }
    
    // Initialize when ready
    init();
});
