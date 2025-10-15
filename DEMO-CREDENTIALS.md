# Demo Credentials

## Test Accounts

All accounts use the password: **Test123!**

### Admin Account
- **Email:** admin@test.com
- **Password:** Test123!
- **Role:** Administrator
- **Capabilities:**
  - Approve/reject flag requests
  - Generate QR codes for flags
  - View all flags and captures
  - Delete flags and captures

### Player Accounts

#### Player 1
- **Email:** player1@test.com
- **Password:** Test123!
- **Role:** User

#### Player 2
- **Email:** player2@test.com
- **Password:** Test123!
- **Role:** User

## Demo Flow

### 1. User Journey (use player1@test.com)
1. Sign in at `/sign-in`
2. Go to `/request-flag`
3. Submit a flag request
4. View request status

### 2. Admin Journey (use admin@test.com)
1. Sign in at `/sign-in`
2. Go to `/admin`
3. See pending flag request from Player 1
4. Click "Approve" to create flag
5. Click "QR" button to generate and view QR code
6. Download QR code

### 3. Flag Capture (use player2@test.com)
1. Sign in at `/sign-in`
2. Navigate to flag detail page (e.g., `/flag/1`)
3. Click "Scan QR Code" (or skip scanner for demo)
4. Fill out capture form with date/notes/photo
5. Submit capture
6. View success page with confetti

## Production Setup

Before deploying, ensure these environment variables are set in Cloudflare:

1. **BETTER_AUTH_SECRET** (secret) - Random 32+ character string
2. **BETTER_AUTH_URL** - Your production URL (e.g., https://flag-trax.workers.dev)
3. **ADMIN_EMAIL** - admin@test.com

## Seeding Production

To seed demo users to production:

```bash
# Apply migrations (if not already done)
npx wrangler d1 execute flag-capture-db --remote --file=migrations/0001_init.sql

# Seed demo users
npx wrangler d1 execute flag-capture-db --remote --file=migrations/seed-demo-users.sql
```

## Security Note

**IMPORTANT:** These are demo credentials only. Do NOT use these accounts for production data. After the demo, consider:
- Deleting demo accounts
- Creating real accounts with strong passwords
- Changing admin email to a real address
