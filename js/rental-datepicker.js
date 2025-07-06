/**
 * Rental Date Picker for WooCommerce
 * Handles the initialization and behavior of the AirDatepicker for rental products
 */

(function($) {
    'use strict';

    // Debug logging helper
    function debugLog(...args) {
        if (window.rentalDebugEnabled) {
            // console.log('[Rental Datepicker]', ...args);
        }
    }

    /**
     * Calculate rental charge days based on the business rules:
     * 1. First day is charged at full price
     * 2. Weekdays (Mon-Thu) are grouped in 2s, each group counting as 1 rental day
     * 3. Weekend days (Fri-Sun) count as 1 rental day total, regardless of how many are included
     * 
     * @param {Date} startDate - Start date of the rental
     * @param {Date} endDate - End date of the rental
     * @return {Object} - Calculation results
     */
    function calculateRentalChargeDays(startDate, endDate) {
        const fullPriceDay = 1;
        let extraWeekdayCount = 0;
        let weekendIncluded = false;
        let details = [];
        
        // Clone start date to avoid modifying the original
        const current = new Date(startDate);
        const end = new Date(endDate);
        
        // First day is charged at full price
        details.push({
            date: formatDate(current),
            type: isWeekend(current) ? 'weekend' : 'weekday',
            charge: 'full',
            day: getDayName(current)
        });
        
        // Skip first day for additional calculation
        current.setDate(current.getDate() + 1);
        
        // Process all other days
        while (current <= end) {
            const day = current.getDay(); // 0 = Sunday, 6 = Saturday
            
            // Check if it's a weekend day
            if (day === 5 || day === 6 || day === 0) { // Friday, Saturday, or Sunday
                weekendIncluded = true;
                details.push({
                    date: formatDate(current),
                    type: 'weekend',
                    charge: 'discounted',
                    day: getDayName(current)
                });
            } else { // Weekday
                extraWeekdayCount++;
                details.push({
                    date: formatDate(current),
                    type: 'weekday',
                    charge: 'discounted',
                    day: getDayName(current)
                });
            }
            
            // Move to next day
            current.setDate(current.getDate() + 1);
        }
        
        // Calculate weekday half-days based on 2-for-1 rule
        const weekdayHalfDays = Math.ceil(extraWeekdayCount / 2);
        
        // Calculate total chargeable days
        const totalChargeableDays = fullPriceDay + weekdayHalfDays + (weekendIncluded ? 1 : 0);
        
        return {
            chargeDays: totalChargeableDays,
            extraDiscountedDays: totalChargeableDays - 1,
            weekdayCount: extraWeekdayCount,
            weekendIncluded: weekendIncluded,
            details: details
        };
    }

    // Helper function to check if a date is a weekend day
    function isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 5 || day === 6; // Sunday, Friday, Saturday
    }

    // Helper function to format date as YYYY-MM-DD
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Helper function to get day name
    function getDayName(date) {
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
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

        // console.log('Initializing rental date picker...');

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
        
        // console.log('Found product ID:', productId);

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
        debugLog('Initializing AirDatepicker...');
        
        // CRITICAL FIX: Load actual stock from data attribute if available
        const stockDataElement = document.getElementById('calendar-availability-data');
        let actualStock = initialStock;
        
        // First try from data attribute
        if (stockDataElement) {
            try {
                const stockData = JSON.parse(stockDataElement.textContent);
                if (stockData && typeof stockData.stock !== 'undefined') {
                    actualStock = parseInt(stockData.stock, 10);
                    // console.log(`[STOCK FIX] Found stock=${actualStock} in data attribute (was ${initialStock})`);
                    initialStock = actualStock; // Replace initialStock with the correct value
                }
            } catch (e) {
                console.error('Error parsing stock data:', e);
            }
        }
        
        // CRITICAL FIX: For WooCommerce Rental products, force stock to 1 if still not correct
        // This ensures fully booked logic works regardless of what the server returns
        if (initialStock > 1 && $('body').hasClass('single-product') && $('#datepicker-container').length) {
            // console.log(`[STOCK OVERRIDE] Forcing stock to 1 for rental product (was ${initialStock})`);
            initialStock = 1; // Force to 1 for rental products
        }
        
        // Always log the final stock value for debugging
        // console.log(`[FINAL STOCK] Using stock=${initialStock} for calendar rendering`);
        
        // CRITICAL FIX: Pre-process booked dates to correctly mark fully booked days
        if (bookedDates && bookedDates.length > 0) {
            // console.log(`[DATA PRE-PROCESS] Checking ${bookedDates.length} booked dates with stock=${initialStock}`);
            
            bookedDates.forEach(date => {
                if (date.count >= initialStock) {
                    date.status = 'fully_booked';
                    // console.log(`[DATA FIX] Forcing fully booked status for ${date.date} (${date.count}/${initialStock})`);
                }
            });
        }
        
        try {
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
                    date: dateStr,
                    isEdgeDay: false, // Default to false, we'll identify edge days later
                    isEdgeStart: false, // First day of booking sequence
                    isEdgeEnd: false    // Last day of booking sequence
                };
                
                debugLog(`Processed date: ${dateStr}`, {
                    status: status,
                    count: item.count,
                    initialStock: initialStock,
                    isFullyBooked: isFullyBooked
                });
            });
            
            // ENHANCED EDGE DAY LOGIC:
            // Identify edge days (days that can be used for joined bookings)
            debugLog('Identifying edge days for joined bookings...');
            const dateKeys = Object.keys(dateStatus).sort();
            
            // Identify booking sequences and mark start/end edges
            debugLog('Identifying booking sequences and their edge days...');
            
            // First pass: Find booking sequences (continuous fully booked days)
            let sequences = [];
            let currentSequence = [];
            
            for (let i = 0; i < dateKeys.length; i++) {
                const currentDate = dateKeys[i];
                
                // If fully booked, add to current sequence
                if (dateStatus[currentDate].status === 'fully_booked') {
                    currentSequence.push(currentDate);
                } else {
                    // If we have a sequence and encounter a non-fully-booked day, end the sequence
                    if (currentSequence.length > 0) {
                        sequences.push([...currentSequence]);
                        currentSequence = [];
                    }
                }
                
                // If this is the last date and we have a sequence, add it
                if (i === dateKeys.length - 1 && currentSequence.length > 0) {
                    sequences.push([...currentSequence]);
                }
            }
            
            debugLog(`Found ${sequences.length} booking sequences`, sequences);
            
            // Second pass: Mark start and end edges for each sequence
            sequences.forEach((sequence, idx) => {
                if (sequence.length > 0) {
                    const startDate = sequence[0];
                    const endDate = sequence[sequence.length - 1];
                    
                    // Mark the start edge (can be selected as end of a new booking)
                    dateStatus[startDate].isEdgeStart = true;
                    dateStatus[startDate].isEdgeDay = true;
                    
                    // Mark the end edge (can be selected as start of a new booking)
                    dateStatus[endDate].isEdgeEnd = true;
                    dateStatus[endDate].isEdgeDay = true;
                    
                    debugLog(`Sequence ${idx+1}: Marked ${startDate} as START EDGE, ${endDate} as END EDGE`);
                }
            });
            
            // For multi-unit rentals, add additional edge day logic
            if (initialStock > 1) {
                // For multi-unit rentals, identify edge days more intelligently
                for (let i = 0; i < dateKeys.length; i++) {
                    const currentDate = dateKeys[i];
                    const prevDate = i > 0 ? dateKeys[i-1] : null;
                    const nextDate = i < dateKeys.length - 1 ? dateKeys[i+1] : null;
                    
                    // Only process fully booked dates that aren't already edge days
                    if (dateStatus[currentDate].status === 'fully_booked' && 
                        !dateStatus[currentDate].isEdgeStart && 
                        !dateStatus[currentDate].isEdgeEnd) {
                        
                        // ENHANCED EDGE DAY DETECTION:
                        // Additional cases for multi-unit rentals
                        const isPrevDayFullyBooked = prevDate && dateStatus[prevDate].status === 'fully_booked';
                        const isNextDayFullyBooked = nextDate && dateStatus[nextDate].status === 'fully_booked';
                        
                        // Mark as edge day if adjacent to a non-fully booked day
                        if (!isPrevDayFullyBooked || !isNextDayFullyBooked) {
                            dateStatus[currentDate].isEdgeDay = true;
                            debugLog(`✅ Marked ${currentDate} as additional EDGE DAY for multi-unit rental`);
                        }
                    }
                }
                
                // Special handling for weekends: ensure Friday-Sunday is treated as one day
                for (let i = 0; i < dateKeys.length - 2; i++) {
                    const friday = dateKeys[i];
                    const saturday = dateKeys[i+1];
                    const sunday = dateKeys[i+2];
                    
                    const fridayDate = new Date(friday);
                    const saturdayDate = new Date(saturday);
                    const sundayDate = new Date(sunday);
                    
                    // Check if these are consecutive Friday, Saturday, Sunday
                    if (fridayDate.getDay() === 5 && 
                        saturdayDate.getDay() === 6 && 
                        sundayDate.getDay() === 0 &&
                        (saturdayDate - fridayDate) === 86400000 && // 1 day in ms
                        (sundayDate - saturdayDate) === 86400000) {
                        
                        // If any of these days is fully booked, mark all as edge days
                        if (dateStatus[friday]?.status === 'fully_booked' || 
                            dateStatus[saturday]?.status === 'fully_booked' || 
                            dateStatus[sunday]?.status === 'fully_booked') {
                            
                            [friday, saturday, sunday].forEach(day => {
                                if (dateStatus[day]) {
                                    dateStatus[day].isEdgeDay = true;
                                    debugLog(`✅ Weekend special - marked ${day} as EDGE DAY (Friday-Sunday block)`);
                                }
                            });
                        }
                    }
                }
            }
            
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
            
            // Initialize the datepicker with full configuration
            const datepicker = new AirDatepicker('#datepicker-container', {
                inline: true,
                range: true,
                multipleDatesSeparator: ' - ',
                minDate: new Date(),
                // Allow selecting the same date twice for same-day booking
                toggleSelected: false,
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
                    const isSaturday = dayOfWeek === 6; // 6 = Saturday (only block Saturdays)
                    
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
                            isEdgeDay: status.isEdgeDay,
                            initialStock: initialStock,
                            forceFullyBooked: status.status === 'fully_booked'
                        });
                        
                        if (isFullyBooked) {
                            // For single unit rentals, all dates are fully booked (no edge days)
                            if (initialStock === 1) {
                                // Check if it's a start or end edge day - those are selectable for joining bookings
                                if (status.isEdgeStart) {
                                    return {
                                        classes: 'air-datepicker-cell--edge-start',
                                        attributes: {
                                            'title': 'Can be selected as the end of your booking'
                                        }
                                    };
                                } else if (status.isEdgeEnd) {
                                    return {
                                        classes: 'air-datepicker-cell--edge-end',
                                        attributes: {
                                            'title': 'Can be selected as the start of your booking'
                                        }
                                    };
                                } else {
                                    // Middle days remain disabled
                                    return {
                                        disabled: true,
                                        classes: 'air-datepicker-cell--disabled -disabled-',
                                        attributes: {
                                            'title': 'Fully booked - not available (1/1)'
                                        }
                                    };
                                }
                            }
                            
                            // For multi-unit rentals, handle edge days
                            if (status.isEdgeDay) {
                                return {
                                    // Edge days are selectable for multi-unit rentals (allows joined bookings)
                                    classes: 'air-datepicker-cell--edge-day',
                                    attributes: {
                                        'title': 'Can be selected as first or last day of your booking'
                                    }
                                };
                            } else {
                                // Middle days remain disabled to prevent overlapping bookings
                                return {
                                    disabled: true,
                                    classes: 'air-datepicker-cell--disabled -disabled-',
                                    attributes: {
                                        'title': `Fully booked - not available (${status.count}/${initialStock})`
                                    }
                                };
                            }
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
                onSelect: function({date, formattedDate, datepicker}) {
                    const $rentalDisplay = $('#rental-dates-display');
                    const $startDateElement = $('#selected-start-date');
                    const $endDateElement = $('#selected-end-date');
                    const $daysCountElement = $('#rental-days-count');
                    const $errorContainer = $('#rental-dates-error');
                    
                    debugLog('onSelect triggered with:', {
                        date: date,
                        formattedDate: formattedDate
                    });
                    
                    // Clear any previous error messages
                    $errorContainer.empty().hide();
                    
                    // Handle date selection logic
                    if (!date || date.length === 0) {
                        // No dates selected
                        $dateInput.val('');
                        $('.btn-wrap button').prop('disabled', true);
                        $rentalDisplay.hide();
                        return;
                    }
                    
                    // Check for same-day booking (clicked same date twice)
                    if (date.length === 1) {
                        // Force same-day booking (set both start and end dates to the same date)
                        const selectedDate = new Date(date[0]);
                        
                        debugLog('Creating same-day booking for', selectedDate);
                        
                        // Set both start and end dates to the selected date for same-day booking
                        datepicker.selectDate([selectedDate, selectedDate]);
                        
                        // This will trigger onSelect again with date.length = 2
                        return;
                    }
                    
                    // Handle date range selection (2 dates)
                    if (date.length === 2) {
                        // Check if it's a same-day booking (both dates are the same)
                        const isSameDayBooking = date[0].getTime() === date[1].getTime();
                        
                        // Use UTC methods to avoid timezone issues
                        const startDate = new Date(date[0]);
                        const endDate = new Date(date[1]);
                        
                        // Create properly formatted date strings with adjusted timezone
                        // This ensures the displayed dates match what the user selected
                        const startDateStr = startDate.getFullYear() + '-' + 
                            String(startDate.getMonth() + 1).padStart(2, '0') + '-' + 
                            String(startDate.getDate()).padStart(2, '0');
                            
                        const endDateStr = endDate.getFullYear() + '-' + 
                            String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
                            String(endDate.getDate()).padStart(2, '0');
                        
                        // Calculate days between start and end dates (handle same-day case)
                        const msDiff = isSameDayBooking ? 0 : (endDate.getTime() - startDate.getTime());
                        const totalCalendarDays = isSameDayBooking ? 1 : Math.ceil(msDiff / (1000 * 60 * 60 * 24)) + 1;
                        
                        // Calculate rental days based on weekday/weekend rules
                        const rentalDayCalculation = calculateRentalChargeDays(startDate, endDate);
                        const rentalDays = rentalDayCalculation.chargeDays;
                        
                        debugLog('Weekday/Weekend rental calculation:', {
                            calendarDays: totalCalendarDays,
                            chargeDays: rentalDays,
                            startDate: startDateStr,
                            endDate: endDateStr,
                            isSameDayBooking: isSameDayBooking,
                            weekdayCount: rentalDayCalculation.weekdayCount,
                            weekendIncluded: rentalDayCalculation.weekendIncluded,
                            details: rentalDayCalculation.details
                        });
                        
                        // Update the display with the correct dates (matching what user selected)
                        $startDateElement.text(startDateStr);
                        $endDateElement.text(endDateStr);
                        $daysCountElement.text(rentalDays);
                        $rentalDisplay.show();
                        
                        // Update the hidden input with correct date range
                        $dateInput.val(`${startDateStr} - ${endDateStr}`);
                        
                        // Enable the buttons
                        $('.btn-wrap button').prop('disabled', false);
                        
                        // Trigger custom event for price calculation
                        $(document).trigger('rentalDatesSelected', {
                            startDate: startDateStr,
                            endDate: endDateStr,
                            days: rentalDays,
                            dayCount: totalCalendarDays
                        });
                        
                        debugLog('Date range selected:', {
                            startDate: startDateStr,
                            endDate: endDateStr,
                            days: rentalDays,
                            dayCount: totalCalendarDays
                        });
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
