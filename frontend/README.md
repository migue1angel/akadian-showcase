# Akadian Showcase  FrontEnd

## Quick start
```bash
npm install          # package manager is npm (not pnpm/yarn)
generate the environment file | env.template -> .env   # edit API_URL as needed
npm run env          # generates src/environments/environment.ts from .env
npm start            # ng serve (dev server at http://localhost:4200)
```

## Build/deploy
- `npm run build` = `npm run env && ng build --configuration production` (env generation is a required build step)

## Test
```bash
npm test          # ng test → Vitest (via @angular/build:unit-test)
```
- Mocking: standard Vitest API (`vi`, `describe`, `it`, `expect` from `"vitest"`) + Angular `TestBed`

## Architecture
- **Angular 21**, standalone components (no NgModules), zoneless change detection
- **Feature-based** layout: `src/app/features/{auth,coordinator,dashboard,payments,profile,programs}/`
- All feature routes are **lazy-loaded** via `loadChildren` / `loadComponent`
- Route guards: `authGuard` (auth), `roleGuard` (coordinator/admin) — see `src/app/app.routes.ts`
- HTTP interceptors at `src/app/core/interceptors/`: `auth`, `layout`, `http-message`
- Auth services at `src/app/core/auth/`

## Path aliases (tsconfig.json)
```json
"@shared/*" → "src/app/shared/*"
"@core/*"   → "src/app/core/*"
"@layout/*" → "src/app/layout/*"
"@features/*" → "src/app/features/*"
```

## UI / styling
- **PrimeNG v21** with custom theme preset in `mypreset.ts` (rose-colored Aura extension)
- Dark mode toggled via CSS class `.my-app-dark` on parent element
- **Tailwind CSS v4** (via `@tailwindcss/postcss` PostCSS plugin)
- Custom fonts: ED-Nimpkish, Poppins (in `src/assets/fonts/`)
