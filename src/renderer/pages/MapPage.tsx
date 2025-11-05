import React, { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Sphere,
} from 'react-simple-maps';
import { Country, Visit } from '../../shared/types';
import { isCountryVisited } from '../../shared/migration';
import FlagIcon from '../components/FlagIcon';
import '../styles/MapPage.css';

// Using Natural Earth 50m for better coverage - includes more small countries
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

interface MapPageProps {
  countries: Country[];
  onToggleCountry: (countryCode: string, visitData?: Partial<Visit> | 'unmark') => void;
}

// Mapping from numeric country IDs (UN M49) to ISO 3-letter codes
// NOTE: IDs have leading zeros to match GeoJSON format ('004' not '4')
const countryIdToIso: { [key: string]: string } = {
  '004': 'AFG', '008': 'ALB', '010': 'ATA', '012': 'DZA', '016': 'ASM', '020': 'AND',
  '024': 'AGO', '028': 'ATG', '031': 'AZE', '032': 'ARG', '036': 'AUS', '040': 'AUT',
  '044': 'BHS', '048': 'BHR', '050': 'BGD', '051': 'ARM', '052': 'BRB', '056': 'BEL',
  '060': 'BMU', '064': 'BTN', '068': 'BOL', '070': 'BIH', '072': 'BWA', '074': 'BVT',
  '076': 'BRA', '084': 'BLZ', '086': 'IOT', '090': 'SLB', '092': 'VGB', '096': 'BRN',
  '100': 'BGR', '104': 'MMR', '108': 'BDI', '112': 'BLR', '116': 'KHM', '120': 'CMR',
  '124': 'CAN', '132': 'CPV', '136': 'CYM', '140': 'CAF', '144': 'LKA', '148': 'TCD',
  '152': 'CHL', '156': 'CHN', '158': 'TWN', '162': 'CXR', '166': 'CCK', '170': 'COL',
  '174': 'COM', '175': 'MYT', '178': 'COG', '180': 'COD', '184': 'COK', '188': 'CRI',
  '191': 'HRV', '192': 'CUB', '196': 'CYP', '203': 'CZE', '204': 'BEN', '208': 'DNK',
  '212': 'DMA', '214': 'DOM', '218': 'ECU', '222': 'SLV', '226': 'GNQ', '231': 'ETH',
  '232': 'ERI', '233': 'EST', '234': 'FRO', '238': 'FLK', '239': 'SGS', '242': 'FJI',
  '246': 'FIN', '248': 'ALA', '250': 'FRA', '254': 'GUF', '258': 'PYF', '260': 'ATF',
  '262': 'DJI', '266': 'GAB', '268': 'GEO', '270': 'GMB', '275': 'PSE', '276': 'DEU',
  '288': 'GHA', '292': 'GIB', '296': 'KIR', '300': 'GRC', '304': 'GRL', '308': 'GRD',
  '312': 'GLP', '316': 'GUM', '320': 'GTM', '324': 'GIN', '328': 'GUY', '332': 'HTI',
  '334': 'HMD', '336': 'VAT', '340': 'HND', '344': 'HKG', '348': 'HUN', '352': 'ISL',
  '356': 'IND', '360': 'IDN', '364': 'IRN', '368': 'IRQ', '372': 'IRL', '376': 'ISR',
  '380': 'ITA', '384': 'CIV', '388': 'JAM', '392': 'JPN', '398': 'KAZ', '400': 'JOR',
  '404': 'KEN', '408': 'PRK', '410': 'KOR', '414': 'KWT', '417': 'KGZ', '418': 'LAO',
  '422': 'LBN', '426': 'LSO', '428': 'LVA', '430': 'LBR', '434': 'LBY', '438': 'LIE',
  '440': 'LTU', '442': 'LUX', '446': 'MAC', '450': 'MDG', '454': 'MWI', '458': 'MYS',
  '462': 'MDV', '466': 'MLI', '470': 'MLT', '474': 'MTQ', '478': 'MRT', '480': 'MUS',
  '484': 'MEX', '492': 'MCO', '496': 'MNG', '498': 'MDA', '499': 'MNE', '500': 'MSR',
  '504': 'MAR', '508': 'MOZ', '512': 'OMN', '516': 'NAM', '520': 'NRU', '524': 'NPL',
  '528': 'NLD', '531': 'CUW', '533': 'ABW', '534': 'SXM', '535': 'BES', '540': 'NCL',
  '548': 'VUT', '554': 'NZL', '558': 'NIC', '562': 'NER', '566': 'NGA', '570': 'NIU',
  '574': 'NFK', '578': 'NOR', '580': 'MNP', '581': 'UMI', '583': 'FSM', '584': 'MHL',
  '585': 'PLW', '586': 'PAK', '591': 'PAN', '598': 'PNG', '600': 'PRY', '604': 'PER',
  '608': 'PHL', '612': 'PCN', '616': 'POL', '620': 'PRT', '624': 'GNB', '626': 'TLS',
  '630': 'PRI', '634': 'QAT', '638': 'REU', '642': 'ROU', '643': 'RUS', '646': 'RWA',
  '652': 'BLM', '654': 'SHN', '659': 'KNA', '660': 'AIA', '662': 'LCA', '663': 'MAF',
  '666': 'SPM', '670': 'VCT', '674': 'SMR', '678': 'STP', '682': 'SAU', '686': 'SEN',
  '688': 'SRB', '690': 'SYC', '694': 'SLE', '702': 'SGP', '703': 'SVK', '704': 'VNM',
  '705': 'SVN', '706': 'SOM', '710': 'ZAF', '716': 'ZWE', '724': 'ESP', '728': 'SSD',
  '729': 'SDN', '732': 'ESH', '740': 'SUR', '744': 'SJM', '748': 'SWZ', '752': 'SWE',
  '756': 'CHE', '760': 'SYR', '762': 'TJK', '764': 'THA', '768': 'TGO', '772': 'TKL',
  '776': 'TON', '780': 'TTO', '784': 'ARE', '788': 'TUN', '792': 'TUR', '795': 'TKM',
  '796': 'TCA', '798': 'TUV', '800': 'UGA', '804': 'UKR', '807': 'MKD', '818': 'EGY',
  '826': 'GBR', '831': 'GGY', '832': 'JEY', '833': 'IMN', '834': 'TZA', '840': 'USA',
  '850': 'VIR', '854': 'BFA', '858': 'URY', '860': 'UZB', '862': 'VEN', '876': 'WLF',
  '882': 'WSM', '887': 'YEM', '894': 'ZMB', '-99': 'XKX'  // Kosovo
};

