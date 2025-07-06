/**
 * Cart Integration Module
 * Provides integration between custom modules and WooCommerce cart functionality
 */

const CartIntegration = (function($) {
    'use strict';
    
    // Use our centralized logger if available
    const log = window.MitnaFunLogger || {
        info: console.info.bind(console, '[MitnaFun Cart]'),
        warn: console.warn.bind(console, '[MitnaFun Cart]'),
        error: console.error.bind(console, '[MitnaFun Cart]')
    };
    
    /**
     * Store currently selected dates in session storage before adding to cart
     * This helps recover dates if they get lost in the cart
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
                    log.info('Stored rental dates for recovery', {productId, rentalDates});
                    
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
                        log.info('Direct to checkout clicked - ensuring rental dates are preserved');
                        
                        // Mark that we're going to checkout with this item
                        sessionStorage.setItem('proceeding_to_checkout_with_rental', 'true');
                    }
                    
                    // Clean up old entries after 10 minutes
                    setTimeout(function() {
                        sessionStorage.removeItem(tempKey);
                    }, 600000);
                } else {
                    log.warn('Could not find product ID for date storage');
                }
            }
        });
        
        // Check for direct-to-checkout on page load (e.g. when redirected to checkout page)
        if (window.location.href.includes('/checkout/')) {
            if (sessionStorage.getItem('proceeding_to_checkout_with_rental') === 'true') {
                log.info('Detected checkout with rental product - ensuring dates are preserved');
                
                // Remove the flag
                sessionStorage.removeItem('proceeding_to_checkout_with_rental');
                
                // Add a small delay to ensure cart is loaded before checking
                setTimeout(function() {
                    // Check if rental dates appear in the checkout summary
                    const hasRentalDates = $('.woocommerce-checkout-review-order-table').text().includes('תאריכי השכרה');
                    
                    if (!hasRentalDates) {
                        log.warn('Rental dates not found in checkout - attempting to recover');
                        
                        // Try to get the last added rental product data
                        const lastRentalDataStr = sessionStorage.getItem('last_added_rental');
                        if (lastRentalDataStr) {
                            try {
                                const lastRental = JSON.parse(lastRentalDataStr);
                                log.info('Found last rental data:', lastRental);
                                
                                // Add debug info to the page
                                $('.woocommerce-checkout').prepend(
                                    '<div class="rental-dates-debug" style="display:none;">' + 
                                    'Product ID: ' + lastRental.product_id + '<br>' +
                                    'Rental Dates: ' + lastRental.rental_dates + '<br>' +
                                    'Quantity: ' + lastRental.quantity + 
                                    '</div>'
                                );
                            } catch (e) {
                                log.error('Error parsing last rental data:', e);
                            }
                        }
                    }
                }, 1000);
            }
        }
    }
    
    /**
     * Force cart to be visible if it has items
     */
    function forceShowCart() {
        // Works on both cart and checkout pages
        const isCartPage = window.location.href.includes('/basket/');
        const isCheckoutPage = window.location.href.includes('/checkout/');
        
        if (!isCartPage && !isCheckoutPage) return;
        
        log.debug('Checking if cart needs to be forced visible on ' + (isCartPage ? 'cart' : 'checkout') + ' page');
        
        // Check if cart empty message is showing
        const $emptyNotice = $('.cart-empty.woocommerce-info, .woocommerce-info:contains("עגלת הקניות שלך ריקה")');
        
        // Check if cart/checkout content exists
        const $cartTable = isCartPage ? $('.woocommerce-cart-form__contents, form.woocommerce-cart-form') : $('.woocommerce-checkout-review-order-table');
        
        // If empty notice is showing but cart fragments exist (meaning cart has items)
        if ($emptyNotice.length > 0 && typeof wc_cart_fragments_params !== 'undefined') {
            log.info('Empty cart showing but fragments exist - fixing visibility');
            
            // Hide empty cart notice
            $emptyNotice.hide();
            
            // Trigger cart fragment refresh
            $(document.body).trigger('wc_fragment_refresh');
            
            // Attempt to reload cart content if needed
            if ($cartTable.length === 0) {
                log.warn('Cart table missing - attempting to reload page in 2 seconds');
                setTimeout(function() {
                    window.location.reload();
                }, 2000);
            }
        }
    }
    
    /**
     * Initialize the module
     */
    function init() {
        // Set up event handlers
        $(window).on('load', function() {
            // Force cart to be visible if it has items but is hidden (both basket and checkout pages)
            if (window.location.href.includes('/basket/') || window.location.href.includes('/checkout/')) {
                setTimeout(forceShowCart, 100);
            }
        });
        
        // Initialize date recovery
        setupDateRecovery();
    }
    
    // Public API
    return {
        init: init,
        forceShowCart: forceShowCart
    };
})(jQuery);

// Initialize module when document is ready
jQuery(document).ready(function($) {
    CartIntegration.init();
});

// Export for browser use
window.CartIntegration = CartIntegration;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CartIntegration;
}
