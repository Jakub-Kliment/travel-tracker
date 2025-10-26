# Travel Tracker - A Gift for Dad

## Project Overview

A desktop application that allows tracking visited countries on an interactive world map with comprehensive statistics. Built as a personal gift to help track and visualize travel experiences.

## Technology Stack

- **Electron**: Desktop application framework (cross-platform: Windows, Mac, Linux)
- **React**: UI library for building interactive components
- **TypeScript**: Type-safe JavaScript for better code quality
- **D3.js / Leaflet**: Interactive world map visualization
- **Recharts / Chart.js**: Statistical charts and visualizations

## Features

### 1. Interactive World Map
- Click on countries to mark them as visited/unvisited
- Visual distinction between visited and unvisited countries
- Hover effects showing country names
- Zoom and pan capabilities
- Smooth animations and transitions

### 2. Statistics Dashboard
- **Basic Counts**: Total countries visited, percentage of world explored
- **Regional Breakdowns**: Statistics by continent and region
- **Visual Charts**: Pie charts, bar graphs, and other visualizations
- **Timeline**: Track when each country was visited
- **Lists**: Complete lists of visited and unvisited countries

### 3. Data Persistence
- File-based storage (JSON format)
- Export functionality for backup
- Import to restore or transfer data between devices
- Easy to share and archive

## Project Structure

```
krajiny/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React application
│   │   ├── components/ # React components
│   │   ├── pages/      # Main pages (Map, Statistics)
│   │   ├── utils/      # Utility functions
│   │   └── types/      # TypeScript type definitions
│   └── shared/         # Shared code between main and renderer
├── public/             # Static assets
├── package.json
├── tsconfig.json
└── webpack.config.js
```

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development mode:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Package the application:
   ```bash
   npm run package
   ```

## Data Format

Countries data is stored in JSON format:

```json
{
  "countries": [
    {
      "code": "US",
      "name": "United States",
      "visited": true,
      "visitDate": "2023-06-15"
    }
  ],
  "lastUpdated": "2025-10-26"
}
```

## Development Notes

- The project uses Electron's IPC (Inter-Process Communication) for secure file operations
- Map data uses GeoJSON format for country boundaries
- All UI components are built with accessibility in mind
- The application follows Electron security best practices

## Future Enhancements

- Add photos for each country
- Trip planning features
- Share travel map as an image
- Multiple profiles (family members)
- Travel statistics (total distance, most visited continent, etc.)

## License

Personal project - created with love for Dad
