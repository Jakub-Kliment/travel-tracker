# Travel Tracker

This is a simple desktop app where you can click on countries you've been to, add photos, rate your experiences, and keep all your travel memories in one place. 

## What it does

### The Map
- Switch between different map styles
- Pick a color scheme you like - green, blue, purple, or orange
- Color countries based on why you went there

### Your Trips
- Been to the same country multiple times? Track each visit separately
- Add start and end dates for each trip
- Tag trips as work, holiday, transit, or other
- Rate your experiences with stars
- Write down memories and funny stories
- Upload as many photos as you want for each trip

### Stats
- See how many countries you've visited and what percentage of the world that is
- Break it down by continent
- Check out your top-rated destinations
- View a timeline of all your travels
- See your average trip length
- Split between work and vacation travel

### Sharing
- Export your map as a PNG to share with friends
- Generate a PDF report with all your stats

### Privacy
- Everything saves automatically - no cloud, no accounts, no hassle
- Your photos and travel info never leave your device
- Works completely offline - the map and flags are built into the app, so it never makes a network request
- Cross-platform: Windows, Mac, and Linux

## Installing

Grab the latest build from the [Releases page](../../releases/latest) — no
Node.js or building required.

| Your computer | Download |
| --- | --- |
| Mac (Apple Silicon or Intel) | `Travel Tracker-<version>.dmg` |
| Windows | `Travel Tracker Setup <version>.exe` |
| Linux | `Travel Tracker-<version>.AppImage` |

### On a Mac, open it the first time with a right-click

The app is not signed with an Apple Developer certificate, so the first
launch needs one extra step. **Double-clicking will simply refuse to open
it** — that is macOS being cautious about an unknown developer, not a
problem with the app.

1. Drag **Travel Tracker** into your Applications folder.
2. **Right-click** (or Control-click) the app and choose **Open**.
3. Click **Open** again in the dialog that appears.

macOS remembers the choice, so from then on it opens normally. On recent
macOS versions the dialog may instead appear under
*System Settings → Privacy & Security*, where you click **Open Anyway**.

## Building it yourself

You'll need Node.js (v16+) and npm installed.

```bash
# Install dependencies
npm install

# Run it in dev mode
npm run dev

# Build for production
npm run build

# Check types, lint and run the tests
npm run typecheck
npm run lint
npm test

# Package it up for your OS
npm run package         # auto-detects your platform
npm run package:win     # Windows
npm run package:mac     # macOS
npm run package:linux   # Linux
```

The packaged app ends up in the `release` folder.

## How to use it

**Adding trips:** Click any country on the map. A popup appears where you can add dates, rate it, write notes, and upload photos. Been there multiple times? Just click it again to add another visit.

**Editing trips:** Click on countries you've already visited to see all your trips there. You can edit or delete any of them.

**Customizing the map:** Use the dropdowns at the top to change colors, map styles, and how things are displayed. Use the fullscreen button in the corner of the map (or ESC to leave it).

**Stats page:** Switch to the Statistics tab to see all your numbers - countries visited, continents conquered, top destinations, travel timeline, and more.

**Export:** Use the Image or PDF buttons in the navbar to export your map or generate a travel report.

**Note:** the interface is in Slovak.


## Built with

Electron + React + TypeScript. Uses react-simple-maps for the interactive map and Recharts for the stats visualizations.


**Version 1.3.0**

Recent additions: "on this day" anniversaries and a strip of recent photos on
the map page, every dependency and territory the map draws now tracked (197
countries plus 42 territories), and a Slovak wording pass.