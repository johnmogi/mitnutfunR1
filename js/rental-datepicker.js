/**
 * Rental Date Picker for WooCommerce
 * Handles the initialization and behavior of the AirDatepicker for rental products
 */

(function($) {
    'use strict';

    // Debug logging helper
    function debugLog(...args) {
        console.log('[Rental Datepicker]', ...args);
    }

    // Initialize the rental date picker
    function initRentalDatePicker() {
        debugLog('Initializing rental date picker...');
        
        // Only run on product pages with our datepicker container
        if (!$('body').hasClass('single-product')) {
            debugLog('Not a single product page');
            return;
        }
        
        if ($('#datepicker-container').length === 0) {
            debugError('Datepicker container (#datepicker-container) not found on page');
            return;
        }

        console.log('Initializing rental date picker...');

        // Get product ID from the data attribute we added to the content div
        debugLog('Looking for product ID...');
        
        // Try to get product ID from various sources
        const productSources = [
            { selector: '.content[data-product-id]', type: 'data-product-id' },
            { selector: 'input[name="add-to-cart"]', type: 'value' },
            { selector: 'div[data-product_id]', type: 'data-product_id' },
            { selector: 'form.cart[data-product_id]', type: 'form-data' }
        ];
        
        let productId = null;
        for (const source of productSources) {
            const $el = $(source.selector);
            if ($el.length) {
                if (source.type === 'data-product-id') {
                    productId = $el.data('product-id');
                } else if (source.type === 'data-product_id') {
                    productId = $el.data('product_id');
                } else if (source.type === 'form-data') {
                    productId = $el.data('product_id') || $el.find('input[name="add-to-cart"]').val();
                } else {
                    productId = $el.val();
                }
                
                if (productId) {
                    debugLog(`Found product ID: ${productId} from ${source.selector} (${source.type})`);
                    break;
                }
            }
        }
        
        // Last resort: try to parse from URL
        if (!productId && window.location.href.indexOf('post_type=product') > -1) {
            const urlParams = new URLSearchParams(window.location.search);
            productId = urlParams.get('p') || urlParams.get('post');
            if (productId) {
                debugLog(`Found product ID from URL: ${productId}`);
            }
        }
        
        if (!productId) {
            debugError('Could not find product ID. Selectors checked:', {
                '.content[data-product-id]': $('.content[data-product-id]').length,
                'input[name="add-to-cart"]': $('input[name="add-to-cart"]').length,
                'div[data-product_id]': $('div[data-product_id]').length,
                'form.cart[data-product_id]': $('form.cart[data-product_id]').length,
                'URL params': window.location.href
            });
            return;
        }
        
        console.log('Found product ID:', productId);

        // Get initial stock level
        let initialStock = 1;
        const $stockElement = $('.stock');
        if ($stockElement.length) {
            const stockMatch = $stockElement.text().match(/\d+/);
            if (stockMatch) {
                initialStock = parseInt(stockMatch[0], 10);
            }
        } else {
            debugLog('Stock element not found, using default initial stock: 1');
        }
        
        debugLog(`Initial stock: ${initialStock}`);
        
        // Get booked dates via AJAX
        if (typeof rentalDatepickerVars === 'undefined') {
            debugError('rentalDatepickerVars is not defined. Make sure it is localized in PHP.');
            return;
        }

        debugLog(`Fetching rental dates for product ID: ${productId}`);
        debugLog('AJAX URL:', rentalDatepickerVars.ajax_url);
        
        // Add loading state
        $('#datepicker-container').addClass('loading').html('<div class="loading-spinner">Loading availability...</div>');
        
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
                debugLog('AJAX response received:', response);
                
                if (response.success && response.data && response.data.dates) {
                    debugLog(`Received ${response.data.dates.length} date entries`);
                    
                    // Log first few dates for debugging
                    if (response.data.dates.length > 0) {
                        debugLog('Sample date entries:', response.data.dates.slice(0, 5));
                    }
                    
                    initializeDatePicker(response.data.dates, initialStock);
                } else {
                    debugError('Failed to load rental dates', {
                        success: response.success,
                        hasData: !!response.data,
                        hasDates: !!(response.data && response.data.dates),
                        response: response
                    });
                    // Initialize with empty dates if API fails
                    initializeDatePicker([], initialStock);
                }
            },
            error: function(xhr, status, error) {
                debugError('Error loading rental dates:', {
                    status: status,
                    error: error,
                    responseText: xhr.responseText
                });
                // Initialize with empty dates if API fails
                initializeDatePicker([], initialStock);
            },
            complete: function() {
                $('#datepicker-container').removeClass('loading');
            }
        });
    }


    // Helper function to format date as YYYY-MM-DD
    function formatDate(date) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }
    
    // Helper function to get date string from Date object
    function getDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Initialize the AirDatepicker with the given dates
    function initializeDatePicker(bookedDates, initialStock) {
        debugLog('Initializing date picker with params:', { 
            bookedDatesCount: bookedDates.length, 
            initialStock: initialStock 
        });
        
        const $container = $('#datepicker-container');
        const $dateInput = $('#rental_dates');
        
        // Clear any existing datepicker
        $container.empty();
        
        debugLog('Container element:', $container[0]);
        debugLog('Date input element:', $dateInput[0] || 'Not found');
        
        // Prepare date status tracking
        const dateStatus = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Process the booked dates
        debugLog('Processing booked dates...');
        bookedDates.forEach(function(item) {
            const dateStr = formatDate(item.date);
            const date = new Date(item.date);
            
            // Skip past dates
            if (date < today) {
                debugLog(`Skipping past date: ${dateStr}`);
                return;
            }
            
            // Determine status
            const isFullyBooked = item.status === 'fully_booked' || item.count >= initialStock;
            const status = isFullyBooked ? 'fully_booked' : 'partially_booked';
            
            // Store status
            dateStatus[dateStr] = {
                ...item,
                status: status,
                count: item.count || 0,
                date: dateStr
            };
            
            debugLog(`Processed date: ${dateStr}`, {
                status: status,
                count: item.count,
                initialStock: initialStock,
                isFullyBooked: isFullyBooked
            });
        });
        
        // Log summary of processed dates
        const statusCounts = Object.values(dateStatus).reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        }, {});
        
        debugLog('Date processing complete. Summary:', {
            totalDates: Object.keys(dateStatus).length,
            ...statusCounts,
            initialStock: initialStock
        });
        
        // Trigger custom event for other scripts to use the date data
        $(document).trigger('rentalDatesLoaded', {
            bookedDates: Object.values(dateStatus),
            initialStock: initialStock,
            currentStock: initialStock, // No current stock value available here
            productId: $('input[name="product_id"]').val() || null
        });
        debugLog('Custom event triggered: rentalDatesLoaded');
        
        // Check if AirDatepicker is available
        if (typeof AirDatepicker === 'undefined') {
            debugError('AirDatepicker is not loaded. Make sure the script is properly enqueued.');
            $container.html('<div class="error">Error: Date picker library not loaded</div>');
            return null;
        }
        
        debugLog('Initializing AirDatepicker...');
        
        try {
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
                const dateStr = getDateString(date);
                
                // Skip if not a day cell
                if (cellType !== 'day') return;
                
                const status = dateStatus[dateStr];
                const dayOfWeek = date.getDay();
                const isSaturday = dayOfWeek === 6; // 6 = Saturday
                
                // Skip if date is in the past
                if (date < today) {
                    return {
                        disabled: true,
                        classes: 'air-datepicker-cell--past -past-'
                    };
                }
                
                // Handle Saturday (non-working day)
                if (isSaturday) {
                    return {
                        disabled: true,
                        classes: 'air-datepicker-cell--weekend -weekend-'
                    };
                }
                
                // Handle booked dates
                if (status) {
                    const isFullyBooked = status.status === 'fully_booked' || status.count >= initialStock;
                    
                    debugLog(`Rendering cell for ${dateStr}:`, {
                        status: status.status,
                        count: status.count,
                        isFullyBooked: isFullyBooked,
                        initialStock: initialStock
                    });
                    
                    if (isFullyBooked) {
                        return {
                            disabled: true,
                            classes: 'air-datepicker-cell--disabled -disabled-',
                            attributes: {
                                'title': `Fully booked (${status.count}/${initialStock})`
                            }
                        };
                    } else {
                        return {
                            classes: 'air-datepicker-cell--partially-booked',
                            attributes: {
                                'title': `Partially booked (${status.count}/${initialStock})`
                            }
                        };
                    }
                }
                
                // Default available date
                return {
                    attributes: {
                        'title': 'Available for booking'
                    }
                };
            },
            onSelect: function({date, formattedDate}) {
                // Define rawDays for backward compatibility with any code that might reference it
                let rawDays = 0;
                const $rentalDisplay = $('#rental-dates-display');
                const $startDateElement = $('#selected-start-date');
                const $endDateElement = $('#selected-end-date');
                const $daysCountElement = $('#rental-days-count');
                
                // Hide display if no dates selected
                if (!date || date.length === 0) {
                    $dateInput.val('');
                    $('.btn-wrap button').prop('disabled', true);
                    $rentalDisplay.hide();
                    return;
                }
                
                // Handle date range selection
                if (date.length === 2) {
                    const startDate = new Date(date[0]);
                    const endDate = new Date(date[1]);
                    
                    // NEW IMPLEMENTATION: Complete rewrite of day calculation to match PHP rules
                    // Count calendar days first (including all days) - make sure to count inclusively
                    // We don't need to count raw days or days by type anymore, just total calendar days
                    
                    // Initialize date counter for accurate inclusive counting
                    let tempDate = new Date(startDate);
                    let calendarDays = 0;
                    
                    // Count all days from start to end (inclusive)
                    while (tempDate <= endDate) {
                        calendarDays++;
                        tempDate.setDate(tempDate.getDate() + 1);
                    }
                    
                    // For debugging, also count days using the timestamp method
                    const timestampDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                    
                    // Log both methods to compare
                    debugLog('Calendar days count comparison:', {
                        byIteration: calendarDays,
                        byTimestamp: timestampDays,
                        startDate: startDate.toDateString(),
                        endDate: endDate.toDateString()
                    });
                    
                    debugLog('Total calendar days (inclusive counting):', calendarDays);
                    
                    // Is this a true weekend rental? (Friday to Sunday)
                    const isTrueWeekendRental = (() => {
                        const startDayOfWeek = startDate.getDay(); // 0 = Sunday, 5 = Friday
                        const endDayOfWeek = endDate.getDay();
                        
                        // Must start on Friday (5) and end on Sunday (0) with 3 or fewer days
                        return startDayOfWeek === 5 && endDayOfWeek === 0 && calendarDays <= 3;
                    })();
                    
                    debugLog('Weekend rental detection:', { 
                        calendarDays,
                        startDay: startDate.getDay(),
                        endDay: endDate.getDay(),
                        isTrueWeekendRental
                    });
                    
                    // DEBUG: Log calendar days calculation
                    debugLog('Calendar days calculation:', {
                        startDate: startDate,
                        endDate: endDate,
                        startTimestamp: startDate.getTime(),
                        endTimestamp: endDate.getTime(),
                        diff: endDate - startDate,
                        diffDays: (endDate - startDate) / (1000 * 60 * 60 * 24),
                        calendarDays: calendarDays
                    });
                    
                    // Calculate rental days according to business rules
                    let days;
                    if (isTrueWeekendRental) {
                        // Special case: Friday-Sunday counts as 1 day
                        days = 1;
                        debugLog('Weekend special applied: 1 rental day');
                    } else if (calendarDays <= 2) {
                        // 1-2 calendar days = 1 rental day
                        days = 1;
                        debugLog('1-2 days rule applied: 1 rental day');
                    } else if (calendarDays == 3) {
                        // 3 calendar days = 2 rental days
                        days = 2;
                        debugLog('3 days rule applied: 2 rental days');
                    } else if (calendarDays == 4) {
                        // 4 calendar days = 3 rental days
                        days = 3;
                        debugLog('4 days rule applied: 3 rental days');
                    } else if (calendarDays == 5) {
                        // 5 calendar days = 4 rental days
                        days = 4;
                        debugLog('5 days rule applied: 4 rental days');
                    } else if (calendarDays == 6) {
                        // 6 calendar days = 5 rental days
                        days = 5;
                        debugLog('6 days rule applied: 5 rental days');
                    } else if (calendarDays == 7 || calendarDays == 8) {
                        // 7-8 calendar days = 6 rental days
                        days = 6;
                        debugLog('7 days rule applied: 6 rental days');
                    } else {
                        // For longer periods: calendar days - 1
                        days = calendarDays - 1;
                        debugLog('Extended period: ' + days + ' rental days');
                    }
                    
                    // CRITICAL: Force deep debug output for troubleshooting
                    console.log('🔄 RENTAL DAY CALCULATION', {
                        startDate: startDate.toLocaleDateString(),
                        endDate: endDate.toLocaleDateString(),
                        calendarDays: calendarDays,
                        rentalDays: days,
                        isTrueWeekendRental: isTrueWeekendRental,
                        rule: isTrueWeekendRental ? 'weekend-special' : 
                               calendarDays <= 2 ? '1-2 days' : 
                               calendarDays <= 4 ? '3-4 days' : 
                               calendarDays === 5 ? '5 days' : 
                               calendarDays === 6 ? '6 days' : 
                               calendarDays === 7 ? '7 days' : 'extended'
                    });
                    
                    debugLog('Day calculation', {
                        startDate: startDate,
                        endDate: endDate,
                        calendarDays: calendarDays,
                        startDayOfWeek: startDate.getDay(),
                        endDayOfWeek: endDate.getDay(),
                        isWeekendRental: isTrueWeekendRental,
                        calculatedDays: days
                    });
                
                    // Update the quantity field with the rental days (not calendar days)
                    console.log('Setting quantity to:', days, '(rental days)'); 
                    $('[name="quantity"]').val(days);
                    
                    // Format the date range for display
                    const formattedStart = startDate.toLocaleDateString('he-IL');
                    const formattedEnd = endDate.toLocaleDateString('he-IL');
                    $dateInput.val(`${formattedStart} - ${formattedEnd}`);
                    
                    // Update visible date display elements with correct rental days (not calendar days)
                    $startDateElement.text(formattedStart);
                    $endDateElement.text(formattedEnd);
                    $daysCountElement.text(days);
                    
                    // CRITICAL: Force update of any other elements showing the days count
                    $('.rental-days-count').text(days); // Update any other elements with this class
                    $('input[name="rental_days"]').val(days); // Update any hidden input fields
                    
                    // Calculate pricing based on rental days
                    const productPrice = parseFloat($('.list-info .woocommerce-Price-amount').first().text().replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
                    const productId = $('input[name="add-to-cart"]').val() || 0;
                    
                    // Check if product should have discount (all except 150 and 153)
                    const hasDiscount = productId != 150 && productId != 153;
                    
                    // Calculate pricing
                    let basePrice = productPrice;
                    let totalPrice = productPrice;
                    let discountedPrice = 0;
                    
                    // Format prices with thousand separator
                    const formatPrice = (price) => {
                        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    };
                    
                    // Remove any existing price breakdown
                    $('.price-breakdown').remove();
                    
                    if (hasDiscount && days > 1) {
                        // First day full price, additional days 50% off
                        basePrice = productPrice;
                        discountedPrice = (days - 1) * (productPrice * 0.5);
                        totalPrice = basePrice + discountedPrice;
                        
                        // Generate HTML for price breakdown
                        const priceBreakdownHtml = `
                            <div class="price-breakdown" style="margin-top: 12px; border-top: 1px dashed #ccc; padding-top: 10px;">
                                <div style="margin-bottom: 5px;"><strong>מחיר:</strong></div>
                                <div style="margin-left: 15px;">יום 1: ‏${basePrice.toFixed(2)}&nbsp;‏₪</div>
                                <div style="margin-left: 15px;">${days - 1} ימים נוספים (50% הנחה): ‏${discountedPrice.toFixed(2)}&nbsp;‏₪</div>
                                <div style="margin-top: 10px;"><strong>סה"כ: ‏${formatPrice(totalPrice.toFixed(2))}&nbsp;‏₪</strong></div>
                            </div>
                        `;
                        
                        // Add the price breakdown to the rental display
                        $rentalDisplay.append(priceBreakdownHtml);
                    } else {
                        // No discount or just one day
                        const priceBreakdownHtml = `
                            <div class="price-breakdown" style="margin-top: 12px; border-top: 1px dashed #ccc; padding-top: 10px;">
                                <div style="margin-bottom: 5px;"><strong>מחיר:</strong></div>
                                <div style="margin-left: 15px;">יום 1: ‏${basePrice.toFixed(2)}&nbsp;‏₪</div>
                                <div style="margin-top: 10px;"><strong>סה"כ: ‏${formatPrice(totalPrice.toFixed(2))}&nbsp;‏₪</strong></div>
                            </div>
                        `;
                        $rentalDisplay.append(priceBreakdownHtml);
                    }
                    
                    // COMMENT: Temporarily disabled 5-day rental limit for testing
                    
                    // Remove any existing notices
                    $('.max-rental-notice').remove();
                    
                    // Enable the add to cart button
                    $('.btn-wrap button').prop('disabled', false);
                    
                    // Log for debugging
                    debugLog('Rental date selection complete', {
                        start: formattedStart,
                        end: formattedEnd,
                        days: days,
                        price: totalPrice
                    });
                    
                } else if (date.length === 1) {
                    // Single date selected
                    const singleDate = date[0].toLocaleDateString('he-IL');
                    $dateInput.val(singleDate);
                    $('[name="quantity"]').val(1);
                    
                    // Update visible date display elements for single date
                    $startDateElement.text(singleDate);
                    $endDateElement.text(singleDate);
                    $daysCountElement.text('1');
                    $rentalDisplay.show();
                    
                    $('.btn-wrap button').prop('disabled', false);
                }
            }
        });
        
            debugLog('AirDatepicker initialized successfully');
            return datepicker;
            
        } catch (error) {
            debugError('Error initializing AirDatepicker:', error);
            $container.html(`<div class="error">Error initializing date picker: ${error.message}</div>`);
            return null;
        }
    }

    // Error logging helper
    function debugError(...args) {
        console.error('[Rental Datepicker]', ...args);
    }
    
    // Initialize when document is ready
    $(document).ready(function() {
        try {
            debugLog('Document ready, initializing...');
            initRentalDatePicker();
        } catch (error) {
            debugError('Unhandled error during initialization:', error);
            
            // Show error message in the container if it exists
            const $container = $('#datepicker-container');
            if ($container.length) {
                $container.html(`
                    <div class="error">
                        <p>Error initializing date picker. Please check the console for details.</p>
                        <p>${error.message}</p>
                    </div>
                `);
            }
        }
    });
    
    // Make debug functions available globally for console access
    window.rentalDatepickerDebug = {
        reload: function() {
            debugLog('Manually reloading date picker...');
            initRentalDatePicker();
        },
        getStatus: function() {
            const $container = $('#datepicker-container');
            return {
                containerExists: $container.length > 0,
                containerHtml: $container.html(),
                productId: $('.content[data-product-id]').data('product-id') || 'Not found',
                initialStock: parseInt($('.stock').text().match(/\d+/) || '1')
            };
        }
    };
    
    // Add some basic styles for the debug UI
    const style = document.createElement('style');
    style.textContent = `
        #datepicker-container.loading {
            min-height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .loading-spinner {
            padding: 20px;
            background: #f5f5f5;
            border-radius: 4px;
            font-style: italic;
            color: #666;
        }
        .air-datepicker-cell--partially-booked {
            background: #fff3e0 !important;
            color: #e65100 !important;
        }
        .air-datepicker-cell--disabled {
            background: #ffebee !important;
            color: #b71c1c !important;
            text-decoration: line-through;
            opacity: 0.7;
        }
        .air-datepicker-cell--weekend {
            background: #f5f5f5 !important;
            color: #9e9e9e !important;
        }
        .air-datepicker-cell--past {
            opacity: 0.5;
        }
        .error {
            color: #d32f2f;
            padding: 10px;
            background: #ffebee;
            border-radius: 4px;
            margin: 10px 0;
        }
    `;
    document.head.appendChild(style);
})(jQuery);
