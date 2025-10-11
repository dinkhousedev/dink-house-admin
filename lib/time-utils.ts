/**
 * Time utility functions for consistent CST (America/Chicago) timezone handling
 * All times in the system are stored and displayed in CST with 24-hour format
 */

const CST_TIMEZONE = "America/Chicago";

/**
 * Converts a Date object to CST ISO string format
 * @param date - Date object to convert
 * @returns ISO string in CST timezone (e.g., "2025-10-10T14:30:00.000-05:00")
 */
export function toCSTString(date: Date): string {
  // Format to CST timezone ISO string
  const cstDate = new Date(
    date.toLocaleString("en-US", { timeZone: CST_TIMEZONE }),
  );

  // Get components in CST
  const year = cstDate.getFullYear();
  const month = String(cstDate.getMonth() + 1).padStart(2, "0");
  const day = String(cstDate.getDate()).padStart(2, "0");
  const hours = String(cstDate.getHours()).padStart(2, "0");
  const minutes = String(cstDate.getMinutes()).padStart(2, "0");
  const seconds = String(cstDate.getSeconds()).padStart(2, "0");

  // Return ISO format (database will store this correctly)
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Parses a date string as CST timezone
 * @param dateString - Date string in various formats
 * @returns Date object interpreted in CST
 */
export function parseCSTDate(dateString: string): Date {
  // If it's already an ISO string with timezone, convert to CST
  const date = new Date(dateString);

  // Create a date in CST timezone
  const cstDate = new Date(
    date.toLocaleString("en-US", { timeZone: CST_TIMEZONE }),
  );

  return cstDate;
}

/**
 * Formats a Date object as 24-hour time in CST (HH:mm format)
 * @param date - Date object or ISO string
 * @returns Time string in 24-hour format (e.g., "14:30")
 */
export function formatCSTTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return dateObj.toLocaleString("en-US", {
    timeZone: CST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Formats a Date object as full datetime in CST with 24-hour format
 * @param date - Date object or ISO string
 * @returns Datetime string (e.g., "2025-10-10 14:30")
 */
export function formatCSTDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const dateStr = dateObj.toLocaleString("en-US", {
    timeZone: CST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const timeStr = formatCSTTime(dateObj);

  // Convert MM/DD/YYYY to YYYY-MM-DD
  const [month, day, year] = dateStr.split("/");

  return `${year}-${month}-${day} ${timeStr}`;
}

/**
 * Formats a Date object as date only in CST (YYYY-MM-DD format)
 * @param date - Date object or ISO string
 * @returns Date string (e.g., "2025-10-10")
 */
export function formatCSTDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const dateStr = dateObj.toLocaleString("en-US", {
    timeZone: CST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // Convert MM/DD/YYYY to YYYY-MM-DD
  const [month, day, year] = dateStr.split("/");

  return `${year}-${month}-${day}`;
}

/**
 * Creates a Date object from date and time components in CST
 * @param dateStr - Date string (YYYY-MM-DD)
 * @param timeStr - Time string (HH:mm or HH:mm:ss)
 * @returns Date object in CST timezone
 */
export function createCSTDate(dateStr: string, timeStr: string): Date {
  // Combine date and time
  const datetimeStr = `${dateStr}T${timeStr}`;

  // Create date assuming it's in CST
  const date = new Date(datetimeStr);

  // Adjust for CST timezone offset
  const cstOffset = getCSTOffset(date);
  const adjustedDate = new Date(date.getTime() - cstOffset);

  return adjustedDate;
}

/**
 * Gets the CST timezone offset in milliseconds for a given date
 * Accounts for Daylight Saving Time (CDT vs CST)
 */
function getCSTOffset(date: Date): number {
  // Get the offset for CST timezone
  const cstDate = new Date(
    date.toLocaleString("en-US", { timeZone: CST_TIMEZONE }),
  );
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));

  return utcDate.getTime() - cstDate.getTime();
}

/**
 * Converts local browser time to CST
 * @param localDate - Date in user's local timezone
 * @returns Date object converted to CST
 */
export function localToCSTDate(localDate: Date): Date {
  return new Date(
    localDate.toLocaleString("en-US", { timeZone: CST_TIMEZONE }),
  );
}

/**
 * Gets current time in CST
 * @returns Current Date object in CST
 */
export function nowInCST(): Date {
  return localToCSTDate(new Date());
}

/**
 * Formats duration in hours and minutes
 * @param startTime - Start time (Date or ISO string)
 * @param endTime - End time (Date or ISO string)
 * @returns Duration string (e.g., "2h 30m")
 */
export function formatDuration(
  startTime: Date | string,
  endTime: Date | string,
): string {
  const start = typeof startTime === "string" ? new Date(startTime) : startTime;
  const end = typeof endTime === "string" ? new Date(endTime) : endTime;

  const durationMs = end.getTime() - start.getTime();
  const durationMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Validates if a time string is in 24-hour format (HH:mm)
 * @param timeStr - Time string to validate
 * @returns True if valid 24-hour format
 */
export function isValid24HourTime(timeStr: string): boolean {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  return regex.test(timeStr);
}

/**
 * Converts @internationalized/date values to CST Date
 * @param dateValue - DateValue from @internationalized/date
 * @param timeValue - TimeValue from @internationalized/date (optional)
 * @returns Date object in CST
 */
export function internationalizedToCST(dateValue: any, timeValue?: any): Date {
  const year = dateValue.year;
  const month = String(dateValue.month).padStart(2, "0");
  const day = String(dateValue.day).padStart(2, "0");

  let hours = "00";
  let minutes = "00";

  if (timeValue) {
    hours = String(timeValue.hour).padStart(2, "0");
    minutes = String(timeValue.minute).padStart(2, "0");
  }

  // Create ISO string in CST
  const isoStr = `${year}-${month}-${day}T${hours}:${minutes}:00`;

  return createCSTDate(`${year}-${month}-${day}`, `${hours}:${minutes}:00`);
}

/**
 * Gets CST timezone abbreviation for display
 * @param date - Date to check (for DST)
 * @returns "CST" or "CDT" depending on Daylight Saving Time
 */
export function getCSTAbbreviation(date: Date = new Date()): string {
  const cstDate = new Date(
    date.toLocaleString("en-US", { timeZone: CST_TIMEZONE }),
  );

  // Check if in Daylight Saving Time
  const january = new Date(cstDate.getFullYear(), 0, 1);
  const july = new Date(cstDate.getFullYear(), 6, 1);

  const stdOffset = Math.max(
    january.getTimezoneOffset(),
    july.getTimezoneOffset(),
  );
  const isDST = cstDate.getTimezoneOffset() < stdOffset;

  return isDST ? "CDT" : "CST";
}
