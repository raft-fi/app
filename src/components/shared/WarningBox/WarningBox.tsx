import { FC } from 'react';
import Typography from '../Typography';

import './WarningBox.scss';

interface WarningBoxProps {
  text: string;
}

const WarningBox: FC<WarningBoxProps> = ({ text }) => {
  return (
    <div className="raft__warningBox">
      <Typography variant="body" color="text-warning">
        {text}
      </Typography>
    </div>
  );
};
export default WarningBox;
