import React, { useState, useEffect, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Sphere,
} from 'react-simple-maps';
// Map geometry is bundled rather than fetched, so the app works fully offline.
import worldAtlas from 'world-atlas/countries-50m.json';
import { Country, Visit, VisitType } from '../../shared/types';
import { isCountryVisited, getMostRecentVisit } from '../../shared/migration';
import FlagIcon from '../components/FlagIcon';
import StarRating from '../components/StarRating';
import Icon from '../components/Icon';
import { t, countryName, formatDateRange, visitTypeLabel, formatDecimal, formatDate } from '../i18n';
import { countryIdToIso, territoryNameToIso } from './mapCodes';
import { findAnniversaries } from '../utils/anniversaries';
import { collectRecentPhotos } from '../utils/recentPhotos';
import '../styles/MapPage.css';

interface MapPageProps {
  countries: Country[];
  onToggleCountry: (countryCode: string, visitData?: Partial<Visit> | 'unmark') => void;
  onUpdateVisit: (countryCode: string, visitIndex: number, visitData: Partial<Visit>) => void;
  onDeleteVisit: (countryCode: string, visitIndex: number) => void;
}

/**
 * A geography as handed to us by react-simple-maps. The library ships no type
 * for this, and only these fields are used.
 */
interface Geo {
  rsmKey: string;
  id?: string;
  properties?: { name?: string };
}

/** Resolves an atlas geography to one of our ISO-3 country codes. */
const resolveIsoCode = (geo: Geo): string | undefined => {
  const byId = geo.id ? countryIdToIso[geo.id] : undefined;
  if (byId) return byId;

  const name = geo.properties?.name?.toLowerCase();
  if (!name) return undefined;
  return territoryNameToIso.find(([test]) => test(name))?.[1];
};

// Enough photos to read as a row of snapshots without crowding the map.
const PHOTO_STRIP_LIMIT = 8;

// One anniversary is the point; a long list would turn a memory into a report.
const ANNIVERSARY_LIMIT = 2;

type ProjectionType = 'geoEqualEarth' | 'geoMercator' | 'geoNaturalEarth1';

type ColorScheme = 'green' | 'blue' | 'purple' | 'orange';

// The map is printed on paper: unvisited land is a shade off the page and
// visited countries read as a wash of colour applied over it.
const colorSchemes = {
  green: {
    visited: '#6f9470',
    unvisited: '#e6dcc6',
    visitedHover: '#5f8460',
    unvisitedHover: '#dbcfb4',
    territory: '#efe7d6',
  },
  blue: {
    visited: '#6d94a6',
    unvisited: '#e6dcc6',
    visitedHover: '#5d8496',
    unvisitedHover: '#dbcfb4',
    territory: '#efe7d6',
  },
  purple: {
    visited: '#8b87a8',
    unvisited: '#e6dcc6',
    visitedHover: '#7b7798',
    unvisitedHover: '#dbcfb4',
    territory: '#efe7d6',
  },
  orange: {
    visited: '#c08d55',
    unvisited: '#e6dcc6',
    visitedHover: '#ad7c47',
    unvisitedHover: '#dbcfb4',
    territory: '#efe7d6',
  },
};

// Visit type colours, muted so the four sit together on the printed page.
const visitTypeColors = {
  holiday: {
    color: '#6f9470',
    hover: '#5f8460',
  },
  work: {
    color: '#c08d55',
    hover: '#ad7c47',
  },
  transit: {
    color: '#a85f47',
    hover: '#94513b',
  },
  other: {
    color: '#8b87a8',
    hover: '#7b7798',
  },
};

