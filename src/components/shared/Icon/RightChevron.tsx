import { FC } from 'react';
import { InnerIconProps, withIcon } from '@tempusfinance/common-ui';

const RightChevron: FC<InnerIconProps> = ({ size, color }) => (
  <svg
    className="raft__icon raft__icon-right-chevron"
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.29279 14.7068C7.10532 14.5191 7 14.2645 7 13.999C7 13.7335 7.10532 13.4788 7.29279 13.2911L10.5858 9.99396L7.29279 6.69683C7.11063 6.50799 7.00983 6.25508 7.01211 5.99255C7.01439 5.73003 7.11956 5.4789 7.30497 5.29326C7.49038 5.10762 7.74119 5.00232 8.00339 5.00004C8.26558 4.99776 8.51818 5.09868 8.70679 5.28106L12.7068 9.28607C12.8943 9.47383 12.9996 9.72846 12.9996 9.99396C12.9996 10.2595 12.8943 10.5141 12.7068 10.7018L8.70679 14.7068C8.51926 14.8946 8.26495 15 7.99979 15C7.73462 15 7.48031 14.8946 7.29279 14.7068Z"
      fill={color}
    />
  </svg>
);

export default withIcon(RightChevron);
