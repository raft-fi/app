import { FC } from 'react';
import { InnerIconProps, withIcon } from 'tempus-ui';

const Calendar: FC<InnerIconProps> = ({ size }) => {
  const color = 'var(--calendarColor, var(--textSecondary))';

  return (
    <svg
      className="raft__icon raft__icon-calendar"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clip-path="url(#clip0_2450_59129)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M4 0C4.36819 0 4.66667 0.298477 4.66667 0.666667V2H11.3333V0.666667C11.3333 0.298477 11.6318 0 12 0C12.3682 0 12.6667 0.298477 12.6667 0.666667V2H14C15.1046 2 16 2.89543 16 4V14C16 15.1046 15.1046 16 14 16H2C0.895431 16 0 15.1046 0 14V4C0 2.89543 0.895431 2 2 2H3.33333V0.666667C3.33333 0.298477 3.63181 0 4 0ZM1.33333 6V14C1.33333 14.3682 1.63181 14.6667 2 14.6667H14C14.3682 14.6667 14.6667 14.3682 14.6667 14V6H1.33333Z"
          fill={color}
        />
      </g>
      <defs>
        <clipPath id="clip0_2450_59129">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default withIcon(Calendar);
