# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A competitive social QR-code-based flag capture game built entirely on Cloudflare's edge platform. Players physically find flags marked with QR codes, scan them to claim ownership, and track their captures with photos and notes.

**Stack**: React Router v7 (SSR) + Hono + Cloudflare Workers + D1 (SQLite) + R2 (storage) + Better Auth + shadcn/ui

## Key Commands

```bash
# Development (hot reload)
npm run dev                    # Standard dev server (localhost:5173)
npm run dev:wsl                # WSL2-specific (exposes on 0.0.0.0)

# Type checking & generation
npm run typecheck              # Full type check (generates types first)
npm run cf-typegen            # Generate Cloudflare binding types

# Testing
npm test                       # Run Playwright E2E tests
npm test:ui                    # Playwright UI mode

# Database
npm run db:migrate            # Apply migrations to local D1
npm run seed:users            # Seed test users (dev/admin/user1/user2)
npm run setup:dev             # One-command setup: migrate + seed

# Build & deploy
npm run build                 # Production build
npm run deploy                # Build + deploy to Cloudflare Workers
```

## Architecture

### Frontend (app/)

**React Router v7** - Uses **config-based routing** (not file-based):
- Route definitions: `app/routes.ts`
- Route components: `app/routes/**/*.tsx`
- Loaders handle auth/admin checks (SSR-compatible)

**Auth Context Pattern** (`app/context/auth.tsx`):
- Dynamic import of `auth.client` to avoid SSR issues
- `useAuth()` hook provides `{ session, isAuthenticated, isAdmin, isLoading }`
- Admin detection: checks if `session.user.email === ADMIN_EMAIL`
- SSR-safe with client-side session subscription

**Path Aliases**:
- `@/*` maps to `app/*` (configured in tsconfig.json)
- Import components as `@/components/ui/button`

### Backend (workers/app.ts)

**Hono server** with middleware pattern:
- Auth + DB initialized per-request via middleware
- API routes **must** come before React Router catch-all `app.get("*")`
- Admin routes protected by `adminOnly` middleware

**Route Order (critical)**:
```typescript
// 1. Better Auth routes
app.on(["POST", "GET"], "/api/auth/*", ...)

// 2. API routes
app.post("/api/photos", ...)
app.get("/api/flags/:flagNumber", ...)

// 3. React Router catch-all (MUST BE LAST)
app.get("*", ...)
```

### Database (db/schema.ts + Drizzle ORM)

**Schema**:
- `user`, `session`, `account`, `verification` - Better Auth tables
- `flag_requests` - User requests for new flags (pending/approved/rejected)
- `flags` - Physical flags with sequential numbers, ownership tracking
- `captures` - Capture events with photos/notes (cascade delete from flags)

**Critical Patterns**:

1. **Atomic Flag Approval** (workers/app.ts:423-480):
   ```typescript
   // Transaction ensures sequential flag numbers without races
   db.transaction(async (tx) => {
     const maxFlag = await tx.select({ max: max(flags.flagNumber) }).from(flags);
     const nextFlagNumber = (maxFlag[0]?.max ?? 0) + 1;
     // Create flag + update request atomically
   });
   ```

2. **Ownership Reversion** (workers/app.ts:574-641):
   ```typescript
   // When capture deleted, revert to previous capturer or original requester
   db.transaction(async (tx) => {
     // Delete capture, find previous, update flag ownership
   });
   ```

3. **Prevent Self-Capture** (workers/app.ts:271-273):
   ```typescript
   if (flag.currentOwnerId === session.user.id) {
     throw new Error("You cannot capture your own flag");
   }
   ```

### Authentication (Better Auth)

**Two-Config Pattern** (required for Cloudflare Workers):

- `auth/auth.cli.ts` - Uses `better-sqlite3` for CLI commands (schema generation)
- `auth/auth.server.ts` - Uses `drizzle-orm/d1` for runtime (actual Workers)

**Why**: Better Auth CLI cannot access Cloudflare bindings, needs local SQLite.

**Schema Generation**:
```bash
npx @better-auth/cli generate --config auth/auth.cli.ts
# Outputs migration to migrations/ directory
npx wrangler d1 execute flag-capture-db --local --file=migrations/<file>.sql
```

**Admin Pattern**:
- No separate admin role/table
- Any user whose `email === ADMIN_EMAIL` env var is admin
- Backend checks via middleware, frontend via `useAuth().isAdmin`

### Storage (Cloudflare R2)

**Photo Upload Flow**:
1. Client uploads to `POST /api/photos` (auth required)
2. Server generates unique filename: `{userId}-{timestamp}-{random}.{ext}`
3. Stored in R2 bucket `PHOTOS` binding
4. Returns URL: `/photos/{filename}`
5. Served via `GET /photos/:filename` with 1-year cache headers

### Environment Variables

**Local (.dev.vars)**:
```bash
BETTER_AUTH_SECRET="<32-byte-random-string>"
BETTER_AUTH_URL="http://localhost:5173"
ADMIN_EMAIL="admin@example.com"
```

**Production** (Cloudflare Dashboard):
- `BETTER_AUTH_SECRET` - Set as **encrypted secret**
- `BETTER_AUTH_URL` - Your production domain
- `ADMIN_EMAIL` - Admin user email

**Bindings** (wrangler.jsonc):
- `DB` - D1 database (flag-capture-db)
- `PHOTOS` - R2 bucket (flag-photos)

