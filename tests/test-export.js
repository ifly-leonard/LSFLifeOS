// Test script to generate ICS files and verify date calculations
const fs = require('fs');

// Simulate the export function
function generateTestICS(selectedDays, currentDate) {
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DietOS//NONSGML v1.0//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const now = currentDate;
  const exportTimestamp = now.toISOString();
  const dtstamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  
  // Get current date in browser's local timezone
  const currentDay = now.getDay();
  console.log(`Current day: ${currentDay} (${allDays[currentDay === 0 ? 6 : currentDay - 1]})`);
  
  // Calculate Monday of current week
  const daysToMonday = currentDay === 0 ? 1 : currentDay === 1 ? 0 : -(currentDay - 1);
  console.log(`Days to Monday: ${daysToMonday}`);
  
  const weekMonday = new Date(now);
  weekMonday.setDate(now.getDate() + daysToMonday);
  weekMonday.setHours(0, 0, 0, 0);
  console.log(`Week Monday: ${weekMonday.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
  
  // Mock plan data
  const mockPlan = {
    breakfast: "D1",
    lunch: "D2",
    snack: "D3",
    dinner: "D4"
  };
  
  const mealTimes = {
    breakfast: "08:00",
    lunch: "13:00",
    snack: "16:00",
    dinner: "20:00"
  };

  selectedDays.forEach((day) => {
    const dayIndex = allDays.indexOf(day);
    if (dayIndex === -1) {
      console.error(`Invalid day: ${day}`);
      return;
    }

    console.log(`\n=== Processing ${day} (index ${dayIndex}) ===`);
    
    // Calculate target date
    const targetDate = new Date(weekMonday);
    targetDate.setDate(weekMonday.getDate() + dayIndex);
    targetDate.setHours(0, 0, 0, 0);
    
    console.log(`Target date: ${targetDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
    console.log(`Target date day of week: ${targetDate.getDay()}`);
    
    // Store immutable components
    const targetYearValue = targetDate.getFullYear();
    const targetMonthValue = targetDate.getMonth();
    const targetDateValue = targetDate.getDate();
    
    console.log(`Stored components: Year=${targetYearValue}, Month=${targetMonthValue + 1}, Date=${targetDateValue}`);

    // Process each meal
    Object.entries(mockPlan).forEach(([mealType, dishId], index) => {
      const [hours, minutes] = mealTimes[mealType].split(":").map(Number);
      
      console.log(`\n  Meal ${index + 1}: ${mealType} at ${hours}:${minutes}`);
      console.log(`    Using components: Year=${targetYearValue}, Month=${targetMonthValue + 1}, Date=${targetDateValue}`);
      
      // Create event date
      const eventDate = new Date(targetYearValue, targetMonthValue, targetDateValue, hours, minutes, 0, 0);
      console.log(`    Created date: ${eventDate.toLocaleString()}`);
      console.log(`    Date components after creation: Year=${eventDate.getFullYear()}, Month=${eventDate.getMonth() + 1}, Date=${eventDate.getDate()}`);
      
      const utcDateStr = eventDate.toISOString();
      const start = utcDateStr.replace(/[-:]/g, "").split(".")[0] + "Z";
      const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000);
      const end = endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      
      console.log(`    ICS: DTSTART=${start}, DTEND=${end}`);
      
      // Verify date is correct
      const datePart = start.substring(0, 8);
      const expectedDate = `${targetYearValue}${String(targetMonthValue + 1).padStart(2, '0')}${String(targetDateValue).padStart(2, '0')}`;
      if (datePart !== expectedDate) {
        console.error(`    ❌ DATE MISMATCH! Expected ${expectedDate}, got ${datePart}`);
      } else {
        console.log(`    ✅ Date correct: ${datePart}`);
      }

      icsContent.push("BEGIN:VEVENT");
      icsContent.push(`UID:test-${day.toLowerCase()}-${mealType}-${Date.now()}-${index}`);
      icsContent.push(`DTSTAMP:${dtstamp}`);
      icsContent.push(`SUMMARY:[${mealType.toUpperCase()}] Test Meal`);
      icsContent.push(`DTSTART:${start}`);
      icsContent.push(`DTEND:${end}`);
      icsContent.push(`DESCRIPTION:Test meal for ${day}`);
      icsContent.push("END:VEVENT");
    });
  });

  icsContent.push("END:VCALENDAR");
  return icsContent.join("\r\n");
}

// Test scenarios
console.log("=== Test 1: Tuesday export (Jan 4, 2026 is Sunday) ===\n");
const testDate1 = new Date('2026-01-04T01:37:13');
const ics1 = generateTestICS(['Tuesday'], testDate1);
fs.writeFileSync(__dirname + '/test-tuesday.ics', ics1);
console.log('\n✅ Generated tests/test-tuesday.ics');

console.log("\n\n=== Test 2: Monday export ===\n");
const ics2 = generateTestICS(['Monday'], testDate1);
fs.writeFileSync(__dirname + '/test-monday.ics', ics2);
console.log('\n✅ Generated tests/test-monday.ics');

console.log("\n\n=== Test 3: Both Monday and Tuesday ===\n");
const ics3 = generateTestICS(['Monday', 'Tuesday'], testDate1);
fs.writeFileSync(__dirname + '/test-both.ics', ics3);
console.log('\n✅ Generated tests/test-both.ics');

