/**
 * Price Enforcer - Dedicated script to enforce product page pricing
 * Version 1.1.0 - Enhanced reliability and compatibility
 */

jQuery(function($) {
    console.log('%c⚡ PRICE ENFORCER 1.1 - LOADED', 'background: #ff5722; color: white; font-size: 14px; padding: 5px;');
    
    // Force disable any other price manipulation scripts
    window.disableOtherPriceScripts = function() {
        if (window.cartRentalFix) window.cartRentalFix = {};
        if (window.checkoutFix) window.checkoutFix = {};
        if (window.aggressivePriceOverride) window.aggressivePriceOverride = {};
    };
    disableOtherPriceScripts();
    setTimeout(disableOtherPriceScripts, 1000);
    setTimeout(disableOtherPriceScripts, 2000);
    
    // Debug overlay
    const debugOverlay = $('<div id="price-enforcer-debug" style="position: fixed; bottom: 10px; left: 10px; background: rgba(255,87,34,0.9); color: white; padding: 8px; font-size: 12px; z-index: 999999; border-radius: 4px; max-width: 300px; max-height: 200px; overflow: auto; text-align: left; direction: ltr;"><b>Price Enforcer Active</b><div id="enforcer-log"></div></div>');
    $('body').append(debugOverlay);
    
    function log(message, type = 'info') {
        console.log(`[PRICE ENFORCER] ${message}`);
        $('#enforcer-log').prepend(`<div>${message}</div>`);
    }
    
    // Make debug overlay collapsible
    $('#price-enforcer-debug b').click(function() {
        $('#enforcer-log').toggle();
    });
    
    // Save product price on product page - enhanced version with multiple detection strategies
    function saveProductPrice() {
        // Check if we're on a product page (multiple detection methods)
        if (!$('.single-product').length && !$('body.product-template-default').length && !$('.product').length) {
            return;
        }
        
        log('Capturing product page price');
        
        // Multi-strategy product ID detection
        let productId = null;
        
        // Strategy 1: From add-to-cart inputs
        productId = $('input[name="add-to-cart"]').val() || $('button[name="add-to-cart"]').val();
        
        // Strategy 2: From product classes
        if (!productId) {
            const productClasses = $('.product').attr('class');
            if (productClasses) {
                const match = productClasses.match(/\bpost-(\d+)\b/);
                if (match) productId = match[1];
            }
        }
        
        // Strategy 3: From data attributes
        if (!productId) {
            productId = $('.product').data('product_id') || 
                      $('[data-product_id]').first().data('product_id');
        }
        
        // Strategy 4: From URL
        if (!productId) {
            const urlMatch = window.location.pathname.match(/\/(\d+)\/?$/);
            if (urlMatch) productId = urlMatch[1];
        }
        
        if (!productId) {
            log('No product ID found');
            return;
        }
        
        log('Found product ID: ' + productId);
        
        // Get rental days - enhanced detection
        let rentalDays = 1;
        const rentalDaysElements = [
            $('.rental-days').first(),
            $('.days-count').first(),
            $('[data-rental-days]').first(),
            $('*:contains("ימי השכרה")').filter(function() {
                return $(this).children().length === 0;
            }).first()
        ];
        
        for (let i = 0; i < rentalDaysElements.length; i++) {
            const el = rentalDaysElements[i];
            if (el && el.length) {
                const match = el.text().match(/\d+/);
                if (match) {
                    rentalDays = parseInt(match[0], 10);
                    log('Found rental days: ' + rentalDays);
                    break;
                }
            }
        }
        
        // Get date range - enhanced detection
        let dateRange = '';
        const dateRangeElements = [
            $('.rental-dates').first(),
            $('[data-rental-dates]').first(),
            $('.datepicker').first(),
            $('*:contains("תאריכי השכרה")').filter(function() {
                return $(this).children().length === 0;
            }).first()
        ];
        
        for (let i = 0; i < dateRangeElements.length; i++) {
            const el = dateRangeElements[i];
            if (el && el.length) {
                dateRange = el.text()
                    .replace('תאריכי ההשכרה שנבחרו:', '')
                    .replace('תאריכי השכרה:', '')
                    .trim();
                if (dateRange) {
                    log('Found date range: ' + dateRange);
                    break;
                }
            }
        }
        
        // Get price - enhanced detection with multiple strategies
        let price = 0;
        const priceElements = [
            $('.rental-price-total, .price-total, .total-price').first(),
            $('.woocommerce-Price-amount').last(),
            $('*:contains("₪")').filter(function() {
                return $(this).children().length === 0;
            }).last(),
            $('.product-price').last()
        ];
        
        for (let i = 0; i < priceElements.length; i++) {
            const el = priceElements[i];
            if (el && el.length) {
                const priceText = el.text();
                const priceMatch = priceText.match(/[\d,.]+/);
                if (priceMatch) {
                    price = parseFloat(priceMatch[0].replace(/,/g, ''));
                    log('Found price: ' + price);
                    break;
                }
            }
        }
        
        if (price > 0) {
            // Store in localStorage
            const data = {
                productId: productId,
                price: price,
                rentalDays: rentalDays,
                dateRange: dateRange,
                timestamp: new Date().getTime()
            };
            
            // Get existing prices or create new object
            let prices = {};
            try {
                const stored = localStorage.getItem('mitnafun_enforced_prices');
                if (stored) prices = JSON.parse(stored);
            } catch (e) { }
            
            // Save new price
            prices[productId] = data;
            localStorage.setItem('mitnafun_enforced_prices', JSON.stringify(prices));
            log('Saved price for product ' + productId + ': ' + price);
        }
    }
    
    // Format price consistently
    function formatPrice(price) {
        return '₪ ' + parseFloat(price).toLocaleString('he-IL', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    // Enforce prices in cart/checkout
    function enforcePrices() {
        log('Enforcing prices');
        
        // Load prices from storage
        let prices = {};
        try {
            const stored = localStorage.getItem('mitnafun_enforced_prices');
            if (stored) prices = JSON.parse(stored);
        } catch (e) {
            log('Error loading prices: ' + e.message);
            return;
        }
        
        if (Object.keys(prices).length === 0) {
            log('No prices found in storage');
            return;
        }
        
        // Process cart items
        $('.cart_item, .mini_cart_item').each(function() {
            const item = $(this);
            
            // Get product ID
            let productId = item.find('.remove').data('product_id');
            
            if (!productId) {
                // Try from href
                const href = item.find('a.remove').attr('href');
                if (href) {
                    const match = href.match(/[?&]product_id=([0-9]+)/);
                    if (match) productId = match[1];
                }
            }
            
            if (!productId) return;
            
            // Get price data
            const priceData = prices[productId];
            if (!priceData) {
                log('No price data for product ' + productId);
                return;
            }
            
            log('Enforcing price for product ' + productId + ': ' + priceData.price);
            
            // Update price display
            const formattedPrice = formatPrice(priceData.price);
            item.find('.amount, .woocommerce-Price-amount').html(formattedPrice);
            
            // Add rental info if not present
            if (!item.find('.rental-info').length) {
                const infoHtml = `
                    <div class="rental-info">
                        <div class="rental-dates">תאריכי השכרה: ${priceData.dateRange}</div>
                        <div class="rental-days">ימי השכרה: ${priceData.rentalDays}</div>
                    </div>
                `;
                item.find('.product-name').append(infoHtml);
            }
        });
        
        // Update cart totals
        updateTotals(prices);
    }
    
    // Update cart totals with enhanced reliability
    function updateTotals(prices) {
        let total = 0;
        let itemsFound = 0;
        
        // Calculate total based on items in cart
        $('.cart_item, .mini_cart_item').each(function() {
            const item = $(this);
            
            // Multi-strategy product ID detection
            let productId = null;
            
            // Strategy 1: From remove button data
            productId = item.find('.remove').data('product_id');
            
            // Strategy 2: From remove link href
            if (!productId) {
                const href = item.find('a.remove').attr('href');
                if (href) {
                    const match = href.match(/[?&]product_id=([0-9]+)/);
                    if (match) productId = match[1];
                }
            }
            
            // Strategy 3: From cart item data
            if (!productId) {
                const dataId = item.data('product_id') || item.attr('data-product_id');
                if (dataId) productId = dataId;
            }
            
            // Strategy 4: From cart item class
            if (!productId) {
                const classes = item.attr('class');
                if (classes) {
                    const match = classes.match(/product-([0-9]+)/);
                    if (match) productId = match[1];
                }
            }
            
            if (!productId || !prices[productId]) {
                log('Could not identify product ID for item or no price data available');
                return;
            }
            
            total += prices[productId].price;
            itemsFound++;
            
            // Force item price to be correct (multiple selectors for reliability)
            const formattedItemPrice = formatPrice(prices[productId].price);
            item.find('.amount, .woocommerce-Price-amount, .product-price .amount, .product-subtotal .amount').html(formattedItemPrice);
        });
        
        if (total > 0) {
            log(`Setting total to ${total} (found ${itemsFound} items)`);
            
            // Update subtotal and total with multiple reliable selectors
            const formattedTotal = formatPrice(total);
            
            // WooCommerce cart totals
            $('.cart-subtotal .amount, .order-total .amount').html(formattedTotal);
            
            // Mini cart totals
            $('.mini_cart_total .amount, .total .amount, .mini-cart-total .amount').html(formattedTotal);
            
            // Checkout review order totals
            $('#order_review .cart-subtotal .amount, #order_review .order-total .amount').html(formattedTotal);
            
            // Payment section totals
            $('.payment_box .amount').html(formattedTotal);
        }
    }
    
    // Setup event listeners
    function setupEvents() {
        // Save price on add to cart
        $(document).on('click', '.single_add_to_cart_button', function() {
            saveProductPrice();
        });
        
        // Listen for cart/checkout updates
        $(document).on('updated_cart_totals added_to_cart wc_fragments_loaded wc_fragments_refreshed', function() {
            log('Cart updated, enforcing prices');
            setTimeout(enforcePrices, 100);
        });
        
        // Monitor AJAX completions
        $(document).ajaxComplete(function() {
            setTimeout(enforcePrices, 100);
        });
    }
    
    // Run on page load
    function init() {
        setupEvents();
        
        // On product page
        if ($('.single-product').length) {
            saveProductPrice();
        }
        
        // On cart/checkout page
        if ($('.cart_item, .mini_cart_item').length) {
            enforcePrices();
        }
        
        // Set interval for continuous enforcement
        setInterval(enforcePrices, 2000);
    }
    
    // Start the script
    init();
    
    // Expose functions globally
    window.priceEnforcer = {
        enforcePrices: enforcePrices,
        saveProductPrice: saveProductPrice
    };
});
