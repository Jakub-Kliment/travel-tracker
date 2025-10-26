import React, { useState, useEffect } from 'react';
import MapPage from './pages/MapPage';
import StatisticsPage from './pages/StatisticsPage';
import { TravelData } from '../shared/types';
import { getAllCountries } from './utils/countries';
import './styles/App.css';

type Page = 'map' | 'statistics';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('map');
  const [travelData, setTravelData] = useState<TravelData>({
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
            return savedCountry ? { ...country, visited: savedCountry.visited, visitDate: savedCountry.visitDate } : country;
          });
          setTravelData({
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

  const toggleCountryVisited = (countryCode: string, visitDate?: string) => {
    setTravelData((prevData) => {
      const updatedCountries = prevData.countries.map((country) => {
        if (country.code === countryCode) {
          // If visitDate is provided and country is already visited, just update the date
          if (visitDate && country.visited) {
            return {
              ...country,
              visitDate: visitDate,
            };
          }
          // Otherwise toggle the visited status
          return {
            ...country,
            visited: !country.visited,
            visitDate: !country.visited ? (visitDate || new Date().toISOString()) : undefined,
          };
        }
        return country;
      });

      return {
        countries: updatedCountries,
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  const handleSave = async () => {
    try {
      const result = await window.electronAPI.saveData(travelData);
      if (result.success) {
        alert('Data saved successfully!');
      } else {
        alert('Failed to save data: ' + result.error);
      }
    } catch (error) {
      alert('Failed to save data: ' + (error as Error).message);
    }
  };

  const handleLoad = async () => {
    try {
      const result = await window.electronAPI.loadData();
      if (result.success && result.data) {
        setTravelData(result.data);
        alert('Data loaded successfully!');
      } else {
        alert('Failed to load data: ' + result.error);
      }
    } catch (error) {
      alert('Failed to load data: ' + (error as Error).message);
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
          <button onClick={handleLoad} className="btn-secondary">
            Load
          </button>
          <button onClick={handleSave} className="btn-primary">
            Save
          </button>
        </div>
      </nav>

      <main className="main-content">
        {currentPage === 'map' ? (
          <MapPage
            countries={travelData.countries}
            onToggleCountry={toggleCountryVisited}
          />
        ) : (
          <StatisticsPage countries={travelData.countries} />
        )}
      </main>
    </div>
  );
};

export default App;
