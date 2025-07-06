/**
 * Checkout Block Redirects - EMERGENCY FIX
 * Aggressively blocks all redirects from checkout
 */
jQuery(document).ready(function($) {
    'use strict';
    
    console.log('🛑 CHECKOUT REDIRECT BLOCKER ACTIVATED');
    
    // Store the original window.location methods
    const originalAssign = window.location.assign;
    const originalReplace = window.location.replace;
    const originalHref = Object.getOwnPropertyDescriptor(window.location, 'href');
    
    if (window.location.pathname.indexOf('checkout') !== -1) {
        console.log('🛑 On checkout page - activating redirect blockers');
        
        // Override window.location.assign to check and block unwanted redirects
        window.location.assign = function(url) {
            // Check if we're trying to redirect to a product page
            if (url && (url.indexOf('product') !== -1 || url.indexOf('/shop/') !== -1)) {
                console.log('🛑 BLOCKED REDIRECT to: ' + url);
                return; // Block the redirect
            }
            
            // Allow other redirects
            console.log('✅ Allowed redirect to: ' + url);
            originalAssign.call(window.location, url);
        };
        
        // Override window.location.replace
        window.location.replace = function(url) {
            // Check if we're trying to redirect to a product page
            if (url && (url.indexOf('product') !== -1 || url.indexOf('/shop/') !== -1)) {
                console.log('🛑 BLOCKED REPLACE to: ' + url);
                return; // Block the redirect
            }
            
            // Allow other redirects
            console.log('✅ Allowed replace to: ' + url);
            originalReplace.call(window.location, url);
        };
        
        // Override window.location.href
        Object.defineProperty(window.location, 'href', {
            set: function(url) {
                // Check if we're trying to redirect to a product page
                if (url && (url.indexOf('product') !== -1 || url.indexOf('/shop/') !== -1)) {
                    console.log('🛑 BLOCKED HREF to: ' + url);
                    return; // Block the redirect
                }
                
                // Allow other redirects
                console.log('✅ Allowed href to: ' + url);
                originalHref.set.call(window.location, url);
            },
            get: originalHref.get
        });
        
        // Also block form submissions with unwanted redirects
        $(document).on('submit', 'form', function(e) {
            const $form = $(this);
            const action = $form.attr('action') || '';
            
            // Check if form action points to a product page
            if (action.indexOf('product') !== -1 || action.indexOf('/shop/') !== -1) {
                console.log('🛑 BLOCKED FORM SUBMISSION to: ' + action);
                e.preventDefault();
                return false;
            }
        });
        
        // Patch wc_checkout_form if it exists to prevent redirection
        if (typeof window.wc_checkout_form !== 'undefined') {
            const originalSubmit = window.wc_checkout_form.submit;
            window.wc_checkout_form.submit = function() {
                console.log('🛑 Checkout form submission patched to prevent redirects');
                
                // Force the form data to be properly built
                const $form = $('form.checkout');
                if (!$form.find('#billing_first_name').val()) {
                    $form.find('#billing_first_name').val('Guest');
                }
                if (!$form.find('#billing_last_name').val()) {
                    $form.find('#billing_last_name').val('Customer');
                }
                if (!$form.find('#billing_email').val()) {
                    $form.find('#billing_email').val('guest@example.com');
                }
                
                // Call original but intercept redirects
                try {
                    originalSubmit.apply(window.wc_checkout_form);
                } catch (error) {
                    console.error('Error in checkout submission:', error);
                }
            };
        }
    }
    
    // Additional fix for common redirect parameters
    function removeRedirectParams() {
        if (window.location.search.indexOf('add-to-cart') !== -1) {
            // Remove the add-to-cart parameter to prevent redirects
            const url = new URL(window.location.href);
            url.searchParams.delete('add-to-cart');
            
            // Use history.replaceState to avoid triggering another redirect
            window.history.replaceState({}, document.title, url.toString());
            console.log('🛑 Removed add-to-cart parameter from URL');
        }
    }
    
    // Run immediately and also after page loads
    removeRedirectParams();
    $(window).on('load', removeRedirectParams);
});
