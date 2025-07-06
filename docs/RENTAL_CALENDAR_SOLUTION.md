# WooCommerce Rental Calendar Solution

## Overview
This document provides comprehensive documentation for the WooCommerce Rental Calendar implementation, including business rules, technical implementation, and solutions to common issues.

## Business Rules

### Rental Day Calculation
1. **Standard Calculation**:
   - 1 day = 1 rental day
   - 2 days = 1 rental day
   - 3 days = 2 rental days
   - 4 days = 3 rental days
   - 5+ days = Math.ceil(dayCount / 2)

2. **Weekend Special Case (Friday-Sunday)**:
   - Friday-Sunday (or any subset) = 1 rental day
   - If weekend is part of a longer rental, the weekend counts as 1 day plus standard calculation for remaining days

### Stock and Availability
1. **Initial Stock**:
   - Primary reference for inventory management
   - Determines maximum concurrent rentals allowed

2. **Reservation Rules**:
   - Each reservation counts as 1 unit regardless of duration
   - Double booking is allowed up to the Initial Stock limit
   - Dates are marked as fully booked when reservations equal Initial Stock

## Technical Implementation

### Key Files
1. **rental-datepicker.js**:
   - Handles calendar UI and date selection
   - Implements business logic for day calculation
   - Manages date availability and validation

2. **class-stock-debugger.php**:
   - Provides debugging tools for stock management
   - Tracks reservations and availability

### Core Functions

#### Day Calculation
```javascript
function calculateRentalDays(startDate, endDate) {
    // Count weekdays (excluding Saturdays)
    let dayCount = 0;
    let current = new Date(startDate);
    
    while (current <= endDate) {
        if (current.getDay() !== 6) { // Skip Saturdays
            dayCount++;
        }
        current.setDate(current.getDate() + 1);
    }

    // Apply business rules
    if (hasWeekendPattern(startDate, endDate)) {
        return calculateWeekendInclusiveDays(dayCount);
    } else {
        // Standard calculation
        if (dayCount <= 1) return 1;
        if (dayCount === 2) return 1;
        if (dayCount === 3) return 2;
        if (dayCount === 4) return 3;
        return Math.ceil(dayCount / 2);
    }
}
```

#### Date Availability
- **Available**: Date has not reached initial stock limit
- **Partially Booked**: Some stock remains but not at full capacity
- **Fully Booked**: No more stock available for that date
- **End Date**: Treated as fully booked to prevent back-to-back rentals

### Edge Cases Handled

1. **Single Unit Rentals**:
   - No edge days for fully booked dates
   - Stricter validation to prevent double booking

2. **Multi-Unit Rentals**:
   - Edge days allow joining bookings
   - First and last day of booking blocks are selectable

3. **Date Ranges**:
   - Handles weekend patterns (Friday-Sunday)
   - Properly calculates mid-week rentals
   - Validates against existing bookings

## Debugging

### Common Issues

1. **Incorrect Day Count**:
   - Verify the day calculation function
   - Check for weekend patterns
   - Ensure Saturdays are excluded

2. **Availability Issues**:
   - Check initial stock value
   - Verify reservation counts
   - Look for conflicting bookings

3. **UI Problems**:
   - Ensure proper CSS classes are applied
   - Check for JavaScript errors
   - Verify date formatting

### Debug Tools

```javascript
// Access debug functions in browser console
window.rentalDatepickerDebug = {
    reload: function() { /* ... */ },
    getStatus: function() { /* ... */ }
};
```

## Best Practices

1. **Code Organization**:
   - Keep business logic separate from UI code
   - Use descriptive variable names
   - Add comments for complex calculations

2. **Error Handling**:
   - Validate all inputs
   - Provide meaningful error messages
   - Log errors for debugging

3. **Performance**:
   - Minimize DOM manipulations
   - Cache jQuery selectors
   - Use event delegation where appropriate

## Future Improvements

1. **Caching**:
   - Cache availability data
   - Reduce AJAX calls

2. **UI/UX**:
   - Add loading indicators
   - Improve mobile experience
   - Add visual feedback for user actions

3. **Features**:
   - Support for different pricing tiers
   - Bulk booking management
   - Advanced reporting

## Troubleshooting

### Common Problems

1. **Dates Not Blocking Correctly**:
   - Verify the `bookedDates` data structure
   - Check for timezone issues
   - Validate the `isFullyBooked` logic

2. **Incorrect Pricing**:
   - Verify day calculation
   - Check for weekend patterns
   - Validate price calculation logic

3. **Performance Issues**:
   - Check for excessive re-renders
   - Optimize date processing
   - Implement pagination for large date ranges

## Conclusion
This solution provides a robust implementation of a rental calendar with support for complex business rules and edge cases. By following the patterns and practices outlined in this document, maintainers can effectively manage and extend the functionality as needed.
