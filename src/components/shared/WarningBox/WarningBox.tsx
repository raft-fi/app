import { FC } from 'react';

import './WarningBox.scss';
import Typography from '../Typography';

interface WarningBoxProps {
  text: string;
}

const WarningBox: FC<WarningBoxProps> = ({ text }) => {
  return (
    <div className="raft__warningBox">
      <Typography variant="body" color="text-warning-box">
        {text}
      </Typography>
    </div>
  );
};
export default WarningBox;
