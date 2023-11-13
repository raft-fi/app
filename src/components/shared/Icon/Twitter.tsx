import { FC } from 'react';
import { InnerIconProps, withIcon } from '@tempusfinance/common-ui';

const Twitter: FC<InnerIconProps> = ({ size }) => {
  const color = 'var(--twitterColor, var(--textSecondary))';

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M19.9525 7.9201C19.9647 8.09642 19.9647 8.27273 19.9647 8.45067C19.9647 13.8726 15.8371 20.1257 8.28966 20.1257V20.1224C6.06013 20.1257 3.8769 19.487 2 18.2829C2.32419 18.3219 2.65001 18.3414 2.97664 18.3422C4.82429 18.3438 6.61913 17.7239 8.07272 16.5823C6.31688 16.549 4.77717 15.4042 4.23928 13.7328C4.85436 13.8514 5.48812 13.8271 6.09181 13.6621C4.17753 13.2754 2.80033 11.5935 2.80033 9.64019C2.80033 9.62232 2.80033 9.60525 2.80033 9.58819C3.37071 9.90588 4.00934 10.0822 4.6626 10.1017C2.85964 8.89674 2.30388 6.49821 3.39265 4.62293C5.47593 7.1864 8.54966 8.7448 11.8493 8.90974C11.5186 7.4846 11.9703 5.9912 13.0364 4.98937C14.689 3.43585 17.2882 3.51547 18.8418 5.16731C19.7607 4.98612 20.6415 4.64893 21.4475 4.17117C21.1412 5.121 20.5001 5.92782 19.6437 6.44052C20.457 6.34464 21.2517 6.12689 22 5.79457C21.4491 6.62008 20.7552 7.33916 19.9525 7.9201Z"
        fill={color}
      />
    </svg>
  );
};

export default withIcon(Twitter);
