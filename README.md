# Flag Capture Game 🚩

A competitive social game where players capture physical flags marked with QR codes, built entirely on Cloudflare's edge platform.

## Features

### For Players
- 📱 **QR Code Scanning** - Capture flags using your phone's camera
- 📸 **Photo Uploads** - Document your captures with photos stored in R2
- 📊 **Personal Stats** - Track flags owned, total captures, and request history
- 📅 **Capture History** - View complete timeline with dates, notes, and photos
- 🎉 **Celebration Animations** - Confetti animation on successful captures

### For Admins
- ✅ **Request Management** - Approve/reject flag requests with one click
- 🔲 **QR Code Generation** - Downloadable QR codes for physical flags
- 📋 **Complete Dashboard** - Manage flags, captures, and requests in one place
- 🗑️ **Data Management** - Delete flags and captures with automatic ownership reversion

### Technical Highlights
- ⚡ **Blazing Fast** - Deployed on Cloudflare's global edge network
- 🔒 **Secure Authentication** - Better Auth with email/password and 7-day sessions
- 🔄 **Atomic Transactions** - Sequential flag numbers and safe ownership transfers
- 📱 **Mobile-First** - Optimized for mobile devices and QR scanning
- 🎨 **Modern UI** - shadcn/ui components with dark mode design

## Tech Stack

### Frontend
- **React Router v7** - Full-stack framework with SSR
- **React 19** - Latest React with concurrent features
- **shadcn/ui** - Beautiful, accessible component library
- **Tailwind CSS v4** - Utility-first CSS framework
- **@yudiel/react-qr-scanner** - QR code scanning with camera access
- **canvas-confetti** - Celebration animations

### Backend
- **Hono** - Fast, lightweight web framework
- **Better Auth** - Modern authentication with Drizzle adapter
- **Drizzle ORM** - Type-safe ORM with SQLite/D1 support
- **QRCode** - QR code generation for printable flags

### Infrastructure
- **Cloudflare Workers** - Serverless edge compute
- **Cloudflare D1** - SQLite database at the edge
- **Cloudflare R2** - S3-compatible object storage for photos
- **Vite** - Next-generation build tool

## Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Cloudflare account (free tier works)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd flag-trax-game

# Install dependencies
npm install

# Set up environment variables
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your values
```

### Database Setup

```bash
# Create local D1 database
npx wrangler d1 create flag-capture-db

# Update wrangler.jsonc with the database_id

# Generate database schema
npx drizzle-kit generate

# Apply migrations locally
npx wrangler d1 execute flag-capture-db --local --file=./migrations/0000_*.sql
```

### R2 Bucket Setup

```bash
# Create R2 bucket
npx wrangler r2 bucket create flag-photos

# Verify it exists
npx wrangler r2 bucket list
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:5173
```

### Testing

```bash
# Run Playwright tests
npm test

# Run tests with UI
npm test:ui
```

### Build & Deploy

```bash
# Build for production
npm run build

# Type check
npm run typecheck

# Deploy to Cloudflare Workers
npm run deploy
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

```
flag-trax-game/
├── app/                          # Frontend application
│   ├── routes/                   # React Router routes
│   │   ├── home.tsx             # Landing page
│   │   ├── auth/                # Authentication pages
│   │   ├── flag.tsx             # Flag detail + QR scanner
│   │   ├── request-flag.tsx     # Flag request form
│   │   ├── my-stats.tsx         # User statistics
│   │   ├── capture-success.tsx  # Success page with confetti
│   │   └── admin/               # Admin dashboard
│   ├── components/ui/           # shadcn/ui components
│   ├── context/                 # React contexts (Auth)
│   ├── lib/                     # Utilities and auth client
│   └── routes.ts                # Route configuration
├── workers/                      # Backend API
│   └── app.ts                   # Hono server with all endpoints
├── db/                          # Database layer
│   └── schema.ts                # Drizzle schema definitions
├── auth/                        # Authentication configs
│   ├── auth.cli.ts              # CLI config (better-sqlite3)
│   └── auth.server.ts           # Runtime config (D1)
├── migrations/                  # Database migrations
├── tests/                       # Playwright tests
├── public/                      # Static assets
├── wrangler.jsonc              # Cloudflare configuration
└── playwright.config.ts        # Test configuration
```

## API Endpoints

### Public
- `POST /api/auth/*` - Better Auth routes (sign-in, sign-up, etc.)

### Protected (Requires Authentication)
- `POST /api/photos` - Upload photo to R2
- `POST /api/flag-requests` - Create flag request
- `GET /api/flag-requests` - Get user's flag requests
- `GET /api/flags/:flagNumber` - Get flag details with history
- `GET /api/flags/mine` - Get flags owned by user
- `POST /api/captures` - Record flag capture (atomic transaction)
- `GET /api/captures/:flagId` - Get capture history
- `GET /api/stats/me` - Get user statistics

### Admin Only
- `GET /api/admin/flag-requests` - Get all flag requests
- `POST /api/admin/flag-requests/:id/approve` - Approve request (creates flag)
- `POST /api/admin/flag-requests/:id/reject` - Reject request
- `GET /api/admin/flags` - Get all flags
- `DELETE /api/admin/flags/:id` - Delete flag (cascades to captures)
- `GET /api/admin/captures` - Get all captures
- `DELETE /api/admin/captures/:id` - Delete capture (reverts ownership)

## Database Schema

### Tables
- **user** - User accounts (Better Auth)
- **session** - Active sessions (Better Auth)
- **account** - OAuth accounts (Better Auth)
- **verification** - Email verification (Better Auth)
- **flag_requests** - Flag creation requests
- **flags** - Physical flags with ownership tracking
- **captures** - Capture events with photos and notes

### Key Features
- Sequential flag numbers (atomic via transactions)
- Cascade delete on flags → captures
- Ownership reversion on capture deletion
- Referential integrity enforced

## Environment Variables

### Development (.dev.vars)
```bash
BETTER_AUTH_SECRET="<32-byte-random-string>"
BETTER_AUTH_URL="http://localhost:5173"
ADMIN_EMAIL="admin@example.com"
```

### Production (Cloudflare Dashboard)
- `BETTER_AUTH_SECRET` - Set as **Secret**
- `BETTER_AUTH_URL` - Your production URL
- `ADMIN_EMAIL` - Admin user email

## Contributing

This is a personal project, but suggestions and bug reports are welcome!

## License

MIT

## Credits

Built with:
- [React Router](https://reactrouter.com)
- [Hono](https://hono.dev)
- [Better Auth](https://better-auth.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [shadcn/ui](https://ui.shadcn.com)
- [Cloudflare](https://cloudflare.com)

---

**Happy Flag Capturing!** 🚩
