import React from 'react';
import { isoThreeToTwo } from '../utils/isoCodes';

interface FlagIconProps {
  /** The 3-letter ISO country code (e.g. "USA", "GBR", "FRA"). */
  countryCode: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Displays a country flag using flag-icons, which is keyed by ISO 3166-1
 * alpha-2 codes while this app stores alpha-3. Codes with no artwork — the
 * two entities we assign our own codes to — fall back to the library's
 * placeholder rather than to an unrelated flag.
 */
const FlagIcon: React.FC<FlagIconProps> = ({ countryCode, size = 'medium', className = '' }) => {
  const twoLetterCode = isoThreeToTwo[countryCode] ?? 'xx';

  const sizeClass = {
    small: 'flag-icon-sm',
    medium: 'flag-icon-md',
    large: 'flag-icon-lg',
  }[size];

  return (
    <span
      className={`fi fi-${twoLetterCode} ${sizeClass} ${className}`.trim()}
      title={countryCode}
    />
  );
};

export default FlagIcon;
