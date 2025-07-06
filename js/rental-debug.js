jQuery(document).ready(function($) {
    // Check if we're on a product page with rental data
    if (!$('body').hasClass('single-product')) {
        return; // Only run on product pages
    }
    
    // Check if the datepicker is already initialized
    const datepickerInitialized = () => $('.datepicker').length > 0;
    // Create debug panel
    const debugPanel = document.createElement('div');
    debugPanel.id = 'rental-debug-panel';
    debugPanel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 400px;
        max-height: 300px;
        overflow-y: auto;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 15px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 9999;
        font-family: monospace;
        font-size: 12px;
    `;

    // Add toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Toggle Debug';
    toggleBtn.style.cssText = `
        position: absolute;
        top: -30px;
        right: 0;
        padding: 5px 10px;
        background: #333;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
    `;

    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 10px;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
    `;

    // Add content area
    const content = document.createElement('div');
    content.id = 'rental-debug-content';

    // Assemble the panel
    debugPanel.appendChild(closeBtn);
    debugPanel.appendChild(content);
    document.body.appendChild(toggleBtn);
    document.body.appendChild(debugPanel);

    // Toggle panel visibility
    let isVisible = true;
    toggleBtn.addEventListener('click', () => {
        isVisible = !isVisible;
        debugPanel.style.display = isVisible ? 'block' : 'none';
    });

    closeBtn.addEventListener('click', () => {
        isVisible = false;
        debugPanel.style.display = 'none';
    });

    // Function to log messages to the debug panel
    window.rentalDebug = {
        log: function(message, data = null) {
            const entry = document.createElement('div');
            entry.style.margin = '5px 0';
            entry.style.padding = '5px';
            entry.style.borderBottom = '1px solid #eee';
            
            const time = new Date().toLocaleTimeString();
            const messageNode = document.createElement('div');
            messageNode.textContent = `[${time}] ${message}`;
            entry.appendChild(messageNode);

            if (data) {
                const dataNode = document.createElement('pre');
                dataNode.style.margin = '5px 0 0 0';
                dataNode.style.whiteSpace = 'pre-wrap';
                dataNode.style.fontSize = '11px';
                dataNode.style.color = '#666';
                dataNode.textContent = JSON.stringify(data, null, 2);
                entry.appendChild(dataNode);
            }

            content.insertBefore(entry, content.firstChild);
            
            // Keep only last 50 entries
            while (content.children.length > 50) {
                content.removeChild(content.lastChild);
            }
            
            // Also log to console
            // console.log(`[RentalDebug] ${message}`, data || '');
        }
    };

    // Initial debug message
    rentalDebug.log('Rental Debug Panel Initialized');

    // Monitor for datepicker initialization
    const originalDatepicker = $.fn.datepicker;
    $.fn.datepicker = function(options) {
        const selector = this.selector || (this[0] ? '#' + ($(this[0]).attr('id') || 'unnamed') : 'unknown');
        
        rentalDebug.log('Datepicker initialized', {
            selector: selector,
            element: this[0]?.tagName || 'unknown',
            options: options || {}
        });
        
        // Call original datepicker
        const instance = originalDatepicker.apply(this, arguments);
        
        // Log date selection events
        this.on('selectDate', function(e) {
            rentalDebug.log('Date selected', {
                target: e.target?.id || 'unknown',
                date: e.date ? e.date.toISOString() : 'none',
                formatted: e.formattedDate || 'none',
                dates: e.dates ? e.dates.map(d => d.toISOString()) : []
            });
        });
        
        // Log any errors
        this.on('error', function(e) {
            rentalDebug.log('Datepicker error', {
                message: e.message || 'Unknown error',
                date: e.date ? e.date.toISOString() : 'none'
            });
        });
        
        return instance;
    };

    // Check for rental data and calendar elements
    function checkRentalData() {
        // Check rental dates input
        const rentalDates = $('#rental_dates');
        if (rentalDates.length) {
            rentalDebug.log('Rental dates input', {
                id: rentalDates.attr('id'),
                value: rentalDates.val() || 'empty',
                class: rentalDates.attr('class'),
                disabled: rentalDates.prop('disabled'),
                readonly: rentalDates.prop('readonly')
            });
        }

        // Check for debug table
        const debugTable = $('.debug-table');
        if (debugTable.length) {
            const rows = debugTable.find('tr').length - 1; // exclude header
            rentalDebug.log('Found stock debug table', {
                rows: rows,
                visible: debugTable.is(':visible')
            });
            
            // Log reservation data from the table
            if (rows > 0) {
                const reservations = [];
                debugTable.find('tbody tr').each(function(i) {
                    if (i < 3) { // Only log first 3 to avoid too much output
                        const cols = $(this).find('td');
                        reservations.push({
                            order_id: $(cols[0]).text().trim(),
                            status: $(cols[1]).text().trim(),
                            start_date: $(cols[2]).text().trim(),
                            end_date: $(cols[3]).text().trim(),
                            quantity: $(cols[4]).text().trim()
                        });
                    }
                });
                if (reservations.length > 0) {
                    rentalDebug.log('Reservation data', {
                        count: rows,
                        reservations: reservations
                    });
                }
            }
        }

        // Check for datepicker elements
        const datepickers = $('.datepicker');
        if (datepickers.length) {
            rentalDebug.log('Datepicker elements found', {
                count: datepickers.length,
                visible: datepickers.filter(':visible').length
            });
        } else {
            rentalDebug.log('No datepicker elements found');
        }
        
        // Check for calendar container
        const calendarContainer = $('.datepicker--content, .datepicker-container');
        if (calendarContainer.length) {
            rentalDebug.log('Calendar container found', {
                id: calendarContainer.attr('id') || 'none',
                class: calendarContainer.attr('class')
            });
        }
    }


    // Initial check
    checkRentalData();
    
    // Check periodically to catch dynamically loaded content
    const checkInterval = setInterval(checkRentalData, 2000);
    
    // Also check when AJAX completes
    $(document).ajaxComplete(checkRentalData);
    
    // Clean up on page unload
    $(window).on('beforeunload', () => {
        clearInterval(checkInterval);
    });
    
    // Add debug controls
    const debugControls = $('<div style="position:fixed;bottom:10px;right:10px;z-index:10000;background:white;padding:10px;border:1px solid #ccc;border-radius:4px;">' +
        '<button id="refresh-debug" style="margin-right:5px;">Refresh Debug</button>' +
        '<button id="clear-debug">Clear Log</button>' +
        '</div>').appendTo('body');
    
    $('#refresh-debug').on('click', checkRentalData);
    $('#clear-debug').on('click', () => {
        $('#rental-debug-content').empty();
        rentalDebug.log('Debug log cleared');
    });
});
