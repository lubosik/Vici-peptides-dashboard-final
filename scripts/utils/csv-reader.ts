/**
 * CSV reading utilities
 */

import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface CSVRow {
  [key: string]: string;
}

/**
 * Reads and parses a CSV file
 * @param filePath Path to CSV file
 * @returns Array of row objects with column names as keys
 */
export function readCSV(filePath: string): CSVRow[] {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as CSVRow[];
    
    // Filter out completely empty rows (all values empty)
    return records.filter(row => {
      const values = Object.values(row);
      return values.some(val => val && val.trim() !== '');
    });
  } catch (error) {
    throw new Error(`Failed to read CSV file ${filePath}: ${error}`);
  }
}

/**
 * Gets the path to a CSV file in the Downloads folder
 * Checks both Downloads root and "Vici Dashboard CSVs" subfolder
 * @param filename CSV filename
 * @returns Full path to CSV file
 */
export function getCSVPath(filename: string): string {
  const downloadsPath = process.env.HOME || '/Users/ghost';
  const directPath = join(downloadsPath, 'Downloads', filename);
  const subfolderPath = join(downloadsPath, 'Downloads', 'Vici Dashboard CSVs', filename);
  
  // Check if file exists in subfolder first, then direct Downloads
  try {
    const fs = require('fs');
    if (fs.existsSync(subfolderPath)) {
      return subfolderPath;
    }
    if (fs.existsSync(directPath)) {
      return directPath;
    }
  } catch {
    // Fall through to return direct path
  }
  
  // Default to subfolder path (most likely location)
  return subfolderPath;
}
