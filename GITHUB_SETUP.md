# GitHub Repository Setup Instructions

## Step 1: Create a New GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Repository name: `neonmetrics-dashboard-demo` (or your preferred name)
4. Description: "Neon-themed analytics dashboard demo"
5. Set to **Public** (for easy Vercel deployment)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 2: Connect Your Local Repository

After creating the repository, GitHub will show you commands. Use these:

```bash
cd "/Users/ghost/Downloads/Vici Peptides Dashboard"

# Add the new remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/neonmetrics-dashboard-demo.git

# Or if you prefer SSH:
# git remote add origin git@github.com:YOUR_USERNAME/neonmetrics-dashboard-demo.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Verify

Check that the remote is set correctly:

```bash
git remote -v
```

You should see your new repository URL.

## Step 4: Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. Click "Deploy" (no environment variables needed for demo mode)

That's it! Your demo dashboard will be live.
