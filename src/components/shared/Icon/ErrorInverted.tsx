import { FC } from 'react';
import { InnerIconProps, withIcon } from '@tempusfinance/common-ui';

const ErrorInverted: FC<InnerIconProps> = ({ size }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_3669_72820)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M26.863 2.62981C25.5971 0.45673 22.4029 0.45673 21.137 2.62981L0.439338 38.1605C-0.816825 40.3169 0.770471 43 3.30235 43H44.6977C47.2295 43 48.8168 40.3169 47.5607 38.1605L26.863 2.62981ZM21 24.9579V16.0094C21 14.3146 22.3939 12.9541 24.0821 13.0012C25.705 13.0464 26.9973 14.3796 26.9976 16.0088L26.9994 24.9573C26.9997 26.6201 25.6566 27.9682 23.9997 27.9682C22.343 27.9682 21 26.6205 21 24.9579ZM23.9993 30.9788C25.6563 30.9788 26.9993 32.328 26.9985 33.9909C26.9977 35.6526 25.6551 37 23.9992 37C22.3428 37 21 35.6517 21 33.9894C21 32.3271 22.3428 30.9788 23.9993 30.9788Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="clip0_3669_72820">
          <rect width="48" height="48" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default withIcon(ErrorInverted);
