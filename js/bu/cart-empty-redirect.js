/**
 * Cart Empty Redirect Handler
 * 
 * Redirects to home page or last viewed product when cart becomes empty
 * during checkout to prevent broken/empty pages
 */

jQuery(document).ready(function($) {
    console.log('🛒 Cart Empty Redirect: Script loaded');

    // Store the last viewed product URL if on a product page
    if ($('body').hasClass('single-product')) {
        const currentProductUrl = window.location.href;
        localStorage.setItem('mitnafun_last_product', currentProductUrl);
        console.log('🛒 Cart Empty Redirect: Saved last product URL', currentProductUrl);
    }

    // Function to detect empty cart and redirect
    function handleEmptyCartRedirect() {
        // Check if we're on checkout or cart page
        if ($('body').hasClass('woocommerce-checkout') || $('body').hasClass('woocommerce-cart')) {
            // Check if cart is empty (no cart items visible)
            const cartItems = $('.woocommerce-cart-form__contents tr.cart_item, .woocommerce-checkout-review-order-table .cart_item');
            
            if (cartItems.length === 0) {
                console.log('🛒 Cart Empty Redirect: Empty cart detected, preparing to redirect');
                
                // Get the last viewed product URL or default to home
                let redirectUrl = localStorage.getItem('mitnafun_last_product');
                if (!redirectUrl) {
                    redirectUrl = window.location.origin;
                }
                
                console.log('🛒 Cart Empty Redirect: Redirecting to', redirectUrl);
                window.location.href = redirectUrl;
                return true;
            }
        }
        return false;
    }

    // Handle any existing empty cart state immediately
    if (!handleEmptyCartRedirect()) {
        // Monitor for cart emptying events
        $(document.body).on('updated_cart_totals removed_from_cart wc_cart_emptied', function() {
            console.log('🛒 Cart Empty Redirect: Cart update detected');
            setTimeout(handleEmptyCartRedirect, 500);
        });

        // Handle the "Empty Cart" button specifically
        $(document).on('click', '.woocommerce-cart-form .actions .button[name="update_cart"]', function() {
            if ($('.woocommerce-cart-form input.qty').val() === '0') {
                console.log('🛒 Cart Empty Redirect: Empty cart action detected');
                setTimeout(handleEmptyCartRedirect, 1000);
            }
        });
    }
});
