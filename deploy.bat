@echo off
chcp 65001 >nul
title Deploy JNN Management System
echo ============================================
echo   JNN Youth Centre - Deployment Script
echo ============================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed
    echo Please install from: https://nodejs.org/
    pause
    exit /b 1
)

:: Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed
    echo Please install from: https://git-scm.com/download/win
    pause
    exit /b 1
)

:: Get current directory
set "BASE_DIR=%~dp0"
cd /d "%BASE_DIR%"

echo.
echo ============================================
echo Step 1: Building Frontend...
echo ============================================
cd "%BASE_DIR%frontend"
call npm install
call npm run build
if errorlevel 1 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b 1
)
echo [OK] Frontend built!

echo.
echo ============================================
echo Step 2: Git Setup...
echo ============================================
cd /d "%BASE_DIR%"

:: Configure git user if not set
git config user.email >nul 2>&1
if errorlevel 1 (
    echo Setting up Git user...
    git config user.email "admin@jnn.org"
    git config user.name "JNN Admin"
)

:: Initialize git if not exists
if not exist ".git" (
    echo Initializing Git repository...
    git init
    git config user.email "admin@jnn.org"
    git config user.name "JNN Admin"
)

:: Create .gitignore if not exists
if not exist ".gitignore" (
    echo Creating .gitignore...
    (
        echo node_modules/
        echo backend/node_modules/
        echo frontend/node_modules/
        echo frontend/dist/
        echo backend/database.sqlite
        echo backend/uploads/
        echo .env
        echo .DS_Store
        echo *.log
    ) > .gitignore
)

echo.
echo ============================================
echo Step 3: Committing changes...
echo ============================================

:: Remove dist folder from git if it was added accidentally
git rm -r --cached frontend/dist 2>nul

:: Add all files
git add .

:: Check if there are changes to commit
git diff --cached --quiet
if %errorlevel% == 0 (
    echo [INFO] No changes to commit
) else (
    git commit -m "Deploy update - %date% %time%"
    echo [OK] Changes committed!
)

echo.
echo ============================================
echo Step 4: Checking GitHub connection...
echo ============================================

:: Check if remote exists
git remote -v >nul 2>&1
if errorlevel 1 (
    echo.
    echo [WARNING] GitHub repository not connected!
    echo.
    echo Please run these commands:
    echo.
    echo   git remote add origin https://github.com/YOUR_USERNAME/jnn-management.git
    echo.
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo Step 5: Pushing to GitHub...
echo ============================================

:: Try to push, create branch if needed
git push origin HEAD:main 2>nul
if errorlevel 1 (
    git push origin HEAD:master 2>nul
    if errorlevel 1 (
        echo [ERROR] Push failed!
        echo.
        echo Make sure you:
        echo 1. Created the GitHub repository
        echo 2. Added the remote correctly
        echo.
        echo Check your GitHub repo URL and run:
        echo   git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
        echo.
        pause
        exit /b 1
    )
)

echo [OK] Code pushed to GitHub!

echo.
echo ============================================
echo [SUCCESS] Deployment triggered!
echo ============================================
echo.
echo Your code has been pushed to GitHub.
echo.
echo If you set up Render:
echo - Frontend: https://jnn-frontend.onrender.com
echo - Backend:  https://jnn-backend.onrender.com
echo.
echo If Render is not set up yet:
echo 1. Go to https://render.com
echo 2. Sign up with GitHub
echo 3. Click "New +" -> "Blueprint"
echo 4. Select your repository
echo 5. Click "Apply"
echo.
pause
