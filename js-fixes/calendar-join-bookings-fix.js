/**
 * Calendar Join Bookings Logic - Enhanced Version
 * Improves calendar booking to allow orders to join on first/last days
 * but blocks if any inner day is fully booked or if dates envelope fully booked dates
 */
jQuery(document).ready(function($) {
    'use strict';
    
    console.log('ENHANCED CALENDAR JOIN BOOKINGS LOGIC LOADED');
    
    // Configuration
    const DEBUG = true;
    
    /**
     * Debug logger
     */
    function log(...args) {
        if (DEBUG) {
            console.log('[CALENDAR-JOIN-FIX]', ...args);
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
            }
        } else if (window.productStockData && window.productStockData.initialStock) {
            initialStock = parseInt(window.productStockData.initialStock, 10);
        }
        
        log('Initial stock determined as', initialStock);
        return initialStock;
    }
    
    /**
     * Enhance AirDatepicker with join booking logic
     */
    function enhanceAirDatepicker(initialStock, bookedDates) {
        // Find the AirDatepicker element
        const $datepickerEl = $('.air-datepicker');
        if (!$datepickerEl.length) {
            log('AirDatepicker element not found');
            return;
        }
        
        log('Enhancing AirDatepicker with improved join booking logic');
        
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
        
        // Store for debugging
        window.fullyBookedDates = fullyBookedDates;
        
        // Add our custom onRenderCell to handle join logic
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
                
                // Enhanced check for valid date range
                const validationResult = validateDateRange(
                    startDate, clickedDateObj, fullyBookedDates, startDateStr, clickedDate);
                
                if (!validationResult.isValid) {
                    log('Range validation failed:', validationResult.message);
                    // Prevent the selection by clearing the start date
                    setTimeout(function() {
                        showBookingError(validationResult.message);
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
            
            // Enhanced validation for date range
            const validationResult = validateDateRange(
                startDate, endDate, fullyBookedDates, startDateStr, endDateStr);
            
            if (!validationResult.isValid) {
                log('Range validation failed:', validationResult.message);
                showBookingError(validationResult.message);
                
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
        
        // Try various date formats
        const formats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
        
        for (const format of formats) {
            // This is a simplistic approach - in production would use a proper date library
            if (format === 'DD/MM/YYYY' && dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                const parts = dateStr.split('/');
                return new Date(parts[2], parts[1] - 1, parts[0]);
            } else if (format === 'MM/DD/YYYY' && dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                const parts = dateStr.split('/');
                return new Date(parts[2], parts[0] - 1, parts[1]);
            } else if (format === 'YYYY-MM-DD' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return new Date(dateStr);
            }
        }
        
        return null;
    }
    
    /**
     * Format date as YYYY-MM-DD for comparison with booked dates
     */
    function formatDateForComparison(date) {
        if (!date) return '';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Enhanced validation for date ranges
     * Checks for:
     * 1. Fully booked inner days
     * 2. Envelope scenarios (surrounding fully booked dates)
     * 3. Valid join booking scenarios
     */
    function validateDateRange(startDate, endDate, fullyBookedDates, startDateStr, endDateStr) {
        // Get all dates in the range
        const datesInRange = getDatesInRange(startDate, endDate);
        
        log('Validating date range', {
            startDate: startDateStr,
            endDate: endDateStr,
            datesInRange: datesInRange
        });
        
        // No dates selected
        if (!datesInRange.length) {
            return {
                isValid: false,
                message: 'לא נבחרו תאריכים'
            };
        }
        
        // Skip validation for single day
        if (datesInRange.length === 1) {
            return { isValid: true };
        }
        
        // Check for envelope scenario (fully booked dates in the middle)
        let foundFullyBookedInner = false;
        let hasBookedDatesInMiddle = false;
        
        // Check inner days (skip first and last)
        for (let i = 1; i < datesInRange.length - 1; i++) {
            const dateStr = datesInRange[i];
            
            if (fullyBookedDates[dateStr]) {
                foundFullyBookedInner = true;
                hasBookedDatesInMiddle = true;
                log(`Inner day ${dateStr} is fully booked`);
            }
        }
        
        // Check if both first and last days are booked (envelope scenario)
        const firstDayBooked = fullyBookedDates[datesInRange[0]];
        const lastDayBooked = fullyBookedDates[datesInRange[datesInRange.length - 1]];
        const envelopeScenario = firstDayBooked && lastDayBooked && hasBookedDatesInMiddle;
        
        if (envelopeScenario) {
            log('Envelope scenario detected - booking surrounds already booked dates');
            return {
                isValid: false,
                message: 'לא ניתן לבחור טווח זה כי הוא מקיף תאריכים שכבר הוזמנו'
            };
        }
        
        // Check for inner fully booked days
        if (foundFullyBookedInner) {
            log('Range contains fully booked inner days');
            return {
                isValid: false,
                message: 'לא ניתן לבחור טווח זה כי הוא כולל ימים שכבר הוזמנו במלואם'
            };
        }
        
        // Range is valid
        log('Range is valid for booking');
        return { isValid: true };
    }
    
    /**
     * Get all dates in a range as YYYY-MM-DD strings
     */
    function getDatesInRange(startDate, endDate) {
        if (!startDate || !endDate) return [];
        
        const dates = [];
        let currentDate = new Date(startDate);
        
        // Sort dates if needed
        if (startDate > endDate) {
            const temp = startDate;
            startDate = endDate;
            endDate = temp;
        }
        
        // Add all dates in range
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
        log('Showing booking error:', message);
        
        // Try different methods to show error
        if (typeof showRentalError === 'function') {
            showRentalError(message);
            return;
        }
        
        // Create error element if needed
        let $errorEl = $('.rental-booking-error');
        if (!$errorEl.length) {
            $errorEl = $('<div class="rental-booking-error" style="color: red; margin: 10px 0; padding: 10px; background: #fff4f4; border-right: 3px solid red;"></div>');
            $('.air-datepicker').after($errorEl);
        }
        
        // Set message and show
        $errorEl.html(message).show();
        
        // Hide after 5 seconds
        setTimeout(function() {
            $errorEl.fadeOut();
        }, 5000);
    }
    
    // Initialize
    enhanceJoinBookingLogic();
});
