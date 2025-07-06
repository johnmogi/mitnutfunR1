/**
 * Minimal Price Override - Forces custom rental pricing throughout the cart
 * Version 1.0.1 - Enhanced debugging
 */

jQuery(document).ready(function($) {
    console.log('%c🔥 PRICE OVERRIDE SCRIPT LOADED 🔥', 'background: #ffcc00; color: #000000; font-size: 20px; padding: 10px;');
    
    // Show visible debug overlay on page
    function showDebugOverlay() {
        const debugDiv = $('<div id="price-override-debug" style="position: fixed; bottom: 10px; left: 10px; background: rgba(255,204,0,0.9); z-index: 9999; padding: 10px; border-radius: 5px; max-width: 300px; font-size: 12px; direction: ltr;"></div>');
        $('body').append(debugDiv);
        updateDebugOverlay('Price Override script loaded!', 'green');
    }
    
    // Update debug overlay with new message
    function updateDebugOverlay(message, color) {
        const debugDiv = $('#price-override-debug');
        if (debugDiv.length) {
            const timestamp = new Date().toLocaleTimeString();
            debugDiv.append(`<div style="margin-bottom: 5px; color: ${color || 'black'}"><b>${timestamp}:</b> ${message}</div>`);
            // Scroll to bottom
            debugDiv.scrollTop(debugDiv.prop('scrollHeight'));
            // Limit to 10 messages
            if (debugDiv.children().length > 10) {
                debugDiv.children().first().remove();
            }
        }
    }
    
    // Create debug overlay
    showDebugOverlay();
    
    console.log('🔥 PRICE OVERRIDE - ENFORCING CUSTOM PRICES 🔥');
    updateDebugOverlay('Initializing price enforcement...', 'blue');
    
    // Global registry for price data across page loads
    window.mitnafunPriceRegistry = window.mitnafunPriceRegistry || {};
    
    // Load existing data from localStorage
    function initFromLocalStorage() {
        try {
            const existingData = localStorage.getItem('mitnafun_rental_prices');
            if (existingData) {
                const parsed = JSON.parse(existingData);
                window.mitnafunPriceRegistry = parsed;
                console.log('Loaded price data from localStorage:', parsed);
            }
        } catch (e) {
            console.error('Error loading from localStorage', e);
        }
    }
    
    // Initialize on page load
    initFromLocalStorage();
    
    // Save rental price data from product page
    function saveRentalPriceData() {
        console.log('%c📝 SAVE PRICE DATA - START', 'background: #4CAF50; color: white; padding: 3px; border-radius: 2px;');
        updateDebugOverlay('🔍 Attempting to capture product price...', '#4CAF50');
        
        // Get product ID
        let productId = $('input[name="add-to-cart"]').val() || 
                      $('button[name="add-to-cart"]').val() ||
                      $('.single_add_to_cart_button').val();
                      
        if (!productId) {
            // Try to extract from URL
            const urlMatch = window.location.pathname.match(/product\/(.*?)\/([0-9]+)/);
            if (urlMatch && urlMatch[2]) {
                productId = urlMatch[2];
            }
        }
        
        if (!productId) {
            console.log('Product ID not found, cannot capture price');
            return false;
        }
        
        console.log('Found product ID:', productId);
        
        // Get rental days
        let rentalDays = 1;
        const rentalDaysEl = $('.rental-days, #rental-days-count, .rental-days-value').first();
        if (rentalDaysEl.length) {
            const daysText = rentalDaysEl.text();
            const daysMatch = daysText.match(/\d+/);
            if (daysMatch) {
                rentalDays = parseInt(daysMatch[0], 10);
            }
        }
        
        // Get rental dates
        let dateRange = '';
        const dateRangeEl = $('.rental-dates, #rental_dates, .datepicker-value').first();
        if (dateRangeEl.length) {
            dateRange = dateRangeEl.text().trim() || dateRangeEl.val();
        }
        
        // Get price
        let totalPrice = 0;
        
        // Try global variables first (set by datepicker)
        if (window.calculatedRentalPrice && !isNaN(parseFloat(window.calculatedRentalPrice))) {
            totalPrice = parseFloat(window.calculatedRentalPrice);
        } else if (window.rentalPrice && !isNaN(parseFloat(window.rentalPrice))) {
            totalPrice = parseFloat(window.rentalPrice);
        } else {
            // Try DOM elements
            const priceEl = $('.price-total, .total-price, .woocommerce-Price-amount').first();
            if (priceEl.length) {
                const priceText = priceEl.text();
                const priceMatch = priceText.match(/[\d,.]+/);
                if (priceMatch) {
                    totalPrice = parseFloat(priceMatch[0].replace(/,/g, ''));
                }
            }
        }
        
        if (totalPrice === 0) {
            console.log('Total price not found');
            console.log('%c❌ PRICE CAPTURE FAILED - No price found', 'background: #f44336; color: white; padding: 3px; border-radius: 2px;');
            updateDebugOverlay('❌ Failed: No price found', 'red');
            return false;
        }
        
        console.log('%c✅ PRICE CAPTURED', 'background: #4CAF50; color: white; padding: 3px; border-radius: 2px;', 
            {productId, totalPrice, rentalDays, dateRange});
        updateDebugOverlay(`✅ Price captured: ${totalPrice} for product ${productId}`, 'green');

        // Create rental data object
        const rentalData = {
            productId: productId,
            totalPrice: totalPrice,
            rentalDays: rentalDays,
            dateRange: dateRange,
            timestamp: Date.now()
        };

        // Store in localStorage
        try {
            // Get existing data
            let storedData = {};
            const existing = localStorage.getItem('mitnafun_rental_prices');
            if (existing) {
                storedData = JSON.parse(existing);
            }
            
            // Update with new data
            storedData[productId] = rentalData;
            
            // Save back to localStorage
            localStorage.setItem('mitnafun_rental_prices', JSON.stringify(storedData));
            console.log('Saved to localStorage:', rentalData);
            
            // Also update global registry
            window.mitnafunPriceRegistry[productId] = rentalData;
            
            return true;
        } catch (e) {
            console.error('Error saving to localStorage', e);
            // Still update the global registry
            window.mitnafunPriceRegistry[productId] = rentalData;
            return false;
        }
    }
    
    // Format price
    function formatPrice(price) {
        if (!price) return '₪ 0';
        return '₪ ' + price.toLocaleString('he-IL');
    }
    
    // Update cart prices
    function updateCartPrices() {
        console.log('%c🛒 CART PRICE OVERRIDE - START', 'background: #2196F3; color: white; padding: 3px; border-radius: 2px;');
        updateDebugOverlay('🛒 Enforcing custom prices in cart...', '#2196F3');
        
        // Load all price data
        const priceData = {...window.mitnafunPriceRegistry};
        try {
            const stored = localStorage.getItem('mitnafun_rental_prices');
            if (stored) {
                Object.assign(priceData, JSON.parse(stored));
            }
        } catch (e) {
            console.error('Error loading price data', e);
        }
        
        // Update cart items
        $('.cart_item, .mini_cart_item').each(function() {
            const $item = $(this);
            
            // Get product ID
            let productId = $item.find('.remove').data('product_id') || 
                          $item.data('product_id');
            
            if (!productId) {
                // Try from href
                const href = $item.find('a.remove').attr('href');
                if (href) {
                    const match = href.match(/product_id=([0-9]+)/);
                    if (match) productId = match[1];
                }
            }
            
            if (!productId) return;
            
            // Get price data
            const data = priceData[productId];
            if (!data || !data.totalPrice) return;
            
            // Format price
            const formattedPrice = formatPrice(data.totalPrice);
            
            // Update price displays
            $item.find('.woocommerce-Price-amount, .amount, .price').each(function() {
                $(this).html(formattedPrice);
            });
            
            // Add rental details if not already present
            if (!$item.find('.rental-details').length) {
                const $details = $('<div class="rental-details" style="font-size: 0.8em; opacity: 0.8;"></div>');
                
                if (data.dateRange) {
                    $details.append('<div class="rental-dates">' + data.dateRange + '</div>');
                }
                
                if (data.rentalDays) {
                    $details.append('<div class="rental-days">ימי השכרה: ' + data.rentalDays + '</div>');
                }
                
                $item.find('.product-name, .product-title').first().after($details);
            }
        });
        
        // Update cart totals
        updateTotals();
    }
    
    // Update cart totals
    function updateTotals() {
        let total = 0;
        
        // Get all price data
        const priceData = {...window.mitnafunPriceRegistry};
        try {
            const stored = localStorage.getItem('mitnafun_rental_prices');
            if (stored) {
                Object.assign(priceData, JSON.parse(stored));
            }
        } catch (e) {}
        
        // Sum up prices from cart items
        $('.cart_item, .mini_cart_item').each(function() {
            const $item = $(this);
            
            // Get product ID
            let productId = $item.find('.remove').data('product_id') || 
                          $item.data('product_id');
            
            if (!productId) {
                // Try from href
                const href = $item.find('a.remove').attr('href');
                if (href) {
                    const match = href.match(/product_id=([0-9]+)/);
                    if (match) productId = match[1];
                }
            }
            
            if (!productId) return;
            
            // Get price data
            const data = priceData[productId];
            if (!data || !data.totalPrice) return;
            
            // Add to total
            total += parseFloat(data.totalPrice);
        });
        
        // Format total
        const formattedTotal = formatPrice(total);
        
        // Update subtotal displays
        $('.cart-subtotal .amount, .order-total .amount, .total-cart-price').html(formattedTotal);
    }
    
    // Set up event listeners
    function setupEvents() {
        // Product page - capture price on add to cart
        $(document).on('click', '.single_add_to_cart_button', saveRentalPriceData);
        
        // Cart/checkout - update prices when cart updates
        $(document).on('wc_fragments_loaded wc_fragments_refreshed updated_cart_totals added_to_cart', updateCartPrices);
        
        // Listen for rental date selection events
        $(document).on('rentalDateSelection', function(e, data) {
            if (data && data.price) window.calculatedRentalPrice = data.price;
        });
        
        // Ajax completion - might be cart updates
        $(document).ajaxComplete(function(event, xhr, settings) {
            if (settings.url && settings.url.indexOf('wc-ajax=') !== -1) {
                setTimeout(updateCartPrices, 500);
            }
        });
    }
    
    // Set up events
    setupEvents();
    
    // Add entry to document title to show script is active
    document.title = '🔥 ' + document.title;
    
    // Alert in case console is not open
    setTimeout(function() {
        if (!window.__priceOverrideConfirmed) {
            // Add a div to top of page
            const alertDiv = $('<div style="background: #ffcc00; padding: 10px; text-align: center; font-weight: bold; position: fixed; top: 0; left: 0; right: 0; z-index: 999999;">PRICE OVERRIDE SCRIPT IS ACTIVE - CHECK CONSOLE FOR DEBUG INFO</div>');
            $('body').prepend(alertDiv);
            // Remove after 5 seconds
            setTimeout(function() { alertDiv.fadeOut(); }, 5000);
            window.__priceOverrideConfirmed = true;
        }
    }, 500);
    
    // Force price update with delay to ensure it runs
    setTimeout(function() {
        updateDebugOverlay('⚡ Forcing immediate price update...', 'orange');
        updateCartPrices();
        if ($('.item, .cart_item, .mini_cart_item').length) {
            updateDebugOverlay('✓ Cart items found: ' + $('.item, .cart_item, .mini_cart_item').length, 'green');
        } else {
            updateDebugOverlay('✗ No cart items found!', 'red');
        }
    }, 1500);
    
    // Initial run
    setTimeout(function() {
        // On product page
        if ($('.product_title, .type-product').length) {
            saveRentalPriceData();
        }
        
        // On cart/checkout page
        if ($('.cart_item, .mini_cart_item').length) {
            updateCartPrices();
        }
    }, 1000);
    
    // Export for debugging
    window.mitnafun = window.mitnafun || {};
    window.mitnafun.updateCartPrices = updateCartPrices;
    window.mitnafun.saveRentalPriceData = saveRentalPriceData;
    window.mitnafun.debugOverlay = {
        show: showDebugOverlay,
        update: updateDebugOverlay,
        log: function(msg) { console.log(msg); updateDebugOverlay(msg); }
    };
});
