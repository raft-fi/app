import { FC } from 'react';
import { InnerIconProps, withIcon } from 'tempus-ui';

const Close: FC<InnerIconProps> = ({ size }) => {
  const color = 'var(--infoColor, #8E8E8E)';

  return (
    <svg
      className="raft__icon raft__icon__info"
      width={size}
      height={size}
      viewBox="0 0 16 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_1411_62749)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8 15.5C11.866 15.5 15 12.366 15 8.5C15 4.63401 11.866 1.5 8 1.5C4.13401 1.5 1 4.63401 1 8.5C1 12.366 4.13401 15.5 8 15.5ZM8 16.5C12.4183 16.5 16 12.9183 16 8.5C16 4.08172 12.4183 0.5 8 0.5C3.58172 0.5 0 4.08172 0 8.5C0 12.9183 3.58172 16.5 8 16.5Z"
          fill={color}
        />
        <path
          d="M8.9998 11.4969L8.9998 8.51403C8.9998 7.95985 8.55213 7.5106 7.9999 7.5106C7.44759 7.5106 6.99989 7.95997 7 8.51423L7.0006 11.4971C7.00071 12.0401 7.43147 12.4845 7.97243 12.4996C8.53515 12.5153 8.9998 12.0618 8.9998 11.4969Z"
          fill={color}
        />
        <path
          d="M7.0003 5.50303C7.00002 6.05732 7.44771 6.50706 8.00005 6.50706C8.55219 6.50706 8.9998 6.05763 8.9998 5.50353C8.9998 4.94944 8.55219 4.5 8.00005 4.5C7.4481 4.5 7.00057 4.94913 7.0003 5.50303Z"
          fill={color}
        />
      </g>
      <defs>
        <clipPath id="clip0_1411_62749">
          <rect width="16" height="16" fill="white" transform="translate(0 0.5)" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default withIcon(Close);
