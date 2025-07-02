/**
 * AirDatepicker Enhanced Styling
 * Improves the visual styling and layout of AirDatepicker calendar
 * Based on reference styles from MIT266
 */
jQuery(document).ready(function($) {
    'use strict';
    
    console.log('AIR-DATEPICKER ENHANCED STYLING LOADED');
    
    /**
     * Apply enhanced styles to the AirDatepicker
     */
    function enhanceAirDatepicker() {
        // Only proceed if we're on a product page with a datepicker
        if (!$('.air-datepicker').length) {
            return;
        }
        
        console.log('Applying enhanced styles to AirDatepicker');
        
        // Remove any existing custom styles we added previously
        $('#air-datepicker-enhanced-styles').remove();
        
        // Add our custom styles
        const styleElement = $('<style id="air-datepicker-enhanced-styles"></style>');
        styleElement.html(`
            /* Improve overall calendar layout */
            .air-datepicker {
                font-family: inherit !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
                border-radius: 8px !important;
                border: none !important;
                direction: rtl !important;
                width: 420px !important; /* Even larger calendar */
                padding: 18px !important;
                font-size: 115% !important; /* Larger text */
            }
            
            /* Calendar header */
            .air-datepicker-nav {
                padding: 8px 10px !important;
                border-bottom: 1px solid #f0f0f0 !important;
                margin-bottom: 8px !important;
            }
            
            .air-datepicker-nav--title {
                font-weight: bold !important;
                font-size: 16px !important;
            }
            
            /* Calendar navigation buttons */
            .air-datepicker-nav--action {
                width: 32px !important;
                height: 32px !important;
                border-radius: 50% !important;
                background-color: #f5f5f5 !important;
                color: #333 !important;
                transition: all 0.2s ease !important;
            }
            
            .air-datepicker-nav--action:hover {
                background-color: #e0e0e0 !important;
            }
            
            /* Days of week headers */
            .air-datepicker--day-name {
                color: #555 !important;
                font-weight: 600 !important;
                width: 52px !important;
                height: 40px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 15px !important;
            }
            
            /* Date cells */
            .air-datepicker-body--day {
                padding: 0 !important;
            }
            
            .air-datepicker-cell {
                width: 52px !important;
                height: 52px !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                transition: all 0.2s ease !important;
                font-size: 16px !important;
            }
            
            /* Hover effect for available dates */
            .air-datepicker-cell:not(.-disabled-):hover {
                background-color: #e3f2fd !important;
                cursor: pointer !important;
            }
            
            /* Selected dates */
            .air-datepicker-cell.-selected- {
                background-color: #4CAF50 !important;
                color: white !important;
                font-weight: bold !important;
            }
            
            .air-datepicker-cell.-selected-.-focus- {
                background-color: #43a047 !important;
            }
            
            /* Range styling */
            .air-datepicker-cell.-in-range- {
                background-color: rgba(76, 175, 80, 0.1) !important;
                color: #333 !important;
            }
            
            .air-datepicker-cell.-range-from-, .air-datepicker-cell.-range-to- {
                background-color: #4CAF50 !important;
                color: white !important;
                font-weight: bold !important;
                border-radius: 50% !important;
            }
            
            /* Past dates */
            .air-datepicker-cell.-disabled-.-disabled-.-past- {
                color: #ccc !important;
                background-color: #f8f8f8 !important;
                text-decoration: line-through !important;
                opacity: 0.5 !important;
                cursor: not-allowed !important;
            }
            
            /* Weekend styling */
            .air-datepicker-cell:nth-child(7n), .air-datepicker-cell:nth-child(7n-1) {
                color: #555 !important;
                background-color: rgba(0, 0, 0, 0.03) !important;
            }
            
            /* Maintain selected state even on weekends */
            .air-datepicker-cell.-selected-:nth-child(7n), .air-datepicker-cell.-selected-:nth-child(7n-1),
            .air-datepicker-cell.-range-from-:nth-child(7n), .air-datepicker-cell.-range-from-:nth-child(7n-1),
            .air-datepicker-cell.-range-to-:nth-child(7n), .air-datepicker-cell.-range-to-:nth-child(7n-1) {
                background-color: #4CAF50 !important;
                color: white !important;
            }
            
            /* Today's date */
            .air-datepicker-cell.-current- {
                color: #1976D2 !important;
                font-weight: bold !important;
                border: 1px solid #1976D2 !important;
            }
            
            /* Partially booked dates */
            .air-datepicker-cell--partially-booked {
                position: relative;
                background-color: rgba(255, 165, 0, 0.1) !important;
            }
            
            .air-datepicker-cell--partially-booked:after {
                content: '';
                position: absolute;
                top: 4px;
                right: 4px;
                width: 6px;
                height: 6px;
                background-color: orange;
                border-radius: 50%;
            }
            
            /* Fully booked dates */
            .air-datepicker-cell--fully-booked {
                position: relative;
                background-color: rgba(255, 0, 0, 0.05) !important;
                color: #666 !important;
                cursor: not-allowed !important;
            }
            
            .air-datepicker-cell--fully-booked:after {
                content: '';
                position: absolute;
                top: 0;
                bottom: 0;
                left: 0;
                right: 0;
                background: repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 5px,
                    rgba(255, 0, 0, 0.1) 5px,
                    rgba(255, 0, 0, 0.1) 10px
                );
                border-radius: 50%;
                z-index: 0;
            }
            
            /* Time controls */
            .air-datepicker--time {
                padding-top: 8px !important;
                border-top: 1px solid #f0f0f0 !important;
                margin-top: 8px !important;
            }
            
            /* Mobile improvements */
            @media (max-width: 480px) {
                .air-datepicker {
                    width: 100% !important;
                    right: 0 !important;
                    left: 0 !important;
                    position: fixed !important;
                    bottom: 0 !important;
                    top: auto !important;
                    border-radius: 12px 12px 0 0 !important;
                    transform: none !important;
                    max-height: 80vh !important;
                    padding: 16px !important;
                }
                
                /* Add a touch-friendly close button */
                .air-datepicker:before {
                    content: '';
                    width: 40px;
                    height: 4px;
                    background-color: #ccc;
                    border-radius: 2px;
                    position: absolute;
                    top: 8px;
                    left: 50%;
                    transform: translateX(-50%);
                }
            }
        `);
        
        // Append styles to head
        $('head').append(styleElement);
        
        // Add directional fixes
        fixCalendarRTL();
        
        console.log('Enhanced styles applied to AirDatepicker');
    }
    
    /**
     * Fix RTL styling issues
     */
    function fixCalendarRTL() {
        // Remove any existing RTL fix styles
        $('#air-datepicker-rtl-fixes').remove();
        
        const rtlFixStyle = $('<style id="air-datepicker-rtl-fixes"></style>');
        rtlFixStyle.html(`
            .air-datepicker {
                direction: rtl !important;
                left: 0 !important;
                right: auto !important;
            }
            
            .air-datepicker--pointer {
                right: 50% !important;
                left: auto !important;
            }
            
            /* Fix navigation button direction */
            .air-datepicker-nav--action svg {
                transform: scaleX(-1) !important;
            }
            
            /* Fix layout for better RTL support */
            .air-datepicker-body--cells {
                direction: rtl !important;
            }
        `);
        
        $('head').append(rtlFixStyle);
    }
    
    // Initialize when document is ready
    enhanceAirDatepicker();
    
    // Also apply when calendar data is updated
    $(document).on('rentalDatesLoaded', function() {
        setTimeout(enhanceAirDatepicker, 200);
    });
});
