# Deployment Guide

## Vercel Deployment

### Prerequisites
1. GitHub repository set up (already done)
2. Vercel account
3. Supabase project with all migrations applied

### Steps

1. **Import Project to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import from GitHub: `lubosik/Vici-Peptides-Dashboard`
   - Vercel will auto-detect Next.js

2. **Configure Environment Variables:**
   Add these in Vercel dashboard under Project Settings > Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SECRET_KEY=your_supabase_service_role_key
   WOOCOMMERCE_STORE_URL=your_woocommerce_store_url
   WOOCOMMERCE_CONSUMER_KEY=your_consumer_key
   WOOCOMMERCE_CONSUMER_SECRET=your_consumer_secret
   ```

3. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Your dashboard will be live at `your-project.vercel.app`

4. **Post-Deployment:**
   - Update Make.com webhook URL to point to your Vercel deployment
   - Test the sync functionality
   - Verify all pages load correctly

## Environment Variables Reference

### Required for Local Development:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` (for scripts only)

### Required for Production (Vercel):
- All of the above, plus:
- `WOOCOMMERCE_STORE_URL`
- `WOOCOMMERCE_CONSUMER_KEY`
- `WOOCOMMERCE_CONSUMER_SECRET`

## Troubleshooting

### Build Errors
- Ensure all dependencies are in `package.json`
- Check that all TypeScript errors are resolved
- Verify environment variables are set correctly

### Runtime Errors
- Check Supabase connection (use `/api/healthcheck`)
- Verify RLS policies allow reads
- Check browser console for client-side errors

### Sync Issues
- Verify WooCommerce API credentials
- Check Supabase Edge Function is deployed
- Review sync logs in Settings page
