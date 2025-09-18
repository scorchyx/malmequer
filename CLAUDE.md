# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server with Turbopack (project uses pnpm)
- `pnpm build` - Build production application with Turbopack
- `pnpm start` - Start production server
- `pnpm test` - Run test suite with Jest
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report (requires 70% coverage threshold)
- `pnpm test -- __tests__/api/cart.test.ts` - Run specific test file
- `pnpm lint` - Run ESLint checks
- `pnpm type-check` - Run TypeScript type checking
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
- **NotificationSettings**: User preferences for email notifications

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
- `/api/register` - User registration (sends welcome email)
- `/api/products` - Product CRUD with filtering and pagination
- `/api/categories` - Category management
- `/api/cart` - Shopping cart operations (requires authentication)
- `/api/orders` - Order management (requires authentication)
- `/api/payments` - Stripe payment processing with email notifications
- `/api/admin` - Admin panel endpoints (requires ADMIN role)
- `/api/wishlist` - User wishlist management
- `/api/notifications` - Email notification system and testing
- `/api/user/notification-settings` - User notification preferences
- `/api/docs` - OpenAPI specification endpoint
- `/docs` - Interactive Swagger UI documentation

## Email Notification System

- **Service**: Resend for email delivery with React Email templates
- **Templates**: Welcome, order confirmation, order shipped, password reset, stock alerts
- **Configuration**: `RESEND_API_KEY` and `FROM_EMAIL` in `.env`
- **User Preferences**: Individual users can control notification types
- **Automatic Triggers**: Registration welcome, order confirmation, payment success

### Notification Types
- `WELCOME` - New user registration
- `ORDER_CONFIRMATION` - Order payment confirmed
- `ORDER_SHIPPED` - Order dispatched
- `PASSWORD_RESET` - Password reset request
- `STOCK_ALERT` - Product back in stock
- `PROMOTION` - Marketing emails
- `ACCOUNT_UPDATE` - Account changes

## Security & Infrastructure

### Security Features
- **Rate Limiting**: Implemented with custom middleware for API protection
- **Input Validation**: Zod schemas for all API endpoints with comprehensive validation
- **Security Headers**: CSP, HSTS, XSS protection via middleware
- **Structured Logging**: Pino-based logging with security event tracking
- **Health Checks**: `/api/health` and `/api/ready` endpoints for monitoring

### Caching & Performance
- **Redis Caching**: Implemented for products, categories, and user data
- **Database Optimization**: Comprehensive indexing strategy for queries
- **Response Caching**: 5-minute TTL for product listings and categories

### Monitoring & Observability
- **Health Endpoints**:
  - `/api/health` - Comprehensive system health check
  - `/api/ready` - Readiness probe for deployments
  - `/api/metrics` - Admin-only system metrics (requires ADMIN role)
- **Structured Logging**: Request tracking, security events, business events
- **Error Tracking**: Centralized error logging with context

### Testing & CI/CD
- **Testing Framework**: Jest with comprehensive API and unit tests
- **GitHub Actions**: Automated CI/CD with security scanning, testing, and deployment
- **Docker Support**: Multi-stage production-ready Docker builds
- **Security Scanning**: CodeQL, dependency review, secret scanning

## Development Notes

- **Package Manager**: Project uses pnpm (not npm)
- **Database Migrations**: Run `npx prisma migrate dev` after schema changes
- **Environment**: Configure `.env` with database, NextAuth, Stripe, Redis, and email variables
- **Path Aliases**: `@/*` maps to project root for clean imports
- **Testing**: Run `pnpm test` before committing changes
- **Security**: All API endpoints have input validation and rate limiting

## API Documentation

- **Swagger/OpenAPI**: Complete API documentation available at `/docs`
- **Interactive Testing**: Use Swagger UI for testing endpoints directly
- **Rate Limiting**: 30 requests/minute for general APIs, 10 requests/15min for auth

## Environment Variables

Required environment variables for development:
```
DATABASE_URL=postgresql://user:password@localhost:5432/database
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=your-resend-key
FROM_EMAIL=noreply@yourdomain.com
REDIS_URL=redis://localhost:6379
STRIPE_SECRET_KEY=sk_test_your-stripe-key
```

## Testing Architecture

- **Framework**: Jest with Next.js integration
- **Environment**: Node.js test environment with 30s timeout
- **Coverage**: Minimum 70% threshold for branches, functions, lines, statements
- **Test Location**: `__tests__/` directory with `.test.ts` or `.spec.ts` files
- **Mocking**: Comprehensive mocks for Prisma, auth, cache, and external services