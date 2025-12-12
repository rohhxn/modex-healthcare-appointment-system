# Vercel Deployment - Quick Start Guide

Deploy your healthcare appointment system on Vercel in 30 minutes!

---

## ⚡ 5-Step Quick Deploy

### Step 1: Create Accounts (5 min)

**Vercel Account:**
- Go to https://vercel.com/signup
- Sign up with GitHub (recommended)
- Verify email

**MongoDB Atlas Account:**
- Go to https://www.mongodb.com/atlas
- Create a free cluster
- Create a database user + password
- Add Network Access (IP allowlist)
- Copy your connection string (MONGODB_URI)

### Step 2: Get Database Credentials (3 min)

1. Log in to MongoDB Atlas
2. Go to your Cluster
3. Click "Connect" → "Drivers"
4. Copy the connection string
5. Replace `<username>`, `<password>`, and database name

**Connection string looks like:**
```
mongodb+srv://<username>:<password>@<cluster-host>/<db>?retryWrites=true&w=majority
```

### Step 3: Push Code to GitHub (5 min)

Push the monorepo to GitHub (backend + frontend live in the same repo).

### Step 4: Deploy Backend (10 min)

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select `rohhxn/modex-healthcare-appointment-system`
4. Click "Import"
5. **Set Root Directory** to `healthcare-backend`
6. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add these variables:

```
MONGODB_URI      = <your MongoDB Atlas connection string>
CORS_ORIGIN      = https://yourfrontend.vercel.app
APPOINTMENT_EXPIRY_MINUTES = 5
NODE_ENV         = production
```

6. Click "Deploy"
7. Wait 2-3 minutes ⏳
8. **Copy your backend URL** (e.g., `https://healthcare-backend-xyz.vercel.app`)

### Step 5: Deploy Frontend (7 min)

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select `rohhxn/modex-healthcare-appointment-system`
4. **Set Root Directory** to `healthcare-frontend`
5. **Before deploying, click "Environment Variables"**
6. Add one variable (as a plain value — no Vercel Secret required):

```
REACT_APP_API_URL = https://healthcare-backend-xyz.vercel.app/api
```
(Replace with YOUR backend URL from Step 4)

6. Click "Deploy"
7. Wait 1-2 minutes ⏳
8. **Copy your Frontend URL** (e.g., `https://healthcare-frontend-xyz.vercel.app`)

---

## ✅ Verify Deployment

### Test Backend API
```bash
# Replace with YOUR backend URL
curl https://healthcare-backend-xyz.vercel.app/health
```

Should return:
```json
{"status":"OK","message":"Healthcare Appointment System is running"}
```

### Test Frontend
1. Open your frontend URL in browser
2. You should see the login page
3. Login with demo credentials:
   - ID: `pat001`
   - Email: `patient@example.com`
4. Browse doctors
5. Try booking an appointment

---

## 🐛 Quick Troubleshooting

### "Cannot connect to API"
- Check your `REACT_APP_API_URL` is correct
- Make sure it ends with `/api`
- Redeploy frontend after updating

### "Database connection failed"
- Verify connection string is correct
- Go to Neon dashboard → Connection string
- Copy the FULL string with credentials
- Update Vercel environment variables
- Redeploy backend

### "Build failed"
- Check build logs in Vercel dashboard
- Deployment → Latest → Logs
- Common fixes:
  - Make sure dependencies are in `package.json`
  - Check TypeScript errors: `npm run build` locally first
  - Verify Node version: `engines: { "node": "18.x" }` in package.json

### "CORS error"
- Go to Vercel backend settings
- Update `CORS_ORIGIN` to your frontend URL
- Redeploy

---

## 🔄 Auto-Deploy on Code Push

After this initial setup, **deployment is automatic!**

```
Push code to GitHub → Vercel automatically deploys
```

No more manual deployments needed!

---

## 💡 Pro Tips

**Tip 1: Use Neon Connection Pooling**
- For better performance, use connection pooling
- In Neon settings, enable "Connection Pooling"
- Use the pooling connection string

**Tip 2: Monitor Your Apps**
- Vercel Dashboard → View deployments and logs
- Neon Dashboard → View database usage
- Set up email alerts for errors

**Tip 3: Custom Domain (Optional)**
- In Vercel settings, add your custom domain
- Example: `appointments.yourdomain.com`
- Requires DNS configuration (5 min additional)

**Tip 4: Environment Variables for Testing**
- Create a `.env.production` locally
- Use different values for staging vs production
- Never commit sensitive values to Git

---

## 📊 What You Just Did

```
✅ Created cloud database (Neon)
✅ Deployed backend API (Vercel)
✅ Deployed frontend (Vercel)
✅ Connected frontend to backend
✅ Set up auto-deployment on Git push
✅ Made system available 24/7 online!
```

Your app is now live on the internet! 🚀

---

## 🔗 Your URLs

After deployment, you'll have:

**Frontend:**
```
https://your-frontend-name.vercel.app
```

**Backend API:**
```
https://your-backend-name.vercel.app/api/
```

**Database:**
```
Managed on Neon (see dashboard for metrics)
```

---

## 📈 Costs

| Component | Free Tier | Cost |
|-----------|-----------|------|
| Vercel (Frontend) | ✅ Yes | Free |
| Vercel (Backend) | ✅ Yes (limited) | Free |
| Neon (Database) | ✅ Yes (1GB) | Free |
| **TOTAL** | - | **Free to start** |

Upgrade when you need more:
- Vercel Pro: $20/month
- Neon Paid: $15-50/month

---

## 🎯 Next Steps

### Immediate (Done! ✅)
- [x] Deploy to Vercel
- [x] Get production URLs
- [x] Test functionality

### Soon (Next 1-2 weeks)
- [ ] Set up custom domain (optional)
- [ ] Enable notifications
- [ ] Add payment processing
- [ ] Set up monitoring & alerts

### Later (When needed)
- [ ] Scale database
- [ ] Add caching (Redis)
- [ ] Optimize performance
- [ ] Add analytics

---

## 🆘 Need More Help?

| Topic | Where to Look |
|-------|----------------|
| Deployment issues | VERCEL_DEPLOYMENT_GUIDE.md |
| How to use system | START_HERE.md |
| API documentation | healthcare-backend/README.md |
| Architecture | healthcare-backend/docs/SYSTEM_DESIGN.md |
| General setup | INSTALLATION.md |

---

## 🎉 Congratulations!

Your healthcare appointment system is now **LIVE ON THE INTERNET!**

You can:
- ✅ Access from anywhere
- ✅ Share with team/users
- ✅ Handle production traffic
- ✅ Scale as needed
- ✅ Monitor performance

---

## 📞 Support

**Vercel Issues:** https://vercel.com/docs  
**Neon Issues:** https://neon.tech/docs  
**Your App:** Use the documentation in your project

---

**Status**: ✅ Deployed & Live  
**Cost**: Free tier  
**Uptime**: 99.95% SLA  

🚀 **You're all set!**
