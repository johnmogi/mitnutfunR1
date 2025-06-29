/**
 * Rental Date Picker for WooCommerce
 * Handles the initialization and behavior of the AirDatepicker for rental products
 */

(function($) {
    'use strict';

    // Initialize the rental date picker
    function initRentalDatePicker() {
        // Only run on product pages with our datepicker container
        if (!$('body').hasClass('single-product') || $('#datepicker-container').length === 0) {
            return;
        }

        console.log('Initializing rental date picker...');

        // Get product ID from the data attribute we added to the content div
        let productId = $('.content[data-product-id]').data('product-id');
        
        // Fallback to other selectors if needed
        if (!productId) {
            productId = $('input[name="add-to-cart"]').val();
            
            // If not found, try getting from the product container data attribute
            if (!productId) {
                productId = $('div[data-product_id]').data('product_id');
            }
            
            // If still not found, try to parse from the URL
            if (!productId && window.location.href.indexOf('post_type=product') > -1) {
                const urlParams = new URLSearchParams(window.location.search);
                productId = urlParams.get('p') || urlParams.get('post');
            }
        }
        
        if (!productId) {
            console.error('Could not find product ID. Selectors checked:', {
                'input[name="add-to-cart"]': $('input[name="add-to-cart"]').length,
                'div[data-product_id]': $('div[data-product_id]').length,
                'URL params': window.location.href
            });
            return;
        }
        
        console.log('Found product ID:', productId);

        // Get initial stock level
        const initialStock = parseInt($('.stock').text().match(/\d+/) || '1');
        
        // Get booked dates via AJAX
        if (typeof rentalDatepickerVars === 'undefined') {
            console.error('rentalDatepickerVars is not defined');
            return;
        }

        console.log('Fetching rental dates for product ID:', productId);
        
        $.ajax({
            url: rentalDatepickerVars.ajax_url,
            type: 'POST',
            data: {
                action: 'get_rental_dates',
                product_id: productId,
                nonce: rentalDatepickerVars.nonce
            },
            dataType: 'json',
            success: function(response) {
                if (response.success && response.data && response.data.dates) {
                    initializeDatePicker(response.data.dates, initialStock);
                } else {
                    console.error('Failed to load rental dates', response);
                    // Initialize with empty dates if API fails
                    initializeDatePicker([], initialStock);
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading rental dates:', error);
                // Initialize with empty dates if API fails
                initializeDatePicker([], initialStock);
            }
        });
    }


    // Initialize the AirDatepicker with the given dates
    function initializeDatePicker(bookedDates, initialStock) {
        const $container = $('#datepicker-container');
        const $dateInput = $('#rental_dates');
        
        // Prepare disabled dates for the datepicker
        const disabledDates = [];
        const dateStatus = {};
        
        // Process the booked dates
        bookedDates.forEach(function(item) {
            if (item.status === 'fully_booked' || item.count >= initialStock) {
                disabledDates.push(item.date);
            }
            dateStatus[item.date] = item;
        });
        
        // Helper to format date as YYYY-MM-DD
        function formatDate(date) {
            return date.toISOString().split('T')[0];
        }
        
        // Initialize the datepicker
        const datepicker = new AirDatepicker('#datepicker-container', {
            inline: true,
            range: true,
            multipleDatesSeparator: ' - ',
            minDate: new Date(),
            locale: {
                days: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
                daysShort: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
                daysMin: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
                months: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
                monthsShort: ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'],
                today: 'היום',
                clear: 'נקה',
                dateFormat: 'yyyy-MM-dd',
                timeFormat: 'HH:mm',
                firstDay: 0
            },
            onRenderCell: function({date, cellType}) {
                if (cellType === 'day') {
                    const dateStr = formatDate(date);
                    const status = dateStatus[dateStr];
                    
                    // Skip if no status for this date
                    if (!status) return;
                    
                    // Add appropriate CSS class based on status
                    if (status.status === 'fully_booked' || status.count >= initialStock) {
                        return {
                            disabled: true,
                            classes: 'air-datepicker-cell--disabled -disabled-'
                        };
                    } else if (status.status === 'partially_booked') {
                        return {
                            classes: 'air-datepicker-cell--partially-booked'
                        };
                    }
                }
                
                // Disable Saturdays (day 6, 0-indexed)
                if (date.getDay() === 6) { // 6 = Saturday
                    return {
                        disabled: true,
                        classes: 'air-datepicker-cell--weekend -weekend-'
                    };
                }
            },
            onSelect: function({date, formattedDate}) {
                if (!date || date.length === 0) {
                    $dateInput.val('');
                    $('.btn-wrap button').prop('disabled', true);
                    return;
                }
                
                // Handle date range selection
                if (date.length === 2) {
                    const startDate = new Date(date[0]);
                    const endDate = new Date(date[1]);
                    
                    // Calculate number of days, excluding Saturdays
                    let days = 0;
                    let currentDate = new Date(startDate);
                    
                    while (currentDate <= endDate) {
                        // Skip Saturdays (day 6, 0-indexed)
                        if (currentDate.getDay() !== 6) {
                            days++;
                        }
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                    
                    // Update the quantity field
                    $('[name="quantity"]').val(days);
                    
                    // Format the date range for display
                    const formattedStart = startDate.toLocaleDateString('he-IL');
                    const formattedEnd = endDate.toLocaleDateString('he-IL');
                    $dateInput.val(`${formattedStart} - ${formattedEnd}`);
                    
                    // Enable/disable add to cart button
                    $('.btn-wrap button').prop('disabled', days === 0);
                } else if (date.length === 1) {
                    // Single date selected
                    $dateInput.val(formattedDate[0]);
                    $('[name="quantity"]').val(1);
                    $('.btn-wrap button').prop('disabled', false);
                }
            }
        });
        
        console.log('Rental date picker initialized');
        return datepicker;
    }

    // Initialize when document is ready
    $(document).ready(function() {
        initRentalDatePicker();
    });
    
})(jQuery);
