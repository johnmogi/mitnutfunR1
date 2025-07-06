/**
 * DOM-Based Rental Calculation
 * Uses the calendar's visual representation as the source of truth
 */

/**
 * Get selected rental metadata directly from the calendar DOM
 * @return {Object} Metadata for selected dates
 */
function getSelectedRentalMetadata() {
  // Select all cells that are either selected or in the range
  const selectedCells = document.querySelectorAll('.air-datepicker-cell.-day-.-selected-, .air-datepicker-cell.-day-.-in-range-');
  
  // Map the DOM cells to date objects with weekend flag
  const selectedDates = Array.from(selectedCells).map(cell => {
    const year = cell.dataset.year;
    const month = String(Number(cell.dataset.month) + 1).padStart(2, '0');
    const day = String(cell.dataset.date).padStart(2, '0');
    
    // Check for BOTH possible weekend classes
    const isWeekend = cell.classList.contains('-weekend-') || 
                      cell.classList.contains('air-datepicker-cell--weekend');

    // Log each detected cell for debugging
    // console.log(`Calendar Cell: ${year}-${month}-${day}, Weekend: ${isWeekend}`, cell.className);

    return {
      date: `${year}-${month}-${day}`,
      isWeekend,
      // Store the DOM element for debugging/reference
      element: cell
    };
  });
  
  // Sort dates to ensure they're in chronological order
  selectedDates.sort((a, b) => a.date.localeCompare(b.date));
  
  // Mark the first day
  if (selectedDates.length > 0) {
    selectedDates[0].isFirst = true;
  }
  
  // Return useful metadata for calculations
  return {
    dates: selectedDates,
    startDate: selectedDates.length > 0 ? selectedDates[0].date : null,
    endDate: selectedDates.length > 0 ? selectedDates[selectedDates.length - 1].date : null,
    count: selectedDates.length
  };
}

/**
 * Calculate rental days and pricing using DOM-based weekend detection
 * @return {Object} Calculation results
 */
function calculateRentalDaysFromDOM() {
  // Get metadata for selected dates
  const metadata = getSelectedRentalMetadata();
  const selectedDates = metadata.dates;
  
  // Exit if no dates selected
  if (selectedDates.length === 0) {
    console.error("No dates selected in the calendar");
    return { 
      rentalDays: 0, 
      total: 0, 
      breakdown: [] 
    };
  }
  
  // Base price for rental
  const basePrice = 700;
  
  // Initialize counters
  const firstDay = selectedDates[0];
  const restDays = selectedDates.slice(1);
  let weekdayCount = 0;
  let weekendFound = false;
  
  // Log the selected dates
  // console.log("=== DOM-BASED RENTAL CALCULATION ===");
  // console.log(`Date Range: ${metadata.startDate} to ${metadata.endDate}`);
  // console.log("Selected dates:", selectedDates.map(d => 
    `${d.date}${d.isFirst ? ' (first)' : ''}: ${d.isWeekend ? 'WEEKEND' : 'WEEKDAY'}`
  ));
  
  // Count weekdays and check for weekend days
  restDays.forEach(day => {
    if (day.isWeekend) {
      weekendFound = true;
      // console.log(`${day.date}: Weekend day detected`);
    } else {
      weekdayCount++;
      // console.log(`${day.date}: Weekday detected`);
    }
  });
  
  // Calculate weekday blocks (every 2 weekdays = 1 rental day)
  const weekdayBlocks = Math.floor(weekdayCount / 2);
  // console.log(`Weekday count: ${weekdayCount}, Weekday blocks: ${weekdayBlocks}`);
  // console.log(`Weekend found: ${weekendFound}`);
  
  // Calculate total rental days
  // 1 for first day + weekday blocks + 1 if weekend included
  const rentalDays = 1 + weekdayBlocks + (weekendFound ? 1 : 0);
  
  // Calculate price
  const discountedDays = rentalDays - 1;
  const firstDayPrice = basePrice;
  const discountedPrice = discountedDays > 0 ? discountedDays * (basePrice / 2) : 0;
  const total = firstDayPrice + discountedPrice;
  
  // Create a price breakdown
  const breakdown = [
    {
      label: `יום ראשון (100%)`,
      amount: firstDayPrice
    }
  ];
  
  if (discountedDays > 0) {
    breakdown.push({
      label: `ימים נוספים (${discountedDays} × 50%)`,
      amount: discountedPrice
    });
    
    breakdown.push({
      label: `חסכת`,
      amount: `${discountedDays * (basePrice / 2)}₪ (50%)`
    });
  }
  
  // Return calculation results
  return {
    rentalDays,
    discountedDays,
    total,
    breakdown,
    debug: {
      weekdayCount,
      weekdayBlocks,
      weekendFound,
      selectedDates
    }
  };
}

// Make functions available globally
window.getSelectedRentalMetadata = getSelectedRentalMetadata;
window.calculateRentalDaysFromDOM = calculateRentalDaysFromDOM;
