# Flag Capture Game - Development Canvas

## Critical Corrections from Original Document

**File Structure (CORRECTED):**
- ✅ React app: `app/` (not `src/react-app/src`)
- ✅ Worker code: `workers/app.ts` (not `src/worker/index.ts`)
- ✅ Routes: `app/routes/` with `app/routes.ts` config file (React Router v7 uses config, not file-based)
- ✅ Route parameters: Dollar sign prefix `flag.$flagNumber.tsx` (not colon prefix)

**Current Repository State:**
- Hono + React Router v7 with SSR already configured
- Tailwind CSS v4 already integrated
- Wrangler + Vite build system working
- Clean template structure from official Cloudflare starter

## Project Overview

**Vision:** QR code-based flag capture game where players scan physical flags, record captures, transfer ownership, and compete on leaderboards.

**Stack:** Cloudflare Workers + Hono (API) + React Router v7 (SSR) + Drizzle ORM + Better Auth + D1 (SQLite)

**Target:** Mobile-first, dark mode, 7-day sessions, admin-approved flags, atomic transactions

## Phase 1: Database Setup

### Install Dependencies
```bash
npm install drizzle-orm better-auth qrcode date-fns
npm install -D drizzle-kit @better-auth/cli better-sqlite3 @types/better-sqlite3
```

### Create D1 Database
```bash
npx wrangler d1 create flag-capture-db
# Copy database_id to wrangler.jsonc
```

### Update wrangler.jsonc
```jsonc
{
  "d1_databases": [{
    "binding": "DB",
    "database_name": "flag-capture-db",
    "database_id": "<paste-id-here>"
  }]
}
```

### Environment Variables (.dev.vars)
```
BETTER_AUTH_SECRET="<32-byte-random-string>"
BETTER_AUTH_URL="http://localhost:5173"
ADMIN_EMAIL="admin@example.com"
```

### Schema (db/schema.ts)
Four tables: flagRequests, flags, captures + Better Auth user table reference
- **Critical:** flagNumber is unique and never reused
- **Critical:** captures has CASCADE delete on flagId
- All timestamps as ISO 8601 text fields
- Integer primary keys with autoincrement

### Drizzle Config (drizzle.config.ts)
```typescript
export default {
  schema: "./db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    wranglerConfigPath: "./wrangler.jsonc",
    dbName: "flag-capture-db"
  }
}
```

### Migrations
```bash
npx drizzle-kit generate
npx wrangler d1 execute flag-capture-db --local --file=./migrations/0000_*.sql
npx wrangler d1 execute flag-capture-db --remote --file=./migrations/0000_*.sql
```

## Phase 2: Better Auth (Two-Config Pattern)

### The Problem
Better Auth CLI cannot access Cloudflare Workers bindings (D1 only exists in Workers runtime).

### The Solution
**Build-time config** (`auth/auth.cli.ts`): Uses better-sqlite3 + local file for CLI
**Runtime config** (`auth/auth.server.ts`): Uses D1 + drizzle-orm/d1 for production

### Generate Schema
```bash
npx @better-auth/cli generate --config auth/auth.cli.ts
# Apply generated migration to D1
npx wrangler d1 execute flag-capture-db --local --file=<better-auth-migration>
```

### Runtime Config Pattern
```typescript
// auth/auth.server.ts
export function createAuth(DB: D1Database) {
  const db = drizzle(DB);
  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite" }),
    emailAndPassword: { enabled: true, minPasswordLength: 8 },
    session: { expiresIn: 60 * 60 * 24 * 7 }
  });
}
```

### Worker Integration (workers/app.ts)
```typescript
// Mount auth FIRST, before all other routes
app.use("*", async (c, next) => {
  c.set("auth", createAuth(c.env.DB));
  await next();
});

app.on(["POST", "GET"], "/api/auth/*", async (c) => {
  return c.get("auth").handler(c.req.raw);
});

// Add API routes here...

// React Router catch-all LAST
app.get("*", (c) => { /* React Router handler */ });
```

## Phase 3: Critical Transaction Patterns

### Atomic Flag Approval
```typescript
await db.transaction(async (tx) => {
  // 1. Verify pending request
  const [request] = await tx.select().from(flagRequests).where(eq(flagRequests.id, requestId));
  if (!request || request.status !== "pending") throw new Error("Invalid");
  
  // 2. Get next flag number atomically
  const [maxFlag] = await tx.select({ max: max(flags.flagNumber) }).from(flags);
  const nextFlagNumber = (maxFlag?.max ?? 0) + 1;
  
  // 3. Create flag
  await tx.insert(flags).values({
    flagNumber: nextFlagNumber,
    currentOwnerId: request.userId,
    originalRequesterId: request.userId
  });
  
  // 4. Update request
  await tx.update(flagRequests).set({ status: "approved", processedAt: now }).where(eq(flagRequests.id, requestId));
  
  return nextFlagNumber;
});
```

### Capture Deletion with Ownership Revert
```typescript
await db.transaction(async (tx) => {
  // 1. Get capture
  const [capture] = await tx.select().from(captures).where(eq(captures.id, captureId));
  
  // 2. Delete capture
  await tx.delete(captures).where(eq(captures.id, captureId));
  
  // 3. Find previous capture (if exists)
  const [prev] = await tx.select().from(captures)
    .where(eq(captures.flagId, capture.flagId))
    .orderBy(desc(captures.capturedAt))
    .limit(1);
  
  // 4. Revert ownership
  if (prev) {
    await tx.update(flags).set({
      currentOwnerId: prev.capturedByUserId,
      lastCapturedAt: prev.capturedAt
    }).where(eq(flags.id, capture.flagId));
  } else {
    // No captures left - revert to original requester
    const [flag] = await tx.select().from(flags).where(eq(flags.id, capture.flagId));
    await tx.update(flags).set({
      currentOwnerId: flag.originalRequesterId,
      lastCapturedAt: null
    }).where(eq(flags.id, capture.flagId));
  }
});
```

