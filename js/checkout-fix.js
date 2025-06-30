/**
 * Checkout page fix
 * Removes any stuck spinners on the checkout page
 */
jQuery(document).ready(function($) {
    // Function to remove stuck spinners
    function removeStuckSpinners() {
        $('.blockUI.blockOverlay').remove();
        $('.blockUI.blockMsg').remove();
        
        // Also unlock any blocked elements
        $('.blockElement').removeClass('blockElement');
        
        // Remove any spinners in review orders section
        $('.woocommerce-checkout-review-order-table').unblock();
        $('.woocommerce-checkout-payment').unblock();
    }
    
    // Initial cleanup
    setTimeout(removeStuckSpinners, 500);
    
    // Watch for AJAX events and clean up after they complete
    $(document).ajaxComplete(function() {
        setTimeout(removeStuckSpinners, 100);
    });
    
    // Remove spinners on page load and when fragments are refreshed
    $(document.body).on('updated_checkout', function() {
        setTimeout(removeStuckSpinners, 100);
    });
    
    // Set periodic check to make sure no spinners get stuck
    setInterval(removeStuckSpinners, 2000);
});
