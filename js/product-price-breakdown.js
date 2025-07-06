/**
 * Product Price Breakdown
 * Displays a detailed price breakdown on product pages when rental dates are selected
 */
jQuery(document).ready(function($) {
    'use strict';
    
    // Debug helper
    function debugLog() {
        if (window.rentalDebug) {
            console.log('[Price Breakdown]', ...arguments);
        }
    }
    
    debugLog('Product price breakdown script loaded');
    
    /**
     * Initialize price breakdown functionality on product pages
     */
    function initPriceBreakdown() {
        // Only run on product pages with a datepicker
        if (!$('#datepicker-container').length || !$('body').hasClass('single-product')) {
            return;
        }
        
        debugLog('Initializing price breakdown on product page');
        
        // Create price breakdown container if it doesn't exist
        const $container = $('#rental-dates-display');
        
        if ($container.length && !$('#rental-price-breakdown').length) {
            $container.after('<div id="rental-price-breakdown" class="price-breakdown" style="display: none; margin-top: 15px; padding: 15px; background-color: #f7f7f7; border: 1px solid #e1e1e1; border-radius: 4px; direction: rtl; z-index: 10;"></div>');
            
            debugLog('Price breakdown container created');
        }
        
        // Listen for rental dates selection
        $(document).on('rentalDatesSelected', function(e, data) {
            debugLog('Rental dates selected event received', data);
            
            if (!data || !data.days) {
                $('#rental-price-breakdown').hide();
                debugLog('No valid rental days, hiding breakdown');
                return;
            }
            
            // Clear any existing content and ensure it's ready to show
            $('#rental-price-breakdown').empty().css('display', '');
            
            // Small delay to ensure DOM update before calculations
            setTimeout(function() {
                updatePriceBreakdown(data);
            }, 10);
        });
        
        // Also try to trigger an initial update if we already have rental dates
        if ($('#rental-dates-display').is(':visible')) {
            const days = parseInt($('#rental-days-count').text()) || 0;
            if (days > 0) {
                debugLog('Found existing rental dates, triggering price breakdown');
                const startDate = $('#selected-start-date').text();
                const endDate = $('#selected-end-date').text();
                
                $(document).trigger('rentalDatesSelected', {
                    startDate: startDate,
                    endDate: endDate,
                    days: days,
                    dayCount: days * 2 // Approximate
                });
            }
        }
    }
    
    /**
     * Update the price breakdown based on selected dates
     */
    function updatePriceBreakdown(data) {
        const $breakdown = $('#rental-price-breakdown');
        const $priceElem = $('.woocommerce-Price-amount.amount').first();
        
        if (!$breakdown.length || !$priceElem.length) {
            debugLog('Missing elements for price breakdown');
            return;
        }
        
        debugLog('Updating price breakdown with data:', data);
        
        // Get the base price (from the page)
        const priceText = $priceElem.text().replace(/[^\d.,]/g, '').replace(',', '.');
        const basePrice = parseFloat(priceText);
        
        if (isNaN(basePrice)) {
            debugLog('Could not parse base price');
            return;
        }
        
        const days = data.days;
        const dayCount = data.dayCount;
        
        // Calculate pricing based on the rental rules
        // First day is full price, additional days are 50%
        const firstDayPrice = basePrice;
        const additionalDaysPrice = days > 1 ? (basePrice * 0.5 * (days - 1)) : 0;
        const totalPrice = firstDayPrice + additionalDaysPrice;
        
        // Create discount info
        const discountAmount = days > 1 ? (basePrice * (days - 1)) - additionalDaysPrice : 0;
        const discountPercentage = days > 1 ? 50 : 0;
        
        // Format prices (using WooCommerce currency format)
        const currencySymbol = $('.woocommerce-Price-currencySymbol').first().text();
        
        // Generate HTML for the breakdown
        let html = '<h4>פירוט מחיר השכרה:</h4>';
        html += `<div class="price-row"><span class="label">יום ראשון (100%):</span> <span class="amount">${firstDayPrice.toFixed(2)}${currencySymbol}</span></div>`;
        
        if (days > 1) {
            html += `<div class="price-row"><span class="label">ימים נוספים (${days - 1} × 50%):</span> <span class="amount">${additionalDaysPrice.toFixed(2)}${currencySymbol}</span></div>`;
            html += `<div class="discount-row"><span class="label">חסכת:</span> <span class="amount">${discountAmount.toFixed(2)}${currencySymbol} (${discountPercentage}%)</span></div>`;
        }
        
        html += `<div class="total-row"><span class="label">סה״כ:</span> <span class="amount">${totalPrice.toFixed(2)}${currencySymbol}</span></div>`;
        
        // Add explanation about the rental day calculation
        if (data.dayCount > data.days) {
            html += '<div class="calculation-note" style="margin-top: 8px; font-size: 0.9em; color: #666;">';
            html += '<p>* חישוב ימי השכרה: סופ״ש (שישי-ראשון) נספר כיום אחד, ובשאר הימים כל יומיים נחשבים ליום אחד</p>';
            html += '</div>';
        }
        
        // Apply styles directly
        html += '<style>';
        html += '.price-row, .discount-row, .total-row { margin-bottom: 5px; display: flex; justify-content: space-between; }';
        html += '.total-row { margin-top: 10px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 5px; }';
        html += '.discount-row { color: #4CAF50; }';
        html += '</style>';
        
        // Update and show the breakdown with !important to ensure visibility
        $breakdown.html(html).attr('style', 'display: block !important');
        
        // Force repaint/visibility after short delay
        setTimeout(function() {
            $breakdown.css('opacity', '0.99').css('opacity', '1');
            debugLog('Forced repaint of price breakdown');
        }, 50);
        
        debugLog('Price breakdown updated', {
            days,
            dayCount,
            basePrice,
            firstDayPrice,
            additionalDaysPrice,
            totalPrice,
            discountAmount,
            visible: $breakdown.is(':visible'),
            style: $breakdown.attr('style'),
            dimensions: {
                width: $breakdown.width(),
                height: $breakdown.height(),
                offset: $breakdown.offset()
            }
        });
    }
    
    // Initialize price breakdown
    initPriceBreakdown();
});
