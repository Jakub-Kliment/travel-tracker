# Travel Tracker

A desktop application to track countries visited on an interactive world map with statistics.

## Features

- **Interactive World Map**: Click on countries to mark them as visited/unvisited
- **Visit Date Tracking**: Record when you visited each country
- **Beautiful Statistics**: View your travel progress with charts and graphs
- **Continent Breakdowns**: See statistics organized by continent
- **Timeline View**: Track your travel history chronologically
- **Data Persistence**: Automatically saves your data, with import/export functionality
- **Cross-Platform**: Works on Windows, Mac, and Linux

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run in development mode:
```bash
npm run dev
```

### Building for Production

Build the application:
```bash
npm run build
```

Package the application for your platform:
```bash
# For current platform
npm run package

# Or for specific platforms
npm run package:win    # Windows
npm run package:mac    # macOS
npm run package:linux  # Linux
```

The packaged application will be in the `release` folder.

## Usage

1. **World Map Page**: Click on any country to mark it as visited. You'll be prompted to enter the date of your visit.
2. **Statistics Page**: View detailed statistics about your travels, including:
   - Total countries visited
   - Percentage of world explored
   - Continent breakdowns
   - Travel timeline
   - Lists of visited and unvisited countries
3. **Save/Load**: Use the buttons in the navigation bar to manually save or load your data. The app also auto-saves your progress.

## Technology Stack

- **Electron**: Desktop application framework
- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **react-simple-maps**: Interactive world map
- **Recharts**: Charts and data visualization
- **Webpack**: Module bundler

## LTS 
v1.1.0