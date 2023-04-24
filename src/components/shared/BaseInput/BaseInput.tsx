import { ChangeEvent, FocusEvent, KeyboardEvent, useCallback, useMemo, useRef, memo, forwardRef } from 'react';

export interface BaseInputProps {
  id?: string;
  value?: string;
  placeholder?: string;
  pattern?: string;
  disabled?: boolean;
  debounce?: boolean | number;
  autoFocus?: boolean;
  onChange?: (value: string) => void;
  onDebounceChange?: (value: string) => void;
  onFocus?: (ev: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (ev: FocusEvent<HTMLInputElement>) => void;
  onKeyUp?: (ev: KeyboardEvent<HTMLInputElement>) => void;
  onKeyDown?: (ev: KeyboardEvent<HTMLInputElement>) => void;
}

export const DEFAULT_DEBOUNCE_INTERVAL_IN_MS = 300;

const BaseInput = forwardRef<HTMLInputElement, BaseInputProps>((props, ref) => {
  const {
    id,
    value,
    placeholder,
    pattern,
    disabled,
    debounce = false,
    autoFocus,
    onChange,
    onDebounceChange,
    onFocus,
    onBlur,
    onKeyUp,
    onKeyDown,
  } = props;
  const time = useRef<number>();
  const valueToBeUpdated = useRef<string>();

  const debounceInterval: number = useMemo(() => {
    if (!debounce) {
      return 0;
    }
    if (debounce === true) {
      return DEFAULT_DEBOUNCE_INTERVAL_IN_MS;
    }
    return debounce;
  }, [debounce]);

  const handleChange = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      if (!pattern || !ev.target.validity.patternMismatch) {
        valueToBeUpdated.current = ev.currentTarget.value;
        onChange?.(valueToBeUpdated.current);
        if (debounceInterval) {
          if (time.current) {
            clearTimeout(time.current);
          }
          time.current = setTimeout(() => {
            if (valueToBeUpdated.current) {
              onDebounceChange?.(valueToBeUpdated.current);
              time.current = undefined;
              valueToBeUpdated.current = undefined;
            }
          }, debounceInterval);
        } else {
          onDebounceChange?.(valueToBeUpdated.current);
        }
      }
    },
    [pattern, debounceInterval, onChange, onDebounceChange],
  );

  const handleFocus = useCallback(
    (ev: FocusEvent<HTMLInputElement>) => {
      if (!disabled) {
        onFocus?.(ev);
      }
    },
    [disabled, onFocus],
  );

  const handleBlur = useCallback(
    (ev: FocusEvent<HTMLInputElement>) => {
      if (time.current) {
        clearTimeout(time.current);
        time.current = undefined;
      }
      if (valueToBeUpdated.current) {
        onDebounceChange?.(valueToBeUpdated.current);
      }
      onBlur?.(ev);
    },
    [onDebounceChange, onBlur],
  );

  return (
    <input
      ref={ref}
      className="raft__baseInput"
      id={id}
      type="text"
      value={value}
      placeholder={placeholder}
      pattern={pattern}
      disabled={disabled}
      autoFocus={!disabled && autoFocus}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyUp={onKeyUp}
      onKeyDown={onKeyDown}
    />
  );
});

export default memo(BaseInput);
