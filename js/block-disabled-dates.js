/**
 * Block Disabled Dates
 * Prevents orders that include disabled date cells in the calendar
 */
(function($) {
    'use strict';

    // Debug logging helper
    function debugLog(...args) {
        if (window.rentalDebugEnabled) {
            console.log('[Block Disabled Dates]', ...args);
        }
    }
    
    // Format date as YYYY-MM-DD
    function formatDateYMD(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Check if date is disabled in AirCalendar
    function isDateDisabled(date) {
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-indexed in JS
        const day = date.getDate();
        
        // Try multiple selectors to handle different AirCalendar versions and configurations
        
        // First check with exact data attributes (most reliable)
        let $cell = $(`.air-datepicker-cell[data-year="${year}"][data-month="${month}"][data-date="${day}"]`);
        if ($cell.length && ($cell.hasClass('-disabled-') || $cell.hasClass('air-datepicker-cell--disabled'))) {
            return true;
        }
        
        // Next check based on data-date attribute (some versions use this)
        const formattedDate = formatDateYMD(date);
        $cell = $(`.air-datepicker-cell[data-date="${formattedDate}"]`);
        if ($cell.length && ($cell.hasClass('-disabled-') || $cell.hasClass('air-datepicker-cell--disabled'))) {
            return true;
        }
        
        // Check any cell with this date text and disabled class
        const dayText = day.toString();
        $cell = $(`.air-datepicker-cell:contains(${dayText})`);
        if ($cell.length) {
            // Filter to cells that actually have exactly this text (not containing it)
            $cell = $cell.filter(function() {
                return $(this).text().trim() === dayText;
            });
            
            // Check if any matching cells are disabled
            for (let i = 0; i < $cell.length; i++) {
                if ($($cell[i]).hasClass('-disabled-') || $($cell[i]).hasClass('air-datepicker-cell--disabled')) {
                    return true;
                }
            }
        }
        
        // Check if this date is in the disabledDates array if available
        if (window.airDatepickerInstance && window.airDatepickerInstance.opts && window.airDatepickerInstance.opts.disabledDates) {
            const disabledDates = window.airDatepickerInstance.opts.disabledDates;
            const dateString = formatDateYMD(date);
            if (disabledDates.includes(dateString)) {
                return true;
            }
        }
        
        return false;
    }

    // Check if a date range contains any disabled dates
    function hasDisabledDatesInRange(startDate, endDate) {
        debugLog('Checking if range contains disabled dates:', startDate, 'to', endDate);

        // Convert string dates to Date objects if needed
        if (typeof startDate === 'string') {
            const parts = startDate.split('-');
            startDate = new Date(parts[0], parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
        
        if (typeof endDate === 'string') {
            const parts = endDate.split('-');
            endDate = new Date(parts[0], parseInt(parts[1]) - 1, parseInt(parts[2]));
        }

        // Clone start date to avoid modifying the original
        let currentDate = new Date(startDate);
        
        // Check each day in the range
        while (currentDate <= endDate) {
            // Check if this date is disabled
            if (isDateDisabled(currentDate)) {
                debugLog('Found disabled date in range:', formatDateYMD(currentDate));
                return true;
            }
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        debugLog('No disabled dates found in range');
        return false;
    }

    // Add validation to cart form submission
    function blockDisabledDates() {
        debugLog('Setting up disabled date blocking');
        
        // Intercept the add to cart form submission
        $(document).on('submit', 'form.cart', function(e) {
            const $form = $(this);
            
            // Only process if it's a rental product with dates
            const $dateInput = $('#rental_dates');
            if (!$dateInput.length || !$dateInput.val()) {
                return; // Not a rental product or no dates selected
            }
            
            // Parse the rental dates
            const rentalDates = $dateInput.val();
            const dateParts = rentalDates.split(' - ');
            
            if (dateParts.length !== 2) {
                return; // Invalid date format
            }
            
            debugLog('Validating dates:', dateParts[0], dateParts[1]);
            
            // Check if the selected range includes any disabled dates
            if (hasDisabledDatesInRange(dateParts[0], dateParts[1])) {
                e.preventDefault(); // Stop form submission
                e.stopPropagation();
                
                // Show error message
                const errorMsg = 'לא ניתן להזמין בתאריכים אלו - תאריכים מסומנים כלא זמינים';
                
                // Create or update error message
                if ($('.rental-date-error').length) {
                    $('.rental-date-error').text(errorMsg).show();
                } else {
                    $('<div class="rental-date-error" style="color: red; margin-top: 10px; font-weight: bold;"></div>')
                        .text(errorMsg)
                        .insertAfter($form.find('.single_add_to_cart_button'));
                }
                
                debugLog('Blocked order with disabled dates');
                return false;
            }
            
            // Clear any previous error messages
            $('.rental-date-error').hide();
        });
        
        // Also add validation to the direct add-to-cart button click
        $(document).on('click', '.single_add_to_cart_button', function(e) {
            // Only if not within a form (direct add to cart buttons)
            if (!$(this).closest('form.cart').length) {
                const $dateInput = $('#rental_dates');
                if (!$dateInput.length || !$dateInput.val()) {
                    return; // Not a rental product or no dates selected
                }
                
                // Parse the rental dates
                const rentalDates = $dateInput.val();
                const dateParts = rentalDates.split(' - ');
                
                if (dateParts.length !== 2) {
                    return; // Invalid date format
                }
                
                // Check if the selected range includes any disabled dates
                if (hasDisabledDatesInRange(dateParts[0], dateParts[1])) {
                    e.preventDefault(); // Stop button action
                    e.stopPropagation();
                    
                    // Show error message
                    const errorMsg = 'לא ניתן להזמין בתאריכים אלו - תאריכים מסומנים כלא זמינים';
                    
                    // Create or update error message
                    if ($('.rental-date-error').length) {
                        $('.rental-date-error').text(errorMsg).show();
                    } else {
                        $('<div class="rental-date-error" style="color: red; margin-top: 10px; font-weight: bold;"></div>')
                            .text(errorMsg)
                            .insertAfter($(this));
                    }
                    
                    debugLog('Blocked direct add-to-cart with disabled dates');
                    return false;
                }
                
                // Clear any previous error messages
                $('.rental-date-error').hide();
            }
        });
    }

    // Initialize when document is ready
    $(document).ready(function() {
        blockDisabledDates();
    });

})(jQuery);
