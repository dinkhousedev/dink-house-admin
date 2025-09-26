# Repository Guidelines

## Project Structure & Module Organization
- `app/` houses the App Router views; `app/page.tsx` is the main dashboard scaffold.
- `components/` holds shared UI. Keep admin widgets in `components/dashboard/` to reuse the landing design language.
- `config/` centralizes fonts, metadata, and Tailwind tokens; adjust these whenever branding changes.
- `styles/globals.css` owns the athletic dark utilities—extend here rather than scattering overrides.
- `public/` stores static assets; `types/` gathers reusable TypeScript helpers.

## Build, Test, and Development Commands
- `npm run dev` starts the Turbopack dev server for iterative UI work.
- `npm run build` triggers the production Next.js build to surface bundling or type issues.
- `npm run lint` runs ESLint with auto-fixes; install `@eslint/compat` locally because the flat config requires it.

## Coding Style & Naming Conventions
- Use TypeScript for all new modules and favor named exports for reusable pieces.
- Tailwind classes should stay within the athletic palette (`bg-dink-black`, `text-dink-lime`); declare new tokens in `tailwind.config.js` first.
- HeroUI widgets expect `onPress` handlers with `radius`/`variant` props—keep JSX lean and extract non-visual logic.
- Follow camelCase for variables, PascalCase for React components, and kebab-case for route filenames.

## Testing Guidelines
- No automated suite yet; run `npm run lint` before each PR to catch type and accessibility issues.
- For UI work, capture desktop screenshots (full width plus constrained) and attach them to the PR description.
- When adding data helpers, create focused Jest or Vitest specs under `tests/` once the framework is added to `devDependencies`.

## Commit & Pull Request Guidelines
- Keep commit subjects conventional and under 72 characters (e.g., `feat: add dark dashboard layout`).
- Reference Jira/issues in the body when applicable and call out follow-up tasks.
- PRs should outline intent, list verification steps (`npm run build`, manual QA), and attach UI artifacts when layouts change.

## Desktop-Only Constraint
- Keep the `MobileRestriction` gate intact and ensure new views degrade gracefully below the `lg` breakpoint.
- Target 1920×1080 first: stretch layouts to use the wider canvas while retaining balanced margins.
- When testing, emulate widths ≥1024px or disable responsive shrinking to avoid layout noise.

## Dark Theme & Configuration Tips
- Keep the experience dark-only: ensure new components respect `tailwind.config.js` color tokens and avoid hard-coded light values.
- Leverage the utilities in `styles/globals.css` (e.g., `.court-pattern`, `.text-glow`) instead of duplicating effects, and update the config if branding colors change.
