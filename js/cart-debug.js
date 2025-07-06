/**
 * Cart Debug Script
 * Helps diagnose issues with cart emptying and redirection problems
 * Added: July 2025
 */
jQuery(document).ready(function($) {
    'use strict';
    
    // console.log('%c[CART DEBUG]', 'background: #f8d7da; color: #721c24; padding: 3px 5px; border-radius: 3px;', 'Script loaded');
    
    // Debug cart session and fragments
    function debugCartState() {
        // Check if cart fragments params are defined
        const hasCartFragments = typeof wc_cart_fragments_params !== 'undefined';
        
        // Get cart hash from appropriate source
        let cartHashKey = hasCartFragments ? wc_cart_fragments_params.cart_hash_key : 'wc_cart_hash';
        let cartHash = localStorage.getItem(cartHashKey);
        
        // CRITICAL: Check if WooCommerce fragments are missing
        if (!hasCartFragments) {
            console.warn('%c[CART DEBUG] CRITICAL ERROR: wc_cart_fragments_params is not defined!', 'background: #721c24; color: #fff; padding: 5px; font-weight: bold;');
            // console.log('%c[CART DEBUG] This is likely why your cart is emptying between pages!', 'background: #721c24; color: #fff; padding: 5px;');
            
            // Check if WooCommerce is properly initialized
            // console.log('%c[CART DEBUG] WooCommerce detection:', 'background: #f8d7da; color: #721c24; padding: 3px 5px; border-radius: 3px;', {
                'jQuery': typeof jQuery !== 'undefined',
                'wc': typeof wc !== 'undefined',
                'woocommerce_params': typeof woocommerce_params !== 'undefined',
                'wc_add_to_cart_params': typeof wc_add_to_cart_params !== 'undefined',
                'wc_cart_fragments_js_loaded': $('script[src*="wc-cart-fragments"]').length > 0
            });
        }
        
        // console.log('%c[CART DEBUG] Cart State:', 'background: #f8d7da; color: #721c24; padding: 3px 5px; border-radius: 3px;', {
            'cart_session_exists': hasCartFragments,
            'cart_fragments': hasCartFragments ? wc_cart_fragments_params : 'NOT DEFINED',
            'cart_hash_key': hasCartFragments ? wc_cart_fragments_params.cart_hash_key : 'NOT DEFINED',
            'fragment_name': hasCartFragments ? wc_cart_fragments_params.fragment_name : 'NOT DEFINED',
            'cart_hash': cartHash,
            'woocommerce_cart_hash': getCookie('woocommerce_cart_hash'),
            'woocommerce_items_in_cart': getCookie('woocommerce_items_in_cart'),
            'last_cart_action': localStorage.getItem('mit_last_cart_action'),
            'page_url': window.location.href
        });
        
        // Debug the contents of the cart - especially useful on the cart page
        debugCartContents();
        
        // Check if we're on cart page and it appears empty
        if (window.location.href.indexOf('/basket/') > -1) {
            const cartIsEmpty = $('.woocommerce-info.cart-empty').length > 0;
            // console.log('%c[CART DEBUG] On cart page. Cart is empty:', 'background: #f8d7da; color: #721c24; padding: 3px 5px; border-radius: 3px;', cartIsEmpty);
            
            if (cartIsEmpty && localStorage.getItem('mit_last_cart_action') === 'forward_button_clicked') {
                console.warn('%c[CART DEBUG] DETECTED ISSUE: Cart was emptied after clicking forward button!', 'background: #721c24; color: #fff; padding: 5px; font-weight: bold;');
            }
        }
    }
    
    // Monitor cart navigation actions
    function setupCartActionTracking() {
        // Track proceed to cart button clicks
        $(document).on('click', '.button.wc-forward', function(e) {
            // console.log('%c[CART DEBUG] Cart forward button clicked - saving cart state', 'background: #f8d7da; color: #721c24; padding: 3px 5px; border-radius: 3px;');
            localStorage.setItem('mit_last_cart_action', 'forward_button_clicked');
            localStorage.setItem('mit_cart_action_time', Date.now());
            // Store current cart hash if available
            if (typeof wc_cart_fragments_params !== 'undefined') {
                localStorage.setItem('mit_last_cart_hash', localStorage.getItem(wc_cart_fragments_params.cart_hash_key));
            }
        });
        
        // Track add to cart button clicks
        $(document).on('click', '.add_to_cart_button, .single_add_to_cart_button', function(e) {
            // console.log('%c[CART DEBUG] Add to cart button clicked', 'background: #f8d7da; color: #721c24; padding: 3px 5px; border-radius: 3px;');
            localStorage.setItem('mit_last_cart_action', 'add_to_cart_clicked');
            localStorage.setItem('mit_cart_action_time', Date.now());
        });
        
        // Track remove from cart actions
        $(document).on('click', '.remove_from_cart_button', function(e) {
            // console.log('%c[CART DEBUG] Remove from cart button clicked', 'background: #f8d7da; color: #721c24; padding: 3px 5px; border-radius: 3px;');
            localStorage.setItem('mit_last_cart_action', 'remove_from_cart_clicked');
            localStorage.setItem('mit_cart_action_time', Date.now());
        });
        
        // Listen for cart fragment refresh events
        $(document.body).on('wc_fragments_refreshed', function() {
            // console.log('%c[CART DEBUG] Cart fragments refreshed', 'background: #f8d7da; color: #721c24; padding: 3px 5px; border-radius: 3px;');
            debugCartState();
        });
        
        // Listen for cart fragment load events
        $(document.body).on('wc_fragments_loaded', function() {
            // console.log('%c[CART DEBUG] Cart fragments loaded', 'background: #f8d7da; color: #721c24; padding: 3px 5px; border-radius: 3px;');
            debugCartState();
        });
    }
    
    // Debug cart contents (items, fragments, etc)
    function debugCartContents() {
        // Check if we're on a cart/checkout page where we can access cart contents
        if ($('.woocommerce-cart-form').length > 0 || $('.cart_item').length > 0) {
            // console.log('%c[CART DEBUG] Cart Contents:', 'background: #f8d7da; color: #721c24; padding: 3px 5px; border-radius: 3px;');
            
            // Log cart items
            const cartItems = [];
            $('.cart_item').each(function() {
                const $item = $(this);
                cartItems.push({
                    'product_id': $item.find('.product-remove a').data('product_id') || 'unknown',
                    'product_name': $item.find('.product-name').text().trim(),
                    'product_price': $item.find('.product-price').text().trim(),
                    'product_quantity': $item.find('.product-quantity input').val() || 'unknown',
                    'rental_dates': $item.find('.rental-dates').text().trim() || 'No rental dates',
                    'rental_days': $item.find('.rental-days').text().trim() || 'No rental days',
                    'data_attributes': extractDataAttributes($item)
                });
            });
            
            // console.log('Cart Items:', cartItems);
            
            // Check for WooCommerce fragments in session storage
            try {
                const fragments = sessionStorage.getItem('wc_fragments');
                if (fragments) {
                    // console.log('WC Fragments found in session storage:', JSON.parse(fragments));
                } else {
                    // console.log('No WC Fragments found in session storage');
                }
            } catch (e) {
                // console.log('Error parsing WC Fragments:', e);
            }
        }
    }
    
    // Helper: Extract all data attributes from an element
    function extractDataAttributes($element) {
        const dataAttrs = {};
        $.each($element[0].attributes, function() {
            if(this.name.startsWith('data-')) {
                const key = this.name.substring(5);
                dataAttrs[key] = this.value;
            }
        });
        return dataAttrs;
    }
    
    // Helper: Get cookie by name
    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    }
    
    // Run initial debug
    debugCartState();
    
    // Setup tracking
    setupCartActionTracking();
    
    // Check again after page fully loads
    $(window).on('load', function() {
        setTimeout(debugCartState, 500);
    });
});
