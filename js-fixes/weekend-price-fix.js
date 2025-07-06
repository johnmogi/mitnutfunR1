/**
 * Weekend Price Fix
 * Version: 1.0.2
 * 
 * Fixes price calculation and display issues for weekend ranges
 * EMERGENCY PERFORMANCE PATCH: Ultra-minimal implementation
 */

// Wait for document ready using a lightweight approach
document.addEventListener('DOMContentLoaded', function() {
    console.log('%c🔧 Weekend Price Fix 1.0.2 - Emergency Performance Mode', 'background: #4a148c; color: white; font-size: 12px; padding: 3px;');
    
    // Track if already fixed to avoid redundant operations
    let alreadyFixed = false;
    
    // Simple event handler for datepicker change
    function handleDatepickerChange() {
        // Only run if not already fixed this session
        if (!alreadyFixed) {
            setTimeout(fixPriceDisplay, 300);
            alreadyFixed = true;
        }
    }
    
    // Core fix function - ultra simplified
    function fixPriceDisplay() {
        // Get required elements
        const rentalDaysEl = document.getElementById('rental-days-count');
        const priceBreakdownEl = document.querySelector('.price-breakdown');
        
        // Exit early if elements not found
        if (!rentalDaysEl || !priceBreakdownEl) return;
        
        // Get and format the days and price
        const days = parseInt(rentalDaysEl.textContent || '0', 10);
        if (isNaN(days) || days <= 0) return;
        
        // Get base price (simplified)
        const priceEl = document.querySelector('.woocommerce-Price-amount');
        if (!priceEl) return;
        
        const priceText = priceEl.textContent || '';
        const priceMatch = priceText.match(/[\d,.]+/);
        if (!priceMatch) return;
        
        const basePrice = parseFloat(priceMatch[0].replace(/,/g, ''));
        if (isNaN(basePrice)) return;
        
        // Calculate total price
        const totalPrice = basePrice * days;
        
        // Format price without expensive locale handling
        const formattedPrice = '‏' + totalPrice.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '&nbsp;‏₪';
        
        // Create simple price breakdown HTML
        let breakdownHTML = '<div style="margin-bottom: 5px;"><strong>מחיר:</strong></div>';
        breakdownHTML += `<div style="margin-left: 15px;">${days} ימים: ${formattedPrice}</div>`;
        breakdownHTML += `<div style="margin-top: 8px; font-weight: bold;">סה"כ: ${formattedPrice}</div>`;
        
        // Update price breakdown
        priceBreakdownEl.innerHTML = breakdownHTML;
    }
    
    // Run once on page load with delay
    setTimeout(fixPriceDisplay, 800);
    
    // Set up minimal event listeners using direct DOM API
    if (window.jQuery) {
        // Use jQuery events if available, but with minimal handlers
        jQuery(document).on('datepicker-change', function() {
            handleDatepickerChange();
        });
    }
    
    // Optional: Add button click handler for date selection confirmation
    const addToCartBtn = document.querySelector('.single_add_to_cart_button');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', handleDatepickerChange, { once: true });
    }
});

