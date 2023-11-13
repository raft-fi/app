import { FC } from 'react';
import { InnerIconProps, withIcon } from '@tempusfinance/common-ui';

const Error: FC<InnerIconProps> = ({ size }) => {
  const color = 'var(--errorColor, var(--textError))';

  return (
    <svg width={size} height={size} viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.17066 1.04327C7.59262 0.31891 8.65738 0.31891 9.07934 1.04327L15.9786 12.8868C16.3973 13.6056 15.8682 14.5 15.0242 14.5H1.22578C0.381824 14.5 -0.147275 13.6056 0.271446 12.8868L7.17066 1.04327Z"
        fill={color}
      />
      <path
        d="M7.125 5.50314V8.48597C7.125 9.04015 7.57267 9.4894 8.1249 9.4894C8.67721 9.4894 9.12491 9.04003 9.1248 8.48577L9.1242 5.50293C9.12409 4.95985 8.69333 4.51548 8.15237 4.5004C7.58965 4.4847 7.125 4.93821 7.125 5.50314Z"
        fill="white"
      />
      <path
        d="M9.1245 11.497C9.12478 10.9427 8.67709 10.4929 8.12475 10.4929C7.5726 10.4929 7.125 10.9424 7.125 11.4965C7.125 12.0506 7.5726 12.5 8.12475 12.5C8.6767 12.5 9.12422 12.0509 9.1245 11.497Z"
        fill="white"
      />
    </svg>
  );
};

export default withIcon(Error);
