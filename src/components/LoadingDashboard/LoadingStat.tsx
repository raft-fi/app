import { memo } from 'react';

const LoadingStat = () => (
  <svg
    className="raft__loading-stat"
    width="856"
    height="160"
    viewBox="0 0 856 159"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="856" height="159" rx="8" fill="url(#paint0_linear_474_3863)" />
    <rect opacity="0.15" x="32" y="34" width="80" height="10" rx="5" fill="#003652" />
    <circle opacity="0.15" cx="42" cy="78.5" r="10" fill="#003652" />
    <rect opacity="0.15" x="62" y="71.5" width="100" height="14" rx="7" fill="#003652" />
    <rect opacity="0.1" x="32" y="111" width="40" height="8" rx="4" fill="#003652" />
    <rect opacity="0.15" x="317.333" y="34" width="80" height="10" rx="5" fill="#003652" />
    <circle opacity="0.15" cx="327.333" cy="78.5" r="10" fill="#003652" />
    <rect opacity="0.15" x="347.333" y="71.5" width="100" height="14" rx="7" fill="#003652" />
    <rect opacity="0.1" x="317.333" y="111" width="40" height="8" rx="4" fill="#003652" />
    <rect opacity="0.15" x="602.667" y="34" width="80" height="10" rx="5" fill="#003652" />
    <rect opacity="0.15" x="602.667" y="71.5" width="100" height="14" rx="7" fill="#003652" />
    <rect opacity="0.1" x="602.667" y="111" width="40" height="8" rx="4" fill="#003652" />
    <defs>
      <linearGradient id="paint0_linear_474_3863" x1="428" y1="0" x2="428" y2="159" gradientUnits="userSpaceOnUse">
        <stop stopColor="#003652" stopOpacity="0.08" />
        <stop offset="1" stopColor="#003652" stopOpacity="0.18" />
      </linearGradient>
    </defs>
  </svg>
);

export default memo(LoadingStat);
