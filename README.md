# Dynasty Tree Builder

**A free family tree maker for D&D and TTRPG campaigns.** Map noble houses, NPC
relationships, bloodlines and rivalries on a drag-and-drop canvas, then share a
read-only link with your players or export the whole thing as a PNG.

🔗 **[dynastytreebuilder.vercel.app](https://dynastytreebuilder.vercel.app)** — no account needed, guest mode opens straight onto the canvas.

---

## Why it exists

Most family tree software is built for genealogy: real ancestors, birth
certificates, dates you can verify. Campaign families are messier. Half the
parents are unknown, a third of the heirs are secretly bastards, two houses
married for a treaty that has since collapsed, and the whole thing has to stay
legible while you improvise at the table.

Dynasty Tree Builder is built for that instead. Characters carry a **role** and
a set of **narrative flags**, so the tree doubles as a campaign NPC relationship
map rather than a chart of who begat whom.

## Features

- **A canvas built for lineages** — generations snap into horizontal bands and
  siblings pack tightly, so a ten-generation house reads top to bottom without
  crossing lines.
- **Relationships that mean something** — parent/child, partner and adopted
  links each draw their own edge style, and every link can carry a plot hook.
- **Roles and narrative flags** — Head of House, Heir, Consort, Rival, Mage,
  Rogue…, stacked with permanent flags: founder, bastard, adopted, exile,
  deceased. Signed-in users can define custom roles.
- **Multiple partners and messy lineages** — a character can have several
  partners, each with their own offspring line; unknown parents can stay as
  placeholder nodes so an incomplete bloodline still renders correctly.
- **Share a read-only link** — publish a dynasty and hand players a link. They
  get the live canvas (pan, zoom, highlight a bloodline) with no edit rights and
  no account. Unpublish at any time to break the link.
- **PNG export** — high-resolution, cropped to your characters, from the editor
  or from a shared view. Drop it into a campaign wiki, Discord or a VTT.
- **Guest mode** — dynasties live in your browser's local storage. Create an
  account only when you want them on more than one device; guest work can be
  imported.

## Who it's for

Dungeon masters running court-intrigue arcs, worldbuilders tracing a founding
bloodline across centuries, players mapping a character's house before session
one, and writers or play-by-post groups who keep losing track of the cast.
Nothing in the tool is tied to a ruleset — D&D, Pathfinder, homebrew, or no
system at all.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · [React Flow](https://reactflow.dev)
(`@xyflow/react`) for the canvas · Zustand for client state · Tailwind CSS ·
Radix UI primitives · Prisma + PostgreSQL · Supabase Auth · Vitest.

The genealogy layout is a custom engine
([`components/canvas/useGenealogyLayout.ts`](components/canvas/useGenealogyLayout.ts))
rather than a generic graph layout: it assigns generation bands, then packs
siblings and keeps bloodlines vertical.

## Running locally

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase + database credentials
npx prisma migrate dev
npm run dev
```

Open http://localhost:3000. Guest mode (`/tree`) works without any database or
auth configuration — only the dashboard and sharing need the full setup.

```bash
npm test     # vitest
npm run lint # eslint
```

## Project status

Actively developed. Dynasty Tree Builder is part of **Bag Of Holding Tools**, a
small set of free tools for tabletop games.

## License

[MIT](LICENSE) — Copyright (c) 2026 mKzz.

You are free to use, study, modify, redistribute and sell this code, including
in closed-source work. The only condition is that the copyright notice and the
licence text travel with it.

Issues and pull requests are welcome, under the same license.
