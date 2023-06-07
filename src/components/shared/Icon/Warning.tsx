import { FC } from 'react';
import { InnerIconProps, withIcon } from 'tempus-ui';

const Warning: FC<InnerIconProps> = ({ size }) => {
  return (
    <svg
      className="raft__icon raft__icon__warning"
      width={size}
      height={size}
      viewBox="0 0 20 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.80708 0.929088C9.33453 0.0236374 10.6655 0.0236374 11.1929 0.929088L19.8169 15.7336C20.3403 16.6321 19.679 17.75 18.624 17.75H1.37598C0.32103 17.75 -0.340344 16.6321 0.183057 15.7336L8.80708 0.929088Z"
        fill="#A38D00"
      />
      <path
        d="M8.75 6.50392V10.2325C8.75 10.9252 9.30959 11.4868 9.99987 11.4868C10.6903 11.4868 11.2499 10.925 11.2497 10.2322L11.249 6.50367C11.2489 5.82482 10.7104 5.26935 10.0342 5.25049C9.33081 5.23088 8.75 5.79776 8.75 6.50392Z"
        fill="white"
      />
      <path
        d="M11.2494 13.9962C11.2497 13.3033 10.6901 12.7412 9.99969 12.7412C9.3095 12.7412 8.75 13.303 8.75 13.9956C8.75 14.6882 9.3095 15.25 9.99969 15.25C10.6896 15.25 11.249 14.6886 11.2494 13.9962Z"
        fill="white"
      />
    </svg>
  );
};

export default withIcon(Warning);
