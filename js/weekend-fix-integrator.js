/**
 * Weekend Fix Integrator - DIRECT MODE
 * This script directly integrates with AirDatepicker to fix weekend detection
 * 
 * Uses multiple aggressive techniques to ensure it's applied properly:
 * 1. Direct patching of AirDatepicker internals
 * 2. MutationObserver to detect DOM changes
 * 3. Multiple timing strategies to catch all scenarios
 */

// Execute immediately with self-invoking function
(function() {
    // console.log('🚀 WEEKEND FIX: Direct patching mode initialized');
    
    // Global state tracking
    let patched = false;
    let observer = null;
    let attemptCount = 0;
    const MAX_ATTEMPTS = 50;
    
    // Initialize as soon as possible
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    /**
     * Main initialization function
     */
    function init() {
        // console.log('⚡ Weekend Fix: Starting initialization');
        
        // Try immediate patch if possible
        tryPatch();
        
        // Setup observers for calendar elements
        setupObservers();
        
        // Set up aggressive retry mechanism with decreasing interval
        let interval = 100;
        const patchInterval = setInterval(() => {
            attemptCount++;
            
            // Increase interval over time
            if (attemptCount > 10) interval = 250;
            if (attemptCount > 20) interval = 500;
            
            // Try to patch again
            if (!patched) {
                // console.log(`🔄 Weekend Fix: Attempt ${attemptCount}/${MAX_ATTEMPTS}`);
                tryPatch();
            } else {
                clearInterval(patchInterval);
                // console.log('✅ Weekend Fix: Successfully patched AirDatepicker');
            }
            
            // Give up after max attempts
            if (attemptCount >= MAX_ATTEMPTS) {
                console.error('❌ Weekend Fix: Failed to patch after maximum attempts');
                clearInterval(patchInterval);
            }
        }, interval);
        
        // Add direct event listeners for calendar interactions
        document.addEventListener('click', function(e) {
            // Wait briefly after any click to check for changes
            setTimeout(checkForCalendarChanges, 50);
        });
    }
    
    /**
     * Try to patch the AirDatepicker instance
     */
    function tryPatch() {
        // Check if AirDatepicker is available and initialized
        if (typeof window.$airDatepickers === 'undefined' || 
            !window.$airDatepickers.length || 
            !document.querySelector('.air-datepicker')) {
            return false;
        }
                
                clearInterval(checkInterval);
                // console.log('✅ AirDatepicker detected, applying weekend detection patch');
                
                // Hook into the onSelect event of all datepickers
                window.$airDatepickers.forEach(datepicker => {
                    const originalOnSelect = datepicker.opts.onSelect;
                    
                    datepicker.opts.onSelect = function(formattedDate, date, inst) {
                        // First, let the original handler run
                        if (originalOnSelect) {
                            originalOnSelect.call(this, formattedDate, date, inst);
                        }
                        
                        // Then apply our DOM-based weekend detection fix
                        applyWeekendFix(date);
                    };
                });
                
                // console.log('✅ Weekend detection patch applied to all datepickers');
            }
        }, 500);
    }
    
    /**
     * Apply weekend fix using DOM-based detection
     */
    function applyWeekendFix(selectedDates) {
        // Only run if we have a date range
        if (!selectedDates || 
            !Array.isArray(selectedDates) || 
            selectedDates.length !== 2) {
            return;
        }
        
        // console.log('🔍 Analyzing selected date range for weekend detection');
        
        // Get all selected cells from the datepicker
        const selectedCells = document.querySelectorAll('.air-datepicker-cell.-day-.-selected-, .air-datepicker-cell.-day-.-in-range-');
        if (!selectedCells.length) {
            // console.log('⚠️ No selected cells found in DOM');
            return;
        }
        
        // console.log(`🔢 Found ${selectedCells.length} selected cells in calendar DOM`);
        
        // Map DOM cells to date objects with weekend flags
        const dates = Array.from(selectedCells).map(cell => {
            const year = cell.dataset.year;
            const month = String(Number(cell.dataset.month) + 1).padStart(2, '0');
            const day = String(cell.dataset.date).padStart(2, '0');
            
            // Check both possible weekend class names
            const isWeekend = cell.classList.contains('-weekend-') || 
                              cell.classList.contains('air-datepicker-cell--weekend');
                              
            const dateStr = `${year}-${month}-${day}`;
            
            // console.log(`📅 ${dateStr}: ${isWeekend ? 'WEEKEND' : 'WEEKDAY'} ${Array.from(cell.classList).join(' ')}`);
            
            return {
                date: dateStr,
                isWeekend
            };
        });
        
        // Sort dates chronologically
        dates.sort((a, b) => a.date.localeCompare(b.date));
        
        // Mark first day
        if (dates.length > 0) {
            dates[0].isFirst = true;
        }
        
        // Analyze weekend pattern
        const nonFirstDays = dates.filter(d => !d.isFirst);
        const allWeekends = nonFirstDays.length > 0 && nonFirstDays.every(d => d.isWeekend);
        
        // Check if this is specifically a Thu-Sat rental (3 days with weekend)
        const isThreeDay = dates.length === 3;
        const hasWeekend = nonFirstDays.some(d => d.isWeekend);
        const shouldBeOneDay = (allWeekends || isThreeDay && hasWeekend);
        
        if (shouldBeOneDay) {
            // console.log('🎯 Weekend-only rental detected! Should be 1 rental day');
            
            // Get rental days display element
            const rentalDaysEl = document.querySelector('.rental-days-result');
            if (rentalDaysEl) {
                // Update rental days display
                const currentText = rentalDaysEl.textContent;
                // Only update if showing more than 1 day
                if (currentText.includes('2') || currentText.includes('3')) {
                    rentalDaysEl.textContent = '1';
                    // console.log('✅ Updated rental days display to 1');
                    
                    // Trigger price recalculation
                    updatePriceDisplay(1);
                }
            }
        }
    }
    
    /**
     * Update the price display based on corrected rental days
     */
    function updatePriceDisplay(rentalDays) {
        const basePrice = 700; // Base price for first day
        const total = rentalDays === 1 ? basePrice : basePrice + ((rentalDays - 1) * (basePrice / 2));
        
        // Update total price
        const totalPriceEl = document.querySelector('.rental-price-total');
        if (totalPriceEl) {
            totalPriceEl.textContent = `${total.toFixed(2)}₪`;
        }
        
        // Update price breakdown
        const breakdownEl = document.querySelector('.rental-price-breakdown');
        if (breakdownEl) {
            let breakdown = `
                <div>יום ראשון (100%): ${basePrice.toFixed(2)}₪</div>
            `;
            
            if (rentalDays > 1) {
                const additionalDays = rentalDays - 1;
                const additionalPrice = additionalDays * (basePrice / 2);
                const savedAmount = additionalDays * (basePrice / 2);
                
                breakdown += `
                    <div>ימים נוספים (${additionalDays} × 50%): ${additionalPrice.toFixed(2)}₪</div>
                    <div>חסכת: ${savedAmount.toFixed(2)}₪ (50%)</div>
                `;
            }
            
            breakdownEl.innerHTML = breakdown;
        }
        
        // console.log(`💰 Updated price display for ${rentalDays} rental days: ${total.toFixed(2)}₪`);
    }
    
    // Run the patch
    patchRentalCalculation();
    
    // Expose functions globally for debugging
    window.weekendFix = {
        patchRentalCalculation,
        applyWeekendFix,
        updatePriceDisplay
    };
});
