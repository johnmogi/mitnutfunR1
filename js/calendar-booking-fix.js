/**
 * Calendar Booking Status Fix
 * Fixes the AirDatepicker reserved date display to properly block dates
 * based on initial stock level, not current stock level
 */
jQuery(document).ready(function($) {
    'use strict';
    
    console.log('CALENDAR BOOKING STATUS FIX LOADED');
    
    /**
     * Fix calendar booking display
     */
    function fixCalendarBooking() {
        // Listen for the rentalDatesLoaded event
        $(document).on('rentalDatesLoaded', function(e, data) {
            console.log('Calendar fix: Rental dates loaded event received', data);
            
            if (!data || !data.bookedDates) {
                console.log('Calendar fix: No booked dates data');
                return;
            }
            
            // Get initial stock
            let initialStock = 1; // Default to 1 if not found
            
            // Try to get initial stock from various sources
            if ($('.stock-debugger-data').length) {
                const stockText = $('.stock-debugger-data').text();
                const initialMatch = stockText.match(/Initial\s*=\s*(\d+)/);
                
                if (initialMatch && initialMatch[1]) {
                    initialStock = parseInt(initialMatch[1], 10);
                    console.log('Calendar fix: Found initial stock from debugger:', initialStock);
                }
            }
            
            // Look for data attributes
            const $stockData = $('[data-initial-stock]');
            if ($stockData.length) {
                initialStock = parseInt($stockData.data('initial-stock'), 10) || initialStock;
                console.log('Calendar fix: Found initial stock from data attribute:', initialStock);
            }
            
            // Fix the calendar cells after a short delay to ensure they've been rendered
            setTimeout(function() {
                fixCalendarCells(initialStock, data.bookedDates);
            }, 500);
        });
    }
    
    /**
     * Fix calendar cells based on correct stock calculation
     */
    function fixCalendarCells(initialStock, bookedDates) {
        console.log('Calendar fix: Fixing calendar cells with initial stock', initialStock);
        
        // Process each date in bookedDates
        for (const dateKey in bookedDates) {
            if (bookedDates.hasOwnProperty(dateKey)) {
                const bookingCount = bookedDates[dateKey].length || 0;
                
                // Find the corresponding date cell
                const dateParts = dateKey.split('-');
                if (dateParts.length !== 3) continue;
                
                const year = dateParts[0];
                const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-based
                const date = parseInt(dateParts[2], 10);
                
                const $cell = $(`.air-datepicker-cell[data-year="${year}"][data-month="${month}"][data-date="${date}"]`);
                
                if ($cell.length) {
                    // Determine if date should be fully blocked
                    const shouldBlock = bookingCount >= initialStock;
                    
                    console.log(`Calendar fix: Date ${dateKey} - Bookings: ${bookingCount}, Initial Stock: ${initialStock}, Should block: ${shouldBlock}`);
                    
                    // Update class based on booking status
                    if (shouldBlock) {
                        $cell.removeClass('air-datepicker-cell--partially-booked')
                             .addClass('air-datepicker-cell--fully-booked -disabled-');
                        
                        console.log(`Calendar fix: Fully blocking date ${dateKey}`);
                    } else if (bookingCount > 0) {
                        // Already has the partially booked class, but log for confirmation
                        console.log(`Calendar fix: Date ${dateKey} remains partially booked`);
                    }
                }
            }
        }
        
        // Add a custom style for fully booked dates
        if (!$('#calendar-booking-fix-style').length) {
            $('head').append(`
                <style id="calendar-booking-fix-style">
                    .air-datepicker-cell--fully-booked {
                        position: relative;
                        color: #ccc !important;
                        background-color: rgba(255, 0, 0, 0.1) !important;
                        cursor: not-allowed !important;
                    }
                    .air-datepicker-cell--fully-booked:after {
                        content: '';
                        position: absolute;
                        top: 0;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        background: repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 5px,
                            rgba(255, 0, 0, 0.1) 5px,
                            rgba(255, 0, 0, 0.1) 10px
                        );
                    }
                    /* Override hover state for fully booked */
                    .air-datepicker-cell--fully-booked:hover {
                        color: #ccc !important;
                        background-color: rgba(255, 0, 0, 0.1) !important;
                    }
                </style>
            `);
        }
    }
    
    // Initialize
    fixCalendarBooking();
});
