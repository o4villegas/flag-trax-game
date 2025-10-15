# Flag Capture Game - Development Guide

## Project Overview

A competitive social game where players capture physical flags marked with QR codes. Built entirely on Cloudflare Workers platform.

**Tech Stack:**
- **Backend**: Hono framework for API routes
- **Frontend**: React Router v7 with SSR
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Storage**: Cloudflare R2 for photo uploads
- **Auth**: Better Auth with Drizzle adapter
- **UI**: Tailwind CSS v4 + shadcn-ui (dark mode standard)
- **Build**: Vite with Cloudflare Workers integration
- **QR Scanning**: `@yudiel/react-qr-scanner`
- **QR Generation**: `qrcode` library (server-side)
- **Testing**: Playwright for E2E tests

**Target Device**: Mobile-first (QR scanning use case with camera access)
**Design Standard**: Dark mode by default (no light mode toggle needed for MVP)

## Current Repository Structure

```
├── app/                        # React Router application
│   ├── routes/                 # Route components
│   │   └── home.tsx           # Homepage route
│   ├── routes.ts              # Route configuration
│   ├── root.tsx               # Root layout with ErrorBoundary
│   ├── entry.server.tsx       # SSR handler
│   └── app.css                # Global styles
├── workers/                    # Hono backend
│   └── app.ts                 # Worker entry point (add API routes here)
├── public/                     # Static assets
├── wrangler.jsonc             # Cloudflare configuration
├── react-router.config.ts     # React Router config (SSR enabled)
├── vite.config.ts             # Build configuration
└── package.json               # Dependencies
```

## Development Commands

```bash
# Local development with hot reload
npm run dev

# Type generation for Cloudflare bindings
npm run cf-typegen

# Type checking
npm run typecheck

# Production build
npm run build

# Deploy to Cloudflare Workers
npm run deploy
```

## Phase 1: Database & Auth Setup

### Step 1: Install Dependencies

```bash
# Production dependencies
npm install drizzle-orm better-auth qrcode date-fns @yudiel/react-qr-scanner
npm install @hookform/resolvers react-hook-form zod class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-dialog @radix-ui/react-tabs
npm install @radix-ui/react-toast @radix-ui/react-select lucide-react

# Development dependencies
npm install -D drizzle-kit better-sqlite3 @types/better-sqlite3 @playwright/test
```

### Step 1a: Initialize shadcn-ui

```bash
npx shadcn@latest init
```

When prompted:
- **Style**: Default
- **Base color**: Slate
- **CSS variables**: Yes
- **Tailwind config**: Use existing (already have v4)
- **Import alias**: `@/`
- **React Server Components**: No

This creates:
- `components.json` - shadcn config
- `lib/utils.ts` - cn() utility function
- Updates `tailwind.config.ts` with shadcn theme

### Step 1b: Install shadcn Components

```bash
npx shadcn@latest add button input textarea label form card badge table dialog tabs toast skeleton select
```

This installs to `app/components/ui/` with dark mode as default.

### Step 2: Create D1 Database & R2 Bucket

```bash
# Create D1 database
npx wrangler d1 create flag-capture-db

# Create R2 bucket for photos
npx wrangler r2 bucket create flag-photos
```

Copy the database ID from output and update `wrangler.jsonc`:

```jsonc
{
  "name": "flag-trax-game",
  "main": "./workers/app.ts",
  "compatibility_date": "2025-10-08",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "flag-capture-db",
      "database_id": "<your-database-id-here>"
    }
  ],
  "r2_buckets": [
    {
      "binding": "PHOTOS",
      "bucket_name": "flag-photos"
    }
  ]
}
```

### Step 3: Environment Variables & Path Aliases

Create `.dev.vars` in project root:

```bash
BETTER_AUTH_SECRET="<generate-32-byte-random-string>"
BETTER_AUTH_URL="http://localhost:5173"
ADMIN_EMAIL="your-admin@example.com"
```

