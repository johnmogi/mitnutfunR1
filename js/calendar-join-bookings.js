/**
 * Calendar Join Bookings Logic
 * Enhances calendar booking to allow orders to join on first/last days
 * but blocks if any inner day is fully booked
 */
jQuery(document).ready(function($) {
    'use strict';
    
    // console.log('CALENDAR JOIN BOOKINGS LOGIC LOADED');
    
    // Configuration
    const DEBUG = true;
    
    /**
     * Debug logger
     */
    function log(...args) {
        if (DEBUG) {
            // console.log('[CALENDAR-JOIN]', ...args);
        }
    }
    
    /**
     * Enhance datepicker with join booking logic
     */
    function enhanceJoinBookingLogic() {
        // Listen for datepicker initialization
        $(document).on('rentalDatesLoaded', function(e, data) {
            log('Rental dates loaded, enhancing with join booking logic', data);
            
            if (!data || !data.bookedDates) {
                log('No booked dates data');
                return;
            }
            
            // Get initial stock
            let initialStock = getInitialStock();
            
            // Store booked dates for reference
            window.rentalBookedDates = data.bookedDates;
            window.rentalInitialStock = initialStock;
            
            // Wait for AirDatepicker to initialize
            setTimeout(function() {
                enhanceAirDatepicker(initialStock, data.bookedDates);
            }, 600);
        });
    }
    
    /**
     * Get initial stock from various sources
     */
    function getInitialStock() {
        // Default to 1 if not found
        let initialStock = 1;
        
        // Try to get initial stock from various sources
        if ($('.stock-debugger-data').length) {
            const stockText = $('.stock-debugger-data').text();
            const initialMatch = stockText.match(/Initial\s*=\s*(\d+)/);
            
            if (initialMatch && initialMatch[1]) {
                initialStock = parseInt(initialMatch[1], 10);
                log('Found initial stock from debugger:', initialStock);
            }
        }
        
        // Look for data attributes
        const $stockData = $('[data-initial-stock]');
        if ($stockData.length) {
            initialStock = parseInt($stockData.data('initial-stock'), 10) || initialStock;
            log('Found initial stock from data attribute:', initialStock);
        }
        
        return initialStock;
    }
    
    /**
     * Enhance AirDatepicker with join booking logic
     */
    function enhanceAirDatepicker(initialStock, bookedDates) {
        // Find the AirDatepicker instance
        const $datepickerEl = $('.air-datepicker');
        if (!$datepickerEl.length) {
            log('AirDatepicker element not found');
            return;
        }
        
        log('Enhancing AirDatepicker with join booking logic');
        
        // Create lookup for fully booked dates
        const fullyBookedDates = {};
        for (const dateKey in bookedDates) {
            if (bookedDates.hasOwnProperty(dateKey)) {
                const bookingCount = bookedDates[dateKey].length || 0;
                if (bookingCount >= initialStock) {
                    fullyBookedDates[dateKey] = true;
                    log(`Date ${dateKey} is fully booked`);
                }
            }
        }
        
        // Add our custom onRenderCell to handle join logic
        // This can be done by modifying the datepicker instance or intercepting events
        $datepickerEl.on('mousedown', '.air-datepicker-cell', function() {
            // This runs before the selection is made
            const $startInput = $('.air-datepicker-range-start');
            const $endInput = $('.air-datepicker-range-end');
            
            // If we're selecting a range end (second click)
            if ($startInput.val() && !$endInput.val()) {
                const startDate = parseAirDatePickerDate($startInput.val());
                if (!startDate) return;
                
                // Get the date being clicked
                const $cell = $(this);
                const year = $cell.data('year');
                const month = $cell.data('month') + 1; // Convert 0-based to 1-based
                const day = $cell.data('date');
                const clickedDateObj = new Date(year, month-1, day);
                
                // Format dates for comparison with booked dates
                const clickedDate = formatDateForComparison(clickedDateObj);
                const startDateStr = formatDateForComparison(startDate);
                
                log('Clicked end date:', clickedDate, 'Start date:', startDateStr);
                
                // Skip if clicking on the same date as start
                if (clickedDate === startDateStr) return;
                
                // Check if range contains any fully booked inner days
                const containsFullyBookedInnerDay = checkRangeForFullyBookedInnerDays(
                    startDate, clickedDateObj, fullyBookedDates, startDateStr, clickedDate);
                
                if (containsFullyBookedInnerDay) {
                    log('Range contains fully booked inner days, preventing selection');
                    // Prevent the selection by clearing the start date
                    setTimeout(function() {
                        showBookingError('לא ניתן לבחור טווח זה כי הוא כולל ימים שכבר הוזמנו במלואם');
                        $startInput.val('').trigger('change');
                        $endInput.val('').trigger('change');
                        
                        // Clear any existing selection from datepicker
                        if (window.airDatepickerInstance) {
                            window.airDatepickerInstance.clear();
                        }
                    }, 10);
                }
            }
        });
        
        // Also enhance onSelect to validate selection
        $(document).on('rentalDatesSelected', function(e, dates) {
            if (!dates || !dates.startDate || !dates.endDate) return;
            
            log('Rental dates selected, validating join logic', dates);
            
            // Parse the dates
            const startDate = new Date(dates.startDate);
            const endDate = new Date(dates.endDate);
            
            // Format dates for comparison
            const startDateStr = formatDateForComparison(startDate);
            const endDateStr = formatDateForComparison(endDate);
            
            // Check if range contains any fully booked inner days
            const containsFullyBookedInnerDay = checkRangeForFullyBookedInnerDays(
                startDate, endDate, fullyBookedDates, startDateStr, endDateStr);
            
            if (containsFullyBookedInnerDay) {
                log('Range contains fully booked inner days, clearing selection');
                showBookingError('לא ניתן לבחור טווח זה כי הוא כולל ימים שכבר הוזמנו במלואם');
                
                // Clear any existing selection
                $('.air-datepicker-range-start, .air-datepicker-range-end').val('').trigger('change');
                
                // Clear any existing selection from datepicker
                if (window.airDatepickerInstance) {
                    window.airDatepickerInstance.clear();
                }
                
                // Trigger rental dates cleared event
                $(document).trigger('rentalDatesCleared');
            }
        });
    }
    
    /**
     * Parse a date string from AirDatepicker format
     */
    function parseAirDatePickerDate(dateStr) {
        if (!dateStr) return null;
        
        // Parse DD.MM.YYYY format
        const parts = dateStr.split('.');
        if (parts.length !== 3) return null;
        
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
        const year = parseInt(parts[2], 10);
        
        return new Date(year, month, day);
    }
    
    /**
     * Format date as YYYY-MM-DD for comparison with booked dates
     */
    function formatDateForComparison(date) {
        if (!date) return '';
        
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Check if a date range contains any fully booked inner days
     * Allows first/last day to be fully booked (for join booking)
     */
    function checkRangeForFullyBookedInnerDays(startDate, endDate, fullyBookedDates, startDateStr, endDateStr) {
        // Get all dates in the range
        const datesInRange = getDatesInRange(startDate, endDate);
        
        log('Checking range for fully booked inner days', {
            startDate: startDateStr,
            endDate: endDateStr,
            datesInRange: datesInRange
        });
        
        // Check each inner day
        for (let i = 1; i < datesInRange.length - 1; i++) {
            const dateStr = datesInRange[i];
            
            if (fullyBookedDates[dateStr]) {
                log(`Inner day ${dateStr} is fully booked, blocking selection`);
                return true;
            }
        }
        
        log('Range does not contain any fully booked inner days');
        return false;
    }
    
    /**
     * Get all dates in a range as YYYY-MM-DD strings
     */
    function getDatesInRange(startDate, endDate) {
        const dates = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            dates.push(formatDateForComparison(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return dates;
    }
    
    /**
     * Show booking error message
     */
    function showBookingError(message) {
        // Look for existing error container
        let $errorContainer = $('.rental-booking-error');
        
        // Create if it doesn't exist
        if (!$errorContainer.length) {
            $errorContainer = $('<div class="rental-booking-error"></div>')
                .css({
                    'background-color': '#f8d7da',
                    'color': '#721c24',
                    'padding': '10px 15px',
                    'margin': '10px 0',
                    'border-radius': '4px',
                    'border': '1px solid #f5c6cb',
                    'font-weight': 'bold',
                    'display': 'none',
                    'direction': 'rtl'
                });
            
            $('.air-datepicker').after($errorContainer);
        }
        
        // Show the error
        $errorContainer.text(message).fadeIn();
        
        // Hide after 5 seconds
        setTimeout(function() {
            $errorContainer.fadeOut();
        }, 5000);
    }
    
    // Initialize
    enhanceJoinBookingLogic();
});
