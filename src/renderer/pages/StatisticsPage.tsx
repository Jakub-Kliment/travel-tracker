import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Country, VisitType } from '../../shared/types';
import { calculateStatistics } from '../utils/statistics';
import {
  isCountryVisited,
  getMostRecentVisitDate,
  getMostRecentVisit,
  getBestRating,
} from '../../shared/migration';
import { parseISO, differenceInDays } from 'date-fns';
import FlagIcon from '../components/FlagIcon';
import StarRating from '../components/StarRating';
import {
  t,
  continentName,
  countryName,
  visitTypeLabel,
  formatDate,
  formatMonthYear,
  formatDecimal,
} from '../i18n';
import '../styles/StatisticsPage.css';

interface StatisticsPageProps {
  countries: Country[];
}

// A single accent for progress bars: length carries the meaning here,
// so varying the hue per continent would only add noise.
const BAR_COLOR = '#a8763e';

// Trip types keep the order and the colours used by the map legend, so the
// two pages describe the same journeys the same way.
const TRIP_TYPE_ORDER: VisitType[] = ['holiday', 'work', 'transit', 'other'];

const TRIP_TYPE_COLORS: Record<VisitType, string> = {
  holiday: '#6f9470',
  work: '#c08d55',
  transit: '#a85f47',
  other: '#8b87a8',
};

