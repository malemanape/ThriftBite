# ThriftBite frontend

The React + TypeScript app for ThriftBite, built with Vite. One page per screen in `src/pages`, shared pieces in `src/components`, and the API client and hooks in `src/api` and `src/lib`.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check and build to dist/
npm run lint
```

The app talks to the API at `VITE_API_URL` (see [`.env.example`](.env.example)), or `http://localhost:8080` when it's unset.

## Look

- **Theme.** Every colour is a CSS variable in `src/index.css`, with a light value and a dark one. The colours come from Thryx, the mascot.
- **Dark mode.** It follows the device until the visitor picks a mode with the toggle, then remembers the pick (`src/lib/theme.ts`). `public/theme-init.js` sets the theme before the page draws, so there's no flash.
- **Fonts.** Fredoka for headings and Figtree for text, served from the app through Fontsource.
- **Food drawings.** Listings without a photo show one of the drawings in `src/assets/art`. A store can pick one, or it's guessed from the food's name (`src/lib/art.ts`).

## Hosting

`vercel.json` sets the security headers, including the Content Security Policy. If the API moves away from `*.onrender.com`, update `connect-src` and `img-src` there.
