/**
 * Debug Rental Issues
 * Place this file in the header to debug before other scripts run
 */
// console.log('DEBUG RENTAL SCRIPT LOADED');

// Create a prominent visual debug panel
window.addEventListener('DOMContentLoaded', function() {
    // Force debug mode on
    window.rentalDebug = true;
    // console.log('Debug mode enabled for rental features');
    
    // Create debug panel
    var debugPanel = document.createElement('div');
    debugPanel.style.position = 'fixed';
    debugPanel.style.bottom = '10px';
    debugPanel.style.right = '10px';
    debugPanel.style.zIndex = '9999';
    debugPanel.style.background = 'rgba(0,0,0,0.6)';
    debugPanel.style.color = 'white';
    debugPanel.style.padding = '10px';
    debugPanel.style.borderRadius = '5px';
    debugPanel.style.width = '300px';
    debugPanel.style.maxHeight = '40%';
    debugPanel.style.overflow = 'auto';
    debugPanel.style.fontSize = '12px';
    debugPanel.style.fontFamily = 'monospace';
    debugPanel.style.opacity = '0.8';
    debugPanel.id = 'rental-debug-panel';
    debugPanel.innerHTML = '<div style="display:flex;justify-content:space-between"><h3>Rental Debug</h3>' +
                          '<div><button id="refresh-debug">Refresh</button> ' +
                          '<button id="toggle-debug-panel">Hide</button></div></div>' +
                          '<div id="debug-content"></div>';
    
    document.body.appendChild(debugPanel);
    
    // Add refresh handler
    document.getElementById('refresh-debug').addEventListener('click', updateDebugInfo);
    
    // Add toggle handler
    document.getElementById('toggle-debug-panel').addEventListener('click', function() {
        var content = document.getElementById('debug-content');
        if (content.style.display === 'none') {
            content.style.display = 'block';
            this.textContent = 'Hide';
        } else {
            content.style.display = 'none';
            this.textContent = 'Show';
        }
    });
    
    // Update debug info initially
    updateDebugInfo();
    
    function updateDebugInfo() {
        var content = document.getElementById('debug-content');
        var info = [];
        
        // Check if scripts are loaded
        info.push('<h4>Script Loading</h4>');
        var scripts = document.getElementsByTagName('script');
        var scriptList = [];
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src || 'inline script';
            if (src.includes('rental') || src.includes('cart')) {
                scriptList.push('✓ ' + src.split('/').pop());
            }
        }
        info.push('<p>Rental-related scripts: ' + (scriptList.length ? scriptList.join(', ') : 'None found!') + '</p>');
        
        // Check session storage for rental dates
        info.push('<h4>Session Storage</h4>');
        try {
            var hasRentalDatesInSession = false;
            for (var i = 0; i < sessionStorage.length; i++) {
                var key = sessionStorage.key(i);
                if (key.includes('rental') || key.includes('dates')) {
                    hasRentalDatesInSession = true;
                    var value = sessionStorage.getItem(key);
                    info.push('<p><strong>' + key + '</strong>: ' + value + '</p>');
                }
            }
            if (!hasRentalDatesInSession) {
                info.push('<p>No rental dates in sessionStorage</p>');
            }
        } catch(e) {
            info.push('<p>Error accessing sessionStorage: ' + e.message + '</p>');
        }
        
        // Check page for rental date fields
        info.push('<h4>Rental Date Fields</h4>');
        var dateFields = document.querySelectorAll('input[name*="rental"], input[name*="date"], [data-rental-dates]');
        if (dateFields.length) {
            info.push('<p>Found ' + dateFields.length + ' date fields:</p>');
            Array.from(dateFields).forEach(function(field) {
                info.push('<p>' + field.name + ' = ' + field.value + '</p>');
            });
        } else {
            info.push('<p>No rental date fields found</p>');
        }
        
        // Check cart items
        info.push('<h4>Cart Items</h4>');
        var cartItems = document.querySelectorAll('.cart_item, .item');
        if (cartItems.length) {
            info.push('<p>Found ' + cartItems.length + ' cart items</p>');
            
            // Show sample cart item HTML
            var sampleItem = cartItems[0];
            info.push('<p><strong>Sample cart item structure</strong> ' +
                     '<button onclick="document.getElementById(\'sample-html\').style.display = ' +
                     'document.getElementById(\'sample-html\').style.display === \'none\' ? \'block\' : \'none\';">Show/Hide</button></p>');
            info.push('<pre id="sample-html" style="display:none;max-height:300px;overflow:auto;">' + 
                     sampleItem.outerHTML.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>');
            
            // Check meta data for all items
            info.push('<p><strong>Item meta data:</strong></p>');
            Array.from(cartItems).forEach(function(item, index) {
                var metaList = item.querySelector('dl.variation, .wc-item-meta');
                if (metaList) {
                    var metaItems = metaList.querySelectorAll('dt, dd');
                    if (metaItems.length) {
                        info.push('<p>Item #' + (index + 1) + ' meta:</p>');
                        var metaDetails = [];
                        Array.from(metaItems).forEach(function(meta) {
                            metaDetails.push(meta.textContent.trim());
                        });
                        info.push('<p style="margin-left:10px">' + metaDetails.join(', ') + '</p>');
                    }
                } else {
                    info.push('<p>Item #' + (index + 1) + ': No meta data found</p>');
                }
            });
            
            // Check hidden inputs
            var hiddenInputs = document.querySelectorAll('input[type="hidden"][name*="rental"]');
            if (hiddenInputs.length) {
                info.push('<p><strong>Hidden rental inputs:</strong></p>');
                Array.from(hiddenInputs).forEach(function(input) {
                    info.push('<p>' + input.name + ' = ' + input.value + '</p>');
                });
            } else {
                info.push('<p>No hidden rental inputs found</p>');
            }
        } else {
            info.push('<p>No cart items found!</p>');
        }
        
        // Check for console messages about rental dates
        info.push('<h4>JS Console (see browser console)</h4>');
        info.push('<p>Check browser console for detailed debug info about rental dates processing</p>');
        // console.log('===== RENTAL DEBUG INFORMATION =====');
        // console.log('Checking for window variables related to rental:');
        if (window.rental_dates) // console.log('window.rental_dates:', window.rental_dates);
        if (window.selectedDates) // console.log('window.selectedDates:', window.selectedDates);
        // console.log('===== END RENTAL DEBUG =====');
        
        // Dump content to panel
        content.innerHTML = info.join('');
    }
});
