import { FC, useMemo } from 'react';
import Typography from '../Typography';
import Icon from '../Icon';

import './ValueLabel.scss';

interface ValueLabelProps {
  value: string;
}

const ValueLabel: FC<ValueLabelProps> = ({ value }) => {
  const valueElement = useMemo(() => {
    if (value.startsWith('$')) {
      return (
        <div className="raft__valueLabel">
          <Typography variant="body-tertiary" weight="medium">
            $
          </Typography>
          <Typography variant="body-primary" weight="medium">
            {value.split('$')[1]}
          </Typography>
        </div>
      );
    } else if (value.endsWith('R')) {
      return (
        <div className="raft__valueLabel">
          <Typography variant="body-primary" weight="medium">
            {value.split(' ')[0]}
          </Typography>
          <Typography variant="body-tertiary" type="mono">
            &nbsp;R
          </Typography>
        </div>
      );
    } else if (value.endsWith('%')) {
      return (
        <div className="raft__valueLabel">
          <Typography variant="body-primary" weight="medium">
            {value.split('%')[0]}
          </Typography>
          <Typography variant="body-tertiary" weight="medium">
            %
          </Typography>
        </div>
      );
    } else if (value.indexOf(' ') !== -1) {
      return (
        <div className="raft__valueLabel">
          <Typography variant="body-primary" weight="medium">
            {value.split(' ')[0]}
          </Typography>
          <Typography variant="body-tertiary" weight="medium">
            &nbsp;{value.split(' ')[1]}
          </Typography>
        </div>
      );
    } else {
      return (
        <Typography variant="body-primary" weight="medium">
          {value}
        </Typography>
      );
    }
  }, [value]);

  return valueElement;
};
export default ValueLabel;
