/**
 * Checkout Page Price Fix - Simplified Robust Version
 * 
 * This script ensures checkout page prices exactly match product page price calculations.
 * It completely removes existing price manipulations and applies the same logic
 * from price-breakdown-fix.js to ensure consistency.
 * 
 * This version includes improved error handling and defensive coding to prevent
 * breaking the checkout page if any step fails.
 *
 * Created in new js-fixes folder per user request.
 */

jQuery(document).ready(function($) {
    'use strict';
    
    // Debug logging function
    function log(message, ...args) {
        console.log('[Checkout Fix]', message, ...args);
    }
    
    // Error handling function
    function safeExecute(fn, fallback, context) {
        try {
            return fn.call(context);
        } catch (error) {
            console.error('[Checkout Fix] Error:', error);
            return fallback;
        }
    }
    
    log('Checkout price fix loaded');
    
    /**
     * Fix checkout prices to match product page calculations
     * Enhanced with defensive programming and error handling
     */
    function fixCheckoutPrices() {
        log('Fixing checkout prices');
        
        // Verify we're on checkout page first
        if (!$('body').hasClass('woocommerce-checkout')) {
            log('Not on checkout page, skipping price fix');
            return;
        }
        
        // Check if cart items exist before processing
        if ($('.cart_item').length === 0) {
            log('No cart items found, nothing to process');
            return;
        }
        
        // Process each cart item on checkout page
        $('.cart_item').each(function() {
            try {
                const $item = $(this);
                
                // Skip if this item has already been processed
                if ($item.hasClass('checkout-price-fixed')) {
                    log('Item already processed, skipping');
                    return;
                }
                
                // Extract rental days from item data or text
                const rentalDaysMatch = $item.text().match(/(\d+)\s*ימים/i) ||
                                       $item.find('.product-rental-days').text().match(/(\d+)\s*ימים/i);
                
                if (!rentalDaysMatch) {
                    log('No rental days found for item', $item);
                    return; // Skip this item
                }
                
                const rentalDays = parseInt(rentalDaysMatch[1], 10);
                log('Found rental days:', rentalDays);
                
                // Get product subtotal element
                const $priceElement = $item.find('.product-total .woocommerce-Price-amount');
                if (!$priceElement.length) {
                    log('No price element found for item', $item);
                    return; // Skip this item
                }
                
                // Store original price display before we modify it
                const originalPriceHTML = $priceElement.html();
                
                // Extract numeric price from text
                const priceText = $priceElement.text().trim();
                const priceMatch = priceText.match(/(\d+(?:\.\d+)?)/g);
                
                if (!priceMatch || priceMatch.length === 0) {
                    log('Could not extract price from text:', priceText);
                    return; // Skip this item
                }
                
                // Calculate base price (per day) by dividing by rental days
                // However, we need to account for any existing discounts
                const currentTotalPrice = parseFloat(priceMatch[0]);
                
                // Get quantity
                const quantity = parseInt($item.find('.product-quantity').text().trim(), 10) || 1;
                log('Item quantity:', quantity);
                
                // Get product ID if available
                const productLink = $item.find('.product-name a').attr('href') || '';
                const productIdMatch = productLink.match(/product\/(\d+)/) || $item.html().match(/product_id=(\d+)/i);
                const productId = productIdMatch ? parseInt(productIdMatch[1], 10) : 0;
                log('Product ID:', productId);
                
                // Check if this product has the discount exception
                const isDiscountExempt = [150, 153].includes(productId);
                
                // Calculate what the price should be based on our rental days logic
                let calculatedPrice = 0;
                
                // Get the base price per day 
                // We need to reverse-engineer this from the current total if possible
                let basePricePerDay;
                
                if (rentalDays <= 1 || isDiscountExempt) {
                    // No discount case - base price is just the total divided by days
                    basePricePerDay = currentTotalPrice / rentalDays;
                } else {
                    // With discount case - we need to solve for base price
                    // Formula: price = basePrice * 1 + basePrice * 0.5 * (days-1)
                    // Solving for basePrice: basePrice = price / (1 + 0.5 * (days-1))
                    basePricePerDay = currentTotalPrice / (1 + 0.5 * (rentalDays - 1));
                }
                
                log('Calculated base price per day:', basePricePerDay);
                
                // Now recalculate the proper price
                const totalBeforeDiscount = basePricePerDay * rentalDays;
                
                let finalPrice;
                let discountAmount = 0;
                let discountText = '';
                
                if (rentalDays <= 1 || isDiscountExempt) {
                    // No discount for 1 day or exempt products
                    finalPrice = totalBeforeDiscount;
                    log('No discount applied. Final price:', finalPrice);
                } else {
                    // Apply discount: 1st day at full price, remaining days at 50%
                    const firstDayPrice = basePricePerDay;
                    const remainingDays = rentalDays - 1;
                    const remainingDaysPrice = remainingDays * basePricePerDay * 0.5;
                    
                    finalPrice = firstDayPrice + remainingDaysPrice;
                    discountAmount = totalBeforeDiscount - finalPrice;
                    
                    log('Discount applied. First day:', firstDayPrice, 
                        'Remaining days:', remainingDaysPrice, 
                        'Final price:', finalPrice, 
                        'Discount amount:', discountAmount);
                    
                    // Create discount text
                    discountText = ` <span class="checkout-discount">(כולל הנחת 50% מהיום השני)</span>`;
                }
                
                // Apply quantity
                finalPrice = finalPrice * quantity;
                
                // Format the price for display
                const formatPrice = (price) => {
                    return price.toLocaleString('he-IL', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                };
                
                // Create new price HTML
                const newPriceHTML = originalPriceHTML.replace(
                    /[\d,.]+/, 
                    formatPrice(finalPrice)
                ) + discountText;
                
                // Update the price element
                $priceElement.html(newPriceHTML);
                
                log('Price updated for checkout item');
            } catch (error) {
                console.error('[Checkout Fix] Error processing item:', error);
            }
        });
        
        // After updating individual prices, we also need to update order totals
        setTimeout(updateOrderTotals, 250);
    }
    
    /**
     * Update the order totals section based on our item calculations
     */
    function updateOrderTotals() {
        log('Updating order totals');
        
        try {
            // Calculate new subtotal from individual item prices
            let newSubtotal = 0;
            
            $('.cart_item').each(function() {
                const $item = $(this);
                const $priceElement = $item.find('.product-total .woocommerce-Price-amount');
                
                if ($priceElement.length) {
                    const priceText = $priceElement.text().trim();
                    const priceMatch = priceText.match(/(\d+(?:\.\d+)?)/g);
                    
                    if (priceMatch && priceMatch.length > 0) {
                        newSubtotal += parseFloat(priceMatch[0]);
                    }
                }
            });
            
            log('New calculated subtotal:', newSubtotal);
            
            // Format price for display
            const formatPrice = (price) => {
                return price.toLocaleString('he-IL', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            };
            
            // Update subtotal
            const $subtotalElement = $('.cart-subtotal .woocommerce-Price-amount');
            if ($subtotalElement.length) {
                const originalHTML = $subtotalElement.html();
                $subtotalElement.html(originalHTML.replace(/[\d,.]+/, formatPrice(newSubtotal)));
                log('Subtotal updated');
            }
            
            // Get shipping cost if any
            let shippingCost = 0;
            const $shippingElement = $('.shipping .woocommerce-Price-amount');
            if ($shippingElement.length) {
                const shippingText = $shippingElement.text().trim();
                const shippingMatch = shippingText.match(/(\d+(?:\.\d+)?)/g);
                
                if (shippingMatch && shippingMatch.length > 0) {
                    shippingCost = parseFloat(shippingMatch[0]);
                    log('Shipping cost:', shippingCost);
                }
            }
            
            // Calculate new order total
            const newOrderTotal = newSubtotal + shippingCost;
            log('New order total:', newOrderTotal);
            
            // Update order total
            const $totalElement = $('.order-total .woocommerce-Price-amount');
            if ($totalElement.length) {
                const originalHTML = $totalElement.html();
                $totalElement.html(originalHTML.replace(/[\d,.]+/, formatPrice(newOrderTotal)));
                log('Order total updated');
            }
        } catch (error) {
            console.error('[Checkout Fix] Error updating order totals:', error);
        }
    }
    
    // Run the fix on document ready and when fragments are updated
    $(document.body).on('updated_checkout', function() {
        setTimeout(fixCheckoutPrices, 100);
    });
    
    // Run immediately on page load with a delay to ensure all elements are present
    setTimeout(fixCheckoutPrices, 1000);
    
    // Add some basic styles
    $('<style>').text(`
        .checkout-discount {
            display: block;
            font-size: 0.8em;
            color: #4CAF50;
            margin-top: 5px;
        }
    `).appendTo('head');
});
