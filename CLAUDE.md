# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Type-check + production build
npm run lint      # ESLint
npm run preview   # Preview production build
npx tsc --noEmit  # Type-check only (no output = no errors)
```

The backend API must be running at `http://localhost:3000` before starting the dev server. The Vite proxy forwards all `/api/*` requests to it.

## Architecture

The app is a single-page React 19 app (Vite + TypeScript + TailwindCSS v4) that consumes a NestJS insurance policy REST API.

**Layer separation:**

- `src/types/index.ts` — all shared TypeScript types. Single source of truth: `Branch`, `PolicyStatus`, `RatingStrategyType`, `Customer`, `Policy`, and payload interfaces. When the API shape changes, fix it here first.
- `src/api/` — thin Axios wrappers, one file per resource (`customers.api.ts`, `policies.api.ts`). All URLs are relative (`/api/...`) so the Vite proxy handles routing.
- `src/components/` — reusable presentational pieces (`StatusBadge`, `CustomerBadge`, `ChangePolicyStatusModal`).
- `src/pages/` — one component per route; each page owns its TanStack Query `useQuery`/`useMutation` calls.
- `src/App.tsx` — wires everything: `QueryClientProvider`, `BrowserRouter`, `Layout` (NavBar + `<main>`), `ErrorBoundary`, and route definitions.

**Data fetching pattern:** Pages call `useQuery` / `useMutation` directly — there are no custom hooks extracting this logic. On mutation success, call `queryClient.invalidateQueries` with the affected query keys to refresh the cache.

**Route order matters:** `/customers/new` is declared before `/customers/:id` in `App.tsx` to prevent "new" from being matched as a UUID parameter.

**Policy state machine:** `VALID_TRANSITIONS` is defined inside `ChangePolicyStatusModal.tsx` and controls which target states are offered in the UI. The backend is the authoritative validator — the frontend map only prevents offering impossible transitions.

## Key technical notes

- **TailwindCSS v4**: uses `@import "tailwindcss"` in `src/index.css` and the `@tailwindcss/vite` plugin. There is no `tailwind.config.js` and no PostCSS setup.
- **File writes via PowerShell `Set-Content`** can silently empty files or corrupt UTF-8 characters. Always use the Write tool or Edit tool instead of shell redirects for `.tsx`/`.ts` files.
- The `Policy` type uses `monthlyPremium` (not `premium`) — this matches the actual database column name in the backend.
- The `ErrorBoundary` in `App.tsx` wraps `<Routes>` and displays the raw `error.message`, which is useful for diagnosing render crashes that would otherwise produce a blank page.
