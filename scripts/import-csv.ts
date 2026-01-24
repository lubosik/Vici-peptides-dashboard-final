/**
 * Main CSV importer script
 * Orchestrates import of all CSV files in the correct order
 */

import { importProducts } from './importers/import-products.js';
import { importTieredPricing } from './importers/import-tiered-pricing.js';
import { importCoupons } from './importers/import-coupons.js';
import { importOrders } from './importers/import-orders.js';
import { importExpenses } from './importers/import-expenses.js';
import { supabase } from './utils/supabase-client.js';

async function main() {
  console.log('🚀 Starting CSV import process...\n');
  
  const startTime = Date.now();
  
  try {
    // Import in dependency order:
    // 1. Products (no dependencies)
    // 2. Tiered Pricing (depends on Products)
    // 3. Coupons (no dependencies)
    // 4. Orders (depends on Products, Coupons)
    // 5. Expenses (no dependencies)
    
    console.log('Step 1/5: Importing products...');
    const productsResult = await importProducts();
    console.log('');
    
    console.log('Step 2/5: Importing tiered pricing...');
    const tieredPricingResult = await importTieredPricing();
    console.log('');
    
    console.log('Step 3/5: Importing coupons...');
    const couponsResult = await importCoupons();
    console.log('');
    
    console.log('Step 4/5: Importing orders (with normalization)...');
    const ordersResult = await importOrders();
    console.log('');
    
    console.log('Step 5/5: Importing expenses...');
    const expensesResult = await importExpenses();
    console.log('');
    
    // Summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('='.repeat(60));
    console.log('📊 Import Summary');
    console.log('='.repeat(60));
    console.log(`Products:        ${productsResult.inserted} inserted, ${productsResult.updated} updated, ${productsResult.errors} errors`);
    console.log(`Tiered Pricing:  ${tieredPricingResult.inserted} inserted, ${tieredPricingResult.updated} updated, ${tieredPricingResult.errors} errors`);
    console.log(`Coupons:         ${couponsResult.inserted} inserted, ${couponsResult.updated} updated, ${couponsResult.errors} errors`);
    console.log(`Orders:          ${ordersResult.ordersInserted} inserted, ${ordersResult.ordersUpdated} updated`);
    console.log(`Order Lines:     ${ordersResult.linesInserted} inserted`);
    console.log(`Expenses:        ${expensesResult.inserted} inserted, ${expensesResult.errors} errors`);
    console.log(`Total Errors:    ${productsResult.errors + tieredPricingResult.errors + couponsResult.errors + ordersResult.errors + expensesResult.errors}`);
    console.log(`Duration:        ${duration}s`);
    console.log('='.repeat(60));
    
    // Verify computed columns were updated
    console.log('\n🔍 Verifying computed columns...');
    
    // Check order totals
    const { data: sampleOrder, error: orderError } = await supabase
      .from('orders')
      .select('order_number, order_subtotal, order_total, order_profit')
      .limit(1)
      .single();
    
    if (!orderError && sampleOrder) {
      console.log(`✅ Sample order computed columns:`, {
        order_number: sampleOrder.order_number,
        order_subtotal: sampleOrder.order_subtotal,
        order_total: sampleOrder.order_total,
        order_profit: sampleOrder.order_profit,
      });
    }
    
    // Check product inventory
    const { data: sampleProduct, error: productError } = await supabase
      .from('products')
      .select('product_id, qty_sold, current_stock, stock_status')
      .limit(1)
      .single();
    
    if (!productError && sampleProduct) {
      console.log(`✅ Sample product computed columns:`, {
        product_id: sampleProduct.product_id,
        qty_sold: sampleProduct.qty_sold,
        current_stock: sampleProduct.current_stock,
        stock_status: sampleProduct.stock_status,
      });
    }
    
    console.log('\n✅ Import process complete!');
  } catch (error) {
    console.error('\n❌ Fatal error during import:', error);
    process.exit(1);
  }
}

main();
