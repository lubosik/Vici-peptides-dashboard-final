# ⚡ Quick Deploy to Vercel (2 Minutes!)

## Why Vercel?
- ✅ **FREE** forever
- ✅ Made by Next.js team (perfect compatibility)
- ✅ Zero configuration
- ✅ Your domain works
- ✅ Automatic deployments

## Step-by-Step

### Step 1: Push to GitHub (5 minutes)

If you don't have a GitHub repo yet:

1. **Create GitHub account** (if needed): [github.com](https://github.com)
2. **Create new repository:**
   - Click "New repository"
   - Name: `vici-peptides-dashboard`
   - Make it **Private** (recommended)
   - Click "Create repository"

3. **Push your code:**
   ```bash
   cd "/Users/ghost/Downloads/Vici Peptides Dashboard"
   git init
   git add .
   git commit -m "Initial commit - Vici Peptides Dashboard"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/vici-peptides-dashboard.git
   git push -u origin main
   ```
   (Replace `YOUR_USERNAME` with your GitHub username)

### Step 2: Deploy to Vercel (2 minutes)

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up** (use "Continue with GitHub" - easiest!)
3. **Click "Add New Project"**
4. **Select your repository** (`vici-peptides-dashboard`)
5. **Vercel auto-detects Next.js** - just click "Deploy"!

### Step 3: Add Environment Variables

**Before clicking "Deploy", click "Environment Variables" and add:**

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
WOOCOMMERCE_STORE_URL=your_woocommerce_store_url
WOOCOMMERCE_CONSUMER_KEY=your_woocommerce_consumer_key
WOOCOMMERCE_CONSUMER_SECRET=your_woocommerce_consumer_secret
SHIPPO_API_TOKEN=your_shippo_api_token_here
SHIPPO_ADDRESS_FROM_STREET1=390 NE 191st St, Ste 58434
SHIPPO_ADDRESS_FROM_CITY=Miami
SHIPPO_ADDRESS_FROM_STATE=FL
SHIPPO_ADDRESS_FROM_ZIP=33179
SHIPPO_ADDRESS_FROM_COUNTRY=US
```

6. **Click "Deploy"**
7. **Wait 2-3 minutes** - Vercel builds and deploys automatically!
8. **Done!** Your site is live at `your-project.vercel.app`

### Step 4: Connect Your Domain (Optional)

1. In Vercel dashboard → Your project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `dashboard.vicipeptides.com` (or `vicipeptides.com` if you want to replace your main site)
4. Vercel shows you DNS records to add
5. Go to Hostinger → DNS settings
6. Add the DNS records Vercel provides
7. Wait 5-10 minutes for DNS to propagate
8. Done!

## ✅ That's It!

Your dashboard is now:
- ✅ Live and accessible
- ✅ Automatically deployed when you push to GitHub
- ✅ Using your custom domain
- ✅ FREE forever

## 🎉 Benefits

- **Automatic deployments:** Every time you push to GitHub, Vercel auto-deploys
- **Preview deployments:** Every pull request gets its own preview URL
- **Analytics:** Built-in performance monitoring
- **SSL:** Automatic HTTPS
- **Global CDN:** Fast everywhere

## 🆘 Need Help?

If you get stuck:
1. Check Vercel's build logs (they're very clear)
2. Make sure all environment variables are set
3. Verify your GitHub repo is connected

Want me to walk you through it step-by-step? Just ask!
