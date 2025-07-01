/**
 * Simple Price Override - Focuses on essential functionality
 * Version 1.0.0
 */

jQuery(document).ready(function($) {
    console.log('Simple Price Override JS loaded');
    
    // Save price data from product page to localStorage
    function savePriceData() {
        const productId = .val();
        const totalPrice = window.calculatedRentalPrice || .text().replace(/[^0-9.]/g, '');
        
        if (productId && totalPrice) {
            const data = JSON.parse(localStorage.getItem('mitnafun_rental_prices') || '{}');
            data[productId] = {
                totalPrice: parseFloat(totalPrice),
                timestamp: Date.now()
            };
            localStorage.setItem('mitnafun_rental_prices', JSON.stringify(data));
            console.log('Price saved:', productId, totalPrice);
        }
    }
    
    // Update cart with saved prices
    function updateCartPrices() {
        const data = JSON.parse(localStorage.getItem('mitnafun_rental_prices') || '{}');
        
        .each(function() {
            const item = ;
            const productId = item.find('.remove').data('product_id');
            
            if (productId && data[productId]) {
                const price = data[productId].totalPrice;
                item.find('.amount').html('₪ ' + price.toLocaleString('he-IL'));
            }
        });
    }
    
    // Setup events
    .on('click', '.single_add_to_cart_button', savePriceData);
    .on('updated_cart_totals added_to_cart', updateCartPrices);
    
    // Initial run
    if (.length) setTimeout(savePriceData, 1000);
    if (.length) setTimeout(updateCartPrices, 500);
});

