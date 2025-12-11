# 🚀 Vercel + MongoDB Atlas Deployment Checklist

## Phase 1: MongoDB Atlas Setup (Cloud Database)

### Step 1: Create MongoDB Atlas Cluster
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Sign in or create account
3. Create a new project (e.g., "healthcare-appointments")
4. Create a **Free M0 cluster**
5. Choose region closest to you
6. Wait for cluster to be created (3-5 minutes)

### Step 2: Create Database User
1. In MongoDB Atlas, go to **Database Access**
2. Click **Add New Database User**
3. **Username:** `healthcare_admin`
4. **Password:** Generate strong password (save this!)
5. **Built-in Role:** Atlas Admin
6. Click **Add User**

### Step 3: Whitelist IP Addresses
1. Go to **Network Access**
2. Click **Add IP Address**
3. Select **Allow access from anywhere** (for simplicity, or add Vercel IPs)
4. Confirm

### Step 4: Get Connection String
1. Go to **Databases** → Click your cluster
2. Click **Connect**
3. Select **Drivers** → **Node.js** → Version 4.x
4. Copy the connection string

**Format:**
```
mongodb+srv://healthcare_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/healthcare-appointments?retryWrites=true&w=majority
```

Save this! You'll need it for Vercel.

---

## Phase 2: Prepare Code for Vercel

✅ **Done already!**
- Installed `serverless-http` in `package.json`
- Updated `src/index.ts` to export handler
- Updated `vercel.json` config
- Updated `.env.production` template

---

## Phase 3: Push Code to GitHub

### Step 1: Initialize Git (if not already done)
```bash
cd c:\Users\VoidDaddy\Documents\Modex
git init
git add .
git commit -m "Initial commit: Healthcare app with Vercel serverless"
```

### Step 2: Create GitHub Repository
1. Go to [GitHub](https://github.com/new)
2. Create new repository (e.g., `healthcare-appointments`)
3. **Do NOT** initialize with README (you have one)
4. Click **Create Repository**
5. Copy the repository URL

### Step 3: Push to GitHub
```bash
cd c:\Users\VoidDaddy\Documents\Modex
git remote add origin https://github.com/YOUR_USERNAME/healthcare-appointments.git
git branch -M main
git push -u origin main
```

---

## Phase 4: Deploy Backend to Vercel

### Step 1: Create Vercel Project
1. Go to [Vercel](https://vercel.com)
2. Sign in with GitHub
3. Click **Import Project**
4. Select your `healthcare-appointments` repo
5. Click **Import**

### Step 2: Configure Build Settings
Vercel should auto-detect:
- **Framework**: None (Node.js)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

If not auto-detected, set manually in **Settings** → **Build & Development Settings**

### Step 3: Add Environment Variables
1. In Vercel project, go to **Settings** → **Environment Variables**
2. Add these:

| Name | Value |
|------|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string (from Phase 1, Step 4) |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://your-frontend-url.vercel.app` (add later after frontend deploy) |

3. Click **Save**

### Step 4: Deploy
1. Click **Deploy**
2. Wait for build to complete (2-5 minutes)
3. You'll get a URL like: `https://healthcare-api.vercel.app`

### Step 5: Test Backend
```bash
curl https://healthcare-api.vercel.app/health
# Should return: {"status":"OK","message":"Healthcare Appointment System is running"}
```

**Save your backend URL!** You'll need it for frontend.

---

## Phase 5: Deploy Frontend to Vercel

### Step 1: Update API URL in Frontend
1. Open `healthcare-frontend/src/config/apiService.ts` (or similar)
2. Find where API base URL is set
3. Update to your Vercel backend URL:

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-backend-url.vercel.app';
```

Or add to frontend `.env.production`:
```
REACT_APP_API_URL=https://your-backend-url.vercel.app
```

### Step 2: Create Frontend Vercel Project
1. Go to [Vercel](https://vercel.com)
2. Click **Add New** → **Project**
3. Select same GitHub repo
4. Make sure root is set to `healthcare-frontend` folder
5. Click **Deploy**

### Step 3: Add Environment Variables (Frontend)
1. Go to **Settings** → **Environment Variables**
2. Add:

| Name | Value |
|------|-------|
| `REACT_APP_API_URL` | `https://your-backend-url.vercel.app` |

3. Click **Save** → **Redeploy**

---

## Phase 6: Verify Everything Works

### Test 1: Backend Health Check
```bash
curl https://your-backend-url.vercel.app/health
```

### Test 2: Frontend Load
Visit: `https://your-frontend-url.vercel.app`

### Test 3: API Connection
Try:
- Login
- View doctors
- Create appointment
- View appointments

---

## Troubleshooting

### Backend won't deploy
- Check build logs in Vercel: **Settings** → **Build Logs**
- Common issues:
  - Missing `MONGODB_URI` env var
  - TypeScript compilation errors
  - Missing dependencies

### Frontend won't connect to backend
- Check browser console for CORS errors
- Verify `REACT_APP_API_URL` is correct
- Update backend `CORS_ORIGIN` to match frontend URL

### MongoDB connection fails
- Verify connection string is correct
- Check IP whitelist in MongoDB Atlas
- Ensure `healthcare_admin` user exists

---

## Summary of URLs You'll Get

```
Backend API:   https://healthcare-api-xxx.vercel.app
Frontend:      https://healthcare-app-xxx.vercel.app
MongoDB Atlas: https://cloud.mongodb.com (dashboard)
GitHub Repo:   https://github.com/YOUR_USERNAME/healthcare-appointments
```

---

## Quick Reference Commands

```bash
# Build backend
npm run build

# Deploy to Vercel
vercel deploy

# Check Vercel logs
vercel logs

# Update frontend API URL and redeploy
# (Edit .env.production, commit, push to GitHub)
git add .
git commit -m "Update API URL"
git push origin main
```

---

**Ready to deploy?** Start with Phase 1! 🚀
