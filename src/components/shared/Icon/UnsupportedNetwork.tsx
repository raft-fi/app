import { FC } from 'react';
import { InnerIconProps, withIcon } from 'tempus-ui';

const UnsupportedNetwork: FC<InnerIconProps> = ({ size }) => (
  <svg
    className="raft__icon raft__icon__unsupportedNetwork"
    width={size}
    height={size}
    viewBox="0 0 142 142"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="71.5082" cy="72.0023" r="60.3832" fill="#F76329" fillOpacity="0.25" />
    <circle cx="71.125" cy="71.6191" r="71" fill="#F76329" fillOpacity="0.25" />
    <circle cx="71.2278" cy="71.7219" r="49.1028" fill="#F76329" />
    <path
      d="M67.9866 41.5029C69.5953 38.7412 73.6547 38.7412 75.2634 41.5029L101.567 86.6565C103.163 89.3969 101.146 92.8066 97.9283 92.8066H45.3217C42.1041 92.8066 40.087 89.3969 41.6833 86.6565L67.9866 41.5029Z"
      fill="white"
    />
    <path
      d="M67.8125 58.5061V69.8782C67.8125 71.991 69.5192 73.7037 71.6246 73.7037C73.7303 73.7037 75.4372 71.9905 75.4367 69.8774L75.4344 58.5053C75.434 56.4348 73.7918 54.7407 71.7293 54.6831C69.584 54.6233 67.8125 56.3523 67.8125 58.5061Z"
      fill="#F76329"
    />
    <path
      d="M75.4356 81.3576C75.4366 79.2443 73.7299 77.5297 71.624 77.5297C69.519 77.5297 67.8125 79.2432 67.8125 81.3557C67.8125 83.4682 69.519 85.1816 71.624 85.1816C73.7284 85.1816 75.4345 83.4693 75.4356 81.3576Z"
      fill="#F76329"
    />
  </svg>
);

export default withIcon(UnsupportedNetwork);
