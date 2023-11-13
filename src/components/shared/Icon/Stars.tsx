import { FC } from 'react';
import { InnerIconProps, withIcon } from '@tempusfinance/common-ui';

const Stars: FC<InnerIconProps> = ({ size }) => {
  const color = 'var(--successColor, #F97E4E)';

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="Icon" clipPath="url(#clip0_1223_16827)">
        <g id="Vector">
          <path
            d="M3.97183 0.105652C4.25186 0.105652 4.47887 0.332662 4.47887 0.612694C4.47887 1.87353 4.81466 2.87803 5.34247 3.55511C5.86339 4.22336 6.58483 4.59413 7.43662 4.59413C7.71665 4.59413 7.94367 4.82114 7.94367 5.10117C7.94367 5.3812 7.71665 5.60821 7.43662 5.60821C6.58483 5.60821 5.86339 5.97898 5.34247 6.64723C4.81519 7.32364 4.47954 8.32682 4.47887 9.5859L4.47887 9.58965C4.47887 9.86968 4.25186 10.0967 3.97183 10.0967C3.6918 10.0967 3.46479 9.86968 3.46479 9.58965C3.46479 8.32881 3.129 7.32431 2.6012 6.64723C2.08027 5.97898 1.35883 5.60821 0.507042 5.60821C0.227011 5.60821 0 5.3812 0 5.10117C0 4.82114 0.227011 4.59413 0.507042 4.59413C1.35883 4.59413 2.08027 4.22336 2.6012 3.55511C3.129 2.87803 3.46479 1.87353 3.46479 0.612694C3.46479 0.332662 3.6918 0.105652 3.97183 0.105652Z"
            fill={color}
          />
          <path
            d="M16.5634 2.47185C16.5634 2.19182 16.3364 1.96481 16.0563 1.96481C15.7763 1.96481 15.5493 2.19182 15.5493 2.47185C15.5493 3.50646 15.3394 4.70797 15.1243 5.91067C14.7842 7.18392 14.2523 8.27312 13.5729 9.14462C12.9926 9.88903 12.3016 10.4795 11.5203 10.8946C10.492 11.2518 9.46781 11.5986 8.61972 11.5986C8.33969 11.5986 8.11268 11.8256 8.11268 12.1057C8.11268 12.3857 8.33969 12.6127 8.61972 12.6127C10.6357 12.6127 12.3501 13.498 13.5729 15.0667C14.3001 15.9996 14.8584 17.1819 15.1933 18.5725C15.3821 19.7112 15.5493 20.8162 15.5493 21.7395C15.5493 22.0195 15.7763 22.2465 16.0563 22.2465C16.3364 22.2465 16.5634 22.0195 16.5634 21.7395C16.5634 21.6908 16.5636 21.6414 16.5641 21.591C16.59 18.8542 17.3318 16.6163 18.5398 15.0667C19.7626 13.498 21.477 12.6127 23.493 12.6127C23.773 12.6127 24 12.3857 24 12.1057C24 11.8256 23.773 11.5986 23.493 11.5986C23.4348 11.5986 23.3752 11.5978 23.3144 11.5963C21.3758 11.5455 19.7264 10.6668 18.5398 9.14462C17.31 7.56712 16.5634 5.27628 16.5634 2.47185Z"
            fill={color}
          />
          <path
            d="M9.04225 16.0929C9.32228 16.0929 9.54929 16.3199 9.54929 16.5999C9.54929 17.5323 9.79766 18.2631 10.1761 18.7486C10.5477 19.2253 11.0579 19.4866 11.662 19.4866C11.942 19.4866 12.169 19.7136 12.169 19.9936C12.169 20.2736 11.942 20.5007 11.662 20.5007C11.0579 20.5007 10.5477 20.762 10.1761 21.2386C9.79766 21.7241 9.54929 22.4549 9.54929 23.3873C9.54929 23.6674 9.32228 23.8944 9.04225 23.8944C8.76222 23.8944 8.53521 23.6674 8.53521 23.3873C8.53521 22.4549 8.28684 21.7241 7.90838 21.2386C7.5368 20.762 7.02663 20.5007 6.42253 20.5007C6.1425 20.5007 5.91549 20.2736 5.91549 19.9936C5.91549 19.7136 6.1425 19.4866 6.42253 19.4866C7.02663 19.4866 7.5368 19.2253 7.90838 18.7486C8.28684 18.2631 8.53521 17.5323 8.53521 16.5999C8.53521 16.3199 8.76222 16.0929 9.04225 16.0929Z"
            fill={color}
          />
        </g>
      </g>
      <defs>
        <clipPath id="clip0_1223_16827">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default withIcon(Stars);
