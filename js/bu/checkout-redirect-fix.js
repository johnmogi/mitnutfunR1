/**
 * Checkout Redirect Fix
 * Prevents the checkout form from redirecting back to products
 */
jQuery(document).ready(function($) {
    'use strict';
    
    console.log('CHECKOUT REDIRECT FIX LOADED');
    
    // Function to ensure checkout form submits properly
    function fixCheckoutForm() {
        // Only run on checkout page
        if (!$('.woocommerce-checkout').length) return;
        
        console.log('Fixing checkout form submission...');
        
        // Make sure rental dates are included in checkout
        $('.cart_item').each(function() {
            const $item = $(this);
            const rentalDates = $item.find('.rental-dates').text().trim();
            
            if (rentalDates) {
                // Create hidden input if not exists
                if ($('input[name="rental_dates_' + $item.data('product-id') + '"]').length === 0) {
                    $('<input>').attr({
                        type: 'hidden',
                        name: 'rental_dates_' + $item.data('product-id'),
                        value: rentalDates
                    }).appendTo('.woocommerce-checkout form');
                }
            }
        });
        
        // Add missing nonce if needed
        if ($('input[name="woocommerce-process-checkout-nonce"]').length === 0) {
            const nonce = $('#_wpnonce').length ? $('#_wpnonce').val() : '';
            if (nonce) {
                $('<input>').attr({
                    type: 'hidden',
                    name: 'woocommerce-process-checkout-nonce',
                    value: nonce
                }).appendTo('.woocommerce-checkout form');
            }
        }
        
        // Ensure required fields are properly marked
        $('.woocommerce-checkout input[required]').each(function() {
            const $input = $(this);
            const name = $input.attr('name');
            
            // If field has woocommerce billing_ prefix but no validation class
            if (name && name.indexOf('billing_') === 0 && !$input.hasClass('validate')) {
                $input.addClass('validate required');
            }
        });
        
        // Fix form submission by overriding the default process
        $(document).on('click', '.woocommerce-checkout [type="submit"]', function(e) {
            // Make sure all required fields are filled
            let isValid = true;
            $('.woocommerce-checkout input[required]').each(function() {
                if (!$(this).val()) {
                    isValid = false;
                    $(this).addClass('error');
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                alert('יש למלא את כל השדות החובה');
                return false;
            }
            
            // Store form data in sessionStorage as backup
            const formData = {};
            $('.woocommerce-checkout input, .woocommerce-checkout select').each(function() {
                const $input = $(this);
                const name = $input.attr('name');
                if (name) {
                    formData[name] = $input.val();
                }
            });
            
            sessionStorage.setItem('checkout_form_data', JSON.stringify(formData));
            console.log('Form data saved to session storage');
            
            // Allow form submission to proceed
            return true;
        });
        
        // Restore form data if user gets redirected back
        const savedFormData = sessionStorage.getItem('checkout_form_data');
        if (savedFormData) {
            try {
                const formData = JSON.parse(savedFormData);
                console.log('Restoring saved form data');
                
                $.each(formData, function(name, value) {
                    if (value) {
                        const $field = $('[name="' + name + '"]');
                        if ($field.length && !$field.val()) {
                            $field.val(value);
                        }
                    }
                });
            } catch (e) {
                console.error('Error restoring form data:', e);
            }
        }
    }
    
    // Call immediately
    fixCheckoutForm();
    
    // Also call on checkout update
    $(document).on('updated_checkout', fixCheckoutForm);
});
