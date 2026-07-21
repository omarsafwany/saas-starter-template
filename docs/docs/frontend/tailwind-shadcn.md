---
sidebar_position: 5
---

# Tailwind CSS + shadcn/ui

## What it is

Styling is Tailwind CSS 4 (the Rust-based engine, CSS-first configuration — no `tailwind.config.js`,
no PostCSS) plus shadcn/ui components generated into `frontend/src/components/ui/` and owned by
the project, not installed as an opaque npm package.

## Why Tailwind + shadcn over the alternatives

Tailwind over CSS Modules/styled-components/vanilla-extract for the same reason most new React
projects reach for it: utility classes co-located with markup mean no separate stylesheet to keep
in sync, and Tailwind 4's CSS-first `@theme` config is simpler than the old JS config file. shadcn/ui
over a component library like MUI/Chakra because shadcn isn't actually a dependency — `npx shadcn
add button` copies the component's source directly into the repo. For a *starter template* that's
the entire point: a new project can freely edit `components/ui/button.tsx` without fighting a
library's override API, and there's no version-upgrade risk from a UI library changing its API
underneath you.

## Theme configuration (Tailwind 4, CSS-first)

```css title="frontend/src/index.css"
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "@fontsource-variable/geist";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-sans: 'Geist Variable', sans-serif;
  --color-primary: var(--primary);
  --color-background: var(--background);
  /* ...every design token is a CSS custom property, mapped once here */
}

:root {
  --background: oklch(1 0 0);
  --primary: oklch(0.205 0 0);
  --radius: 0.625rem;
  /* ...OKLCH color values for the whole design system */
}

.dark {
  --background: oklch(0.145 0 0);
  --primary: oklch(0.922 0 0);
  /* ...dark-mode overrides for the same variable names */
}
```

There's no `tailwind.config.ts` — Tailwind 4 reads the `@theme` block directly out of CSS. Colors
are defined in OKLCH rather than hex/rgb, which is shadcn's current default and gives more
perceptually-uniform color scales, particularly for generating dark-mode variants.

## An owned component, not a library import

```tsx title="frontend/src/components/ui/button.tsx"
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline: "border-border bg-background hover:bg-muted ...",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 ...",
      },
      size: {
        default: "h-10 gap-1.5 px-2.5 ...",
        sm: "h-9 gap-1 ...",
        lg: "h-11 gap-1.5 ...",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
)
```

`class-variance-authority` (`cva`) generates the variant class strings; `cn()` (a thin
`clsx` + `tailwind-merge` wrapper in `lib/utils.ts`) resolves conflicting Tailwind classes when a
caller passes `className` overrides. The default/sm/lg/icon sizes were deliberately bumped up
from shadcn's stock values during the mobile-responsive pass (PERPRO-23) to meet a ~40px minimum
touch target — a change made directly in this owned file, which wouldn't have been possible with
a library-installed component.

## Adding a new shadcn component

```bash
cd frontend
npx shadcn add <component-name>
```

This writes the component's source into `frontend/src/components/ui/`, ready to edit like any
other file in the repo — component.json (`frontend/components.json`) controls where it lands and
which aliases it uses.
