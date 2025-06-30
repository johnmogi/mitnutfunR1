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
                    
                    // Calculate raw days first (excluding Saturdays)
                    let rawDays = 0;
                    let currentDate = new Date(startDate);
                    
                    // First pass: Count days by type and identify patterns
                    let daysByType = {};
                    let datesByDay = [];
                    
                    while (currentDate <= endDate) {
                        const dayOfWeek = currentDate.getDay();
                        const dateStr = formatDate(currentDate);
                        
                        if (dayOfWeek !== 6) { // Skip Saturdays
                            rawDays++;
                            daysByType[dayOfWeek] = (daysByType[dayOfWeek] || 0) + 1;
                            datesByDay.push({
                                date: new Date(currentDate),
                                dayOfWeek: dayOfWeek,
                                dateStr: dateStr
                            });
                        }
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                    
                    // Detect weekend pattern (Friday + Sunday, possibly with days in between)
                    const hasFriday = daysByType[5] > 0;
                    const hasSunday = daysByType[0] > 0;
                    const hasWeekendPattern = hasFriday && hasSunday;
                    
                    debugLog('Day counts by type:', { daysByType, datesByDay, hasWeekendPattern });
                    
                    // Apply the rental day calculation rule
                    // Rule: 2 days = 1, 3 days = 2, 4 days = 3, etc.
                    // Special case: Friday-Sunday counts as 1 regardless
                    let days;
                    
                    if (hasWeekendPattern) {
                        // Find the first Friday and last Sunday in the range
                        let fridayIndex = datesByDay.findIndex(d => d.dayOfWeek === 5);
                        let lastSundayIndex = -1;
                        for (let i = datesByDay.length - 1; i >= 0; i--) {
                            if (datesByDay[i].dayOfWeek === 0) {
                                lastSundayIndex = i;
                                break;
                            }
                        }
                        
                        if (fridayIndex >= 0 && lastSundayIndex >= 0) {
                            // Count days in the weekend period (Friday to Sunday)
                            let weekendDays = lastSundayIndex - fridayIndex + 1;
                            
                            // Count days after the weekend pattern
                            let regularDays = datesByDay.length - lastSundayIndex - 1;
                            
                            // Apply special weekend rule
                            days = 1 + regularDays; // Weekend counts as 1 + any additional days
                            
                            debugLog('Weekend pattern calculation:', {
                                fridayIndex,
                                lastSundayIndex,
                                weekendDays,
                                regularDays,
                                totalCalculatedDays: days
                            });
                        } else {
                            // Standard calculation as fallback
                            days = Math.max(1, rawDays - 1); // 2→1, 3→2, 4→3, etc.
                        }
                    } else {
                        // Standard calculation: 2 days = 1, 3 days = 2, 4 days = 3, etc.
                        days = rawDays <= 1 ? rawDays : rawDays - 1;
                        debugLog('Standard day calculation:', { rawDays, calculatedDays: days });
                    }
                    
                    debugLog('Day calculation', {
                        startDate: startDate,
                        endDate: endDate,
                        rawDays: rawDays,
                        hasFriday: hasFriday,
                        hasSunday: hasSunday,
                        calculatedDays: days
                    });
                
                    // Update the quantity field
                    $('[name="quantity"]').val(days);
                    
                    // Format the date range for display
                    const formattedStart = startDate.toLocaleDateString('he-IL');
                    const formattedEnd = endDate.toLocaleDateString('he-IL');
                    $dateInput.val(`${formattedStart} - ${formattedEnd}`);
                    
                    // Calculate pricing based on rental days
                    const productPrice = parseFloat($('.list-info .woocommerce-Price-amount').first().text().replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
                    const productId = $('input[name="add-to-cart"]').val() || 0;
                    
                    // Check if product should have discount (all except 150 and 153)
                    const hasDiscount = productId != 150 && productId != 153;
                    
                    // Calculate pricing
                    let basePrice = productPrice;
                    let totalPrice = productPrice;
                    let discountedPrice = 0;
                    
                    if (hasDiscount && days > 1) {
                        // First day full price, additional days 50% off
                        basePrice = productPrice;
                        discountedPrice = (days - 1) * (productPrice * 0.5);
                        totalPrice = basePrice + discountedPrice;
                    } else {
                        // No discount or just one day
                        totalPrice = days * productPrice;
                    }
                    
                    // Format prices
                    const formatter = new Intl.NumberFormat('he-IL', {
                        style: 'currency',
                        currency: 'ILS'
                    });
                    
                    // Update visible date display elements
                    $startDateElement.text(formattedStart);
                    $endDateElement.text(formattedEnd);
                    $daysCountElement.text(days);
                    
                    // Add price breakdown if applicable
                    let priceBreakdownHtml = '';
                    
                    if (hasDiscount && days > 1) {
                        priceBreakdownHtml = `
                            <div class="price-breakdown" style="margin-top: 12px; border-top: 1px dashed #ccc; padding-top: 10px;">
                                <div style="margin-bottom: 5px;"><strong>מחיר:</strong></div>
                                <div style="margin-left: 15px;">יום 1: ${formatter.format(basePrice)}</div>
                                <div style="margin-left: 15px;">${days-1} ימים נוספים (50% הנחה): ${formatter.format(discountedPrice)}</div>
                                <div style="margin-top: 8px; font-weight: bold;">סה"כ: ${formatter.format(totalPrice)}</div>
                            </div>
                        `;
                    } else {
                        priceBreakdownHtml = `
                            <div class="price-breakdown" style="margin-top: 12px; border-top: 1px dashed #ccc; padding-top: 10px;">
                                <div style="margin-bottom: 5px;"><strong>מחיר:</strong></div>
                                <div style="margin-left: 15px;">${days} ימים: ${formatter.format(totalPrice)}</div>
                                <div style="margin-top: 8px; font-weight: bold;">סה"כ: ${formatter.format(totalPrice)}</div>
                            </div>
                        `;
                    }
                    
                    // Update the display
                    $('.price-breakdown').remove();
                    $rentalDisplay.append(priceBreakdownHtml);
                    $rentalDisplay.show();
                    
                    // Enable add to cart button
                    $('.btn-wrap button').prop('disabled', days === 0);
                    
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