const MapPage: React.FC<MapPageProps> = ({ countries, onToggleCountry, onUpdateVisit, onDeleteVisit }) => {
  const [hoveredCountry, setHoveredCountry] = useState<{ name: string; code: string } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, -7]); // Centered slightly south of equator
  const [showCountryList, setShowCountryList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTerritories, setShowTerritories] = useState(true);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [editingVisitIndex, setEditingVisitIndex] = useState<number | null>(null);
  const [isAddingNewVisit, setIsAddingNewVisit] = useState(false);
  const [newVisitDate, setNewVisitDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [visitType, setVisitType] = useState<VisitType | ''>('');
  const [visitNotes, setVisitNotes] = useState('');
  const [visitRating, setVisitRating] = useState<number>(0);
  const [visitPhotos, setVisitPhotos] = useState<string[]>([]);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [projection, setProjection] = useState<ProjectionType>('geoNaturalEarth1');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('green');
  const [colorByVisitType, setColorByVisitType] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Geometry is bundled, so the map has rendered by the time this effect runs.
  // Signals the main process that it is safe to show the window.
  useEffect(() => {
    window.electronAPI?.mapReady();
  }, []);

  // Keep the open modal in sync when a visit is added/edited/removed.
  useEffect(() => {
    setEditingCountry((current) => {
      if (!current) return current;
      return countries.find((c) => c.code === current.code) ?? current;
    });
  }, [countries]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const resetVisitForm = () => {
    setIsAddingNewVisit(false);
    setEditingVisitIndex(null);
    setNewVisitDate('');
    setNewEndDate('');
    setVisitType('');
    setVisitNotes('');
    setVisitRating(0);
    setVisitPhotos([]);
  };

  const openCountryModal = (country: Country) => {
    setEditingCountry(country);
    resetVisitForm();
  };

  const getCountryByGeo = (geo: Geo): Country | undefined => {
    const isoCode = resolveIsoCode(geo);
    if (!isoCode) return undefined;
    return countries.find((c) => c.code === isoCode);
  };

  const handleCountryClick = (geo: Geo) => {
    const country = getCountryByGeo(geo);
    if (country) {
      openCountryModal(country);
    }
  };

  const getCountryFill = (country: Country | undefined, hovered = false): string => {
    const colors = colorSchemes[colorScheme];
    if (!country) return colors.territory;

    if (!isCountryVisited(country)) {
      return hovered ? colors.unvisitedHover : colors.unvisited;
    }

    // If color by visit type is enabled, colour by the most recent visit
    if (colorByVisitType) {
      const visitType = getMostRecentVisit(country)?.visitType || 'other';
      const scheme = visitTypeColors[visitType];
      return hovered ? scheme.hover : scheme.color;
    }

    return hovered ? colors.visitedHover : colors.visited;
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
    setCenter([0, -7]);
  };

  const handleMoveEnd = (position: { coordinates: [number, number]; zoom: number }) => {
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
    openCountryModal(country);
  };

  const handleStartAddVisit = () => {
    resetVisitForm();
    setIsAddingNewVisit(true);
    setNewVisitDate(new Date().toISOString().split('T')[0]);
  };

  const handleStartEditVisit = (visitIndex: number) => {
    if (!editingCountry) return;
    const visit = editingCountry.visits[visitIndex];
    setEditingVisitIndex(visitIndex);
    setIsAddingNewVisit(false);
    setNewVisitDate(visit.startDate);
    setNewEndDate(visit.endDate || '');
    setVisitType(visit.visitType || '');
    setVisitNotes(visit.notes || '');
    setVisitRating(visit.rating || 0);
    setVisitPhotos(visit.photos || []);
  };

  const handleSaveVisit = () => {
    if (!editingCountry || !newVisitDate) return;

    // Validate dates
    if (newEndDate && newEndDate < newVisitDate) {
      alert(t.visit.endBeforeStart);
      return;
    }

    const visitData: Partial<Visit> = {
      startDate: newVisitDate,
      endDate: newEndDate || undefined,
      visitType: visitType || undefined,
      notes: visitNotes || undefined,
      rating: visitRating || undefined,
      photos: visitPhotos.length > 0 ? visitPhotos : undefined,
    };

    if (isAddingNewVisit) {
      // Add new visit (useEffect will update editingCountry automatically)
      onToggleCountry(editingCountry.code, visitData);
    } else if (editingVisitIndex !== null) {
      // Update existing visit (useEffect will update editingCountry automatically)
      onUpdateVisit(editingCountry.code, editingVisitIndex, visitData);
    }

    resetVisitForm();
  };

  const handleCancelEditVisit = () => {
    resetVisitForm();
  };

  const handleDeleteVisit = (visitIndex: number) => {
    if (!editingCountry) return;
    if (confirm(t.visit.confirmDelete)) {
      onDeleteVisit(editingCountry.code, visitIndex);
      handleCancelEditVisit();
    }
  };

  const handleCloseModal = () => {
    setEditingCountry(null);
    resetVisitForm();
    setViewingPhoto(null);
  };

  const handleAddPhotos = async () => {
    try {
      const result = await window.electronAPI.selectPhotos();
      if (result.success && result.photos) {
        setVisitPhotos([...visitPhotos, ...result.photos]);
      }
    } catch (error) {
      console.error('Failed to add photos:', error);
      alert(t.export.photosFailed);
    }
  };

  const handleRemovePhoto = async (photoPath: string) => {
    try {
      await window.electronAPI.deletePhoto(photoPath);
      setVisitPhotos(visitPhotos.filter(p => p !== photoPath));
    } catch (error) {
      console.error('Failed to remove photo:', error);
    }
  };

  const handleUnmarkAll = () => {
    if (editingCountry && confirm(t.visit.confirmRemoveAll)) {
      onToggleCountry(editingCountry.code, 'unmark');
      handleCloseModal();
    }
  };

  const regularCountries = countries.filter(c => !c.isTerritory);
  const territories = countries.filter(c => c.isTerritory);

  // Search and sort both work on the displayed Slovak name, so the list is
  // ordered the way it reads and matches what the user types.
  const matchesSearch = (country: Country) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      countryName(country).toLowerCase().includes(term) ||
      country.name.toLowerCase().includes(term)
    );
  };
  const byName = (a: Country, b: Country) =>
    countryName(a).localeCompare(countryName(b), 'sk');

  const filteredCountries = regularCountries.filter(matchesSearch).sort(byName);
  const filteredTerritories = territories.filter(matchesSearch).sort(byName);

  const visitedCountriesCount = regularCountries.filter(c => isCountryVisited(c)).length;
  const visitedTerritoriesCount = territories.filter(c => isCountryVisited(c)).length;

  // Both strips read the whole country list, so they are recomputed only when
  // it actually changes rather than on every hover or zoom.
  const anniversaries = useMemo(() => findAnniversaries(countries), [countries]);
  const recentPhotos = useMemo(() => collectRecentPhotos(countries, PHOTO_STRIP_LIMIT), [countries]);

  return (
    <div className={`map-page ${isFullscreen ? 'fullscreen' : ''}`}>
      {!isFullscreen && (
      <div className="map-header">
        <div className="map-stats">
          <h2>{t.map.countriesVisited(visitedCountriesCount, regularCountries.length)}</h2>
          <p className="percentage">
            {t.map.percentExplored(formatDecimal((visitedCountriesCount / regularCountries.length) * 100))}
          </p>
          {visitedTerritoriesCount > 0 && (
            <p className="territories-note">{t.map.territoriesExtra(visitedTerritoriesCount)}</p>
          )}
        </div>

        {/*
          * On this day, some years ago. This is the one thing on the page that
          * is worth opening the app for when nothing is being recorded.
          */}
        {anniversaries.length > 0 && (
          <div className="anniversaries">
            {anniversaries.slice(0, ANNIVERSARY_LIMIT).map((anniversary) => (
              <button
                key={`${anniversary.country.code}-${anniversary.visit.startDate}`}
                type="button"
                className="anniversary"
                onClick={() => openCountryModal(anniversary.country)}
              >
                <span className="anniversary-years">{t.map.yearsAgo(anniversary.yearsAgo)}</span>
                <span className="anniversary-country">
                  <FlagIcon countryCode={anniversary.country.code} size="small" />
                  {countryName(anniversary.country)}
                </span>
                <span className="anniversary-date">{formatDate(anniversary.visit.startDate)}</span>
              </button>
            ))}
            {anniversaries.length > ANNIVERSARY_LIMIT && (
              <span className="anniversary-more">
                {t.map.anniversaryMore(anniversaries.length - ANNIVERSARY_LIMIT)}
              </span>
            )}
          </div>
        )}
        <div className="map-legend">
          {colorByVisitType ? (
            <>
              <div className="legend-item">
                <div className="legend-color" style={{ background: visitTypeColors.holiday.color }}></div>
                <span>{t.map.legendHoliday}</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: visitTypeColors.work.color }}></div>
                <span>{t.map.legendWork}</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: visitTypeColors.transit.color }}></div>
                <span>{t.map.legendTransit}</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: visitTypeColors.other.color }}></div>
                <span>{t.map.legendOther}</span>
              </div>
              <div className="legend-item">
                <div className="legend-color not-visited"></div>
                <span>{t.map.legendNotVisited}</span>
              </div>
            </>
          ) : (
            <>
              <div className="legend-item">
                <div className="legend-color visited"></div>
                <span>{t.map.legendVisited}</span>
              </div>
              <div className="legend-item">
                <div className="legend-color not-visited"></div>
                <span>{t.map.legendNotVisited}</span>
              </div>
            </>
          )}
        </div>
      </div>
      )}

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
            <Sphere id="ocean" stroke="#8aa6ad" strokeWidth={0.6} fill="#dce6e8" />
            <Geographies geography={worldAtlas as any}>
              {({ geographies }: { geographies: Geo[] }) =>
                geographies.map((geo: Geo) => {
                  const country = getCountryByGeo(geo);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getCountryFill(country)}
                      stroke="#8f8778"
                      strokeWidth={0.3}
                      style={{
                        default: {
                          outline: 'none',
                          transition: 'all 0.3s ease',
                        },
                        hover: {
                          fill: getCountryFill(country, true),
                          outline: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        },
                        pressed: {
                          outline: 'none',
                          transition: 'all 0.1s ease',
                        },
                      }}
                      onMouseEnter={() => {
                        if (country) {
                          setHoveredCountry({ name: countryName(country), code: country.code });
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
          <button onClick={handleZoomIn} className="zoom-btn" title={t.map.zoomIn}>
            <Icon name="plus" size={17} label={t.map.zoomIn} />
          </button>
          <button onClick={handleZoomOut} className="zoom-btn" title={t.map.zoomOut}>
            <Icon name="minus" size={17} label={t.map.zoomOut} />
          </button>
          <button onClick={handleReset} className="zoom-btn" title={t.map.resetView}>
            <Icon name="reset" size={17} label={t.map.resetView} />
          </button>
          {!isFullscreen && (
            <button
              onClick={() => setShowCountryList(!showCountryList)}
              className="zoom-btn"
              title={t.map.countryList}
            >
              <Icon name="list" size={17} label={t.map.countryList} />
            </button>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="zoom-btn"
            title={isFullscreen ? t.map.exitFullscreen : t.map.fullscreen}
          >
            <Icon
              name={isFullscreen ? 'collapse' : 'expand'}
              size={17}
              label={isFullscreen ? t.map.exitFullscreen : t.map.fullscreen}
            />
          </button>
        </div>

        {!isFullscreen && (
        <div className="map-controls">
          <div className="projection-selector">
            <select
              value={projection}
              onChange={(e) => setProjection(e.target.value as ProjectionType)}
              className="projection-dropdown"
              title={t.map.projection}
            >
              <option value="geoNaturalEarth1">{t.map.projectionNatural}</option>
              <option value="geoMercator">{t.map.projectionMercator}</option>
              <option value="geoEqualEarth">{t.map.projectionEqual}</option>
            </select>
          </div>
          <div className="color-scheme-selector">
            <select
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value as ColorScheme)}
              className="color-dropdown"
              title={t.map.colourScheme}
              disabled={colorByVisitType}
            >
              <option value="green">{t.map.colourGreen}</option>
              <option value="blue">{t.map.colourBlue}</option>
              <option value="purple">{t.map.colourPurple}</option>
              <option value="orange">{t.map.colourAmber}</option>
            </select>
          </div>
          <div className="color-mode-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={colorByVisitType}
                onChange={(e) => setColorByVisitType(e.target.checked)}
              />
              <span>{t.map.colourByType}</span>
            </label>
          </div>
        </div>
        )}

        {showCountryList && !isFullscreen && (
          <div className="country-list-panel">
            <div className="country-list-header">
              <h3>{t.map.allCountries(regularCountries.length)}</h3>
              <button onClick={() => setShowCountryList(false)} className="close-btn" title={t.map.close}>
                <Icon name="close" size={16} label={t.map.close} />
              </button>
            </div>
            <input
              type="text"
              placeholder={t.map.searchPlaceholder}
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
                    <span className="country-name">{countryName(country)}</span>
                  </div>
                  <span className="country-status">
                    {isCountryVisited(country) && <Icon name="check" size={14} />}
                  </span>
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
                      <span>{t.map.showTerritories(territories.length)}</span>
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
                        <span className="country-name">{countryName(territory)}</span>
                      </div>
                      <span className="country-status">
                        {isCountryVisited(territory) && <Icon name="check" size={14} />}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/*
        * A row of snapshots under the map, so photos are visible without
        * having to remember which country they were filed under. Clicking one
        * opens the trip it belongs to rather than just the image, which is
        * the context that makes it worth looking at.
        */}
      {!isFullscreen && recentPhotos.length > 0 && (
        <div className="photo-strip">
          <h3 className="photo-strip-title">{t.map.recentPhotos}</h3>
          <div className="photo-strip-items">
            {recentPhotos.map((photo) => (
              <button
                key={`${photo.country.code}-${photo.path}`}
                type="button"
                className="photo-strip-item"
                onClick={() => openCountryModal(photo.country)}
                title={`${countryName(photo.country)} · ${formatDate(photo.visit.startDate)}`}
              >
                <img src={`atom://${photo.path}`} alt={countryName(photo.country)} />
                <span className="photo-strip-caption">{countryName(photo.country)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {editingCountry && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content visit-modal multi-visit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{countryName(editingCountry)}</h3>

            {/* Show all visits in cards */}
            {!isAddingNewVisit && editingVisitIndex === null && (
              <div className="visits-container">
                {editingCountry.visits.length === 0 ? (
                  <p className="no-visits-message">{t.visit.noneYet}</p>
                ) : (
                  <>
                    {editingCountry.visits.map((visit, index) => (
                      <div key={index} className="visit-card">
                        <div className="visit-card-header">
                          <span className="visit-date">
                            {formatDateRange(visit.startDate, visit.endDate)}
                          </span>
                          <div className="visit-card-actions">
                            <button onClick={() => handleStartEditVisit(index)} className="btn-icon" title={t.visit.edit}>
                              <Icon name="pencil" size={15} label={t.visit.edit} />
                            </button>
                            <button onClick={() => handleDeleteVisit(index)} className="btn-icon" title={t.visit.delete}>
                              <Icon name="trash" size={15} label={t.visit.delete} />
                            </button>
                          </div>
                        </div>
                        {visit.visitType && (
                          <span className={`visit-type-badge ${visit.visitType}`}>
                            {visitTypeLabel(visit.visitType)}
                          </span>
                        )}
                        {visit.rating && (
                          <div className="visit-rating">
                            <StarRating rating={visit.rating} size="small" />
                          </div>
                        )}
                        {visit.notes && (
                          <p className="visit-notes">{visit.notes}</p>
                        )}
                        {visit.photos && visit.photos.length > 0 && (
                          <div className="visit-photos-preview">
                            {visit.photos.map((photo, photoIndex) => (
                              <div
                                key={photoIndex}
                                className="photo-thumbnail"
                                onClick={() => setViewingPhoto(photo)}
                              >
                                <img src={`atom://${photo}`} alt={`Visit photo ${photoIndex + 1}`} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Edit/Add form */}
            {(isAddingNewVisit || editingVisitIndex !== null) && (
              <div className="visit-edit-form">
                <h4>{isAddingNewVisit ? t.visit.addTitle : t.visit.editTitle}</h4>

                <div className="form-grid">
                  <div className="form-field">
                    <label>{t.visit.startDate}</label>
                    <input
                      type="date"
                      value={newVisitDate}
                      onChange={(e) => setNewVisitDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>{t.visit.endDateOptional}</label>
                    <input
                      type="date"
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      min={newVisitDate}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="form-field">
                    <label>{t.visit.type}</label>
                    <select
                      value={visitType}
                      onChange={(e) => setVisitType(e.target.value as VisitType | '')}
                    >
                      <option value="">{t.visit.typeUnset}</option>
                      <option value="holiday">{t.visit.typeHoliday}</option>
                      <option value="work">{t.visit.typeWork}</option>
                      <option value="transit">{t.visit.typeTransit}</option>
                      <option value="other">{t.visit.typeOther}</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>{t.visit.rating}</label>
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
                            setVisitRating(Math.round(value * 10) / 10);
                          } else if (e.target.value === '') {
                            setVisitRating(0);
                          }
                        }}
                        placeholder="0.0"
                        className="rating-input"
                      />
                      <div className="star-rating-display">
                        {[1, 2, 3, 4, 5].map((starIndex) => {
                          const wholeStars = Math.floor(visitRating);
                          const decimal = visitRating - wholeStars;

                          let fillPercent = 0;
                          if (starIndex <= wholeStars) {
                            fillPercent = 100;
                          } else if (starIndex === wholeStars + 1) {
                            fillPercent = (decimal * 100) / 2;
                          }

                          return (
                            <span
                              key={starIndex}
                              className="star-container"
                              onClick={(e) => {
                                e.stopPropagation();

                                // Get the actual rendered star character position
                                const starBg = e.currentTarget.querySelector('.star-bg') as HTMLElement;
                                if (!starBg) return;

                                const starRect = starBg.getBoundingClientRect();
                                const clickX = e.clientX - starRect.left;
                                const starWidth = starRect.width;

                                // Calculate position within the actual star (0.0 to 1.0)
                                const clickPercent = Math.max(0, Math.min(1, clickX / starWidth));

                                // Round to nearest 0.1
                                const baseRating = (starIndex - 1);
                                const decimal = Math.round(clickPercent * 10) / 10;
                                const newRating = baseRating + decimal;

                                setVisitRating(Math.min(5, Math.max(0, newRating)));
                              }}
                              title={`Click for rating ${starIndex - 1}.0 to ${starIndex}.0`}
                            >
                              <span className="star-bg">☆</span>
                              {fillPercent > 0 && (
                                <span className="star-fill" style={{ width: `${fillPercent}%` }}>★</span>
                              )}
                            </span>
                          );
                        })}
                        {visitRating > 0 && (
                          <button className="clear-rating" onClick={() => setVisitRating(0)} title={t.visit.clearRating}>
                            <Icon name="close" size={13} label={t.visit.clearRating} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-field" style={{ marginTop: '1rem' }}>
                  <label>{t.visit.notes}</label>
                  <textarea
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    placeholder={t.visit.notesPlaceholder}
                    rows={3}
                  />
                </div>

                {/* Photos */}
                <div className="form-field" style={{ marginTop: '1rem' }}>
                  <label>{t.visit.photos}</label>
                  <div className="photos-manager">
                    {visitPhotos.length > 0 && (
                      <div className="photos-grid">
                        {visitPhotos.map((photo, index) => (
                          <div key={index} className="photo-item">
                            <img src={`atom://${photo}`} alt={`Photo ${index + 1}`} />
                            <button
                              className="remove-photo-btn"
                              onClick={() => handleRemovePhoto(photo)}
                              title={t.visit.removePhoto}
                            >
                              <Icon name="close" size={13} label={t.visit.removePhoto} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button type="button" onClick={handleAddPhotos} className="btn-secondary add-photos-btn">
                      <Icon name="photos" size={15} />
                      {t.visit.addPhotos}
                    </button>
                  </div>
                </div>

                <div className="form-actions">
                  <button onClick={handleCancelEditVisit} className="btn-secondary">{t.visit.cancel}</button>
                  <button onClick={handleSaveVisit} className="btn-primary">{t.visit.save}</button>
                </div>
              </div>
            )}

            <div className="modal-actions">
              {!isAddingNewVisit && editingVisitIndex === null && (
                <>
                  <button onClick={handleStartAddVisit} className="btn-primary">
                    {t.visit.add}
                  </button>
                  {editingCountry.visits.length > 0 && (
                    <button onClick={handleUnmarkAll} className="btn-secondary" style={{ marginLeft: 'auto' }}>
                      {t.visit.removeAll}
                    </button>
                  )}
                </>
              )}
              <button onClick={handleCloseModal} className="btn-secondary">
                {t.map.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {viewingPhoto && (
        <div className="modal-overlay photo-viewer-overlay" onClick={() => setViewingPhoto(null)}>
          <div className="photo-viewer-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-photo-viewer" onClick={() => setViewingPhoto(null)} title={t.map.close}>
              <Icon name="close" size={20} label={t.map.close} />
            </button>
            <img src={`atom://${viewingPhoto}`} alt="Full size" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
