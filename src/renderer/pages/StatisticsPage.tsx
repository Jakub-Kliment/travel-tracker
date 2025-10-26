import React from 'react';
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
import { format, parseISO } from 'date-fns';
import '../styles/StatisticsPage.css';

interface StatisticsPageProps {
  countries: Country[];
}

const COLORS = ['#48bb78', '#4299e1', '#ed8936', '#9f7aea', '#f56565', '#38b2ac'];

const StatisticsPage: React.FC<StatisticsPageProps> = ({ countries }) => {
  const stats = calculateStatistics(countries);

  const visitedCountries = countries.filter((c) => c.visited);
  const notVisitedCountries = countries.filter((c) => !c.visited);

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
                    {entry.countries.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visited Countries List */}
        <div className="stat-card">
          <h3>Visited Countries ({visitedCountries.length})</h3>
          <div className="country-list">
            {visitedCountries
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((country) => (
                <div key={country.code} className="country-item visited">
                  <span>{country.name}</span>
                  {country.visitDate && (
                    <span className="visit-date">
                      {format(parseISO(country.visitDate), 'MMM yyyy')}
                    </span>
                  )}
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
                  {country.name}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
