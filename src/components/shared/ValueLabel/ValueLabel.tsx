import { FC, memo } from 'react';
import Typography, { TypographyColor, TypographyVariant } from '../Typography';

import './ValueLabel.scss';

interface ValueLabelProps {
  value: string;
  label?: string;
  color?: TypographyColor;
  valueSize?: TypographyVariant;
  tickerSize?: TypographyVariant;
}

const ValueLabel: FC<ValueLabelProps> = ({ value, label = '', color, valueSize = 'body', tickerSize = 'caption' }) => {
  if (value.startsWith('$')) {
    return (
      <div className="raft__valueLabel">
        <Typography variant={tickerSize} color={color}>
          $
        </Typography>
        <Typography variant={valueSize} color={color} weight="medium">
          {value.split('$')[1]}
        </Typography>
        {label && (
          <Typography variant={tickerSize} color={color}>
            &nbsp;{label}
          </Typography>
        )}
      </div>
    );
  }

  if (value.startsWith('~$')) {
    return (
      <div className="raft__valueLabel">
        <Typography variant={valueSize} color={color}>
          ~
        </Typography>
        <Typography variant={tickerSize} color={color} weight="medium">
          $
        </Typography>
        <Typography variant={valueSize} color={color}>
          {value.split('$')[1]}
        </Typography>
        {label && (
          <Typography variant={tickerSize} color={color}>
            &nbsp;{label}
          </Typography>
        )}
      </div>
    );
  }

  if (value.endsWith('R')) {
    return (
      <div className="raft__valueLabel">
        <Typography variant={valueSize} color={color} weight="medium">
          {value.split(' ')[0]}&nbsp;
        </Typography>
        <Typography variant={tickerSize} color={color}>
          R
        </Typography>
        {label && (
          <Typography variant={tickerSize} color={color}>
            &nbsp;{label}
          </Typography>
        )}
      </div>
    );
  }

  if (value.endsWith('%')) {
    return (
      <div className="raft__valueLabel">
        <Typography variant={valueSize} color={color} weight="medium">
          {value.split('%')[0]}
        </Typography>
        <Typography variant={tickerSize} color={color}>
          %
        </Typography>
        {label && (
          <Typography variant={tickerSize} color={color}>
            &nbsp;{label}
          </Typography>
        )}
      </div>
    );
  }

  if (value.indexOf(' ') !== -1) {
    return (
      <div className="raft__valueLabel">
        <Typography variant={valueSize} color={color} weight="medium">
          {value.split(' ')[0]}
        </Typography>
        <Typography variant={tickerSize} color={color}>
          &nbsp;{value.split(' ')[1]}
        </Typography>
        {label && (
          <Typography variant={tickerSize} color={color}>
            &nbsp;{label}
          </Typography>
        )}
      </div>
    );
  }

  return (
    <div className="raft__valueLabel">
      <Typography variant={valueSize} color={color} weight="medium">
        {value}
      </Typography>
      {label && (
        <Typography variant={tickerSize} color={color}>
          &nbsp;{label}
        </Typography>
      )}
    </div>
  );
};

export default memo(ValueLabel);
