import { FC, ReactNode } from 'react';
import Typography from '../Typography';
import ValueLabel from '../ValueLabel';
import Icon from '../Icon';

import './ValuesBox.scss';

interface ValuesBoxProps {
  values: {
    id: string;
    label: string | ReactNode;
    value: string | ReactNode;
    newValue?: string | ReactNode;
  }[];
}

const ValuesBox: FC<ValuesBoxProps> = ({ values }) => {
  return (
    <div className="raft__valuesBox">
      {values.map(({ id, label, value, newValue }) => {
        return (
          <div key={id} className="raft__valuesBox__item">
            {typeof label === 'string' ? (
              <Typography variant="body">{label}</Typography>
            ) : (
              <div className="raft__valuesBox__itemLabel">{label}</div>
            )}
            <div className={`raft__valuesBox__itemValue ${newValue ? 'raft__valuesBox__itemValueMultiple' : ''}`}>
              {typeof value === 'string' ? <ValueLabel value={value} /> : value}
              {newValue && (
                <>
                  <Icon variant="arrow-right-thin" size="small" />
                  {typeof newValue === 'string' ? <ValueLabel value={newValue} /> : newValue}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default ValuesBox;
