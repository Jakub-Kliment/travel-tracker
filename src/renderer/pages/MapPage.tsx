import React, { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { Country } from '../../shared/types';
import '../styles/MapPage.css';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface MapPageProps {
  countries: Country[];
  onToggleCountry: (countryCode: string, visitDate?: string) => void;
}

const MapPage: React.FC<MapPageProps> = ({ countries, onToggleCountry }) => {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [visitDate, setVisitDate] = useState('');

  const getCountryByCode = (code: string): Country | undefined => {
    return countries.find((c) => c.code === code);
  };

  const handleCountryClick = (geo: any) => {
    const countryCode = geo.id;
    const country = getCountryByCode(countryCode);

    if (country) {
      if (!country.visited) {
        // If marking as visited, show date modal
        setSelectedCountry(country);
        setVisitDate(new Date().toISOString().split('T')[0]);
        setShowDateModal(true);
      } else {
        // If unmarking, just toggle
        onToggleCountry(countryCode);
      }
    }
  };

  const handleDateSubmit = () => {
    if (selectedCountry && visitDate) {
      onToggleCountry(selectedCountry.code, new Date(visitDate).toISOString());
      setShowDateModal(false);
      setSelectedCountry(null);
      setVisitDate('');
    }
  };

  const handleDateCancel = () => {
    setShowDateModal(false);
    setSelectedCountry(null);
    setVisitDate('');
  };

  const getCountryFill = (geo: any): string => {
    const country = getCountryByCode(geo.id);
    if (!country) return '#2d3748';
    return country.visited ? '#48bb78' : '#2d3748';
  };

  const visitedCount = countries.filter((c) => c.visited).length;
  const totalCount = countries.length;
  const percentage = ((visitedCount / totalCount) * 100).toFixed(1);

  return (
    <div className="map-page">
      <div className="map-header">
        <div className="map-stats">
          <h2>
            {visitedCount} / {totalCount} Countries Visited
          </h2>
          <p className="percentage">{percentage}% of the world explored</p>
        </div>
        <div className="map-legend">
          <div className="legend-item">
            <div className="legend-color visited"></div>
            <span>Visited</span>
          </div>
          <div className="legend-item">
            <div className="legend-color not-visited"></div>
            <span>Not Visited</span>
          </div>
        </div>
      </div>

      <div className="map-container">
        <ComposableMap
          projectionConfig={{
            scale: 147,
          }}
        >
          <ZoomableGroup>
            <Geographies geography={geoUrl}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const country = getCountryByCode(geo.id);
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getCountryFill(geo)}
                      stroke="#1a202c"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: {
                          fill: country?.visited ? '#38a169' : '#4a5568',
                          outline: 'none',
                          cursor: 'pointer',
                        },
                        pressed: { outline: 'none' },
                      }}
                      onMouseEnter={() => {
                        if (country) {
                          setHoveredCountry(country.name);
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredCountry(null);
                      }}
                      onClick={() => handleCountryClick(geo)}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {hoveredCountry && (
          <div className="country-tooltip">
            {hoveredCountry}
          </div>
        )}
      </div>

      {showDateModal && (
        <div className="modal-overlay" onClick={handleDateCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>When did you visit {selectedCountry?.name}?</h3>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            <div className="modal-actions">
              <button onClick={handleDateCancel} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleDateSubmit} className="btn-primary">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
