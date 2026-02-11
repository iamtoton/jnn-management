# 🎓 JNN Youth Centre Management System

A complete fee management and student records system for educational institutes.

## ✨ Features

- 📚 **Student Management** - Add, edit, view, and manage student records
- 💰 **Fee Collection** - Collect fees with receipt generation
- 📊 **Payment History** - Track all transactions with export options
- 📋 **Due List** - Auto-calculate pending fees
- 🖨️ **Receipt Printing** - A5 landscape professional receipts
- 💾 **Data Backup** - Built-in backup and restore functionality
- 📤 **Export Data** - Export to Excel/CSV and print lists

## 🚀 One-Click Deploy

### Option 1: Deploy to Render (Free)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=YOUR_GITHUB_USERNAME/YOUR_REPO_NAME)

**Manual Steps if button doesn't work:**

1. Fork/Upload this repo to your GitHub
2. Click the button above ☝️
3. Render will automatically deploy both frontend and backend!

### Option 2: Automatic Deployment (Recommended)

Once set up, every time you push to GitHub, your app deploys automatically!

## 📖 Setup Instructions

### For Automatic Deployment:

#### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

#### Step 2: Deploy to Render
1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click "New +" → "Blueprint"
3. Select your GitHub repository
4. Render will read `render.yaml` and deploy automatically!

#### Step 3: Configure Secrets (for Auto-Deploy)
After first deploy, add these secrets to your GitHub repository:
- Go to Settings → Secrets and variables → Actions
- Add:
  - `RENDER_API_KEY` - Get from Render Dashboard → Account Settings → API Keys
  - `RENDER_BACKEND_SERVICE_ID` - From backend service settings
  - `RENDER_FRONTEND_SERVICE_ID` - From frontend service settings
  - `RENDER_BACKEND_URL` - Your backend URL (e.g., https://jnn-backend.onrender.com)

Now every push to `main` branch will automatically deploy! 🎉

## 💻 Local Development

```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev
```

Or use the batch file:
```bash
start.bat
```

## 🔧 Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite
- **File Uploads**: Multer
- **Deployment**: Render / Railway / VPS

## 📝 Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Frontend
VITE_API_URL=http://localhost:3001

# Backend
PORT=3001
NODE_ENV=development
```

## 🆘 Support

If you need help with deployment, create an issue or contact support.

## 📄 License

MIT License - feel free to use and modify!

---

**Made with ❤️ for JNN Youth Centre**
