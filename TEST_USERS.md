# Test Users Setup for Flag-Trax-Game

## Quick Start

```bash
# One command setup
npm run setup:dev

# Then start the dev server
npm run dev

# Visit http://localhost:5173/dev-signin
```

## Manual Setup Steps

1. **Apply database migrations:**
   ```bash
   npm run db:migrate
   ```

2. **Generate password hash (optional - pre-configured):**
   ```bash
   npm run seed:hash
   ```

3. **Seed test users:**
   ```bash
   npm run seed:users
   ```

## Test Accounts

| Email | Name | Role | Password | Notes |
|-------|------|------|----------|-------|
| admin@test.com | Admin User | Admin | Test123! | Can approve flag requests |
| player1@test.com | Player One | User | Test123! | Owns flag #1 |
| player2@test.com | Player Two | User | Test123! | Owns flag #2 |

## Testing Flow

1. **Sign in as Admin:**
   - Navigate to `/dev-signin`
   - Click "Admin User"
   - Visit `/admin` to see dashboard

2. **Sign in as Player One:**
   - Navigate to `/dev-signin`
   - Click "Player One"
   - Visit `/flag/1` to see your flag
   - Try to capture flag #2

3. **Sign in as Player Two:**
   - Navigate to `/dev-signin`
   - Click "Player Two"
   - Visit `/flag/2` to see your flag
   - Try to capture flag #1

## Troubleshooting

### Login fails with "Failed to sign in"
- Run `npm run setup:dev` to ensure database and users are created
- Check that `.dev.vars` file exists with correct values
- Verify the local D1 database exists in `.wrangler/state/`

### Database not found
- Ensure you've run `npm run db:migrate` at least once
- Check wrangler.jsonc has correct database configuration

### Password hash issues
- The seed script uses a pre-generated hash for "Test123!"
- To use a different password, run `npm run seed:hash` first
- Update the hash in `scripts/seed-test-users.js`

## Notes

- Test users are created in local D1 database only
- Sessions use Better Auth's cookie-based authentication
- The `/dev-signin` route is for development only
- Remove from production builds by excluding the route
