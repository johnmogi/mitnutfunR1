/**
 * Rental Display Fixer
 * This script forcefully inserts rental information on the page
 */
jQuery(document).ready(function($) {
    'use strict';
    
    // console.log('RENTAL FIXER LOADED');
    
    // Force rental debug on
    window.rentalDebug = true;
    
    // Create console dump of cart data
    function dumpCartData() {
        // console.log('==== CART DATA DUMP ====');
        if (typeof wc_cart_data !== 'undefined') {
            // console.log('WooCommerce cart data:', wc_cart_data);
        } else {
            // console.log('No wc_cart_data found');
        }
        
        // Dump cart fragments if available
        if (typeof wc_cart_fragments_params !== 'undefined') {
            // console.log('WooCommerce cart fragments:', wc_cart_fragments_params);
        }
        
        // Iterate over any cart items in the DOM
        // console.log('DOM Cart Items:');
        $('.cart_item, .item').each(function(i) {
            const $item = $(this);
            // console.log('Cart item ' + i + ':', {
                product_id: $item.data('product-id') || 'unknown',
                hasRentalDates: $item.find('.rental-dates, .rental-dates-display').length > 0,
                hasRentalDays: $item.find('.rental-days, .rental-days-display').length > 0,
                hasRentalContainer: $item.find('.rental-dates-container').length > 0,
                html: $item.html()
            });
        });
    }
    
    // Force fix rental prices
    function forceFixRentalPrices() {
        // Find all cart items
        $('.cart_item, .item').each(function() {
            const $item = $(this);
            const productId = $item.data('product-id') || 'unknown';
            
            // console.log('Processing item:', productId);
            
            // First, check if we can find any rental dates
            let rentalDates = '';
            const $metaList = $item.find('dl.variation, .wc-item-meta');
            
            $metaList.find('dt, dd').each(function() {
                const text = $(this).text().toLowerCase();
                if (text.includes('rental') || text.includes('date')) {
                    rentalDates = $(this).next('dd').text() || text;
                    // console.log('Found rental dates:', rentalDates);
                }
            });
            
            // If we found dates, create our display
            if (rentalDates) {
                // console.log('Adding rental dates display for item:', productId);
                
                // Create a rental dates display if it doesn't exist
                if (!$item.find('.rental-dates-display').length) {
                    const $display = $('<div class="rental-dates-display"><strong>תאריכי השכרה:</strong> ' + rentalDates + '</div>');
                    
                    // Find a place to insert it
                    const $nameContainer = $item.find('.product-name, .name');
                    if ($nameContainer.length) {
                        $nameContainer.append($display);
                    } else {
                        $item.append($display);
                    }
                }
                
                // Parse dates and calculate rental days
                if (rentalDates.includes('-')) {
                    const dates = rentalDates.split('-');
                    if (dates.length === 2) {
                        // Assume 3 days for testing purposes
                        const rentalDays = 3;
                        
                        // Add rental days display
                        if (!$item.find('.rental-days-display').length) {
                            const $daysDisplay = $('<div class="rental-days-display"><strong>ימי השכרה:</strong> ' + rentalDays + '</div>');
                            $item.find('.rental-dates-display').after($daysDisplay);
                        }
                        
                        // Add discount info for non-excluded products
                        if (productId !== '150' && productId !== '153') {
                            if (!$item.find('.rental-price-breakdown').length) {
                                const $priceDisplay = $(
                                    '<div class="rental-price-breakdown">' +
                                    '<h5>פירוט הנחת יום נוסף:</h5>' +
                                    '<div class="discount-info">יום ראשון: 100%, ימים נוספים: 50%</div>' +
                                    '<div class="rental-savings">מחיר מקורי: <span class="original-price">' + 
                                    'x ₪</span><br>חסכת: y ₪</div>' +
                                    '</div>'
                                );
                                
                                // Add after product details
                                const $priceContainer = $item.find('.product-price, .cost');
                                if ($priceContainer.length) {
                                    $priceContainer.after($priceDisplay);
                                } else {
                                    $item.find('.rental-days-display').after($priceDisplay);
                                }
                            }
                        }
                        
                        // Add sample exclusion notice for products 150, 153
                        if (productId === '150' || productId === '153') {
                            const $exclusionNotice = $('<div class="excluded-product-notice" style="color:red">מוצר זה אינו זכאי להנחת יום נוסף</div>');
                            $item.find('.rental-days-display').after($exclusionNotice);
                        }
                    }
                }
            }
        });
    }
    
    // Add proper styling
    function addRentalStyles() {
        const $style = $('<style>');
        $style.html(`
            .rental-dates-display, .rental-days-display {
                font-size: 0.9em;
                margin: 5px 0;
                direction: rtl;
                display: block !important;
                visibility: visible !important;
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
                display: block !important;
                visibility: visible !important;
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
            .rental-item-savings .original-price,
            .rental-savings .original-price {
                text-decoration: line-through;
                color: #999;
            }
            .discount-info {
                font-size: 0.9em;
                color: #666;
            }
            .excluded-product-notice {
                font-weight: bold;
                color: #f00 !important;
                margin: 5px 0;
            }
        `);
        $('head').append($style);
    }
    
    // Run diagnostic and fix
    function runTests() {
        // console.log('Running rental display tests and fixes...');
        dumpCartData();
        addRentalStyles();
        forceFixRentalPrices();
    }
    
    // Run tests after a short delay and again after potential AJAX events
    setTimeout(runTests, 500);
    $(document).ajaxComplete(function() {
        setTimeout(runTests, 300);
    });
});
