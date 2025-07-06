/**
 * Checkout Robust Fix
 * Addresses critical checkout issues:
 * 1. Prevents broken UI when cart is cleared
 * 2. Ensures consistent pricing after page refreshes
 */
jQuery(document).ready(function($) {
    'use strict';
    
    console.log('CHECKOUT ROBUST FIX LOADED');
    
    // Configuration
    const EXCLUDED_PRODUCT_IDS = [150, 153]; // Products excluded from the discount
    const DEBUG = true; // Enable console logging
    
    /**
     * Debug logger
     */
    function log(...args) {
        if (DEBUG) {
            console.log('[CHECKOUT-FIX]', ...args);
        }
    }
    
    /**
     * Handle empty cart scenario
     * Prevents blank/broken page when cart is cleared
     */
    function handleEmptyCart() {
        // Watch for cart clearing events
        $(document).on('click', '.woocommerce-remove-coupon, [name="update_cart"], .remove_from_cart_button', function() {
            log('Cart item removal detected');
            
            // Set a flag that we're potentially clearing the cart
            sessionStorage.setItem('potential_cart_clear', 'true');
        });
        
        // Check on page load if cart is empty
        function checkEmptyCart() {
            const $items = $('.woocommerce-checkout-review-order-table .item');
            const isEmpty = $items.length === 0;
            
            log('Checking if cart is empty:', isEmpty);
            
            if (isEmpty) {
                // Handle empty cart scenario
                handleEmptyCartUI();
            }
        }
        
        // Handle UI for empty cart
        function handleEmptyCartUI() {
            log('Handling empty cart UI');
            
            const $checkout = $('.woocommerce-checkout');
            const $emptyMessage = $('.cart-empty, .woocommerce-info:contains("עגלת הקניות שלך ריקה")'); 
            
            // If we already have an empty message, don't add another
            if ($emptyMessage.length) return;
            
            // Check if we need to reload the page
            if (sessionStorage.getItem('potential_cart_clear') === 'true') {
                log('Potential cart clear detected, redirecting to cart page');
                sessionStorage.removeItem('potential_cart_clear');
                
                // Redirect to cart page instead of showing a broken checkout
                window.location.href = '/basket/?empty-cart';
                return;
            }
            
            // Add empty cart message
            const emptyCartMessage = '<div class="woocommerce-info cart-empty">עגלת הקניות שלך ריקה. <a href="/shop/">חזרה לחנות</a></div>';
            
            // Replace checkout content with empty message
            if ($checkout.length) {
                $checkout.before(emptyCartMessage);
                $checkout.hide();
            }
        }
        
        // Initial check
        setTimeout(checkEmptyCart, 1000);
        
        // After AJAX requests
        $(document).ajaxComplete(function() {
            setTimeout(checkEmptyCart, 500);
        });
    }
    
    /**
     * Fix price inconsistencies in checkout
     * Ensures prices are accurate and consistent throughout the page
     */
    function fixPriceInconsistencies() {
        log('Setting up price consistency fixes');
        
        // Calculate rental days from date range
        function calculateRentalDays(dateString) {
            if (!dateString) return 0;
            
            // Extract dates from string like "1.7.2025 - 3.7.2025"
            const dateMatch = dateString.match(/(\d{1,2}\.\d{1,2}\.\d{4})\s*-\s*(\d{1,2}\.\d{1,2}\.\d{4})/);
            if (!dateMatch || dateMatch.length !== 3) return 0;
            
            // Parse dates
            const startParts = dateMatch[1].split('.');
            const endParts = dateMatch[2].split('.');
            
            if (startParts.length !== 3 || endParts.length !== 3) return 0;
            
            const startDate = new Date(startParts[2], startParts[1] - 1, startParts[0]);
            const endDate = new Date(endParts[2], endParts[1] - 1, endParts[0]);
            
            // Calculate total days in range
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
            
            // Apply the special Friday-Sunday = 1 day rule
            let rentalDays = diffDays;
            
            // Check if range spans Friday to Sunday
            const startDay = startDate.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
            const endDay = endDate.getDay();
            
            if (startDay === 5 && (endDay === 0) && diffDays <= 3) {
                log('Friday to Sunday special case');
                rentalDays = 1;
            } else {
                // Apply the regular rental days calculation (2=1, 3=2, 4=3, etc.)
                if (diffDays === 2) rentalDays = 1;
                else if (diffDays > 2) rentalDays = diffDays - 1;
            }
            
            log('Date range:', dateString, 'Calendar days:', diffDays, 'Rental days:', rentalDays);
            return rentalDays;
        }
        
        // Apply discount based on rental days
        function applyRentalDiscount(basePrice, rentalDays, isExcluded) {
            if (rentalDays <= 1 || isExcluded) {
                // No discount for 1 day or excluded products
                return basePrice * rentalDays;
            }
            
            // First day at full price, additional days at 50% off
            const firstDayPrice = basePrice;
            const additionalDaysPrice = basePrice * 0.5 * (rentalDays - 1);
            
            const totalPrice = firstDayPrice + additionalDaysPrice;
            log('Base price:', basePrice, 'First day:', firstDayPrice, 
                'Additional days:', additionalDaysPrice, 'Total:', totalPrice);
            
            return totalPrice;
        }
        
        // Extract numeric price from price string
        function extractPrice(priceString) {
            if (!priceString) return 0;
            const numericString = priceString.replace(/[^\d.]/g, '');
            return parseFloat(numericString) || 0;
        }
        
        // Format price with currency symbol
        function formatPrice(price) {
            return price.toFixed(2) + '&nbsp;₪';
        }
        
        // Update individual item prices
        function updateItemPrices() {
            log('Updating item prices');
            
            // Process each item in the order
            $('.woocommerce-checkout-review-order-table .item').each(function() {
                const $item = $(this);
                const $info = $item.find('.info');
                const $name = $info.find('.name').first();
                const $cost = $item.find('.cost');
                const $priceEl = $cost.find('.woocommerce-Price-amount');
                
                if (!$name.length || !$priceEl.length) {
                    log('Missing required elements for item');
                    return;
                }
                
                const productName = $name.text().trim();
                log('Processing:', productName);
                
                // Get product ID if available
                let productId = $item.data('product-id');
                let isExcluded = false;
                
                // Check if product is excluded from discounts
                if (productId) {
                    isExcluded = EXCLUDED_PRODUCT_IDS.includes(parseInt(productId, 10));
                } else {
                    // Try to check by name if ID is not available
                    const nameBasedCheck = productName.includes('150') || productName.includes('153');
                    isExcluded = nameBasedCheck;
                }
                
                // Find rental dates
                const $rentalDates = $info.find('.rental-dates');
                if (!$rentalDates.length) {
                    log('No rental dates found for', productName);
                    return;
                }
                
                // Extract rental date string
                const dateText = $rentalDates.text().trim();
                const dateMatch = dateText.match(/תאריכי השכרה:?\s*(.+)/);
                if (!dateMatch || dateMatch.length < 2) {
                    log('Could not parse date text:', dateText);
                    return;
                }
                
                const dateString = dateMatch[1].trim();
                const rentalDays = calculateRentalDays(dateString);
                
                if (rentalDays <= 0) {
                    log('Invalid rental days calculation');
                    return;
                }
                
                // Get the base price
                const currentPrice = extractPrice($priceEl.text());
                if (currentPrice <= 0) {
                    log('Invalid current price');
                    return;
                }
                
                // Calculate the base price (price for one day)
                let basePrice = currentPrice;
                
                // If we already have multiple days, calculate back to base price
                if (rentalDays > 1 && !isExcluded) {
                    // For 2+ days with discount: price = basePrice + 0.5 * basePrice * (days - 1)
                    // So: basePrice = price / (1 + 0.5 * (days - 1))
                    basePrice = currentPrice / (1 + 0.5 * (rentalDays - 1));
                }
                
                // Calculate the correct price with our consistent formula
                const correctPrice = applyRentalDiscount(basePrice, rentalDays, isExcluded);
                
                // Only update if there's a significant difference
                if (Math.abs(correctPrice - currentPrice) > 0.1) {
                    log(`Price correction for ${productName}: ${currentPrice} -> ${correctPrice}`);
                    $priceEl.html(formatPrice(correctPrice));
                    
                    // Force update of breakdown if it exists
                    const $breakdown = $item.next('.rental-item-breakdown');
                    if ($breakdown.length) {
                        $breakdown.find('.rental-item-discount').first()
                            .text(`מחיר ליום ראשון: ${formatPrice(basePrice)}`);
                            
                        if (!isExcluded && rentalDays > 1) {
                            $breakdown.find('.rental-item-discount').eq(1)
                                .text(`מחיר לימים נוספים: ${formatPrice(basePrice * 0.5)} (הנחה 50%)`);
                                
                            const savings = basePrice * 0.5 * (rentalDays - 1);
                            $breakdown.find('.rental-item-savings')
                                .text(`חסכון: ${formatPrice(savings)}`);
                        }
                    }
                }
            });
            
            // Update order total after updating individual items
            updateOrderTotal();
        }
        
        // Update the order total based on item prices
        function updateOrderTotal() {
            log('Updating order total');
            
            let total = 0;
            
            // Sum up all item prices
            $('.woocommerce-checkout-review-order-table .item').each(function() {
                const $item = $(this);
                const $priceEl = $item.find('.woocommerce-Price-amount');
                
                if ($priceEl.length) {
                    const itemPrice = extractPrice($priceEl.text());
                    total += itemPrice;
                    log('Added item price:', itemPrice);
                }
            });
            
            log('Calculated total:', total);
            
            // Update the total display
            const $totalEl = $('.woocommerce-checkout-review-order-table .line + ul li:last-child p:last-child .woocommerce-Price-amount');
            if ($totalEl.length && total > 0) {
                $totalEl.html(formatPrice(total));
                log('Updated order total display');
            }
        }
        
        // Run the price update routine
        function runPriceUpdate() {
            setTimeout(function() {
                updateItemPrices();
                updateOrderTotal();
            }, 800);
        }
        
        // Run price update on page load
        runPriceUpdate();
        
        // Run after any checkout update
        $(document).on('updated_checkout', function() {
            log('Checkout updated, running price update');
            runPriceUpdate();
        });
        
        // Watch for DOM changes in the order review area
        const observer = new MutationObserver(function(mutations) {
            log('Order review DOM changed, running price update');
            runPriceUpdate();
        });
        
        // Start observing the order review table
        const $orderReview = $('.woocommerce-checkout-review-order-table');
        if ($orderReview.length) {
            observer.observe($orderReview[0], {
                childList: true,
                subtree: true,
                attributes: false,
                characterData: true
            });
        }
    }
    
    // Initialize all fixes
    function init() {
        // Handle empty cart scenarios
        handleEmptyCart();
        
        // Fix price inconsistencies
        fixPriceInconsistencies();
        
        log('All checkout fixes initialized');
    }
    
    // Initialize when ready
    init();
});
