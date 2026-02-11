# 🚀 Quick Deployment (Manual Method)

## Step 1: Create GitHub Account & Repo
1. Go to https://github.com/signup - Create account
2. Click "+" (top right) → "New repository"
3. Name: `jnn-management`
4. Click "Create repository"

## Step 2: Upload Your Files
**Option A - Using GitHub Website (Easiest):**
1. In your new repo, click "uploading an existing file"
2. Drag and drop ALL files from your project folder
3. Click "Commit changes"

**Option B - Using Git Command:**
```bash
# Run in your project folder
git init
git config user.email "you@example.com"
git config user.name "Your Name"
git add .
git commit -m "First commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/jnn-management.git
git push -u origin main
```

## Step 3: Deploy to Render
1. Go to https://render.com
2. Click "Sign Up" → "Sign up with GitHub"
3. Authorize Render to access your GitHub
4. Click "New +" → "Blueprint"
5. Find and select your `jnn-management` repo
6. Click "Apply"
7. Wait 2-3 minutes for deployment

## Step 4: Your App is Live! 🎉
- **Frontend:** https://jnn-frontend.onrender.com (or similar)
- **Backend:** https://jnn-backend.onrender.com (or similar)

Copy these URLs from your Render dashboard.

## Step 5: Update Frontend API URL
1. In Render dashboard, click your **frontend** service
2. Go to "Environment" tab
3. Add variable:
   - Key: `VITE_API_URL`
   - Value: Your backend URL (e.g., https://jnn-backend.onrender.com)
4. Click "Save Changes"
5. Frontend will redeploy automatically

---

## 🔄 Updating Your App

After making changes:

**Using Website:**
1. Go to your GitHub repo
2. Click "Add file" → "Upload files"
3. Upload changed files
4. Click "Commit changes"
5. Render will auto-deploy!

**Using Command:**
```bash
git add .
git commit -m "Update"
git push origin main
```

---

## ⚠️ Common Issues

### Issue: "No changes to commit"
**Fix:** Run `deploy.bat` again or manually upload files

### Issue: "Push failed"
**Fix:** Make sure you created the GitHub repo first

### Issue: "Build failed"
**Fix:** Check that node_modules is NOT uploaded (should be in .gitignore)

### Issue: SQLite data resets
**Fix:** This is normal on free tier. For persistent data, upgrade to $7/month on Render or use a VPS ($5/month).

---

## 💰 Cost Options

| Option | Cost | Best For |
|--------|------|----------|
| **Render Free** | $0 | Testing, small usage |
| **Render Paid** | $7/month | Production, persistent database |
| **VPS (DigitalOcean)** | $4/month | Full control, always on |

---

## 🆘 Need Help?

If stuck, tell me:
1. Which step you're on
2. What error message you see
3. I'll guide you through it!

**Alternative:** I can also help you deploy to a VPS if you prefer (more reliable, $3-5/month).
