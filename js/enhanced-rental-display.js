/**
 * Enhanced Rental Display
 * 
 * This script enhances the display of rental information throughout the site:
 * - Fixes missing rental dates in mini-cart
 * - Adds rental days calculation where missing
 * - Enhances display in order details
 */
jQuery(document).ready(function($) {
    'use strict';
    
    // Debug function
    function debugLog() {
        if (window.rentalDebug) {
            // console.log.apply(console, arguments);
        }
    }
    
    debugLog('Enhanced Rental Display script loaded');
    
    /**
     * Enhance rental display in order details
     */
    function enhanceOrderDetails() {
        $('.woocommerce-order-details .order_item').each(function() {
            const $item = $(this);
            const $metaList = $item.find('.wc-item-meta');
            
            if (!$metaList.length) return;
            
            // Find rental dates in meta
            let rentalDates = '';
            let rentalDays = 0;
            
            $metaList.find('li').each(function() {
                const $meta = $(this);
                const text = $meta.text().toLowerCase();
                
                if (text.includes('rental date') || text.includes('rental dates') || 
                    text.includes('תאריכי השכרה')) {
                    rentalDates = $meta.find('p').text().trim();
                    
                    // Create a better display
                    const $betterDisplay = $('<div class="rental-dates-display">');
                    $betterDisplay.html('<strong>תאריכי השכרה:</strong> ' + rentalDates);
                    
                    // Replace or add after
                    $meta.html($betterDisplay);
                }
                
                if (text.includes('rental days') || text.includes('ימי השכרה')) {
                    rentalDays = parseInt($meta.find('p').text().trim(), 10);
                    
                    // Better display for days
                    const $daysDisplay = $('<div class="rental-days-display">');
                    $daysDisplay.html('<strong>ימי השכרה:</strong> ' + rentalDays);
                    
                    // Replace or add after
                    $meta.html($daysDisplay);
                }
            });
            
            // Add a price breakdown if we have rental days
            if (rentalDays > 1) {
                // Get product ID
                const productId = $item.data('product-id');
                const hasDiscount = productId && productId != 150 && productId != 153;
                
                if (hasDiscount) {
                    // Create price breakdown
                    const $priceDisplay = $('<div class="rental-price-breakdown order-details">');
                    $priceDisplay.html('<h5>פירוט הנחת יום נוסף:</h5>' +
                                     '<div class="discount-info">יום ראשון: 100%, ימים נוספים: 50%</div>');
                    
                    // Add after meta
                    $metaList.after($priceDisplay);
                }
            }
        });
    }
    
    /**
     * Fix rental info display in cart/mini-cart
     */
    function fixRentalDisplay() {
        // Call existing function if available
        if (typeof window.fixRentalDateDisplay === 'function') {
            window.fixRentalDateDisplay();
        }
        
        // Add our enhanced version
        enhanceRentalDisplay();
    }
    
    /**
     * Enhanced version of rental display fix
     */
    function enhanceRentalDisplay() {
        debugLog('Enhancing rental displays');
        
        // Add nice styling for rental info
        const $style = $('<style>');
        $style.html(`
            .rental-dates-display, .rental-days-display {
                font-size: 0.9em;
                margin: 5px 0;
                direction: rtl;
            }
            .rental-dates-display strong, .rental-days-display strong {
                color: #666;
            }
            .rental-price-breakdown {
                margin: 10px 0;
                padding: 10px;
                background: #f9f9f9;
                border-radius: 5px;
                font-size: 0.9em;
                direction: rtl;
            }
            .rental-price-breakdown h5 {
                margin-top: 0;
                margin-bottom: 5px;
                color: #333;
            }
            .rental-price-breakdown.order-details {
                margin-top: 15px;
                border: 1px solid #eee;
            }
            .rental-item-savings .original-price {
                text-decoration: line-through;
                color: #999;
            }
            .discount-info {
                font-size: 0.9em;
                color: #666;
            }
        `);
        $('head').append($style);
        
        // Fix any missing displays in cart
        $('.cart_item').each(function() {
            const $item = $(this);
            const $dateContainer = $item.find('.product-name');
            
            if (!$dateContainer.find('.rental-dates-display').length) {
                // Look for meta with rental dates
                const $metas = $item.find('dl.variation');
                if ($metas.length) {
                    let dates = '';
                    let days = 0;
                    
                    $metas.find('dt, dd').each(function() {
                        const text = $(this).text().toLowerCase();
                        if (text.includes('rental date') || text.includes('תאריכי') || 
                            text.match(/rental.*dates/)) {
                            const sibling = $(this).next('dd');
                            if (sibling.length) {
                                dates = sibling.text().trim();
                            }
                        }
                        if (text.includes('rental days') || text.includes('ימי השכרה')) {
                            const sibling = $(this).next('dd');
                            if (sibling.length) {
                                days = parseInt(sibling.text().trim(), 10);
                            }
                        }
                    });
                    
                    // If we found dates, display them nicely
                    if (dates) {
                        const $datesDisplay = $('<div class="rental-dates-display">');
                        $datesDisplay.html('<strong>תאריכי השכרה:</strong> ' + dates);
                        $dateContainer.append($datesDisplay);
                        
                        if (days > 0) {
                            const $daysDisplay = $('<div class="rental-days-display">');
                            $daysDisplay.html('<strong>ימי השכרה:</strong> ' + days);
                            $dateContainer.append($daysDisplay);
                        }
                    }
                }
            }
        });
    }
    
    // Initialize everything
    setTimeout(function() {
        fixRentalDisplay();
        enhanceOrderDetails();
    }, 500);
});
