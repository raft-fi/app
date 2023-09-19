import { FC } from 'react';
import { InnerIconProps, withIcon } from 'tempus-ui';

const Gas: FC<InnerIconProps> = ({ size }) => {
  const color = 'var(--gasColor, var(--raft-grey-600))';

  return (
    <svg
      className="raft__icon raft__icon-gas"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.5523 3.63L14.5639 3.61654L11.2596 1.05154L10.2187 2.28179L11.9262 3.60704C11.5026 3.85371 11.1663 4.21681 10.9609 4.64913C10.7556 5.08145 10.6906 5.56298 10.7747 6.03111C10.8986 6.74283 11.4099 7.35795 12.0716 7.70233C12.811 8.08787 13.4594 8.05224 14.036 7.85591L14.0237 12.75C14.0246 12.8811 13.9915 13.0103 13.9272 13.126C13.8631 13.2418 13.7697 13.3403 13.6557 13.4128C13.5417 13.4853 13.4106 13.5294 13.2744 13.5411C13.1382 13.5527 13.001 13.5318 12.8754 13.4799C12.777 13.4395 12.6878 13.3812 12.6127 13.3081C12.5364 13.2347 12.4758 13.1477 12.4345 13.0519C12.3933 12.9562 12.3721 12.8535 12.3723 12.75L12.3913 11.1667C12.3921 10.8551 12.3285 10.5463 12.2042 10.2584C12.0799 9.97045 11.8972 9.70904 11.6668 9.48912C11.4367 9.26808 11.1633 9.09273 10.8624 8.97303C10.5614 8.85333 10.2389 8.79174 9.91304 8.79166H9.08696V2.45833C9.08696 2.03841 8.9129 1.63568 8.60303 1.33875C8.29317 1.04181 7.87294 0.875 7.43478 0.875H1.65217C1.21399 0.875 0.793754 1.04181 0.483913 1.33875C0.174065 1.63568 0 2.03841 0 2.45833V13.5417C0 13.9616 0.174065 14.3643 0.483913 14.6612C0.793754 14.9582 1.21399 15.125 1.65217 15.125H7.43478C7.87294 15.125 8.29317 14.9582 8.60303 14.6612C8.9129 14.3643 9.08696 13.9616 9.08696 13.5417V10.375H9.91304C10.0254 10.375 10.1336 10.3964 10.236 10.4367C10.4327 10.5192 10.5894 10.67 10.6747 10.8587C10.7176 10.9562 10.7395 11.0609 10.7391 11.1667L10.7193 12.75C10.7193 13.0714 10.7846 13.3825 10.9143 13.6747C11.039 13.9589 11.2183 14.213 11.4438 14.4275C11.6731 14.6496 11.9463 14.8257 12.2474 14.9454C12.5485 15.0651 12.8715 15.1262 13.1976 15.125C13.533 15.125 13.8568 15.0632 14.1624 14.9382C14.4582 14.8194 14.7242 14.6476 14.948 14.4307C15.1793 14.2106 15.3627 13.9487 15.4876 13.6602C15.6125 13.3717 15.6765 13.0623 15.6758 12.75L15.6957 5.62499C15.6948 5.22727 15.5897 4.83613 15.3899 4.48753C15.1902 4.13893 14.9021 3.84405 14.5523 3.63ZM7.43478 6.41665H1.65217V2.45833H7.43478V6.41665ZM13.2174 6.41665C12.9983 6.41665 12.7882 6.33324 12.6333 6.18478C12.4784 6.03631 12.3913 5.83495 12.3913 5.62499C12.3913 5.41503 12.4784 5.21366 12.6333 5.0652C12.7882 4.91673 12.9983 4.83332 13.2174 4.83332C13.4365 4.83332 13.6466 4.91673 13.8015 5.0652C13.9564 5.21366 14.0435 5.41503 14.0435 5.62499C14.0435 5.83495 13.9564 6.03631 13.8015 6.18478C13.6466 6.33324 13.4365 6.41665 13.2174 6.41665Z"
        fill={color}
      />
    </svg>
  );
};

export default withIcon(Gas);
