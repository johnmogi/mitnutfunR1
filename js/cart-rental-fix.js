/**
 * Cart and Mini-Cart Rental Fix
 * Unified script to fix display issues with rental products in cart and mini-cart
 * Centralized from previously separate cart-rental-fix.js and mini-cart-fix.js
 */

(function($) {
    'use strict';
    
    // CRITICAL FIX: Make sure the cart is visible after page load and when proceeding to checkout
    $(window).on('load', function() {
        // Force cart to be visible if it has items but is hidden (both basket and checkout pages)
        if (window.location.href.includes('/basket/') || window.location.href.includes('/checkout/')) {
            setTimeout(forceShowCart, 100);
        }
    });
    
    // Also trigger cart fix when clicking checkout buttons
    $(document).on('click', '.checkout-button, .btn-mini, a[href*="checkout"]', function(e) {
        // Don't process admin links or non-checkout links
        if ($(this).closest('.wp-admin').length || !this.href || !this.href.includes('checkout')) {
            return;
        }
        
        // Ensure cart fragments are up to date before proceeding to checkout
        debugLog('Checkout button clicked - ensuring cart data is preserved');
        
        if (typeof wc_cart_fragments_params !== 'undefined') {
            // Ensure cart has items before proceeding
            const cartItemCount = $('.item').length || $('.cart_item').length;
            
            if (cartItemCount === 0) {
                debugLog('No cart items found! Attempting to refresh fragments first');
                
                // Show loading indicator to user
                $('<span class="checkout-loading">מעדכן את העגלה...</span>').insertAfter($(this)).css({
                    'display': 'inline-block',
                    'margin-right': '10px',
                    'color': '#666'
                });
                
                // Try to refresh fragments
                $(document.body).trigger('wc_fragment_refresh');
                
                // Give fragments time to refresh
                setTimeout(() => {
                    // If still no items after refresh, warn the user
                    const updatedCartItemCount = $('.item').length || $('.cart_item').length;
                    
                    if (updatedCartItemCount === 0) {
                        debugLog('Still no cart items after refresh - showing warning');
                        alert('העגלה ריקה. אנא בחר מוצרים לפני המשך לתשלום.');
                        
                        // Prevent checkout redirect if cart is empty
                        e.preventDefault();
                        $('.checkout-loading').remove();
                        
                        // Redirect to shop instead
                        window.location.href = '/shop/';
                    } else {
                        // Cart has items now, proceed to checkout
                        debugLog('Cart items found after refresh - proceeding to checkout');
                        window.location.href = $(this).attr('href');
                    }
                }, 1000);
                
                // Prevent the default action to let our custom handling take over
                e.preventDefault();
            } else {
                // Cart has items, make sure fragments are updated
                debugLog('Cart has items - updating fragments before checkout');
                $(document.body).trigger('wc_fragment_refresh');
                
                // Store a flag that we're proceeding to checkout with items
                sessionStorage.setItem('proceeding_to_checkout', 'true');
            }
        }
    });
    
    // Force cart to be visible if it has items
    function forceShowCart() {
        // Works on both cart and checkout pages
        const isCartPage = window.location.href.includes('/basket/');
        const isCheckoutPage = window.location.href.includes('/checkout/');
        
        if (!isCartPage && !isCheckoutPage) return;
        
        console.log('[Cart Fix] Checking if cart needs to be forced visible on ' + (isCartPage ? 'cart' : 'checkout') + ' page...');
        
        // Check if cart empty message is showing
        const $emptyNotice = $('.cart-empty.woocommerce-info, .woocommerce-info:contains("עגלת הקניות שלך ריקה")');
        
        // Check if cart/checkout content exists
        const $cartTable = isCartPage ? $('.woocommerce-cart-form__contents, form.woocommerce-cart-form') : $('.woocommerce-checkout-review-order-table');
        
        // If empty notice is showing but cart fragments exist (meaning cart has items)
        if ($emptyNotice.length > 0 && typeof wc_cart_fragments_params !== 'undefined') {
            console.log('[Cart Fix] Empty cart showing but fragments exist - fixing visibility');
            
            // Hide empty cart notice
            $emptyNotice.hide();
            
            // If cart/checkout content is hidden or missing
            if ($cartTable.length === 0 || !$cartTable.is(':visible')) {
                console.log('[Cart Fix] Cart/checkout content missing or hidden - fixing...');
                
                // Show loading message
                $('<div class="woocommerce-info">טוען את פריטי העגלה שלך...</div>').insertAfter($emptyNotice);
                
                // Force refresh cart fragments from server
                $(document.body).trigger('wc_fragment_refresh');
                
                // If completely missing, force reload after updating fragments
                if ($cartTable.length === 0) {
                    console.log('[Cart Fix] Content missing completely - will reload page');
                    
                    // Store a flag indicating we're fixing the cart
                    sessionStorage.setItem('fixing_cart', 'true');
                    
                    // Reload page without cache after short delay
                    setTimeout(function() {
                        window.location.reload(true);
                    }, 1500);
                }
            }
        }
        
        // If we just reloaded the page and cart is still empty, redirect back to shop
        if (sessionStorage.getItem('fixing_cart') === 'true') {
            sessionStorage.removeItem('fixing_cart');
            
            // If the cart is still empty after our fix attempt
            if ($('.woocommerce-checkout-review-order-table').length === 0 && isCheckoutPage) {
                console.log('[Cart Fix] Still empty after reload - redirecting to shop');
                $('<div class="woocommerce-info">העגלה ריקה, מוביל לחנות...</div>').insertAfter($('h1').first());
                
                // Redirect to shop after a delay
                setTimeout(function() {
                    window.location.href = '/shop/';
                }, 2000);
            }
        }
    }
    
    // Debug logging helper
    function debugLog(...args) {
        console.log('[Cart Rental Fix]', ...args);
    }
    
    // Configuration
    const EXCLUDED_PRODUCT_IDS = [150, 153]; // Products excluded from the discount
    
    // Wait for DOM to be ready
    $(document).ready(function() {
        debugLog('Initializing cart and mini-cart rental fixes...');
        
        // Fix 1: Remove blockUI overlays that never get removed
        removeEndlessSpinners();
        
        // Fix 2: Update rental date display in cart items
        fixRentalDateDisplay();
        
        // Fix 3: Fix mini-cart display and alignment
        fixMiniCart();
        
        // Fix 4: Setup enhanced item removal handling
        handleMiniCartRemoval();
        
        // Fix 5: Watch for AJAX complete events and reapply fixes
        $(document).ajaxComplete(function(event, xhr, settings) {
            // Give WooCommerce time to process the response
            setTimeout(function() {
                removeEndlessSpinners();
                fixRentalDateDisplay();
                fixMiniCart();
            }, 500);
        });
    });
    
    /**
     * Remove endless spinners from the cart/checkout
     */
    function removeEndlessSpinners() {
        debugLog('Checking for endless spinners...');
        
        // Check if there are blockUI overlays that have been there too long
        const $spinners = $('.blockUI.blockOverlay');
        
        if ($spinners.length > 0) {
            debugLog(`Found ${$spinners.length} potential endless spinners`);  
            
            // Remove blockUI overlays from the cart fragments/checkout
            $spinners.each(function() {
                const $spinner = $(this);
                const $parent = $spinner.parent();
                
                // Only remove spinners that are over cart elements or checkout review
                if ($parent.find('.cart_item').length > 0 || 
                    $parent.find('.cart-container').length > 0 || 
                    $parent.hasClass('woocommerce-checkout-review-order-table') || 
                    $parent.hasClass('cart_totals')) {
                    
                    debugLog('Removing endless spinner', $spinner);
                    $spinner.remove();
                    
                    // Also remove any blockUI message elements
                    $parent.find('.blockUI.blockMsg').remove();
                }
            });
        }
    }
    
    /**
     * Fix rental date display in cart items
     */
    function fixRentalDateDisplay() {
        debugLog('Fixing rental date display...');
        
        // Find all cart items that might be rentals
        $('.item').each(function() {
            const $item = $(this);
            const $dateContainer = $item.find('.info p:nth-child(2)');
            
            // Skip if this doesn't look like the date container
            if (!$dateContainer.length) return;
            
            const dateText = $dateContainer.text().trim();
            
            // If the date text is empty or just contains 'null', try to find it elsewhere
            if (!dateText || dateText === 'null') {
                debugLog('Empty date found, attempting to fix', $item);
                
                // Check if our enhanced template left data to use
                const $rentalContainer = $item.find('.rental-dates-container');
                if ($rentalContainer.length) {
                    try {
                        // Try to parse the cart item data
                        const cartItemData = $rentalContainer.data('cart-item');
                        if (cartItemData) {
                            debugLog('Found cart item data', cartItemData);
                            
                            // Process any rental info we can find
                            if (cartItemData.dates) {
                                $dateContainer.html('<div class="rental-dates"><strong>תאריכי השכרה:</strong> ' + 
                                    cartItemData.dates + '</div>');
                                debugLog('Fixed date display from data attribute', cartItemData.dates);
                            }
                        }
                    } catch (err) {
                        debugLog('Error parsing cart item data', err);
                    }
                }
                
                // Try to find the rental dates in any data attributes
                const $cartItem = $item.closest('.cart_item');
                if ($cartItem.length) {
                    const itemKey = $cartItem.attr('data-cart-item-key') || 
                                  $item.find('.remove_from_cart_button').data('cart_item_key');
                    
                    if (itemKey) {
                        // Use session storage as a temporary fix if we stored dates there
                        const storedDates = sessionStorage.getItem('rental_dates_' + itemKey);
                        if (storedDates) {
                            $dateContainer.html('<div class="rental-dates-display"><strong>תאריכי השכרה:</strong> ' + 
                                storedDates + '</div>');
                            debugLog('Fixed date display from session storage', storedDates);
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Store currently selected dates in session storage before adding to cart
     * This helps recover dates if they get lost in the cart
     * Also handles direct-to-checkout functionality
     */
    function setupDateRecovery() {
        // When add to cart button is clicked, store the selected dates
        $('.single_add_to_cart_button').on('click', function() {
            const rentalDates = $('input[name="rental_dates"]').val();
            if (rentalDates) {
                // Get product ID from different possible sources
                const productId = $('input[name="add-to-cart"]').val() || 
                                 $('[name="product_id"]').val() ||
                                 $('.content').data('product-id');
                                 
                if (productId) {
                    // Store dates both by product ID and with timestamp
                    sessionStorage.setItem('rental_dates_' + productId, rentalDates);
                    const tempKey = 'rental_dates_' + productId + '_' + Date.now();
                    sessionStorage.setItem(tempKey, rentalDates);
                    debugLog('Stored rental dates for recovery', {productId, rentalDates});
                    
                    // Store additional data to help with checkout
                    const quantityVal = $('input[name="quantity"]').val() || 1;
                    const checkoutData = {
                        product_id: productId,
                        rental_dates: rentalDates,
                        quantity: quantityVal,
                        timestamp: Date.now()
                    };
                    
                    sessionStorage.setItem('last_added_rental', JSON.stringify(checkoutData));
                    
                    // Check if this is a direct-to-checkout button (buy now)
                    if ($(this).hasClass('buy-now') || $(this).closest('form').find('input[name="is_buy_now"]').length) {
                        debugLog('Direct to checkout clicked - ensuring rental dates are preserved');
                        
                        // Mark that we're going to checkout with this item
                        sessionStorage.setItem('proceeding_to_checkout_with_rental', 'true');
                    }
                    
                    // Clean up old entries after 10 minutes
                    setTimeout(function() {
                        sessionStorage.removeItem(tempKey);
                    }, 600000);
                } else {
                    debugLog('Could not find product ID for date storage');
                }
            }
        });
        
        // Check for direct-to-checkout on page load (e.g. when redirected to checkout page)
        if (window.location.href.includes('/checkout/')) {
            if (sessionStorage.getItem('proceeding_to_checkout_with_rental') === 'true') {
                debugLog('Detected checkout with rental product - ensuring dates are preserved');
                
                // Remove the flag
                sessionStorage.removeItem('proceeding_to_checkout_with_rental');
                
                // Add a small delay to ensure cart is loaded before checking
                setTimeout(function() {
                    // Check if rental dates appear in the checkout summary
                    const hasRentalDates = $('.woocommerce-checkout-review-order-table').text().includes('תאריכי השכרה');
                    
                    if (!hasRentalDates) {
                        debugLog('Rental dates not found in checkout - attempting to recover');
                        
                        // Try to get the last added rental product data
                        const lastRentalDataStr = sessionStorage.getItem('last_added_rental');
                        if (lastRentalDataStr) {
                            try {
                                const lastRental = JSON.parse(lastRentalDataStr);
                                debugLog('Found last rental data:', lastRental);
                                
                                // Add debug info to the page
                                $('.woocommerce-checkout').prepend(
                                    '<div class="rental-dates-debug" style="display:none;">' + 
                                    'Product ID: ' + lastRental.product_id + '<br>' +
                                    'Rental Dates: ' + lastRental.rental_dates + '<br>' +
                                    'Quantity: ' + lastRental.quantity + 
                                    '</div>'
                                );
                            } catch (e) {
                                debugLog('Error parsing last rental data:', e);
                            }
                        }
                    }
                }, 1000);
            }
        }
    }
    
    /**
     * Fix Mini Cart UI and recalculate prices
     */
    function fixMiniCart() {
        // Target the mini cart elements
        const $miniCart = $('.check-popup');
        if (!$miniCart.length) return;
        
        debugLog('Fixing mini cart UI and calculations');
        
        // Ensure RTL is properly applied
        $miniCart.attr('dir', 'rtl');
        
        // Fix alignment of items
        $('.item', $miniCart).css({
            'display': 'flex',
            'flex-direction': 'row',
            'align-items': 'flex-start',
            'justify-content': 'space-between',
            'text-align': 'right',
            'direction': 'rtl'
        });
        
        // Fix text alignment
        $('.text', $miniCart).css({
            'text-align': 'right',
            'direction': 'rtl'
        });
        
        // Remove unwanted load more button that appears on archive pages
        $('.lmp_load_more_button', $miniCart).remove();
        
        // Remove any rental discount info text lines
        $('.rental-discount-info').remove();
        
        // Fix rental days display and pricing consistency
        fixRentalDaysDisplay();
        
        // Clear any old rental price breakdowns to avoid duplication
        $('.rental-item-breakdown').remove();
    }
    
    /**
     * Handle Mini Cart Item Removal
     * Fixes UI after removing an item and prevents cart emptying errors
     * FIXED: Now properly removes items and updates the cart
     */
    function handleMiniCartRemoval() {
        // Better version of cart item removal that ensures nonces are used and fragments properly updated
        function patchWooCommerceRemoval() {
            // Check if either WooCommerce cart params object is available
            const hasWcParams = typeof window.wc_add_to_cart_params !== 'undefined' || typeof window.wc_cart_fragments_params !== 'undefined';
            
            // Get the AJAX URL and nonce from either available params object - use let instead of const to allow reassignment
            let ajaxUrl = hasWcParams ? 
                (window.wc_add_to_cart_params ? window.wc_add_to_cart_params.ajax_url : window.wc_cart_fragments_params.ajax_url) : 
                '/wp-admin/admin-ajax.php'; // Fallback to default WordPress AJAX URL
                
            const nonce = hasWcParams ? 
                (window.wc_add_to_cart_params ? window.wc_add_to_cart_params.nonce : window.wc_cart_fragments_params.nonce) : 
                ''; // If no nonce, the request may fail but we'll handle that gracefully
                
            debugLog('Setting up enhanced cart removal handler');
            debugLog('Has WC params:', hasWcParams);
            
            // CRITICAL FIX: Prevent WooCommerce default remove item handlers 
            // This prevents the JS error in add-to-cart.min.js
            function overrideWooCommerceHandlers() {
                // First approach: Try to detach any existing document event handlers for cart removal
                try {
                    // If jQuery._data is available, use it to inspect event handlers
                    if (jQuery._data) {
                        const events = jQuery._data(document.body, "events");
                        if (events && events.click) {
                            // Look through click handlers for any targeting .remove_from_cart_button
                            events.click = events.click.filter(function(event) {
                                // Keep only our handlers (ones we just added with 'enhanced' class)
                                if (event.selector && 
                                    event.selector.includes('remove_from_cart_button') && 
                                    !event.selector.includes('enhanced')) {
                                    debugLog('Removed WooCommerce default cart removal handler');
                                    return false;
                                }
                                return true;
                            });
                        }
                    }
                } catch (err) {
                    debugLog('Error trying to remove WooCommerce event handlers:', err);
                }
                
                // Second approach: Modify WooCommerce's cart object directly
                if (typeof window.wc_add_to_cart_params !== 'undefined') {
                    try {
                        // Override WooCommerce's cart handlers if they exist
                        if (window.wc_add_to_cart_params && typeof window.wc_add_to_cart_params.cart_redirect_after_add !== 'undefined') {
                            // Save original handler if needed for future reference
                            if (!window._original_wc_cart_handler && window.wc_add_to_cart_js) {
                                window._original_wc_cart_handler = window.wc_add_to_cart_js;
                            }
                            
                            // Monkey patch the onRemoveFromCart method
                            if (window.wc_add_to_cart_js && window.wc_add_to_cart_js.prototype && window.wc_add_to_cart_js.prototype.onRemoveFromCart) {
                                const originalRemove = window.wc_add_to_cart_js.prototype.onRemoveFromCart;
                                window.wc_add_to_cart_js.prototype.onRemoveFromCart = function(e) {
                                    // Only run original handler if the target doesn't have our 'enhanced' class
                                    const $thisbutton = $(e.currentTarget);
                                    if (!$thisbutton.hasClass('enhanced')) {
                                        return originalRemove.apply(this, arguments);
                                    }
                                    // Otherwise, do nothing and let our handler work
                                    return false;
                                };
                                debugLog('Successfully patched WooCommerce onRemoveFromCart method');
                            }
                        }
                    } catch (err) {
                        debugLog('Error trying to patch WooCommerce cart object:', err);
                    }
                }
            }
            
            // Apply the override
            overrideWooCommerceHandlers();
            
            // Add specific class to track our handled buttons (different from 'enhanced' for clarity)
            $('.remove_from_cart_button').addClass('mit-patched');
            
            // Remove any existing handlers for our buttons to avoid duplicates
            $(document.body).off('click', '.remove_from_cart_button.mit-patched');
            
            // Instead of fighting with WooCommerce, we'll enhance its behavior
            // First, let's make sure our buttons have the right classes and data attributes
            $('.remove_from_cart_button, a.remove').each(function() {
                const $button = $(this);
                
                // Ensure the button has the required data attributes
                if (!$button.data('cart_item_key') && $button.attr('href')) {
                    const href = $button.attr('href') || '';
                    const match = href.match(/remove_item=([^&]*)/);
                    if (match && match[1]) {
                        const cartItemKey = decodeURIComponent(match[1]);
                        $button.attr('data-cart_item_key', cartItemKey);
                        $button.data('cart_item_key', cartItemKey);
                        
                        // Add nonce if missing
                        const nonceMatch = href.match(/_wpnonce=([^&]*)/);
                        if (nonceMatch && nonceMatch[1] && !$button.data('nonce')) {
                            $button.attr('data-nonce', decodeURIComponent(nonceMatch[1]));
                            $button.data('nonce', decodeURIComponent(nonceMatch[1]));
                        }
                    }
                }
                
                // Add our marker class
                $button.addClass('mit-patched');
            });
            
            // Listen for WooCommerce's fragment refresh to update our UI
            $(document.body).on('wc_fragments_refreshed removed_from_cart wc_fragment_refresh', function() {
                debugLog('Cart fragments refreshed, applying UI fixes');
                // Small delay to ensure DOM is updated
                setTimeout(function() {
                    fixMiniCart();
                    fixRentalDateDisplay();
                    
                    // Re-apply our handler to any new remove buttons
                    $('.remove_from_cart_button:not(.mit-patched), a.remove:not(.mit-patched)').each(function() {
                        const $button = $(this);
                        if ($button.attr('href')) {
                            const href = $button.attr('href');
                            const match = href.match(/remove_item=([^&]*)/);
                            if (match && match[1]) {
                                const cartItemKey = decodeURIComponent(match[1]);
                                $button.attr('data-cart_item_key', cartItemKey);
                                $button.data('cart_item_key', cartItemKey);
                                
                                const nonceMatch = href.match(/_wpnonce=([^&]*)/);
                                if (nonceMatch && nonceMatch[1]) {
                                    $button.attr('data-nonce', decodeURIComponent(nonceMatch[1]));
                                    $button.data('nonce', decodeURIComponent(nonceMatch[1]));
                                }
                                
                                $button.addClass('mit-patched');
                            }
                        }
                    });
                }, 100);
            });
            
            // Add a click handler that uses direct URL navigation
            $(document.body).on('click', '.remove_from_cart_button, a.remove', function(e) {
                const $button = $(this);
                const $item = $button.closest('.item, .mini_cart_item, .cart_item');
                let href = $button.attr('href') || '';
                
                // Extract the cart item key and nonce
                const cartItemKey = $button.data('cart_item_key') || '';
                const nonce = $button.data('nonce') || '';
                
                // If no href, try to extract from the current URL
                if (!href && cartItemKey && nonce) {
                    href = window.location.pathname + 
                           '?remove_item=' + encodeURIComponent(cartItemKey) + 
                           '&_wpnonce=' + encodeURIComponent(nonce);
                }
                
                debugLog('Removing item via direct URL:', { href, cartItemKey, nonce });
                
                if (!href) {
                    debugLog('No valid URL found for removal');
                    alert('לא ניתן להסיר את הפריט. אנא נסה שוב.');
                    return false;
                }
                
                // Use direct AJAX call to WooCommerce cart endpoint
                // This is more reliable than form submission or URL navigation
                
                // Show visual feedback
                $item.css('opacity', '0.5');
                $item.append('<div class="removing-item">מסיר פריט...</div>');
                
                // Add a small loading animation
                const $loader = $('<div class="item-remove-loader"></div>').css({
                    'position': 'absolute',
                    'top': '50%',
                    'left': '50%',
                    'transform': 'translate(-50%, -50%)',
                    'width': '20px',
                    'height': '20px',
                    'border-radius': '50%',
                    'border': '2px solid #f3f3f3',
                    'border-top': '2px solid #3498db',
                    'animation': 'item-remove-spin 1s linear infinite'
                });
                
                // Add keyframes for the spinner
                if (!$('#item-remove-spinner-style').length) {
                    $('<style id="item-remove-spinner-style">@keyframes item-remove-spin {0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); }}</style>').appendTo('head');
                }
                
                $item.css('position', 'relative').append($loader);
                
                // Use WooCommerce's own AJAX endpoint instead of form submission
                $.ajax({
                    type: 'POST',
                    url: ajaxUrl,
                    data: {
                        action: 'woocommerce_remove_from_cart',
                        cart_item_key: cartItemKey, 
                        security: nonce || '' // Use nonce if available
                    },
                    success: function(response) {
                        debugLog('Item removed via AJAX', response);
                        
                        // Update fragments
                        if (response && response.fragments) {
                            // Update each fragment
                            $.each(response.fragments, function(key, value) {
                                $(key).replaceWith(value);
                            });
                        }
                        
                        // Ensure our fixes are applied
                        setTimeout(function() {
                            fixMiniCart();
                            fixRentalDateDisplay();
                            removeEndlessSpinners();
                        }, 100);
                    },
                    error: function(xhr, status, error) {
                        debugLog('Error removing item:', error);
                        
                        // If AJAX fails, fallback to direct URL navigation
                        if (href) {
                            window.location.href = href;
                        } else {
                            // Remove loading state
                            $item.css('opacity', '1');
                            $('.item-remove-loader, .removing-item').remove();
                            alert('לא ניתן להסיר את הפריט. אנא נסה שוב או רענן את הדף.');
                        }
                    },
                    complete: function() {
                        // Ensure cart fragments are refreshed
                        $(document.body).trigger('wc_fragment_refresh');
                    }
                });
                
                // Prevent default action
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            });
            
            // Handle fragment refresh to update UI
            $(document.body).on('wc_fragments_refreshed removed_from_cart wc_fragment_refresh', function() {
                debugLog('Cart fragments refreshed, applying UI fixes');
                // Small delay to ensure DOM is updated
                setTimeout(function() {
                    fixMiniCart();
                    fixRentalDateDisplay();
                    
                    // Re-apply our handler to any new remove buttons
                    $('.remove_from_cart_button:not(.mit-patched)').addClass('mit-patched');
                }, 100);
            });
            
            // Ensure cart state is consistent by refreshing fragments regularly
            // This helps prevent the empty cart issue when fragments get out of sync
            function ensureCartConsistency() {
                // Only run on cart/checkout pages where consistency is critical
                if (window.location.href.includes('/basket/') || 
                    window.location.href.includes('/checkout/')) {
                    
                    debugLog('Running cart consistency check');
                    
                    // Check if fragments exist but cart appears empty
                    const hasFragments = typeof wc_cart_fragments_params !== 'undefined';
                    const $cartItems = $('.woocommerce-cart-form__contents tr.cart_item, .woocommerce-checkout-review-order-table .cart_item');
                    const cartIsEmpty = $cartItems.length === 0;
                    
                    // If fragments exist but cart shows as empty, force refresh
                    if (hasFragments && cartIsEmpty) {
                        debugLog('Cart inconsistency detected: has fragments but appears empty');
                        $(document.body).trigger('wc_fragment_refresh');
                        
                        // Apply our fixes after refresh
                        setTimeout(function() {
                            forceShowCart();
                            fixMiniCart();
                            fixRentalDateDisplay();
                            removeEndlessSpinners();
                        }, 500);
                    }
                }
            }
            
            // Debounce function to prevent excessive updates
            function debounce(func, wait) {
                let timeout;
                return function() {
                    const context = this;
                    const args = arguments;
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(context, args), wait);
                };
            }
            
            // Create debounced version that runs less frequently
            const debouncedCartCheck = debounce(ensureCartConsistency, 500);
            
            // Keep track of last check time
            let lastConsistencyCheck = Date.now();
            
            // Only run consistency checks when needed and not too frequently
            let consistencyInterval = setInterval(function() {
                // Only run every 10 seconds at most, and only on cart/checkout pages
                const now = Date.now();
                if ((now - lastConsistencyCheck > 10000) && 
                    (window.location.href.includes('/basket/') || window.location.href.includes('/checkout/'))) {
                    lastConsistencyCheck = now;
                    ensureCartConsistency();
                }
            }, 10000); // Every 10 seconds instead of 3
            
            // Run after user interactions with debounce to prevent multiple rapid triggers
            $(document).on('click', '.cart_item, .checkout-button', debouncedCartCheck);
        }
        
        // Run the improved patch
        patchWooCommerceRemoval();
    }
    
    /**
     * Fix rental days display to ensure consistency
     * This ensures Friday-Sunday is treated as 1 day
     */
    function fixRentalDaysDisplay() {
        debugLog('Fixing rental days display consistency...');
        
        // Find all rental items in the mini-cart
        $('.item', '.check-popup').each(function() {
            const $item = $(this);
            
            // Find rental dates container
            const $dateContainer = $item.find('.rental-dates-container');
            if (!$dateContainer.length) return;
            
            // Get rental dates from data attribute
            const rentalDates = $dateContainer.data('rental-dates');
            if (!rentalDates || rentalDates.indexOf(' - ') === -1) return;
            
            // Calculate correct rental days using PHP's logic
            const dateParts = rentalDates.split(' - ');
            if (dateParts.length !== 2) return;
            
            // Parse dates - handle various formats (assuming D.M.YYYY)
            const startParts = dateParts[0].split('.');
            const endParts = dateParts[1].split('.');
            
            if (startParts.length !== 3 || endParts.length !== 3) return;
            
            try {
                // Create Date objects
                const startDate = new Date(startParts[2], startParts[1]-1, startParts[0]);
                const endDate = new Date(endParts[2], endParts[1]-1, endParts[0]);
                
                // Check for Friday-Sunday special case
                const startDay = startDate.getDay(); // 0=Sunday, 5=Friday
                const endDay = endDate.getDay();
                const diffDays = Math.round((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1;
                
                let rentalDays = diffDays;
                
                // Apply special Friday-Sunday = 1 day rule
                if (startDay === 5 && endDay === 0 && diffDays <= 3) {
                    rentalDays = 1;
                    debugLog('Applied Friday-Sunday special rule:', dateParts, 'days:', rentalDays);
                } else {
                    // Apply standard rental day counting logic
                    // For rental days, we count the first day + half days for remaining
                    // Which means day count is reduced by one (7 days = 6 rental days)
                    rentalDays = Math.max(1, diffDays - 1);
                    debugLog('Applied standard rental day counting:', dateParts, 'days:', rentalDays);
                }
                
                // Update data attribute with correct rental days
                $dateContainer.attr('data-rental-days', rentalDays);
                
                // Update any displayed rental days text
                const $rentalDaysText = $item.find('.rental-days-text');
                if ($rentalDaysText.length) {
                    $rentalDaysText.text(rentalDays);
                }
                
                debugLog('Updated rental days display:', {item: $item, dates: rentalDates, days: rentalDays});
                
                // Update price display if needed
                const $priceContainer = $item.find('.cost');
                if ($priceContainer.length) {
                    // First, remove any existing price indicators to prevent duplication
                    $priceContainer.find('.price-needs-update, .rental-price-breakdown').remove();
                    
                    // Base price is always 550₪ for the first day
                    const basePrice = 550;
                    let totalPrice = 0;
                    
                    // Get product ID to check for exceptions
                    let productId = parseInt($item.find('[data-product_id]').data('product_id') || 0);
                    
                    // Products 150 and 153 have no discount for additional days
                    const hasDiscount = (productId !== 150 && productId !== 153);
                    
                    // Calculate total price using consistent rules
                    if (rentalDays === 1) {
                        // One day rental - just base price
                        totalPrice = basePrice;
                    } else if (hasDiscount) {
                        // Standard rental with discount: first day full price + additional days at 50%
                        const additionalDays = rentalDays - 1;
                        const additionalDaysPrice = additionalDays * (basePrice * 0.5);
                        totalPrice = basePrice + additionalDaysPrice;
                    } else {
                        // No discount products: full price for all days
                        totalPrice = basePrice * rentalDays;
                    }
                    
                    // Format the currency symbol
                    const currency = '₪';
                    
                    // Debug logging
                    debugLog('Price calculation', {
                        item: $item,
                        productId: productId,
                        hasDiscount: hasDiscount,
                        rentalDays: rentalDays,
                        basePrice: basePrice,
                        totalPrice: totalPrice.toFixed(2)
                    });
                    
                    // Update the displayed price
                    const $priceDisplay = $priceContainer.find('.woocommerce-Price-amount bdi');
                    if ($priceDisplay.length) {
                        $priceDisplay.html(totalPrice.toFixed(2) + '&nbsp;<span class="woocommerce-Price-currencySymbol">' + currency + '</span>');
                    }
                    
                    // Remove any existing breakdown
                    $item.find('.rental-price-breakdown').remove();
                    
                    // Create a detailed price breakdown
                    let breakdownHtml = `
                        <div class="rental-price-breakdown" style="margin-top: 8px; font-size: 0.85em; color: #666;">
                            <div class="rental-days-count" style="margin-bottom: 4px;">
                                <strong>ימי השכרה:</strong> ${rentalDays}
                            </div>
                            <div class="price-details">
                                <div>יום 1: ${basePrice.toFixed(2)} ${currency}</div>`;
                    
                    // Add additional days if any
                    if (rentalDays > 1 && hasDiscount) {
                        const additionalDays = rentalDays - 1;
                        const additionalDaysPrice = additionalDays * (basePrice * 0.5);
                        breakdownHtml += `
                                <div>${additionalDays} ימים נוספים (50%): ${additionalDaysPrice.toFixed(2)} ${currency}</div>`;
                    } else if (rentalDays > 1) {
                        const additionalDays = rentalDays - 1;
                        const additionalDaysPrice = additionalDays * basePrice;
                        breakdownHtml += `
                                <div>${additionalDays} ימים נוספים: ${additionalDaysPrice.toFixed(2)} ${currency}</div>`;
                    }
                    
                    // Add total
                    breakdownHtml += `
                                <div style="margin-top: 4px; font-weight: bold;">סה"כ: ${totalPrice.toFixed(2)} ${currency}</div>
                            </div>
                        </div>`;
                    
                    // Insert the breakdown after the cost div
                    $priceContainer.after(breakdownHtml);
                    
                    // Add class to indicate we've fixed this item
                    $item.addClass('rental-price-fixed');
                }
            } catch (err) {
                debugLog('Error calculating rental days:', err);
            }
        });
    }
    
    // Initialize date recovery
    $(document).ready(function() {
        setupDateRecovery();
    });

})(jQuery);
