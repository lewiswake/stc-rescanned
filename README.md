# Sonic the Comic Rescan Project

[![Website](https://img.shields.io/badge/Website-stcscans.zone-0d85af.svg)](https://stcscans.zone/)
[![Archive](https://img.shields.io/badge/Internet%20Archive-Collection-000000.svg)](https://archive.org/details/sonic-the-comic-high-resolution-scans)

Welcome to the **Sonic the Comic Rescan Project** repository. This project is a digital preservation initiative and interactive web archive dedicated to cataloguing and providing complete, pristine 600 DPI scans of Fleetway Editions' legendary UK comic series, *Sonic the Comic* (STC), published between 1993 and 2002.

Visit the live website: **[stcscans.zone](https://stcscans.zone/)**

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Architecture & File Structure](#project-architecture--file-structure)
- [Data Schemas](#data-schemas)
  - [`issues.json`](#issuesjson)
  - [`issues_contents.json`](#issues_contentsjson)
- [Scraper & Cataloguing Automation](#scraper--cataloguing-automation)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Contributing & Adding Issues](#contributing--adding-issues)
- [License & Disclaimer](#license--disclaimer)

---

## Overview

Between 1993 and 2002, Fleetway Editions published 223 fortnightly issues and numerous specials of *Sonic the Comic*. Printed on classic newsprint paper, physical copies are increasingly fragile and prone to yellowing and deterioration.

The **Sonic the Comic Rescan Project** preserves every page—including original covers, comic strips, letters pages (*Speedlines*), news zones, reviews, retro UK advertisements, and pin-ups—by rescanning original issues at 600 DPI and optimizing them into high-resolution and standard-resolution `.cbz` digital archives.

---

## Key Features

- **Interactive Archive Grid**: Browse every mainline issue (#1–#223) and special release with fast lazy-loaded cover art.
- **Search, Filtering & Sorting**: Filter issues by publication year, search by issue number or title, and sort chronologically or in reverse.
- **Dedicated Issue Detail Pages (`issue.html?id=...`)**:
  - Direct download links for Standard Definition (SD), High Definition (HD), and Raw 600 DPI Master `.cbz` files hosted on the Internet Archive.
  - **Issue Contents & Story List**: Complete breakdown of strips, stories, and features included in each issue (e.g. Sonic, Tails, Knuckles, Shinobi, Streets of Rage, Decap Attack).
  - **Integrated Online Comic Reader**: Read issues directly in your browser with full-screen support powered by the Internet Archive BookReader embed.
  - **Contextual Community Links**: Direct links to audio reviews on *Sonic the Comic the Podcast* (STCTP) and lore articles on the STC Fandom Wiki.
  - **Seamless Navigation**: Previous / Next issue pagers with keyboard-friendly navigation and one-click shareable deep links.
- **Timezone-Agnostic UTC Dates**: Accurate UK release dates formatted consistently worldwide regardless of the visitor's local timezone.
- **Responsive Dark Theme**: Modern slate/navy palette with custom SVG icon masking and full mobile/tablet responsiveness.

---

## Tech Stack

The website is engineered with zero framework bloat for maximum speed, longevity, and ease of maintenance:

- **Frontend Core**:
  - **HTML5**: Clean, accessible, semantic markup with **zero inline CSS**.
  - **CSS3**: Modern layout using CSS Grid and Flexbox, CSS Custom Properties (variables) for theme management, and CSS masks for SVG icon rendering.
  - **Vanilla JavaScript (ES6+)**: Fast, framework-free client logic handling asynchronous data fetching, client-side routing via URL search parameters, filter state debouncing, and DOM rendering.
- **Data Layer**:
  - Static JSON flat-file databases (`issues.json` and `issues_contents.json`).
- **Data Scraping & Tooling**:
  - **Python 3**: Automated extraction script (`generate_issues_contents.py`) utilizing the Fandom MediaWiki API (`api.php`) with multi-page batching.
- **Hosting & Storage**:
  - **Web Hosting**: GitHub Pages / Static hosting with custom domain (`stcscans.zone`).
  - **Asset Storage**: Internet Archive for hosting multi-gigabyte 600 DPI `.cbz` comic releases.

---

## Project Architecture & File Structure

```
├── index.html                    # Homepage (archive grid, filters, search, progress stats)
├── issue.html                    # Dedicated issue detail page (downloads, contents, reader)
├── style.css                     # Central stylesheet (17 clearly labelled component sections)
├── script.js                     # Homepage logic (filtering, search, pagination, cards)
├── issues.json                   # Primary archive database (metadata, download links, dates)
├── issues_contents.json          # Catalogued story & feature contents for all 223 issues
├── generate_issues_contents.py   # Python scraper that builds issues_contents.json from wiki
├── images/                       # Cover art thumbnails, site logo, and SVG icons
│   ├── icons/                    # Standalone SVG icon assets
│   ├── 001.jpg, 002.jpg...       # 600 DPI optimized cover thumbnails
│   └── stc-rp-logo.svg           # Project vector branding
├── CNAME                         # Custom domain routing (stcscans.zone)
└── README.md                     # Project documentation
```

---

## Data Schemas

### `issues.json`

An array of issue objects. Mainline issues use 3-digit zero-padded IDs under 100:

```json
[
  {
    "id": "001",
    "high": "STC_001_HighRes.cbz",
    "standard": "STC_001_StandardRes.cbz",
    "image": "images/001.jpg",
    "master": "https://archive.org/details/stc-001_202605/",
    "date": "1993-05-29",
    "podcast": "https://stctp.zone/?name=2019-05-06_stctp-001.mp3",
    "price": "£0.95"
  },
  {
    "id": "summer-1994",
    "type": "special",
    "title": "Sonic the Summer Special 1994",
    "high": "STC_Summer_1994_HighRes.cbz",
    "standard": "STC_Summer_1994_StandardRes.cbz",
    "image": "images/STC_Summer_1994.jpg",
    "master": "https://archive.org/details/sonic-the-summer-special-1994",
    "date": "1994-06-18",
    "podcast": "https://stctp.zone/?name=2020-06-12_stctp-summerspecial.mp3",
    "price": "£1.95"
  }
]
```

### `issues_contents.json`

A dictionary mapping each issue ID to an array of its story and feature titles in reading order:

```json
{
  "001": [
    "Control Zone",
    "Sonic the Hedgehog - Enter: Sonic",
    "Review Zone",
    "Shinobi - The Fear Pavilion: Part 1",
    "News Zone",
    "The Legend of the Golden Axe - Citadel of Dead Souls: Part 1",
    "Q Zone",
    "Sneak previews of Streets of Rage, Kid Chameleon and Wonder Boy stories",
    "Speedlines",
    "Next Issue"
  ]
}
```

---

## Scraper & Cataloguing Automation

The contents of all 223 issues are catalogued directly from the *Sonic the Comic* Fandom Wiki using [`generate_issues_contents.py`](generate_issues_contents.py).

To re-run or update the contents database:

```bash
python generate_issues_contents.py
```

The script queries Fandom's MediaWiki API (`https://stc.fandom.com/api.php`) in batches of 50 issues, cleanly strips wikitext markup (links, comments, formatting), and regenerates `issues_contents.json` in seconds without external dependencies.

---

## Running Locally

Because the application loads `issues.json` and `issues_contents.json` via asynchronous `fetch()` requests, browsers require the files to be served via HTTP rather than opened directly as `file://`.

### Using Python 3 (Built-in)
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.

### Using Node.js
```bash
npx serve .
```

---

## Deployment

The site is production-ready for static web hosting (e.g. GitHub Pages, Cloudflare Pages, Netlify, or Vercel). 

1. Ensure all changes to `issues.json`, `issues_contents.json`, `issue.html`, `script.js`, and `style.css` are committed.
2. Push to your repository's publishing branch (typically `main` or `gh-pages`).
3. If using a custom domain, ensure the `CNAME` file contains your domain (e.g., `stcscans.zone`).

---

## Contributing & Adding Issues

New rescans are released as physical copies are scanned, restored, and uploaded to the Internet Archive.

1. **Add Scans**: Upload the standard and high-resolution `.cbz` files to the Internet Archive collection.
2. **Add Cover**: Save an optimized JPEG thumbnail of the cover into `images/[id].jpg`.
3. **Update Database**: Add a new entry to `issues.json` with the file names, dates, and links.
4. **Update Contents**: Add or verify the issue contents in `issues_contents.json` (or run `python generate_issues_contents.py`).

---

## License & Disclaimer

This website is a non-profit, fan-driven archival and preservation project. 

- *Sonic the Comic*, *Sonic the Hedgehog*, and all related characters and indicia are © and ™ of **SEGA Enterprises**, **Fleetway Editions / Egmont**, and their respective copyright holders.
- Scans and archival materials are provided strictly for educational, historical, and preservation purposes.
