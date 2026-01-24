import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - List expenses
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const supabase = await createClient()

    const category = searchParams.get('category')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    let query = supabase.from('expenses').select('*')

    if (category) {
      query = query.eq('category', category)
    }
    if (dateFrom) {
      query = query.gte('expense_date', dateFrom)
    }
    if (dateTo) {
      query = query.lte('expense_date', dateTo)
    }

    const { data, error } = await query.order('expense_date', { ascending: false })

    if (error) throw error

    return NextResponse.json({ expenses: data })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

// POST - Create expense
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        expense_date: body.expense_date,
        category: body.category,
        description: body.description,
        vendor: body.vendor || null,
        amount: body.amount,
        notes: body.notes || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ expense: data })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}

// PUT - Update expense
export async function PUT(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('expenses')
      .update({
        expense_date: body.expense_date,
        category: body.category,
        description: body.description,
        vendor: body.vendor || null,
        amount: body.amount,
        notes: body.notes || null,
      })
      .eq('expense_id', body.expense_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ expense: data })
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    )
  }
}

// DELETE - Delete expense
export async function DELETE(request: Request) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const expenseId = searchParams.get('id')

    if (!expenseId) {
      return NextResponse.json(
        { error: 'Expense ID required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('expense_id', expenseId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    )
  }
}
