/**
 * Join Booking Notice
 * Shows a return time notice when joining a booking on the first or last day
 */
jQuery(document).ready(function($) {
    'use strict';
    
    // console.log('JOIN BOOKING NOTICE LOADED');
    
    /**
     * Add return time notice to the calendar when joining bookings
     */
    function initJoinBookingNotice() {
        // Keep track of booked dates
        let fullyBookedDates = {};
        let startDate = null;
        let endDate = null;
        
        // Create notice element if it doesn't exist
        if (!$('#return-time-notice').length) {
            $('<div id="return-time-notice" class="return-time-notice info" style="margin-bottom: 15px; background-color: #e3f2fd; border: 1px solid #90caf9; padding: 8px; border-radius: 4px; direction: rtl; display: none;">' +
              '<strong>שימו לב!</strong> החזרת הציוד מתבצעת עד השעה 10:00 .' +
              '</div>').insertAfter('#datepicker-container');
        }
        
        // Listen for rental dates loaded event
        $(document).on('rentalDatesLoaded', function(e, data) {
            // console.log('Join Notice: Rental dates loaded event received', data);
            
            if (!data || !data.bookedDates) {
                return;
            }
            
            // Store fully booked dates
            const initialStock = data.initialStock || 1;
            fullyBookedDates = {};
            
            // Process each date
            for (const dateKey in data.bookedDates) {
                if (data.bookedDates.hasOwnProperty(dateKey)) {
                    const bookingCount = data.bookedDates[dateKey].length || 0;
                    if (bookingCount >= initialStock) {
                        fullyBookedDates[dateKey] = true;
                    }
                }
            }
            
            // console.log('Join Notice: Fully booked dates:', fullyBookedDates);
        });
        
        // Listen for date selection
        $(document).on('change', '.air-datepicker-range-start, .air-datepicker-range-end', function() {
            checkForJoinBooking();
        });
        
        // Also listen for the rental dates selected event
        $(document).on('rentalDatesSelected', function(e, dates) {
            if (dates && dates.startDate && dates.endDate) {
                startDate = dates.startDate;
                endDate = dates.endDate;
                checkForJoinBooking();
            }
        });
        
        /**
         * Check if selected dates join with existing bookings
         */
        function checkForJoinBooking() {
            const $startInput = $('.air-datepicker-range-start');
            const $endInput = $('.air-datepicker-range-end');
            
            if (!$startInput.val() || !$endInput.val()) {
                hideReturnTimeNotice();
                return;
            }
            
            // Parse dates
            const startDate = parseAirDatePickerDate($startInput.val());
            const endDate = parseAirDatePickerDate($endInput.val());
            
            if (!startDate || !endDate) {
                hideReturnTimeNotice();
                return;
            }
            
            // Format dates for comparison
            const startDateStr = formatDateForComparison(startDate);
            const endDateStr = formatDateForComparison(endDate);
            
            // Check if start or end date joins with a fully booked date
            const dayBeforeStart = new Date(startDate);
            dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);
            const dayBeforeStartStr = formatDateForComparison(dayBeforeStart);
            
            const dayAfterEnd = new Date(endDate);
            dayAfterEnd.setDate(dayAfterEnd.getDate() + 1);
            const dayAfterEndStr = formatDateForComparison(dayAfterEnd);
            
            // Check if joining on first or last day
            const isJoiningStart = fullyBookedDates[dayBeforeStartStr];
            const isJoiningEnd = fullyBookedDates[dayAfterEndStr];
            
            if (isJoiningStart || isJoiningEnd) {
                // console.log('Join Notice: Joining booking detected', {
                    isJoiningStart,
                    isJoiningEnd,
                    startDate: startDateStr,
                    endDate: endDateStr
                });
                
                showReturnTimeNotice();
            } else {
                hideReturnTimeNotice();
            }
        }
        
        /**
         * Show return time notice
         */
        function showReturnTimeNotice() {
            $('#return-time-notice').slideDown(200);
        }
        
        /**
         * Hide return time notice
         */
        function hideReturnTimeNotice() {
            $('#return-time-notice').slideUp(200);
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
    }
    
    // Initialize
    initJoinBookingNotice();
});
