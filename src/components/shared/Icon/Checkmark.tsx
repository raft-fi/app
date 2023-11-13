import { FC } from 'react';
import { InnerIconProps, withIcon } from '@tempusfinance/common-ui';

const Checkmark: FC<InnerIconProps> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 9 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1.0918 4.49983L2.85846 6.49924L7.27513 1.50073"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default withIcon(Checkmark);
