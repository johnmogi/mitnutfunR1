/**
 * Checkout Detailed Price Breakdown Fix
 * 
 * This script enhances the checkout page with detailed price breakdown
 * matching the MIT266 example display format. It shows:
 * - Rental dates with start and end dates
 * - Number of rental days
 * - Price breakdown with day 1 at full price and additional days at 50% discount
 * - Original price and savings information
 * 
 * Created in js-fixes folder per user request.
 */

jQuery(document).ready(function($) {
    'use strict';
    
    // Debug logging function
    function log(message, ...args) {
        console.log('[Checkout Detailed Price Fix]', message, ...args);
    }
    
    // Error handling function
    function safeExecute(fn, fallback, context) {
        try {
            return fn.call(context);
        } catch (error) {
            console.error('[Checkout Detailed Price Fix] Error:', error);
            return fallback;
        }
    }
    
    log('Checkout detailed price fix loaded');
    
    /**
     * Format price for display
     */
    function formatPrice(price) {
        return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "\u00A0₪";
    }
    
    /**
     * Format date as DD.MM.YYYY
     */
    function formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
        } catch (e) {
            log('Error formatting date:', e);
            return dateStr;
        }
    }
    
    /**
     * Add detailed price breakdown to checkout items
     */
    function addDetailedPriceBreakdown() {
        log('Adding detailed price breakdown to checkout items');
        
        // Debug all available elements
        log('Body classes:', $('body').attr('class'));
        log('Available cart-like elements:', {
            'cart_item': $('.cart_item').length,
            'order_item': $('.order_item').length,
            'woocommerce-checkout-review-order-table items': $('.woocommerce-checkout-review-order-table .item').length,
            'checkout-review': $('.checkout-review').length,
            'review-order-item': $('.review-order-item').length,
            'all table rows': $('table tr').length
        });
        
        // Verify we're on checkout page first
        if (!$('body').hasClass('woocommerce-checkout') && !window.location.pathname.includes('checkout')) {
            log('Not on checkout page, skipping');
            return;
        }
        
        // Use multiple selectors to find items in the checkout
        const $cartItems = $('.cart_item, .order_item, .woocommerce-checkout-review-order-table .item, .checkout-review .item');
        
        // Check if cart items exist before processing
        if ($cartItems.length === 0) {
            log('No cart items found with any selector, attempting to process checkout review items');
            // Process checkout review section directly
            processCheckoutReviewItems();
            return;
        }
        
        log('Found', $cartItems.length, 'cart items to process');

        
        // Process each cart item on checkout page
        $('.cart_item').each(function() {
            try {
                const $item = $(this);
                
                // Skip if this item has already been processed
                if ($item.hasClass('detailed-price-added')) {
                    log('Item already processed, skipping');
                    return;
                }
                
                // Extract rental dates from item text
                const $productName = $item.find('.product-name');
                let startDate = '';
                let endDate = '';
                
                const datesText = $item.text().match(/(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})\s*-\s*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/);
                
                if (datesText && datesText.length >= 3) {
                    startDate = datesText[1];
                    endDate = datesText[2];
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
                
                // Get product price element
                const $priceElement = $item.find('.product-total .woocommerce-Price-amount');
                if (!$priceElement.length) {
                    log('No price element found for item', $item);
                    return; // Skip this item
                }
                
                // Extract numeric price from text
                const priceText = $priceElement.text().trim();
                const priceMatch = priceText.match(/(\d+(?:[\.,]\d+)?)/g);
                
                if (!priceMatch || priceMatch.length === 0) {
                    log('Could not extract price from text:', priceText);
                    return; // Skip this item
                }
                
                // Get current total price
                const totalPrice = parseFloat(priceMatch[0].replace(',', ''));
                
                // Get quantity
                const quantity = parseInt($item.find('.product-quantity').text().trim(), 10) || 1;
                
                // Calculate per-day price
                const perDayPrice = totalPrice / quantity;
                
                // Calculate base day price and discounted days
                const baseDayPrice = perDayPrice / (1 + (rentalDays - 1) * 0.5);
                const discountedDaysPrice = baseDayPrice * 0.5 * (rentalDays - 1);
                
                // Calculate savings
                const originalPrice = baseDayPrice * rentalDays;
                const savings = originalPrice - (baseDayPrice + discountedDaysPrice);
                
                // Create detailed price breakdown HTML
                const breakdownHTML = `
                <div class="checkout-review rental-price">
                    ${$priceElement.prop('outerHTML')} 
                    <div class="rental-savings">
                        מחיר מקורי: <span class="original-price"><span class="woocommerce-Price-amount amount"><bdi>${formatPrice(originalPrice)}</bdi></span></span><br>
                        חסכת: <span class="woocommerce-Price-amount amount"><bdi>${formatPrice(savings)}</bdi></span>
                    </div>
                </div>
                `;
                
                // Create rental dates display
                const rentalDatesHTML = `
                <p class="rental-dates"><strong>תאריכי השכרה:</strong> ${startDate} - ${endDate}</p>
                <p class="rental-days"><strong>ימי השכרה:</strong> ${rentalDays}</p>
                `;
                
                // Apply the HTML changes
                const $productInfo = $item.find('.product-name');
                if (!$productInfo.find('.rental-dates').length) {
                    $productInfo.append(rentalDatesHTML);
                }
                
                // Replace the price with our detailed breakdown
                const $productTotal = $item.find('.product-total');
                $productTotal.html(breakdownHTML);
                
                // Mark as processed
                $item.addClass('detailed-price-added');
                
            } catch (error) {
                console.error('[Checkout Detailed Price Fix] Error processing item:', error);
            }
        });
        
        // Add more detailed breakdown to order review section
        enhanceOrderReviewTotal();
    }
    
    /**
     * Process checkout review items directly - this is for the custom MIT checkout structure
     */
    function processCheckoutReviewItems() {
        log('Processing checkout review items directly');
        
        // Find the checkout review items using the MIT structure
        const $reviewItems = $('.checkout-review .item, .woocommerce-checkout-review-order-table .item');
        
        log('Found', $reviewItems.length, 'review items');
        
        if ($reviewItems.length === 0) {
            log('No review items found in MIT format');
            return false;
        }
        
        // Process each item in the MIT review format
        $reviewItems.each(function() {
            try {
                const $item = $(this);
                
                // Skip if this item has already been processed
                if ($item.hasClass('detailed-price-added')) {
                    log('Review item already processed, skipping');
                    return;
                }
                
                log('Processing review item:', $item.text().substring(0, 50));
                
                // Find item components
                const $info = $item.find('.info');
                const $cost = $item.find('.cost');
                
                if (!$info.length || !$cost.length) {
                    log('Review item structure is incomplete');
                    return;
                }
                
                // Take a snapshot of HTML before modifications for debugging
                log('Original item HTML structure:', $item.html());
                
                // Extract rental dates from item text
                let startDate = '';
                let endDate = '';
                
                const rentalDatesElement = $item.find('.rental-dates');
                if (rentalDatesElement.length > 0) {
                    const datesText = rentalDatesElement.text().match(/(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})\s*-\s*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/);
                    
                    if (datesText && datesText.length >= 3) {
                        startDate = datesText[1];
                        endDate = datesText[2];
                        log('Found dates:', startDate, '-', endDate);
                    }
                }
                
                // Extract rental days
                let rentalDays = 0;
                const rentalDaysElement = $item.find('.rental-days');
                if (rentalDaysElement.length > 0) {
                    const daysText = rentalDaysElement.text().match(/(\d+)/);
                    if (daysText && daysText.length > 0) {
                        rentalDays = parseInt(daysText[1], 10);
                        log('Found rental days:', rentalDays);
                    }
                }
                
                // If we couldn't find rental days, skip this item
                if (rentalDays === 0) {
                    log('Could not determine rental days');
                    return;
                }
                
                // Get product price element
                const $priceElement = $cost.find('.woocommerce-Price-amount');
                if (!$priceElement.length) {
                    log('No price element found for review item');
                    return;
                }
                
                // Extract numeric price from text
                const priceText = $priceElement.text().trim();
                const priceMatch = priceText.match(/(\d+(?:[\.,]\d+)?)/g);
                
                if (!priceMatch || priceMatch.length === 0) {
                    log('Could not extract price from text:', priceText);
                    return;
                }
                
                // Get current total price
                const totalPrice = parseFloat(priceMatch[0].replace(',', ''));
                log('Total price:', totalPrice);
                
                // Extract quantity if available
                let quantity = 1;
                const productText = $info.text();
                const quantityMatch = productText.match(/x\s*(\d+)/);
                if (quantityMatch && quantityMatch.length > 1) {
                    quantity = parseInt(quantityMatch[1], 10);
                    log('Found quantity:', quantity);
                }
                
                // Calculate per-unit price (divide by quantity)
                const perUnitTotalPrice = totalPrice / quantity;
                log('Per-unit total price:', perUnitTotalPrice);
                
                // Calculate base day price and discounted days
                const perUnitBaseDayPrice = perUnitTotalPrice / (1 + (rentalDays - 1) * 0.5);
                const perUnitDiscountedDaysPrice = perUnitBaseDayPrice * 0.5 * (rentalDays - 1);
                
                // Final prices (per unit)
                const baseDayPrice = perUnitBaseDayPrice;
                const discountedDaysPrice = perUnitDiscountedDaysPrice;
                
                // Calculate savings
                const originalPrice = baseDayPrice * rentalDays;
                const savings = originalPrice - (baseDayPrice + discountedDaysPrice);
                
                log('Price details:', {
                    totalPrice, 
                    baseDayPrice, 
                    discountedDaysPrice,
                    originalPrice,
                    savings
                });
                
                // Create detailed price breakdown HTML
                const breakdownHTML = `
                <div class="checkout-review rental-price">
                    ${$priceElement.prop('outerHTML')} 
                    <div class="rental-savings">
                        מחיר מקורי: <span class="original-price"><span class="woocommerce-Price-amount amount"><bdi>${formatPrice(originalPrice)}</bdi></span></span><br>
                        חסכת: <span class="woocommerce-Price-amount amount"><bdi>${formatPrice(savings)}</bdi></span>
                    </div>
                </div>
                `;
                
                // Create full MIT266-style rental dates display with price breakdown
                const rentalDatesDisplayHTML = `
                <div id="rental-dates-display" class="rental-dates-display" style="margin: 15px 0px; padding: 15px; background-color: rgb(248, 249, 250); border: 1px solid rgb(226, 232, 240); border-radius: 4px;">
                    <h4 style="margin-top: 0; color: #2d3748; font-size: 16px; font-weight: bold;">תאריכי ההשכרה שנבחרו:</h4>
                    <div class="dates-content" style="margin-top: 8px;">
                        <span id="selected-start-date" style="font-weight: bold;">${startDate}</span> - <span id="selected-end-date" style="font-weight: bold;">${endDate}</span>
                    </div>
                    <div class="rental-days" style="margin-top: 8px;">
                        <span>מספר ימי השכרה: </span><span id="rental-days-count" style="font-weight: bold;">${rentalDays}</span>
                    </div>
                    <div class="price-breakdown" style="margin-top: 12px; border-top: 1px dashed #ccc; padding-top: 10px;">
                        <div style="margin-bottom: 5px;"><strong>מחיר:</strong></div>
                        <div style="margin-left: 15px;">יום 1: ‏${formatPrice(baseDayPrice)}</div>
                        <div style="margin-left: 15px;">${rentalDays-1} ימים נוספים (50% הנחה): ‏${formatPrice(discountedDaysPrice)}</div>
                        <div style="margin-top: 8px; font-weight: bold;">סה"כ: ‏${formatPrice(totalPrice)}</div>
                    </div>
                </div>
                `;
                
                // Apply the breakdown HTML to the cost element
                $cost.html(breakdownHTML);
                
                // Add the full rental dates display to the info element
                $info.append(rentalDatesDisplayHTML);
                
                // Mark as processed
                $item.addClass('detailed-price-added');
                log('Review item processed successfully with full MIT266-style display');
                
            } catch (error) {
                console.error('[Checkout Detailed Price Fix] Error processing review item:', error);
            }
        });
        
        // After processing items, enhance the order total
        enhanceOrderReviewTotal();
        
        return true;
    }
    
    /**
     * Enhance the order review total section with more details
     */
    function enhanceOrderReviewTotal() {
        log('Enhancing order review total');
        
        // Find different possible order total elements
        const $possibleTotals = $('.order-total, .checkout-review-total, li:contains("סך הכל"), .woocommerce-checkout-review-order-table li:last-child');
        
        log('Found', $possibleTotals.length, 'possible total elements');
        
        if ($possibleTotals.length === 0) return;
        
        // Process each possible total element
        $possibleTotals.each(function() {
            const $totalRow = $(this);
            
            // Mark as processed if already done
            if ($totalRow.hasClass('detailed-total-added')) return;
            
            // Get the total amount
            const $totalAmount = $totalRow.find('.woocommerce-Price-amount');
            if (!$totalAmount.length) return;
            
            log('Enhancing total row:', $totalRow.text().trim());
            
            // Mark as processed
            $totalRow.addClass('detailed-total-added');
        });
    }
    
    // Run the fix on document ready and when checkout is updated
    $(document.body).on('updated_checkout', function() {
        setTimeout(addDetailedPriceBreakdown, 300);
    });
    
    // Initial run
    setTimeout(addDetailedPriceBreakdown, 500);
});