const StatisticsPage: React.FC<StatisticsPageProps> = ({ countries }) => {
  const stats = calculateStatistics(countries);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  // Territories are listed separately from sovereign countries so that the
  // counts here match the ones shown on the map page.
  const sovereignCountries = countries.filter((c) => !c.isTerritory);
  const visitedCountries = sovereignCountries.filter((c) => isCountryVisited(c));
  const notVisitedCountries = sovereignCountries.filter((c) => !isCountryVisited(c));
  const visitedTerritories = countries.filter((c) => c.isTerritory && isCountryVisited(c));

  // Ranked by the best rating given to a country across all of its visits,
  // so a country rated on a later trip is not overlooked.
  const ratedCountries = countries
    .filter((c) => isCountryVisited(c))
    .map((country) => ({ country, rating: getBestRating(country) }))
    .filter((entry): entry is { country: Country; rating: number } => entry.rating !== undefined)
    .sort((a, b) => b.rating - a.rating);

  // Every visit counted by its type, including territories — a trip is a trip.
  // Untyped visits fall under "other", which is what the map does too.
  const tripTypeCounts = countries
    .flatMap((country) => country.visits)
    .reduce<Record<VisitType, number>>(
      (counts, visit) => {
        const type = visit.visitType ?? 'other';
        counts[type] += 1;
        return counts;
      },
      { holiday: 0, work: 0, transit: 0, other: 0 }
    );

  const tripTypeData = TRIP_TYPE_ORDER.filter((type) => tripTypeCounts[type] > 0).map((type) => ({
    type,
    name: visitTypeLabel(type),
    value: tripTypeCounts[type],
    color: TRIP_TYPE_COLORS[type],
  }));

  const barData = stats.continentStats.map((cs) => ({
    continent: continentName(cs.continent),
    visited: cs.visited,
    notVisited: cs.total - cs.visited,
  }));

  return (
    <div className="statistics-page">
      <div className="stats-grid">
        {/*
          * Reading order, broadest first:
          *   1. how much of the world   2. how much time it took
          *   3. what kind of trips      4. where, per continent
          *   5. the lists themselves    6. when it all happened
          */}

        {/* 1 — Headline: how much of the world */}
        <div className="stat-card large">
          <h2>{t.stats.worldProgress}</h2>
          <div className="stat-value">{stats.visitedCount}</div>
          <div className="stat-label">{t.stats.countriesVisitedOf(stats.totalCountries)}</div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${stats.visitedPercentage}%` }}
            ></div>
          </div>
          <p className="stat-percentage">{t.stats.percentComplete(formatDecimal(stats.visitedPercentage))}</p>
          {stats.visitedTerritoryCount > 0 && (
            <p className="stat-meta">
              {t.stats.territoriesLine(stats.visitedTerritoryCount, stats.totalTerritories)}
            </p>
          )}
        </div>

        {/* 2 — How much time that took */}
        <div className="stat-card">
          <h3>{t.stats.totalDays}</h3>
          <div className="stat-value">{stats.totalDaysTraveled}</div>
          <div className="stat-label">{t.stats.daysOnRoad(stats.totalDaysTraveled)}</div>
        </div>

        <div className="stat-card">
          <h3>{t.stats.averageTrip}</h3>
          <div className="stat-value">{formatDecimal(stats.averageTripLength)}</div>
          <div className="stat-label">{t.stats.daysPerTrip}</div>
          <p className="stat-meta">{t.stats.totalTrips(stats.totalTrips)}</p>
        </div>

        {/* 3 — What kind of trips they were */}
        <div className="stat-card">
          <h3>{t.stats.tripTypes}</h3>
          {tripTypeData.length === 0 ? (
            <p className="empty-note">{t.stats.noTripTypes}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={tripTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={78}
                  paddingAngle={1}
                  dataKey="value"
                  nameKey="name"
                  stroke="#f8f3e8"
                  strokeWidth={2}
                >
                  {tripTypeData.map((entry) => (
                    <Cell key={entry.type} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  separator=": "
                  contentStyle={{
                    backgroundColor: '#f8f3e8',
                    border: '1px solid #d8cdb4',
                    borderRadius: '3px',
                    fontSize: '0.8125rem',
                  }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="square"
                  iconSize={9}
                  formatter={(value: string, entry) => {
                    const count = (entry?.payload as { value?: number } | undefined)?.value;
                    return `${value} · ${count ?? 0}`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="stat-card wide">
          <h3>{t.stats.byContinent}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="2 4" stroke="#d8cdb4" vertical={false} />
              <XAxis dataKey="continent" stroke="#9a8b76" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9a8b76" tick={{ fontSize: 12 }} />
              <Tooltip
                separator=": "
                contentStyle={{
                  backgroundColor: '#f8f3e8',
                  border: '1px solid #d8cdb4',
                  borderRadius: '3px',
                  fontSize: '0.8125rem',
                }}
              />
              <Legend />
              <Bar dataKey="visited" stackId="a" fill="#a8763e" name={t.stats.visited} />
              <Bar dataKey="notVisited" stackId="a" fill="#ddd2ba" name={t.stats.notVisited} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4 — The same continents, as numbers */}
        <div className="stat-card">
          <h3>{t.stats.continentBreakdown}</h3>
          <div className="continent-list">
            {stats.continentStats.map((cs) => (
              <div key={cs.continent} className="continent-item">
                <div className="continent-header">
                  <span className="continent-name">{continentName(cs.continent)}</span>
                  <span className="continent-count">
                    {cs.visited} / {cs.total}
                  </span>
                </div>
                <div className="continent-bar">
                  <div
                    className="continent-bar-fill"
                    style={{ width: `${cs.percentage}%`, backgroundColor: BAR_COLOR }}
                  ></div>
                </div>
                <span className="continent-percentage">{formatDecimal(cs.percentage)} %</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5 — The lists: best first, then everywhere visited, then what is left */}
        {ratedCountries.length > 0 && (
          <div className="stat-card">
            <h3>{t.stats.topRated}</h3>
            <div className="ranking-list">
              {ratedCountries
                .slice(0, 10)
                .map(({ country, rating }, index) => (
                  <div
                    key={country.code}
                    className="ranking-item clickable"
                    onClick={() => setSelectedCountry(country)}
                  >
                    <span className="rank-number">#{index + 1}</span>
                    <FlagIcon countryCode={country.code} size="small" />
                    <span className="country-name">{countryName(country)}</span>
                    <div className="rating-stars-small">
                      <StarRating rating={rating} size="small" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="stat-card">
          <h3>{t.stats.visitedCountries(visitedCountries.length)}</h3>
          <div className="country-list">
            {visitedCountries
              .slice()
              .sort((a, b) => {
                // Most recently visited first
                const dateA = getMostRecentVisitDate(a);
                const dateB = getMostRecentVisitDate(b);
                const timeA = dateA ? new Date(dateA).getTime() : 0;
                const timeB = dateB ? new Date(dateB).getTime() : 0;
                return timeB - timeA;
              })
              .map((country) => {
                const visitDate = getMostRecentVisitDate(country);
                const visitType = getMostRecentVisit(country)?.visitType;
                return (
                  <div
                    key={country.code}
                    className="country-item visited clickable"
                    onClick={() => setSelectedCountry(country)}
                  >
                    <span className="country-name-with-flag">
                      <FlagIcon countryCode={country.code} size="small" />
                      {countryName(country)}
                    </span>
                    <div className="country-item-meta">
                      {visitType && (
                        <span className={`visit-type-badge ${visitType}`}>
                          {visitTypeLabel(visitType)}
                        </span>
                      )}
                      {visitDate && (
                        <span className="visit-date">{formatMonthYear(visitDate)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {visitedTerritories.length > 0 && (
          <div className="stat-card">
            <h3>{t.stats.territories(visitedTerritories.length)}</h3>
            <div className="country-list">
              {visitedTerritories
                .slice()
                .sort((a, b) => countryName(a).localeCompare(countryName(b), 'sk'))
                .map((territory) => (
                  <div
                    key={territory.code}
                    className="country-item visited clickable"
                    onClick={() => setSelectedCountry(territory)}
                  >
                    <span className="country-name-with-flag">
                      <FlagIcon countryCode={territory.code} size="small" />
                      {countryName(territory)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="stat-card">
          <h3>{t.stats.bucketList(notVisitedCountries.length)}</h3>
          <div className="country-list">
            {notVisitedCountries
              .slice()
              .sort((a, b) => countryName(a).localeCompare(countryName(b), 'sk'))
              .map((country) => (
                <div key={country.code} className="country-item not-visited">
                  <FlagIcon countryCode={country.code} size="small" />
                  {countryName(country)}
                </div>
              ))}
          </div>
        </div>

        {/* 6 — When it all happened */}
        {stats.timeline.length > 0 && (
          <div className="stat-card wide">
            <h3>{t.stats.timeline}</h3>
            <div className="timeline">
              {stats.timeline.map((entry) => (
                <div key={entry.date} className="timeline-entry">
                  <div className="timeline-date">{formatDate(entry.date)}</div>
                  <div className="timeline-countries">
                    {entry.countries.map((name, idx) => {
                      const code = entry.countryCodes?.[idx];
                      const country = code ? countries.find((c) => c.code === code) : undefined;
                      return (
                        <span
                          key={code ?? name}
                          className={`timeline-country${country ? ' clickable' : ''}`}
                          onClick={() => country && setSelectedCountry(country)}
                        >
                          {code && <FlagIcon countryCode={code} size="small" />}
                          {country ? countryName(country) : name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Visit Details Modal */}
      {selectedCountry && isCountryVisited(selectedCountry) && (
        <div className="modal-overlay" onClick={() => setSelectedCountry(null)}>
          <div className="modal-content visit-details-modal multi-visit-modal-stats" onClick={(e) => e.stopPropagation()}>
            <h3>{countryName(selectedCountry)}</h3>

            <div className="all-visits-list">
              {selectedCountry.visits.map((visit, index) => (
                <div key={index} className="visit-detail-card">
                  <h4>{t.visit.visitNumber(index + 1)}</h4>

                  <div className="visit-details">
                    <div className="detail-row">
                      <span className="detail-label">{t.visit.dates}</span>
                      <span className="detail-value">
                        {formatDate(visit.startDate)}
                        {visit.endDate && <> – {formatDate(visit.endDate)}</>}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">{t.visit.duration}</span>
                      <span className="detail-value">
                        {(() => {
                          try {
                            const startDate = parseISO(visit.startDate);
                            const endDate = visit.endDate
                              ? parseISO(visit.endDate)
                              : startDate;
                            const days = differenceInDays(endDate, startDate) + 1;
                            return t.visit.days(days);
                          } catch {
                            return t.visit.days(1);
                          }
                        })()}
                      </span>
                    </div>

                    {visit.visitType && (
                      <div className="detail-row">
                        <span className="detail-label">{t.visit.type}</span>
                        <span className="detail-value">{visitTypeLabel(visit.visitType)}</span>
                      </div>
                    )}

                    {visit.rating && (
                      <div className="detail-row">
                        <span className="detail-label">{t.visit.rating}</span>
                        <span className="detail-value rating-stars">
                          <StarRating rating={visit.rating} parenthesizeValue />
                        </span>
                      </div>
                    )}

                    {visit.notes && (
                      <div className="detail-row notes-row">
                        <span className="detail-label">{t.visit.notes}</span>
                        <p className="detail-notes">{visit.notes}</p>
                      </div>
                    )}

                    {visit.photos && visit.photos.length > 0 && (
                      <div className="detail-row">
                        <span className="detail-label">{t.visit.photos}</span>
                        <div className="visit-photos-preview">
                          {visit.photos.map((photo, photoIndex) => (
                            <div
                              key={photoIndex}
                              className="photo-thumbnail"
                              onClick={() => setViewingPhoto(photo)}
                            >
                              <img src={`atom://${photo}`} alt={`Photo ${photoIndex + 1}`} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button onClick={() => setSelectedCountry(null)} className="btn-secondary">
                {t.stats.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {viewingPhoto && (
        <div className="modal-overlay photo-viewer-overlay" onClick={() => setViewingPhoto(null)}>
          <div className="photo-viewer-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-photo-viewer" onClick={() => setViewingPhoto(null)}>
              ×
            </button>
            <img src={`atom://${viewingPhoto}`} alt="Full size" />
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;
