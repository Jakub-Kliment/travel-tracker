import React from 'react';

interface StarRatingProps {
  rating: number;
  /** Controls the star size via the surrounding CSS classes. */
  size?: 'small' | 'medium';
  /** Appends the numeric value after the stars. */
  showValue?: boolean;
  /** Wraps the value in parentheses, as the detail modal does. */
  parenthesizeValue?: boolean;
}

/**
 * Renders a 0-5 star rating, supporting decimals by partially filling a star.
 *
 * The filled star glyph is overlaid on an outline glyph and clipped by width.
 * The glyph does not fill its box linearly, so the fractional part is scaled
 * by half to keep the visible fill roughly proportional to the value.
 */
const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 'medium',
  showValue = true,
  parenthesizeValue = false,
}) => {
  const containerClass =
    size === 'small' ? 'star-container-display-small' : 'star-container-display';
  const valueClass = size === 'small' ? 'rating-number-small' : 'rating-number';
  const wholeStars = Math.floor(rating);
  const decimal = rating - wholeStars;

  return (
    <>
      {[1, 2, 3, 4, 5].map((starIndex) => {
        let fillPercent = 0;
        if (starIndex <= wholeStars) {
          fillPercent = 100;
        } else if (starIndex === wholeStars + 1) {
          fillPercent = (decimal * 100) / 2;
        }

        return (
          <span key={starIndex} className={containerClass}>
            <span className="star-bg">☆</span>
            {fillPercent > 0 && (
              <span className="star-fill" style={{ width: `${fillPercent}%` }}>
                ★
              </span>
            )}
          </span>
        );
      })}
      {showValue && (
        <span className={valueClass}>
          {parenthesizeValue ? `(${rating.toFixed(1)})` : rating.toFixed(1)}
        </span>
      )}
    </>
  );
};

export default StarRating;
