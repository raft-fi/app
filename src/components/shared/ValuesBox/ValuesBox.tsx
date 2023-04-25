import { FC } from 'react';
import Typography from '../Typography';
import ValueLabel from '../ValueLabel';

import './ValuesBox.scss';

interface ValuesBoxProps {
  values: {
    label: string;
    value: string;
  }[];
}

const ValuesBox: FC<ValuesBoxProps> = ({ values }) => {
  return (
    <div className="raft__valuesBox">
      {values.map(({ label, value }) => {
        return (
          <div key={label} className="raft__valuesBox__item">
            <Typography variant="body-primary">{label}</Typography>
            <ValueLabel value={value} />
          </div>
        );
      })}
    </div>
  );
};
export default ValuesBox;
