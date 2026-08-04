import React from 'react';

/**
 * Line icons drawn on a 24x24 grid, stroked in the current text colour so
 * they inherit whatever the surrounding text is doing. Emoji were used here
 * before, which render differently on every platform and cannot be recoloured.
 */
export type IconName =
  | 'camera'
  | 'document'
  | 'photos'
  | 'pencil'
  | 'trash'
  | 'list'
  | 'expand'
  | 'collapse'
  | 'plus'
  | 'minus'
  | 'reset'
  | 'close'
  | 'check';

const paths: Record<IconName, React.ReactNode> = {
  camera: (
    <>
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2l1.1-2h8.4l1.1 2h2.2A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  document: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 16h6" />
    </>
  ),
  photos: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 15l4.5-4.5 4 4 3-3L21 16" />
      <circle cx="8.5" cy="9" r="1.25" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4l10-10-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  list: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  expand: (
    <>
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </>
  ),
  collapse: (
    <>
      <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  reset: (
    <>
      <path d="M4 12a8 8 0 1 1 2.6 5.9" />
      <path d="M4 18v-5h5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
};

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  /**
   * Icons are decorative by default. Pass a label when the icon is the only
   * content of a control, so it is announced to screen readers.
   */
  label?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 16, className = '', label }) => (
  <svg
    className={`icon ${className}`}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    focusable="false"
  >
    {paths[name]}
  </svg>
);

export default Icon;