For production, set these in Cloudflare dashboard as secrets/vars.

**Configure Path Aliases**: Update `tsconfig.json` to support `@/` imports:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./app/*"]
    }
  }
}
```

### Step 4: Database Schema

Create `db/schema.ts`:

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Users table (managed by Better Auth, but can reference)
export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  name: text("name"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

// Flag Requests table
export const flagRequests = sqliteTable("flag_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .default("pending")
    .notNull(),
  requestedAt: text("requested_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  processedAt: text("processed_at"),
  processedByAdminEmail: text("processed_by_admin_email"),
});

// Flags table
export const flags = sqliteTable("flags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  flagNumber: integer("flag_number").notNull().unique(),
  currentOwnerId: text("current_owner_id")
    .notNull()
    .references(() => users.id),
  originalRequesterId: text("original_requester_id")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  lastCapturedAt: text("last_captured_at"),
});

// Captures table
export const captures = sqliteTable("captures", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  flagId: integer("flag_id")
    .notNull()
    .references(() => flags.id, { onDelete: "cascade" }),
  capturedByUserId: text("captured_by_user_id")
    .notNull()
    .references(() => users.id),
  capturedAt: text("captured_at").notNull(),
  notes: text("notes"),
  photoUrl: text("photo_url"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});
```

### Step 5: Drizzle Configuration

Create `drizzle.config.ts` in project root:

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    wranglerConfigPath: "./wrangler.jsonc",
    dbName: "flag-capture-db",
  },
} satisfies Config;
```

### Step 6: Generate and Apply Migrations

```bash
# Generate migration
npx drizzle-kit generate

# Apply to local dev database
npx wrangler d1 execute flag-capture-db --local --file=./migrations/0000_*.sql

# Apply to production (after testing)
npx wrangler d1 execute flag-capture-db --remote --file=./migrations/0000_*.sql
```

## Phase 2: Better Auth Integration

### The CLI Challenge & Two-Config Solution

Better Auth CLI cannot access Cloudflare Workers bindings. Solution: Use two separate auth configs.

### Build-Time Config (for CLI)

Create `auth/auth.cli.ts`:

```typescript
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/better-sqlite3";

const sqlite = new Database(".wrangler/state/v3/d1/miniflare-D1DatabaseObject/flag-capture-db.sqlite");
const db = drizzle(sqlite);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
  },
  secret: process.env.BETTER_AUTH_SECRET || "dummy-secret-for-cli",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5173",
});
```

### Generate Better Auth Schema

```bash
npx better-auth generate --config auth/auth.cli.ts
```

This creates a migration file. Apply it:

```bash
npx wrangler d1 execute flag-capture-db --local --file=<better-auth-migration-file>
```

### Runtime Config (for Workers)

Create `auth/auth.server.ts`:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";

export function createAuth(DB: D1Database) {
  const db = drizzle(DB);
  
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24,
    },
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL!,
  });
}
```

### Update Worker Types

Update `worker-configuration.d.ts`:

```typescript
interface Env {
  DB: D1Database;
  PHOTOS: R2Bucket;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  ADMIN_EMAIL: string;
}
```

## Phase 3: Backend API Structure

### Update workers/app.ts

```typescript
import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { createAuth } from "../auth/auth.server";

const app = new Hono<{ Bindings: Env }>();

// Initialize auth on each request
app.use("*", async (c, next) => {
  c.set("auth", createAuth(c.env.DB));
  await next();
});

// Mount Better Auth routes
app.on(["POST", "GET"], "/api/auth/*", async (c) => {
  const auth = c.get("auth");
  return auth.handler(c.req.raw);
});

// Example API route - Flag Requests
app.post("/api/flag-requests", async (c) => {
  const auth = c.get("auth");
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // TODO: Create flag request in database
  return c.json({ success: true });
});

// Photo Upload Endpoint
app.post("/api/upload-photo", async (c) => {
  const auth = c.get("auth");
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const formData = await c.req.formData();
  const file = formData.get("photo") as File;

  if (!file) {
    return c.json({ error: "No photo provided" }, 400);
  }

  // Generate unique filename
  const filename = `${crypto.randomUUID()}-${file.name}`;

  // Upload to R2
  await c.env.PHOTOS.put(filename, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
  });

  return c.json({ photoUrl: `/photos/${filename}` });
});

// Serve photos from R2
app.get("/photos/:filename", async (c) => {
  const filename = c.req.param("filename");
  const object = await c.env.PHOTOS.get(filename);

  if (!object) {
    return c.json({ error: "Photo not found" }, 404);
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "image/jpeg",
      "Cache-Control": "public, max-age=31536000",
    },
  });
});

// Admin: Generate QR Code
app.get("/api/admin/generate-qr/:flagNumber", async (c) => {
  const auth = c.get("auth");
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session || session.user.email !== c.env.ADMIN_EMAIL) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const flagNumber = c.req.param("flagNumber");
  const QRCode = (await import("qrcode")).default;

  // Generate QR code as data URL
  const url = `${c.env.BETTER_AUTH_URL}/flag/${flagNumber}`;
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 512,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  return c.json({ qrDataUrl, url });
});

// Admin API routes (with auth check)
app.get("/api/admin/flag-requests", async (c) => {
  const auth = c.get("auth");
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session || session.user.email !== c.env.ADMIN_EMAIL) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // TODO: Get flag requests
  return c.json({ requests: [] });
});

// React Router catch-all (must be LAST)
app.get("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

export default app;
```

## Phase 4: Frontend Auth Integration

### Install Better Auth Client

```bash
npm install better-auth
```

### Create Auth Client

Create `app/lib/auth.client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.BETTER_AUTH_URL || window.location.origin,
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

### Create Auth Context

Create `app/context/auth.tsx`:

```typescript
import { createContext, useContext } from "react";
import { useSession } from "../lib/auth.client";

interface AuthContextType {
  session: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  
  const isAuthenticated = !!session?.user;
  const isAdmin = session?.user?.email === import.meta.env.ADMIN_EMAIL;
  
  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated,
        isLoading: isPending,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

### Wrap App with AuthProvider & Toast

Update `app/root.tsx`:

```typescript
import { AuthProvider } from "./context/auth";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
```

## Phase 5: Route Configuration

React Router v7 uses a central route configuration file (`app/routes.ts`) rather than file-based routing.

### Update app/routes.ts

```typescript
import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  // Public routes
  index("routes/home.tsx"),
  route("sign-in", "routes/auth/sign-in.tsx"),
  route("sign-up", "routes/auth/sign-up.tsx"),
  
  // Protected routes (add auth check in loader)
  route("request-flag", "routes/request-flag.tsx"),
  route("my-stats", "routes/my-stats.tsx"),
  route("flag/:flagNumber", "routes/flag.tsx"),
  route("capture-success/:flagNumber", "routes/capture-success.tsx"),
  
  // Admin routes (add admin check in loader)
  route("admin", "routes/admin/dashboard.tsx"),
] satisfies RouteConfig;
```

### Protected Route Pattern

Use loaders for auth checks:

```typescript
// In any protected route component
import type { Route } from "./+types/my-stats";
import { redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  // Check session via cookie or fetch /api/auth/session
  const session = await checkSession(request);

  if (!session) {
    throw redirect("/sign-in");
  }

  return { user: session.user };
}

export default function MyStats({ loaderData }: Route.ComponentProps) {
  return <div>Welcome {loaderData.user.name}</div>;
}
```

### Admin Route Protection

Admin routes check email match against `ADMIN_EMAIL`:

```typescript
// app/routes/admin/dashboard.tsx
import type { Route } from "./+types/dashboard";
import { redirect } from "react-router";

export async function loader({ request, context }: Route.LoaderArgs) {
  const session = await checkSession(request);

  if (!session) {
    throw redirect("/sign-in");
  }

  // Admin check - email must match ADMIN_EMAIL env var
  const adminEmail = context.cloudflare.env.ADMIN_EMAIL;
  if (session.user.email !== adminEmail) {
    throw redirect("/"); // Non-admins redirected to homepage
  }

  return { user: session.user };
}
```

### Admin Navigation Pattern

Show admin link conditionally in nav:

```typescript
// app/components/Navigation.tsx
import { useAuth } from "@/context/auth";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function Navigation() {
  const { isAuthenticated, isAdmin, session } = useAuth();

  return (
    <nav className="border-b border-gray-800 bg-gray-900">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Flag Capture</Link>

        <div className="flex gap-4 items-center">
          {isAuthenticated ? (
            <>
              <Link to="/my-stats">
                <Button variant="ghost">My Stats</Button>
              </Link>
              <Link to="/request-flag">
                <Button variant="ghost">Request Flag</Button>
              </Link>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline">Admin Dashboard</Button>
                </Link>
              )}
              <span className="text-sm text-gray-400">{session?.user?.email}</span>
            </>
          ) : (
            <>
              <Link to="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/sign-up">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
```

## Phase 6: API Endpoints & Components

### User Endpoints (require auth)
- `POST /api/flag-requests` - Create flag request
- `GET /api/flag-requests/my-requests` - Get user's requests
- `GET /api/flags/:flagNumber` - Get flag details with captures (paginated)
- `POST /api/captures` - Record capture with optional photo (validates not own flag)
- `POST /api/upload-photo` - Upload photo to R2, returns photoUrl
- `GET /api/user/stats` - Get user capture count, owned flags, history

### Admin Endpoints (require admin)
- `GET /api/admin/flag-requests?status=pending` - Filter requests
- `POST /api/admin/approve-request/:id` - Approve (atomic transaction)
- `POST /api/admin/reject-request/:id` - Reject request
- `GET /api/admin/flags?page=1&limit=50` - List flags (paginated)
- `GET /api/admin/generate-qr/:flagNumber` - Generate QR code as data URL (PNG)
- `DELETE /api/admin/flags/:id` - Delete flag (cascades to captures)
- `DELETE /api/admin/captures/:id` - Delete capture (reverts ownership)
- `GET /api/admin/stats` - Dashboard stats

### Public Endpoints (no auth)
- `GET /api/public/recent-activity` - Last 20 captures with user names
- `GET /photos/:filename` - Serve photos from R2

### Pages to Build (with shadcn-ui)

1. **Sign-in/Sign-up** - `Form` + `Input` + `Button` + `Label` + `Card`
2. **Homepage** - `Card` for recent activity feed + hero section
3. **Request Flag** - `Button` + `Card` for request history + `Badge` for status
4. **Flag Page** - `Card` + QR scanner + `Form` + `Input` (file) + `Textarea` + `Table` for history
5. **Capture Success** - Confetti + photo display in `Card` + redirect timer
6. **My Stats** - `Card` grid + `Table` for capture history + `Badge` for owned flags
7. **Admin Dashboard** - `Tabs` + `Table` + `Dialog` for QR display + `Badge` + `Button` (delete actions)

### QR Scanner Component Pattern
```typescript
// app/components/QRScanner.tsx
import { QrScanner } from '@yudiel/react-qr-scanner';

export function QRScanner({ onScan }: { onScan: (flagNumber: string) => void }) {
  const handleScan = (result: string) => {
    // Extract flag number from URL: https://example.com/flag/123 -> "123"
    const match = result.match(/\/flag\/(\d+)/);
    if (match) {
      onScan(match[1]);
    }
  };

  return (
    <div className="w-full aspect-square max-w-md mx-auto">
      <QrScanner
        onDecode={handleScan}
        onError={(error) => console.error(error)}
      />
    </div>
  );
}
```

### Photo Upload Pattern
```typescript
// Upload photo before submitting capture
const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch("/api/upload-photo", {
    method: "POST",
    body: formData,
  });

  const { photoUrl } = await response.json();
  setPhotoUrl(photoUrl);
};
```

## Phase 7: Key Implementation Patterns

### Atomic Flag Approval (Transaction Pattern)

```typescript
import { drizzle } from "drizzle-orm/d1";
import { flags, flagRequests } from "../../db/schema";
import { eq, max } from "drizzle-orm";

app.post("/api/admin/approve-request/:id", async (c) => {
  const requestId = parseInt(c.req.param("id"));
  const db = drizzle(c.env.DB);
  
  // Use transaction for atomic flag number generation
  const result = await db.transaction(async (tx) => {
    // 1. Verify request exists and is pending
    const [request] = await tx
      .select()
      .from(flagRequests)
      .where(eq(flagRequests.id, requestId));
    
    if (!request || request.status !== "pending") {
      throw new Error("Invalid request");
    }
    
    // 2. Get next flag number atomically
    const [maxFlag] = await tx
      .select({ max: max(flags.flagNumber) })
      .from(flags);
    
    const nextFlagNumber = (maxFlag?.max ?? 0) + 1;
    
    // 3. Create flag
    await tx.insert(flags).values({
      flagNumber: nextFlagNumber,
      currentOwnerId: request.userId,
      originalRequesterId: request.userId,
    });
    
    // 4. Update request status
    await tx
      .update(flagRequests)
      .set({
        status: "approved",
        processedAt: new Date().toISOString(),
        processedByAdminEmail: c.env.ADMIN_EMAIL,
      })
      .where(eq(flagRequests.id, requestId));
    
    return nextFlagNumber;
  });
  
  return c.json({ success: true, flagNumber: result });
});
```

### Capture Deletion with Ownership Reversion

```typescript
app.delete("/api/admin/captures/:id", async (c) => {
  const captureId = parseInt(c.req.param("id"));
  const db = drizzle(c.env.DB);
  
  await db.transaction(async (tx) => {
    // 1. Get capture to find flag
    const [capture] = await tx
      .select()
      .from(captures)
      .where(eq(captures.id, captureId));
    
    if (!capture) throw new Error("Capture not found");
    
    // 2. Delete capture
    await tx.delete(captures).where(eq(captures.id, captureId));
    
    // 3. Find previous capture
    const [previousCapture] = await tx
      .select()
      .from(captures)
      .where(eq(captures.flagId, capture.flagId))
      .orderBy(desc(captures.capturedAt))
      .limit(1);
    
    // 4. Update flag ownership
    if (previousCapture) {
      await tx
        .update(flags)
        .set({
          currentOwnerId: previousCapture.capturedByUserId,
          lastCapturedAt: previousCapture.capturedAt,
        })
        .where(eq(flags.id, capture.flagId));
    } else {
      // Revert to original requester
      const [flag] = await tx
        .select()
        .from(flags)
        .where(eq(flags.id, capture.flagId));
      
      await tx
        .update(flags)
        .set({
          currentOwnerId: flag.originalRequesterId,
          lastCapturedAt: null,
        })
        .where(eq(flags.id, capture.flagId));
    }
  });
  
  return c.json({ success: true });
});
```

## Phase 8: Testing Strategy

### Playwright Setup

```bash
# Initialize Playwright
npx playwright install
```

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Key Test Scenarios (tests/)

1. **auth.spec.ts** - Sign up, sign in, session persistence
2. **flag-request.spec.ts** - User requests flag, admin approves, QR generates
3. **capture.spec.ts** - User captures flag with photo, ownership transfers
4. **admin.spec.ts** - Admin deletes capture, ownership reverts correctly
5. **edge-cases.spec.ts** - Cannot capture own flag, 404 for invalid flags

### Testing Workflow
1. Build feature
2. Write Playwright tests
3. Run tests locally: `npx playwright test`
4. Fix failures
5. Deploy to production
6. Manual mobile testing (QR scanning, camera, touch interactions)

## Phase 9: Design System (shadcn-ui Dark Mode)

### Dark Mode Configuration

shadcn-ui uses CSS variables for theming. Update `app/app.css`:

```css
@import "tailwindcss";

@layer base {
  :root {
    /* Dark mode as default - shadcn variables */
    --background: 0 0% 6%; /* #0f0f0f */
    --foreground: 0 0% 100%; /* #ffffff */

    --card: 0 0% 10%; /* #1a1a1a */
    --card-foreground: 0 0% 100%;

    --popover: 0 0% 6%;
    --popover-foreground: 0 0% 100%;

    --primary: 217 91% 60%; /* Blue #3b82f6 */
    --primary-foreground: 0 0% 100%;

    --secondary: 0 0% 14%; /* #242424 */
    --secondary-foreground: 0 0% 100%;

    --muted: 0 0% 14%;
    --muted-foreground: 0 0% 63%; /* #a0a0a0 */

    --accent: 0 0% 14%;
    --accent-foreground: 0 0% 100%;

    --destructive: 0 84% 60%; /* Red #ef4444 */
    --destructive-foreground: 0 0% 100%;

    --border: 0 0% 25%; /* #404040 */
    --input: 0 0% 25%;
    --ring: 217 91% 60%;

    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Component Usage Examples

