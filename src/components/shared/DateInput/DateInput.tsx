import { ChangeEvent, useCallback, memo, forwardRef, useMemo } from 'react';
import { formatYYYYMMDD } from '../../../utils';

export interface DateInputProps {
  id?: string;
  value?: Date;
  placeholder?: string;
  min?: Date;
  max?: Date;
  disabled?: boolean;
  debounce?: boolean | number;
  autoFocus?: boolean;
  onChange?: (value: Date) => void;
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>((props, ref) => {
  const { id, value, placeholder, min, max, disabled, autoFocus, onChange } = props;

  const dateString = useMemo(() => formatYYYYMMDD(value), [value]);
  const minString = useMemo(() => formatYYYYMMDD(min), [min]);
  const maxString = useMemo(() => formatYYYYMMDD(max), [max]);

  const handleChange = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      const dateStr = ev.target.value;
      // dateStr in yyyy-mm-dd format
      const date = new Date(dateStr);

      if (!isNaN(date.getTime())) {
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);

        onChange?.(date);
      }
    },
    [onChange],
  );

  return (
    <input
      ref={ref}
      className="raft__baseInput"
      id={id}
      type="date"
      value={dateString ?? ''}
      placeholder={placeholder}
      min={minString}
      max={maxString}
      disabled={disabled}
      autoFocus={!disabled && autoFocus}
      onChange={handleChange}
    />
  );
});

export default memo(DateInput);
