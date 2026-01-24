-- Migration: Create expenses table
-- Description: Business operating expenses
-- Source: Expenses.csv

CREATE TABLE IF NOT EXISTS expenses (
  expense_id BIGSERIAL PRIMARY KEY,
  expense_date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  vendor TEXT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for expenses table
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor);

-- Comments
COMMENT ON TABLE expenses IS 'Business operating expenses that reduce net profit';
COMMENT ON COLUMN expenses.category IS 'Expense category (must match Lists.Expense_Categories)';
COMMENT ON COLUMN expenses.amount IS 'Expense amount (parsed from "$X,XXX.XX" format)';
