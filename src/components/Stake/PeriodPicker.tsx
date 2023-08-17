import { addMilliseconds, startOfDay } from 'date-fns';
import { FC, memo, useCallback, useMemo, useRef } from 'react';
import { ButtonWrapper } from 'tempus-ui';
import { DAY_IN_MS, YEAR_IN_MS } from '../../constants';
import { DateInput, Typography } from '../shared';

const PERIOD_OPTIONS = [0.25, 0.5, 1];

interface PeriodPickerProps {
  deadline?: Date;
  period?: number;
  min?: Date;
  max?: Date;
  onDeadlineChange: (value: Date) => void;
  onPeriodChange: (value: number) => void;
}

const PeriodPicker: FC<PeriodPickerProps> = ({ deadline, period, min, max, onDeadlineChange, onPeriodChange }) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const minDeadline = useMemo(() => min ?? addMilliseconds(startOfDay(new Date()), DAY_IN_MS), [min]);
  const maxDeadline = useMemo(() => max ?? addMilliseconds(startOfDay(new Date()), YEAR_IN_MS), [max]);

  const focusDateInput = useCallback(() => dateInputRef.current?.focus(), [dateInputRef]);

  return (
    <div className="raft__stake__period-picker-container">
      <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
        LOCK UNTIL
      </Typography>
      <div className="raft__stake__input-container">
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
      <div className="raft__stake__period-container">
        <Typography variant="body" color="text-secondary">
          Lock periods
        </Typography>
        {PERIOD_OPTIONS.map(p => (
          <ButtonWrapper
            key={`period-${p}`}
            className={`raft__stake__period-picker ${period === p ? 'raft__stake__period-picker__selected' : ''}`}
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
