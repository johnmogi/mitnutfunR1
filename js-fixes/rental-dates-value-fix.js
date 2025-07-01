/**
 * Rental Dates Value Fix
 * 
 * This script fixes the issue with rental_dates input being set to "[object HTMLCollection]"
 * instead of the proper date string format "DD.MM.YYYY - DD.MM.YYYY"
 */

(function($) {
    'use strict';

    // Debug logging function
    function log(...args) {
        console.log('[Rental Dates Fix]', ...args);
    }

    function initRentalDatesValueFix() {
        log('Initializing rental dates value fix script');
        
        if (!$('body').hasClass('single-product')) {
            log('Not on product page, exiting');
            return;
        }
        
        const $forms = $('form.cart');
        log(`Found ${$forms.length} cart forms`);
        
        if (!$forms.length) return;
        
        // Make sure we initialize after the datepicker
        function checkDatepicker() {
            const $datepicker = $('#datepicker-container .air-datepicker');
            if ($datepicker.length && $datepicker.data('datepicker')) {
                fixRentalDatesValue($datepicker, $forms);
            } else {
                // Wait for datepicker to be ready
                log('Waiting for datepicker to be ready...');
                setTimeout(checkDatepicker, 500);
            }
        }
        
        checkDatepicker();
    }
    
    function fixRentalDatesValue($datepicker, $forms) {
        log('Datepicker found, fixing rental dates value issue');
        
        const datepicker = $datepicker.data('datepicker');
        if (!datepicker) {
            log('ERROR: Datepicker instance not found');
            return;
        }
        
        // Format date as DD.MM.YYYY
        function formatDate(date) {
            if (!date) return '';
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
        }
        
        // Update rental_dates input with formatted dates
        function updateRentalDatesInput() {
            if (datepicker.selectedDates.length > 0) {
                const startDate = datepicker.selectedDates[0];
                const endDate = datepicker.selectedDates.length > 1 ? datepicker.selectedDates[1] : startDate;
                
                const formattedStartDate = formatDate(startDate);
                const formattedEndDate = formatDate(endDate);
                const formattedDates = `${formattedStartDate} - ${formattedEndDate}`;
                
                log(`Updating rental_dates input with formatted value: "${formattedDates}"`);
                
                // Update all rental_dates inputs in all forms
                $forms.each(function() {
                    const $form = $(this);
                    let $rentalDatesInput = $form.find('input[name="rental_dates"]');
                    
                    if (!$rentalDatesInput.length) {
                        log('Creating rental_dates input as it does not exist');
                        $rentalDatesInput = $('<input type="hidden" name="rental_dates" id="rental_dates">');
                        $form.append($rentalDatesInput);
                    }
                    
                    $rentalDatesInput.val(formattedDates);
                    log(`Input value set to: ${$rentalDatesInput.val()}`);
                });
            } else {
                log('No dates selected in datepicker');
            }
        }
        
        // Listen for date selection changes
        datepicker.$el.on('change', function() {
            log('Datepicker change detected');
            updateRentalDatesInput();
        });
        
        // Check for form submission
        $forms.each(function() {
            const $form = $(this);
            $form.on('submit', function(e) {
                const $rentalDates = $form.find('input[name="rental_dates"]');
                const value = $rentalDates.val();
                
                log(`Form submitted, rental_dates value: "${value}"`);
                
                // If the value is empty or invalid, check if we can set it from datepicker
                if (!value || value === '[object HTMLCollection]' || value.indexOf('[object') !== -1) {
                    log('Invalid rental_dates value detected, attempting to fix before submission');
                    updateRentalDatesInput();
                    
                    // If still invalid, prevent form submission
                    if (!$rentalDates.val() || $rentalDates.val().indexOf('[object') !== -1) {
                        log('ERROR: Could not fix rental_dates value, preventing form submission');
                        e.preventDefault();
                        alert('Please select rental dates before adding to cart.');
                        return false;
                    }
                }
                
                log(`Form submitting with rental_dates = "${$rentalDates.val()}"`);
            });
        });
        
        // If dates are already selected, update the inputs
        if (datepicker.selectedDates.length > 0) {
            updateRentalDatesInput();
        }
        
        log('Rental dates value fix installed successfully');
    }
    
    // Run on document ready
    $(document).ready(function() {
        try {
            initRentalDatesValueFix();
        } catch (error) {
            console.error('[Rental Dates Fix] Error:', error);
        }
    });

})(jQuery);
