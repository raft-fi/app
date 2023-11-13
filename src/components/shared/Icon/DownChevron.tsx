import { FC } from 'react';
import { InnerIconProps, withIcon } from '@tempusfinance/common-ui';

const DownChevron: FC<InnerIconProps> = ({ size }) => {
  const color = 'var(--chevronDownColor, var(--textSecondary))';

  return (
    <svg
      className="raft__icon raft__icon-down-chevron"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 8L10 12L14 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default withIcon(DownChevron);
