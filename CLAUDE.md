# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack (recommended)
- `npm run build` - Build production application with Turbopack
- `npm run start` - Start production server

## Project Architecture

This is a Next.js 15 application using the App Router architecture with:

- **App Directory Structure**: Uses `app/` directory for routing with `layout.tsx` and `page.tsx` files
- **TypeScript**: Full TypeScript support with strict mode enabled
- **Tailwind CSS v4**: Modern utility-first CSS framework with PostCSS integration
- **Font Optimization**: Uses Geist font family (sans and mono) with Next.js font optimization
- **Dark Mode**: CSS variables-based dark mode with `prefers-color-scheme` detection

## Key Configuration

- **Path Aliases**: `@/*` maps to project root for imports
- **Turbopack**: Development and build processes use Turbopack for faster performance
- **TypeScript Config**: Strict mode with modern ES2017 target, JSX preserve mode
- **Styling**: Tailwind v4 with inline theme configuration using CSS variables

## File Structure

- `app/layout.tsx` - Root layout with font loading and metadata
- `app/page.tsx` - Home page component
- `app/globals.css` - Global styles with Tailwind imports and CSS variables
- `next.config.ts` - Next.js configuration (minimal setup)
- `postcss.config.mjs` - PostCSS configuration for Tailwind processing