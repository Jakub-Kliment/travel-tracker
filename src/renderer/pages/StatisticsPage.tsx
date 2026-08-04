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
import { Country } from '../../shared/types';
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
import { t, continentName, countryName, visitTypeLabel, formatDate, formatMonthYear } from '../i18n';
import '../styles/StatisticsPage.css';

interface StatisticsPageProps {
  countries: Country[];
}

// A single accent for progress bars: length carries the meaning here,
// so varying the hue per continent would only add noise.
const BAR_COLOR = '#a8763e';

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

  const pieData = [
    { name: t.stats.visited, value: stats.visitedCount },
    { name: t.stats.notVisited, value: stats.totalCountries - stats.visitedCount },
  ];

  const barData = stats.continentStats.map((cs) => ({
    continent: continentName(cs.continent),
    visited: cs.visited,
    notVisited: cs.total - cs.visited,
  }));

  return (
    <div className="statistics-page">
      <div className="stats-grid">
        {/* Overview Cards */}
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
          <p className="stat-percentage">{t.stats.percentComplete(stats.visitedPercentage.toFixed(1))}</p>
          {stats.visitedTerritoryCount > 0 && (
            <p className="stat-meta">
              {t.stats.territoriesLine(stats.visitedTerritoryCount, stats.totalTerritories)}
            </p>
          )}
        </div>

        {/* Travel Duration Stats */}
        <div className="stat-card">
          <h3>{t.stats.totalDays}</h3>
          <div className="stat-value">{stats.totalDaysTraveled}</div>
          <div className="stat-label">{t.stats.daysOnRoad}</div>
        </div>

        <div className="stat-card">
          <h3>{t.stats.averageTrip}</h3>
          <div className="stat-value">{stats.averageTripLength.toFixed(1)}</div>
          <div className="stat-label">{t.stats.daysPerTrip}</div>
          <p className="stat-meta">{t.stats.totalTrips(stats.totalTrips)}</p>
        </div>

        {/* Pie Chart */}
        <div className="stat-card">
          <h3>{t.stats.distribution}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#a8763e' : '#ddd2ba'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Visited Countries List */}
        <div className="stat-card">
          <h3>{t.stats.visitedCountries(visitedCountries.length)}</h3>
          <div className="country-list">
            {visitedCountries
              .sort((a, b) => {
                // Sort by visit date, most recent first
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
                        <span className="visit-date">
                          {formatMonthYear(visitDate)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Continent Statistics */}
        <div className="stat-card wide">
          <h3>{t.stats.byContinent}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="2 4" stroke="#d8cdb4" vertical={false} />
              <XAxis dataKey="continent" stroke="#9a8b76" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9a8b76" tick={{ fontSize: 12 }} />
              <Tooltip
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

        {/* Continent Details */}
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
                <span className="continent-percentage">{cs.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Not Visited Countries List */}
        <div className="stat-card">
          <h3>{t.stats.bucketList(notVisitedCountries.length)}</h3>
          <div className="country-list">
            {notVisitedCountries
              .sort((a, b) => countryName(a).localeCompare(countryName(b), 'sk'))
              .map((country) => (
                <div key={country.code} className="country-item not-visited">
                  <FlagIcon countryCode={country.code} size="small" />
                  {countryName(country)}
                </div>
              ))}
          </div>
        </div>

        {/* Visited Territories */}
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

        {/* Timeline */}
        {stats.timeline.length > 0 && (
          <div className="stat-card wide">
            <h3>{t.stats.timeline}</h3>
            <div className="timeline">
              {stats.timeline.map((entry, index) => (
                <div key={index} className="timeline-entry">
                  <div className="timeline-date">
                    {formatDate(entry.date)}
                  </div>
                  <div className="timeline-countries">
                    {entry.countryCodes ? (
                      entry.countries.map((name, idx) => {
                        const country = countries.find(c => c.code === entry.countryCodes![idx]);
                        return (
                          <span
                            key={entry.countryCodes![idx]}
                            className="timeline-country clickable"
                            onClick={() => country && setSelectedCountry(country)}
                          >
                            <FlagIcon countryCode={entry.countryCodes![idx]} size="small" />
                            {name}
                          </span>
                        );
                      })
                    ) : (
                      entry.countries.join(', ')
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Rated Countries */}
        {ratedCountries.length > 0 && (
          <div className="stat-card">
            <h3>{t.stats.topRated}</h3>
            <div className="ranking-list">
              {ratedCountries
                .slice(0, 10)
                .map(({ country, rating }, index) => {
                  return (
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
                  );
                })}
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
