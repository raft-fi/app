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

const ValueLabel: FC<ValueLabelProps> = ({
  value,
  label = '',
  color,
  valueSize = 'body-primary',
  tickerSize = 'body-tertiary',
}) => {
  if (value.startsWith('$')) {
    return (
      <div className="raft__valueLabel">
        <Typography variant={tickerSize} weight="medium" color={color}>
          $
        </Typography>
        <Typography variant={valueSize} weight="medium" color={color}>
          {value.split('$')[1]}
        </Typography>
        {label && (
          <Typography variant={valueSize} weight="regular" color={color}>
            &nbsp;{label}
          </Typography>
        )}
      </div>
    );
  }

  if (value.startsWith('~$')) {
    return (
      <div className="raft__valueLabel">
        <Typography variant={valueSize} weight="medium" color={color}>
          ~
        </Typography>
        <Typography variant={tickerSize} weight="medium" color={color}>
          $
        </Typography>
        <Typography variant={valueSize} weight="medium" color={color}>
          {value.split('$')[1]}
        </Typography>
        {label && (
          <Typography variant={valueSize} weight="regular" color={color}>
            &nbsp;{label}
          </Typography>
        )}
      </div>
    );
  }

  if (value.endsWith('R')) {
    return (
      <div className="raft__valueLabel">
        <Typography variant={valueSize} weight="medium" color={color}>
          {value.split(' ')[0]}
        </Typography>
        <Typography variant={tickerSize} type="mono" color={color}>
          &nbsp;R
        </Typography>
        {label && (
          <Typography variant={valueSize} weight="regular" color={color}>
            &nbsp;{label}
          </Typography>
        )}
      </div>
    );
  }

  if (value.endsWith('%')) {
    return (
      <div className="raft__valueLabel">
        <Typography variant={valueSize} weight="medium" color={color}>
          {value.split('%')[0]}
        </Typography>
        <Typography variant={tickerSize} weight="medium" color={color}>
          %
        </Typography>
        {label && (
          <Typography variant={valueSize} weight="regular" color={color}>
            &nbsp;{label}
          </Typography>
        )}
      </div>
    );
  }

  if (value.indexOf(' ') !== -1) {
    return (
      <div className="raft__valueLabel">
        <Typography variant={valueSize} weight="medium" color={color}>
          {value.split(' ')[0]}
        </Typography>
        <Typography variant={tickerSize} weight="medium" color={color}>
          &nbsp;{value.split(' ')[1]}
        </Typography>
        {label && (
          <Typography variant={valueSize} weight="regular" color={color}>
            &nbsp;{label}
          </Typography>
        )}
      </div>
    );
  }

  return (
    <div className="raft__valueLabel">
      <Typography variant={valueSize} weight="medium" color={color}>
        {value}
      </Typography>
      {label && (
        <Typography variant={valueSize} weight="medium" color={color}>
          &nbsp;{label}
        </Typography>
      )}
    </div>
  );
};

export default memo(ValueLabel);
