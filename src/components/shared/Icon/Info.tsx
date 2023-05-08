import { FC } from 'react';
import { InnerIconProps, withIcon } from 'tempus-ui';

const Close: FC<InnerIconProps> = ({ size }) => {
  const color = 'var(--infoColor, #c4c4c4)';

  return (
    <svg
      className="raft__icon raft__icon__info"
      width={size}
      height={size}
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_1497_94058)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8.125 15.5C11.991 15.5 15.125 12.366 15.125 8.5C15.125 4.63401 11.991 1.5 8.125 1.5C4.25901 1.5 1.125 4.63401 1.125 8.5C1.125 12.366 4.25901 15.5 8.125 15.5ZM8.125 16.5C12.5433 16.5 16.125 12.9183 16.125 8.5C16.125 4.08172 12.5433 0.5 8.125 0.5C3.70672 0.5 0.125 4.08172 0.125 8.5C0.125 12.9183 3.70672 16.5 8.125 16.5Z"
          fill={color}
        />
        <path
          d="M9.1248 11.4969L9.1248 8.51403C9.1248 7.95985 8.67713 7.5106 8.1249 7.5106C7.57259 7.5106 7.12489 7.95997 7.125 8.51423L7.1256 11.4971C7.12571 12.0401 7.55647 12.4845 8.09743 12.4996C8.66015 12.5153 9.1248 12.0618 9.1248 11.4969Z"
          fill={color}
        />
        <path
          d="M7.1253 5.50303C7.12502 6.05732 7.57271 6.50706 8.12505 6.50706C8.67719 6.50706 9.1248 6.05763 9.1248 5.50353C9.1248 4.94944 8.67719 4.5 8.12505 4.5C7.5731 4.5 7.12557 4.94913 7.1253 5.50303Z"
          fill={color}
        />
      </g>
      <defs>
        <clipPath id="clip0_1497_94058">
          <rect width="16" height="16" fill="white" transform="translate(0.125 0.5)" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default withIcon(Close);