type ProjectionType = 'geoEqualEarth' | 'geoMercator' | 'geoNaturalEarth1';

type ColorScheme = 'green' | 'blue' | 'purple' | 'orange';

const colorSchemes = {
  green: {
    visited: '#48bb78',
    unvisited: '#4a5568',
    visitedHover: '#38a169',
    unvisitedHover: '#718096',
    territory: '#3a3a4a',
  },
  blue: {
    visited: '#4299e1',
    unvisited: '#4a5568',
    visitedHover: '#3182ce',
    unvisitedHover: '#718096',
    territory: '#3a3a4a',
  },
  purple: {
    visited: '#9f7aea',
    unvisited: '#4a5568',
    visitedHover: '#805ad5',
    unvisitedHover: '#718096',
    territory: '#3a3a4a',
  },
  orange: {
    visited: '#ed8936',
    unvisited: '#4a5568',
    visitedHover: '#dd6b20',
    unvisitedHover: '#718096',
    territory: '#3a3a4a',
  },
};

// Visit type color scheme
const visitTypeColors = {
  leisure: {
    color: '#48bb78',
    hover: '#38a169',
  },
  business: {
    color: '#ed8936',
    hover: '#dd6b20',
  },
  transit: {
    color: '#ecc94b',
    hover: '#d69e2e',
  },
  other: {
    color: '#9f7aea',
    hover: '#805ad5',
  },
};

