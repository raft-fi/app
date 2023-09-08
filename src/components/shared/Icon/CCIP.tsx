import { FC } from 'react';
import { InnerIconProps, withIcon } from 'tempus-ui';

const CCIP: FC<InnerIconProps> = ({ size }) => {
  const color = 'var(--ccipColor, var(--raft-grey-600))';

  return (
    <svg
      className="raft__icon raft__icon-ccip"
      width={size}
      height={size}
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.0021 4.70731L12.6195 7.34418V12.639L8.01482 15.2927L3.3974 12.6601V7.36523L8.0021 4.70731ZM8.0021 0.815186L6.30764 1.79243L1.69447 4.45037L0 5.42762V7.37366V12.6643V14.6103L1.69447 15.5792L6.31188 18.216L8.00634 19.1848L9.70084 18.2076L14.3055 15.5497L16 14.5766V12.6306V7.33574V5.3897L14.3055 4.42088L9.68812 1.78401L7.99366 0.815186H8.0021Z"
        fill={color}
      />
    </svg>
  );
};

export default withIcon(CCIP);
