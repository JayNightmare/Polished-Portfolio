# Different Design Portfolio

A modern portfolio built with React, TypeScript, Vite, Tailwind CSS, Radix UI primitives and motion animations.

## Scripts
- `npm run dev` - start dev server
- `npm run build` - type-check then build
- `npm run preview` - preview production build
- `npm run typecheck` - run TypeScript only
- `npm run lint` - lint sources
- `npm run format` - format with Prettier

## Tech Stack
- React 18 + TypeScript
- Vite 5
- Tailwind CSS (custom design tokens via CSS variables)
- Radix UI primitives wrappers (custom components in `components/ui`)
- Motion for animations
- Lucide React Icons

## Setup
Install dependencies then run dev server.

```
npm install
npm run dev
```

Visit http://localhost:5173.

## Notes
The Radix imports in the component files originally contained pinned version suffixes (e.g. `@radix-ui/react-slot@1.1.2`). Standard module resolution expects package names without the `@version` suffix. Update them if build errors occur by removing the suffix.
