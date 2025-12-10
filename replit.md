# Community HQ - Membership Management Application

## Overview

Community HQ is a mobile-first membership management web application for invite-only communities. The system manages a GPI (Guest-Pass-Invitation) chain tracking who invited whom, a 5-level member hierarchy with promotion voting workflows, and an admin dashboard for community oversight. Built as a full-stack TypeScript application with React frontend and Express backend using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled via Vite
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **State Management**: TanStack Query (React Query) for server state with custom query client configuration
- **Routing**: Single-page application with tab-based navigation (no React Router, uses component switching)
- **Design Pattern**: Mobile-first with bottom navigation, touch-optimized 44px minimum touch targets
- **Theme Support**: Light/dark mode with CSS variables and ThemeProvider context

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Authentication**: Replit Auth integration via OpenID Connect with Passport.js
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **API Pattern**: RESTful JSON API under `/api` prefix with authentication middleware

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Managed via drizzle-kit with `db:push` command

### Core Domain Models
- **Users**: Members with levels 1-5, status tracking, invitation relationships
- **Invite Links**: Tokenized invitation system with usage tracking
- **Promotion Requests**: Workflow for level advancement proposals
- **Votes**: Voting system for promotion approvals
- **User Level History**: Audit trail for level changes

### Visibility Rules (enforced at API and UI levels)
- **Level-based visibility**: Users can only see members whose level is ≤ their own level
- **Email privacy**: Emails are only visible to Level 5 users. No one below Level 5 can see any email addresses
- **Basic info**: All users can see name/handle and level of visible members
- **Enforcement**: These rules are enforced in `server/routes.ts` via `sanitizeUser()` and `filterAndSanitizeUsers()` helper functions

### Build System
- **Development**: Vite dev server with HMR, tsx for server
- **Production**: esbuild for server bundling, Vite for client build
- **Output**: `dist/` directory with `dist/public/` for static assets

### Path Aliases
- `@/*` → `./client/src/*` (frontend code)
- `@shared/*` → `./shared/*` (shared types and schemas)
- `@assets` → `./attached_assets` (static assets)

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Session Table**: `sessions` table for express-session persistence

### Authentication
- **Replit Auth**: OpenID Connect provider at `https://replit.com/oidc`
- **Required Environment Variables**:
  - `DATABASE_URL`: PostgreSQL connection string
  - `REPL_ID`: Replit deployment identifier
  - `SESSION_SECRET`: Session encryption key
  - `ISSUER_URL`: OIDC provider URL (defaults to Replit)

### UI Components
- **Radix UI**: Headless component primitives for accessibility
- **shadcn/ui**: Pre-built component library configured in `components.json`
- **Lucide React**: Icon library
- **React Icons**: Additional icon sets (Google logo)

### Utilities
- **date-fns**: Date formatting and manipulation
- **zod**: Runtime type validation
- **nanoid**: Unique ID generation for invite tokens
- **class-variance-authority**: Component variant styling