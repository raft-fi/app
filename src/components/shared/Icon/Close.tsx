import { FC } from 'react';
import { InnerIconProps, withIcon } from '@tempusfinance/common-ui';

const Close: FC<InnerIconProps> = ({ size }) => {
  const color = 'var(--closeColor, var(--textSecondary))';

  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.00976 0.516392C2.32123 -0.172136 1.20491 -0.17213 0.516388 0.516405C-0.172134 1.20494 -0.172128 2.32127 0.516401 3.0098L5.50661 8L0.516401 12.9902C-0.172128 13.6787 -0.172134 14.7951 0.516388 15.4836C1.20491 16.1721 2.32123 16.1721 3.00976 15.4836L8 10.4934L12.9902 15.4836C13.6788 16.1721 14.7951 16.1721 15.4836 15.4836C16.1721 14.7951 16.1721 13.6787 15.4836 12.9902L10.4934 8L15.4836 3.0098C16.1721 2.32127 16.1721 1.20494 15.4836 0.516405C14.7951 -0.17213 13.6788 -0.172136 12.9902 0.516392L8 5.50662L3.00976 0.516392Z"
        fill={color}
      />
    </svg>
  );
};

export default withIcon(Close);
