/**
 * Product Price Breakdown
 * Displays a detailed price breakdown on product pages when rental dates are selected
 */
jQuery(document).ready(function($) {
    'use strict';
    
    // Debug helper
    function debugLog() {
        if (window.rentalDebug) {
            // console.log('[Price Breakdown]', ...arguments);
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
        
        // Extract data and ensure we have dayCount
        const { days, dayCount } = data;
        
        // console.log('[Price Breakdown] Updating price breakdown with data:', data);
        
        // Get days and price
        const startDate = data.startDate ? new Date(data.startDate) : null;
        const endDate = data.endDate ? new Date(data.endDate) : null;
        const basePrice = parseFloat($('.amount').first().text().replace(/[^\d.-]/g, ''));
        
        // Calculate rental days using the weekday/weekend-aware logic
        let rentalDays = 1; // Default to 1 day for single date selection
        let discountedDays = 0;
        let weekdayCount = 0;
        let weekendIncluded = false;
        let details = [];
        
        if (startDate && endDate) {
            // Use the calculateRentalChargeDays function if it exists, otherwise fallback to simple calculation
            if (typeof calculateRentalChargeDays === 'function') {
                const calculation = calculateRentalChargeDays(startDate, endDate);
                rentalDays = calculation.chargeDays;
                discountedDays = calculation.extraDiscountedDays;
                weekdayCount = calculation.weekdayCount;
                weekendIncluded = calculation.weekendIncluded;
                details = calculation.details || [];
                
                // console.log('[Price Breakdown] Used weekday/weekend aware calculation', calculation);
            } else {
                // Fallback to simple day count if the function doesn't exist
                // console.log('[Price Breakdown] Function calculateRentalChargeDays not found, using fallback');
                
                // Calculate the number of days between dates
                const msDiff = endDate.getTime() - startDate.getTime();
                const totalDays = Math.ceil(msDiff / (1000 * 60 * 60 * 24)) + 1;
                
                // Apply the 2-for-1 formula
                rentalDays = Math.ceil((totalDays - 1) / 2) + 1;
                discountedDays = rentalDays - 1;
            }
        }
        
        // Calculate prices
        const firstDayPrice = basePrice;
        const additionalDaysPrice = basePrice * 0.5 * discountedDays; // 50% for additional days
        const totalPrice = firstDayPrice + additionalDaysPrice;
        const savedAmount = basePrice * 0.5 * discountedDays; // Saved 50% on additional days
        
        // console.log('[Price Breakdown] Price breakdown updated', {
            rentalDays: rentalDays,
            discountedDays: discountedDays,
            basePrice: basePrice,
            firstDayPrice: firstDayPrice,
            additionalDaysPrice: additionalDaysPrice,
            totalPrice: totalPrice,
            savedAmount: savedAmount,
            weekdayCount: weekdayCount,
            weekendIncluded: weekendIncluded
        });
        
        // Build the HTML content
        let html = `
            <h3 class="price-breakdown-title">פירוט מחיר השכרה:</h3>
            <div class="price-breakdown-details">
                <div class="price-breakdown-row">
                    <span>יום ראשון (100%):</span>
                    <span class="price">${basePrice.toFixed(2)}₪</span>
                </div>`;
        
        if (discountedDays > 0) {
            html += `
                <div class="price-breakdown-row">
                    <span>ימים נוספים (${discountedDays} × 50%):</span>
                    <span class="price">${additionalDaysPrice.toFixed(2)}₪</span>
                </div>
                <div class="price-breakdown-row saved-row">
                    <span>חסכת:</span>
                    <span class="price">${savedAmount.toFixed(2)}₪ (50%)</span>
                </div>`;
        }
        
        html += `
                <div class="price-breakdown-row total-row">
                    <span>סה״כ:</span>
                    <span class="price">${totalPrice.toFixed(2)}₪</span>
                </div>
                <div class="price-breakdown-note">
                    * חישוב ימי השכרה: סופ״ש (שישי-ראשון) נספר כיום אחד, ובשאר הימים כל יומיים נחשבים ליום אחד
                </div>
            </div>
        `;
        
        // Apply styles directly
        html += '<style>';
        html += '.price-breakdown-row, .price-breakdown-row.saved-row, .price-breakdown-row.total-row { margin-bottom: 5px; display: flex; justify-content: space-between; }';
        html += '.price-breakdown-row.total-row { margin-top: 10px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 5px; }';
        html += '.price-breakdown-row.saved-row { color: #4CAF50; }';
        html += '.price-row, .discount-row, .total-row { margin-bottom: 5px; display: flex; justify-content: space-between; }';
        html += '.total-row { margin-top: 10px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 5px; }';
        html += '.discount-row { color: #4CAF50; }';
        html += '</style>';
        
        // We're using rentalDays instead of days now
        debugLog('HTML content generated with rental days:', rentalDays);
        
        // Update and show the breakdown with !important to ensure visibility
        $breakdown.html(html).attr('style', 'display: block !important');
        
        // Force repaint/visibility after short delay
        setTimeout(function() {
            $breakdown.css('opacity', '0.99').css('opacity', '1');
            debugLog('Forced repaint of price breakdown');
        }, 50);
        
        debugLog('Price breakdown updated', {
            rentalDays,
            dayCount,
            basePrice,
            firstDayPrice,
            additionalDaysPrice,
            totalPrice,
            savedAmount,
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
