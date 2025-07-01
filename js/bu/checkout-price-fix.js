/**
 * Checkout Price Fix
 * Forces proper rental price calculation and display in checkout
 */
jQuery(document).ready(function($) {
    'use strict';
    
    console.log('CHECKOUT PRICE FIX LOADED');
    
    // Configuration
    const EXCLUDED_PRODUCT_IDS = [150, 153]; // Products excluded from the discount
    
    // Function to extract dates and calculate rental days
    function calculateRentalDays(dateString) {
        if (!dateString) return 0;
        
        // Extract dates from string like "1.7.2025 - 3.7.2025"
        const dateMatch = dateString.match(/(\d{1,2}\.\d{1,2}\.\d{4})\s*-\s*(\d{1,2}\.\d{1,2}\.\d{4})/);
        if (!dateMatch || dateMatch.length !== 3) return 0;
        
        // Parse dates
        const startParts = dateMatch[1].split('.');
        const endParts = dateMatch[2].split('.');
        
        if (startParts.length !== 3 || endParts.length !== 3) return 0;
        
        const startDate = new Date(startParts[2], startParts[1] - 1, startParts[0]);
        const endDate = new Date(endParts[2], endParts[1] - 1, endParts[0]);
        
        // Calculate total days in range
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
        
        // Apply the special Friday-Sunday = 1 day rule
        let rentalDays = diffDays;
        
        // Check if range spans Friday to Sunday
        const startDay = startDate.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
        const endDay = endDate.getDay();
        
        if (startDay === 5 && (endDay === 0) && diffDays <= 3) {
            console.log('Friday to Sunday special case');
            rentalDays = 1;
        } else {
            // Apply the regular rental days calculation (2=1, 3=2, 4=3, etc.)
            if (diffDays === 2) rentalDays = 1;
            else if (diffDays > 2) rentalDays = diffDays - 1;
        }
        
        console.log('Date range:', dateString, 'Calendar days:', diffDays, 'Rental days:', rentalDays);
        return rentalDays;
    }
    
    // Function to apply discount to a price based on rental days
    function applyRentalDiscount(basePrice, rentalDays, isExcluded) {
        if (rentalDays <= 1 || isExcluded) {
            // No discount for 1 day or excluded products
            return basePrice * rentalDays;
        }
        
        // First day at full price, additional days at 50% off
        const firstDayPrice = basePrice;
        const additionalDaysPrice = basePrice * 0.5 * (rentalDays - 1);
        
        const totalPrice = firstDayPrice + additionalDaysPrice;
        console.log('Base price:', basePrice, 'First day:', firstDayPrice, 'Additional days:', additionalDaysPrice, 'Total:', totalPrice);
        
        return totalPrice;
    }
    
    // Function to update the rental price breakdown
    function updatePriceBreakdown() {
        // Only run on checkout page
        if (!$('.woocommerce-checkout').length) return;
        
        console.log('Updating price breakdown in checkout...');
        
        // Find all items in the order
        $('.item').each(function() {
            const $item = $(this);
            const $info = $item.find('.info');
            const $cost = $item.find('.cost');
            
            // Extract product name and dates
            const productName = $info.find('.name').text().trim();
            const $rentalDates = $info.find('.rental-dates');
            
            if (!$rentalDates.length) {
                console.log('No rental dates found for', productName);
                return; // Skip if no rental dates
            }
            
            // Extract dates and calculate rental days
            const datesText = $rentalDates.text();
            const rentalDatesValue = datesText.replace('תאריכי השכרה:', '').trim();
            const rentalDays = calculateRentalDays(rentalDatesValue);
            
            if (rentalDays <= 0) {
                console.log('Invalid rental days for', productName);
                return; // Skip if invalid days
            }
            
            // Get product ID from data attribute or try to find it
            let productId = $item.data('product-id');
            if (!productId) {
                // Try to extract from classes or other attributes if available
                const classes = $item.attr('class');
                if (classes) {
                    const idMatch = classes.match(/product-(\d+)/);
                    if (idMatch && idMatch.length > 1) {
                        productId = parseInt(idMatch[1], 10);
                    }
                }
            }
            
            // Determine if excluded from discount
            const isExcluded = productId && EXCLUDED_PRODUCT_IDS.includes(productId);
            
            // Get the base price (single day price)
            let basePrice = 0;
            const $priceElement = $cost.find('.woocommerce-Price-amount');
            if ($priceElement.length) {
                const priceText = $priceElement.text().trim();
                basePrice = parseFloat(priceText.replace(/[^\d.]/g, ''));
                
                // Check if there's a quantity indicator and divide by it to get base price
                const $costText = $cost.text().trim();
                const qtyMatch = $costText.match(/x\s*(\d+)\s*$/);
                if (qtyMatch && qtyMatch.length > 1) {
                    const qty = parseInt(qtyMatch[1], 10);
                    if (qty > 0) {
                        basePrice = basePrice / qty;
                    }
                }
            }
            
            if (basePrice <= 0) {
                console.log('Invalid price for', productName);
                return; // Skip if invalid price
            }
            
            // Calculate the total price with discount
            const totalPrice = applyRentalDiscount(basePrice, rentalDays, isExcluded);
            
            // Create or update the breakdown
            let $breakdown = $item.next('.rental-item-breakdown');
            if (!$breakdown.length) {
                $breakdown = $('<div class="rental-item-breakdown">');
                $item.after($breakdown);
            }
            
            // Build the breakdown HTML
            let breakdownHtml = '<div class="rental-item-name">' + productName + '</div>';
            breakdownHtml += '<div class="rental-item-days">ימי השכרה: ' + rentalDays + '</div>';
            
            if (!isExcluded && rentalDays > 1) {
                const discount = ((basePrice * rentalDays) - totalPrice).toFixed(2);
                breakdownHtml += '<div class="rental-item-discount">מחיר ליום ראשון: ' + basePrice.toFixed(2) + '₪</div>';
                breakdownHtml += '<div class="rental-item-discount">מחיר לימים נוספים: ' + (basePrice * 0.5).toFixed(2) + '₪ (הנחה 50%)</div>';
                breakdownHtml += '<div class="rental-item-savings">חסכון: ' + discount + '₪</div>';
            }
            
            $breakdown.html(breakdownHtml);
            
            // Update the displayed price if needed
            if (Math.abs(totalPrice - basePrice) > 0.01) {
                const formattedPrice = totalPrice.toFixed(2) + '&nbsp;₪';
                $cost.find('.woocommerce-Price-amount').html(formattedPrice);
            }
        });
    }
    
    // Initial update
    setTimeout(updatePriceBreakdown, 1000);
    
    // Update when DOM changes (for dynamic checkout updates)
    const observer = new MutationObserver(function(mutations) {
        setTimeout(updatePriceBreakdown, 500);
    });
    
    // Start observing checkout container
    const $checkout = $('.woocommerce-checkout-review-order');
    if ($checkout.length) {
        observer.observe($checkout[0], { 
            childList: true, 
            subtree: true,
            attributes: true,
            characterData: true
        });
    }
    
    // Also update on document events
    $(document).on('updated_checkout', function() {
        setTimeout(updatePriceBreakdown, 500);
    });
});
