(function($) {
    'use strict';

    const BookingValidation = {
        /**
         * Initialize the booking validation
         */
        init: function() {
            this.cacheElements();
            this.bindEvents();
            this.checkForBookedDates();
            this.debugLog('Booking validation initialized');
        },

        /**
         * Cache DOM elements
         */
        cacheElements: function() {
            this.$datePicker = $('.air-datepicker');
            this.$addToCartBtn = $('.single_add_to_cart_button');
            this.$placeOrderBtn = $('#place_order');
            this.$cartForm = $('form.cart');
            this.errorMessage = 'לא ניתן להזמין - יש תאריכים שכבר מלאים';
            this.debugContainer = null;
        },

        /**
         * Bind event listeners
         */
        bindEvents: function() {
            // Check dates on datepicker interaction
            if (this.$datePicker.length) {
                $(document).on('click', '.air-datepicker-cell', () => {
                    setTimeout(() => this.checkForBookedDates(), 100);
                });
            }

            // Check when dates are selected via other means
            if (this.$cartForm.length) {
                this.$cartForm.on('change', 'input[name="rental_dates"]', () => {
                    this.checkForBookedDates();
                });
            }

            // Check on page load and after AJAX updates
            $(document).ajaxComplete(() => {
                setTimeout(() => this.checkForBookedDates(), 300);
            });

            // Listen for date changes from other scripts
            $(document).on('rentalDatesUpdated', () => {
                this.debugLog('External date change detected');
                this.checkForBookedDates();
            });
        },

        /**
         * Check if any selected date is fully booked
         * @returns {boolean} True if dates are available, false if booked
         */
        checkForBookedDates: function() {
            const selectedCells = $('.air-datepicker-cell.-selected-, .air-datepicker-cell.-in-range-');
            const blockedCells = selectedCells.filter('.air-datepicker-cell--fully-booked, .air-datepicker-cell--disabled');
            
            const hasBookedDate = blockedCells.length > 0;
            
            // Debug output
            this.debugLog('Validating rental selection...');
            this.debugLog(`Found ${selectedCells.length} selected cells, ${blockedCells.length} are blocked`);
            
            // Log details about each selected date
            selectedCells.each((index, cell) => {
                const $cell = $(cell);
                const date = $cell.data('date') || 'unknown';
                const isBlocked = $cell.is('.air-datepicker-cell--fully-booked, .air-datepicker-cell--disabled');
                const classes = $cell.attr('class') || '';
                this.debugLog(`Date ${date}: blocked=${isBlocked}, classes: ${classes}`);
            });
            
            this.toggleButtons(!hasBookedDate);
            return !hasBookedDate;
        },

        /**
         * Toggle button states and show/hide error messages
         * @param {boolean} isEnabled - Whether buttons should be enabled
         */
        toggleButtons: function(isEnabled) {
            const buttons = this.$addToCartBtn.add(this.$placeOrderBtn);
            
            // Update button states
            buttons.prop('disabled', !isEnabled)
                  .toggleClass('disabled', !isEnabled)
                  .attr('title', isEnabled ? '' : this.errorMessage);

            // Handle error message display
            if (!isEnabled) {
                this.showErrorMessage();
            } else {
                this.hideErrorMessage();
            }
            
            this.debugLog(`Buttons ${isEnabled ? 'enabled' : 'disabled'}`);
        },
        
        /**
         * Show error message about booked dates
         */
        showErrorMessage: function() {
            if ($('#booking-error-message').length) return;
            
            const $errorMsg = $('<div/>', {
                id: 'booking-error-message',
                class: 'booking-error',
                html: `
                    <div style="color: #d32f2f; background: #ffebee; border: 1px solid #ffcdd2; 
                           padding: 10px; border-radius: 4px; margin: 10px 0;">
                        <strong>שגיאה:</strong> ${this.errorMessage}
                        <div style="font-size: 0.9em; margin-top: 5px;">
                            אנא בחרו תאריכים זמינים בלוח השנה
                        </div>
                    </div>
                `
            });
            
            // Insert after the first button's parent or form
            const $target = this.$addToCartBtn.length ? this.$addToCartBtn.parent() : this.$cartForm;
            $target.after($errorMsg);
            
            // Trigger event for other scripts
            $(document).trigger('bookingError', [this.errorMessage]);
        },
        
        /**
         * Remove error message
         */
        hideErrorMessage: function() {
            $('#booking-error-message').remove();
            $(document).trigger('bookingErrorCleared');
        },
        
        /**
         * Debug logging
         * @param {string} message - Message to log
         */
        debugLog: function(message) {
            if (window.console && window.console.log) {
                console.log(`[Booking Validation] ${message}`);
            }
            
            // Optionally show debug info in the UI
            if (window.location.search.includes('debug=booking')) {
                if (!this.debugContainer) {
                    this.debugContainer = $('<div id="booking-debug" style="background: #f5f5f5; padding: 10px; margin: 10px 0; border: 1px solid #ddd; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto;"></div>');
                    $('body').append(this.debugContainer);
                }
                this.debugContainer.prepend(`<div>${new Date().toISOString().split('T')[1].split('.')[0]}: ${message}</div>`);
                
                // Keep only last 20 messages
                const $messages = this.debugContainer.children();
                if ($messages.length > 20) {
                    $messages.slice(20).remove();
                }
            }
        }
    };

    // Initialize when document is ready
    $(function() {
        // Wait for other scripts to initialize
        setTimeout(() => {
            BookingValidation.init();
        }, 500);
        
        // Make it globally available for debugging
        window.BookingValidation = BookingValidation;
    });

})(jQuery);
