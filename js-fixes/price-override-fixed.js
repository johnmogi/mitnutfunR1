/**
 * Fixed Price Override - Forces custom rental pricing throughout the cart
 * Version 2.0.0 - Aggressive enforcement approach
 */

jQuery(function($) {
    console.log('%c🔥 PRICE OVERRIDE FIXED - LOADED', 'background: #ffcc00; color: #000000; font-size: 16px; padding: 5px;');
    
    // Global price registry - shared across page loads
    window.mitnafunPriceRegistry = window.mitnafunPriceRegistry || {};
    
    // Helper: Format price with currency
    function formatPrice(price) {
        const formatted = parseFloat(price).toLocaleString('he-IL', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return '₪ ' + formatted;
    }
    
    // Helper: Extract price from text
    function extractPrice(text) {
        if (!text) return 0;
        const match = text.replace(/[^\d.,]/g, '').replace(',', '.').match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 0;
    }
    
    // Load from localStorage on init
    function loadFromStorage() {
        try {
            const stored = localStorage.getItem('mitnafun_rental_prices');
            if (stored) {
                const data = JSON.parse(stored);
                window.mitnafunPriceRegistry = {...data};
                console.log('Loaded prices from storage:', data);
                return true;
            }
        } catch (e) {
            console.error('Error loading from storage', e);
        }
        return false;
    }
    
    // Save price data on product page
    function captureProductPrice() {
        // Only run on product pages
        if (!$('.product_title, .type-product').length) return;
        
        console.log('Capturing product price data...');
        
        // Get product ID
        let productId = $('input[name="add-to-cart"]').val() || 
                      $('button[name="add-to-cart"]').val() ||
                      $('.single_add_to_cart_button').val();
        
        if (!productId) return;
        
        // Get price details
        let totalPrice = 0;
        let rentalDays = 1;
        let dateRange = '';
        
        // Get price from global variables or DOM
        if (window.calculatedRentalPrice) {
            totalPrice = parseFloat(window.calculatedRentalPrice);
        } else {
            const priceEl = $('.price-total, .total-price').first();
            if (priceEl.length) {
                totalPrice = extractPrice(priceEl.text());
            }
        }
        
        // Get rental days
        const daysEl = $('.rental-days, #rental-days-count').first();
        if (daysEl.length) {
            const match = daysEl.text().match(/\d+/);
            if (match) rentalDays = parseInt(match[0], 10);
        }
        
        // Get date range
        const datesEl = $('.rental-dates, #rental_dates').first();
        if (datesEl.length) {
            dateRange = datesEl.text().trim();
        }
        
        if (totalPrice > 0) {
            // Store the data
            const data = {
                productId,
                totalPrice,
                rentalDays,
                dateRange,
                timestamp: Date.now()
            };
            
            // Save to global registry
            window.mitnafunPriceRegistry[productId] = data;
            
            // Save to localStorage
            try {
                const existingData = JSON.parse(localStorage.getItem('mitnafun_rental_prices') || '{}');
                existingData[productId] = data;
                localStorage.setItem('mitnafun_rental_prices', JSON.stringify(existingData));
                console.log('Saved price data:', data);
            } catch (e) {
                console.error('Error saving to storage', e);
            }
        }
    }
    
    // Force override cart prices using interval approach
    let priceOverrideInterval;
    let overrideAttempts = 0;
    
    function startPriceOverride() {
        // Clear any existing interval
        if (priceOverrideInterval) clearInterval(priceOverrideInterval);
        
        // Reset attempts counter
        overrideAttempts = 0;
        
        // Start new interval
        priceOverrideInterval = setInterval(function() {
            // Load latest prices
            loadFromStorage();
            
            // Increment attempt counter
            overrideAttempts++;
            console.log('Price override attempt', overrideAttempts);
            
            // Find cart items
            const $items = $('.cart_item, .mini_cart_item');
            
            // Track if we made any changes
            let changesApplied = false;
            
            // Process each item
            $items.each(function() {
                const $item = $(this);
                
                // Get product ID
                let productId = $item.find('.remove').data('product_id') || 
                               $item.find('[data-product_id]').data('product_id');
                
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
                const priceData = window.mitnafunPriceRegistry[productId];
                if (!priceData || !priceData.totalPrice) return;
                
                // Format price
                const formattedPrice = formatPrice(priceData.totalPrice);
                
                // Override price
                $item.find('.woocommerce-Price-amount, .amount').each(function() {
                    const $priceEl = $(this);
                    const currentPrice = $priceEl.text().trim();
                    
                    // Only update if price is different
                    if (currentPrice !== formattedPrice) {
                        $priceEl.html(formattedPrice);
                        changesApplied = true;
                    }
                });
                
                // Add rental details if not present
                if (!$item.find('.rental-details').length && (priceData.dateRange || priceData.rentalDays)) {
                    const $details = $('<div class="rental-details"></div>');
                    
                    if (priceData.dateRange) {
                        $details.append('<div class="rental-dates">תאריכים: ' + priceData.dateRange + '</div>');
                    }
                    
                    if (priceData.rentalDays) {
                        $details.append('<div class="rental-days">ימי השכרה: ' + priceData.rentalDays + '</div>');
                    }
                    
                    $item.find('.product-name').first().append($details);
                    changesApplied = true;
                }
            });
            
            // Update subtotal
            if ($items.length > 0) {
                let total = 0;
                
                // Calculate total
                $items.each(function() {
                    const $item = $(this);
                    let productId = $item.find('.remove').data('product_id');
                    
                    if (!productId) {
                        const href = $item.find('a.remove').attr('href');
                        if (href) {
                            const match = href.match(/product_id=([0-9]+)/);
                            if (match) productId = match[1];
                        }
                    }
                    
                    if (productId && window.mitnafunPriceRegistry[productId]) {
                        total += parseFloat(window.mitnafunPriceRegistry[productId].totalPrice) || 0;
                    }
                });
                
                if (total > 0) {
                    const formattedTotal = formatPrice(total);
                    
                    // Update all subtotal/total displays
                    $('.cart-subtotal .amount, .order-total .amount').each(function() {
                        const $totalEl = $(this);
                        const currentTotal = $totalEl.text().trim();
                        
                        if (currentTotal !== formattedTotal) {
                            $totalEl.html(formattedTotal);
                            changesApplied = true;
                        }
                    });
                }
            }
            
            // Report changes
            if (changesApplied) {
                console.log('Price overrides applied!');
            }
            
            // Stop after max attempts if we're not on cart/checkout
            if (overrideAttempts >= 10 && !$('.woocommerce-cart, .woocommerce-checkout').length) {
                clearInterval(priceOverrideInterval);
                console.log('Price override complete after', overrideAttempts, 'attempts');
            }
            
            // If on cart/checkout, keep monitoring but reduce frequency
            if (overrideAttempts == 10 && $('.woocommerce-cart, .woocommerce-checkout').length) {
                clearInterval(priceOverrideInterval);
                priceOverrideInterval = setInterval(arguments.callee, 3000); // Continue but less frequently
            }
        }, 1000);
    }
    
    // Set up event listeners
    function setupEvents() {
        // Add to cart on product page
        $(document).on('click', '.single_add_to_cart_button', function() {
            captureProductPrice();
        });
        
        // Listen for cart/checkout updates
        $(document).on('wc_fragments_loaded wc_fragments_refreshed updated_cart_totals added_to_cart', function() {
            console.log('Cart updated - restarting price override');
            startPriceOverride();
        });
        
        // Listen for AJAX completions
        $(document).ajaxComplete(function(event, xhr, settings) {
            if (settings.url && settings.url.includes('wc-ajax=')) {
                console.log('WC AJAX completed - checking prices');
                startPriceOverride();
            }
        });
    }
    
    // Initial setup
    loadFromStorage();
    setupEvents();
    
    // Capture price on product page
    if ($('.product_title, .type-product').length) {
        captureProductPrice();
        
        // Listen for rental date selection events
        $(document).on('rentalDateSelection', function(e, data) {
            if (data && data.price) {
                window.calculatedRentalPrice = data.price;
                setTimeout(captureProductPrice, 500);
            }
        });
    }
    
    // Start price override on cart/checkout pages
    if ($('.woocommerce-cart, .woocommerce-checkout, .cart_totals').length || 
        $('.cart_item, .mini_cart_item').length) {
        console.log('Cart/checkout detected - starting price override');
        startPriceOverride();
    }
});
