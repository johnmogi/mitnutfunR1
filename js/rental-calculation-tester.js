/**
 * Rental Calculation Tester
 * Tests the rental day calculations for specific date ranges
 * 
 * How to use:
 * 1. Run this script on the product page with AirCalendar loaded
 * 2. Check the console for test results
 */

(function() {
    // Style for console output
    const styles = {
        header: 'font-size: 16px; color: #0066cc; font-weight: bold;',
        subheader: 'font-size: 14px; color: #0099ff; font-weight: bold;',
        success: 'color: #00cc00; font-weight: bold;',
        error: 'color: #cc0000; font-weight: bold;',
        info: 'color: #666666;',
        warning: 'color: #cc6600; font-weight: bold;',
        highlight: 'background-color: #ffff00; padding: 2px; border-radius: 2px;'
    };

    // Print header
    // console.log('%c=== RENTAL CALCULATION TEST SUITE ===', styles.header);
    // console.log('%cTesting DOM-based rental day calculations', styles.subheader);
    
    // Test cases
    const testCases = [
        {
            name: "Special Case 1: Jul 12-16, 2025",
            start: "2025-07-12",
            end: "2025-07-16",
            expectedRentalDays: 4,
            expectedDiscountedDays: 3,
            expectedTotal: 1400,
            description: "5 calendar days with weekend, should be 4 rental days"
        },
        {
            name: "Special Case 2: Jul 17-21, 2025",
            start: "2025-07-17",
            end: "2025-07-21",
            expectedRentalDays: 3,
            expectedDiscountedDays: 2,
            expectedTotal: 1050,
            description: "5 calendar days with weekend, should be 3 rental days"
        },
        {
            name: "Weekend-Only Rental: Jul 24-26, 2025",
            start: "2025-07-24",
            end: "2025-07-26",
            expectedRentalDays: 1,
            expectedDiscountedDays: 0,
            expectedTotal: 700,
            description: "3 calendar days (Thu-Sat) weekend rental, should be 1 rental day"
        }
    ];
    
    // Function to run one test
    function runTest(test) {
        // console.log(`\n%c${test.name}`, styles.subheader);
        // console.log(`Date range: ${test.start} to ${test.end}`);
        // console.log(`${test.description}`);

        // Test DOM-based calculation
        // console.log('\n%cDOM-based Calculation:', styles.info);
        try {
            const domResult = calculateRentalDaysFromCalendar(test.start, test.end);
            
            // Check rental days
            const daysCorrect = domResult.rentalDays === test.expectedRentalDays;
            // console.log(`Rental days: ${daysCorrect ? '%c✓' : '%c✗'} ${domResult.rentalDays} ${daysCorrect ? '(correct)' : `(expected ${test.expectedRentalDays})`}`, 
                        daysCorrect ? styles.success : styles.error);
            
            // Check total price
            const totalCorrect = Math.abs(domResult.total - test.expectedTotal) < 1; // Allow for tiny float precision
            // console.log(`Total price: ${totalCorrect ? '%c✓' : '%c✗'} ${domResult.total}₪ ${totalCorrect ? '(correct)' : `(expected ${test.expectedTotal}₪)`}`, 
                        totalCorrect ? styles.success : styles.error);
            
            // Show breakdown
            // console.log('Price breakdown:');
            domResult.breakdown.forEach(item => {
                // console.log(`- ${item.label}: ${item.amount}₪`);
            });
            
            // Show debug info
            // console.log('\nDebug info:');
            // console.log('Weekend days:', domResult.debug.weekendDays);
            // console.log('Weekday count:', domResult.debug.weekdayCount);
            // console.log('Weekday blocks:', domResult.debug.weekdayBlocks);
            // console.log('Special adjustment:', domResult.debug.specialRangeAdj);
            
            // Overall test result
            const testPassed = daysCorrect && totalCorrect;
            // console.log(`\nTest result: ${testPassed ? '%cPASSED' : '%cFAILED'}`, testPassed ? styles.success : styles.error);
            
            return {
                passed: testPassed,
                result: domResult
            };
        } catch (error) {
            // console.log(`%cERROR: ${error.message}`, styles.error);
            console.error(error);
            return {
                passed: false,
                error: error
            };
        }
    }
    
    // Function to verify the calendar DOM is available
    function isCalendarAvailable() {
        const cells = document.querySelectorAll('.air-datepicker-cell.-day-');
        return cells.length > 0;
    }

    // Check if calendar is available
    if (!isCalendarAvailable()) {
        // console.log('%c⚠️ Calendar DOM elements not found! This test must be run on a product page with AirCalendar loaded.', styles.warning);
        // console.log('Please navigate to a product page with the datepicker loaded and try again.');
        return;
    }
    
    // Run all tests
    // console.log('%cRunning all tests...', styles.info);
    const results = testCases.map(runTest);
    
    // Summary
    const passed = results.filter(r => r.passed).length;
    const total = testCases.length;
    
    // console.log('\n%c=== TEST SUMMARY ===', styles.header);
    // console.log(`Tests: ${total}, Passed: %c${passed}%c, Failed: %c${total - passed}`, 
                passed === total ? styles.success : styles.info, 
                '', 
                total - passed > 0 ? styles.error : styles.info);
    
    if (passed === total) {
        // console.log('%c✅ All tests passed! The rental calculation is working correctly.', styles.success);
    } else {
        // console.log('%c❌ Some tests failed. Please check the results above for details.', styles.error);
    }
    
    // DOM inspection helper
    // console.log('\n%cCalendar DOM inspection:', styles.subheader);
    
    // Show calendar metadata
    const calendarMap = getCalendarDateMetadata();
    const metadataCount = Object.keys(calendarMap).length;
    // console.log(`Found ${metadataCount} calendar cells in the DOM`);
    
    // Check specific dates
    for (const test of testCases) {
        // console.log(`\nInspecting calendar cells for ${test.start} to ${test.end}:`);
        
        const start = new Date(test.start);
        const end = new Date(test.end);
        const current = new Date(start);
        
        while (current <= end) {
            const dateStr = formatDate(current);
            const metadata = calendarMap[dateStr];
            
            if (metadata) {
                // console.log(`${dateStr}: %c${metadata.isWeekend ? 'WEEKEND' : 'WEEKDAY'}%c ${metadata.isSelected ? '(selected)' : ''}`, 
                            metadata.isWeekend ? styles.highlight : '', '');
            } else {
                // console.log(`${dateStr}: %cNOT IN VISIBLE CALENDAR`, styles.warning);
            }
            
            current.setDate(current.getDate() + 1);
        }
    }
})();
