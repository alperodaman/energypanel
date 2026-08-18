# EnerjiPanel — Design System

This document covers the visual design language, page structure, and interaction patterns behind EnerjiPanel's interface.

## Contents

- [Design Rationale](#design-rationale)
- [Design Tokens](#design-tokens)
- [Information Architecture](#information-architecture)
- [Pages](#pages)
- [Notifications](#notifications) *(Phase 1)*
- [State Handling](#state-handling)
- [Accessibility](#accessibility)
- [Responsive Behavior](#responsive-behavior)

---

## Design Rationale

The product combines two distinct kinds of data — **energy** (consumption, cost) and **comfort** (temperature, heating/cooling state) — and uses color to encode that distinction rather than as decoration. Energy data is shown in a warm tone (ember); comfort data is shown in a cool tone (teal). A user should be able to tell, at a glance, whether a number represents consumption or temperature, without reading a label.

Color is never the only signal, though: every data point pairs its color with an icon, since color alone isn't accessible to colorblind users (roughly 8% of men). The icon is a functional backup, not decoration.

## Design Tokens

### Color

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#FBF9F6` | Page background (warm off-white) |
| `--surface` | `#FFFFFF` | Card surfaces |
| `--text-primary` | `#241C15` | Primary text |
| `--text-secondary` | `#6B6058` | Secondary text |
| `--ember` | `#C2410C` | Energy data accent (consumption, billing, electrical alerts) |
| `--teal` | `#0E7490` | Comfort data accent (temperature, heating, humidity) |
| `--critical` | `#DC2626` | Critical alerts — always paired with bold weight + icon, since its contrast against `--surface` sits at the edge of WCAG AA |
| `--success` | `#15803D` | Savings / positive states |
| `--border` | `#E7E1D9` | Dividers, card borders |

### Typography

| Role | Font | Usage |
|---|---|---|
| Display | Sora | Page headings, large live figures |
| Body | Inter | Paragraphs, labels, buttons |
| Data | JetBrains Mono | All numeric values (kWh, °C, currency), with `font-variant-numeric: tabular-nums` |

A dedicated monospace font for numeric data makes measurements visually recognizable at a glance in a data-dense dashboard, distinct from headings and body text.

### Spacing & Layout

8px base unit (8/16/24/32/48/64). 12px card corner radius. Max content width 1280px, 24px gap between cards.

### Signature Element — the Pulse Strip

Three large live figures at the top of the dashboard — instantaneous consumption (ember), room temperature (teal), and heating state (teal) — each pulsing gently (opacity 1 → 0.7 → 1, 400ms) whenever new data arrives. This is the first thing a user sees, and its purpose is to make the system feel alive within the first second of loading.

## Information Architecture

Navigation is a fixed left sidebar (not a header) — logo, Dashboard/Facilities links, logout — chosen because a header with a facility dropdown doesn't scale as cleanly once there are multiple pages to navigate between.

| Page | Phase |
|---|---|
| Login / Register | 0 |
| Dashboard | 0 (summary) → 1 (billing estimate, recommendation cards) |
| Facilities (list) | 0 (full CRUD) → 1 (sparkline, multi-facility comparison) |
| Facility Detail | 0 |
| Device Settings | 1 |
| History & Analytics | 1 |
| Notifications | 1 |
| Settings | 1 |

## Pages

### Login / Register

A single centered column with a subtle ember-to-teal decorative gradient strip (`aria-hidden`, purely visual) introducing the product's two-color identity from the first screen.

### Dashboard

A summary view across all of a user's facilities: total facility/device counts, a device-type distribution chart, and clickable facility cards leading to Facility Detail. It intentionally does **not** show live telemetry directly — with more than one facility, "whose pulse strip is this" becomes ambiguous, so live data lives on Facility Detail instead, and Dashboard stays a cross-facility overview.

For a user with a single facility, the dashboard is functionally simple (summary counts of "1"); for a user managing several, the device-distribution chart and facility comparison become the primary value. The interface doesn't switch modes explicitly — it's shaped by how many facilities a user actually has.

### Facilities

A management table (Name / Address / Type / Devices / Actions) with modal-based create/edit and a confirmation step for delete. Deleting a facility that still has devices is blocked with a clear error, rather than cascading — deliberately, to prevent accidental bulk data loss.

### Facility Detail

The Pulse Strip lives here, along with per-device cards (colored by device type, consistent with the dashboard's color logic) and device management actions.

### Device Settings *(Phase 1)*

A simple form: device name, and — for thermostats/boilers — a target-temperature slider that's fully keyboard-operable (arrow keys), not mouse-drag-only.

### History & Analytics *(Phase 1)*

A date-range picker plus a dual-axis chart overlaying consumption (ember) and temperature (teal) over time, to make correlations visible (e.g. "consumption rises when the boiler is on").

### Settings *(Phase 1)*

Two tabs: Thresholds (per-device alert rules) and Account (profile, password).

## Notifications *(Phase 1)*

| Location | Behavior |
|---|---|
| Bell icon | Always visible, unread-count badge; opens a dropdown of the 5 most recent notifications |
| Toast | Appears bottom-right on a new alert/insight event, auto-dismisses after 5s — except critical alerts, which stay until dismissed manually. Rendered in an `aria-live` region (`assertive` for critical) so screen readers announce it too |
| Dashboard card | Always shows the 3 most recent notifications, as a fallback for anyone who missed the toast |
| Color coding | Critical alerts: red left border + triangle icon. Recommendations: teal left border + lightbulb icon — distinguishable at a glance even without color |

## State Handling

- **Empty state** *(Phase 0)*: a prominent "Add your first facility" call-to-action in place of the dashboard, when a user has no facilities yet.
- **Loading** *(Phase 0)*: skeleton placeholders, not spinners — three "breathing" gray boxes for the Pulse Strip specifically.
- **Connection lost** *(Phase 0)*: a thin orange banner above the Pulse Strip: "Live connection lost, reconnecting…"
- **Error** *(Phase 1)*: a neutral gray box with a clear message and a retry action — deliberately not red, so error states are never visually confused with real alerts.

## Accessibility

- Color never carries meaning alone — every ember/teal distinction is backed by an icon.
- All text/background pairs target WCAG AA; `--critical`, which sits at the edge, is always reinforced with bold weight and an icon.
- Every interactive element (inputs, sliders, buttons, dropdowns, toast dismissal) is fully keyboard-operable, with a visible focus ring.
- Live-updating figures (the Pulse Strip) sit in an `aria-live="polite"` region; decorative visuals are `aria-hidden`; icon-only buttons carry an `aria-label`.
- Form errors are conveyed through text and icon, not color alone, linked to their input via `aria-describedby`.

These rules are applied to every new component from the start, not retrofitted later — a full accessibility audit (automated via axe-core, plus manual keyboard-only navigation testing) is planned for Phase 2, but the underlying components are already built to comply.

## Responsive Behavior

Single breakpoint at 768px:

- The Pulse Strip stacks vertically on mobile (three side-by-side figures don't fit).
- The sidebar collapses into a hamburger menu.
- The facilities table becomes one card per row.
- Modals go near-full-screen.
- Charts default to a narrower date range (3 days instead of 7) rather than horizontal scrolling *(Phase 1, with the History & Analytics page)*.

## Motion

A single animation source by design — the Pulse Strip's 400ms opacity pulse on data updates — to avoid a dashboard that feels busy. Page transitions (150ms fade) and toast entry/exit (200ms slide) are added in Phase 1. `prefers-reduced-motion` disables all of it in Phase 2, for users with motion sensitivity.

## Dark Mode (Roadmap)

Out of scope for Phase 0/1. The token system (`--bg`, `--surface`, `--text-primary`, etc. as CSS custom properties) is structured so that a `data-theme="dark"` variant can add corresponding dark values without a rewrite.