**Sign-in Form:**
```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";

export default function SignIn() {
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    // Handle sign in
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Admin Dashboard with Tabs:**
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminDashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending Requests</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="flags">Flags</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>user@example.com</TableCell>
                <TableCell><Badge variant="outline">Pending</Badge></TableCell>
                <TableCell>
                  <Button size="sm">Approve</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Mobile Touch Targets

shadcn-ui components already meet accessibility standards, but ensure:
- Minimum 44px touch targets (already in Button component)
- Input font-size 16px minimum (prevents iOS zoom on focus)
- Adequate spacing between interactive elements

```tsx
// Enforce minimum input size in custom CSS
input, textarea {
  font-size: 16px; /* Prevents iOS zoom */
}
```

## Phase 10: Testing Checklist

### Complete User Journey

- [ ] Create account and sign in
- [ ] Request flag as user
- [ ] Sign in as admin and approve request
- [ ] Verify flag number generated correctly
- [ ] Generate QR code for flag
- [ ] Create second user account
- [ ] Visit flag page (simulate QR scan)
- [ ] Record capture with date and notes
- [ ] Verify ownership transferred
- [ ] Create third user and capture same flag
- [ ] Verify multiple captures tracked correctly

### Admin Functions

- [ ] Delete a capture and verify ownership reverts
- [ ] Reject a flag request
- [ ] Delete a flag (cascades to captures)
- [ ] View statistics dashboard

### Edge Cases

- [ ] Try to capture own flag (should error)
- [ ] Access admin routes as non-admin (should 403)
- [ ] Visit non-existent flag number (should 404)
- [ ] Submit capture with invalid date
- [ ] Check session expiry after 7 days

## Phase 11: Deployment

### Production Environment Setup

In Cloudflare dashboard:

1. **Set Environment Variables:**
   - `BETTER_AUTH_SECRET` (use secret, not var)
   - `BETTER_AUTH_URL` (your production URL)
   - `ADMIN_EMAIL`

2. **Apply Migrations to Production:**
   ```bash
   npx wrangler d1 execute flag-capture-db --remote --file=./migrations/0000_*.sql
   npx wrangler d1 execute flag-capture-db --remote --file=<better-auth-migration>
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

