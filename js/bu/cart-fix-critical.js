/**
 * Critical Cart Fix
 * 
 * Aggressively fixes cart issues:
 * 1. Properly redirects when cart is emptied
 * 2. Prevents broken UI when cart changes
 * 3. Forces clean interface on cart errors
 */

jQuery(document).ready(function($) {
    console.log('🔴 CRITICAL CART FIX: Script loaded');
    
    // Store last product URL for redirect
    const storeLastProduct = function() {
        if ($('body').hasClass('single-product')) {
            const currentUrl = window.location.href;
            localStorage.setItem('mitnafun_last_product', currentUrl);
            console.log('🔴 CRITICAL CART FIX: Stored last product URL', currentUrl);
        }
    };
    
    // Run immediately
    storeLastProduct();
    
    // Function to redirect on empty cart
    function redirectOnEmptyCart() {
        console.log('🔴 CRITICAL CART FIX: Checking if cart is empty...');
        
        // Check if we're on a cart or checkout page
        if ($('body').hasClass('woocommerce-cart') || $('body').hasClass('woocommerce-checkout')) {
            // Multiple ways to detect empty cart
            const cartIsEmpty = (
                $('.woocommerce-cart-form').length === 0 || 
                $('.woocommerce-cart-form__contents tr.cart_item').length === 0 ||
                $('.cart-empty').length > 0 ||
                $('.woocommerce-checkout-review-order-table .cart_item').length === 0
            );
            
            if (cartIsEmpty) {
                console.log('🔴 CRITICAL CART FIX: Empty cart detected!');
                
                // Get redirect URL (last product or home)
                let redirectUrl = localStorage.getItem('mitnafun_last_product');
                if (!redirectUrl) {
                    redirectUrl = window.location.origin;
                }
                
                // Force immediate redirect
                console.log('🔴 CRITICAL CART FIX: Redirecting to', redirectUrl);
                window.location.href = redirectUrl;
                return true;
            }
        }
        return false;
    }
    
    // Fix broken UI
    function fixBrokenUI() {
        // Fix any spinners that never go away
        $('.blockUI.blockOverlay').each(function() {
            const $overlay = $(this);
            const creationTime = $overlay.data('creation-time');
            
            if (!creationTime) {
                $overlay.data('creation-time', Date.now());
            } else if (Date.now() - creationTime > 5000) {
                // Remove overlay if it's been there more than 5 seconds
                console.log('🔴 CRITICAL CART FIX: Removing stuck overlay');
                $overlay.remove();
            }
        });
        
        // Fix empty but not redirected cart
        if ($('body').hasClass('woocommerce-cart') && $('.woocommerce-cart-form').length === 0) {
            console.log('🔴 CRITICAL CART FIX: Empty cart page detected, forcing home redirect');
            window.location.href = window.location.origin;
        }
    }
    
    // Check for empty cart immediately
    if (!redirectOnEmptyCart()) {
        // Monitor for cart changes
        $(document.body).on('removed_from_cart updated_cart_totals wc_cart_emptied wc_fragments_refreshed updated_checkout', function() {
            console.log('🔴 CRITICAL CART FIX: Cart event triggered');
            setTimeout(redirectOnEmptyCart, 300);
            setTimeout(fixBrokenUI, 500);
        });
        
        // Additional monitoring for checkout
        if ($('body').hasClass('woocommerce-checkout')) {
            // Monitor cart emptying via AJAX
            $(document).ajaxComplete(function(event, xhr, settings) {
                // Check if this is a cart-related AJAX request
                if (settings.url.indexOf('wc-ajax') !== -1) {
                    console.log('🔴 CRITICAL CART FIX: WC AJAX completed, checking cart');
                    setTimeout(redirectOnEmptyCart, 300);
                    setTimeout(fixBrokenUI, 500);
                }
            });
            
            // Check every 2 seconds during checkout
            setInterval(function() {
                fixBrokenUI();
                redirectOnEmptyCart();
            }, 2000);
        }
        
        // Fix specific UI issues (broken basket)
        $('.woocommerce-cart-form__contents').on('DOMSubtreeModified', function() {
            // When cart contents change, check if it's empty
            if ($(this).find('.cart_item').length === 0) {
                console.log('🔴 CRITICAL CART FIX: Cart contents changed to empty');
                setTimeout(redirectOnEmptyCart, 300);
            }
        });
    }
    
    // Add emergency rescue button for broken cart states
    if ($('body').hasClass('woocommerce-cart') || $('body').hasClass('woocommerce-checkout')) {
        const $rescueButton = $('<div class="cart-rescue-button" style="position: fixed; bottom: 20px; right: 20px; background: #e53935; color: white; padding: 10px 15px; border-radius: 5px; cursor: pointer; z-index: 999999; display: none;">חזרה לדף הבית</div>');
        
        $('body').append($rescueButton);
        
        // Show button after 10 seconds on page
        setTimeout(function() {
            $rescueButton.show();
        }, 10000);
        
        // Add click handler
        $rescueButton.on('click', function() {
            window.location.href = window.location.origin;
        });
    }
});
