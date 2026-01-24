/**
 * Imports expenses from Expenses.csv
 */

import { readCSV, getCSVPath } from '../utils/csv-reader.js';
import { supabase } from '../utils/supabase-client.js';
import { parseDate, parseMoney } from '../utils/parsers.js';

interface ExpenseRow {
  Date?: string;
  Expense_Date?: string;
  Category: string;
  Description: string;
  Vendor: string;
  Amount: string;
  Notes: string;
}

export async function importExpenses(): Promise<{ inserted: number; updated: number; errors: number }> {
  console.log('💸 Importing expenses...');
  
  const csvPath = getCSVPath('Vici_Order_Tracker_with_Expenses_v2 - Expenses.csv');
  const rawContent = require('fs').readFileSync(csvPath, 'utf-8');
  const lines = rawContent.split('\n');
  
  // Find the actual header row (contains "Date,Category,Description")
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Date,Category,Description')) {
      headerIndex = i;
      break;
    }
  }
  
  if (headerIndex === -1) {
    console.warn('⚠️  Could not find header row in expenses CSV');
    return { inserted: 0, updated: 0, errors: 0 };
  }
  
  // Read CSV starting from the correct header row
  const csvContent = lines.slice(headerIndex).join('\n');
  const { parse } = require('csv-parse/sync');
  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as ExpenseRow[];
  
  // Skip header rows and summary rows
  const validRows = rows.filter(row => {
    const dateStr = row.Date || row.Expense_Date;
    if (!dateStr || dateStr.trim() === '' || 
        dateStr === 'Date' || 
        dateStr.toLowerCase().includes('expense') ||
        dateStr.toLowerCase().includes('summary') ||
        dateStr.toLowerCase().includes('category') ||
        dateStr === 'BUSINESS EXPENSES' ||
        dateStr.trim() === '' ||
        !row.Amount || row.Amount.trim() === '') {
      return false;
    }
    // Check if it's a valid date format (YYYY-MM-DD or other formats)
    const dateMatch = dateStr.match(/^\d{4}-\d{2}-\d{2}/);
    if (!dateMatch) {
      return false;
    }
    const date = parseDate(dateStr);
    if (!date) {
      return false;
    }
    // Also check that amount is valid
    const amount = parseMoney(row.Amount);
    return amount > 0;
  });
  
  console.log(`📊 Found ${validRows.length} valid expense rows out of ${rows.length} total rows`);
  
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  
  for (const row of validRows) {
    try {
      const dateStr = row.Date || row.Expense_Date;
      const expenseDate = parseDate(dateStr);
      if (!expenseDate) {
        console.warn(`⚠️  Skipping row with invalid date: ${row.Date}`);
        errors++;
        continue;
      }
      
      const amount = parseMoney(row.Amount);
      if (amount <= 0) {
        console.warn(`⚠️  Skipping row with invalid amount: ${row.Amount}`);
        errors++;
        continue;
      }
      
      const expense = {
        expense_date: expenseDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD
        category: row.Category?.trim() || null,
        description: row.Description?.trim() || null,
        vendor: row.Vendor?.trim() || null,
        amount: amount,
        notes: row.Notes?.trim() || null,
      };
      
      // Insert expense (no unique constraint, so always insert)
      const { error } = await supabase.from('expenses').insert(expense);
      
      if (error) {
        console.error(`❌ Error importing expense:`, error.message);
        errors++;
      } else {
        inserted++;
      }
    } catch (error) {
      console.error(`❌ Error processing expense row:`, error);
      errors++;
    }
  }
  
  console.log(`✅ Expenses import complete: ${inserted} inserted, ${errors} errors`);
  return { inserted, updated: 0, errors };
}
