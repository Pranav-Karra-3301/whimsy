# Repository Guidelines

## Project Structure & Module Organization
`src/app` contains the Next.js App Router UI and API routes. Key routes include `src/app/page.tsx`, `src/app/gallery/page.tsx`, `src/app/object/[id]/page.tsx`, and server handlers under `src/app/api/*/route.ts`. Reusable UI lives in `src/components`, shared helpers in `src/lib`, and shared types in `src/types`. Local file-backed data is written to `.data/objects.json` at runtime by `src/lib/db.ts`.

## Build, Test, and Development Commands
- `npm run dev`: start the local Next.js dev server with Turbopack.
- `npm run build`: create a production build.
- `npm run start`: serve the production build locally.
- `npm run lint`: run the project linter via Next.js.

Use `npm` by default because both `package-lock.json` and `node_modules/` are present.

## Coding Style & Naming Conventions
Use TypeScript with `strict` mode enabled and the `@/*` path alias for imports from `src`. Follow the existing style: 2-space indentation, semicolons, double quotes, and functional React components. Component files are lowercase kebab-case (`camera-capture.tsx`), exported component names are PascalCase (`CameraCapture`), and route handlers follow Next.js `route.ts` naming. Keep Tailwind utility classes in JSX and avoid introducing a parallel styling system.

## Testing Guidelines
There is no automated test framework configured yet. Until one is added, require `npm run lint` to pass and manually verify the main flows: capture on `/`, gallery listing on `/gallery`, object details on `/object/[id]`, and the API endpoints under `src/app/api`. When adding tests later, place them beside the feature or under a dedicated `src/__tests__` directory and use `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines
Recent commits use short, imperative subjects with context and reason, for example: `Upgrade Next.js 15.1.0 → 15.5.14 to fix CVE-2025-66478`. Keep commits focused and descriptive. PRs should include a concise summary, note any API or env var changes, link the relevant issue when applicable, and attach screenshots or short recordings for UI changes.

## Security & Configuration Tips
Do not commit secrets or generated data. Cloudflare R2 access is configured through `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, and `R2_PUBLIC_URL`. Treat `.data/` as local development state, not source content.
