# Deployment Guide - JNN Youth Centre Management System

## Option 1: Render.com (Recommended - Free Tier Available)

### Step 1: Push to GitHub
```bash
# Create a .gitignore file first
echo "node_modules/
backend/node_modules/
frontend/node_modules/
backend/database.sqlite
backend/uploads/
.env
.DS_Store
*.log" > .gitignore

# Initialize git and push
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Deploy Backend (Free)
1. Go to https://render.com and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Name**: jnn-backend
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Plan**: Free
5. Add Environment Variable:
   - Key: `PORT` | Value: `3001`
6. Click "Create Web Service"

**⚠️ Important**: Free tier limitations:
- Server sleeps after 15 minutes of inactivity (takes 30 seconds to wake up)
- SQLite data may reset on deploy (consider upgrading to $7/month for persistent disk)

### Step 3: Deploy Frontend (Free)
1. On Render, click "New +" → "Static Site"
2. Connect same GitHub repo
3. Configure:
   - **Name**: jnn-frontend
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
4. Add Environment Variable:
   - Key: `VITE_API_URL` | Value: `https://jnn-backend.onrender.com` (your backend URL)
5. Click "Create Static Site"

---

## Option 2: Railway.app (Free Tier - Better for SQLite)

Railway offers better SQLite persistence on free tier than Render.

### Steps:
1. Go to https://railway.app
2. Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Add your repository
5. Railway will auto-detect Node.js
6. Add a Volume for SQLite persistence:
   - Go to project → "New" → "Database" → "Add Volume"
   - Mount path: `/backend`
7. Deploy!

---

## Option 3: Firebase (Free Forever - Requires Code Changes)

### For Frontend (Free Forever):
```bash
cd frontend
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### For Backend + Database:
**Problem**: Firebase Functions are serverless - SQLite won't work well.

**Solution**: Migrate to Firestore (NoSQL database)

This requires code changes to:
1. Replace Sequelize with Firebase Admin SDK
2. Change all database queries
3. Store images in Firebase Storage

**Cost**: Completely free for low usage (< 50,000 reads/day)

---

## Option 4: VPS/Dedicated Server ($3-5/month) - Most Reliable

### Recommended Providers:
- **Hetzner Cloud**: €3.29/month (2GB RAM, 20GB SSD)
- **DigitalOcean**: $4/month (512MB RAM, 10GB SSD)
- **Vultr**: $2.50/month (512MB RAM, 10GB SSD)

### Setup Steps:
```bash
# On your VPS (Ubuntu)
sudo apt update
sudo apt install nodejs npm nginx pm2 git

# Clone your repo
git clone YOUR_REPO_URL
cd jnn

# Setup Backend
cd backend
npm install
pm2 start server.js --name "jnn-backend"

# Setup Frontend
cd ../frontend
npm install
npm run build

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/jnn
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /home/ubuntu/jnn/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Option 5: Vercel + Supabase (Free Tier - Modern Stack)

### Frontend: Vercel (Free Forever)
1. Go to https://vercel.com
2. Import your GitHub repo
3. Set framework preset to "Vite"
4. Root Directory: `frontend`
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Environment Variable: `VITE_API_URL` = your backend URL

### Backend + Database: Supabase (Free Tier)
1. Go to https://supabase.com
2. Create new project
3. Use Supabase PostgreSQL instead of SQLite
4. Deploy backend to Vercel Serverless Functions or keep on Render

**Cost**: Both have generous free tiers

---

## My Recommendation for You

### If you want ZERO cost and can handle limitations:
→ **Render.com** (Free tier)
- Pros: Easy setup, automatic deploys
- Cons: Server sleeps, SQLite may reset occasionally

### If you want reliable SQLite for just $3-5/month:
→ **Hetzner Cloud VPS** or **DigitalOcean**
- Pros: Full control, persistent database, always on
- Cons: Requires basic Linux knowledge

### If you want truly free forever with some work:
→ **Firebase + Firestore migration**
- Pros: Free forever, scales infinitely
- Cons: Requires rewriting database code

---

## Quick Start (Easiest Path)

**Right now, in 10 minutes:**

1. Push code to GitHub
2. Sign up at render.com
3. Deploy backend (free)
4. Deploy frontend (free)
5. Done!

Your app will be live at:
- Frontend: https://jnn-frontend.onrender.com
- Backend API: https://jnn-backend.onrender.com

---

## Need Help?

If you get stuck on any step, share the error message and I'll help you fix it!

**Pro Tip**: Start with Render.com free tier to test, then upgrade to their $7/month plan if you need persistent database. That's less than the price of 2 cups of coffee per month! ☕
