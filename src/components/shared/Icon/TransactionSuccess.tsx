import { FC } from 'react';
import { InnerIconProps, withIcon } from '@tempusfinance/common-ui';

const TransactionSuccess: FC<InnerIconProps> = ({ size }) => (
  <svg
    className="raft__icon raft__icon__transactionSuccess"
    width={size}
    height={size}
    viewBox="0 0 142 142"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="71.0001" cy="71.0001" r="60.3832" fill="#F76329" fillOpacity="0.25" />
    <circle cx="71" cy="71" r="71" fill="#F76329" fillOpacity="0.25" />
    <circle cx="71" cy="71" r="49.1028" fill="#F76329" />
    <path
      d="M64.2292 89.5216C63.2101 89.5216 62.242 89.1139 61.5286 88.4006L47.1083 73.9805C45.6306 72.5028 45.6306 70.057 47.1083 68.5793C48.5859 67.1016 51.0318 67.1016 52.5094 68.5793L64.2292 80.2988L90.4198 54.1083C91.8974 52.6306 94.3432 52.6306 95.8209 54.1083C97.2986 55.5859 97.2986 58.0317 95.8209 59.5094L66.9298 88.4006C66.2164 89.1139 65.2483 89.5216 64.2292 89.5216Z"
      fill="white"
    />
  </svg>
);

export default withIcon(TransactionSuccess);