### Post-Deployment Testing

- [ ] Visit production URL
- [ ] Sign up for test account
- [ ] Request flag
- [ ] Sign in as admin
- [ ] Approve request
- [ ] Generate QR code
- [ ] Scan QR with phone camera (test camera permissions)
- [ ] Record capture with photo upload
- [ ] Verify data persistence
- [ ] Test photo retrieval from R2

## Critical Implementation Notes

### Admin Access Pattern

**No separate admin registration.** Admins are regular users whose email matches `ADMIN_EMAIL`:
1. User signs up with email (e.g., `admin@example.com`)
2. Set `ADMIN_EMAIL=admin@example.com` in environment
3. On sign-in, app checks `session.user.email === ADMIN_EMAIL`
4. If true, `isAdmin` flag is set in auth context
5. Admin navigation link appears, `/admin` route is accessible
6. Non-admins redirected to homepage if they try to access `/admin`

### File Path Corrections from Original Document

**Actual Structure:**
- React Router routes: `app/routes/` (not `src/react-app/src/routes`)
- Worker code: `workers/app.ts` (not `src/worker/index.ts`)
- Route config: `app/routes.ts` (React Router v7 uses config file, not file-based routing)
- shadcn-ui components: `app/components/ui/` (via `@/components/ui/*` alias)

