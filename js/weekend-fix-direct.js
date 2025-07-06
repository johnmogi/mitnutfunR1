/**
 * Weekend Fix - Direct Implementation
 * 
 * This script directly patches the AirDatepicker weekend detection logic
 * by intercepting the date selection events and correcting the calculation
 * when a weekend-only rental is detected.
 */

(function() {
    console.log('🚀 WEEKEND FIX: Direct implementation loaded');
    
    // Initialize immediately
    init();
    
    /**
     * Main initialization function
     */
    function init() {
        // Try immediately and then set up a more persistent approach
        tryPatchNow();
        
        // Set up event listeners for any date picker clicks
        document.addEventListener('click', function(e) {
            // Check if click was on or inside datepicker
            if (e.target.closest('.air-datepicker') || 
                e.target.closest('.air-datepicker-cell') ||
                e.target.closest('.datepicker-container')) {
                setTimeout(checkAndFixWeekends, 50);
            }
        });
        
        // Add mutation observer to detect calendar changes
        const observer = new MutationObserver(function(mutations) {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' || mutation.type === 'childList') {
                    // If selected dates change, check and fix weekend calculation
                    if (document.querySelector('.air-datepicker-cell.-selected-') ||
                        document.querySelector('.air-datepicker-cell.-in-range-')) {
                        checkAndFixWeekends();
                    }
                }
            }
        });
        
        // Start observing calendar area for changes
        const config = { attributes: true, childList: true, subtree: true };
        observer.observe(document.body, config);
        
        // Also set up interval as a fallback
        setInterval(tryPatchNow, 1000);
    }
    
    /**
     * Try to patch the calendar right now
     */
    function tryPatchNow() {
        // Check if AirDatepicker is ready
        if (typeof window.$airDatepickers !== 'undefined' && 
            window.$airDatepickers.length > 0) {
            
            // Patch all instances
            window.$airDatepickers.forEach(function(datepicker) {
                // Save original onSelect handler
                if (!datepicker._originalOnSelect) {
                    datepicker._originalOnSelect = datepicker.opts.onSelect;
                    
                    // Replace with our patched version
                    datepicker.opts.onSelect = function(formattedDate, date, inst) {
                        // Call original handler first
                        if (datepicker._originalOnSelect) {
                            datepicker._originalOnSelect.call(this, formattedDate, date, inst);
                        }
                        
                        // Then apply our fix
                        setTimeout(checkAndFixWeekends, 10);
                    };
                    
                    console.log('✅ Patched AirDatepicker onSelect handler');
                }
            });
            
            // Also do an immediate check in case dates are already selected
            checkAndFixWeekends();
        }
    }
    
    /**
     * Check for weekend-only rentals and fix the calculation
     */
    function checkAndFixWeekends() {
        // Get all selected days from calendar
        const selectedCells = document.querySelectorAll(
            '.air-datepicker-cell.-selected-, ' + 
            '.air-datepicker-cell.-range-from-, ' +
            '.air-datepicker-cell.-range-to-, ' + 
            '.air-datepicker-cell.-in-range-'
        );
        
        // If we don't have enough days selected yet, exit
        if (selectedCells.length < 2) {
            return;
        }
        
        console.log(`🔍 Analyzing ${selectedCells.length} selected calendar days`);
        
        // Extract dates and weekend info
        const dates = [];
        selectedCells.forEach(cell => {
            // Get date components from data attributes
            const year = parseInt(cell.dataset.year, 10);
            const month = parseInt(cell.dataset.month, 10);
            const day = parseInt(cell.dataset.date, 10);
            
            // Check for weekend class
            const isWeekend = cell.classList.contains('-weekend-') || 
                             cell.classList.contains('air-datepicker-cell--weekend');
            
            // Create a full date object for sorting
            dates.push({
                date: new Date(year, month, day),
                isWeekend,
                cell
            });
        });
        
        // Sort dates chronologically
        dates.sort((a, b) => a.date - b.date);
        
        // First day is never counted as weekend for this calculation
        const firstDay = dates.shift();
        if (dates.length === 0) return;
        
        // Check if all days after first day are weekends
        const allRemainingAreWeekends = dates.every(d => d.isWeekend);
        
        // Get date range info to debug 
        const startDate = firstDay.date.toLocaleDateString();
        const endDate = dates[dates.length-1].date.toLocaleDateString();
        
        console.log(`📅 Date range: ${startDate} to ${endDate}`);
        console.log(`🔍 All remaining days are weekends: ${allRemainingAreWeekends}`);
        
        // Get rental days element
        const rentalDaysEl = document.querySelector('.rental-days-result');
        
        // Special weekend case - if all days after the first are weekends, count as 1 day
        if (allRemainingAreWeekends && rentalDaysEl) {
            console.log('🎯 WEEKEND FIX: Applying weekend-only rental rule (1 day)');
            
            // Update rental days display to 1
            rentalDaysEl.textContent = '1';
            
            // Also update any price calculations
            updatePriceCalculation(1);
            
            // Set data attribute for other scripts
            document.querySelector('.datepicker-here')?.setAttribute('data-rental-days', '1');
        }
    }
    
    /**
     * Update price calculation based on corrected rental days
     */
    function updatePriceCalculation(rentalDays) {
        // Find price elements
        const priceElements = document.querySelectorAll('.rental-price-total, .price-preview');
        const breakdownElement = document.querySelector('.rental-price-breakdown');
        
        if (!priceElements.length) return;
        
        // Get base price from product data
        let basePrice = 700; // Default fallback
        
        // Try to get actual price from page
        const productPriceElement = document.querySelector('.product-price .woocommerce-Price-amount');
        if (productPriceElement) {
            const priceText = productPriceElement.textContent.replace(/[^\d.,]/g, '');
            basePrice = parseFloat(priceText.replace(',', '.'));
        }
        
        // Calculate total price
        const totalPrice = rentalDays === 1 ? 
            basePrice : 
            basePrice + ((rentalDays - 1) * (basePrice / 2));
        
        // Update price elements
        priceElements.forEach(el => {
            el.textContent = `${totalPrice.toFixed(2)}₪`;
        });
        
        // Update breakdown if present
        if (breakdownElement) {
            let breakdownHTML = `<div>יום ראשון (100%): ${basePrice.toFixed(2)}₪</div>`;
            
            if (rentalDays > 1) {
                const additionalDays = rentalDays - 1;
                const additionalPrice = additionalDays * (basePrice / 2);
                breakdownHTML += `
                    <div>ימים נוספים (${additionalDays} × 50%): ${additionalPrice.toFixed(2)}₪</div>
                    <div>חסכת: ${additionalPrice.toFixed(2)}₪</div>
                `;
            }
            
            breakdownElement.innerHTML = breakdownHTML;
        }
        
        console.log(`💰 Updated price for ${rentalDays} rental days: ${totalPrice.toFixed(2)}₪`);
        
        // Also update the form value for rental days
        const rentalDaysInput = document.querySelector('input[name="rental_days"]');
        if (rentalDaysInput) {
            rentalDaysInput.value = rentalDays;
        }
    }
})();
