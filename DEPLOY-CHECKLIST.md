# Production Deployment Checklist

## Pre-Deployment (Do these ONCE before first deploy)

### 1. Environment Variables
Check that these are set in Cloudflare Workers dashboard:

```bash
# Secrets (encrypted)
wrangler secret put BETTER_AUTH_SECRET
# Use: openssl rand -base64 32

# Environment Variables
BETTER_AUTH_URL=https://YOUR-WORKER-NAME.workers.dev
ADMIN_EMAIL=admin@test.com
```

### 2. Database Setup
```bash
# Create D1 database (if not exists)
npx wrangler d1 create flag-capture-db

# Update wrangler.jsonc with database_id

# Apply migrations
npx wrangler d1 execute flag-capture-db --remote --file=migrations/0001_init.sql

# Seed demo users
npx wrangler d1 execute flag-capture-db --remote --file=migrations/seed-demo-users.sql
```

### 3. R2 Bucket Setup
```bash
# Create R2 bucket (if not exists)
npx wrangler r2 bucket create flag-photos

# Verify in wrangler.jsonc
```

## Deployment Steps

### Quick Deploy (if pre-deployment done)
```bash
# This will trigger auto-deploy via GitHub
git add .
git commit -m "Prepare for demo"
git push origin main
```

### Manual Deploy (alternative)
```bash
npm run deploy
```

## Post-Deployment Verification

1. **Check deployment succeeded** - Visit Cloudflare Workers dashboard
2. **Test homepage** - Visit https://YOUR-WORKER.workers.dev
3. **Test sign-in** - Use admin@test.com / Test123!
4. **Verify admin access** - Check /admin route is accessible
5. **Test flag request** - Use player1@test.com to request a flag
6. **Approve request** - Use admin to approve and generate QR

## Demo Flow (20 minute presentation)

### Part 1: User Requests Flag (5 min)
1. Show homepage (signed out)
2. Sign up/Sign in as player1@test.com
3. Navigate to Request Flag
4. Submit request
5. Show request status

### Part 2: Admin Workflow (7 min)
1. Sign out, sign in as admin@test.com
2. Navigate to Admin Dashboard
3. Show pending requests tab
4. Approve request (creates flag)
5. Show QR code generation
6. Download QR code
7. Show Flags tab

### Part 3: Flag Capture (8 min)
1. Sign out, sign in as player2@test.com
2. Navigate to flag detail page
3. Show "Scan QR Code" button (simulate scan for demo)
4. Fill capture form:
   - Select date
   - Add notes
   - Upload photo (optional)
5. Submit capture
6. Show success page with confetti
7. Navigate back to flag page
8. Show capture history

## Troubleshooting

### Database not found
```bash
npx wrangler d1 list
npx wrangler d1 execute flag-capture-db --remote --file=migrations/0001_init.sql
```

### Can't sign in
```bash
# Re-seed users
npx wrangler d1 execute flag-capture-db --remote --file=migrations/seed-demo-users.sql
```

### Admin access denied
- Verify ADMIN_EMAIL env var matches admin@test.com
- Re-deploy after setting env var

### Photos not uploading
- Verify R2 bucket exists: `npx wrangler r2 bucket list`
- Verify PHOTOS binding in wrangler.jsonc

## Demo Accounts Reference

**Admin:** admin@test.com / Test123!
**Player 1:** player1@test.com / Test123!
**Player 2:** player2@test.com / Test123!

## Time Estimate
- Pre-deployment setup: 10 minutes (one-time)
- Demo execution: 20 minutes
- Q&A buffer: 10 minutes
