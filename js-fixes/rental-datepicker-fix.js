/**
 * Rental Date Picker Fix for WooCommerce
 * This script fixes the [object HTMLCollection] issue in rental_dates input
 * It only contains the essential fix without duplicating the entire script
 */

(function($) {
    'use strict';

    // Run when document is ready
    $(document).ready(function() {
        console.log('[Rental Fix] Initializing rental datepicker fix');
        
        // Only run on single product pages with datepicker
        if (!$('body').hasClass('single-product') || !$('#datepicker-container').length) {
            return;
        }
        
        // Log found inputs for debugging
        const rentalInputsAll = $('input[name="rental_dates"]');
        console.log('[Rental Fix] Found rental_dates inputs:', rentalInputsAll.length);
        
        // CRITICAL FIX: Monitor AirDatepicker selections
        // This addresses the [object HTMLCollection] issue
        $(document).on('click', '.air-datepicker-cell', function() {
            // Short delay to let AirDatepicker process the selection
            setTimeout(function() {
                // Find the proper rental_dates input in the form
                const $formDateInput = $('form.cart input[name="rental_dates"]');
                
                // If we have an input but its value contains [object HTMLCollection]
                if ($formDateInput.length && $formDateInput.val().includes('[object')) {
                    console.log('[Rental Fix] Detected invalid rental_dates value, fixing...');
                    
                    // Get the selected dates from AirDatepicker
                    const datepicker = window.datepicker;
                    if (datepicker && datepicker.selectedDates && datepicker.selectedDates.length === 2) {
                        const startDate = new Date(datepicker.selectedDates[0]);
                        const endDate = new Date(datepicker.selectedDates[1]);
                        
                        // Format dates properly
                        const formattedStart = startDate.toLocaleDateString('he-IL');
                        const formattedEnd = endDate.toLocaleDateString('he-IL');
                        const dateValue = formattedStart + ' - ' + formattedEnd;
                        
                        // Set the value correctly
                        $formDateInput.val(dateValue);
                        console.log('[Rental Fix] Fixed rental_dates input value:', dateValue);
                    } else {
                        // Clear the value if no valid date selection
                        $formDateInput.val('');
                        console.log('[Rental Fix] Cleared invalid rental_dates value');
                    }
                }
            }, 100);
        });
        
        // Also fix before form submission
        $('form.cart').on('submit', function(e) {
            const $formDateInput = $(this).find('input[name="rental_dates"]');
            
            // Check for invalid value
            if ($formDateInput.length && $formDateInput.val().includes('[object')) {
                console.log('[Rental Fix] Fixing rental_dates value before submission');
                
                // Get the selected dates from the visible display
                const startDate = $('#selected-start-date').text();
                const endDate = $('#selected-end-date').text();
                
                // If we have valid dates in the display, use them
                if (startDate && endDate) {
                    const dateValue = startDate + ' - ' + endDate;
                    $formDateInput.val(dateValue);
                    console.log('[Rental Fix] Set rental_dates to:', dateValue);
                } else {
                    // If we can't get valid dates, prevent submission
                    e.preventDefault();
                    console.log('[Rental Fix] Prevented form submission due to invalid dates');
                    alert('יש לבחור תאריכי השכרה לפני הוספה לסל');
                }
            }
        });
    });
    
})(jQuery);
