/**
 * Product Price Transfer - Forces custom rental pricing throughout the cart system
 * 
 * Aggressively captures calculated rental prices from the product page,
 * stores them in localStorage, and forces them into all cart/checkout displays
 */

jQuery(document).ready(function($) {
    console.log('Product Price Transfer JS loaded - AGGRESSIVE MODE');
    
    // Global price registry - keeps track of prices for each product
    window.mitnafunPriceRegistry = window.mitnafunPriceRegistry || {};
    
    // Debug mode
    const DEBUG = true;

    // Function to save price data to localStorage
    function saveRentalPriceData() {
        console.log('Attempting to save rental price data...');
        
        // Try multiple ways to get the product ID
        let productId = $('input[name="add-to-cart"]').val() || 
                      $('button[name="add-to-cart"]').val() || 
                      $('.content').data('product-id') || 
                      $('.product_title').data('product-id');
                      
        if (!productId) {
            // Try to get from URL if needed
            const urlMatch = window.location.pathname.match(/product\/(.*?)\/([0-9]+)/);
            if (urlMatch && urlMatch[2]) {
                productId = urlMatch[2];
            }
        }
        
        if (!productId) {
            console.log('Product ID not found');
            return;
        }
        
        console.log('Found product ID:', productId);
        
        // Get calculated rental days
        let rentalDays = 1;
        // Try multiple selectors with Hebrew text for rental days
        const rentalDaysEl = $('*:contains("מספר ימי השכרה")').last().parent();
        if (rentalDaysEl.length > 0) {
            const daysText = rentalDaysEl.text().trim();
            console.log('Found rental days text:', daysText);
            const daysMatch = daysText.match(/\d+/);
            if (daysMatch) {
                rentalDays = parseInt(daysMatch[0], 10);
                console.log('Extracted rental days:', rentalDays);
            }
        } else {
            // Fallback to other selectors
            const altRentalDaysEl = $('#rental-days-count, .rental-days-value, .rental-days strong').first();
            if (altRentalDaysEl.length > 0) {
                const daysText = altRentalDaysEl.text().trim();
                const daysMatch = daysText.match(/\d+/);
                if (daysMatch) {
                    rentalDays = parseInt(daysMatch[0], 10);
                    console.log('Extracted rental days from alternative selector:', rentalDays);
                }
            }
        }
        
        // Get dates from selection or input
        let dateRange = '';
        let startDate = '';
        let endDate = '';
        
        // Try with Hebrew text first
        const hebrewDateEl = $('*:contains("תאריכי השכרה")').last();
        if (hebrewDateEl.length > 0) {
            const dateText = hebrewDateEl.text().trim();
            console.log('Found Hebrew date text:', dateText);
            const dateMatch = dateText.match(/(\d{1,2}\.\d{1,2}\.\d{4})\s*-\s*(\d{1,2}\.\d{1,2}\.\d{4})/);
            if (dateMatch) {
                startDate = dateMatch[1].trim();
                endDate = dateMatch[2].trim();
                dateRange = startDate + ' - ' + endDate;
                console.log('Extracted dates from Hebrew text:', startDate, endDate);
            }
        }
        
        // Fallback to other selectors if needed
        if (!dateRange) {
            const dateEl = $('#rental_dates, .rental-dates-display, .rental-dates strong').first();
            if (dateEl.length > 0) {
                dateRange = dateEl.text().trim() || dateEl.val();
                if (dateRange) {
                    const dates = dateRange.split(' - ');
                    if (dates.length === 2) {
                        startDate = dates[0].trim();
                        endDate = dates[1].trim();
                        console.log('Extracted dates from standard selector:', startDate, endDate);
                    }
                }
            }
        }
        
        // Get the calculated total price - specifically target the Hebrew "סה"כ" (total) text
        let totalPrice = 0;
        
        // Look for the Hebrew total price label (סה"כ)
        const hebrewTotalEl = $('*:contains("סה"כ")').last();
        if (hebrewTotalEl.length > 0) {
            const priceText = hebrewTotalEl.text().trim();
            console.log('Found Hebrew total price element:', priceText);
            const priceMatch = priceText.match(/[\d,.]+/);
            if (priceMatch) {
                totalPrice = parseFloat(priceMatch[0].replace(/,/g, '').replace(/\s/g, ''));
                console.log('Extracted price from Hebrew total:', totalPrice);
            }
        }
        
        // If still not found, try other selectors
        if (totalPrice === 0) {
            // Try different selectors for price
            const priceEl = $('.rental-price-value, .price-breakdown .total-price, .price-total, .price .amount, .price ins .amount').first();
            if (priceEl.length > 0) {
                const priceText = priceEl.text().trim();
                console.log('Found standard price element:', priceText);
                const priceMatch = priceText.match(/[\d,.]+/);
                if (priceMatch) {
                    totalPrice = parseFloat(priceMatch[0].replace(/,/g, '').replace(/\s/g, ''));
                    console.log('Extracted price from standard element:', totalPrice);
                }
            }
        }
        
        // Try to get the calculated price from window variables
        if (totalPrice === 0) {
            console.log('Could not find total price, trying calculated price');
            // Try to get the calculated price from the rental datepicker if available
            if (window.calculatedRentalPrice) {
                totalPrice = parseFloat(window.calculatedRentalPrice);
                console.log('Found price from window.calculatedRentalPrice:', totalPrice);
            } else if (window.rentalPrice) {
                totalPrice = parseFloat(window.rentalPrice);
                console.log('Found price from window.rentalPrice:', totalPrice);
            }
        }
        
        // Last resort: manually search for price in all elements containing numbers with ₪ symbol
        if (totalPrice === 0) {
            console.log('Still no price found, trying comprehensive search');
            $('*:contains("₪")').each(function() {
                const text = $(this).text().trim();
                if (text.includes('סה"כ') || text.includes('סכום') || text.includes('מחיר')) {
                    console.log('Potential price element found:', text);
                    const match = text.match(/[\d,.]+/g);
                    if (match && match.length > 0) {
                        // Use the last number if multiple found (usually the total)
                        const potentialPrice = parseFloat(match[match.length - 1].replace(/,/g, '').replace(/\s/g, ''));
                        if (potentialPrice > totalPrice) {
                            totalPrice = potentialPrice;
                            console.log('Updated price from comprehensive search:', totalPrice);
                        }
                    }
                }
            });
        }
        
        if (totalPrice === 0) {
            console.log('Total price not found after all attempts');
            return;
        }
        
        console.log('Final price found:', totalPrice, 'Rental days:', rentalDays);

        // Create rental data object
        const rentalData = {
            productId: productId,
            totalPrice: totalPrice,
            rentalDays: rentalDays,
            dateRange: dateRange,
            startDate: startDate,
            endDate: endDate,
            timestamp: Date.now()
        };

        // Get existing data from localStorage or initialize empty object
        let storedRentalData = localStorage.getItem('mitnafun_rental_prices');
        let rentalDataObj = {};
        
        if (storedRentalData) {
            try {
                rentalDataObj = JSON.parse(storedRentalData);
            } catch (e) {
                console.error('Error parsing stored rental data', e);
                rentalDataObj = {};
            }
        }

        // Update data for this product
        rentalDataObj[productId] = rentalData;

        // Save back to localStorage
        localStorage.setItem('mitnafun_rental_prices', JSON.stringify(rentalDataObj));
        console.log('Saved rental price data for product ' + productId, rentalData);
    }

    // Function to force update all cart prices with our custom pricing
    function updateMiniCartPrices() {
        if (DEBUG) console.log('AGGRESSIVE: Forcing custom prices in cart/mini-cart...');
        
        // Only run if we have cart items
        if ($('.item').length === 0) {
            if (DEBUG) console.log('No cart items found to update');
            return;
        }

        // Get stored rental price data
        const storedRentalData = localStorage.getItem('mitnafun_rental_prices');
        let rentalDataObj = {};
        
        if (storedRentalData) {
            try {
                rentalDataObj = JSON.parse(storedRentalData);
                if (DEBUG) console.log('Retrieved rental data from storage:', rentalDataObj);
            } catch (e) {
                console.error('Error parsing stored rental data', e);
            }
        }
        
        // Also use our in-memory registry as a backup/supplement
        rentalDataObj = {...rentalDataObj, ...window.mitnafunPriceRegistry};
        if (DEBUG) console.log('Combined price data:', rentalDataObj);

        // Process each cart item
        $('.item').each(function() {
            // Try multiple methods to get the product ID
            let productId = null;
            
            // Method 1: Try to get from remove button data attribute
            const removeLink = $(this).find('.remove_from_cart_button');
            if (removeLink.length > 0) {
                productId = removeLink.data('product_id');
                console.log('Found product ID from remove button:', productId);
            }
            
            // Method 2: Try to get from item container data attribute if present
            if (!productId && $(this).data('product-id')) {
                productId = $(this).data('product-id');
                console.log('Found product ID from item container:', productId);
            }
            
            // Method 3: Try to extract from rental dates container
            if (!productId) {
                const rentalDatesContainer = $(this).find('.rental-dates-container');
                if (rentalDatesContainer.length > 0) {
                    try {
                        const cartItemData = rentalDatesContainer.data('cart-item');
                        if (cartItemData && cartItemData.product_id) {
                            productId = cartItemData.product_id;
                            console.log('Found product ID from rental dates container:', productId);
                        }
                    } catch (e) {
                        console.log('Error reading rental dates container data');
                    }
                }
            }
            
                
                if (isRtl) {
                    formattedPrice = productData.totalPrice.toLocaleString('he-IL') + ' ₪';
                } else {
                    formattedPrice = '₪ ' + productData.totalPrice.toLocaleString('en-US');
                }
            }
        });

        // Update subtotal
        updateSubtotal();
    }

    // Function to update subtotal in mini-cart and checkout
    function updateSubtotal() {
        console.log('Updating subtotals...');
        let subtotal = 0;
        
        // Add up all displayed prices from the stored rental data
        const storedRentalData = localStorage.getItem('mitnafun_rental_prices');
        if (storedRentalData) {
            try {
                const rentalDataObj = JSON.parse(storedRentalData);
                
                // Get all product IDs in the cart
                let cartProductIds = [];
                $('.item').each(function() {
                    // Try multiple methods to get the product ID
                    let productId = null;
                    
                    // Method 1: From remove button
                    const removeLink = $(this).find('.remove_from_cart_button');
                    if (removeLink.length > 0) {
                        productId = removeLink.data('product_id');
                    }
                    
                    // Method 2: From rental dates container
                    if (!productId) {
                        const rentalDatesContainer = $(this).find('.rental-dates-container');
                        if (rentalDatesContainer.length > 0 && rentalDatesContainer.data('cart-item')) {
                            try {
                                const cartItemData = rentalDatesContainer.data('cart-item');
                                if (cartItemData && cartItemData.product_id) {
                                    productId = cartItemData.product_id;
                                }
                            } catch (e) {}
                        }
                    }
                    
                    // Method 3: From product link
                    if (!productId) {
                        const productLink = $(this).find('.name a').attr('href');
                        if (productLink) {
                            const urlMatch = productLink.match(/product\/(.*?)\/(\d+)/);
                            if (urlMatch && urlMatch[2]) {
                                productId = urlMatch[2];
                            } else {
                                const alternativeMatch = productLink.match(/\/(\d+)\/?$/);
                                if (alternativeMatch && alternativeMatch[1]) {
                                    productId = alternativeMatch[1];
                                }
                            }
                        }
                    }
                    
                    if (productId) {
                        cartProductIds.push(productId);
                    }
                });
                
                // Sum up prices for products in the cart
                cartProductIds.forEach(productId => {
                    if (rentalDataObj[productId]) {
                        const price = parseFloat(rentalDataObj[productId].totalPrice);
                        if (!isNaN(price)) {
                            subtotal += price;
                            console.log(`Adding price ${price} for product ${productId} to subtotal`);
                        }
                    }
                });
                
                console.log('Calculated total subtotal:', subtotal);
            } catch (e) {
                console.error('Error calculating subtotal from stored data', e);
            }
        }
        
        // If we couldn't calculate from stored data, fallback to displayed prices
        if (subtotal === 0) {
            console.log('Fallback: calculating subtotal from displayed prices');
            $('.item').each(function() {
                const priceText = $(this).find('.cost .mini-cart.rental-price').text();
                if (priceText) {
                    const priceMatch = priceText.match(/[\d,.]+/);
                    if (priceMatch) {
                        const price = parseFloat(priceMatch[0].replace(/,/g, ''));
                        if (!isNaN(price)) {
                            subtotal += price;
                            console.log(`Adding displayed price ${price} to subtotal`);
                        }
                    }
                }
            });
        }

        // Format the subtotal with Hebrew/RTL formatting
        const formattedSubtotal = subtotal.toLocaleString('he-IL', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        console.log('Final formatted subtotal:', formattedSubtotal);

        // Update mini-cart subtotal
        const subtotalContainer = $('.mini-cart-subtotal .subtotal-value');
        if (subtotalContainer.length > 0) {
            const currencySymbol = subtotalContainer.find('.woocommerce-Price-currencySymbol').text() || '₪';
            const subtotalHtml = `<span class="woocommerce-Price-amount amount"><bdi>${formattedSubtotal}&nbsp;<span class="woocommerce-Price-currencySymbol">${currencySymbol}</span></bdi></span>`;
            
            subtotalContainer.html(subtotalHtml);
            console.log('Updated mini-cart subtotal display');
        }
        
        // Update checkout subtotal if on checkout page
        const checkoutSubtotal = $('.cart-subtotal .amount');
        if (checkoutSubtotal.length > 0) {
            const currencySymbol = checkoutSubtotal.find('.woocommerce-Price-currencySymbol').text() || '₪';
            const subtotalHtml = `<span class="woocommerce-Price-amount amount"><bdi>${formattedSubtotal}&nbsp;<span class="woocommerce-Price-currencySymbol">${currencySymbol}</span></bdi></span>`;
            
            checkoutSubtotal.html(subtotalHtml);
            console.log('Updated checkout page subtotal display');
        }
        
        // Update order total if on checkout page
        const orderTotal = $('.order-total .amount');
        if (orderTotal.length > 0) {
            const currencySymbol = orderTotal.find('.woocommerce-Price-currencySymbol').text() || '₪';
            const totalHtml = `<span class="woocommerce-Price-amount amount"><bdi>${formattedSubtotal}&nbsp;<span class="woocommerce-Price-currencySymbol">${currencySymbol}</span></bdi></span>`;
            
            orderTotal.html(totalHtml);
            console.log('Updated checkout page order total display');
        }
    }

    // Capture calculated rental price from datepicker
    $(document).on('rentalDateSelection', function(e, data) {
        if (data && data.price) {
            console.log('Captured price from rental datepicker event:', data.price);
            window.calculatedRentalPrice = data.price;
            saveRentalPriceData();
        }
    });
    
    // Save price data when the add to cart button is clicked
    $(document).on('click', 'button[name="add-to-cart"]', function() {
        console.log('Add to cart clicked, saving rental price data');
        saveRentalPriceData();
    });

    // Update prices when mini-cart is shown or updated
    $(document).on('click', '.cart-btn, .btn-default, .cart-contents', function() {
        console.log('Cart button clicked, updating mini-cart prices after delay');
        // Use setTimeout to allow mini-cart to fully load
        setTimeout(updateMiniCartPrices, 300);
    });
    
    // Also listen for mini-cart updates via AJAX
    $(document.body).on('wc_fragments_loaded wc_fragments_refreshed added_to_cart removed_from_cart', function() {
        console.log('WC fragments updated, updating mini-cart prices');
        setTimeout(updateMiniCartPrices, 300);
    });

    // Update prices on checkout page load
    if ($('body').hasClass('woocommerce-checkout')) {
        console.log('Checkout page detected, updating prices');
        setTimeout(updateMiniCartPrices, 300);
    }

    // Initialize - save price data if on product page with rental dates
    if ($('#rental_dates, .rental-dates').length > 0) {
        console.log('Product page with rental dates detected, saving initial data');
        saveRentalPriceData();
    }

    // Initialize - update prices if mini-cart is shown
    if ($('.item').length > 0) {
        console.log('Mini-cart items detected, updating prices');
        setTimeout(updateMiniCartPrices, 100);
    }
    
    // Add window-level event listener for debug access
    window.updateMiniCartPrices = updateMiniCartPrices;
    window.saveRentalPriceData = saveRentalPriceData;
});
