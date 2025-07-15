/**
 * Working Schedule Test Utilities
 */

import { PhoneSettings } from "@/hooks/use-telemarketing-settings";
import { checkWorkingSchedule } from "./working-schedule";

/**
 * Test simple scenarios untuk debugging
 */
export function testCurrentWorkingSchedule(phoneSettings: PhoneSettings | null) {
  if (!phoneSettings) {
    console.log("❌ Phone settings not available");
    return null;
  }

  const result = checkWorkingSchedule(phoneSettings);
  const now = new Date();
  
  console.log("🧪 Working Schedule Test:");
  console.log("📅 Current Time:", now.toLocaleString());
  console.log("📅 Current Day:", now.toLocaleDateString('en-US', { weekday: 'long' }));
  console.log("⏰ Current Hour:", now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0'));
  console.log("⚙️ Working Hours:", phoneSettings.workingHours.start + ' - ' + phoneSettings.workingHours.end);
  console.log("📅 Working Days:", phoneSettings.workingDays.join(', '));
  console.log("✅ Is Working Time:", result.isWorkingTime);
  console.log("📝 Reason:", result.reason);
  
  if (result.nextWorkingTime) {
    console.log("⏭️ Next Working Time:", result.nextWorkingTime.toLocaleString());
  }
  
  return result;
}

/**
 * Debug working schedule dengan info lengkap
 */
export function debugWorkingSchedule(phoneSettings: PhoneSettings | null) {
  console.log("🔍 Debug Working Schedule");
  
  if (!phoneSettings) {
    console.log("❌ No phone settings available");
    return;
  }

  const now = new Date();
  const result = checkWorkingSchedule(phoneSettings);
  
  console.table({
    "Current Time": now.toLocaleString(),
    "Current Day": now.toLocaleDateString('en-US', { weekday: 'long' }),
    "Working Hours": `${phoneSettings.workingHours.start} - ${phoneSettings.workingHours.end}`,
    "Working Days": phoneSettings.workingDays.join(', '),
    "Is Working Time": result.isWorkingTime ? "✅ YES" : "❌ NO",
    "Reason": result.reason,
    "Next Working Time": result.nextWorkingTime?.toLocaleString() || "N/A",
  });
  
  return result;
}
