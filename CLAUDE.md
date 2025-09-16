# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server with Turbopack (project uses pnpm)
- `pnpm build` - Build production application with Turbopack
- `pnpm start` - Start production server
- `npx prisma generate` - Generate Prisma client after schema changes
- `npx prisma migrate dev` - Create and apply database migrations
- `npx prisma studio` - Open Prisma Studio for database visualization
- `npx prisma db seed` - Seed database (if seeding is configured)

## Project Architecture

This is a **Next.js 15 ecommerce application** using the App Router architecture with full-stack capabilities:

### Backend Architecture
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials and OAuth support
- **API Routes**: RESTful APIs in `app/api/` directory
- **Database Models**: Complete ecommerce schema (users, products, orders, cart, reviews, addresses)

### Key Models & Relationships
- **User**: Authentication + profile with role-based access (USER/ADMIN)
- **Product**: Full product catalog with categories, images, variants, reviews
- **Order**: Order management with items, addresses, payment status
- **Category**: Hierarchical category structure with parent/child relationships
- **CartItem**: User shopping cart with product associations

### Frontend Stack
- **Next.js App Router**: File-based routing with server components
- **TypeScript**: Full TypeScript support with strict mode
- **Tailwind CSS v4**: Modern utility-first CSS framework
- **Turbopack**: Fast development and build bundler

## Database & Authentication

- **Database Connection**: Configured via `DATABASE_URL` in `.env`
- **Prisma Client**: Singleton instance in `lib/prisma.ts`
- **Auth Configuration**: NextAuth setup in `app/api/auth/[...nextauth]/route.ts`
- **Auth Utilities**: Session helpers in `lib/auth.ts`

## API Endpoints Structure

- `/api/auth/[...nextauth]` - NextAuth authentication endpoints
- `/api/register` - User registration
- `/api/products` - Product CRUD with filtering and pagination
- `/api/categories` - Category management
- `/api/cart` - Shopping cart operations (requires authentication)
- `/api/orders` - Order management (requires authentication)

## Development Notes

- **Package Manager**: Project uses pnpm (not npm)
- **Database Migrations**: Run `npx prisma migrate dev` after schema changes
- **Environment**: Configure `.env` with database and NextAuth variables
- **Path Aliases**: `@/*` maps to project root for clean imports