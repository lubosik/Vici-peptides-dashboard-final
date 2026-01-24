/**
 * Parsing utility functions for CSV data
 * Matches formulas defined in docs/calculations.md
 */

/**
 * Parses currency strings to numeric values
 * Input formats: "$195.00", "$4,872.00", "$0.00", empty string
 * @param str Currency string
 * @returns Numeric value (0 if empty/invalid)
 */
export function parseMoney(str: string | null | undefined): number {
  if (!str || str.trim() === '') return 0;
  const cleaned = str.replace(/[$,]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parses percentage strings to numeric values (as decimal, not percentage points)
 * Input formats: "622.2%", "10.0%", "89.9%", empty string
 * @param str Percentage string
 * @returns Numeric value (0 if empty/invalid)
 */
export function parsePercent(str: string | null | undefined): number {
  if (!str || str.trim() === '') return 0;
  const cleaned = str.replace(/%/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parses "Yes"/"No" strings to boolean
 * Input formats: "Yes" → true, "No" → false, empty → false
 * @param str Yes/No string
 * @returns Boolean value (default false)
 */
export function parseBoolean(str: string | null | undefined): boolean {
  if (!str) return false;
  return str.toLowerCase().trim() === 'yes';
}

/**
 * Parses date strings to Date objects
 * Handles formats: "2026-01-16", "2026-01-20 2:15 AM"
 * @param str Date string
 * @returns Date object or null if invalid
 */
export function parseDate(str: string | null | undefined): Date | null {
  if (!str || str.trim() === '') return null;
  
  // Try ISO format first (2026-01-16)
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const date = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00Z`);
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try datetime format (2026-01-20 2:15 AM)
  const datetimeMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/i);
  if (datetimeMatch) {
    let hours = parseInt(datetimeMatch[4], 10);
    const minutes = parseInt(datetimeMatch[5], 10);
    const ampm = datetimeMatch[6].toUpperCase();
    
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    const date = new Date(
      Date.UTC(
        parseInt(datetimeMatch[1], 10),
        parseInt(datetimeMatch[2], 10) - 1,
        parseInt(datetimeMatch[3], 10),
        hours,
        minutes
      )
    );
    if (!isNaN(date.getTime())) return date;
  }
  
  // Fallback: try Date constructor
  const date = new Date(str);
  if (!isNaN(date.getTime())) return date;
  
  return null;
}

/**
 * Parses integer strings to numbers
 * @param str Integer string
 * @returns Integer value (0 if empty/invalid)
 */
export function parseIntSafe(str: string | null | undefined): number {
  if (!str || str.trim() === '') return 0;
  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Normalizes order status to lowercase
 * @param str Order status string
 * @returns Normalized status (lowercase) or original if empty
 */
export function normalizeOrderStatus(str: string | null | undefined): string {
  if (!str || str.trim() === '') return 'pending';
  return str.toLowerCase().trim();
}

/**
 * Normalizes order number format
 * Handles: "Order #1281", "Order 1704" → "Order #1281"
 * @param str Order number string
 * @returns Normalized order number
 */
export function normalizeOrderNumber(str: string | null | undefined): string | null {
  if (!str || str.trim() === '') return null;
  const cleaned = str.trim();
  // Ensure consistent format: "Order #XXXX" or "Order XXXX"
  if (cleaned.startsWith('Order #')) return cleaned;
  if (cleaned.startsWith('Order ')) return cleaned.replace('Order ', 'Order #');
  return cleaned;
}
