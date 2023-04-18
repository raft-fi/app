import { FC } from 'react';
import { InnerIconProps, withIcon } from 'tempus-ui';

const Favorite: FC<InnerIconProps> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 49 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.5" width="48" height="48" rx="24" fill="#FF8D3A" fillOpacity="0.22" />
    <path
      d="M16.818 18.318C15.0607 20.0754 15.0607 22.9246 16.818 24.682L24.5001 32.364L32.182 24.682C33.9393 22.9246 33.9393 20.0754 32.182 18.318C30.4246 16.5607 27.5754 16.5607 25.818 18.318L24.5001 19.6361L23.182 18.318C21.4246 16.5607 18.5754 16.5607 16.818 18.318Z"
      stroke="#F76329"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default withIcon(Favorite);
