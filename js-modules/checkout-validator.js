/**
 * Checkout Validator Module
 * Ensures checkout button does not redirect without item selection
 * Also handles direct-to-checkout (buy now) functionality
 */

const CheckoutValidator = (function($) {
    'use strict';
    
    // Use our centralized logger if available
    const log = window.MitnaFunLogger || {
        info: console.info.bind(console, '[MitnaFun Checkout]'),
        warn: console.warn.bind(console, '[MitnaFun Checkout]'),
        error: console.error.bind(console, '[MitnaFun Checkout]')
    };
    
    /**
     * Check if cart has any items by looking at DOM elements
     */
    function hasCartItems() {
        // Multiple ways to detect items in cart
        const cartItemSelectors = [
            '.cart_item',             // Standard WooCommerce cart items
            '.mini_cart_item',        // Mini cart items
            '.item',                  // Custom theme cart items
            '[data-cart-item]',       // Data attribute cart items
            '.woocommerce-cart-form'  // Cart form (should only exist when cart has items)
        ];
        
        // Check each selector
        for (const selector of cartItemSelectors) {
            if ($(selector).length > 0) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check for selections that are required before checkout
     */
    function hasRequiredSelections() {
        // Check for any required date selection on rental products
        const missingDates = $('.missing-dates:visible').length > 0;
        if (missingDates) {
            log.warn('Missing rental dates detected');
            return false;
        }
        
        // Check for any disabled add-to-cart buttons
        const disabledButtons = $('.single_add_to_cart_button.disabled:visible').length > 0;
        if (disabledButtons) {
            log.warn('Disabled add-to-cart buttons detected');
            return false;
        }
        
        // Add additional checks as needed
        
        return true;
    }
    
    /**
     * Handle direct-to-checkout (buy now) functionality
     */
    function setupDirectToCheckout() {
        // Handle direct checkout button clicks (buy now buttons)
        $(document).on('click', '.buy-now, .single_add_to_cart_button.buy-now', function(e) {
            const $form = $(this).closest('form');
            const isDirectCheckout = $(this).hasClass('buy-now') || $form.find('input[name="is_buy_now"]').length > 0;
            
            if (isDirectCheckout) {
                log.info('Direct to checkout button clicked');
                sessionStorage.setItem('proceeding_to_checkout_with_rental', 'true');
            }
        });
        
        // Check for saved rental dates on checkout page
        if (window.location.href.includes('/checkout/')) {
            if (sessionStorage.getItem('proceeding_to_checkout_with_rental') === 'true') {
                log.info('Direct checkout detected - checking for rental dates');
                
                // Remove the flag to prevent duplicate processing
                sessionStorage.removeItem('proceeding_to_checkout_with_rental');
                
                setTimeout(function() {
                    // Ensure dates are in the checkout review
                    const hasRentalDates = $('.woocommerce-checkout-review-order-table').text().includes('תאריכי השכרה');
                    if (!hasRentalDates) {
                        log.warn('No rental dates found in checkout review - attempting recovery');
                        
                        // Try to get saved rental data
                        const lastRentalDataStr = sessionStorage.getItem('last_added_rental');
                        if (lastRentalDataStr) {
                            try {
                                const lastRental = JSON.parse(lastRentalDataStr);
                                log.info('Found rental data, adding to debug info:', lastRental);
                                
                                // Add debug info to the page
                                $('.woocommerce-checkout').append(
                                    '<div class="rental-debug" style="display:none;">' +
                                    'Product: ' + lastRental.product_id + '<br>' +
                                    'Dates: ' + lastRental.rental_dates + '<br>' +
                                    'Quantity: ' + lastRental.quantity +
                                    '</div>'
                                );
                                
                                // Force checkout update to try to recover dates
                                $(document.body).trigger('update_checkout');
                            } catch (e) {
                                log.error('Failed to parse rental data:', e);
                            }
                        }
                    }
                }, 1000);
            }
        }
    }

    /**
     * Initialize checkout button validation
     */
    function init() {
        // Set up direct-to-checkout functionality
        setupDirectToCheckout();
        
        // Handle checkout button clicks
        $(document).on('click', '.checkout-button, .btn-mini, a[href*="checkout"]', function(e) {
            // Don't process admin links or non-checkout links
            if ($(this).closest('.wp-admin').length || !this.href || !this.href.includes('checkout')) {
                return;
            }
            
            log.info('Checkout button clicked - validating cart state');
            
            // Make sure required selections are made
            if (!hasRequiredSelections()) {
                e.preventDefault();
                alert('אנא בחר את כל האפשרויות הנדרשות לפני המשך לתשלום.');
                return;
            }
            
            // Check if cart is empty
            if (!hasCartItems()) {
                log.warn('Attempted checkout with empty cart - preventing redirect');
                
                // Show loading indicator to user
                $('<span class="checkout-loading">מעדכן את העגלה...</span>').insertAfter($(this)).css({
                    'display': 'inline-block',
                    'margin-right': '10px',
                    'color': '#666'
                });
                
                // Try to refresh fragments if available
                if (typeof wc_cart_fragments_params !== 'undefined') {
                    log.info('Refreshing cart fragments');
                    $(document.body).trigger('wc_fragment_refresh');
                    
                    // Give fragments time to refresh
                    setTimeout(() => {
                        // If still no items after refresh, warn the user
                        if (!hasCartItems()) {
                            log.warn('Still no cart items after refresh - showing warning');
                            alert('העגלה ריקה. אנא בחר מוצרים לפני המשך לתשלום.');
                            
                            // Prevent checkout redirect if cart is empty
                            $('.checkout-loading').remove();
                            
                            // Redirect to shop instead
                            window.location.href = '/shop/';
                        } else {
                            // Cart has items now, proceed to checkout
                            log.info('Cart items found after refresh - proceeding to checkout');
                            window.location.href = $(this).attr('href');
                        }
                    }, 1000);
                } else {
                    // No fragments support, just show warning
                    log.warn('Cart fragments not available - showing empty cart warning');
                    alert('העגלה ריקה. אנא בחר מוצרים לפני המשך לתשלום.');
                    $('.checkout-loading').remove();
                    
                    // Redirect to shop
                    window.location.href = '/shop/';
                }
                
                // Prevent the default action
                e.preventDefault();
                return;
            }
            
            // Cart has items and required selections, make sure fragments are updated before proceeding
            log.info('Cart has items - updating fragments before checkout');
            
            if (typeof wc_cart_fragments_params !== 'undefined') {
                $(document.body).trigger('wc_fragment_refresh');
            }
            
            // Store a flag that we're proceeding to checkout with items
            sessionStorage.setItem('proceeding_to_checkout', 'true');
        });
    }
    
    // Public API
    return {
        init: init,
        hasCartItems: hasCartItems,
        hasRequiredSelections: hasRequiredSelections,
        setupDirectToCheckout: setupDirectToCheckout
    };
})(jQuery); // Pass jQuery to the IIFE

// Initialize when document is ready
$(document).ready(function($) {
    CheckoutValidator.init();
});

// Export for browser use
window.CheckoutValidator = CheckoutValidator;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CheckoutValidator;
}
