import { FC } from 'react';
import { InnerIconProps, withIcon } from 'tempus-ui';

const TriangleUp: FC<InnerIconProps> = ({ size }) => {
  const color = 'var(--upTriangleColor, var(--colorUp))';

  return (
    <svg
      className="raft__icon raft__icon-triangle-up"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="Icon">
        <path id="Intersect" d="M4 17.7346L4.00001 17.8L19.9795 17.8L20 17.7673L11.9897 5L4 17.7346Z" fill={color} />
      </g>
    </svg>
  );
};

export default withIcon(TriangleUp);
