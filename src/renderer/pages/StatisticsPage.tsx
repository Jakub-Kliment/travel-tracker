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
import { isCountryVisited, getMostRecentVisitDate } from '../../shared/migration';
import { format, parseISO } from 'date-fns';
import FlagIcon from '../components/FlagIcon';
import '../styles/StatisticsPage.css';

interface StatisticsPageProps {
  countries: Country[];
}

const COLORS = ['#48bb78', '#4299e1', '#ed8936', '#9f7aea', '#f56565', '#38b2ac'];

const StatisticsPage: React.FC<StatisticsPageProps> = ({ countries }) => {
  const stats = calculateStatistics(countries);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const visitedCountries = countries.filter((c) => isCountryVisited(c));
  const notVisitedCountries = countries.filter((c) => !isCountryVisited(c));

  const pieData = [
    { name: 'Visited', value: stats.visitedCount },
    { name: 'Not Visited', value: stats.totalCountries - stats.visitedCount },
  ];

  const barData = stats.continentStats.map((cs) => ({
    continent: cs.continent,
    visited: cs.visited,
    notVisited: cs.total - cs.visited,
  }));

  return (
    <div className="statistics-page">
      <div className="stats-grid">
        {/* Overview Cards */}
        <div className="stat-card large">
          <h2>World Progress</h2>
          <div className="stat-value">{stats.visitedCount}</div>
          <div className="stat-label">Countries Visited</div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${stats.visitedPercentage}%` }}
            ></div>
          </div>
          <p className="stat-percentage">{stats.visitedPercentage.toFixed(1)}% Complete</p>
        </div>

        {/* Pie Chart */}
        <div className="stat-card">
          <h3>Distribution</h3>
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
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#48bb78' : '#2d3748'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Visited Countries List */}
        <div className="stat-card">
          <h3>Visited Countries ({visitedCountries.length})</h3>
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
                const visitType = country.visits[0]?.visitType;
                return (
                  <div
                    key={country.code}
                    className="country-item visited clickable"
                    onClick={() => setSelectedCountry(country)}
                  >
                    <span className="country-name-with-flag">
                      <FlagIcon countryCode={country.code} size="small" />
                      {country.name}
                    </span>
                    <div className="country-item-meta">
                      {visitType && (
                        <span className={`visit-type-badge ${visitType}`}>
                          {visitType}
                        </span>
                      )}
                      {visitDate && (
                        <span className="visit-date">
                          {format(parseISO(visitDate), 'MMM yyyy')}
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
          <h3>By Continent</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
              <XAxis dataKey="continent" stroke="#a0aec0" />
              <YAxis stroke="#a0aec0" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#2d3748',
                  border: '1px solid #4a5568',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="visited" stackId="a" fill="#48bb78" name="Visited" />
              <Bar dataKey="notVisited" stackId="a" fill="#2d3748" name="Not Visited" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Continent Details */}
        <div className="stat-card">
          <h3>Continent Breakdown</h3>
          <div className="continent-list">
            {stats.continentStats.map((cs, index) => (
              <div key={cs.continent} className="continent-item">
                <div className="continent-header">
                  <span className="continent-name">{cs.continent}</span>
                  <span className="continent-count">
                    {cs.visited} / {cs.total}
                  </span>
                </div>
                <div className="continent-bar">
                  <div
                    className="continent-bar-fill"
                    style={{
                      width: `${cs.percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  ></div>
                </div>
                <span className="continent-percentage">{cs.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Not Visited Countries List */}
        <div className="stat-card">
          <h3>Bucket List ({notVisitedCountries.length})</h3>
          <div className="country-list">
            {notVisitedCountries
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((country) => (
                <div key={country.code} className="country-item not-visited">
                  <FlagIcon countryCode={country.code} size="small" />
                  {country.name}
                </div>
              ))}
          </div>
        </div>

        {/* Timeline */}
        {stats.timeline.length > 0 && (
          <div className="stat-card wide">
            <h3>Travel Timeline</h3>
            <div className="timeline">
              {stats.timeline.map((entry, index) => (
                <div key={index} className="timeline-entry">
                  <div className="timeline-date">
                    {format(parseISO(entry.date), 'MMM d, yyyy')}
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
        {visitedCountries.filter(c => c.visits[0]?.rating).length > 0 && (
          <div className="stat-card">
            <h3>Top Rated Countries</h3>
            <div className="ranking-list">
              {visitedCountries
                .filter(c => c.visits[0]?.rating)
                .sort((a, b) => (b.visits[0]?.rating || 0) - (a.visits[0]?.rating || 0))
                .slice(0, 10)
                .map((country, index) => {
                  const rating = country.visits[0].rating || 0;
                  return (
                    <div
                      key={country.code}
                      className="ranking-item clickable"
                      onClick={() => setSelectedCountry(country)}
                    >
                      <span className="rank-number">#{index + 1}</span>
                      <FlagIcon countryCode={country.code} size="small" />
                      <span className="country-name">{country.name}</span>
                      <div className="rating-stars-small">
                        {Array.from({ length: 5 }, (_, i) => {
                          const starIndex = i + 1;
                          // For rating 3.4: stars 1,2,3 full, star 4 is 4/10 = 40%
                          const wholeStars = Math.floor(rating);
                          const decimal = rating - wholeStars; // 0.0-0.9

                          let fillPercent = 0;
                          if (starIndex <= wholeStars) {
                            fillPercent = 100;
                          } else if (starIndex === wholeStars + 1) {
                            // Star character renders non-linearly, scale down by half
                            fillPercent = (decimal * 100) / 2;
                          }

                          return (
                            <span key={i} className="star-container-display-small">
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
                        <span className="rating-number-small">{rating.toFixed(1)}</span>
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
          <div className="modal-content visit-details-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedCountry.name}</h3>

            {selectedCountry.visits[0] && (
              <div className="visit-details">
                <div className="detail-row">
                  <span className="detail-label">Dates:</span>
                  <span className="detail-value">
                    {format(parseISO(selectedCountry.visits[0].startDate), 'MMM d, yyyy')}
                    {selectedCountry.visits[0].endDate && (
                      <> - {format(parseISO(selectedCountry.visits[0].endDate), 'MMM d, yyyy')}</>
                    )}
                  </span>
                </div>

                {selectedCountry.visits[0].visitType && (
                  <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value capitalize">{selectedCountry.visits[0].visitType}</span>
                  </div>
                )}

                {selectedCountry.visits[0].rating && (
                  <div className="detail-row">
                    <span className="detail-label">Rating:</span>
                    <span className="detail-value rating-stars">
                      {Array.from({ length: 5 }, (_, i) => {
                        const rating = selectedCountry.visits[0].rating || 0;
                        const starIndex = i + 1;
                        // For rating 3.4: stars 1,2,3 full, star 4 is 4/10 = 40%
                        const wholeStars = Math.floor(rating);
                        const decimal = rating - wholeStars; // 0.0-0.9

                        let fillPercent = 0;
                        if (starIndex <= wholeStars) {
                          fillPercent = 100;
                        } else if (starIndex === wholeStars + 1) {
                          // Star character renders non-linearly, scale down by half
                          fillPercent = (decimal * 100) / 2;
                        }

                        return (
                          <span key={i} className="star-container-display">
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
                      <span className="rating-number">({selectedCountry.visits[0].rating.toFixed(1)})</span>
                    </span>
                  </div>
                )}

                {selectedCountry.visits[0].notes && (
                  <div className="detail-row notes-row">
                    <span className="detail-label">Notes:</span>
                    <p className="detail-notes">{selectedCountry.visits[0].notes}</p>
                  </div>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button onClick={() => setSelectedCountry(null)} className="btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;
