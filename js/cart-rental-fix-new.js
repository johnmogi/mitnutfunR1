/**
 * Cart and Mini-Cart Rental Fix - Clean Version
 * Unified script to fix display issues with rental products in cart and mini-cart
 * Centralized from previously separate cart-rental-fix.js and mini-cart-fix.js
 * 
 * UPDATED: Now integrates with the modular JS system and fixes all syntax errors
 */

(function($) {
    'use strict';
    
    // Use the centralized logger if available
    const logger = window.MitnaFunLogger || {
        debug: function() {},
        info: function() {},
        warn: console.warn.bind(console, '[Cart Rental Fix]'),
        error: console.error.bind(console, '[Cart Rental Fix]')
    };
    
    logger.info('Cart rental fix initialized');
    
    // Configuration
    const EXCLUDED_PRODUCT_IDS = [150, 153]; // Products excluded from the discount
    
    /**
     * Force cart to be visible if it has items
     */
    function forceShowCart() {
        try {
            const $cart = $('.cart, .woocommerce-cart-form, .cart-collaterals');
            const $items = $('.cart_item, .item');
            
            if ($items.length > 0 && $cart.is(':hidden')) {
                $cart.slideDown(300);
                logger.debug('Cart was hidden - forcing visibility');
            }
        } catch (err) {
            logger.error('Error in forceShowCart:', err);
        }
    }
    
    /**
     * Setup date recovery for rental items
     */
    function setupDateRecovery() {
        try {
            // Handle direct checkout button clicks
            $(document).on('click', '.buy-now, .single_add_to_cart_button.buy-now', function(e) {
                const $form = $(this).closest('form');
                const isDirectCheckout = $(this).hasClass('buy-now') || $form.find('input[name="is_buy_now"]').length > 0;
                
                if (isDirectCheckout) {
                    logger.info('Direct to checkout button clicked');
                    sessionStorage.setItem('proceeding_to_checkout_with_rental', 'true');
                }
            });
            
            // Check for saved rental dates on checkout page
            if (window.location.href.includes('/checkout/')) {
                if (sessionStorage.getItem('proceeding_to_checkout_with_rental') === 'true') {
                    logger.info('Direct checkout detected - checking for rental dates');
                    sessionStorage.removeItem('proceeding_to_checkout_with_rental');
                    
                    // Ensure dates are in the checkout review
                    setTimeout(function() {
                        const hasRentalDates = $('.woocommerce-checkout-review-order-table').text().includes('תאריכי השכרה');
                        if (!hasRentalDates) {
                            logger.warn('No rental dates found in checkout review - attempting recovery');
                            $(document.body).trigger('update_checkout');
                        }
                    }, 1000);
                }
            }
        } catch (err) {
            logger.error('Error in setupDateRecovery:', err);
        }
    }
    
    /**
     * Initialize the cart rental fix functionality
     */
    function init() {
        try {
            // Make sure cart is visible on load
            $(window).on('load', function() {
                if (window.location.href.includes('/basket/') || window.location.href.includes('/checkout/')) {
                    setTimeout(forceShowCart, 100);
                }
            });
            
            // Handle checkout button clicks
            $(document).on('click', '.checkout-button, .btn-mini, a[href*="checkout"]', function(e) {
                if ($(this).closest('.wp-admin').length || !this.href || !this.href.includes('checkout')) {
                    return;
                }
                
                logger.debug('Checkout button clicked - ensuring cart data is preserved');
                
                if (typeof wc_cart_fragments_params !== 'undefined') {
                    const cartItemCount = $('.item').length || $('.cart_item').length;
                    
                    if (cartItemCount === 0) {
                        e.preventDefault();
                        logger.warn('Attempted checkout with empty cart - preventing redirect');
                        alert('אנא הוסף פריטים לעגלה לפני ההמשך לתשלום');
                        return false;
                    }
                }
            });
            
            // Initialize date recovery
            if (window.CartIntegration) {
                logger.info('Using CartIntegration module for date recovery');
            } else {
                logger.info('Using legacy date recovery implementation');
                setupDateRecovery();
            }
            
        } catch (err) {
            logger.error('Error initializing cart rental fix:', err);
        }
    }
    
    // Initialize when document is ready
    $(document).ready(function() {
        init();
    });
    
})(jQuery);
