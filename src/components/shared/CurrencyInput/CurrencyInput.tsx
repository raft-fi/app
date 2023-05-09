import { createRef, FC, memo, useCallback, useState, FocusEvent, useMemo } from 'react';
import { ButtonWrapper, TokenLogo } from 'tempus-ui';
import { Nullable } from '../../../interfaces';
import BaseInput, { BaseInputProps } from '../BaseInput';
import Typography from '../Typography';
import Icon from '../Icon';
import Menu from '../Menu';

import './CurrencyInput.scss';

export interface CurrencyInputProps extends BaseInputProps {
  label: string;
  value: string;
  placeholder?: string;
  precision: number;
  fiatValue: Nullable<string>;
  maxAmount?: Nullable<string>;
  maxAmountLabel?: string;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  showMaxAmountIcon?: boolean;
  tokens: string[];
  selectedToken: string;
  step?: number;
  allowNegativeNumbers?: boolean;
  onValueUpdate?: (value: string) => void;
  onValueDebounceUpdate?: (value: string) => void;
  onTokenUpdate?: (token: string) => void;
  onIncrementAmount?: (amount: number) => void;
  onDecrementAmount?: (amount: number) => void;
}

const CurrencyInput: FC<CurrencyInputProps> = props => {
  const {
    label,
    value,
    placeholder = '0',
    precision,
    maxAmount = '',
    maxAmountLabel = '',
    fiatValue,
    disabled,
    error = false,
    autoFocus,
    showMaxAmountIcon = true,
    selectedToken,
    tokens,
    step,
    allowNegativeNumbers = false,
    onValueUpdate,
    onValueDebounceUpdate,
    onTokenUpdate,
    onDecrementAmount,
    onIncrementAmount,
    onFocus,
    onBlur,
  } = props;
  const inputRef = createRef<HTMLInputElement>();

  const [, setFocused] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  const handleValueChange = useCallback(
    (value: string) => {
      onValueUpdate?.(value);
    },
    [onValueUpdate],
  );

  const handleDebounceValueChange = useCallback(
    (value: string) => {
      onValueDebounceUpdate?.(value);
    },
    [onValueDebounceUpdate],
  );

  const focusInput = useCallback(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled, inputRef]);

  const handleInputFocus = useCallback(
    (ev: FocusEvent<HTMLInputElement, Element>) => {
      if (!disabled) {
        setFocused(true);
      }
      onFocus?.(ev);
    },
    [disabled, onFocus],
  );

  const handleInputBlur = useCallback(
    (ev: FocusEvent<HTMLInputElement, Element>) => {
      setFocused(false);
      onBlur?.(ev);
    },
    [onBlur],
  );

  const onOpenDropdown = useCallback(() => {
    setDropdownOpen(true);
  }, []);

  const onCloseDropdown = useCallback(() => {
    setDropdownOpen(false);
  }, []);

  const handleTokenUpdate = useCallback(
    (token: string) => {
      onTokenUpdate?.(token);
      onCloseDropdown();
    },
    [onCloseDropdown, onTokenUpdate],
  );

  const handleIncrementAmount = useCallback(() => {
    if (!onIncrementAmount || !step) {
      return;
    }

    onIncrementAmount(step);
  }, [onIncrementAmount, step]);

  const handleDecrementAmount = useCallback(() => {
    if (!onDecrementAmount || !step) {
      return;
    }

    onDecrementAmount(step);
  }, [onDecrementAmount, step]);

  const inputPattern = useMemo(() => {
    return allowNegativeNumbers ? `-?[0-9]*[.]?[0-9]{0,${precision}}` : `[0-9]*[.]?[0-9]{0,${precision}}`;
  }, [allowNegativeNumbers, precision]);

  return (
    <div className={`raft__currencyInput ${disabled ? ' raft__currencyInputDisabled' : ''}`}>
      <div className="raft__currencyInput__header">
        <div className="raft__currencyInput__title">
          <Typography variant="body-primary" weight="semi-bold">
            {label}
          </Typography>
        </div>

        <div className="raft__currencyInput__maxAmount">
          {maxAmount && (
            <div className="raft__currencyInput__maxAmountValue">
              {showMaxAmountIcon && <Icon variant="wallet" size="tiny" />}
              {maxAmountLabel && <Typography variant="body-tertiary">{maxAmountLabel}</Typography>}
              <Typography variant="body-tertiary">{maxAmount}</Typography>
            </div>
          )}
        </div>
      </div>
      <div
        className={`raft__currencyInput__fieldContainer
          ${error ? ' raft__currencyInput__fieldContainerError' : ''}
        `}
      >
        {onDecrementAmount && step && (
          <ButtonWrapper className="raft__currencyInput__adjustAmountButton" onClick={handleDecrementAmount}>
            <Typography variant="subtitle">-</Typography>
          </ButtonWrapper>
        )}
        <div
          className={`raft__currencyInput__inputContainer
            ${disabled ? ' raft__currencyInput__inputContainerDisabled' : ''}
          `}
        >
          <div className="raft__currencyInput__amountContainer" onClick={focusInput}>
            <Typography
              className="raft__currencyInput__amount"
              variant="subtitle"
              color={disabled ? 'text-tertiary' : 'text-primary'}
              weight="bold"
            >
              <BaseInput
                ref={inputRef}
                value={value}
                placeholder={placeholder}
                pattern={inputPattern}
                disabled={disabled}
                debounce
                autoFocus={Boolean(value) && autoFocus}
                onChange={handleValueChange}
                onDebounceChange={handleDebounceValueChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </Typography>
          </div>
          <div className="raft__currencyInput__tokenSelectorContainer">
            <div
              className={`raft__currencyInput__tokenSelector ${
                tokens.length === 1 ? 'raft__currencyInput__tokenSelector__single' : ''
              }`}
              onClick={onOpenDropdown}
            >
              <div className="raft__currencyInput__tokenLogoContainer">
                <TokenLogo type={`token-${selectedToken}`} size="small" />
              </div>
              {tokens.length > 1 && (
                <>
                  <Typography className="raft__currencyInput__tokenLabel" variant="body-tertiary">
                    {selectedToken}
                  </Typography>
                  <Icon variant={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={24} />
                </>
              )}
            </div>
            {tokens.length > 1 && (
              <Menu open={dropdownOpen} onClose={onCloseDropdown}>
                <div className="raft__currencyInput__dropdownContainer">
                  {tokens.map(token => {
                    return (
                      <div
                        key={token}
                        className="raft__currencyInput__dropdownItem"
                        onClick={() => {
                          handleTokenUpdate(token);
                        }}
                      >
                        <div className="raft__currencyInput__dropdownTokenLogoContainer">
                          <TokenLogo type={`token-${token}`} size="small" />
                        </div>
                        <Typography variant="body-primary" weight="medium">
                          {token}
                        </Typography>
                      </div>
                    );
                  })}
                </div>
              </Menu>
            )}
          </div>
        </div>
        {onIncrementAmount && step && (
          <ButtonWrapper className="raft__currencyInput__adjustAmountButton" onClick={handleIncrementAmount}>
            <Typography variant="subtitle">+</Typography>
          </ButtonWrapper>
        )}
      </div>
      {fiatValue && (
        <span className={`raft__currencyInput__fiatAmount ${step ? 'raft__currencyInput__fiatAmountOffset' : ''}`}>
          <Typography variant="body-tertiary" color={!disabled ? 'text-primary' : 'text-tertiary'}>
            {fiatValue}
          </Typography>
        </span>
      )}
      {disabled && <div className="raft__currencyInput__disabledOverlay"></div>}
    </div>
  );
};

export default memo(CurrencyInput);
