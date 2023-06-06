import { FC } from 'react';
import { InnerIconProps, withIcon } from 'tempus-ui';

const Profile: FC<InnerIconProps> = ({ size }) => {
  const color = 'var(--profileColor, var(--textSecondary))';

  return (
    <svg
      className="raft__icon raft__icon__profile"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.5859 15.0078C14.7227 13.5078 13.1016 12.5 11.25 12.5H8.75C6.89844 12.5 5.27734 13.5078 4.41406 15.0078C5.78906 16.5391 7.78125 17.5 10 17.5C12.2188 17.5 14.2109 16.5352 15.5859 15.0078ZM20 10C20 15.5234 15.5234 20 10 20C4.47656 20 0 15.5234 0 10C0 4.47656 4.47656 0 10 0C15.5234 0 20 4.47656 20 10ZM10 10.625C11.5547 10.625 12.8125 9.36719 12.8125 7.8125C12.8125 6.25781 11.5547 5 10 5C8.44531 5 7.1875 6.25781 7.1875 7.8125C7.1875 9.36719 8.44531 10.625 10 10.625Z"
        fill={color}
      />
    </svg>
  );
};

export default withIcon(Profile);
