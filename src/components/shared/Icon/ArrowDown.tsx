import { FC } from 'react';
import { InnerIconProps, withIcon } from 'tempus-ui';

const ArrowDown: FC<InnerIconProps> = ({ size }) => {
  const color = 'var(--arrowDownColor, #707B7E)';

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5V19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 12L12 19L5 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default withIcon(ArrowDown);
