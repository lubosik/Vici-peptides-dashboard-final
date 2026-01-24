/**
 * Unit tests for parsing functions
 */

import { describe, it, expect } from 'vitest';
import {
  parseMoney,
  parsePercent,
  parseBoolean,
  parseDate,
  parseIntSafe,
  normalizeOrderStatus,
  normalizeOrderNumber,
} from '../scripts/utils/parsers.js';

describe('parseMoney', () => {
  it('should parse currency strings with dollar sign', () => {
    expect(parseMoney('$195.00')).toBe(195.0);
    expect(parseMoney('$4,872.00')).toBe(4872.0);
    expect(parseMoney('$0.00')).toBe(0.0);
  });

  it('should handle empty strings', () => {
    expect(parseMoney('')).toBe(0);
    expect(parseMoney('   ')).toBe(0);
    expect(parseMoney(null)).toBe(0);
    expect(parseMoney(undefined)).toBe(0);
  });

  it('should handle invalid input', () => {
    expect(parseMoney('invalid')).toBe(0);
    expect(parseMoney('abc')).toBe(0);
  });

  it('should handle decimal values', () => {
    expect(parseMoney('$27.50')).toBe(27.5);
    expect(parseMoney('$1,234.56')).toBe(1234.56);
  });
});

describe('parsePercent', () => {
  it('should parse percentage strings', () => {
    expect(parsePercent('622.2%')).toBe(622.2);
    expect(parsePercent('10.0%')).toBe(10.0);
    expect(parsePercent('89.9%')).toBe(89.9);
  });

  it('should handle empty strings', () => {
    expect(parsePercent('')).toBe(0);
    expect(parsePercent('   ')).toBe(0);
    expect(parsePercent(null)).toBe(0);
    expect(parsePercent(undefined)).toBe(0);
  });

  it('should handle invalid input', () => {
    expect(parsePercent('invalid')).toBe(0);
    expect(parsePercent('abc%')).toBe(0);
  });

  it('should handle decimal percentages', () => {
    expect(parsePercent('50.5%')).toBe(50.5);
    expect(parsePercent('100%')).toBe(100);
  });
});

describe('parseBoolean', () => {
  it('should parse "Yes" as true', () => {
    expect(parseBoolean('Yes')).toBe(true);
    expect(parseBoolean('yes')).toBe(true);
    expect(parseBoolean('YES')).toBe(true);
    expect(parseBoolean('  yes  ')).toBe(true);
  });

  it('should parse "No" and other values as false', () => {
    expect(parseBoolean('No')).toBe(false);
    expect(parseBoolean('no')).toBe(false);
    expect(parseBoolean('maybe')).toBe(false);
  });

  it('should handle empty strings', () => {
    expect(parseBoolean('')).toBe(false);
    expect(parseBoolean('   ')).toBe(false);
    expect(parseBoolean(null)).toBe(false);
    expect(parseBoolean(undefined)).toBe(false);
  });
});

describe('parseDate', () => {
  it('should parse ISO date format', () => {
    const date = parseDate('2026-01-16');
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(0); // January (0-indexed)
    expect(date?.getDate()).toBe(16);
  });

  it('should parse datetime format', () => {
    const date = parseDate('2026-01-20 2:15 AM');
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(0);
    expect(date?.getDate()).toBe(20);
    expect(date?.getHours()).toBe(2);
    expect(date?.getMinutes()).toBe(15);
  });

  it('should handle PM times', () => {
    const date = parseDate('2026-01-20 2:15 PM');
    expect(date).not.toBeNull();
    expect(date?.getHours()).toBe(14); // 2 PM = 14:00
  });

  it('should handle empty strings', () => {
    expect(parseDate('')).toBeNull();
    expect(parseDate('   ')).toBeNull();
    expect(parseDate(null)).toBeNull();
    expect(parseDate(undefined)).toBeNull();
  });

  it('should handle invalid dates', () => {
    expect(parseDate('invalid')).toBeNull();
    expect(parseDate('not-a-date')).toBeNull();
  });
});

describe('parseIntSafe', () => {
  it('should parse integer strings', () => {
    expect(parseIntSafe('123')).toBe(123);
    expect(parseIntSafe('0')).toBe(0);
    expect(parseIntSafe('999')).toBe(999);
  });

  it('should handle empty strings', () => {
    expect(parseIntSafe('')).toBe(0);
    expect(parseIntSafe('   ')).toBe(0);
    expect(parseIntSafe(null)).toBe(0);
    expect(parseIntSafe(undefined)).toBe(0);
  });

  it('should handle invalid input', () => {
    expect(parseIntSafe('invalid')).toBe(0);
    expect(parseIntSafe('abc')).toBe(0);
  });

  it('should truncate decimal values', () => {
    expect(parseIntSafe('123.45')).toBe(123);
    expect(parseIntSafe('99.99')).toBe(99);
  });
});

describe('normalizeOrderStatus', () => {
  it('should convert to lowercase', () => {
    expect(normalizeOrderStatus('Completed')).toBe('completed');
    expect(normalizeOrderStatus('PROCESSING')).toBe('processing');
    expect(normalizeOrderStatus('Cancelled')).toBe('cancelled');
  });

  it('should trim whitespace', () => {
    expect(normalizeOrderStatus('  completed  ')).toBe('completed');
  });

  it('should default to "pending" for empty strings', () => {
    expect(normalizeOrderStatus('')).toBe('pending');
    expect(normalizeOrderStatus('   ')).toBe('pending');
    expect(normalizeOrderStatus(null)).toBe('pending');
    expect(normalizeOrderStatus(undefined)).toBe('pending');
  });
});

describe('normalizeOrderNumber', () => {
  it('should preserve "Order #" format', () => {
    expect(normalizeOrderNumber('Order #1281')).toBe('Order #1281');
  });

  it('should convert "Order " to "Order #"', () => {
    expect(normalizeOrderNumber('Order 1704')).toBe('Order #1704');
  });

  it('should handle empty strings', () => {
    expect(normalizeOrderNumber('')).toBeNull();
    expect(normalizeOrderNumber('   ')).toBeNull();
    expect(normalizeOrderNumber(null)).toBeNull();
    expect(normalizeOrderNumber(undefined)).toBeNull();
  });

  it('should preserve other formats', () => {
    expect(normalizeOrderNumber('TEST-001')).toBe('TEST-001');
  });
});
