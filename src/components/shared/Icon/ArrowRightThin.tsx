import { FC } from 'react';
import { InnerIconProps, withIcon } from 'tempus-ui';

const ArrowRightThin: FC<InnerIconProps> = ({ size }) => {
  const color = 'var(--arrowRightThinColor, #171717)';

  return (
    <svg
      className="raft__icon raft__icon__arrowRightThin"
      width={size}
      height={size}
      viewBox="0 0 13 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.4786 4.85355C12.6738 4.65829 12.6738 4.34171 12.4786 4.14645L9.29657 0.964466C9.10131 0.769204 8.78473 0.769204 8.58947 0.964466C8.3942 1.15973 8.3942 1.47631 8.58947 1.67157L11.4179 4.5L8.58947 7.32843C8.3942 7.52369 8.3942 7.84027 8.58947 8.03553C8.78473 8.2308 9.10131 8.2308 9.29657 8.03553L12.4786 4.85355ZM0.125 5H12.125V4H0.125V5Z"
        fill={color}
      />
    </svg>
  );
};

export default withIcon(ArrowRightThin);
