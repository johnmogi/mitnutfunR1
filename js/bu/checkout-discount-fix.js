/**
 * Checkout Discount Fix
 * Makes sure the 50% discount for rental days is applied in checkout review
 */
jQuery(document).ready(function($) {
    'use strict';
    
    console.log('%c🛒 CHECKOUT DISCOUNT FIX LOADED', 'background: #F44336; color: white; padding: 4px; font-weight: bold;');
    
    /**
     * Initialize discount fix for checkout
     */
    function initCheckoutDiscountFix() {
        // Apply fix on page load
        applyCheckoutDiscountFix();
        
        // Watch for AJAX events that might refresh the checkout
        $(document.body).on('updated_checkout', function() {
            console.log('🛒 Checkout updated - reapplying discount fix');
            applyCheckoutDiscountFix();
        });
        
        // Also watch for fragment refreshes
        $(document.body).on('wc_fragments_loaded wc_fragments_refreshed', function() {
            console.log('🛒 Fragments updated - reapplying discount fix');
            setTimeout(applyCheckoutDiscountFix, 100); // Small delay to ensure DOM is updated
        });
    }
    
    /**
     * Apply the checkout discount fix
     */
    function applyCheckoutDiscountFix() {
        console.log('🛒 Applying checkout discount fix...');
        
        // Find all rental items in checkout
        $('.checkout-review .item, .woocommerce-checkout-review-order-table .cart_item').each(function() {
            const $item = $(this);
            
            // Check if this is a rental product with dates
            if ($item.find('.rental-dates').length) {
                // Extract rental dates
                const rentalDatesText = $item.find('.rental-dates').text();
                const datesMatch = rentalDatesText.match(/(\d+\.\d+\.\d+) - (\d+\.\d+\.\d+)/);
                
                if (datesMatch && datesMatch.length === 3) {
                    const startDate = parseDate(datesMatch[1]);
                    const endDate = parseDate(datesMatch[2]);
                    
                    if (startDate && endDate) {
                        // Calculate rental days
                        const rentalDays = calculateRentalDays(startDate, endDate);
                        
                        // Get base price
                        const $priceElement = $item.find('.cost .checkout-review, .product-total .amount');
                        if ($priceElement.length) {
                            const priceText = $priceElement.text();
                            const basePrice = extractPrice(priceText);
                            
                            if (basePrice > 0) {
                                // Product ID check (don't discount products 150, 153)
                                // Note: We'll need to enhance this to read the actual product ID
                                const isExcludedProduct = false; // For now assume not excluded
                                
                                // Calculate correct discounted price
                                const correctPrice = calculateCorrectPrice(basePrice, rentalDays, isExcludedProduct);
                                
                                console.log('🛒 Price calculation:', {
                                    item: $item.find('.name').text(),
                                    dates: rentalDatesText,
                                    rentalDays,
                                    basePrice,
                                    correctPrice
                                });
                                
                                // Update price display
                                updatePriceDisplay($priceElement, correctPrice);
                                
                                // Add price breakdown if not present
                                addPriceBreakdown($item, basePrice, rentalDays, correctPrice, isExcludedProduct);
                            }
                        }
                    }
                }
            }
        });
        
        // Also update order total
        updateOrderTotal();
    }
    
    /**
     * Parse date from DD.MM.YYYY format
     */
    function parseDate(dateString) {
        const parts = dateString.trim().split('.');
        if (parts.length === 3) {
            // Parse as DD.MM.YYYY
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
            const year = parseInt(parts[2], 10);
            return new Date(year, month, day);
        }
        return null;
    }
    
    /**
     * Calculate rental days using business rule
     */
    function calculateRentalDays(startDate, endDate) {
        if (!startDate || !endDate) return 0;
        
        // Calculate raw days
        const oneDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.round(Math.abs((endDate - startDate) / oneDay)) + 1; // Include end date
        
        // Check if Friday-Sunday special case
        const startDay = startDate.getDay();
        const endDay = endDate.getDay();
        const isFridayToSunday = (startDay === 5 && endDay === 0 && diffDays <= 3);
        
        if (isFridayToSunday) {
            return 1;
        }
        
        // Apply rental day calculation rule: 2=1, 3=2, 4=3, etc.
        if (diffDays >= 2) {
            return diffDays - 1;
        }
        
        return diffDays;
    }
    
    /**
     * Extract numeric price from price string
     */
    function extractPrice(priceString) {
        const match = priceString.match(/(\d+[,.]?\d*)/);
        if (match) {
            // Convert to number, handling both dot and comma as decimal separator
            return parseFloat(match[1].replace(',', '.'));
        }
        return 0;
    }
    
    /**
     * Calculate correct price with discount
     */
    function calculateCorrectPrice(basePrice, rentalDays, isExcludedProduct) {
        if (rentalDays <= 1 || isExcludedProduct) {
            // No discount for 1 day or excluded products
            return basePrice;
        }
        
        // 1st day at full price
        const firstDayPrice = basePrice;
        
        // Additional days at 50% discount
        const additionalDays = rentalDays - 1;
        const additionalDaysPrice = (basePrice * additionalDays * 0.5);
        
        return firstDayPrice + additionalDaysPrice;
    }
    
    /**
     * Update price display element
     */
    function updatePriceDisplay($element, newPrice) {
        const formattedPrice = newPrice.toFixed(2);
        const currencySymbol = '₪';
        
        // Update price display, preserving HTML structure
        const currentHtml = $element.html();
        const newHtml = currentHtml.replace(/(\d+[,.]?\d*)/, formattedPrice);
        $element.html(newHtml);
    }
    
    /**
     * Add price breakdown under the item if not already present
     */
    function addPriceBreakdown($item, basePrice, rentalDays, totalPrice, isExcludedProduct) {
        // Check if breakdown already exists
        if ($item.find('.rental-price-breakdown').length) {
            return;
        }
        
        let breakdownHtml = '<div class="rental-price-breakdown" style="font-size: 0.9em; margin-top: 5px; color: #666;">';
        
        if (rentalDays > 1 && !isExcludedProduct) {
            // Show breakdown with discount
            const additionalDays = rentalDays - 1;
            const additionalDaysPrice = totalPrice - basePrice;
            
            breakdownHtml += `יום 1: ₪${basePrice.toFixed(2)}<br>`;
            breakdownHtml += `${additionalDays} ימים נוספים (50% הנחה): ₪${additionalDaysPrice.toFixed(2)}`;
        } else {
            // Single day or excluded product
            breakdownHtml += `${rentalDays} ימי השכרה: ₪${totalPrice.toFixed(2)}`;
        }
        
        breakdownHtml += '</div>';
        
        // Add breakdown after price
        $item.find('.cost, .product-total').append(breakdownHtml);
    }
    
    /**
     * Update order total by recalculating from individual items
     */
    function updateOrderTotal() {
        // Only in checkout review, not mini-cart
        if ($('.order-review-table').length || $('.woocommerce-checkout-review-order-table').length) {
            let newTotal = 0;
            
            // Sum up all product prices
            $('.checkout-review .item, .woocommerce-checkout-review-order-table .cart_item').each(function() {
                const $priceElement = $(this).find('.cost .checkout-review, .product-total .amount');
                if ($priceElement.length) {
                    const price = extractPrice($priceElement.text());
                    newTotal += price;
                }
            });
            
            // Add any fees/shipping if present
            $('.fee .amount, .shipping .amount').each(function() {
                const fee = extractPrice($(this).text());
                newTotal += fee;
            });
            
            // Update order total
            const $orderTotal = $('.order-total .amount');
            if ($orderTotal.length) {
                updatePriceDisplay($orderTotal, newTotal);
                console.log('🛒 Updated order total to:', newTotal.toFixed(2));
            }
        }
    }
    
    // Initialize on page load
    initCheckoutDiscountFix();
});
