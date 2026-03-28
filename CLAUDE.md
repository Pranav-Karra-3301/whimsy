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

## Architecture

**Next.js 15 App Router** with React 19, Tailwind CSS 3, TypeScript 5.

### Key Integrations
- **Google Gemini 2.0 Flash** — object identification from camera images (`src/lib/gemini.ts`)
- **Nano Banana 2 (Gemini 3.1 Flash Image)** — image-to-image generation for googly eyes (`src/lib/nanobanana.ts`)
- **ElevenLabs** — conversational AI with dynamic voices (`src/components/conversation.tsx`)
- **Cloudflare R2** — S3-compatible image storage (`src/lib/r2.ts`)

### Data Flow: Object Creation
1. User captures image via camera or file upload (`CameraCapture` component)
2. `POST /api/identify` — Gemini analyzes image, returns name/personality/backstory/voice
3. `POST /api/generate-image` — fal.ai generates googly-eyed version
4. `POST /api/upload` — original image uploaded to R2
5. `POST /api/objects` — NPCObject saved to JSON DB
6. Redirect to `/object/{id}` for voice interaction

### Database
JSON file-based storage in `.data/objects.json` via `src/lib/db.ts`. Planned migration to SpaceTimeDB. The core data model is `NPCObject` defined in `src/types/index.ts`.

### Path Alias
`@/*` maps to `./src/*`

## Design System

Dark theme (`#1a1a1a` bg) with golden accent (`#e8c872`). Custom colors defined in `tailwind.config.ts` under `bg`, `surface`, `border`, `muted`, `accent` keys. Fonts: Geist Sans + Geist Mono via CSS variables.

## Environment Variables

See `.env.example` for the full list. Required: `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, R2 credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`), `R2_PUBLIC_URL`, `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`.
