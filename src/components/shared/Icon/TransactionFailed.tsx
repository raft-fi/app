import { FC } from 'react';
import { InnerIconProps, withIcon } from 'tempus-ui';

const TransactionFailed: FC<InnerIconProps> = ({ size }) => (
  <svg
    className="raft__icon raft__icon__transactionFailed"
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
      d="M57.8496 85.1504L86.1497 56.8506"
      stroke="white"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M86.1497 85.1504L57.8496 56.8506"
      stroke="white"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const TransactionFailedIcon = withIcon(TransactionFailed);
