import { FC } from 'react';
import { InnerIconProps, withIcon } from '@tempusfinance/common-ui';

const Telegram: FC<InnerIconProps> = ({ size }) => {
  const color = 'var(--telegramColor, #707B7E)';

  return (
    <svg width={size} height={size} viewBox="0 0 23 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8.79848 10.3765L8.42757 14.5476C8.95825 14.5476 9.18809 14.3653 9.46371 14.1465L11.9517 12.2454L17.1072 15.2639C18.0527 15.6852 18.7189 15.4634 18.974 14.5685L22.358 1.89082L22.3589 1.89007C22.6588 0.772597 21.8535 0.335616 20.9323 0.609756L1.04098 6.69836C-0.316562 7.11965 -0.296007 7.7247 0.810205 7.99884L5.89561 9.26347L17.708 3.35415C18.2639 3.05984 18.7693 3.22268 18.3536 3.51699L8.79848 10.3765Z"
        fill={color}
      />
    </svg>
  );
};

export default withIcon(Telegram);
