/**
 * Minimal Price Override - Forces custom rental pricing throughout the cart
 * Version 1.0.0 - Simplified implementation
 */

jQuery(document).ready(function($) {
    console.log('Minimal Price Override JS loaded - ENFORCING CUSTOM PRICES');
    
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
        console.log('Capturing rental price data...');
        
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
            return false;
        }
        
        console.log('Captured data:', {productId, totalPrice, rentalDays, dateRange});

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
        console.log('Enforcing custom prices in cart...');
        
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
});
