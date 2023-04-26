import { FC, ReactNode } from 'react';
import Typography from '../Typography';
import ValueLabel from '../ValueLabel';

import './ValuesBox.scss';

interface ValuesBoxProps {
  values: {
    id: string;
    label: string | ReactNode;
    value: string;
  }[];
}

const ValuesBox: FC<ValuesBoxProps> = ({ values }) => {
  return (
    <div className="raft__valuesBox">
      {values.map(({ id, label, value }) => {
        return (
          <div key={id} className="raft__valuesBox__item">
            {typeof label === 'string' ? (
              <Typography variant="body-primary">{label}</Typography>
            ) : (
              <div className="raft__valuesBox__itemValueNode">{label}</div>
            )}
            <ValueLabel value={value} />
          </div>
        );
      })}
    </div>
  );
};
export default ValuesBox;
