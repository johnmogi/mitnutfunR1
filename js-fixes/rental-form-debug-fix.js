/**
 * Rental Form Debug Fix
 * 
 * This script debugs the rental form submission process to fix the
 * "Must select rental dates before adding to cart" error.
 */

(function($) {
    'use strict';

    // Debug logging function
    function log(...args) {
        console.log('[Rental Form Debug]', ...args);
    }

    function initRentalFormDebug() {
        log('Initializing rental form debug script');
        
        if (!$('body').hasClass('single-product')) {
            log('Not on product page, exiting');
            return;
        }
        
        // Find all add to cart forms
        const $forms = $('form.cart');
        log(`Found ${$forms.length} cart forms`);
        
        if (!$forms.length) return;
        
        $forms.each(function() {
            const $form = $(this);
            log('Debugging form:', $form);
            
            // Log all existing hidden inputs
            const $inputs = $form.find('input[type="hidden"]');
            log(`Form has ${$inputs.length} hidden inputs:`);
            $inputs.each(function() {
                log(`- ${$(this).attr('name')} = ${$(this).val()}`);
            });
            
            // Check specifically for rental_dates
            const $rentalDatesInput = $form.find('input[name="rental_dates"]');
            if ($rentalDatesInput.length) {
                log('Found rental_dates input:', $rentalDatesInput.val());
            } else {
                log('WARNING: No rental_dates input found! Creating one...');
                // Create rental_dates input if missing
                $form.append('<input type="hidden" name="rental_dates" value="" />');
            }
            
            // Check datepicker and its values
            const $datepicker = $('#datepicker-container .air-datepicker');
            if ($datepicker.length) {
                log('Datepicker found');
                const datepickerInstance = $datepicker.data('datepicker');
                if (datepickerInstance) {
                    log('Datepicker instance found, selected dates:', datepickerInstance.selectedDates);
                }
            } else {
                log('WARNING: No datepicker found!');
            }
            
            // Intercept form submission
            $form.on('submit', function(e) {
                log('Form submitting, checking values...');
                
                // Get current rental_dates input
                const $rentalDates = $form.find('input[name="rental_dates"]');
                const rentalDatesValue = $rentalDates.val();
                log(`rental_dates = "${rentalDatesValue}"`);
                
                // If datepicker has dates but input doesn't, try to update it
                const $datepicker = $('#datepicker-container .air-datepicker');
                if ($datepicker.length) {
                    const datepickerInstance = $datepicker.data('datepicker');
                    if (datepickerInstance && datepickerInstance.selectedDates && 
                        datepickerInstance.selectedDates.length && !rentalDatesValue) {
                        
                        const startDate = datepickerInstance.selectedDates[0];
                        let endDate = startDate;
                        
                        if (datepickerInstance.selectedDates.length > 1) {
                            endDate = datepickerInstance.selectedDates[1];
                        }
                        
                        // Format dates as DD.MM.YYYY
                        const formattedStart = startDate.toLocaleDateString('he-IL');
                        const formattedEnd = endDate.toLocaleDateString('he-IL');
                        const newValue = `${formattedStart} - ${formattedEnd}`;
                        
                        log(`Fixing missing rental_dates with "${newValue}"`);
                        $rentalDates.val(newValue);
                    }
                }
                
                // If still no rental dates and we have a datepicker, prevent submission
                if (!$rentalDates.val() && $datepicker.length) {
                    log('WARNING: Still no rental dates selected, submission will likely fail');
                }
                
                // Create a clone of the entire form data for debugging
                const formData = {};
                $form.find('input, select, textarea').each(function() {
                    const input = $(this);
                    formData[input.attr('name')] = input.val();
                });
                log('Complete form data:', formData);
            });
        });
        
        log('Rental form debugging initialized');
    }
    
    // Run on document ready
    $(document).ready(function() {
        try {
            initRentalFormDebug();
        } catch (error) {
            console.error('[Rental Form Debug] Error:', error);
        }
    });

})(jQuery);
