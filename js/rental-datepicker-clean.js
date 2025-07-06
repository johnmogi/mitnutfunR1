/**
 * Rental Date Picker for WooCommerce
 * Clean version with essential functionality
 */

(function($) {
    'use strict';

    // Debug logging helper
    function debugLog(...args) {
        if (window.console && window.// console.log) {
            // console.log('[Rental Datepicker]', ...args);
        }
    }

    // Error logging helper
    function debugError(...args) {
        if (window.console && window.console.error) {
            console.error('[Rental Datepicker]', ...args);
        }
    }

    // Format date as YYYY-MM-DD
    function formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    // Calculate days between dates, excluding disabled days
    function calculateDays(startDate, endDate, disabledDays = []) {
        let count = 0;
        const current = new Date(startDate);
        
        while (current <= endDate) {
            if (!disabledDays.includes(current.getDay())) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        
        return count;
    }

    // Initialize the date picker
    function initializeDatePicker(settings = {}) {
        const $container = $('#datepicker-container');
        const $startDate = $('#rental_start_date');
        const $endDate = $('#rental_end_date');
        const $daysCount = $('#rental_days_count');
        const $totalPrice = $('#rental_total_price');
        
        if (!$container.length) {
            debugError('Datepicker container not found');
            return;
        }
        
        // Initialize the date picker
        $container.airdatepicker({
            language: settings.locale || 'he',
            minDate: new Date(),
            dateFormat: 'yyyy-mm-dd',
            range: true,
            multipleDatesSeparator: ' - ',
            onSelect: function(formattedDate, date, inst) {
                if (date && date.length === 2) {
                    const startDate = date[0];
                    const endDate = date[1];
                    const daysCount = calculateDays(startDate, endDate, settings.disabledDays);
                    const totalPrice = daysCount * (settings.pricePerDay || 0);
                    
                    // Update form fields
                    if ($startDate.length) $startDate.val(formatDate(startDate));
                    if ($endDate.length) $endDate.val(formatDate(endDate));
                    if ($daysCount.length) $daysCount.val(daysCount);
                    if ($totalPrice.length) $totalPrice.val(totalPrice);
                    
                    // Update display
                    $('#rental-dates-display').text(`${formatDate(startDate)} - ${formatDate(endDate)}`);
                    $('#rental-days-count-display').text(daysCount);
                    $('#rental-total-price-display').text(`${settings.currencySymbol || '₪'}${totalPrice.toFixed(2)}`);
                }
            },
            onRenderCell: function(date, cellType) {
                if (cellType === 'day') {
                    const dateStr = formatDate(date);
                    
                    // Disable booked dates
                    if (settings.bookedDates && settings.bookedDates.includes(dateStr)) {
                        return { disabled: true, classes: 'booked' };
                    }
                    
                    // Disable specific weekdays
                    if (settings.disabledDays && settings.disabledDays.includes(date.getDay())) {
                        return { disabled: true, classes: 'disabled' };
                    }
                }
                
                return {};
            }
        });
        
        debugLog('Date picker initialized');
    }

    // Initialize the rental date picker
    function initRentalDatePicker() {
        debugLog('Initializing rental date picker...');
        
        // Only run on product pages
        if (!$('body').hasClass('single-product')) {
            debugLog('Not a single product page');
            return;
        }
        
        // Check for container
        if ($('#datepicker-container').length === 0) {
            debugError('Datepicker container not found');
            return;
        }

        // Get product ID
        const $product = $('form.cart');
        const productId = $product.data('product_id');
        
        if (!productId) {
            debugError('Could not determine product ID');
            return;
        }
        
        // Get settings from data attributes
        const $rentalData = $('#rental-dates');
        const settings = {
            minDays: $rentalData.data('min-days') || 1,
            maxDays: $rentalData.data('max-days') || 30,
            disabledDays: $rentalData.data('disabled-days') || [],
            bookedDates: $rentalData.data('booked-dates') || [],
            initialStock: $rentalData.data('initial-stock') || 1,
            pricePerDay: parseFloat($rentalData.data('price-per-day')) || 0,
            currencySymbol: $rentalData.data('currency-symbol') || '₪',
            locale: $rentalData.data('locale') || 'he',
            isAdmin: $rentalData.data('is-admin') === true
        };
        
        debugLog('Rental settings:', settings);
        
        // Initialize the date picker
        try {
            initializeDatePicker(settings);
        } catch (error) {
            debugError('Error initializing date picker:', error);
            $('#datepicker-container').html(`
                <div class="error">
                    <p>Error initializing date picker. Please refresh the page.</p>
                </div>
            `);
        }
    }
    
    // Initialize when document is ready
    $(document).ready(function() {
        initRentalDatePicker();
    });
    
})(jQuery);
