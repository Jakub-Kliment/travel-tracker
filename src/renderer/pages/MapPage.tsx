import React, { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { Country } from '../../shared/types';
import '../styles/MapPage.css';

// Using Natural Earth 50m for better coverage - includes more small countries
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

interface MapPageProps {
  countries: Country[];
  onToggleCountry: (countryCode: string, visitDate?: string) => void;
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

const MapPage: React.FC<MapPageProps> = ({ countries, onToggleCountry }) => {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);

  const getCountryByGeo = (geo: any): Country | undefined => {
    let isoCode = countryIdToIso[geo.id];

    // Handle territories with N/A IDs by checking name
    if (!isoCode && geo.properties?.name) {
      const name = geo.properties.name.toLowerCase();
      if (name.includes('kosovo')) isoCode = 'XKX';
    }

    if (!isoCode) return undefined;
    return countries.find((c) => c.code === isoCode);
  };

  const handleCountryClick = (geo: any) => {
    let isoCode = countryIdToIso[geo.id];

    // Handle territories with N/A IDs by checking name
    if (!isoCode && geo.properties?.name) {
      const name = geo.properties.name.toLowerCase();
      if (name.includes('kosovo')) isoCode = 'XKX';
    }

    if (isoCode) {
      const country = countries.find((c) => c.code === isoCode);
      if (country) {
        onToggleCountry(isoCode, new Date().toISOString());
      }
    }
  };

  const getCountryFill = (geo: any): string => {
    const country = getCountryByGeo(geo);
    if (!country) return '#4a5568';
    return country.visited ? '#48bb78' : '#4a5568';
  };

  const visitedCount = countries.filter((c) => c.visited).length;
  const totalCount = countries.length;
  const percentage = ((visitedCount / totalCount) * 100).toFixed(1);

  const handleZoomIn = () => {
    if (zoom < 8) setZoom(zoom + 1);
  };

  const handleZoomOut = () => {
    if (zoom > 1) setZoom(zoom - 1);
  };

  const handleReset = () => {
    setZoom(1);
    setCenter([0, 20]);
  };

  const handleMoveEnd = (position: any) => {
    setCenter(position.coordinates);
    setZoom(position.zoom);
  };

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
          width={800}
          height={450}
        >
          <ZoomableGroup
            zoom={zoom}
            minZoom={1}
            maxZoom={8}
            center={center}
            onMoveEnd={handleMoveEnd}
          >
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
                          fill: country?.visited ? '#38a169' : '#718096',
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

        <div className="zoom-controls">
          <button onClick={handleZoomIn} className="zoom-btn" title="Zoom In">+</button>
          <button onClick={handleZoomOut} className="zoom-btn" title="Zoom Out">-</button>
          <button onClick={handleReset} className="zoom-btn reset-btn" title="Reset View">⟲</button>
        </div>
      </div>

      <div className="map-info">
        <p>💡 <strong>Tip:</strong> Use scroll wheel to zoom, drag to pan, or use the + / - buttons. Zoom in to see small countries!</p>
      </div>
    </div>
  );
};

export default MapPage;
