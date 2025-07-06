/**
 * Calendar Booking Status Fix
 * Fixes the AirDatepicker reserved date display to properly block dates
 * based on initial stock level, not current stock level
 */
jQuery(document).ready(function($) {
    'use strict';
    
    // console.log('CALENDAR BOOKING STATUS FIX LOADED');
    
    /**
     * Fix calendar booking display
     */
    function fixCalendarBooking() {
        // Listen for the rentalDatesLoaded event
        $(document).on('rentalDatesLoaded', function(e, data) {
            // console.log('Calendar fix: Rental dates loaded event received', data);
            
            if (!data || !data.bookedDates) {
                // console.log('Calendar fix: No booked dates data');
                return;
            }
            
            // Get initial stock
            let initialStock = 1; // Default to 1 if not found
            
            // Try to get initial stock from various sources
            if ($('.stock-debugger-data').length) {
                const stockText = $('.stock-debugger-data').text();
                const initialMatch = stockText.match(/Initial\s*=\s*(\d+)/);
                
                if (initialMatch && initialMatch[1]) {
                    initialStock = parseInt(initialMatch[1], 10);
                    // console.log('Calendar fix: Found initial stock from debugger:', initialStock);
                }
            }
            
            // Look for data attributes
            const $stockData = $('[data-initial-stock]');
            if ($stockData.length) {
                initialStock = parseInt($stockData.data('initial-stock'), 10) || initialStock;
                // console.log('Calendar fix: Found initial stock from data attribute:', initialStock);
            }
            
            // Fix the calendar cells after a short delay to ensure they've been rendered
            setTimeout(function() {
                fixCalendarCells(initialStock, data.bookedDates);
            }, 500);
        });
    }
    
    /**
     * Fix calendar cells based on correct stock calculation and identify booking edges
     */
    function fixCalendarCells(initialStock, bookedDates) {
        // console.log('Calendar fix: Fixing calendar cells with initial stock', initialStock);
        
        // CRITICAL FIX: First, pre-process the booked dates to ensure correct status
        // Override backend status if count >= initialStock
        for (const dateKey in bookedDates) {
            if (bookedDates.hasOwnProperty(dateKey)) {
                const bookingCount = bookedDates[dateKey].length || 0;
                const isFullyBooked = bookingCount >= initialStock;
                
                // If this date should be fully booked, force the status
                if (isFullyBooked) {
                    // console.log(`Calendar fix: Forcing date ${dateKey} to fully booked (count ${bookingCount} >= stock ${initialStock})`);
                    // We'll use this in the cell processing loop later
                    bookedDates[dateKey].isFullyBooked = true;
                    bookedDates[dateKey].status = 'fully_booked'; // Override backend status!
                    // console.log(`[FORCE FULL] ${dateKey} marked fully booked (count=${bookingCount}, stock=${initialStock})`);
                }
            }
        }
        
        // Extra check: If initial stock is missing or invalid, default to 1
        if (!initialStock || initialStock <= 0) {
            initialStock = 1;
            // console.log('Calendar fix: Initial stock was invalid, defaulting to 1');
        }
        
        // First, analyze bookings to identify start/end dates for each booking
        const bookingEdges = analyzeBookingEdges(bookedDates);
        // console.log('Calendar fix: Identified booking edges:', bookingEdges);
        
        // Add debug info to the page
        addCalendarBookingDebug(initialStock, bookedDates, bookingEdges);
        
        // Enhanced edge day detection
        // Force debug output for all date cells to help troubleshooting
        $('.air-datepicker-cell').each(function() {
            const year = $(this).attr('data-year');
            const monthZeroBased = $(this).attr('data-month');
            const day = $(this).attr('data-date');
            
            if (!year || !monthZeroBased || !day) return;
            
            // Convert to date format used in our edge detection (YYYY-MM-DD)
            const month = parseInt(monthZeroBased, 10) + 1; // Convert from 0-based to 1-based
            const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            
            // Debug this cell
            // console.log(`Calendar cell check: ${dateKey}`, {
                isStartEdge: bookingEdges.startDates.includes(dateKey),
                isEndEdge: bookingEdges.endDates.includes(dateKey),
                cell: this
            });
        });
        
        // Process each date in bookedDates
        for (const dateKey in bookedDates) {
            if (bookedDates.hasOwnProperty(dateKey)) {
                const bookingCount = bookedDates[dateKey].length || 0;
                
                // Find the corresponding date cell
                const dateParts = dateKey.split('-');
                if (dateParts.length !== 3) continue;
                
                const year = dateParts[0];
                const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-based
                const date = parseInt(dateParts[2], 10);
                
                const $cell = $(`.air-datepicker-cell[data-year="${year}"][data-month="${month}"][data-date="${date}"]`);
                
                if ($cell.length) {
                    // IMPORTANT: When initial stock is 1, ANY booking makes the date fully booked
                    const shouldBlock = bookingCount >= initialStock;
                    
                    // Flag that tracks if backend data considers this date fully booked (forced in our pre-processing step)
                    const isBackendFullyBooked = bookedDates[dateKey].isFullyBooked === true;
                    
                    // Determine if this is an edge day (start or end of a booking)
                    const isStartEdge = bookingEdges.startDates.includes(dateKey);
                    const isEndEdge = bookingEdges.endDates.includes(dateKey);
                    const isEdgeDay = isStartEdge || isEndEdge;
                    const isMiddleDay = shouldBlock && !isEdgeDay;
                    
                    // console.log(`Calendar fix: Date ${dateKey} - Bookings: ${bookingCount}, Initial Stock: ${initialStock}, Should block: ${shouldBlock}, Edge: ${isEdgeDay} (Start: ${isStartEdge}, End: ${isEndEdge}), Middle: ${isMiddleDay}, Backend fully booked: ${isBackendFullyBooked}`);
                    
                    // CLEAR ALL BOOKING CLASSES FIRST to avoid conflicts
                    $cell.removeClass(
                        'air-datepicker-cell--partially-booked',
                        'air-datepicker-cell--fully-booked',
                        'air-datepicker-cell--edge-booked',
                        'booking-start-edge',
                        'booking-end-edge',
                        '-disabled-'
                    );
                    
                    // Force debug info on cell for inspection
                    $cell.attr('data-booking-count', bookingCount);
                    $cell.attr('data-initial-stock', initialStock);
                    
                    // Update class based on booking status
                    // CRITICAL: Force fully booked status when count >= initialStock
                    if (shouldBlock || isBackendFullyBooked || bookedDates[dateKey].status === 'fully_booked') {
                        // Force fully booked status on the cell's data attribute
                        $cell.attr('data-fully-booked', 'true');
                        $cell.attr('data-booking-status', 'fully-booked');
                        
                        if (isEdgeDay) {
                            // Edge days - mark as edge-booked (selectable but with special styling)
                            $cell.addClass('air-datepicker-cell--edge-booked');
                            $cell.removeClass('-disabled-'); // Ensure it's selectable
                            $cell.removeClass('air-datepicker-cell--fully-booked'); // Remove fully booked class if present
                            
                            // Add data attributes for debug and selection logic
                            $cell.attr('data-booking-status', 'edge-booked');
                            $cell.attr('data-booking-count', bookingCount);
                            
                            // Add specific start/end class for more precise styling if needed
                            if (isStartEdge) {
                                $cell.addClass('booking-start-edge');
                                // console.log(`Calendar fix: Marking ${dateKey} as START edge day`);
                            }
                            if (isEndEdge) {
                                $cell.addClass('booking-end-edge');
                                // console.log(`Calendar fix: Marking ${dateKey} as END edge day`);
                            }
                        } else {
                            // Middle days - fully block
                            $cell.addClass('air-datepicker-cell--fully-booked -disabled-');
                            $cell.removeClass('air-datepicker-cell--edge-booked'); // Remove edge booked if present
                            $cell.removeClass('booking-start-edge booking-end-edge'); // Remove any edge markers
                            
                            // Add data attributes for debugging
                            $cell.attr('data-booking-status', 'fully-booked-middle');
                            $cell.attr('data-booking-count', bookingCount);
                            
                            // console.log(`Calendar fix: Fully blocking middle date ${dateKey}`);
                        }
                    } else if (bookingCount > 0 && !isBackendFullyBooked && bookedDates[dateKey].status !== 'fully_booked') {
                        // Partially booked days (only if not forced to fully booked)
                        $cell.addClass('air-datepicker-cell--partially-booked');
                        
                        $cell.attr('data-booking-status', 'partially-booked');
                        $cell.attr('data-fully-booked', 'false');
                        
                        // console.log(`Calendar fix: Date ${dateKey} is partially booked (count ${bookingCount} < stock ${initialStock})`);
                    }
                    
                    // Debug verification of cell classes AFTER all processing
                    // console.log(`[Render] ${dateKey} → classes:`, {
                        fullBooked: $cell.hasClass('air-datepicker-cell--fully-booked'),
                        partialBooked: $cell.hasClass('air-datepicker-cell--partially-booked'),
                        edgeBooked: $cell.hasClass('air-datepicker-cell--edge-booked'),
                        disabled: $cell.hasClass('-disabled-'),
                        startEdge: $cell.hasClass('booking-start-edge'),
                        endEdge: $cell.hasClass('booking-end-edge')
                    });
                }
            }
        }
    }
    
    /**
     * Helper function to check if two date strings are consecutive days
     */
    function isConsecutiveDate(date1Str, date2Str) {
        // Parse dates from strings like '2025-07-06'
        const [year1, month1, day1] = date1Str.split('-').map(Number);
        const [year2, month2, day2] = date2Str.split('-').map(Number);
        
        const date1 = new Date(year1, month1 - 1, day1); // JS months are 0-indexed
        const date2 = new Date(year2, month2 - 1, day2);
        
        // Calculate difference in days
        const diffTime = Math.abs(date2 - date1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays === 1;
    }
    
    /**
     * Find consecutive sequences in an array of date strings
     * Returns an array of sequences, where each sequence is an array of consecutive dates
     */
    function findDateSequences(dates) {
        if (!dates || dates.length === 0) return [];
        
        // Sort dates chronologically
        const sortedDates = [...dates].sort();
        const sequences = [];
        let currentSequence = [sortedDates[0]];
        
        for (let i = 1; i < sortedDates.length; i++) {
            const currentDate = sortedDates[i];
            const prevDate = sortedDates[i - 1];
            
            if (isConsecutiveDate(prevDate, currentDate)) {
                // Consecutive date, add to current sequence
                currentSequence.push(currentDate);
            } else {
                // Start a new sequence
                sequences.push([...currentSequence]);
                currentSequence = [currentDate];
            }
        }
        
        // Don't forget the last sequence
        if (currentSequence.length > 0) {
            sequences.push(currentSequence);
        }
        
        return sequences;
    }
    
    /**
     * Enhanced logic to analyze booking data and identify start and end dates
     * This allows us to differentiate between edge days and middle days
     */
    function analyzeBookingEdges(bookedDates) {
        const startDates = [];
        const endDates = [];
        
        // First, collect all dates that are fully booked
        const fullyBookedDates = [];
        for (const dateKey in bookedDates) {
            if (bookedDates.hasOwnProperty(dateKey)) {
                const bookingCount = bookedDates[dateKey].length || 0;
                const isFullyBooked = bookingCount >= 1; // For initialStock=1, any booking means fully booked
                
                if (isFullyBooked) {
                    fullyBookedDates.push(dateKey);
                }
            }
        }
        
        // Find consecutive sequences in fully booked dates
        const bookingSequences = findDateSequences(fullyBookedDates);
        // console.log('Calendar fix: Found booking sequences:', bookingSequences);
        
        // Each sequence's start and end dates are booking edges
        bookingSequences.forEach(sequence => {
            if (sequence.length > 0) {
                const firstDate = sequence[0];
                const lastDate = sequence[sequence.length - 1];
                
                startDates.push(firstDate);
                endDates.push(lastDate);
                
                // console.log(`Calendar fix: Booking sequence - Start: ${firstDate}, End: ${lastDate}`);
            }
        });
        
        // console.log('Calendar fix: Identified edges -', 
            'Starts:', startDates.join(', '), 
            'Ends:', endDates.join(', ')
        );
        
        return { startDates, endDates };
    }
    
    /**
     * Add debug information to the page about calendar booking status
     */
    function addCalendarBookingDebug(initialStock, bookedDates, bookingEdges) {
        // Remove existing debug info
        $('#calendar-booking-debug').remove();
        
        // Default if bookingEdges is not provided
        const edges = bookingEdges || { startDates: [], endDates: [] };
        
        // Create debug info container
        const debugInfo = $(`
            <div id="calendar-booking-debug" style="margin: 15px 0; padding: 10px; border: 1px solid #ddd; background: #f9f9f9;">
                <h4>Calendar Booking Debug</h4>
                <div><strong>Initial Stock:</strong> ${initialStock}</div>
                <div><strong>Booking Logic:</strong>
                    <ul style="margin: 5px 0 0 20px;">
                        <li>When booking count >= initial stock (${initialStock}), date is blocked</li>
                        <li>Edge days (first/last day of booking) remain selectable</li>
                        <li>Middle days (inner days of booking) are fully blocked</li>
                    </ul>
                </div>
                <div class="booking-examples" style="margin-top: 10px;">
                    <div style="margin-bottom: 5px;"><strong>Legend:</strong></div>
                    <div style="display: inline-block; width: 20px; height: 20px; background-color: #fff3e0; margin-right: 5px;"></div> Partially Booked
                    <div style="display: inline-block; width: 20px; height: 20px; background-color: rgba(255, 200, 0, 0.2); margin: 0 5px 0 15px;"></div> Edge Day (Start/End of booking)
                    <div style="display: inline-block; width: 20px; height: 20px; background-color: rgba(255, 0, 0, 0.1); margin: 0 5px 0 15px;"></div> Fully Booked (Middle day)
                </div>
                <div class="booking-edges" style="margin-top: 10px;">
                    <div><strong>Detected Booking Edges:</strong></div>
                    <div><strong>Start Dates:</strong> ${edges.startDates.join(', ') || 'None'}</div>
                    <div><strong>End Dates:</strong> ${edges.endDates.join(', ') || 'None'}</div>
                </div>
            </div>
        `);
        
        // Add the debug info after the datepicker
        $('#datepicker-container').after(debugInfo);
    }
    
    // Add a custom style for fully booked dates and edge days
    function addCustomStyles() {
        if (!$('#calendar-booking-fix-style').length) {
            $('head').append(`
                <style id="calendar-booking-fix-style">
                    /* Fully booked styling */
                    .air-datepicker-cell--fully-booked {
                        position: relative;
                        color: #ccc !important;
                        background-color: rgba(255, 0, 0, 0.1) !important;
                        cursor: not-allowed !important;
                    }
                    .air-datepicker-cell--fully-booked:after {
                        content: '';
                        position: absolute;
                        top: 0;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        background: repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 5px,
                            rgba(255, 0, 0, 0.1) 5px,
                            rgba(255, 0, 0, 0.1) 10px
                        );
                    }
                    /* Override hover state for fully booked */
                    .air-datepicker-cell--fully-booked:hover {
                        color: #ccc !important;
                        background-color: rgba(255, 0, 0, 0.1) !important;
                    }
                    
                    /* Edge day styling - start/end of booking but still selectable */
                    .air-datepicker-cell--edge-booked {
                        position: relative;
                        background-color: rgba(255, 200, 0, 0.2) !important;
                        cursor: pointer !important;
                    }
                    .air-datepicker-cell--edge-booked:after {
                        content: '';
                        position: absolute;
                        top: 0;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        background: repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 5px,
                            rgba(255, 180, 0, 0.2) 5px,
                            rgba(255, 180, 0, 0.2) 10px
                        );
                    }
                    .booking-start-edge:before {
                        content: '▶';
                        position: absolute;
                        top: 0;
                        left: 3px;
                        font-size: 8px;
                        color: #f90;
                    }
                    .booking-end-edge:after {
                        content: '◀';
                        position: absolute;
                        top: 0;
                        right: 3px;
                        font-size: 8px;
                        color: #f90;
                    }
                </style>
            `);
        }
    }
    
    // Initialize
    fixCalendarBooking();
    addCustomStyles();
});
