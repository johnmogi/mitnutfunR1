/**
 * Aggressive Price Override - Forces custom rental pricing throughout the cart
 * COMPLETE REWRITE - Version 1.0.0
 */

jQuery(document).ready(function($) {
    console.log('Aggressive Price Override JS loaded - ENFORCING CUSTOM PRICES');
    
    // Global price registry - accessible across page loads
    window.mitnafunPriceRegistry = window.mitnafunPriceRegistry || {};
    
    // Debug - always on for now
    const DEBUG = true;
    
    // Initialize from localStorage on page load
    function initFromLocalStorage() {
        try {
            const existingData = localStorage.getItem('mitnafun_rental_prices');
            if (existingData) {
                const parsed = JSON.parse(existingData);
                // Copy to our global registry
                window.mitnafunPriceRegistry = parsed;
                console.log('LOADED PRICE DATA FROM STORAGE:', parsed);
                return true;
            }
        } catch (e) {
            console.error('Error loading from localStorage', e);
        }
        return false;
    }
    
    // Initialize on page load
    initFromLocalStorage();
    
    // Direct price capture - get the price from the product page
    function saveRentalPriceData() {
        console.log('CAPTURE: Aggressively capturing rental price data...');
        
        // Get product ID - try multiple methods
        let productId = $('input[name="add-to-cart"]').val() || 
                      $('button[name="add-to-cart"]').val() ||
                      $('.single_add_to_cart_button').val() ||
                      $('.content').data('product-id') || 
                      $('.product_title').data('product-id');
                      
        if (!productId) {
            // Try to extract from URL
            const urlMatch = window.location.pathname.match(/product\/(.*?)\/([0-9]+)/);
            if (urlMatch && urlMatch[2]) {
                productId = urlMatch[2];
                console.log('Extracted product ID from URL:', productId);
            }
        }
        
        if (!productId) {
            console.log('ERROR: Product ID not found, cannot capture price');
            return false;
        }
        
        console.log('Found product ID:', productId);
        
        // Get calculated rental days - try multiple methods
        let rentalDays = 1;
        
        // First try finding "מספר ימי השכרה" (number of rental days in Hebrew)
        const rentalDaysElements = $('*:contains("מספר ימי השכרה")');
        if (rentalDaysElements.length > 0) {
            // Loop through elements to find one with actual number
            rentalDaysElements.each(function() {
                const daysText = $(this).text();
                const daysMatch = daysText.match(/\d+/);
                if (daysMatch) {
                    rentalDays = parseInt(daysMatch[0], 10);
                    console.log('Found rental days from Hebrew label:', rentalDays);
                    return false; // Break the each loop
                }
            });
        }
        
        // Fallback - try other common selectors if still 1
        if (rentalDays === 1) {
            const altSelectors = [
                '#rental-days-count', 
                '.rental-days-value', 
                '.rental-days strong',
                '.rental-days',
                '#rental_days',
                '.days-count'
            ];
            
            for (const selector of altSelectors) {
                const el = $(selector);
                if (el.length > 0) {
                    const daysText = el.text().trim();
                    const daysMatch = daysText.match(/\d+/);
                    if (daysMatch) {
                        rentalDays = parseInt(daysMatch[0], 10);
                        console.log('Found rental days from', selector, ':', rentalDays);
                        break;
                    }
                }
            }
        }
        
        // Get dates - try multiple methods
        let dateRange = '';
        let startDate = '';
        let endDate = '';
        
        // Try with Hebrew text first ("תאריכי השכרה" - rental dates)
        const dateElements = $('*:contains("תאריכי השכרה")');
        if (dateElements.length > 0) {
            dateElements.each(function() {
                const dateText = $(this).text().trim();
                const dateMatch = dateText.match(/(\d{1,2}\.\d{1,2}\.\d{4})\s*-\s*(\d{1,2}\.\d{1,2}\.\d{4})/);
                if (dateMatch) {
                    startDate = dateMatch[1].trim();
                    endDate = dateMatch[2].trim();
                    dateRange = startDate + ' - ' + endDate;
                    console.log('Found dates from Hebrew text:', dateRange);
                    return false; // Break each loop
                }
            });
        }
        
        // Fallback for dates
        if (!dateRange) {
            const dateSelectors = [
                '#rental_dates', 
                '.rental-dates-display', 
                '.rental-dates',
                '.datepicker-value',
                '#rental-dates'
            ];
            
            for (const selector of dateSelectors) {
                const el = $(selector);
                if (el.length > 0) {
                    dateRange = el.text().trim() || el.val();
                    if (dateRange) {
                        const dates = dateRange.split(' - ');
                        if (dates.length === 2) {
                            startDate = dates[0].trim();
                            endDate = dates[1].trim();
                            console.log('Found dates from', selector, ':', dateRange);
                            break;
                        }
                    }
                }
            }
        }
        
        // Get the calculated total price - specifically target the Hebrew "סה"כ" (total) text
        let totalPrice = 0;
        
        // First try the global variable which should have been set by the datepicker
        if (window.calculatedRentalPrice && !isNaN(parseFloat(window.calculatedRentalPrice))) {
            totalPrice = parseFloat(window.calculatedRentalPrice);
            console.log('Using price from calculatedRentalPrice:', totalPrice);
        } 
        // Then try window.rentalPrice which might also be set
        else if (window.rentalPrice && !isNaN(parseFloat(window.rentalPrice))) {
            totalPrice = parseFloat(window.rentalPrice);
            console.log('Using price from window.rentalPrice:', totalPrice);
        }
        // Finally try to extract from DOM
        else {
            console.log('Searching DOM for prices');
            
            // Look for the Hebrew total price label (סה"כ)
            const totalElements = $('*:contains("סה"כ")');
            if (totalElements.length > 0) {
                // Look through each element containing this text
                totalElements.each(function() {
                    const priceText = $(this).text().trim();
                    console.log('Found Hebrew total element:', priceText);
                    const priceMatch = priceText.match(/[\d,.]+/);
                    if (priceMatch) {
                        const candidate = parseFloat(priceMatch[0].replace(/,/g, '').replace(/\s/g, ''));
                        if (candidate > 0) {
                            totalPrice = candidate;
                            console.log('Extracted price from Hebrew total:', totalPrice);
                            return false; // Break the each loop
                        }
                    }
                });
            }
            
            // If still not found, try other selectors
            if (totalPrice === 0) {
                const priceSelectors = [
                    '.rental-price-value', 
                    '.price-breakdown .total-price', 
                    '.price-total',
                    '.woocommerce-Price-amount.amount',
                    '.price .amount', 
                    '.price ins .amount',
                    '.rental-price',
                    '#rental-price'
                ];
                
                for (const selector of priceSelectors) {
                    const el = $(selector).first();
                    if (el.length > 0) {
                        const priceText = el.text().trim();
                        console.log('Found price element', selector, ':', priceText);
                        const priceMatch = priceText.match(/[\d,.]+/);
                        if (priceMatch) {
                            const candidate = parseFloat(priceMatch[0].replace(/,/g, '').replace(/\s/g, ''));
                            if (candidate > 0) {
                                totalPrice = candidate;
                                console.log('Extracted price from', selector, ':', totalPrice);
                                break;
                            }
                        }
                    }
                }
            }
            
            // Last resort: search all elements with ₪ symbol
            if (totalPrice === 0) {
                console.log('Still no price found, trying comprehensive search');
                $('*:contains("₪")').each(function() {
                    const text = $(this).text().trim();
                    if (text.includes('סה"כ') || text.includes('סכום') || text.includes('מחיר')) {
                        console.log('Potential price element found:', text);
                        const match = text.match(/[\d,.]+/g);
                        if (match && match.length > 0) {
                            // Use the last number if multiple found (usually the total)
                            const candidate = parseFloat(match[match.length - 1].replace(/,/g, '').replace(/\s/g, ''));
                            if (candidate > 0 && (totalPrice === 0 || candidate > totalPrice)) {
                                totalPrice = candidate;
                                console.log('Updated price from comprehensive search:', totalPrice);
                            }
                        }
                    }
                });
            }
        }
        
        if (totalPrice === 0) {
            console.log('ERROR: Total price not found after all attempts');
            return false;
        }
        
        console.log('FINAL CAPTURE: Price:', totalPrice, 'Rental days:', rentalDays);

        // Create rental data object with all info
        const rentalData = {
            productId: productId,
            totalPrice: totalPrice,
            rentalDays: rentalDays,
            dateRange: dateRange,
            startDate: startDate,
            endDate: endDate,
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
            console.log('SAVED TO LOCALSTORAGE: Product', productId, 'data:', rentalData);
            
            // Also update global registry
            window.mitnafunPriceRegistry[productId] = rentalData;
            console.log('UPDATED GLOBAL REGISTRY');
            
            return true;
        } catch (e) {
            console.error('Error saving to localStorage', e);
            // Still update the global registry even if localStorage fails
            window.mitnafunPriceRegistry[productId] = rentalData;
            return false;
        }
    }

    // Force update all prices in cart
    function forceUpdateCartPrices() {
        console.log('FORCE UPDATE: Enforcing custom prices throughout cart');
        
        // Loop through all cart items and update prices
        $('.cart_item, .mini_cart_item').each(function() {
            const item = $(this);
            
            // Try to get the product ID
            let productId = item.find('.remove').data('product_id') || 
                         item.data('product_id') || 
                         item.attr('data-product_id');
            
            // Fallback - try to extract from href of remove link
            if (!productId) {
                const removeLink = item.find('.remove').attr('href');
                if (removeLink) {
                    const match = removeLink.match(/product_id=([0-9]+)/);
                    if (match && match[1]) productId = match[1];
                }
            }
            
            // If still no product ID, try other approaches
            if (!productId) {
                const classes = item.attr('class');
                if (classes) {
                    const classMatch = classes.match(/product-([0-9]+)/);
                    if (classMatch && classMatch[1]) productId = classMatch[1];
                }
            }
            
            if (!productId) {
                console.log('Could not determine product ID for cart item', item);
                return; // Skip this item
            }
            
            // Find the stored rental data for this product
            const rentalData = window.mitnafunPriceRegistry[productId] || getRentalDataFromLocalStorage(productId);
            if (!rentalData || !rentalData.totalPrice) {
                console.log('No rental data found for product', productId);
                return; // Skip this item
            }
            
            // Format price (add currency symbol, commas, etc.)
            const formattedPrice = formatPrice(rentalData.totalPrice);
            
            // Update price display
            const priceElements = item.find('.woocommerce-Price-amount, .amount, .price, .product-price, .product-subtotal');
            priceElements.each(function() {
                $(this).html(formattedPrice);
                console.log('Updated price element to:', formattedPrice);
            });
            
            // Add rental details if not already present
            if (!item.find('.rental-details').length) {
                const rentalDetails = $('<div class="rental-details" style="font-size: 0.8em; opacity: 0.8;"></div>');
                
                // Add date range
                if (rentalData.dateRange) {
                    rentalDetails.append('<div class="rental-dates">' + rentalData.dateRange + '</div>');
                }
                
                // Add rental days
                if (rentalData.rentalDays) {
                    rentalDetails.append('<div class="rental-days">ימי השכרה: ' + rentalData.rentalDays + '</div>');
                }
                
                // Insert after the product name
                const productName = item.find('.product-name, .product-title');
                if (productName.length) {
                    rentalDetails.insertAfter(productName);
                } else {
                    // Fallback - just append to the item
                    item.append(rentalDetails);
                }
                
                console.log('Added rental details to cart item');
            }
        });
        
        // Force update the subtotal display
        updateCartTotals();
    }
    
    // Get rental data from localStorage for a specific product
    function getRentalDataFromLocalStorage(productId) {
        try {
            const data = localStorage.getItem('mitnafun_rental_prices');
            if (data) {
                const parsed = JSON.parse(data);
                return parsed[productId];
            }
        } catch (e) {
            console.error('Error retrieving from localStorage', e);
        }
        return null;
    }
    
    // Format price with currency symbol and commas
    function formatPrice(price) {
        if (!price) return '₪ 0';
        
        // Format with commas for thousands
        const formatted = price.toLocaleString('he-IL');
        return '₪ ' + formatted;
    }
    
    // Force update all cart prices
    function forceUpdateCartPrices() {
        console.log('Forcing custom prices in cart...');
        
        // Get stored data
        let priceData = {};
        try {
            const stored = localStorage.getItem('mitnafun_rental_prices');
            if (stored) priceData = {...JSON.parse(stored), ...window.mitnafunPriceRegistry};
            else priceData = {...window.mitnafunPriceRegistry};
        } catch (e) { console.error('Error loading price data', e); }
        
        // Update each cart item
        $('.item, .cart_item, .woocommerce-cart-form__cart-item').each(function() {
            const $item = $(this);
            
            // Get product ID
            let productId = $item.find('.remove_from_cart_button').data('product_id') || 
                          $item.data('product-id') || 
                          $item.find('a.remove').data('product_id');
            
            if (!productId) {
                // Try from remove link href
                const href = $item.find('a.remove').attr('href');
                if (href) {
                    const match = href.match(/product_id=([0-9]+)/);
                    if (match) productId = match[1];
                }
            }
            
            if (!productId) return;
            
            // Get saved price data
            const data = priceData[productId];
            if (!data) return;
            
            // Update price displays
            const $prices = $item.find('.price, .amount, .woocommerce-Price-amount');
            if ($prices.length) {
                const isRtl = $('html').attr('dir') === 'rtl' || $('body').hasClass('rtl');
                const formatted = isRtl ? 
                    data.totalPrice.toLocaleString('he-IL') + ' ₪' : 
                    '₪ ' + data.totalPrice.toLocaleString();
                
                $prices.each(function() {
                    const $price = $(this);
                    if ($price.find('.woocommerce-Price-amount').length) {
                        $price.find('.woocommerce-Price-amount').html(
                            '<span class="woocommerce-Price-currencySymbol">₪</span>' + 
                            data.totalPrice.toLocaleString()
                        );
                    } else if ($price.hasClass('woocommerce-Price-amount')) {
                        $price.html(
                            '<span class="woocommerce-Price-currencySymbol">₪</span>' + 
                            data.totalPrice.toLocaleString()
                        );
                    } else {
                        $price.html(formatted);
                    }
                });
            }
            
            // Add/update rental information
            if (!$item.find('.rental-days').length && data.rentalDays) {
                $item.find('.product-title, .product-name, .name').first()
                    .after('<div class="rental-days">ימי השכרה: ' + data.rentalDays + '</div>');
            }
            
            if (!$item.find('.rental-dates').length && data.dateRange) {
                $item.find('.rental-days, .product-title, .product-name').first()
                    .after('<div class="rental-dates">תאריכי השכרה: ' + data.dateRange + '</div>');
            }
        });
        
        // Update subtotal
        updateSubtotal();
    }

    // Update all subtotals
    function updateSubtotal() {
        let total = 0;
        const priceData = {};
        
        // Load price data
        try {
            const stored = localStorage.getItem('mitnafun_rental_prices');
            if (stored) Object.assign(priceData, JSON.parse(stored));
            Object.assign(priceData, window.mitnafunPriceRegistry);
        } catch (e) { console.error('Error loading price data', e); }
        
        // Sum prices from cart items
        $('.item, .cart_item').each(function() {
            let productId = $(this).find('.remove_from_cart_button').data('product_id') || 
                          $(this).find('a.remove').data('product_id');
                          
            if (productId && priceData[productId]) {
                total += parseFloat(priceData[productId].totalPrice) || 0;
            }
        });
        
        // Format subtotal
        const formattedTotal = total.toLocaleString('he-IL', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        // Update subtotal displays
        $('.mini-cart-subtotal .subtotal-value, .cart-subtotal .amount, .order-total .amount').each(function() {
            const $container = $(this);
            const symbol = $container.find('.woocommerce-Price-currencySymbol').text() || '₪';
            $container.html(
                '<span class="woocommerce-Price-amount amount"><bdi>' + 
                formattedTotal + '&nbsp;<span class="woocommerce-Price-currencySymbol">' + 
                symbol + '</span></bdi></span>'
            );
        });
    }
    
    // Hook into relevant events
    $(document).on('click', '.single_add_to_cart_button', saveRentalPriceData);
    $(document).on('wc_fragments_loaded wc_fragments_refreshed updated_cart_totals', forceUpdateCartPrices);
    $(document).on('rentalDateSelection', function(e, data) {
        if (data && data.price) window.calculatedRentalPrice = data.price;
    });
    
    
    $(document).ajaxComplete(function(event, xhr, settings) {
        if (settings.url && settings.url.indexOf('wc-ajax=') !== -1) {
            setTimeout(forceUpdateCartPrices, 500);
        }
    });

    // Initial run
    setTimeout(function() {
        if ($('.product_title, .type-product').length) saveRentalPriceData();
        if ($('.item, .cart_item').length) forceUpdateCartPrices();
    }, 1000);
    
    // Export for debugging
    window.forceUpdateCartPrices = forceUpdateCartPrices;
    window.saveRentalPriceData = saveRentalPriceData;
});