### Transaction Usage is Critical

Always use transactions for:
1. **Flag approval** - atomic flag number generation prevents duplicates
2. **Capture deletion** - atomic ownership reversion maintains consistency
3. Any multi-step operation requiring data consistency

### Better Auth Two-Config Pattern

- **Build-time config** (`auth/auth.cli.ts`): Uses better-sqlite3, for CLI only
- **Runtime config** (`auth/auth.server.ts`): Uses D1, for actual Workers runtime
- Never mix them - CLI can't access Workers bindings

### API Route Order Matters

In `workers/app.ts`, API routes MUST come before the React Router catch-all:

```typescript
app.post("/api/*")  // ✅ Processed first
app.get("*")        // ✅ Catch-all last (React Router)
```

### QR Code Generation

QR codes encode the full URL: `https://yourapp.com/flag/123`
- Generated on-demand via admin endpoint
- Returned as base64 data URL
- Admin can download as PNG and print
- Size: 512x512px with 2-unit margin for printing

### Photo Upload Best Practices

- Max file size: 5MB (enforce client-side and server-side)
- Accepted formats: JPEG, PNG, WebP
- Use shadcn Input with file type: `<Input type="file" accept="image/*" capture="environment" />`
- Store original filename in metadata
- R2 serves photos with long cache headers (1 year)

