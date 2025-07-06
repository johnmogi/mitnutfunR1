/**
 * Pickup Time Restriction Script
 * 
 * This script restricts available pickup times based on booking edge dates
 * For joined bookings, early morning pickup times are disabled if the item
 * needs to be returned first
 * 
 * @version 1.0
 */

document.addEventListener('DOMContentLoaded', function() {
    // console.log('🕒 Pickup Time Restriction - Script loaded');
    initPickupTimeRestrictions();
    
    // Also initialize when fragments are updated (checkout refreshes)
    jQuery(document.body).on('updated_checkout', function() {
        // console.log('🕒 Pickup Time Restriction - Checkout updated event detected');
        initPickupTimeRestrictions();
    });
});

/**
 * Initialize the pickup time restriction functionality
 */
function initPickupTimeRestrictions() {
    // console.log('🕒 Pickup Time Restriction - Initializing restrictions');
    
    // Check if we're on the checkout page
    if (!document.querySelector('.woocommerce-checkout')) {
        // console.log('🕒 Pickup Time Restriction - Not on checkout page, exiting');
        return;
    }
    
    // Find the pickup time dropdown
    const pickupTimeSelect = document.querySelector('select[name="order_comments"]');
    if (!pickupTimeSelect) {
        // console.log('🕒 Pickup Time Restriction - Pickup time dropdown not found');
        return;
    }
    
    // console.log('🕒 Pickup Time Restriction - Found pickup time dropdown');
    
    // Check for edge date bookings in the cart
    checkForEdgeBookings().then(function(edgeBookingInfo) {
        if (edgeBookingInfo.hasEdgeBooking) {
            // console.log('🕒 Pickup Time Restriction - Edge booking found, restricting early pickup times');
            restrictEarlyPickupTimes(pickupTimeSelect, edgeBookingInfo.returnTime);
        } else {
            // console.log('🕒 Pickup Time Restriction - No edge bookings found, allowing all pickup times');
            enableAllPickupTimes(pickupTimeSelect);
        }
    });
}

/**
 * Check cart items for edge booking dates (bookings that end on the same day as the new booking starts)
 * @returns {Promise} Promise object with edge booking information
 */
function checkForEdgeBookings() {
    return new Promise(function(resolve) {
        // We'll use AJAX to check the cart for edge bookings
        jQuery.ajax({
            url: wc_checkout_params.ajax_url,
            type: 'POST',
            data: {
                action: 'check_edge_bookings_in_cart',
                security: wc_checkout_params.update_order_review_nonce
            },
            success: function(response) {
                if (response.success) {
                    // console.log('🕒 Pickup Time Restriction - Edge booking check result:', response.data);
                    resolve({
                        hasEdgeBooking: response.data.has_edge_booking,
                        returnTime: response.data.return_time || '11:00' // Default to 11:00 if not specified
                    });
                } else {
                    // console.log('🕒 Pickup Time Restriction - Error checking edge bookings');
                    resolve({ hasEdgeBooking: false });
                }
            },
            error: function() {
                // console.log('🕒 Pickup Time Restriction - AJAX error checking edge bookings');
                resolve({ hasEdgeBooking: false });
            }
        });
    });
}

/**
 * Restrict early pickup times based on return time
 * @param {HTMLElement} selectElement The pickup time select element
 * @param {string} returnTime The return time (format: 'HH:MM')
 */
function restrictEarlyPickupTimes(selectElement, returnTime) {
    // console.log(`🕒 Pickup Time Restriction - Restricting pickup times before ${returnTime}`);
    
    // Parse return time
    const returnHour = parseInt(returnTime.split(':')[0], 10);
    
    // For each option, check if it's before the return time
    const options = selectElement.querySelectorAll('option');
    options.forEach(function(option) {
        const value = option.value;
        if (!value) return; // Skip empty option
        
        // Extract the start hour from the option value (format: 'HH:MM-HH:MM')
        const startTime = value.split('-')[0];
        const startHour = parseInt(startTime.split(':')[0], 10);
        
        // Disable if the pickup time is before return time
        if (startHour < returnHour) {
            option.disabled = true;
            option.setAttribute('data-restricted', 'true');
            // console.log(`🕒 Pickup Time Restriction - Disabled pickup time: ${value} (before ${returnTime})`);
        } else {
            option.disabled = false;
            option.removeAttribute('data-restricted');
        }
    });
    
    // If the currently selected option is now disabled, select the first available option
    if (selectElement.selectedOptions[0] && selectElement.selectedOptions[0].disabled) {
        // Find first enabled option
        const firstAvailable = Array.from(options).find(opt => !opt.disabled && opt.value);
        if (firstAvailable) {
            selectElement.value = firstAvailable.value;
            
            // Trigger change event for Select2 if it's being used
            if (jQuery && jQuery.fn.select2) {
                jQuery(selectElement).trigger('change');
            }
        }
    }
    
    // Add a notice about restricted pickup times
    addPickupTimeNotice(returnTime);
}

/**
 * Enable all pickup times in the dropdown
 * @param {HTMLElement} selectElement The pickup time select element
 */
function enableAllPickupTimes(selectElement) {
    // console.log('🕒 Pickup Time Restriction - Enabling all pickup times');
    
    // Enable all options
    const options = selectElement.querySelectorAll('option');
    options.forEach(function(option) {
        option.disabled = false;
        option.removeAttribute('data-restricted');
    });
    
    // Remove any notice about restricted pickup times
    removePickupTimeNotice();
}

/**
 * Add a notice about restricted pickup times
 * @param {string} returnTime The return time
 */
function addPickupTimeNotice(returnTime) {
    // Remove any existing notice first
    removePickupTimeNotice();
    
    // Create and add the notice
    const noticeContainer = document.createElement('div');
    noticeContainer.id = 'pickup-time-restriction-notice';
    noticeContainer.className = 'woocommerce-info pickup-time-notice';
    noticeContainer.style.marginBottom = '15px';
    noticeContainer.style.padding = '1em 1.5em';
    noticeContainer.style.borderColor = '#ffcc00';
    noticeContainer.style.backgroundColor = 'rgba(255, 204, 0, 0.1)';
    
    // Hebrew text for the notice
    noticeContainer.innerHTML = `
        <i class="fas fa-clock" style="margin-left: 5px;"></i>
        <strong>שימו לב:</strong> שעות האיסוף המוקדמות אינן זמינות מכיוון שהפריט מושכר עד השעה ${returnTime}.
    `;
    
    // Find the pickup time field container and insert the notice after it
    const pickupTimeContainer = document.querySelector('select[name="order_comments"]').closest('.form-row');
    if (pickupTimeContainer && pickupTimeContainer.parentNode) {
        pickupTimeContainer.parentNode.insertBefore(noticeContainer, pickupTimeContainer.nextSibling);
        // console.log('🕒 Pickup Time Restriction - Added notice about restricted pickup times');
    }
}

/**
 * Remove the pickup time restriction notice
 */
function removePickupTimeNotice() {
    const existingNotice = document.getElementById('pickup-time-restriction-notice');
    if (existingNotice) {
        existingNotice.parentNode.removeChild(existingNotice);
        // console.log('🕒 Pickup Time Restriction - Removed pickup time restriction notice');
    }
}
