# Lens visual tokens

## Colour

`colors.js` is the single source used by Tailwind and React Native. Keep names semantic; do not add aliases for the same colour.
`tailwind.config.js` temporarily exposes aliases for existing screen call sites; remove them after Mobile migrates those call sites to this file.

| Role | Token | Value |
| --- | --- | --- |
| App background | `background` | `#111317` |
| Surface | `surface` | `#17191E` |
| Raised surface | `surface-raised` | `#1E2023` |
| Higher surfaces | `surface-high`, `surface-highest` | `#282A2D`, `#333538` |
| Outline | `outline`, `outline-subtle` | `#2A2E37`, `#2D333F` |
| Main text | `text` | `#E2E2E6` |
| Secondary text | `text-muted` | `#A1A5B0` |
| Brand accent | `primary` | `#6366F1` |
| Destructive action | `destructive` | `#EF4444` |
| Warning | `warning`, `warning-container` | `#FFB783`, `#352115` |
| Warning outline | `warning-outline` | `#78350F` |
| Paper illustration | `paper` | `#FAFAFA` |

`text-muted` has a contrast ratio of about 7.7:1 against `background`, clearing WCAG AA for body text. `primary` is an accent for controls and emphasis, not small body copy.

## Typography

The Inter variable font is bundled at build time through the existing `expo-font` config plugin and named `Inter` on both platforms. Use `font-sans` for app text; the font is available before React renders.

| Use | Size |
| --- | ---: |
| Body | 16 px |
| Secondary | 14 px |
| Caption | 12 px |
| Non-essential metadata only | 11 px |

Do not use mono for UI text. Replace the old 7–11 px faux-document preview labels with fewer decorative lines or raise them to at least 11 px.
