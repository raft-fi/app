import { FC } from 'react';
import { InnerIconProps, withIcon } from 'tempus-ui';

const Copy: FC<InnerIconProps> = ({ size }) => {
  const color = 'var(--copyColor, var(--textSecondary))';

  return (
    <svg
      className="raft__icon raft__icon-copy"
      width={size}
      height={size}
      viewBox="0 0 16 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.3333 0.619263H6.22222C5.51498 0.619263 4.8367 0.900214 4.3366 1.40031C3.83651 1.90041 3.55556 2.57869 3.55556 3.28593V4.17482H2.66667C1.95942 4.17482 1.28115 4.45577 0.781049 4.95587C0.280952 5.45596 0 6.13424 0 6.84149V13.9526C0 14.6598 0.280952 15.3381 0.781049 15.8382C1.28115 16.3383 1.95942 16.6193 2.66667 16.6193H9.77778C10.485 16.6193 11.1633 16.3383 11.6634 15.8382C12.1635 15.3381 12.4444 14.6598 12.4444 13.9526V13.0637H13.3333C14.0406 13.0637 14.7189 12.7828 15.219 12.2827C15.719 11.7826 16 11.1043 16 10.397V3.28593C16 2.57869 15.719 1.90041 15.219 1.40031C14.7189 0.900214 14.0406 0.619263 13.3333 0.619263ZM10.6667 13.9526C10.6667 14.1883 10.573 14.4144 10.4063 14.5811C10.2396 14.7478 10.0135 14.8415 9.77778 14.8415H2.66667C2.43092 14.8415 2.20483 14.7478 2.03813 14.5811C1.87143 14.4144 1.77778 14.1883 1.77778 13.9526V6.84149C1.77778 6.60574 1.87143 6.37964 2.03813 6.21295C2.20483 6.04625 2.43092 5.9526 2.66667 5.9526H9.77778C10.0135 5.9526 10.2396 6.04625 10.4063 6.21295C10.573 6.37964 10.6667 6.60574 10.6667 6.84149V13.9526ZM14.2222 10.397C14.2222 10.6328 14.1286 10.8589 13.9619 11.0256C13.7952 11.1923 13.5691 11.2859 13.3333 11.2859H12.4444V6.84149C12.4444 6.13424 12.1635 5.45596 11.6634 4.95587C11.1633 4.45577 10.485 4.17482 9.77778 4.17482H5.33333V3.28593C5.33333 3.05018 5.42698 2.82409 5.59368 2.65739C5.76038 2.49069 5.98647 2.39704 6.22222 2.39704H13.3333C13.5691 2.39704 13.7952 2.49069 13.9619 2.65739C14.1286 2.82409 14.2222 3.05018 14.2222 3.28593V10.397Z"
        fill={color}
      />
    </svg>
  );
};

export default withIcon(Copy);
