/**
 * Rental Availability Checker
 * Handles client-side validation and AJAX requests for rental availability
 */
(function($) {
    'use strict';

    class RentalAvailabilityChecker {
        constructor(options = {}) {
            this.settings = $.extend({
                // Default settings
                dateFormat: 'yy-mm-dd',
                debug: false,
                // Selectors
                dateInput: '#rental_dates',
                productForm: 'form.cart',
                addToCartButton: 'button.single_add_to_cart_button',
                // Messages
                messages: {
                    loading: 'Checking availability...',
                    available: 'Selected dates are available',
                    notAvailable: 'Selected dates are not available',
                    selectDates: 'Please select rental dates',
                    serverError: 'Error checking availability. Please try again.'
                }
            }, options);

            this.init();
        }

        init() {
            this.bindEvents();
            this.log('Rental Availability Checker initialized');
        }

        bindEvents() {
            // Check availability when dates change
            $(document).on('change', this.settings.dateInput, (e) => this.onDateChange(e));
            
            // Validate before form submission
            $(document).on('click', this.settings.addToCartButton, (e) => this.onAddToCart(e));
            
            // Check availability on page load if dates are pre-filled
            this.checkInitialDates();
        }

        checkInitialDates() {
            const dates = $(this.settings.dateInput).val();
            if (dates && dates.includes(' - ')) {
                this.checkAvailability();
            }
        }

        onDateChange(e) {
            const dates = $(e.target).val();
            if (dates && dates.includes(' - ')) {
                this.checkAvailability();
            }
        }

        onAddToCart(e) {
            const $button = $(e.currentTarget);
            const $form = $button.closest(this.settings.productForm);
            const dates = $form.find(this.settings.dateInput).val();

            if (!dates || !dates.includes(' - ')) {
                e.preventDefault();
                this.showError(this.settings.messages.selectDates);
                return false;
            }

            // If we already know the dates are unavailable, prevent submission
            if ($button.hasClass('dates-unavailable')) {
                e.preventDefault();
                return false;
            }

            return true;
        }

        checkAvailability() {
            const $dateInput = $(this.settings.dateInput);
            const dates = $dateInput.val();
            
            if (!dates || !dates.includes(' - ')) {
                return;
            }

            const [startDate, endDate] = dates.split(' - ').map(d => d.trim());
            const productId = this.getProductId();
            const $button = $(this.settings.addToCartButton);

            if (!productId) {
                this.log('Product ID not found');
                return;
            }

            // Show loading state
            const originalText = $button.text();
            $button.prop('disabled', true).text(rental_availability.i18n.checking_availability);

            // Make AJAX request
            $.ajax({
                url: rental_availability.ajax_url,
                type: 'POST',
                data: {
                    action: 'check_rental_availability',
                    nonce: rental_availability.nonce,
                    product_id: productId,
                    start_date: startDate,
                    end_date: endDate
                },
                dataType: 'json',
                success: (response) => {
                    if (response.success) {
                        this.handleAvailableDates($button);
                    } else {
                        this.handleUnavailableDates($button, response.data);
                    }
                },
                error: (xhr, status, error) => {
                    this.log('AJAX error:', error);
                    this.showError(rental_availability.i18n.server_error);
                },
                complete: () => {
                    $button.prop('disabled', false).text(originalText);
                }
            });
        }

        handleAvailableDates($button) {
            $button.removeClass('dates-unavailable')
                   .removeClass('button-disabled')
                   .prop('disabled', false);
            
            this.showNotice(this.settings.messages.available, 'success');
            this.log('Dates are available');
        }

        handleUnavailableDates($button, response) {
            $button.addClass('dates-unavailable')
                   .addClass('button-disabled')
                   .prop('disabled', true);
            
            const message = response && response.message 
                ? response.message 
                : this.settings.messages.notAvailable;
            
            this.showError(message);
            this.log('Dates are not available');
        }

        getProductId() {
            // Try to get from product form
            let productId = $('input[name="add-to-cart"]').val();
            
            // If not found, try to get from URL
            if (!productId) {
                const urlParams = new URLSearchParams(window.location.search);
                productId = urlParams.get('add-to-cart');
            }
            
            // If still not found, try to get from body class
            if (!productId) {
                const bodyClasses = $('body').attr('class').split(' ');
                const productClass = bodyClasses.find(cls => cls.startsWith('postid-'));
                if (productClass) {
                    productId = productClass.replace('postid-', '');
                }
            }
            
            return productId ? parseInt(productId, 10) : null;
        }

        showNotice(message, type = 'info') {
            // Remove any existing notices
            this.removeNotices();
            
            // Create and show new notice
            const noticeClass = `woocommerce-${type} woocommerce-message`;
            const $notice = $(`<div class="${noticeClass}" style="display:none;">${message}</div>`);
            
            // Insert after the product title or at the top of the form
            const $title = $('.product_title');
            if ($title.length) {
                $notice.insertAfter($title).slideDown();
            } else {
                $notice.prependTo(this.settings.productForm).slideDown();
            }
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                $notice.slideUp(400, function() {
                    $(this).remove();
                });
            }, 5000);
        }

        showError(message) {
            this.showNotice(message, 'error');
        }

        removeNotices() {
            $('.woocommerce-error, .woocommerce-message, .woocommerce-info')
                .not('.woocommerce-message--info')
                .slideUp(200, function() {
                    $(this).remove();
                });
        }

        log(...args) {
            if (this.settings.debug) {
                // console.log('[Rental Availability]', ...args);
            }
        }
    }

    // Initialize when document is ready
    $(document).ready(function() {
        // Only initialize on single product pages
        if ($('body').hasClass('single-product')) {
            window.rentalAvailability = new RentalAvailabilityChecker({
                debug: true // Set to false in production
            });
        }
    });

})(jQuery);