### Component Library (shadcn/ui)

**Dark Mode Default**:
- No theme toggle (dark mode only for MVP)
- CSS variables in `app/app.css` define theme
- All components in `app/components/ui/`

**Adding Components**:
```bash
npx shadcn@latest add <component-name>
```

## Development Workflows

### Database Changes

1. Edit `db/schema.ts`
2. Generate migration: `npx drizzle-kit generate`
3. Apply locally: `npm run db:migrate`
4. Test changes
5. Deploy to production: `npx wrangler d1 execute flag-capture-db --remote --file=migrations/<file>.sql`

### Adding API Endpoints

1. Add route in `workers/app.ts` **before** React Router catch-all
2. Use `auth.api.getSession()` for protected routes
3. Use `adminOnly` middleware for admin routes
4. Use `db.transaction()` for multi-step operations
5. Add types to `Env` interface if new bindings needed

### Adding Routes

1. Create component in `app/routes/`
2. Add to `app/routes.ts` config
3. Add loader for auth/data fetching (SSR-compatible)
4. Protected routes: check session in loader, `throw redirect("/sign-in")` if missing
5. Admin routes: additionally check `session.user.email === context.cloudflare.env.ADMIN_EMAIL`

### WSL2 Development

**Issue**: File system watching doesn't work well in WSL2
**Solution**: Vite configured with polling (vite.config.ts:24-26)

```bash
npm run dev:wsl  # Exposes server on 0.0.0.0 for Windows access
```

Access from Windows: `http://localhost:5173` or `http://<WSL-IP>:5173`

### Testing Strategy

**Playwright E2E tests** (tests/):
- `qrcode-ssr.spec.ts` - QR code generation without client-side imports
- `ui-ux.spec.ts` - UI/UX flows
- More test files as needed

**Running**:
```bash
npm test        # Headless
npm test:ui     # Interactive UI
```

**Test Users** (seeded via `npm run seed:users`):
- `dev@dev.com:password123` - Dev user
- `admin@example.com:password123` - Admin (matches ADMIN_EMAIL)
- `user1@example.com:password123` - Test user 1
- `user2@example.com:password123` - Test user 2

## Deployment

### First-Time Setup

```bash
# Create D1 database
npx wrangler d1 create flag-capture-db
# Update wrangler.jsonc with database_id

# Create R2 bucket
npx wrangler r2 bucket create flag-photos

# Apply migrations
npx wrangler d1 execute flag-capture-db --remote --file=migrations/0001_init.sql

# Set secrets in Cloudflare dashboard
wrangler secret put BETTER_AUTH_SECRET
# Also set BETTER_AUTH_URL and ADMIN_EMAIL as environment variables
```

### Subsequent Deploys

```bash
npm run deploy  # Builds + deploys to Workers
```

## Critical Implementation Notes

### Transaction Usage

**Always use transactions for**:
- Flag approval (atomic sequential numbering)
- Capture deletion (atomic ownership reversion)
- Any multi-step operation requiring consistency

### QR Code Generation

- **Do NOT** import `qrcode` on client-side (Node.js only)
- Generate server-side via admin API endpoint
- Dynamic import in worker: `const QRCode = (await import("qrcode")).default;`

### Photo Upload

- Max 5MB (not enforced yet - TODO)
- Accepted: JPEG, PNG, WebP
- Use `<Input type="file" accept="image/*" capture="environment" />` for camera

### Session Handling

- Sessions expire after 7 days
- Updated every 24 hours with activity
- Client subscribes to session changes (real-time logout on other tabs)

### API Response Patterns

```typescript
// Success
return c.json({ data: result });

// Error
return c.json({ error: "Human-readable message" }, statusCode);

// Transaction errors should throw Error, caught in try/catch
```

## Common Pitfalls

1. **Adding API routes after catch-all** - They'll never match, React Router catches first
2. **Importing `qrcode` client-side** - Node.js only, use server endpoint
3. **Forgetting transactions** - Race conditions in flag numbering/ownership
4. **Not checking admin in backend** - Frontend check is UX, backend check is security
5. **Using file-based routing patterns** - React Router v7 uses config file (`app/routes.ts`)

## Project Structure

```
flag-trax-game/
├── app/                          # Frontend (React Router)
│   ├── routes/                   # Route components
│   ├── routes.ts                 # Route configuration (central)
│   ├── components/ui/            # shadcn/ui components
│   ├── context/auth.tsx          # Auth context provider
│   ├── lib/auth.client.ts        # Better Auth client
│   └── root.tsx                  # App root with providers
├── workers/app.ts                # Backend (Hono API + SSR handler)
├── db/schema.ts                  # Database schema (Drizzle)
├── auth/
│   ├── auth.cli.ts              # Better Auth config (CLI)
│   └── auth.server.ts           # Better Auth config (runtime)
├── migrations/                   # Database migrations
├── scripts/                      # Dev utilities (seed users, etc.)
├── tests/                        # Playwright E2E tests
├── wrangler.jsonc               # Cloudflare configuration
└── .dev.vars                    # Local environment variables
```

## Resources

- [React Router v7 Docs](https://reactrouter.com)
- [Hono Documentation](https://hono.dev)
- [Drizzle ORM](https://orm.drizzle.team)
- [Better Auth](https://www.better-auth.com)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [shadcn/ui](https://ui.shadcn.com)
