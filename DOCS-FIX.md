                                                      # WooCommerce Rental Calendar Fix - Developer Documentation

                                                      ## Overview
                                                      This document provides a comprehensive map of all JavaScript files created to fix various issues with the WooCommerce rental calendar and checkout system. The system handles rental date selection, availability checking, cart management, and checkout pricing for rental products.

                                                      ## Active Theme Information

                                                      IMPORTANT: The active theme is **mitnafun_uproR**, not mitnafun-upro. All fixes must be applied to the mitnafun_uproR theme directory.

                                                      ## File Structure & Function Map

                                                      ### Core Calendar Files

                                                      1. **rental-datepicker.js**
                                                         - Main calendar initialization and date selection logic
                                                         - Handles fetching rental dates from server via AJAX
                                                         - Implements rental day calculation rules (2=1, 3=2, 4=3, Fri-Sun=1)
                                                         - Sets up datepicker UI and cell rendering

                                                      2. **calendar-range-validator.js**
                                                         - DEBUG validator for date range selection
                                                         - Implements detailed console logging for date selection validation
                                                         - Shows validation steps and decisions for debugging purposes
                                                         - **Current issue:** Join/envelop logic needs fixing

                                                      3. **calendar-join-bookings.js**
                                                         - Implements join booking logic for rental dates
                                                         - Controls whether dates can join with existing bookings
                                                         - Currently not functioning correctly (needs fixing)

                                                      4. **calendar-booking-fix.js**
                                                         - Improves calendar cell rendering for booked dates
                                                         - Enhances the UI to better display booking status
                                                         - Fixes cell styling and class application

                                                      5. **air-datepicker-enhanced-style.js**
                                                         - Enhances the styling of the AirDatepicker calendar
                                                         - Sets improved spacing, cell size, and typography
                                                         - Makes the calendar more responsive and user-friendly

                                                      ### Form & Data Handling

                                                      6. **rental-form-fix.js**
                                                         - Ensures rental dates are properly submitted with the cart form
                                                         - Adds missing hidden input fields if needed
                                                         - Fixes form submission and data capture

                                                      7. **rental-datepicker-fix.js**
                                                         - CRITICAL FIX: Resolves the "[object HTMLCollection]" issue with rental_dates input
                                                         - Monitors AirDatepicker selections and fixes invalid input values
                                                         - Adds form submission safety check to prevent "must select rental dates" error
                                                         - Properly formats date ranges before submission to ensure cart validation succeeds

                                                      8. **rental-form-final-fix.js**
                                                         - Aggressive fix to ensure rental dates are captured
                                                         - Last resort handler for form submissions
                                                         - Forces rental date inclusion in cart data

                                                      ### Cart & Checkout

                                                      9. **cart-rental-fix.js**
                                                         - Fixes rental date display in cart
                                                         - Handles proper price calculation for rental days
                                                         - Prevents endless spinners and broken UI states

                                                      10. **mini-cart-fix.js**
                                                         - Fixes the floating mini-cart popup issues
                                                         - Ensures proper alignment and display of rental dates
                                                         - Prevents UI breaking when removing items

                                                      11. **checkout-fix.js**
                                                         - Fixes general checkout issues
                                                         - Ensures proper display of rental information
                                                         - Handles checkout form submission correctly

                                                      12. **checkout-price-fix.js**
                                                         - Ensures correct price calculation in checkout
                                                         - Prevents price accumulation bugs during refreshes
                                                         - Maintains pricing consistency between product and checkout

                                                      13. **checkout-robust-fix.js**
                                                         - Provides robust handling of checkout edge cases
                                                         - Prevents broken UI during cart changes
                                                         - Handles error states gracefully

                                                      14. **cart-empty-redirect.js**
                                                         - NEW: Prevents broken pages when cart is emptied during checkout
                                                         - Redirects user to home page or last viewed product
                                                         - Monitors cart events and handles empty cart state

                                                      ### Debug & Development

                                                      15. **debug-rental.js**
                                                         - Development helper for debugging rental functionality
                                                         - Logs important rental variables and state
                                                         - Helps identify issues with rental date passing

                                                      16. **join-booking-notice.js**
                                                         - Provides user notices about join booking rules
                                                         - Explains when dates can/cannot be selected
    - Improves user experience with clear messaging

