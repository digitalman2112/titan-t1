# Titan T1-X Guide

A reference website for the **Titan T1-X** multi-functional home gym machine (also sold as the **Tytax T1-X**). Built with Jekyll and hosted on GitHub Pages.

> **Live site:** [digitalman2112.github.io/titan-t1](https://digitalman2112.github.io/titan-t1/)

---

## Overview

The Titan T1-X is a Smith machine, cable system, and functional trainer combined into a single unit. This site provides exercise instructions, equipment references, and tools to help users get the most out of the machine.

Content is sourced from three original printed manuals included with the machine, supplemented by Tytax instructional videos from YouTube. AI was used in the creation of the website code and content — verify all information for suitability before use.

---

## Features

### Exercise Library
- **59 exercises** covering the full range of machine capabilities, including standard exercises, optional attachment exercises, and Manual 1 exclusive exercises
- Each exercise page includes:
  - Photos from the original printed manuals
  - Embedded Tytax YouTube video where available
  - Required cables and accessories with links and photos
  - Step-by-step setup and instruction content
  - Muscle groups trained with filter links
  - Links to the printed manual(s) with **direct PDF deep-links** to the correct page
- **Filter by muscle group** on the exercise index
- **Homepage** features a curated set of favorite exercises

### Equipment Reference
- **Accessories** — 23 accessory items with photos, descriptions, and ownership status
- **Cables** — 12 cable types with specs and usage context
- Each equipment page lists which exercises use it

### The Machine Page
- Machine specifications, history, and manufacturer links
- Scanned printed documentation (assembly instructions, three exercise manuals, diagrams)
- **Machine Options Reference** — table of all option attachments (A through W) showing the attachment name, owned status, and which exercises each option enables, driven by accessory front matter
- **Exercise Instructions Cross Reference** — complete table mapping all 59 exercises across all three printed manuals with direct PDF links to the correct page in each manual

### Weight Calculator
A live overlay calculator accessible from every page via the nav bar.

**Target Weight mode** (default):
- Enter a target effective weight; the calculator works out the exact plate configuration
- Greedy largest-first algorithm minimizes the number of plates to load
- Supports **counter-balance** (cable C-2, −20 lb offset carriage) for low-weight exercises
- **Max plate selector** for both main and offset carriages — limit to 45, 35, 25, or 10 lb plates
- Warns in red when more plates are needed than the configured per-side maximum
- Handles and Squat Pads add weight to the carriage and affect the calculation
- Auto-checks Handles/Squat Pads based on the exercise page you're viewing

**Build Weight mode**:
- Select plates with +/− steppers for both the main and offset carriages
- Toggle Handles (+15 lbs), Squat Pads (+15 lbs), and Counter-Balance
- Live effective weight readout

State is persisted in `localStorage` so your last configuration is restored on next open.

### User Experience
- **Dark / light theme** toggle, persisted across sessions
- Fully responsive — optimized for mobile use in the gym
- PDF links open to the exact page for the exercise being viewed
- Exercise detail pages link back to all manuals that contain that exercise

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Jekyll](https://jekyllrb.com/) (static site generator) |
| Hosting | GitHub Pages |
| Styling | SCSS (compiled by Jekyll) |
| JavaScript | Vanilla JS (no frameworks) |
| Data | YAML front matter + `_data/` files |
| Content | Markdown + Liquid templates |

---

## Project Structure

```
_exercises/        Exercise collection (59 items, EX-2 through EX-57)
_accessories/      Accessory collection (23 items)
_cables/           Cable collection (12 items)
_layouts/          Page layouts (default, exercise, accessory, cable)
_includes/         Partials (header, footer, calculator modal, YouTube embed)
_data/
  settings.yaml    Site-wide config (favorites, calculator limits, PDF offsets)
assets/
  css/main.scss    All styles
  js/
    theme.js       Dark/light theme logic
    calculator.js  Weight calculator
  images/          Exercise and accessory photos
  docs/            Scanned PDF manuals
```

---

## Configuration

Key settings in `_data/settings.yaml`:

```yaml
# Exercises shown as cards on the homepage
favorited_exercises:
  - EX-2
  - EX-11

# PDF page number offsets (printed page != PDF page)
pdf_page_offsets:
  manual1: 2
  manual2: 3
  manual3_low: -1    # printed pages 2-11
  manual3_high: -2   # printed pages 13+
  manual3_break: 11

# Weight calculator plate limits
calculator:
  main_max_plates_per_side: 6
  offset_max_plates: 6
```

---

## Machine Constants (Weight Calculator)

| Component | Weight |
|---|---|
| Main Smith carriage | 80 lbs |
| Counter-balance offset carriage (C-2) | 20 lbs (deducted) |
| Exercise handles | 15 lbs |
| Shoulder / squat pads | 15 lbs |
| Available plate sizes | 2.5, 5, 10, 25, 35, 45 lbs |
| Main carriage loading | Paired (one plate each side) |
| Offset carriage loading | Single increments |

---

## Development

```bash
bundle install
bundle exec jekyll serve
```

The site is served at `http://localhost:4000/titan-t1/`.

---

## Disclaimer

Use the information on this site at your own risk. Your machine configuration may differ. Consult a physician before beginning any exercise program. AI was used in the creation of the website code and content — verify all content for suitability before use.
