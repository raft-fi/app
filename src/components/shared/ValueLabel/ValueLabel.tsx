import { FC, useMemo } from 'react';
import Typography, { TypographyVariant } from '../Typography';

import './ValueLabel.scss';

interface ValueLabelProps {
  value: string;
  label?: string;
  valueSize?: TypographyVariant;
  tickerSize?: TypographyVariant;
}

const ValueLabel: FC<ValueLabelProps> = ({
  value,
  label = '',
  valueSize = 'body-primary',
  tickerSize = 'body-tertiary',
}) => {
  const valueElement = useMemo(() => {
    if (value.startsWith('$')) {
      return (
        <div className="raft__valueLabel">
          <Typography variant={tickerSize} weight="medium">
            $
          </Typography>
          <Typography variant={valueSize} weight="medium">
            {value.split('$')[1]}
          </Typography>
          {label && (
            <Typography variant={valueSize} weight="regular">
              &nbsp;{label}
            </Typography>
          )}
        </div>
      );
    }

    if (value.endsWith('R')) {
      return (
        <div className="raft__valueLabel">
          <Typography variant={valueSize} weight="medium">
            {value.split(' ')[0]}
          </Typography>
          <Typography variant={tickerSize} type="mono">
            &nbsp;R
          </Typography>
          {label && (
            <Typography variant={valueSize} weight="regular">
              &nbsp;{label}
            </Typography>
          )}
        </div>
      );
    }

    if (value.endsWith('%')) {
      return (
        <div className="raft__valueLabel">
          <Typography variant={valueSize} weight="medium">
            {value.split('%')[0]}
          </Typography>
          <Typography variant={tickerSize} weight="medium">
            %
          </Typography>
          {label && (
            <Typography variant={valueSize} weight="regular">
              &nbsp;{label}
            </Typography>
          )}
        </div>
      );
    }

    if (value.indexOf(' ') !== -1) {
      return (
        <div className="raft__valueLabel">
          <Typography variant={valueSize} weight="medium">
            {value.split(' ')[0]}
          </Typography>
          <Typography variant={tickerSize} weight="medium">
            &nbsp;{value.split(' ')[1]}
          </Typography>
          {label && (
            <Typography variant={valueSize} weight="regular">
              &nbsp;{label}
            </Typography>
          )}
        </div>
      );
    }

    return (
      <div className="raft__valueLabel">
        <Typography variant={valueSize} weight="medium">
          {value}&nbsp;{label}
        </Typography>
      </div>
    );
  }, [label, tickerSize, value, valueSize]);

  return valueElement;
};
export default ValueLabel;
