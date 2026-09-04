# Dynasty Tree Builder

Dynasty Tree Builder is a free family-tree and relationship-map editor designed
for D&D, Pathfinder, other TTRPG campaigns, and fictional worldbuilding.

Create noble houses, trace bloodlines, connect partners and adopted children,
record plot hooks, and share a read-only tree with players. An account is
optional: guest mode opens directly on the canvas and stores its work in the
browser.

[Open Dynasty Tree Builder](https://dynasty.bagofholdingtools.com/)

## Why it exists

Traditional genealogy applications assume documented ancestors and orderly
relationships. Fictional dynasties contain unknown parents, secret heirs,
political marriages, adoption, exile, contested succession, and several
generations invented during play.

Dynasty Tree Builder treats those complications as normal campaign data. Its
canvas is optimized for readable generations and story relationships rather
than real-world genealogy records.

## Features

- Drag-and-drop lineage canvas with pan, zoom, selection, and automatic fitting.
- Generation-aware layout that keeps siblings grouped and bloodlines readable.
- Parent, partner, child, and adopted-child relationships.
- Character names, aliases, free-text roles, gender, notes, and narrative flags.
- Relationship plot hooks, unknown parents, and multiple partners.
- Stable generated dynasty crests.
- Guest drafts stored locally in the browser.
- Cloud persistence for signed-in users, including guest-work import.
- Revocable public read-only share links.
- High-resolution PNG and editable JSON export.
- English and French interfaces.

## Who it is for

Dungeon masters running court-intrigue campaigns, worldbuilders tracing a
founding bloodline across centuries, players defining a character's house, and
writers who need a clear map of a complicated cast. Nothing in the editor is
tied to a specific game system.

## Tech stack

Next.js 16 · React 19 · TypeScript · React Flow · Zustand · Tailwind CSS ·
Radix UI · Prisma · PostgreSQL · Supabase Auth · Vitest · Vercel.

The genealogy layout is a custom engine in
[`components/canvas/useGenealogyLayout.ts`](components/canvas/useGenealogyLayout.ts).
It assigns generation bands, packs related characters, and keeps family lines
vertical instead of applying a generic graph layout.

Dynasty Tree Builder is part of **Bag Of Holding Tools**, a family of free TTRPG
utilities with a shared visual language and optional account system.

## Running locally

```bash
cp env.example .env.local
npm install
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Guest mode is available at
`/tree` without signing in.

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Deployment-specific values are documented in `env.example` and configured in
the hosting environment rather than in this README.

## License

[MIT](LICENSE) — Copyright © 2026 mKzz.
