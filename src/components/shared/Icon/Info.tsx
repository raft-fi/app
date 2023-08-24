import { FC } from 'react';
import { InnerIconProps, withIcon } from 'tempus-ui';

const Close: FC<InnerIconProps> = ({ size, color }) => {
  const selectedColor = color || 'var(--infoColor, var(--textSecondary))';

  return (
    <svg
      className="raft__icon raft__icon__info"
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.14706 11.0882C8.876 11.0882 11.0882 8.876 11.0882 6.14706C11.0882 3.41812 8.876 1.20588 6.14706 1.20588C3.41812 1.20588 1.20588 3.41812 1.20588 6.14706C1.20588 8.876 3.41812 11.0882 6.14706 11.0882ZM6.14706 11.7941C9.26586 11.7941 11.7941 9.26586 11.7941 6.14706C11.7941 3.02827 9.26586 0.5 6.14706 0.5C3.02827 0.5 0.5 3.02827 0.5 6.14706C0.5 9.26586 3.02827 11.7941 6.14706 11.7941Z"
        fill={selectedColor}
      />
      <path
        d="M6.8528 8.26252V6.15696C6.8528 5.76578 6.5368 5.44866 6.14699 5.44866C5.75712 5.44866 5.4411 5.76586 5.44118 6.1571L5.4416 8.26266C5.44168 8.64595 5.74574 8.95965 6.1276 8.97031C6.52481 8.98139 6.8528 8.66127 6.8528 8.26252Z"
        fill={selectedColor}
      />
      <path
        d="M5.44139 4.03155C5.44119 4.42281 5.75721 4.74028 6.14709 4.74028C6.53684 4.74028 6.8528 4.42303 6.8528 4.0319C6.8528 3.64078 6.53684 3.32353 6.14709 3.32353C5.75748 3.32353 5.44158 3.64056 5.44139 4.03155Z"
        fill={selectedColor}
      />
    </svg>
  );
};

export default withIcon(Close);