17. **stock-debugger.js**
    - Displays product stock information for debugging
    - Shows reserved dates and availability
    - Helps track stock management issues

18. **stock-debugger-debug-log.js**
    - Extended logging for stock debugger
    - Provides detailed information about stock calculations
    - Used in development to trace stock management

19. **stock-debugger-collapsible.js**
    - Makes the stock debugger panel collapsible
    - Improves UI for admin users
    - Provides better organization of debug information

## Main Issues Fixed

1. **Calendar Rendering**
   - Fixed syntax errors in rental-datepicker.js
   - Improved calendar cell styling and size
   - Enhanced date display and selection UI

2. **Rental Day Calculation**
   - Implemented the special pricing rule: 2 days = 1 rental day, 3 days = 2, etc.
   - Added special handling for Fri-Sun counting as 1 rental day
   - Fixed calculation edge cases

3. **Price Calculation & Display**
   - Implemented 50% discount on days after first day
   - Added visible price breakdown on product page
   - Fixed incorrect pricing in cart and checkout

4. **Empty Checkout Page Fix** (July 1, 2025)
   - Identified and fixed an active redirect in inc/checkout.php causing empty checkout page
   - Commented out template_redirect action that was redirecting cart and add-to-cart requests
   - This resolved the critical regression where checkout page appeared empty

5. **Checkout Script Improvements** (July 1, 2025)
   - Enhanced checkout-fix.js with improved error handling
   - Added safeExecute helper function to prevent script errors from breaking page
   - Added proper page verification before running price calculations
   - Added checks to ensure cart items exist before processing
   - Implemented skip logic to prevent duplicate processing of items

6. **Cart & Checkout Flow**
   - Fixed rental date display in cart and mini-cart
   - Ensured pricing consistency throughout purchase flow
   - Fixed broken checkout when emptying cart (redirects now)

### New Fixes in js-fixes Directory

**Note:** As of July 2025, all new JavaScript fixes are placed in the dedicated `js-fixes` directory for better organization and tracking.

1. **mini-cart-fix.js**
   - Implements correct pricing logic for mini-cart items
   - Ensures prices match product page calculations exactly
   - Applies proper discount rules: Day 1 = full price, Day 2+ = 50% discount
   - Handles special case products (IDs 150, 153) with no discount
   - Hooks into WooCommerce events to update when mini-cart changes

2. **checkout-fix.js**
   - Applies the same pricing logic to checkout page items
   - Ensures consistent pricing throughout the purchase flow
   - Properly handles quantity calculations
   - Updates order totals dynamically
   - Hooks into 'updated_checkout' for real-time price updates
   - Enhanced with better error handling and defensive programming (July 1, 2025)

3. **checkout-detailed-price-fix.js** (Added July 1, 2025)
   - Implements MIT266-style detailed price breakdown in checkout
   - Shows rental dates with start and end dates
   - Displays number of rental days
   - Adds price breakdown with day 1 at full price and additional days at 50% discount
   - Shows original price and savings information
   - Uses consistent HTML structure matching MIT266 reference

4. **calendar-join-bookings-fix.js** (Added July 1, 2025)
   - Enhanced version of calendar join bookings logic
   - Fixes envelope scenario (prevents selecting dates that surround fully booked dates)
   - Still allows valid join bookings on first/last days
   - Provides better error messages for different booking scenarios
   - Includes improved validation and debugging information

### Versioning Changes

- All CSS and JavaScript files now use fixed version numbers (1.0.0) instead of dynamic versioning
- Removed all instances of `filemtime()` and `time()` for script/style versioning
- This prevents caching issues that were causing inconsistent behavior


## Current Issues

1. **Join/Envelope Logic**
   - Calendar still allows selecting date ranges that envelop fully booked dates
   - Join logic not working correctly for booking start/end dates

2. **Product Exclusions**
   - Special product exclusions (products 150, 153) from discount rules not fully working

## Development Notes

- Many files use jQuery document ready to ensure proper initialization
- Console logging is used extensively for debugging
- Files are loaded in specific order to ensure dependencies are met
- The system relies on hidden form fields to pass data between components

## Future Improvements

1. Consolidate multiple JS files into fewer, more organized files
2. Improve code documentation and structure
3. Add more comprehensive error handling
4. Fix remaining issues with join/envelope logic
