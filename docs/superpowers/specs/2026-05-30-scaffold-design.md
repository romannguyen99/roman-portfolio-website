# Step 1 — Scaffold Design Spec

**Date:** 2026-05-30
**Build-order step:** §5.1 — Scaffold
**Author/owner:** Roman Nguyen (with Claude)

## 1. Goal

Land a green-on-arrival baseline for the portfolio: a Next.js 16 + TypeScript + Tailwind v4 project that lints, type-checks, tests, builds, and runs locally. Five empty section stubs (Hero, Work, Journal, About, Contact) sit at their final anchor IDs so subsequent steps can drop content in without re-laying foundations.

Tokens, fonts, motion, MDX, and content all belong to later steps. This step is strictly scaffold.

## 2. Stack

- **Framework:** Next.js 16.x (App Router) + React 19.x
- **Language:** TypeScript, `strict: true`
- **Styling:** Tailwind CSS v4 via `@tailwindcss/postcss` (no v3-style `tailwind.config.ts`)
- **Tests:** Vitest 4 + @testing-library/react + @testing-library/jest-dom + jsdom 29
- **Lint:** ESLint flat config (`eslint-config-next` core-web-vitals + typescript) + `eslint-config-prettier`
- **Format:** Prettier
- **Package manager:** npm; `package-lock.json` committed

## 3. File structure (after step 1)

```
roman-portfolio-website/
├── .gitignore                  (extend existing)
├── .prettierrc.json
├── .prettierignore
├── CLAUDE.md                   (§2 Next 15 → Next 16; §5 tick step 1)
├── LICENSE
├── README.md
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── vitest.setup.ts
├── public/                     (empty)
├── docs/superpowers/
│   ├── specs/2026-05-30-scaffold-design.md   (this file)
│   └── plans/2026-05-30-scaffold.md          (created by writing-plans)
├── references/                 (unchanged)
└── src/
    ├── app/
    │   ├── favicon.ico
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    └── sections/
        ├── hero/{index.tsx,index.test.tsx}
        ├── work/{index.tsx,index.test.tsx}
        ├── journal/{index.tsx,index.test.tsx}
        ├── about/{index.tsx,index.test.tsx}
        └── contact/{index.tsx,index.test.tsx}
```

## 4. Component contracts

### `src/app/layout.tsx`

Minimal RootLayout. No fonts, no providers. Sets `lang="en"`, applies `antialiased` from Tailwind, renders `{children}` inside `<body>`. Static `metadata` with title `Roman Nguyen — Portfolio` and a placeholder description.

### `src/app/page.tsx`

Renders a single `<main>` containing the five sections in order:

```tsx
<main>
  <Hero />
  <Work />
  <Journal />
  <About />
  <Contact />
</main>
```

### Section components (`src/sections/<name>/index.tsx`)

Each is a server component returning:

```tsx
<section id="<slug>" aria-labelledby="<slug>-heading">
  <Heading id="<slug>-heading"><Name></Heading>
</section>
```

Where:
- `slug` ∈ {`hero`, `work`, `journal`, `about`, `contact`}
- For Hero, `Heading` is `<h1>`. For Work, Journal, About, Contact, `Heading` is `<h2>`. This honors CLAUDE.md's "single `<h1>` on the hero" rule.
- Visible text is the section's capitalized name (e.g. `"Hero"`, `"Work"`). No Tailwind classes beyond what's needed to make the placeholders visible (none required — body text inherits white-on-black).

No props. No state. No motion. No styling beyond defaults.

### Section tests (`src/sections/<name>/index.test.tsx`)

Each test renders the component and asserts:
1. There is a `<section>` element with `id="<slug>"`.
2. The section has an accessible name matching the section label (via `aria-labelledby`).
3. The heading text is correct.

Tests use `@testing-library/react` `render` + `screen.getByRole("region", { name: <Name> })` and `screen.getByRole("heading", { name: <Name> })`.

## 5. Toolchain config

### `package.json` scripts

```json
{
  "dev":          "next dev",
  "build":        "next build",
  "start":        "next start",
  "lint":         "eslint",
  "typecheck":    "tsc --noEmit",
  "test":         "vitest run",
  "test:watch":   "vitest",
  "format":       "prettier --write .",
  "format:check": "prettier --check ."
}
```

### `package.json` dependencies

**dependencies:**
- `next` ^16
- `react` ^19
- `react-dom` ^19

