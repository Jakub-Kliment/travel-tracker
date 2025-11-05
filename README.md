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
- Works offline once installed
- Cross-platform: Windows, Mac, and Linux

## Getting Started

You'll need Node.js (v16+) and npm installed.

```bash
# Install dependencies
npm install

# Run it in dev mode
npm run dev

# Build for production
npm run build

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

**Customizing the map:** Use the dropdowns at the top to change colors, map styles, and how things are displayed. Hit the ⛶ button (or ESC) for fullscreen mode.

**Stats page:** Switch to the Statistics tab to see all your numbers - countries visited, continents conquered, top destinations, travel timeline, and more.

**Export:** Use the 📸 Image or 📄 PDF buttons in the navbar to export your map or generate a travel report.


## Built with

Electron + React + TypeScript. Uses react-simple-maps for the interactive map and Recharts for the stats visualizations.


**Version 1.2.0**

Recent additions: multiple visits per country, photo gallery, star ratings, trip analytics, fullscreen mode, animations, and export features.