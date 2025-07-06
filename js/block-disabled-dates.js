/**
 * Block Disabled Dates
 * Prevents orders that include disabled date cells in the calendar
 */
(function($) {
    'use strict';

    // Debug logging helper
    function debugLog(...args) {
        if (window.rentalDebugEnabled) {
            // console.log('[Block Disabled Dates]', ...args);
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

    // Show error message with visual feedback
    function showErrorMessage($targetElement, message, isCheckout = false) {
        // Default error message if none provided
        const errorMsg = message || 'לא ניתן להזמין בתאריכים אלו - תאריכים מסומנים כלא זמינים';
        
        // Make button visibly disabled with animation
        $targetElement.addClass('disabled-with-dates');
        $targetElement.css('position', 'relative');
        
        // Add visual feedback to the button
        if (!$targetElement.find('.disabled-overlay').length) {
            $targetElement.append('<div class="disabled-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255, 0, 0, 0.2); z-index: 10;"></div>');
        }
        
        // Create or update error message
        if ($('.rental-date-error').length) {
            $('.rental-date-error')
                .html(errorMsg + '<br><span class="error-instruction">(בחר/י תאריך אחר)</span>')
                .show();
        } else {
            const $errorDiv = $('<div class="rental-date-error"></div>')
                .html(errorMsg + '<br><span class="error-instruction">(בחר/י תאריך אחר)</span>');
            
            // Insert in appropriate location based on context
            if (isCheckout) {
                $errorDiv.insertBefore($targetElement.closest('form'));
            } else {
                $errorDiv.insertAfter($targetElement);
            }
        }
        
        // Add animation to draw attention
        $('.rental-date-error').hide().fadeIn(300);
        $targetElement.find('.disabled-overlay').css('opacity', '0').animate({opacity: 0.2}, 300);
        
        // Safely scroll to error message after ensuring it's in the DOM
        setTimeout(function() {
            const $errorElement = $('.rental-date-error');
            if ($errorElement.length && typeof $errorElement.offset() !== 'undefined') {
                $('html, body').animate({
                    scrollTop: $errorElement.offset().top - 100
                }, 500);
            }
        }, 100);
    }
    
    // Clear error state
    function clearErrorState() {
        $('.rental-date-error').hide();
        $('.disabled-with-dates').removeClass('disabled-with-dates');
        $('.disabled-overlay').remove();
    }

    // Add validation to cart form submission and checkout
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
                
                showErrorMessage($form.find('.single_add_to_cart_button'));
                
                debugLog('Blocked order with disabled dates');
                return false;
            }
            
            // Clear any previous error messages
            clearErrorState();
        });
        
        // Direct add-to-cart button click validation
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
                    
                    showErrorMessage($(this));
                    
                    debugLog('Blocked direct add-to-cart with disabled dates');
                    return false;
                }
                
                // Clear any previous error messages
                clearErrorState();
            }
        });
        
        // Handle checkout page - Place Order button
        $(document).on('click', '#place_order', function(e) {
            debugLog('Place Order clicked - checking dates');
            
            // Look for rental date items in the checkout order review
            let hasDisabledDates = false;
            
            // Find all rental date items in checkout
            $('.woocommerce-checkout-review-order-table .cart_item').each(function() {
                const itemText = $(this).text();
                
                // Look for rental date information pattern
                const dateMatch = itemText.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})\s*-\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/);
                if (dateMatch && dateMatch.length === 3) {
                    const startDate = dateMatch[1];
                    const endDate = dateMatch[2];
                    
                    debugLog('Found checkout rental dates:', startDate, endDate);
                    
                    // Check if this range has disabled dates
                    if (hasDisabledDatesInRange(startDate, endDate)) {
                        hasDisabledDates = true;
                        debugLog('Blocked checkout - found disabled date in range');
                        return false; // Break the loop
                    }
                }
            });
            
            // If disabled dates found, prevent checkout
            if (hasDisabledDates) {
                e.preventDefault();
                e.stopPropagation();
                
                showErrorMessage($(this), 'לא ניתן להשלים את ההזמנה - ההזמנה כוללת תאריכים לא זמינים', true);
                return false;
            } else {
                clearErrorState();
            }
        });
    }

    // Initialize when document is ready
    $(document).ready(function() {
        blockDisabledDates();
    });

})(jQuery);