**devDependencies:**
- `typescript` ^5
- `@types/node` ^20
- `@types/react` ^19
- `@types/react-dom` ^19
- `tailwindcss` ^4
- `@tailwindcss/postcss` ^4
- `eslint` ^9
- `eslint-config-next` ^16 (matches `next` version)
- `eslint-config-prettier` ^10
- `prettier` ^3
- `vitest` ^4
- `@vitejs/plugin-react` ^6
- `jsdom` ^29
- `@testing-library/react` ^16
- `@testing-library/jest-dom` ^6
- `@testing-library/user-event` ^14

No GSAP, no Lenis, no framer-motion, no ogl, no MDX deps in this step.

### `tsconfig.json`

- `strict: true`
- `moduleResolution: "bundler"`
- `target: "ES2022"`, `lib: ["dom", "dom.iterable", "ES2022"]`
- `jsx: "preserve"`
- `paths: { "@/*": ["./src/*"] }`
- Next.js plugin enabled via `"plugins": [{ "name": "next" }]`
- Includes: `next-env.d.ts`, `**/*.ts`, `**/*.tsx`, `.next/types/**/*.ts`
- Excludes: `node_modules`

### `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

### `vitest.setup.ts`

```ts
import "@testing-library/jest-dom/vitest";
```

### `eslint.config.mjs`

Flat config extending `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`, then `eslint-config-prettier` last so Prettier wins on formatting. `globalIgnores`: `.next/`, `out/`, `build/`, `next-env.d.ts`, `coverage/`, `node_modules/`.

### `.prettierrc.json`

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### `.prettierignore`

```
.next
out
build
coverage
node_modules
package-lock.json
public
references/screenshots
references/recording.mp4
```

### `postcss.config.mjs`

```js
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```

### `next.config.ts`

Empty `NextConfig` object — no custom options yet.

### `globals.css`

```css
@import "tailwindcss";

@layer base {
  html,
  body {
    background: #000;
    color: #fff;
  }
}
```

Black background on day one so step 2's token swap doesn't introduce a white-flash regression. No `@theme`, no tokens — that's step 2.

## 6. CLAUDE.md updates included in this step

- §2 "Tech stack" → `Next.js 15` → `Next.js 16`
- §5 "Build order" → tick `[x] 1. Scaffold`

## 7. Verification gate

All must pass before commit:

1. `npm install` — clean (no peer warnings beyond known transitives)
2. `npm run typecheck` — green
3. `npm run lint` — green
4. `npm run format:check` — green
5. `npm run test` — exactly 5 passing tests (one per section)
6. `npm run build` — succeeds; build output renders all 5 section anchors when crawled
7. `npm run dev`, browser at `http://localhost:3000` — page loads, 5 sections visible with their placeholder headings (`Hero`, `Work`, `Journal`, `About`, `Contact`), no console errors, no hydration warnings

## 8. Out of scope (explicit YAGNI)

- Design tokens, palette, type scale → step 2
- Fonts (`next/font`, Fontshare) → step 2
- Page loader → step 2 or 3
- Lenis, GSAP, framer-motion, ogl → steps 3 & 5
- Custom shader, WebGL fallback → step 3
- MDX content pipeline → steps 6/7
- public/ assets (logos, OG images, favicon SVGs) → step 10
- `next/font` favicon → leave the Next default favicon convention (`src/app/favicon.ico`)
- CI workflow → CLAUDE.md says "CI-free local-only baseline"
- Storybook, Chromatic, visual regression → never (not in stack)
- Husky / lint-staged → not requested

## 9. Risks & mitigations

- **Next 16 + React 19 + Vitest 4 dependency churn.** Resolution: install transitively, accept npm's suggested versions; if any peer dep barks, pin to the prior scaffold's exact versions (Next 16.2.6, React 19.2.4) which are known good.
- **Tailwind v4's `@theme` model is unfamiliar.** Resolution: step 1 doesn't touch `@theme` at all. globals.css is a single import + a 4-line reset.
- **next/font is absent in step 1, so default browser fonts render until step 2.** Acceptable — black bg + white default sans-serif is intentional baseline; step 2 owns typography.

## 10. Acceptance

Step 1 is done when:
- All seven verification items above pass.
- One commit on `main` lands the scaffold with the message style `chore: scaffold Next.js 16 + Tailwind v4 + Vitest + Prettier (step 1)`.
- `git push origin main` succeeds.
- §5 step 1 checkbox ticked in CLAUDE.md.
