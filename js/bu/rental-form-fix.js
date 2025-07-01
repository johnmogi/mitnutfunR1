/**
 * Rental Form Fix
 * Ensures rental dates are properly captured in form submission
 */
jQuery(document).ready(function($) {
    'use strict';
    
    console.log('RENTAL FORM FIX LOADED');
    
    // Main function to ensure rental dates are properly submitted
    function fixRentalFormSubmission() {
        // Check if we're on a product page with a rental datepicker
        if (!$('#datepicker-container').length) {
            return;
        }
        
        console.log('Running rental form submission fix');
        
        // Create or ensure rental_dates hidden input exists in the form
        const $form = $('form.cart');
        if (!$form.length) {
            console.warn('Form.cart not found');
            return;
        }
        
        // Remove any existing rental_dates input to prevent duplicates
        $form.find('input[name="rental_dates"]').remove();
        
        // Create a new properly named input
        const $rentalInput = $('<input type="hidden" name="rental_dates" id="rental_dates" value="" />');
        $form.append($rentalInput);
        console.log('Added rental_dates input to form:', $rentalInput[0]);
        
        // Hook into date selection changes
        $(document).on('click', '.air-datepicker-cell', function() {
            setTimeout(captureRentalDates, 500);
        });
        
        // Also hook into datepicker's custom event if available
        $(document).on('dateSelected', captureRentalDates);
        
        // Hook into form submission
        $form.on('submit', function(e) {
            // Force capture dates before submission
            captureRentalDates();
            
            const rentalDates = $('#rental_dates').val();
            console.log('Form submitted with rental_dates:', rentalDates);
            
            // If still no rental dates and datepicker is visible, prevent submission
            if (!rentalDates && $('#datepicker-container').is(':visible')) {
                console.warn('Preventing form submission: No rental dates selected');
                alert('נא לבחור תאריכי השכרה');
                e.preventDefault();
                return false;
            }
        });
        
        // Add debug attribute to cart button
        $form.find('.single_add_to_cart_button').attr('data-has-rental-fix', 'true');
        
        // Run initial capture
        captureRentalDates();
    }
    
    // Function to capture rental dates from various sources
    function captureRentalDates() {
        const $rentalInput = $('#rental_dates');
        
        if (!$rentalInput.length) {
            console.warn('rental_dates input not found');
            return;
        }
        
        // Get rental dates from various possible sources
        let rentalDates = '';
        
        // Source 1: Visible date display
        const $startDate = $('#selected-start-date');
        const $endDate = $('#selected-end-date');
        
        if ($startDate.length && $endDate.length && 
            $startDate.text() && $endDate.text()) {
            rentalDates = $startDate.text() + ' - ' + $endDate.text();
        }
        
        // Source 2: Global variable if it exists
        if (!rentalDates && window.rental_dates) {
            rentalDates = window.rental_dates;
        }
        
        // Source 3: Datepicker input value
        if (!rentalDates) {
            const $datePickerInput = $('.datepicker-here, .air-datepicker-input');
            if ($datePickerInput.length && $datePickerInput.val()) {
                rentalDates = $datePickerInput.val();
            }
        }
        
        // Update the rental dates input if we have a value
        if (rentalDates) {
            $rentalInput.val(rentalDates);
            console.log('Updated rental_dates input with:', rentalDates);
            
            // Store globally for other scripts
            window.rental_dates = rentalDates;
            
            // Add a data attribute to the form for easier debugging
            $('form.cart').attr('data-rental-dates', rentalDates);
        }
        
        return rentalDates;
    }
    
    // Also hook into AJAX add to cart
    $(document.body).on('adding_to_cart', function(e, $button, data) {
        if ($('#datepicker-container').length) {
            const rentalDates = captureRentalDates() || $('#rental_dates').val();
            
            if (rentalDates) {
                data.rental_dates = rentalDates;
                console.log('Added rental_dates to AJAX data:', rentalDates);
            } else {
                console.warn('No rental dates found for AJAX add to cart');
            }
        }
    });
    
    // Initialize after a small delay to ensure all elements are loaded
    setTimeout(fixRentalFormSubmission, 1000);
});
