/**
 * Rental Datepicker Fix
 * Ensures rental dates are properly sent to cart
 */
jQuery(document).ready(function($) {
    'use strict';
    
    // console.log('RENTAL DATEPICKER FIX LOADED');
    
    // Track rental dates in local storage for debugging
    function saveRentalDatesToStorage(startDate, endDate) {
        try {
            localStorage.setItem('rental_dates_start', startDate);
            localStorage.setItem('rental_dates_end', endDate);
            localStorage.setItem('rental_dates_timestamp', new Date().getTime());
            // console.log('Saved rental dates to localStorage:', startDate, endDate);
        } catch(e) {
            console.error('Error saving to localStorage:', e);
        }
    }
    
    // Product page fix - ensure rental dates are added to cart
    function fixAddToCartForm() {
        // Listen for add to cart form submission
        $('form.cart').on('submit', function(e) {
            // console.log('Cart form submit detected');
            const $form = $(this);
            
            // Check if this is a rental product
            const $datepicker = $('#rental-datepicker');
            if ($datepicker.length > 0) {
                // console.log('This is a rental product form');
                
                // Look for rental dates
                let rentalDates = '';
                
                // Try different sources for rental dates
                if (window.rental_dates) {
                    rentalDates = window.rental_dates;
                    // console.log('Found window.rental_dates:', rentalDates);
                } else if ($datepicker.val()) {
                    rentalDates = $datepicker.val();
                    // console.log('Found datepicker value:', rentalDates);
                } else if (window.selectedDates && window.selectedDates.length === 2) {
                    // Format from selectedDates array
                    const start = formatDate(window.selectedDates[0]);
                    const end = formatDate(window.selectedDates[1]);
                    rentalDates = start + ' - ' + end;
                    // console.log('Created rental dates from selectedDates:', rentalDates);
                }
                
                if (rentalDates) {
                    // Ensure we have a hidden input field for rental dates
                    let $rentalDatesInput = $form.find('input[name="rental_dates"]');
                    if (!$rentalDatesInput.length) {
                        // console.log('Creating rental_dates hidden input');
                        $rentalDatesInput = $('<input type="hidden" name="rental_dates" />');
                        $form.append($rentalDatesInput);
                    }
                    
                    // Set the value
                    $rentalDatesInput.val(rentalDates);
                    // console.log('Set rental_dates input value:', rentalDates);
                    
                    // Also create data attributes for easier reference
                    $form.attr('data-rental-dates', rentalDates);
                    
                    // Parse dates and save to storage
                    if (rentalDates.includes('-')) {
                        const dateParts = rentalDates.split('-');
                        if (dateParts.length === 2) {
                            saveRentalDatesToStorage(dateParts[0].trim(), dateParts[1].trim());
                        }
                    }
                } else {
                    console.warn('No rental dates found when adding to cart!');
                }
            }
        });
    }
    
    // Helper function to format dates
    function formatDate(date) {
        if (!(date instanceof Date)) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return day + '/' + month + '/' + year;
    }
    
    // Check if we need to hook into the AJAX add to cart process
    function fixAjaxAddToCart() {
        $(document.body).on('adding_to_cart', function(e, $button, data) {
            // console.log('AJAX adding_to_cart event detected');
            
            // Check if this is a rental product
            const $datepicker = $('#rental-datepicker');
            if ($datepicker.length > 0) {
                // console.log('This is a rental product AJAX add');
                
                // Try to find rental dates
                let rentalDates = '';
                
                if (window.rental_dates) {
                    rentalDates = window.rental_dates;
                } else if ($datepicker.val()) {
                    rentalDates = $datepicker.val();
                } else if (window.selectedDates && window.selectedDates.length === 2) {
                    // Format from selectedDates array
                    const start = formatDate(window.selectedDates[0]);
                    const end = formatDate(window.selectedDates[1]);
                    rentalDates = start + ' - ' + end;
                }
                
                if (rentalDates) {
                    // Add rental dates to the AJAX data
                    data.rental_dates = rentalDates;
                    // console.log('Added rental_dates to AJAX data:', rentalDates);
                    
                    // Also save to storage
                    if (rentalDates.includes('-')) {
                        const dateParts = rentalDates.split('-');
                        if (dateParts.length === 2) {
                            saveRentalDatesToStorage(dateParts[0].trim(), dateParts[1].trim());
                        }
                    }
                } else {
                    console.warn('No rental dates found for AJAX add to cart!');
                }
            }
        });
    }
    
    // Initialize fixes
    function initFixes() {
        // console.log('Initializing rental datepicker fixes');
        fixAddToCartForm();
        fixAjaxAddToCart();
        
        // Diagnostic: Check if localStorage has rental dates
        try {
            const savedStart = localStorage.getItem('rental_dates_start');
            const savedEnd = localStorage.getItem('rental_dates_end');
            if (savedStart && savedEnd) {
                // console.log('Found saved rental dates in localStorage:', savedStart, savedEnd);
            }
        } catch(e) {}
    }
    
    // Initialize with a slight delay
    setTimeout(initFixes, 500);
});
