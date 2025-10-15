# Flag Capture Game - Deployment Guide

This guide will walk you through deploying the Flag Capture Game to production on Cloudflare Workers.

## Prerequisites

- Cloudflare account (free tier works)
- Node.js 18+ installed
- Git installed
- Completed local development setup

## Pre-Deployment Checklist

### 1. Verify Local Build

```bash
npm run build
```

Ensure the build completes without errors.

### 2. Run Tests

```bash
npm test
```

All tests should pass before deploying.

### 3. Type Check

```bash
npm run typecheck
```

Fix any TypeScript errors.

## Production Setup

### Step 1: Configure Production Environment

In your Cloudflare dashboard (https://dash.cloudflare.com):

1. **Navigate to Workers & Pages**
2. **Set Environment Variables** for your deployed worker:
   - `BETTER_AUTH_SECRET`: Generate using `openssl rand -base64 32`
   - `BETTER_AUTH_URL`: Your production URL (e.g., `https://flag-capture.your-workers.dev`)
   - `ADMIN_EMAIL`: Email address of the admin user

**Important**: Use the **Secrets** section for `BETTER_AUTH_SECRET` (not environment variables).

### Step 2: Create Production Database

```bash
# Create production D1 database (if not already done)
npx wrangler d1 create flag-capture-db

# Update wrangler.jsonc with the database_id from output
```

### Step 3: Apply Migrations to Production

```bash
# Apply Drizzle migration
npx wrangler d1 execute flag-capture-db --remote --file=./migrations/0000_vengeful_mister_sinister.sql

# Verify migration
npx wrangler d1 execute flag-capture-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

You should see these tables:
- `_cf_KV`
- `account`
- `captures`
- `flag_requests`
- `flags`
- `session`
- `sqlite_sequence`
- `user`
- `verification`

### Step 4: Create R2 Bucket

```bash
# Create production R2 bucket (if not already done)
npx wrangler r2 bucket create flag-photos

# Verify bucket exists
npx wrangler r2 bucket list
```

### Step 5: Deploy to Production

```bash
npm run deploy
```

This command will:
1. Build the application (`npm run build`)
2. Deploy to Cloudflare Workers (`wrangler deploy`)

### Step 6: Verify Deployment

1. **Visit your Workers URL** (shown in deployment output)
2. **Create a test account**
3. **Verify admin access** using the `ADMIN_EMAIL` you configured
4. **Test core functionality**:
   - Sign up/Sign in
   - Request a flag (as user)
   - Approve request (as admin)
   - Generate QR code
   - View flag details

## Post-Deployment Configuration

### R2 Public Access (Optional)

If you want photos to be publicly accessible:

1. Go to Cloudflare Dashboard → R2
2. Select `flag-photos` bucket
3. Enable public access with custom domain or R2.dev subdomain

Update photo URLs in your code if using custom domain.

### Custom Domain

To use a custom domain:

1. In Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. Click "Triggers" → "Add Custom Domain"
4. Follow the prompts to add your domain
5. Update `BETTER_AUTH_URL` environment variable to your custom domain

## Monitoring

### View Logs

```bash
npx wrangler tail
```

### Check D1 Database

```bash
# Execute queries
npx wrangler d1 execute flag-capture-db --remote --command "SELECT COUNT(*) as user_count FROM user;"
npx wrangler d1 execute flag-capture-db --remote --command "SELECT COUNT(*) as flag_count FROM flags;"
```

### Check R2 Bucket

```bash
npx wrangler r2 object list flag-photos
```

## Rollback Procedure

If you need to rollback:

```bash
# View previous deployments
npx wrangler deployments list

# Rollback to specific deployment
npx wrangler rollback --deployment-id <deployment-id>
```

## Troubleshooting

### Issue: 500 Errors on API Calls

**Check:**
- Environment variables are set correctly
- Database migrations are applied
- R2 bucket exists

**Solution:**
```bash
npx wrangler tail
```
View real-time logs to see error details.

### Issue: Authentication Not Working

**Check:**
- `BETTER_AUTH_SECRET` is set as a **Secret** (not env var)
- `BETTER_AUTH_URL` matches your production URL
- Database has all Better Auth tables

### Issue: Photos Not Uploading

**Check:**
- R2 bucket `flag-photos` exists
- R2 binding is configured in `wrangler.jsonc`
- Worker has permissions to access R2

### Issue: Admin Features Not Working

**Check:**
- Logged in with email matching `ADMIN_EMAIL` environment variable
- Email is exact match (case-sensitive)

## Database Maintenance

### Backup Database

```bash
# Export all data
npx wrangler d1 export flag-capture-db --remote --output=backup-$(date +%Y%m%d).sql
```

### Clear Test Data (Use with Caution!)

```bash
# Delete all captures
npx wrangler d1 execute flag-capture-db --remote --command "DELETE FROM captures;"

# Delete all flags
npx wrangler d1 execute flag-capture-db --remote --command "DELETE FROM flags;"

# Delete all flag requests
npx wrangler d1 execute flag-capture-db --remote --command "DELETE FROM flag_requests;"
```

## Performance Optimization

### Enable Caching

Add caching headers for static assets in `workers/app.ts`:

```typescript
app.get("/photos/*", async (c) => {
  // Add caching logic for R2 photos
});
```

### Monitor Usage

Check your Cloudflare Dashboard for:
- Request volume
- D1 query performance
- R2 storage usage
- Worker CPU time

## Security Best Practices

1. ✅ **Never commit `.dev.vars`** to git
2. ✅ **Rotate `BETTER_AUTH_SECRET`** periodically
3. ✅ **Use Secrets** for sensitive data, not environment variables
4. ✅ **Monitor admin actions** through logs
5. ✅ **Backup database** regularly

## Scaling Considerations

**Current Limits (Free Tier):**
- Workers: 100,000 requests/day
- D1: 5GB storage, 5M reads/day, 100K writes/day
- R2: 10GB storage, 10M Class A operations/month

**When to upgrade:**
- High photo upload volume → Upgrade R2
- Many concurrent users → Upgrade Workers
- Large dataset → Upgrade D1

## Support

For issues:
1. Check `npx wrangler tail` for logs
2. Review Cloudflare status page
3. Check this deployment guide
4. Review CLAUDE.md for architecture details

---

**Deployment Complete!** 🎉

Your Flag Capture Game is now live and ready for users to start capturing flags!
