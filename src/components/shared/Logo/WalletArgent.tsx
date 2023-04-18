import { FC } from 'react';
import { InnerLogoProps } from './LogoProps';
import withLogo from './withLogo';

const ArgentLogo: FC<InnerLogoProps> = ({ size }) => (
  <svg
    className="raft__logo raft__logo-wallet-argent"
    width={size}
    height={size}
    viewBox="0 0 24 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15.2258 0.285645H9.14513C8.94191 0.285645 8.77913 0.453013 8.77469 0.661051C8.65187 6.5088 5.66425 12.059 0.521985 15.9902C0.358727 16.115 0.321533 16.3495 0.44089 16.5183L3.99859 21.5559C4.11963 21.7273 4.35544 21.766 4.52145 21.6401C7.73675 19.198 10.323 16.2521 12.1854 12.9868C14.0479 16.2521 16.6343 19.198 19.8496 21.6401C20.0154 21.766 20.2513 21.7273 20.3725 21.5559L23.9302 16.5183C24.0494 16.3495 24.0122 16.115 23.8491 15.9902C18.7067 12.059 15.7191 6.5088 15.5964 0.661051C15.592 0.453013 15.429 0.285645 15.2258 0.285645Z"
      fill="#FF875B"
    />
  </svg>
);

export default withLogo(ArgentLogo);
