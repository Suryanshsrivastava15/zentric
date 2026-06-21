# 🚀 Zentric Deployment Guide

## Option A: Deploy to Vercel (Recommended)

Vercel is the official Next.js hosting platform and offers the best experience.

### 1. Push to GitHub

First, push your code to a GitHub repository:

```bash
git remote add origin https://github.com/YOUR_USERNAME/zentric.git
git branch -M main
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select "Import Git Repository"
4. Choose your GitHub account and select the `zentric` repository
5. Vercel will auto-detect Next.js and configure settings
6. Click "Deploy"

### 3. Configure Environment Variables

After deployment starts, go to **Project Settings → Environment Variables** and add:

```
DATABASE_URL = your-postgres-database-url
NEXTAUTH_SECRET = $(openssl rand -base64 32)  # Generate new secret
NEXTAUTH_URL = https://your-domain.vercel.app
OPENAI_API_KEY = sk-your-openai-api-key (optional)
```

#### Database Options for Production:

**Recommended: Vercel Postgres**
- Integrated with Vercel
- Click "Add → Postgres" in Vercel dashboard
- Automatically sets `DATABASE_URL`

**Alternative Options:**
- **Railway** - Simple setup, free tier available
- **Neon** - PostgreSQL serverless, generous free tier
- **Supabase** - PostgreSQL + Auth, great for full-stack apps

### 4. Update Database URL in Prisma

Since SQLite won't work in serverless environments, switch to PostgreSQL:

```bash
npx prisma migrate deploy  # Run migrations on production database
```

### Database Migration Steps:

1. **Create PostgreSQL database** (using your chosen provider)
2. **Update `DATABASE_URL`** in Vercel environment variables
3. **Update `prisma/schema.prisma`**:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. **Run migrations**:
   ```bash
   npx prisma migrate deploy
   ```
5. **Redeploy** on Vercel (automatic via git push)

---

## Option B: Deploy to Railway

Railway is beginner-friendly and free to start:

### 1. Sign up at [railway.app](https://railway.app)

### 2. Create New Project
- Click "New Project"
- Select "GitHub Repo"
- Choose your zentric repository

### 3. Add PostgreSQL Plugin
- In Railway dashboard, click "Add Plugin"
- Select "PostgreSQL"
- Railway auto-configures `DATABASE_URL`

### 4. Set Environment Variables
In **Variables** tab, add:
```
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-railway-domain.railway.app
OPENAI_API_KEY=your-openai-key (optional)
```

### 5. Deploy
- Railway auto-deploys on git push
- Check deployment status in the dashboard

---

## Option C: Deploy to Render

Render offers free tier with generous limits:

### 1. Sign up at [render.com](https://render.com)

### 2. Create New Web Service
- Click "New +"
- Select "Web Service"
- Connect your GitHub account
- Select the zentric repository

### 3. Configure Build & Deploy
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Node Version**: 18+

### 4. Add PostgreSQL Database
- Click "New +"
- Select "PostgreSQL"
- Copy connection string to `DATABASE_URL`

### 5. Set Environment Variables
In **Environment** tab:
```
DATABASE_URL=your-postgres-url
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-render-domain.onrender.com
OPENAI_API_KEY=your-openai-key (optional)
```

### 6. Deploy
- Render auto-deploys from git pushes

---

## Post-Deployment Checklist

- ✅ Verify site loads at your domain
- ✅ Test sign-in (email-based auth)
- ✅ Test creating a task
- ✅ Test creating a note
- ✅ Test chat (if OPENAI_API_KEY is set)
- ✅ Check server logs for errors
- ✅ Test on mobile
- ✅ Monitor performance in provider dashboard

---

## Important Notes

### Database Choice:

| Provider | Cost | Setup | Scalability | Recommendation |
|----------|------|-------|-------------|---|
| **Vercel Postgres** | $5-50/mo | Auto | Excellent | ⭐ Best for Vercel |
| **Railway** | Free-99/mo | Easy | Good | ⭐ Simple setup |
| **Neon** | Free-unlimited | Easy | Good | ⭐ Generous free tier |
| **Supabase** | Free-unlimited | Medium | Excellent | For advanced features |

### Switching from SQLite to PostgreSQL:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // Changed from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `src/lib/prisma.ts` if needed (it will work with PostgreSQL)

3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Environment Variables Reference:

- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - Random 32+ character string (generate: `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your production domain (https://example.com)
- `OPENAI_API_KEY` - Optional, for AI features (get from openai.com)

---

## Troubleshooting

### Build Fails
- Check logs in provider dashboard
- Verify all environment variables are set
- Run `npm run build` locally to test

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Check database credentials
- Ensure database allows connections from your provider

### Auth Issues
- Verify `NEXTAUTH_URL` matches your domain
- Regenerate `NEXTAUTH_SECRET`
- Check cookies are enabled in browser

### Slow Performance
- Consider upgrading database tier
- Check server logs for bottlenecks
- Monitor in provider analytics

---

## Next Steps

After deployment:

1. **Custom Domain** - Add your domain in provider settings
2. **SSL/HTTPS** - Auto-configured by provider
3. **Monitoring** - Set up alerts for errors
4. **Backups** - Enable auto-backups for database
5. **Scaling** - Monitor usage, upgrade as needed

---

**You're all set! 🎉 Your Zentric app is now live!**
