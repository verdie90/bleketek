/**
 * Working Schedule Utilities
 * Handles working hours and working days validation for telemarketing calls
 */

import { PhoneSettings } from "@/hooks/use-telemarketing-settings";

export interface WorkingScheduleCheck {
  isWorkingTime: boolean;
  reason?: string;
  nextWorkingTime?: Date;
  currentTime: Date;
  serverTime: string;
}

/**
 * Check if current server time is within working schedule
 */
export function checkWorkingSchedule(phoneSettings: PhoneSettings | null): WorkingScheduleCheck {
  const currentTime = new Date();
  const serverTimeString = currentTime.toISOString();
  
  if (!phoneSettings) {
    return {
      isWorkingTime: false,
      reason: "Phone settings not available",
      currentTime,
      serverTime: serverTimeString
    };
  }

  const { workingHours, workingDays } = phoneSettings;

  // Check working days (0 = Sunday, 1 = Monday, etc.)
  const currentDay = currentTime.getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = dayNames[currentDay];

  if (!workingDays.includes(currentDayName)) {
    return {
      isWorkingTime: false,
      reason: `Today is ${currentDayName}, which is not in working days: ${workingDays.join(', ')}`,
      nextWorkingTime: getNextWorkingDay(currentTime, workingDays, workingHours),
      currentTime,
      serverTime: serverTimeString
    };
  }

  // Check working hours
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  // Parse start and end times (format: "HH:MM")
  const [startHour, startMinute] = workingHours.start.split(':').map(Number);
  const [endHour, endMinute] = workingHours.end.split(':').map(Number);
  
  const startTimeMinutes = startHour * 60 + startMinute;
  const endTimeMinutes = endHour * 60 + endMinute;

  // Handle overnight shifts (e.g., 22:00 to 06:00)
  let isWithinHours = false;
  if (startTimeMinutes <= endTimeMinutes) {
    // Normal shift (e.g., 09:00 to 17:00)
    isWithinHours = currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
  } else {
    // Overnight shift (e.g., 22:00 to 06:00)
    isWithinHours = currentTimeMinutes >= startTimeMinutes || currentTimeMinutes <= endTimeMinutes;
  }

  if (!isWithinHours) {
    return {
      isWorkingTime: false,
      reason: `Current time ${workingHours.start.padStart(5, '0')} is outside working hours: ${workingHours.start} - ${workingHours.end} ${workingHours.timezone || 'Server Time'}`,
      nextWorkingTime: getNextWorkingTime(currentTime, workingDays, workingHours),
      currentTime,
      serverTime: serverTimeString
    };
  }

  return {
    isWorkingTime: true,
    currentTime,
    serverTime: serverTimeString
  };
}

/**
 * Get next working time
 */
function getNextWorkingTime(currentTime: Date, workingDays: string[], workingHours: { start: string; end: string }): Date {
  const nextTime = new Date(currentTime);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Try today first, then next days
  for (let i = 0; i < 7; i++) {
    const checkTime = new Date(nextTime);
    checkTime.setDate(nextTime.getDate() + i);
    
    const dayName = dayNames[checkTime.getDay()];
    
    if (workingDays.includes(dayName)) {
      const [startHour, startMinute] = workingHours.start.split(':').map(Number);
      checkTime.setHours(startHour, startMinute, 0, 0);
      
      // If it's today, make sure it's in the future
      if (i === 0 && checkTime <= currentTime) {
        continue;
      }
      
      return checkTime;
    }
  }
  
  // Fallback: next Monday at start time
  const nextMonday = new Date(nextTime);
  nextMonday.setDate(nextTime.getDate() + (1 + 7 - nextTime.getDay()) % 7);
  const [startHour, startMinute] = workingHours.start.split(':').map(Number);
  nextMonday.setHours(startHour, startMinute, 0, 0);
  
  return nextMonday;
}

/**
 * Get next working day
 */
function getNextWorkingDay(currentTime: Date, workingDays: string[], workingHours: { start: string; end: string }): Date {
  const nextTime = new Date(currentTime);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Find next working day
  for (let i = 1; i <= 7; i++) {
    const checkTime = new Date(nextTime);
    checkTime.setDate(nextTime.getDate() + i);
    
    const dayName = dayNames[checkTime.getDay()];
    
    if (workingDays.includes(dayName)) {
      const [startHour, startMinute] = workingHours.start.split(':').map(Number);
      checkTime.setHours(startHour, startMinute, 0, 0);
      return checkTime;
    }
  }
  
  // Fallback: next Monday
  const nextMonday = new Date(nextTime);
  nextMonday.setDate(nextTime.getDate() + (1 + 7 - nextTime.getDay()) % 7);
  const [startHour, startMinute] = workingHours.start.split(':').map(Number);
  nextMonday.setHours(startHour, startMinute, 0, 0);
  
  return nextMonday;
}

/**
 * Format time remaining until next working time
 */
export function formatTimeUntilWorking(nextWorkingTime: Date): string {
  const now = new Date();
  const diffMs = nextWorkingTime.getTime() - now.getTime();
  
  if (diffMs <= 0) return "Now";
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days} day(s), ${hours} hour(s)`;
  } else if (hours > 0) {
    return `${hours} hour(s), ${minutes} minute(s)`;
  } else {
    return `${minutes} minute(s)`;
  }
}

/**
 * Get working schedule summary for display
 */
export function getWorkingScheduleSummary(phoneSettings: PhoneSettings | null): string {
  if (!phoneSettings) return "Working schedule not configured";
  
  const { workingHours, workingDays } = phoneSettings;
  const timezone = workingHours.timezone || "Server Time";
  
  return `${workingDays.join(', ')} • ${workingHours.start} - ${workingHours.end} (${timezone})`;
}
