import { FC, ReactNode } from 'react';
import Typography from '../Typography';
import Icon from '../Icon';

import './InfoBox.scss';

interface InfoBoxProps {
  text: string | ReactNode;
  variant?: 'warning' | 'error';
}

const InfoBox: FC<InfoBoxProps> = ({ text, variant = 'warning' }) => {
  return (
    <div data-variant={variant} className="raft__infoBox">
      <Icon variant="info-sign" size={20} />
      {typeof text === 'string' ? (
        <Typography variant="body2" color={variant === 'error' ? 'text-error' : 'text-warning'}>
          {text}
        </Typography>
      ) : (
        text
      )}
    </div>
  );
};
export default InfoBox;
