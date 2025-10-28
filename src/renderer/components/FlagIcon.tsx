import React from 'react';

interface FlagIconProps {
  countryCode: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * FlagIcon component that displays a country flag using the flag-icons library.
 *
 * The flag-icons library uses ISO 3166-1-alpha-2 (2-letter) country codes,
 * but our app uses ISO 3166-1-alpha-3 (3-letter) codes.
 * This component handles the conversion automatically.
 *
 * @param countryCode - The 3-letter ISO country code (e.g., "USA", "GBR", "FRA")
 * @param size - The size of the flag icon ('small', 'medium', or 'large')
 * @param className - Additional CSS classes to apply
 */
const FlagIcon: React.FC<FlagIconProps> = ({ countryCode, size = 'medium', className = '' }) => {
  // Convert 3-letter ISO code to 2-letter code for flag-icons
  const twoLetterCode = convertToTwoLetterCode(countryCode);

  const sizeClass = {
    small: 'flag-icon-sm',
    medium: 'flag-icon-md',
    large: 'flag-icon-lg'
  }[size];

  return (
    <span
      className={`fi fi-${twoLetterCode} ${sizeClass} ${className}`}
      title={countryCode}
    />
  );
};

/**
 * Converts ISO 3166-1-alpha-3 (3-letter) country code to ISO 3166-1-alpha-2 (2-letter)
 * This is required because the flag-icons library uses 2-letter codes.
 */
function convertToTwoLetterCode(threeLetterCode: string): string {
  const mapping: { [key: string]: string } = {
    'AFG': 'af', 'ALB': 'al', 'DZA': 'dz', 'AND': 'ad', 'AGO': 'ao',
    'ATG': 'ag', 'ARG': 'ar', 'ARM': 'am', 'AUS': 'au', 'AUT': 'at',
    'AZE': 'az', 'BHS': 'bs', 'BHR': 'bh', 'BGD': 'bd', 'BRB': 'bb',
    'BLR': 'by', 'BEL': 'be', 'BLZ': 'bz', 'BEN': 'bj', 'BTN': 'bt',
    'BOL': 'bo', 'BIH': 'ba', 'BWA': 'bw', 'BRA': 'br', 'BRN': 'bn',
    'BGR': 'bg', 'BFA': 'bf', 'BDI': 'bi', 'CPV': 'cv', 'KHM': 'kh',
    'CMR': 'cm', 'CAN': 'ca', 'CAF': 'cf', 'TCD': 'td', 'CHL': 'cl',
    'CHN': 'cn', 'COL': 'co', 'COM': 'km', 'COG': 'cg', 'COD': 'cd',
    'CRI': 'cr', 'HRV': 'hr', 'CUB': 'cu', 'CYP': 'cy', 'CZE': 'cz',
    'DNK': 'dk', 'DJI': 'dj', 'DMA': 'dm', 'DOM': 'do', 'ECU': 'ec',
    'EGY': 'eg', 'SLV': 'sv', 'GNQ': 'gq', 'ERI': 'er', 'EST': 'ee',
    'SWZ': 'sz', 'ETH': 'et', 'FJI': 'fj', 'FIN': 'fi', 'FRA': 'fr',
    'GAB': 'ga', 'GMB': 'gm', 'GEO': 'ge', 'DEU': 'de', 'GHA': 'gh',
    'GRC': 'gr', 'GRD': 'gd', 'GTM': 'gt', 'GIN': 'gn', 'GNB': 'gw',
    'GUY': 'gy', 'HTI': 'ht', 'HND': 'hn', 'HUN': 'hu', 'ISL': 'is',
    'IND': 'in', 'IDN': 'id', 'IRN': 'ir', 'IRQ': 'iq', 'IRL': 'ie',
    'ISR': 'il', 'ITA': 'it', 'CIV': 'ci', 'JAM': 'jm', 'JPN': 'jp',
    'JOR': 'jo', 'KAZ': 'kz', 'KEN': 'ke', 'KIR': 'ki', 'PRK': 'kp',
    'KOR': 'kr', 'KWT': 'kw', 'KGZ': 'kg', 'LAO': 'la', 'LVA': 'lv',
    'LBN': 'lb', 'LSO': 'ls', 'LBR': 'lr', 'LBY': 'ly', 'LIE': 'li',
    'LTU': 'lt', 'LUX': 'lu', 'MDG': 'mg', 'MWI': 'mw', 'MYS': 'my',
    'MDV': 'mv', 'MLI': 'ml', 'MLT': 'mt', 'MHL': 'mh', 'MRT': 'mr',
    'MUS': 'mu', 'MEX': 'mx', 'FSM': 'fm', 'MDA': 'md', 'MCO': 'mc',
    'MNG': 'mn', 'MNE': 'me', 'MAR': 'ma', 'MOZ': 'mz', 'MMR': 'mm',
    'NAM': 'na', 'NRU': 'nr', 'NPL': 'np', 'NLD': 'nl', 'NZL': 'nz',
    'NIC': 'ni', 'NER': 'ne', 'NGA': 'ng', 'MKD': 'mk', 'NOR': 'no',
    'OMN': 'om', 'PAK': 'pk', 'PLW': 'pw', 'PSE': 'ps', 'PAN': 'pa',
    'PNG': 'pg', 'PRY': 'py', 'PER': 'pe', 'PHL': 'ph', 'POL': 'pl',
    'PRT': 'pt', 'QAT': 'qa', 'ROU': 'ro', 'RUS': 'ru', 'RWA': 'rw',
    'KNA': 'kn', 'LCA': 'lc', 'VCT': 'vc', 'WSM': 'ws', 'SMR': 'sm',
    'STP': 'st', 'SAU': 'sa', 'SEN': 'sn', 'SRB': 'rs', 'SYC': 'sc',
    'SLE': 'sl', 'SGP': 'sg', 'SVK': 'sk', 'SVN': 'si', 'SLB': 'sb',
    'SOM': 'so', 'ZAF': 'za', 'SSD': 'ss', 'ESP': 'es', 'LKA': 'lk',
    'SDN': 'sd', 'SUR': 'sr', 'SWE': 'se', 'CHE': 'ch', 'SYR': 'sy',
    'TJK': 'tj', 'TZA': 'tz', 'THA': 'th', 'TLS': 'tl', 'TGO': 'tg',
    'TON': 'to', 'TTO': 'tt', 'TUN': 'tn', 'TUR': 'tr', 'TKM': 'tm',
    'TUV': 'tv', 'UGA': 'ug', 'UKR': 'ua', 'ARE': 'ae', 'GBR': 'gb',
    'USA': 'us', 'URY': 'uy', 'UZB': 'uz', 'VUT': 'vu', 'VAT': 'va',
    'VEN': 've', 'VNM': 'vn', 'YEM': 'ye', 'ZMB': 'zm', 'ZWE': 'zw',
    // Disputed territories and special cases
    'GRL': 'gl', 'ESH': 'eh', 'XKX': 'xk', 'TWN': 'tw', 'PSX': 'ps'
  };

  return mapping[threeLetterCode] || 'un'; // 'un' as fallback for unknown codes
}

export default FlagIcon;