### shadcn-ui Dark Mode

- Dark mode is the **only** mode for MVP (no toggle needed)
- All components use CSS variables from `app.css`
- `--background: 0 0% 6%` gives #0f0f0f (very dark)
- `--card: 0 0% 10%` gives #1a1a1a (elevated surfaces)
- `--primary: 217 91% 60%` gives blue accent
- Consistent with mobile-first, low-light usage patterns

## Success Criteria

MVP is complete when:

✅ Users can sign up/sign in with email/password
✅ Sessions expire after 7 days
✅ Users can request flags
✅ Admins can approve/reject requests
✅ Flag numbers are sequential and atomic
✅ Admins can generate downloadable QR codes (PNG)
✅ Authenticated users can scan QR codes with camera
✅ Users can record captures with date/notes/photos
✅ Photos upload to R2 and display in history
✅ Ownership transfers on capture
✅ Users cannot capture own flags (API validated)
✅ Capture history shows with pagination and photos
✅ Homepage shows recent activity feed
✅ Users can view personal stats with photo history
✅ Admin can delete flags and captures
✅ Ownership reverts correctly on capture deletion
✅ Dark mode styling throughout
✅ Mobile-first responsive design
✅ Confetti animation on capture success
✅ Playwright tests cover critical flows
✅ All working in production  

## Resources

- [React Router v7 Docs](https://reactrouter.com)
- [Hono Documentation](https://hono.dev)
- [Drizzle ORM](https://orm.drizzle.team)
- [Better Auth](https://www.better-auth.com)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)

---

**Development Time Estimate:** 2-3 days for experienced developer  
**Last Updated:** Based on actual repository structure as of current state
