/**
 * Quick test script to verify the hotfix for specific date ranges
 * Run this in the browser console to check if rental day calculations are correct
 */
(function() {
    console.log('=============================================');
    console.log('RENTAL CALCULATION HOTFIX TEST');
    console.log('=============================================');
    
    // Test cases
    const testCases = [
        {
            name: "Hotfix Case 1: Jul 12-16",
            start: "2025-07-12",
            end: "2025-07-16",
            expectedRentalDays: 4,
            expectedDiscountedDays: 3,
            description: "Should be 4 rental days due to hotfix"
        },
        {
            name: "Hotfix Case 2: Jul 17-21",
            start: "2025-07-17",
            end: "2025-07-21",
            expectedRentalDays: 3,
            expectedDiscountedDays: 2,
            description: "Should be 3 rental days due to hotfix"
        }
    ];
    
    // Run tests for both calculation methods
    testCases.forEach(test => {
        console.log(`\nTest: ${test.name}`);
        console.log('--------------------------');
        
        // Test DOM-based calculation
        const domResult = calculateRentalDaysFromCalendar(test.start, test.end);
        const domDaysCorrect = domResult.rentalDays === test.expectedRentalDays;
        console.log(`DOM Calculation: ${domDaysCorrect ? '✅' : '❌'} - ${domResult.rentalDays} rental days (Expected: ${test.expectedRentalDays})`);
        
        // Test Date-based calculation
        const dateResult = calculateRentalChargeDays(
            new Date(test.start), 
            new Date(test.end)
        );
        const dateDaysCorrect = dateResult.chargeDays === test.expectedRentalDays;
        console.log(`Date Calculation: ${dateDaysCorrect ? '✅' : '❌'} - ${dateResult.chargeDays} rental days (Expected: ${test.expectedRentalDays})`);
        
        // Check price breakdown
        if (domResult.breakdown) {
            console.log('\nBreakdown:');
            domResult.breakdown.forEach(item => {
                console.log(`- ${item.label}: ${item.amount}₪`);
            });
            
            // Verify total
            const basePrice = 700;
            const discountedPrice = 350;
            const expectedTotal = basePrice + (test.expectedDiscountedDays * discountedPrice);
            const totalCorrect = Math.abs(domResult.total - expectedTotal) < 1; // Allow for tiny float precision
            console.log(`\nTotal Price: ${totalCorrect ? '✅' : '❌'} - ${domResult.total}₪ (Expected: ${expectedTotal}₪)`);
        }
        
        // Overall test result
        const testPassed = domDaysCorrect && dateDaysCorrect;
        console.log(`\nOverall Result: ${testPassed ? '✅ PASSED' : '❌ FAILED'}`);
    });
    
    console.log('\n=============================================');
    console.log('TEST COMPLETE');
    console.log('=============================================');
})();
