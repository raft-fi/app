import { format, isValid, startOfDay } from 'date-fns';
import { ChangeEvent, useCallback, memo, forwardRef, useMemo } from 'react';

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

  const dateString = useMemo(() => (value ? format(value, 'yyyy-MM-dd') : undefined), [value]);
  const minString = useMemo(() => (min ? format(min, 'yyyy-MM-dd') : undefined), [min]);
  const maxString = useMemo(() => (max ? format(max, 'yyyy-MM-dd') : undefined), [max]);

  const handleChange = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      const dateStr = ev.target.value;
      // dateStr in yyyy-mm-dd format
      const date = new Date(dateStr);

      if (!isValid(date)) {
        onChange?.(startOfDay(date));
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
