import React, { useState, useEffect } from 'react';
import MapPage from './pages/MapPage';
import StatisticsPage from './pages/StatisticsPage';
import { TravelData, Visit } from '../shared/types';
import { getAllCountries } from './utils/countries';
import './styles/App.css';

type Page = 'map' | 'statistics';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('map');
  const [travelData, setTravelData] = useState<TravelData>({
    version: 2,
    countries: getAllCountries(),
    lastUpdated: new Date().toISOString(),
  });

  // Auto-load data on startup
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await window.electronAPI.autoLoadData();
        if (result.success && result.data) {
          // Merge loaded data with current country list to include new territories
          const allCountries = getAllCountries();
          const loadedData = result.data;
          const mergedCountries = allCountries.map(country => {
            const savedCountry = loadedData.countries.find(c => c.code === country.code);
            // Merge visits from saved data, keep new country structure
            return savedCountry ? { ...country, visits: savedCountry.visits } : country;
          });
          setTravelData({
            version: 2,
            countries: mergedCountries,
            lastUpdated: loadedData.lastUpdated
          });
        }
      } catch (error) {
        console.error('Failed to auto-load data:', error);
      }
    };
    loadData();
  }, []);

  // Auto-save data whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await window.electronAPI.autoSaveData(travelData);
      } catch (error) {
        console.error('Failed to auto-save data:', error);
      }
    };

    // Debounce auto-save to avoid excessive writes
    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [travelData]);

  const toggleCountryVisited = (countryCode: string, visitData?: Partial<Visit> | 'unmark') => {
    setTravelData((prevData) => {
      const updatedCountries = prevData.countries.map((country) => {
        if (country.code === countryCode) {
          if (visitData === 'unmark') {
            // Remove all visits (unmark)
            return {
              ...country,
              visits: [],
            };
          } else {
            // Add a new visit
            const newVisit: Visit = {
              startDate: visitData?.startDate || new Date().toISOString().split('T')[0],
              endDate: visitData?.endDate,
              visitType: visitData?.visitType,
              notes: visitData?.notes,
              rating: visitData?.rating,
              photos: visitData?.photos,
            };
            return {
              ...country,
              visits: [...country.visits, newVisit],
            };
          }
        }
        return country;
      });

      return {
        version: 2,
        countries: updatedCountries,
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  const updateVisit = (countryCode: string, visitIndex: number, visitData: Partial<Visit>) => {
    setTravelData((prevData) => {
      const updatedCountries = prevData.countries.map((country) => {
        if (country.code === countryCode) {
          const updatedVisits = [...country.visits];
          updatedVisits[visitIndex] = {
            ...updatedVisits[visitIndex],
            ...visitData,
          };
          return {
            ...country,
            visits: updatedVisits,
          };
        }
        return country;
      });

      return {
        version: 2,
        countries: updatedCountries,
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  const deleteVisit = (countryCode: string, visitIndex: number) => {
    setTravelData((prevData) => {
      const updatedCountries = prevData.countries.map((country) => {
        if (country.code === countryCode) {
          const updatedVisits = country.visits.filter((_, index) => index !== visitIndex);
          return {
            ...country,
            visits: updatedVisits,
          };
        }
        return country;
      });

      return {
        version: 2,
        countries: updatedCountries,
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  const handleExportImage = async () => {
    try {
      const result = await window.electronAPI.captureScreenshot();
      if (result.success) {
        alert(`Screenshot saved to: ${result.filePath}`);
      } else {
        alert('Failed to capture screenshot: ' + result.error);
      }
    } catch (error) {
      alert('Failed to capture screenshot: ' + (error as Error).message);
    }
  };

  const handleExportPDF = async () => {
    try {
      const { calculateStatistics } = await import('./utils/statistics');
      const stats = calculateStatistics(travelData.countries);

      const reportData = {
        visitedCount: stats.visitedCount,
        totalCountries: stats.totalCountries,
        visitedPercentage: stats.visitedPercentage.toFixed(1),
        totalDaysTraveled: stats.totalDaysTraveled,
        averageTripLength: stats.averageTripLength.toFixed(1),
        totalTrips: stats.totalTrips,
        continentStats: stats.continentStats.map(cs => ({
          continent: cs.continent,
          visited: cs.visited,
          total: cs.total,
          percentage: cs.percentage.toFixed(1),
        })),
        visitedCountries: travelData.countries
          .filter(c => c.visits.length > 0)
          .map(c => ({
            name: c.name,
            visitCount: c.visits.length,
          })),
      };

      const result = await window.electronAPI.generatePDFReport(reportData);
      if (result.success) {
        alert(`Report saved to: ${result.filePath}`);
      } else {
        alert('Failed to generate PDF: ' + result.error);
      }
    } catch (error) {
      alert('Failed to generate PDF: ' + (error as Error).message);
    }
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>Travel Tracker</h1>
        </div>
        <div className="nav-links">
          <button
            className={currentPage === 'map' ? 'active' : ''}
            onClick={() => setCurrentPage('map')}
          >
            World Map
          </button>
          <button
            className={currentPage === 'statistics' ? 'active' : ''}
            onClick={() => setCurrentPage('statistics')}
          >
            Statistics
          </button>
        </div>
        <div className="nav-actions">
          <button onClick={handleExportImage} className="btn-secondary">
            📸 Image
          </button>
          <button onClick={handleExportPDF} className="btn-primary">
            📄 PDF
          </button>
        </div>
      </nav>

      <main className="main-content">
        {currentPage === 'map' ? (
          <MapPage
            countries={travelData.countries}
            onToggleCountry={toggleCountryVisited}
            onUpdateVisit={updateVisit}
            onDeleteVisit={deleteVisit}
          />
        ) : (
          <StatisticsPage countries={travelData.countries} />
        )}
      </main>
    </div>
  );
};

export default App;
