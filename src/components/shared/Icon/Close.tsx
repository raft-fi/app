import { FC } from 'react';
import { InnerIconProps, withIcon } from 'tempus-ui';

const ExternalLink: FC<InnerIconProps> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M0.419773 0.538791C0.7254 0.233163 1.22092 0.233163 1.52655 0.538791L11.9613 10.9736C12.267 11.2792 12.267 11.7747 11.9613 12.0803C11.6557 12.386 11.1602 12.386 10.8546 12.0803L0.419773 1.64557C0.114145 1.33994 0.114145 0.844419 0.419773 0.538791Z"
      fill="#344649"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M11.9613 0.538791C12.267 0.844419 12.267 1.33994 11.9613 1.64557L1.52655 12.0803C1.22092 12.386 0.7254 12.386 0.419773 12.0803C0.114145 11.7747 0.114145 11.2792 0.419773 10.9736L10.8546 0.538791C11.1602 0.233163 11.6557 0.233163 11.9613 0.538791Z"
      fill="#344649"
    />
  </svg>
);

export default withIcon(ExternalLink);
