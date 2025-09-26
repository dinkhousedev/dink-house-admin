# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 admin dashboard for "Dink House" - a pickleball facility management system. Built with TypeScript, React 18, and HeroUI component library with a sports-focused athletic design system.

## Commands

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Create production build
npm run start        # Run production server
npm run lint         # Run ESLint with auto-fix
```

**Note**: No test framework is configured. If tests are needed, consider adding Vitest or Jest.

## Architecture

### Tech Stack
- **Next.js 15.3.1** with App Router (not Pages Router)
- **HeroUI v2** - Primary UI component library (40+ components)
- **Tailwind CSS 4** with custom athletic styling utilities
- **TypeScript** with strict configuration
- **Framer Motion** for animations

### Project Structure
- `app/` - Next.js App Router pages and layouts
- `components/dashboard/` - Dashboard-specific components
- `config/` - Site configuration and fonts (Inter, Fira Code, Rajdhani)
- `types/` - TypeScript type definitions

### Key Design Constraints
1. **Desktop-Only**: Application blocks screens <1024px width via `MobileRestriction` component
2. **Dark Theme Only**: Hardcoded dark mode, no light theme support
3. **Athletic Design System**: Custom Dink brand colors (Lime #B3FF00, Black #000000)
4. **HeroUI Components**: Always use HeroUI components over standard HTML/React components

### Component Patterns
- Use HeroUI's `Card`, `Button`, `Table`, `Modal`, etc. instead of creating custom versions
- Apply athletic styling via Tailwind utilities: `.text-athletic`, `.btn-athletic`, `.court-pattern`
- All text uses the custom font system: `font-sans`, `font-mono`, `font-display`

### State Management
- Server Components by default (app directory)
- Client Components only when needed (use "use client" directive)
- Theme provider wraps the application in `app/providers.tsx`

## Development Guidelines

### When Adding Features
1. Check existing HeroUI components first - the library is comprehensive
2. Follow the desktop-first approach (no mobile responsiveness needed)
3. Use the established color system (Dink Lime, Black, White, Gray)
4. Place dashboard features in `components/dashboard/`

### Common Patterns
- Navigation items are defined in `config/site.ts`
- Dashboard sidebar sections: Operations, Performance, Community
- Use `clsx` for conditional classes
- Icons via `@iconify/react`

### ESLint Rules
The project has strict linting. Always run `npm run lint` before finalizing changes. Key rules:
- Import organization enforced
- Unused imports auto-removed
- React best practices required
- TypeScript strict mode enabled