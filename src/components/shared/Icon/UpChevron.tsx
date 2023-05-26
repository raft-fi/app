import { FC } from 'react';
import { InnerIconProps, withIcon } from 'tempus-ui';

const UpChevron: FC<InnerIconProps> = ({ size }) => {
  const color = 'var(--chevronUpColor, var(--textSecondary))';

  return (
    <svg
      className="raft__icon raft__icon-up-chevron"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M14 12L10 8L6 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default withIcon(UpChevron);
