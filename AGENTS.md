# AGENTS.md — Explorative

This file provides guidance for AI agents working in this repository.

## Project Overview

**Explorative** is a lightweight, zero-dependency D&D initiative tracker and campaign management tool for tabletop RPG game masters. It is a pure client-side web application — no build step, no server, no package manager.

The tool has two operational modes:
- **Admin panel** (`admin.html`) — the GM's control surface for managing combat initiative, characters, and travel calculations
- **Display panel** (`display.html`) — the player-facing view, typically projected on a screen, showing the current initiative order and any active graphics

State is shared between tabs using the browser's `localStorage` and `BroadcastChannel` APIs.

## File Structure

```
explorative/
├── index.html      # Landing page / entry point
├── admin.html      # GM control panel
├── display.html    # Player-facing display
├── main.js         # All shared application logic
├── main.css        # All shared styles
└── LICENSE         # GPLv3
```

There are no build artifacts, no `dist/` directory, and no dependency files (no `package.json`, `requirements.txt`, etc.).

## Tech Stack

- **Language:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **Storage:** `localStorage` (persistence), `BroadcastChannel` (cross-tab sync)
- **Dependencies:** None — no frameworks, no npm packages, no CDN imports
- **Runtime:** Any modern browser; no server required

## Data Model

### Character object (stored in `localStorage` key `initiative`)
```js
{
  id: string,        // UUID v4
  name: string,      // Display name
  initiative: number,
  graphic: string,   // URL to image
  obscured: boolean  // If true, name shows as "???" in display
}
```

### Travel object (stored in `localStorage` key `travel`)
```js
{
  pace: "fast" | "normal" | "slow",
  distance: number,   // miles
  creatures: { tiny, smallAndMedium, large, huge, gargantuan: number },
  food: number,       // lbs (calculated)
  water: number,      // lbs (calculated)
  days: number,       // calculated
  capacity: number    // distance/day
}
```

### Other localStorage keys
- `active` — UUID string of the currently active character
- `graphic` — `{ show: boolean, url: string }` — controls the display panel's image

## Key Logic (main.js)

| Function | Purpose |
|---|---|
| `addCharacter()` | Appends a new blank character row to the table and localStorage |
| `sortCharacters()` | Sorts by initiative desc, then name asc; writes back to localStorage |
| `advanceInitiative()` | Advances `active` to the next character in sorted order |
| `saveTravelToSession()` | Reads form inputs, calculates food/water/days, writes to localStorage |
| `updateFromSession()` | Reads localStorage and re-renders the entire UI |
| `stringToColour(str)` | Deterministic color hash from a character name string |

Updates flow in one direction: user action → `localStorage` write → `BroadcastChannel` message → `updateFromSession()` re-render.

## Development Conventions

- **No build step.** Open `index.html` directly in a browser or serve with any static file server (e.g., `python -m http.server`).
- **Single JS file.** All logic lives in `main.js`. Do not split into modules unless there is a compelling reason — the zero-dependency nature is intentional.
- **Single CSS file.** All styles live in `main.css`. Use CSS custom properties for any new theming.
- **No frameworks.** Avoid introducing React, Vue, jQuery, or any external library. If something can be done with a native browser API, do it that way.
- **UUIDs via `crypto.randomUUID()`.** This is the only ID generation strategy; do not use Math.random() for IDs.
- **D&D rule accuracy matters.** Travel pace and supply calculations are based on official D&D 5e rules. If you modify those calculations, verify them against the Player's Handbook or Dungeon Master's Guide.

## What Agents Should Know

- There are **no tests**. When making changes, manually verify in a browser with both `admin.html` and `display.html` open in separate tabs to confirm cross-tab sync still works.
- The display panel is designed to be projected or shown to players. Changes to `display.html` or its styles should preserve readability at distance (large text, high contrast).
- The `obscured` flag intentionally hides creature names from players in the display view. Do not accidentally expose obscured names.
- `stringToColour()` is used for consistent character color coding — the same name always produces the same color. Do not change the hashing algorithm.
- localStorage is the single source of truth. DOM state is always derived from it, never the reverse.

## Out of Scope (Do Not Add Without Discussion)

- Backend servers or databases
- User authentication
- npm / node_modules
- Frameworks or UI component libraries
- Real-time sync across different devices/browsers (BroadcastChannel is same-origin, same-browser only)
