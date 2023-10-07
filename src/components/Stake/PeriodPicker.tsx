import { addMilliseconds, startOfDay } from 'date-fns';
import { FC, memo, useCallback, useMemo, useRef } from 'react';
import { ButtonWrapper } from 'tempus-ui';
import { DAY_IN_MS, YEAR_IN_MS } from '../../constants';
import { DateInput, Typography } from '../shared';

const PERIOD_IN_YEAR_OPTIONS = [0.5, 1, 2];

interface PeriodPickerProps {
  deadline?: Date;
  periodInYear?: number;
  min?: Date;
  max?: Date;
  onDeadlineChange: (value: Date) => void;
  onPeriodChange: (value: number) => void;
}

const PeriodPicker: FC<PeriodPickerProps> = ({
  deadline,
  periodInYear,
  min,
  max,
  onDeadlineChange,
  onPeriodChange,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const minDeadline = useMemo(() => min ?? addMilliseconds(startOfDay(new Date()), DAY_IN_MS), [min]);
  const maxDeadline = useMemo(() => max ?? addMilliseconds(startOfDay(new Date()), 2 * YEAR_IN_MS), [max]);

  const focusDateInput = useCallback(() => dateInputRef.current?.focus(), [dateInputRef]);

  const hasError = useMemo(() => deadline && deadline < minDeadline, [deadline, minDeadline]);

  return (
    <div className="raft__stake__period-picker-container">
      <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
        STAKE UNTIL
      </Typography>
      <div className={`raft__stake__input-container ${hasError ? 'raft__stake__input-container__error' : ''}`}>
        <div className="raft__stake__input" onClick={focusDateInput}>
          <Typography className="raft__stake__input-amount" variant="input-value" color="text-primary">
            <DateInput
              ref={dateInputRef}
              value={deadline}
              min={minDeadline}
              max={maxDeadline}
              onChange={onDeadlineChange}
            />
          </Typography>
        </div>
      </div>
      {hasError && (
        <Typography variant="caption" color="text-error">
          Staking duration cannot be less than current staking period.
        </Typography>
      )}
      <div className="raft__stake__period-container">
        <Typography variant="body" color="text-secondary">
          Stake duration:
        </Typography>
        {PERIOD_IN_YEAR_OPTIONS.map(p => (
          <ButtonWrapper
            key={`period-${p}`}
            className={`raft__stake__period-picker ${periodInYear === p ? 'raft__stake__period-picker__selected' : ''}`}
            onClick={() => onPeriodChange(p)}
          >
            <Typography variant="body2">{p * 12} months</Typography>
          </ButtonWrapper>
        ))}
      </div>
    </div>
  );
};

export default memo(PeriodPicker);
