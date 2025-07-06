# Weekend Rental Calculation Hotfix

## Overview
This document explains the updates to the rental day calculation system, particularly focusing on the weekend rental logic and the pickup time restrictions for edge bookings.

## Weekend Rental Day Calculation
The rental day calculation system has been improved to properly handle various date ranges including weekends. The system now calculates rental days with the following rules:

1. **Special Cases for Short Rentals:**
   - Thursday to Saturday rentals count as 1 rental day
   - Thursday to Sunday or Thursday to Monday rentals count as 2 rental days

2. **General Calculation Rules:**
   - Every 2 weekdays = 1 rental day
   - Any weekend (Friday-Sunday) in the range counts as 1 day
   - Each day is analyzed to properly count weekdays vs weekend days

### Example Case
For a rental from 2025-07-17 to 2025-07-21:
- Thu (17th): weekday
- Fri (18th), Sat (19th): weekend, counts as 1 day
- Sun (20th), Mon (21st): 2 weekdays, counts as 1 day

Total: 2 rental days

## Pickup Time Restrictions for Edge Bookings

### Problem
When items are booked back-to-back on the same day (one booking ends the same day another starts), customers shouldn't be able to pick up an item before it's been returned by the previous customer.

### Solution
The system now restricts early morning pickup time slots when there's an edge booking detected:

1. The system checks if any items in the cart have a pickup date that matches the return date of another booking
2. If such an "edge booking" is detected, early pickup times (before the standard return time) are disabled
3. A notice is displayed to the customer explaining why early pickup times are unavailable

### Technical Implementation
- JavaScript frontend restricts pickup time options in the dropdown menu
- PHP backend detects edge bookings through AJAX
- The return time is configurable through WooCommerce settings

### Files Added
1. `js/pickup-time-restriction.js` - Frontend implementation
2. `inc/pickup-time-restriction.php` - Backend implementation

## Future Enhancements
Potential future improvements:
- Support for specific return times per product
- Email notifications about restricted pickup times
- Admin interface for managing pickup/return time slots