## Phase 4: Frontend Auth

### Auth Client (app/lib/auth.client.ts)
```typescript
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  baseURL: import.meta.env.BETTER_AUTH_URL || window.location.origin
});
export const { signIn, signUp, signOut, useSession } = authClient;
```

### Auth Context (app/context/auth.tsx)
Provides: isAuthenticated, isLoading, isAdmin, session

### Protected Route Pattern
```typescript
// In loader function
export async function loader({ request }: Route.LoaderArgs) {
  const cookie = request.headers.get("Cookie");
  const session = await fetch("/api/auth/session", { headers: { Cookie: cookie || "" } });
  if (!session.ok) throw redirect("/sign-in");
  return { user: session.user };
}
```

### Routes (app/routes.ts)
```typescript
export default [
  index("routes/home.tsx"),
  route("sign-in", "routes/auth/sign-in.tsx"),
  route("sign-up", "routes/auth/sign-up.tsx"),
  route("request-flag", "routes/request-flag.tsx"),
  route("my-stats", "routes/my-stats.tsx"),
  route("flag/:flagNumber", "routes/flag.$flagNumber.tsx"),
  route("capture-success/:flagNumber", "routes/capture-success.$flagNumber.tsx"),
  route("admin", "routes/admin/dashboard.tsx"),
] satisfies RouteConfig;
```

## Phase 5: API Endpoints Summary

### User Endpoints (require auth)
- `POST /api/flag-requests` - Create flag request
- `GET /api/flag-requests/my-requests` - Get user's requests
- `GET /api/flags/:flagNumber` - Get flag details with captures (paginated)
- `POST /api/captures` - Record capture (validates not own flag)
- `GET /api/user/stats` - Get user capture count, owned flags, history

### Admin Endpoints (require admin)
- `GET /api/admin/flag-requests?status=pending` - Filter requests
- `POST /api/admin/approve-request/:id` - Approve (atomic transaction)
- `POST /api/admin/reject-request/:id` - Reject request
- `GET /api/admin/flags?page=1&limit=50` - List flags (paginated)
- `POST /api/admin/generate-qr/:flagNumber` - Generate QR data URL
- `DELETE /api/admin/flags/:id` - Delete flag (cascades to captures)
- `DELETE /api/admin/captures/:id` - Delete capture (reverts ownership)
- `GET /api/admin/stats` - Dashboard stats

### Public Endpoints (no auth)
- `GET /api/public/recent-activity` - Last 20 captures
- `GET /api/public/leaderboard` - Top 10 users by captures

## Phase 6: Key Components

### Pages to Build
1. **Sign-in/Sign-up** - Email/password forms with Better Auth integration
2. **Homepage** - Recent activity feed + leaderboard + hero (conditional CTAs based on auth)
3. **Request Flag** - Submit button + request history with status badges
4. **Flag Page** - Flag info + conditional capture form (not if owner) + capture history
5. **Capture Success** - Confetti animation + redirect timer
6. **My Stats** - Total captures + owned flags (clickable) + capture history
7. **Admin Dashboard** - Tabs for pending requests, all requests, flags, stats

### Design System (Tailwind + app.css)
- Dark mode: bg-[#0f0f0f], text-white
- Accents: blue-500 (primary), green-500 (success), red-500 (danger), yellow-500 (pending)
- Buttons: Gradient bg, min 44px touch targets
- Forms: 16px font-size (prevents iOS zoom)
- Cards: bg-gray-800, rounded-lg, border-gray-700

## Phase 7: Testing Checklist

### User Journey
- [ ] Sign up → Request flag → Admin approves → QR generated
- [ ] User 2 signs in → Visits flag page → Captures → Ownership transfers
- [ ] User 3 captures same flag → Multiple captures tracked
- [ ] User 1 captures flag back → Ownership returns

### Admin Functions
- [ ] Delete capture → Ownership reverts correctly
- [ ] Approve/reject requests → Atomic flag numbers
- [ ] Delete flag → Cascades to captures

### Edge Cases
- [ ] Try to capture own flag → API error
- [ ] Access admin as non-admin → 403
- [ ] Visit non-existent flag → 404
- [ ] Session expires after 7 days

## Phase 8: Deployment

```bash
# Set production environment variables in Cloudflare dashboard
# Apply migrations to remote database
npx wrangler d1 execute flag-capture-db --remote --file=./migrations/*

# Deploy
npm run deploy
```

## Critical Reminders

1. **Route Order Matters**: Auth routes → API routes → React Router catch-all (last)
2. **Always Use Transactions**: For flag approval and capture deletion
3. **Two Auth Configs**: CLI config for schema, runtime config for production
4. **Never Reuse Flag Numbers**: Use atomic MAX+1 in transaction
5. **Validate Own Flag**: API-level check prevents self-capture exploit
6. **Mobile-First**: 16px inputs, 44px touch targets, dark mode default

## Success Criteria

✅ Sequential atomic flag numbers  
✅ Cannot capture own flags (API validated)  
✅ Ownership reverts on capture deletion  
✅ 7-day sessions  
✅ Dark mode mobile-first UI  
✅ Admin dashboard with stats  
✅ Public leaderboard and activity  
✅ Confetti on capture success  

**Estimated Time:** 2-3 days for experienced developer
