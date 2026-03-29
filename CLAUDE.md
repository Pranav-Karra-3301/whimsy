# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Whimsy (NPCify) — a Next.js app that lets users scan objects with their camera, give them googly eyes via AI image generation, and have voice conversations with them as AI-generated NPC characters.

## Commands

```bash
npm run dev      # Dev server with Turbopack
npm run build    # Production build
npm run lint     # ESLint
npm start        # Start production server
```

### SpaceTimeDB

```bash
spacetime build --module-path server/spacetimedb           # Build module
spacetime publish whimsy --module-path spacetimedb         # Publish (run from server/)
spacetime sql whimsy "SELECT * FROM npc_object"            # Query
spacetime logs whimsy                                      # View logs
spacetime generate --lang typescript \
  --out-dir src/lib/spacetimedb \
  --module-path server/spacetimedb                         # Regenerate TS bindings
```

## Architecture

**Next.js 15 App Router** with React 19, Tailwind CSS 3, TypeScript 5.

### Key Integrations
- **Google Gemini 2.0 Flash** — object identification from camera images (`src/lib/gemini.ts`)
- **Nano Banana 2 (Gemini 3.1 Flash Image)** — image-to-image generation for googly eyes (`src/lib/nanobanana.ts`)
- **ElevenLabs** — conversational AI with dynamic voices (`src/components/conversation.tsx`)
- **SpaceTimeDB** — database on maincloud (`src/lib/db.ts` via HTTP API, module at `server/spacetimedb/`)
- **Cloudflare R2** — S3-compatible image storage (`src/lib/r2.ts`)

### Data Flow: Object Creation
1. User captures image via camera or file upload (`CameraCapture` component)
2. `POST /api/identify` — Gemini analyzes image, returns name/personality/backstory/voice
3. `POST /api/generate-image` — Nano Banana 2 generates googly-eyed version, uploads to R2
4. `POST /api/upload` — original image uploaded to R2
5. `POST /api/objects` — NPCObject saved to SpaceTimeDB via reducer
6. Redirect to `/object/{id}` for voice interaction

### Database
SpaceTimeDB (maincloud) with `npc_object` table. `src/lib/db.ts` wraps the HTTP API (SQL queries + reducer calls). The Rust module is at `server/spacetimedb/src/lib.rs`. Core data model is `NPCObject` in `src/types/index.ts`.

### R2 Bucket Structure
- `originals/{uuid}.{ext}` — Original captured images
- `googly/{uuid}.jpg` — Images with googly eyes
- `cutouts/{uuid}.png` — Cutout/segmented images (future)

### Path Alias
`@/*` maps to `./src/*`

## Design System

Apple/Anthropic-inspired clean aesthetic. Warm neutral background (`#F8F8F7`) with pure white card surfaces, subtle shadows (no harsh borders), and Apple's near-black text (`#1D1D1F`). Accent color: warm terracotta (`#D4775C`) used sparingly. Colors defined via CSS variables in `globals.css` and referenced in `tailwind.config.ts`. Typography: Geist Sans + Geist Mono with `-0.02em` letter-spacing on headings. Components use `rounded-full` buttons, `rounded-3xl`/`rounded-4xl` cards, and generous padding. Max content width: `max-w-2xl`.

## Environment Variables

See `.env.example` for the full list. Required: `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, `SPACETIMEDB_TOKEN`, R2 credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`), `R2_PUBLIC_URL`, `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`.
