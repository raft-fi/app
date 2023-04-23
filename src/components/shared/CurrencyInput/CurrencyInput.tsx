import { createRef, FC, memo, useCallback, useState } from 'react';
import BaseInput from '../BaseInput';
import Typography from '../Typography';
import Icon from '../Icon';
import LoadingPlaceholder from '../LoadingPlaceholder';

import './CurrencyInput.scss';
import { ButtonWrapper, TokenLogo } from 'tempus-ui';

export interface CurrencyInputProps {
  label: string;
  value: string;
  precision: number;
  maxAmount: string;
  maxAmountLabel: string;
  fiatValue: string;
  disabled?: boolean;
  error?: string;
  warning?: string;
  autoFocus?: boolean;
  showMaxAmountIcon?: boolean;
  onUpdate?: (value: string) => void;
  onDebounceUpdate?: (value: string) => void;
}

const CurrencyInput: FC<CurrencyInputProps> = props => {
  const {
    label,
    value,
    maxAmount,
    maxAmountLabel = '',
    fiatValue,
    precision,
    disabled,
    error,
    warning,
    autoFocus,
    showMaxAmountIcon = true,
    onUpdate,
    onDebounceUpdate,
  } = props;
  const inputRef = createRef<HTMLInputElement>();

  const [focused, setFocused] = useState<boolean>(false);

  const handleValueChange = useCallback(
    (value: string) => {
      onUpdate?.(value);
    },
    [onUpdate],
  );

  const handleDebounceValueChange = useCallback(
    (value: string) => {
      onDebounceUpdate?.(value);
    },
    [onDebounceUpdate],
  );

  const focusInput = useCallback(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled, inputRef]);

  const handleInputFocus = useCallback(() => {
    if (!disabled) {
      setFocused(true);
    }
  }, [disabled]);

  const handleInputBlur = useCallback(() => setFocused(false), []);

  return (
    <div className="raft__currencyInput">
      <div className="raft__currencyInput__maxAmount">
        {!maxAmount && <LoadingPlaceholder shape={{ width: 'large', height: 'small' }} />}
        {maxAmount && (
          <ButtonWrapper className="raft__currencyInput__maxAmountValue">
            {showMaxAmountIcon && <Icon variant="wallet" size="tiny" />}
            {maxAmountLabel && <Typography variant="body-tertiary">{maxAmountLabel}</Typography>}
            <Typography variant="body-tertiary">{maxAmount}</Typography>
          </ButtonWrapper>
        )}
      </div>
      <div
        className={`raft__currencyInput__fieldContainer
          ${disabled ? ' raft__currencyInput__fieldContainerDisabled' : ''}
          ${!disabled && focused ? ' raft__currencyInput__fieldContainerFocused' : ''}
          ${error ? ' raft__currencyInput__fieldContainerError' : ''}
        `}
      >
        <div
          className={`raft__currencyInput__inputContainer
            ${disabled ? ' raft__currencyInput__inputContainerDisabled' : ''}
          `}
          onClick={focusInput}
        >
          <div className="raft__currencyInput__amountContainer">
            {value ? (
              <Typography
                className="raft__currencyInput__amount"
                variant="subtitle"
                color={disabled ? 'text-tertiary' : 'text-primary'}
                weight="bold"
              >
                <BaseInput
                  ref={inputRef}
                  value={value}
                  placeholder="0"
                  pattern={`[0-9]*[.]?[0-9]{0,${precision}}`}
                  disabled={disabled}
                  debounce
                  autoFocus={Boolean(value) && autoFocus}
                  onChange={handleValueChange}
                  onDebounceChange={handleDebounceValueChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </Typography>
            ) : (
              <LoadingPlaceholder shape={{ width: 'large', height: 'small' }} />
            )}
            {value && fiatValue && (
              <span className="nostra__currency-input__fiat-amount">
                <Typography variant="body-tertiary" color={!disabled ? 'text-primary' : 'text-tertiary'}>
                  {fiatValue}
                </Typography>
              </span>
            )}
            {(!value || !fiatValue) && <LoadingPlaceholder shape={{ width: 'small', height: 'small' }} />}
          </div>
          <div className="nostra__currency-input__token">
            {value ? (
              <>
                <Typography className="nostra__currency-input__token-label" variant="subtitle">
                  test
                </Typography>
                <TokenLogo type={`token-ETH`} size="small" />
              </>
            ) : (
              <LoadingPlaceholder shape={{ circle: 'medium' }} />
            )}
          </div>
        </div>
      </div>
      {error && (
        <Typography className="nostra__currency-input__error" variant="body-tertiary" color="text-secondary">
          {error}
        </Typography>
      )}
      {!error && warning && (
        <Typography className="nostra__currency-input__error" variant="body-tertiary" color="text-secondary">
          {warning}
        </Typography>
      )}
    </div>
  );
};

export default memo(CurrencyInput);
