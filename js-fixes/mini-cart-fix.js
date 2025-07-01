/**
 * Mini-Cart Price Fix
 * 
 * This script ensures mini-cart prices exactly match product page price calculations.
 * It completely removes existing price manipulations and applies the same logic
 * from price-breakdown-fix.js to ensure consistency.
 *
 * Created in new js-fixes folder per user request.
 */

jQuery(document).ready(function($) {
    'use strict';
    
    // Debug logging function
    function log(message, ...args) {
        console.log('[MiniCart Fix]', message, ...args);
    }
    
    log('Mini-cart price fix loaded');
    
    /**
     * Fix mini-cart prices to match product page calculations
     */
    function fixMiniCartPrices() {
        log('Fixing mini-cart prices');
        
        // Process each cart item
        $('.mini_cart_item').each(function() {
            try {
                const $item = $(this);
                
                // Extract rental days from item data or text
                const rentalDaysMatch = $item.text().match(/(\d+)\s*ימים/i) ||
                                       $item.find('.rental-days').text().match(/(\d+)\s*ימים/i);
                
                if (!rentalDaysMatch) {
                    log('No rental days found for item', $item);
                    return; // Skip this item
                }
                
                const rentalDays = parseInt(rentalDaysMatch[1], 10);
                log('Found rental days:', rentalDays);
                
                // Get base price (per day)
                const $priceElement = $item.find('.woocommerce-Price-amount');
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
                
                const basePrice = parseFloat(priceMatch[0]);
                log('Base price found:', basePrice);
                
                // Calculate total before discount
                const totalBeforeDiscount = basePrice * rentalDays;
                log('Total before discount:', totalBeforeDiscount);
                
                // Apply discounts based on rental days
                // Rule: Day 1 = full price, Day 2+ = 50% discount
                // Exception: Products 150, 153 have no discount
                
                let finalPrice = 0;
                let discountAmount = 0;
                let discountText = '';
                
                // Get product ID if available
                const productIdMatch = $item.html().match(/product_id=(\d+)/i);
                const productId = productIdMatch ? parseInt(productIdMatch[1], 10) : 0;
                
                // Check if this product has the discount exception
                const isDiscountExempt = [150, 153].includes(productId);
                
                if (rentalDays <= 1 || isDiscountExempt) {
                    // No discount for 1 day or exempt products
                    finalPrice = totalBeforeDiscount;
                    log('No discount applied. Final price:', finalPrice);
                } else {
                    // Apply discount: 1st day at full price, remaining days at 50%
                    const firstDayPrice = basePrice;
                    const remainingDays = rentalDays - 1;
                    const remainingDaysPrice = remainingDays * basePrice * 0.5;
                    
                    finalPrice = firstDayPrice + remainingDaysPrice;
                    discountAmount = totalBeforeDiscount - finalPrice;
                    
                    log('Discount applied. First day:', firstDayPrice, 
                        'Remaining days:', remainingDaysPrice, 
                        'Final price:', finalPrice, 
                        'Discount amount:', discountAmount);
                    
                    // Create discount text
                    discountText = ` <span class="mini-cart-discount">(כולל הנחת 50% מהיום השני)</span>`;
                }
                
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
                
                // Add breakdown tooltip if needed
                if (discountAmount > 0) {
                    const tooltipHTML = `
                        <div class="price-breakdown-tooltip">
                            <span>${rentalDays} ימים x ₪${formatPrice(basePrice)}: ₪${formatPrice(totalBeforeDiscount)}</span>
                            <span class="discount">הנחת 50% מהיום השני: -₪${formatPrice(discountAmount)}</span>
                            <span class="total">סה"כ לתשלום: ₪${formatPrice(finalPrice)}</span>
                        </div>
                    `;
                    
                    // Add tooltip container if needed
                    if (!$item.find('.price-breakdown-tooltip').length) {
                        $item.append(tooltipHTML);
                    }
                }
                
                log('Price updated for item');
            } catch (error) {
                console.error('[MiniCart Fix] Error processing item:', error);
            }
        });
    }
    
    // Run the fix whenever the mini-cart is updated
    $(document.body).on('wc_fragments_loaded wc_fragments_refreshed added_to_cart', function() {
        setTimeout(fixMiniCartPrices, 100);
    });
    
    // Run immediately on page load
    setTimeout(fixMiniCartPrices, 500);
    
    // Add some basic styles for the price breakdown tooltip
    $('<style>').text(`
        .price-breakdown-tooltip {
            display: none;
            position: absolute;
            background: #f8f8f8;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            z-index: 100;
            width: 220px;
            right: 0;
            top: 100%;
            direction: rtl;
            text-align: right;
        }
        
        .mini_cart_item:hover .price-breakdown-tooltip {
            display: block;
        }
        
        .price-breakdown-tooltip span {
            display: block;
            margin-bottom: 5px;
        }
        
        .price-breakdown-tooltip .discount {
            color: #4CAF50;
        }
        
        .price-breakdown-tooltip .total {
            font-weight: bold;
            margin-top: 5px;
        }
        
        .mini-cart-discount {
            display: block;
            font-size: 0.8em;
            color: #4CAF50;
        }
    `).appendTo('head');
});
