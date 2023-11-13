import { FC } from 'react';
import { InnerIconProps, withIcon } from '@tempusfinance/common-ui';

const LeftChevron: FC<InnerIconProps> = ({ size, color }) => (
  <svg
    className="raft__icon raft__icon-left-chevron"
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.707 5.28046C12.8944 5.46822 12.9998 5.72285 12.9998 5.98834C12.9998 6.25384 12.8944 6.50847 12.707 6.69623L9.41397 9.99335L12.707 13.2905C12.8891 13.4793 12.9899 13.7322 12.9876 13.9948C12.9854 14.2573 12.8802 14.5084 12.6948 14.694C12.5094 14.8797 12.2586 14.985 11.9964 14.9873C11.7342 14.9895 11.4816 14.8886 11.293 14.7062L7.29297 10.7012C7.1055 10.5135 7.00018 10.2588 7.00018 9.99335C7.00018 9.72785 7.1055 9.47323 7.29297 9.28546L11.293 5.28046C11.4805 5.09275 11.7348 4.9873 12 4.9873C12.2651 4.9873 12.5194 5.09275 12.707 5.28046Z"
      fill={color}
    />
  </svg>
);

export default withIcon(LeftChevron);
