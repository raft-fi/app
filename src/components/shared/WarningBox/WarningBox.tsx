import { FC } from 'react';
import Typography from '../Typography';
import Icon from '../Icon';

import './WarningBox.scss';

interface WarningBoxProps {
  text: string;
}

const WarningBox: FC<WarningBoxProps> = ({ text }) => {
  return (
    <div className="raft__warningBox">
      <Icon variant="warning" size={20} />
      <Typography variant="body2" color="text-error">
        {text}
      </Typography>
    </div>
  );
};
export default WarningBox;
