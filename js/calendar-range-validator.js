/**
 * Calendar Range Validator
 * Prevents booking ranges that contain fully booked days inside them
 */
jQuery(document).ready(function($) {
    'use strict';
    
    // console.log('CALENDAR RANGE VALIDATOR LOADED');
    
    /**
     * Initialize range validation for AirDatepicker
     */
    function initCalendarRangeValidator() {
        // Track booked dates and datepicker instance
        let fullyBookedDates = {};
        let datepickerInstance = null;
        let initialStock = 1;
        
        // Listen for AirDatepicker init
        $(document).on('airDatepickerInitialized', function(e, instance) {
            // console.log('Range Validator: AirDatepicker initialized');
            datepickerInstance = instance;
            
            // Add custom validation to onSelect
            const originalOnSelect = instance.opts.onSelect;
            
            instance.opts.onSelect = function(formattedDate, date, inst) {
                // Call original handler first
                if (typeof originalOnSelect === 'function') {
                    originalOnSelect(formattedDate, date, inst);
                }
                
                // Now perform our additional validation
                if (Array.isArray(date) && date.length === 2 && date[0] && date[1]) {
                    validateSelectedRange(date[0], date[1]);
                }
            };
        });
        
        // Listen for rental dates loaded event
        $(document).on('rentalDatesLoaded', function(e, data) {
            // console.log('Range Validator: Rental dates loaded event received', data);
            
            if (!data || !data.bookedDates) {
                return;
            }
            
            // Store stock and booked dates
            initialStock = data.initialStock || 1;
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
            
            // console.log('Range Validator: Fully booked dates:', fullyBookedDates);
        });
        
        /**
         * Validate a selected date range to ensure no fully booked days are contained within
         */
        function validateSelectedRange(startDate, endDate) {
            if (!startDate || !endDate || !datepickerInstance) {
                return;
            }
            
            // console.log('Range Validator: Validating range', startDate, endDate);
            
            let containsFullyBookedDays = false;
            let currentDate = new Date(startDate);
            
            // Increment by one day to exclude start date (pickup is ok)
            currentDate.setDate(currentDate.getDate() + 1); 
            
            // Check all days between start+1 and end-1 (exclusive of endpoints)
            while (currentDate < endDate) {
                const dateKey = formatDateForComparison(currentDate);
                
                if (fullyBookedDates[dateKey]) {
                    containsFullyBookedDays = true;
                    // console.log('Range Validator: Found fully booked day within range:', dateKey);
                    break;
                }
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // If range contains fully booked days, reset the selection
            if (containsFullyBookedDays) {
                // console.log('Range Validator: Preventing invalid range selection');
                
                // Show alert
                alert('לא ניתן להזמין טווח תאריכים זה מכיוון שהוא מכיל תאריכים מלאים בין תאריך ההתחלה לסיום.');
                
                // Clear the selection
                datepickerInstance.clear();
                
                // Reset hidden input and display
                $('#rental_dates').val('');
                $('#selected-start-date').text('');
                $('#selected-end-date').text('');
                $('#rental-days-count').text('0');
                
                // Hide pricing details if shown
                $('.price-breakdown').hide();
                
                // Trigger change event
                $(document).trigger('rentalDatesChanged', { 
                    startDate: null, 
                    endDate: null, 
                    rentalDays: 0 
                });
            }
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
    initCalendarRangeValidator();
});
