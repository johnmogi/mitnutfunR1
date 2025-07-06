/**
 * Fix Loader
 * This small script ensures the weekend fix is applied as early as possible
 */
// console.log('🔄 Fix loader running...');

// Force the weekend fix to run immediately
window.addEventListener('DOMContentLoaded', function() {
    // console.log('🚀 Triggering weekend fix loader');
    // Force reload of the fix script
    var script = document.createElement('script');
    script.src = '/wp-content/themes/mitnafun_uproR/js/weekend-fix-direct.js?t=' + new Date().getTime();
    document.head.appendChild(script);
    
    // Also try direct invocation
    setTimeout(function() {
        if (typeof window.$airDatepickers !== 'undefined') {
            // console.log('⚡ Direct patch attempt');
            // Try to trigger the fix manually
            var event = new MouseEvent('click', {
                'view': window,
                'bubbles': true,
                'cancelable': true
            });
            document.querySelector('.air-datepicker')?.dispatchEvent(event);
        }
    }, 1500);
});