const MapPage: React.FC<MapPageProps> = ({ countries, onToggleCountry }) => {
  const [hoveredCountry, setHoveredCountry] = useState<{ name: string; code: string } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, -7]); // Centered slightly south of equator
  const [showCountryList, setShowCountryList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTerritories, setShowTerritories] = useState(true);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [newVisitDate, setNewVisitDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [visitType, setVisitType] = useState<'business' | 'leisure' | 'transit' | ''>('');
  const [visitNotes, setVisitNotes] = useState('');
  const [visitRating, setVisitRating] = useState<number>(0);
  const [showTip, setShowTip] = useState(true);
  const [projection, setProjection] = useState<ProjectionType>('geoNaturalEarth1');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('green');
  const [colorByVisitType, setColorByVisitType] = useState(false);

  const getCountryByGeo = (geo: any): Country | undefined => {
    let isoCode = countryIdToIso[geo.id];

    // Handle territories with N/A IDs or special names by checking name
    if (!isoCode && geo.properties?.name) {
      const name = geo.properties.name.toLowerCase();
      if (name.includes('kosovo')) isoCode = 'XKX';
      else if (name.includes('somaliland')) isoCode = 'SOL';
      else if (name.includes('n. cyprus') || name.includes('northern cyprus')) isoCode = 'NCY';
    }

    // Map known territory IDs to our codes
    if (geo.id === '304') isoCode = 'GRL'; // Greenland
    if (geo.id === '732') isoCode = 'ESH'; // Western Sahara
    if (geo.id === '010') isoCode = 'ATA'; // Antarctica

    if (!isoCode) return undefined;
    return countries.find((c) => c.code === isoCode);
  };

  const handleCountryClick = (geo: any) => {
    let isoCode = countryIdToIso[geo.id];

    // Handle territories with N/A IDs or special names by checking name
    if (!isoCode && geo.properties?.name) {
      const name = geo.properties.name.toLowerCase();
      if (name.includes('kosovo')) isoCode = 'XKX';
      else if (name.includes('somaliland')) isoCode = 'SOL';
      else if (name.includes('n. cyprus') || name.includes('northern cyprus')) isoCode = 'NCY';
    }

    // Map known territory IDs to our codes
    if (geo.id === '304') isoCode = 'GRL'; // Greenland
    if (geo.id === '732') isoCode = 'ESH'; // Western Sahara
    if (geo.id === '010') isoCode = 'ATA'; // Antarctica

    if (isoCode) {
      const country = countries.find((c) => c.code === isoCode);
      if (country) {
        // Always show modal to add/edit visit details
        setEditingCountry(country);

        if (isCountryVisited(country)) {
          // Load existing visit data
          const latestVisit = country.visits[0];
          setNewVisitDate(latestVisit.startDate);
          setNewEndDate(latestVisit.endDate || '');
          setVisitType(latestVisit.visitType || '');
          setVisitNotes(latestVisit.notes || '');
          setVisitRating(latestVisit.rating || 0);
        } else {
          // New visit - set defaults
          setNewVisitDate(new Date().toISOString().split('T')[0]);
          setNewEndDate('');
          setVisitType('');
          setVisitNotes('');
          setVisitRating(0);
        }
      }
    }
  };

  const getCountryFill = (geo: any): string => {
    const country = getCountryByGeo(geo);
    const colors = colorSchemes[colorScheme];
    if (!country) return colors.territory;

    if (!isCountryVisited(country)) {
      return colors.unvisited;
    }

    // If color by visit type is enabled, use visit type colors
    if (colorByVisitType && country.visits[0]) {
      const visitType = country.visits[0].visitType || 'other';
      return visitTypeColors[visitType].color;
    }

    return colors.visited;
  };

  const handleZoomIn = () => {
    if (zoom < 4) {
      setZoom(zoom + 0.5);
    }
  };

  const handleZoomOut = () => {
    if (zoom > 1) {
      setZoom(Math.max(1, zoom - 0.5));
    }
  };

  const handleReset = () => {
    setZoom(1);
    setCenter([0, 0]);
  };

  const handleMoveEnd = (position: any) => {
    setCenter(position.coordinates);
    setZoom(position.zoom);
  };

  // Get appropriate scale based on projection
  const getProjectionScale = () => {
    switch (projection) {
      case 'geoMercator':
        return 100; // Smaller scale to fit entire world in Mercator
      case 'geoEqualEarth':
        return 147;
      case 'geoNaturalEarth1':
        return 147;
      default:
        return 147;
    }
  };

  const handleCountryListClick = (country: Country, e: React.MouseEvent) => {
    e.stopPropagation();
    // Always show modal for adding/editing visit details
    setEditingCountry(country);

    if (isCountryVisited(country)) {
      // Load existing visit data
      const latestVisit = country.visits[0];
      setNewVisitDate(latestVisit.startDate);
      setNewEndDate(latestVisit.endDate || '');
      setVisitType(latestVisit.visitType || '');
      setVisitNotes(latestVisit.notes || '');
      setVisitRating(latestVisit.rating || 0);
    } else {
      // New visit - set defaults
      setNewVisitDate(new Date().toISOString().split('T')[0]);
      setNewEndDate('');
      setVisitType('');
      setVisitNotes('');
      setVisitRating(0);
    }
  };

  const handleSaveDate = () => {
    if (editingCountry && newVisitDate) {
      // Validate dates
      if (newEndDate && newEndDate < newVisitDate) {
        alert('End date cannot be before start date!');
        return;
      }

      // Save all visit data
      onToggleCountry(editingCountry.code, {
        startDate: newVisitDate,
        endDate: newEndDate || undefined,
        visitType: visitType || undefined,
        notes: visitNotes || undefined,
        rating: visitRating || undefined,
      });
      handleCancelEdit();
    }
  };

  const handleCancelEdit = () => {
    setEditingCountry(null);
    setNewVisitDate('');
    setNewEndDate('');
    setVisitType('');
    setVisitNotes('');
    setVisitRating(0);
  };

  const handleUnmarkVisit = () => {
    if (editingCountry) {
      onToggleCountry(editingCountry.code, 'unmark');
      handleCancelEdit();
    }
  };

  const regularCountries = countries.filter(c => !c.isTerritory);
  const territories = countries.filter(c => c.isTerritory);

  const filteredCountries = regularCountries
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredTerritories = territories
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const visitedCountriesCount = regularCountries.filter(c => isCountryVisited(c)).length;
  const visitedTerritoriesCount = territories.filter(c => isCountryVisited(c)).length;

  return (
    <div className="map-page">
      <div className="map-header">
        <div className="map-stats">
          <h2>
            {visitedCountriesCount} / {regularCountries.length} Countries Visited
          </h2>
          <p className="percentage">{((visitedCountriesCount / regularCountries.length) * 100).toFixed(1)}% of the world explored</p>
          {visitedTerritoriesCount > 0 && (
            <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', opacity: 0.8 }}>
              +{visitedTerritoriesCount} territories
            </p>
          )}
        </div>
        <div className="map-legend">
          {colorByVisitType ? (
            <>
              <div className="legend-item">
                <div className="legend-color" style={{ background: visitTypeColors.leisure.color }}></div>
                <span>Leisure</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: visitTypeColors.business.color }}></div>
                <span>Business</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: visitTypeColors.transit.color }}></div>
                <span>Transit</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: visitTypeColors.other.color }}></div>
                <span>Other</span>
              </div>
              <div className="legend-item">
                <div className="legend-color not-visited"></div>
                <span>Not Visited</span>
              </div>
            </>
          ) : (
            <>
              <div className="legend-item">
                <div className="legend-color visited"></div>
                <span>Visited</span>
              </div>
              <div className="legend-item">
                <div className="legend-color not-visited"></div>
                <span>Not Visited</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="map-container">
        <ComposableMap
          projection={projection}
          projectionConfig={{
            scale: getProjectionScale(),
          }}
          width={800}
          height={450}
        >
          <ZoomableGroup
            zoom={zoom}
            minZoom={1}
            maxZoom={4}
            center={center}
            onMoveEnd={handleMoveEnd}
          >
            <Sphere id="ocean" stroke="#2c5282" strokeWidth={0.5} fill="#1e3a5f" />
            <Geographies geography={geoUrl}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const country = getCountryByGeo(geo);
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
                          fill: (() => {
                            if (!country) return colorSchemes[colorScheme].territory;
                            if (!isCountryVisited(country)) return colorSchemes[colorScheme].unvisitedHover;

                            // If color by visit type is enabled, use visit type hover colors
                            if (colorByVisitType && country.visits[0]) {
                              const visitType = country.visits[0].visitType || 'other';
                              return visitTypeColors[visitType].hover;
                            }

                            return colorSchemes[colorScheme].visitedHover;
                          })(),
                          outline: 'none',
                          cursor: 'pointer',
                        },
                        pressed: { outline: 'none' },
                      }}
                      onMouseEnter={() => {
                        if (country) {
                          setHoveredCountry({ name: country.name, code: country.code });
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
            <FlagIcon countryCode={hoveredCountry.code} size="small" />
            {hoveredCountry.name}
          </div>
        )}

        <div className="zoom-controls">
          <button onClick={handleZoomIn} className="zoom-btn" title="Zoom In">+</button>
          <button onClick={handleZoomOut} className="zoom-btn" title="Zoom Out">-</button>
          <button onClick={handleReset} className="zoom-btn reset-btn" title="Reset View">⟲</button>
          <button
            onClick={() => setShowCountryList(!showCountryList)}
            className="zoom-btn list-btn"
            title="Country List"
            style={{ fontSize: '1.2rem' }}
          >
            ☰
          </button>
        </div>

        <div className="map-controls">
          <div className="projection-selector">
            <select
              value={projection}
              onChange={(e) => setProjection(e.target.value as ProjectionType)}
              className="projection-dropdown"
              title="Map Projection"
            >
              <option value="geoNaturalEarth1">Natural Earth</option>
              <option value="geoMercator">Mercator</option>
              <option value="geoEqualEarth">Equal Earth</option>
            </select>
          </div>
          <div className="color-scheme-selector">
            <select
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value as ColorScheme)}
              className="color-dropdown"
              title="Color Scheme"
              disabled={colorByVisitType}
            >
              <option value="green">🟢 Green</option>
              <option value="blue">🔵 Blue</option>
              <option value="purple">🟣 Purple</option>
              <option value="orange">🟠 Orange</option>
            </select>
          </div>
          <div className="color-mode-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={colorByVisitType}
                onChange={(e) => setColorByVisitType(e.target.checked)}
              />
              <span>Color by Visit Type</span>
            </label>
          </div>
        </div>

        {showCountryList && (
          <div className="country-list-panel">
            <div className="country-list-header">
              <h3>All Countries ({regularCountries.length})</h3>
              <button onClick={() => setShowCountryList(false)} className="close-btn">×</button>
            </div>
            <input
              type="text"
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="country-search"
            />
            <div className="country-list-scroll">
              {filteredCountries.map(country => (
                <div
                  key={country.code}
                  className={`country-list-item ${isCountryVisited(country) ? 'visited' : ''}`}
                  onClick={(e) => handleCountryListClick(country, e)}
                >
                  <div className="country-info">
                    <FlagIcon countryCode={country.code} size="small" />
                    <span className="country-name">{country.name}</span>
                  </div>
                  <span className="country-status">{isCountryVisited(country) ? '✓' : ''}</span>
                </div>
              ))}

              {filteredTerritories.length > 0 && (
                <>
                  <div className="territory-divider">
                    <label className="territory-toggle">
                      <input
                        type="checkbox"
                        checked={showTerritories}
                        onChange={(e) => setShowTerritories(e.target.checked)}
                      />
                      <span>Show Territories/Disputed Areas ({territories.length})</span>
                    </label>
                  </div>

                  {showTerritories && filteredTerritories.map(territory => (
                    <div
                      key={territory.code}
                      className={`country-list-item territory ${isCountryVisited(territory) ? 'visited' : ''}`}
                      onClick={(e) => handleCountryListClick(territory, e)}
                    >
                      <div className="country-info">
                        <FlagIcon countryCode={territory.code} size="small" />
                        <span className="country-name">{territory.name}</span>
                      </div>
                      <span className="country-status">{isCountryVisited(territory) ? '✓' : ''}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showTip && (
        <div className="map-info">
          <button
            onClick={() => setShowTip(false)}
            className="close-tip-btn"
            title="Dismiss tip"
          >
            ×
          </button>
          <p>💡 <strong>Tip:</strong> Use scroll wheel to zoom, drag to pan, or use the + / - buttons. Can't find a small country? Click the ☰ button to access the full country list!</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.8 }}>
            Note: Disputed territories (Greenland, Western Sahara, Somaliland, Northern Cyprus, Antarctica) are available as optional trackable areas in the country list.
          </p>
        </div>
      )}

      {editingCountry && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content visit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Visit for {editingCountry.name}</h3>

            <div className="form-grid">
              {/* Start Date */}
              <div className="form-field">
                <label>Start Date *</label>
                <input
                  type="date"
                  value={newVisitDate}
                  onChange={(e) => setNewVisitDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {/* End Date */}
              <div className="form-field">
                <label>End Date (optional)</label>
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  min={newVisitDate}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Visit Type */}
              <div className="form-field">
                <label>Visit Type</label>
                <select value={visitType} onChange={(e) => setVisitType(e.target.value as any)}>
                  <option value="">Other</option>
                  <option value="leisure">Leisure</option>
                  <option value="business">Business</option>
                  <option value="transit">Transit</option>
                </select>
              </div>

              {/* Rating */}
              <div className="form-field">
                <label>Rating</label>
                <div className="rating-input-container">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={visitRating || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0 && value <= 5) {
                        setVisitRating(Math.round(value * 10) / 10); // Round to 1 decimal
                      } else if (e.target.value === '') {
                        setVisitRating(0);
                      }
                    }}
                    placeholder="0.0"
                    className="rating-input"
                  />
                  <div className="star-rating-display">
                    {[1, 2, 3, 4, 5].map((starIndex) => {
                      // Calculate what portion of this star should be filled
                      // For rating 3.1: stars 1,2,3 full (100%), star 4 is 1/10 = 10%, star 5 is 0%
                      const wholeStars = Math.floor(visitRating);
                      const decimal = visitRating - wholeStars; // Get decimal part (0.0-0.9)

                      let fillPercent = 0;
                      if (starIndex <= wholeStars) {
                        fillPercent = 100; // Full star
                      } else if (starIndex === wholeStars + 1) {
                        // Star character renders non-linearly, scale down by half
                        fillPercent = (decimal * 100) / 2;
                      }

                      return (
                        <span
                          key={starIndex}
                          className="star-container"
                          onClick={(e) => {
                            // Calculate click position within the star
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const starWidth = rect.width;
                            const clickPercent = clickX / starWidth;

                            // Convert to decimal (0.0 to 0.9)
                            const decimal = Math.floor(clickPercent * 10) / 10;
                            const newRating = (starIndex - 1) + decimal;
                            setVisitRating(Math.min(5, newRating));
                          }}
                          title={`Click position for ${starIndex - 1}.0 to ${starIndex - 1}.9`}
                        >
                          <span className="star-bg">☆</span>
                          {fillPercent > 0 && (
                            <span
                              className="star-fill"
                              style={{ width: `${fillPercent}%` }}
                            >
                              ★
                            </span>
                          )}
                        </span>
                      );
                    })}
                    {visitRating > 0 && (
                      <button
                        className="clear-rating"
                        onClick={() => setVisitRating(0)}
                        title="Clear rating"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="form-field" style={{ marginTop: '1rem' }}>
              <label>Notes & Memories</label>
              <textarea
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                placeholder="Add your memories, highlights, or notes about this visit..."
                rows={3}
              />
            </div>

            <div className="modal-actions">
              {isCountryVisited(editingCountry) && (
                <button onClick={handleUnmarkVisit} className="btn-secondary" style={{ marginRight: 'auto' }}>
                  Unmark as Visited
                </button>
              )}
              <button onClick={handleCancelEdit} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveDate} className="btn-primary">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
