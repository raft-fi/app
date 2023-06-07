import { createRef, FC, memo, useCallback, useState, FocusEvent, useMemo, ReactNode } from 'react';
import { Decimal } from '@tempusfinance/decimal';
import { ButtonWrapper, TokenLogo } from 'tempus-ui';
import { Nullable } from '../../../interfaces';
import BaseInput, { BaseInputProps } from '../BaseInput';
import Typography from '../Typography';
import Icon from '../Icon';
import Menu from '../Menu';
import ValueLabel from '../ValueLabel';

import './CurrencyInput.scss';

// ethers 6.3.0 has bugs that cannot format large number
const MAX_INTEGRAL_DIGIT = 10;

export interface CurrencyInputProps extends BaseInputProps {
  label: ReactNode | string;
  value: string;
  previewValue?: string;
  placeholder?: string;
  precision: number;
  fiatValue?: string;
  disabled?: boolean;
  error?: boolean;
  errorMsg?: string;
  autoFocus?: boolean;
  tokens: string[];
  selectedToken: string;
  step?: number;
  allowNegativeNumbers?: boolean;
  maxIntegralDigits?: number;
  maxAmount?: Nullable<Decimal>;
  maxAmountFormatted?: string;
  onValueUpdate?: (value: string) => void;
  onValueDebounceUpdate?: (value: string) => void;
  onTokenUpdate?: (token: string) => void;
  onMaxAmountClick?: () => void;
}

const CurrencyInput: FC<CurrencyInputProps> = props => {
  const {
    label,
    value,
    previewValue,
    placeholder = '0',
    precision,
    disabled,
    error = false,
    errorMsg = '',
    autoFocus,
    selectedToken,
    tokens,
    allowNegativeNumbers = false,
    maxIntegralDigits = MAX_INTEGRAL_DIGIT,
    maxAmount,
    maxAmountFormatted = '',
    onValueUpdate,
    onValueDebounceUpdate,
    onTokenUpdate,
    onFocus,
    onBlur,
    onMaxAmountClick,
  } = props;
  const inputRef = createRef<HTMLInputElement>();

  const [focused, setFocused] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  const isSingleToken = useMemo(() => tokens.length === 1, [tokens.length]);

  const displayValue = useMemo(() => (focused ? value : previewValue ?? value), [focused, previewValue, value]);

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

  const inputPattern = useMemo(() => {
    // [+-]? or [+]?: sign
    // ([1-9][0-9]{0,${maxIntegralDigits - 1}}|0): integral part, no leading zero
    // ([.][0-9]{0,${precision}})?: decimal part
    // empty: enable empty string for number part (such that user can type)
    return allowNegativeNumbers
      ? `[+-]?(([1-9][0-9]{0,${maxIntegralDigits - 1}}|0)([.][0-9]{0,${precision}})?|)`
      : `[+]?(([1-9][0-9]{0,${maxIntegralDigits - 1}}|0)([.][0-9]{0,${precision}})?|)`;
  }, [allowNegativeNumbers, precision, maxIntegralDigits]);

  return (
    <div className={`raft__currencyInput ${disabled ? ' raft__currencyInputDisabled' : ''}`}>
      <div className="raft__currencyInput__header">
        <Typography className="raft__currencyInput__title" variant="overline">
          {label}
        </Typography>
        <div className="raft__currencyInput__maxAmount">
          {maxAmount && (
            <ButtonWrapper onClick={onMaxAmountClick} disabled={!onMaxAmountClick}>
              <div className="raft__currencyInput__maxAmountValue">
                <Icon variant="wallet" size="tiny" />
                <div className="raft__currencyInput__maxAmountValue">
                  <ValueLabel
                    valueSize="caption"
                    tickerSize="body2"
                    color="text-secondary"
                    value={maxAmountFormatted ?? maxAmount?.toString()}
                  />
                </div>
              </div>
            </ButtonWrapper>
          )}
        </div>
      </div>
      <div
        className={`raft__currencyInput__inputContainer
            ${disabled ? ' raft__currencyInput__inputContainerDisabled' : ''}
          ${error ? ' raft__currencyInput__inputContainerError' : ''}
          `}
      >
        <div className="raft__currencyInput__amountContainer" onClick={focusInput}>
          <Typography
            className="raft__currencyInput__amount"
            variant="input-value"
            color={disabled ? 'text-secondary' : 'text-primary'}
          >
            <BaseInput
              ref={inputRef}
              value={displayValue}
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
        <div
          className={`raft__currencyInput__tokenSelectorContainer ${
            isSingleToken ? 'raft__currencyInput__tokenSelectorContainer__single' : ''
          }`}
        >
          <ButtonWrapper
            className={`raft__currencyInput__tokenSelector ${
              isSingleToken ? 'raft__currencyInput__tokenSelector__single' : ''
            }`}
            onClick={onOpenDropdown}
          >
            <div className="raft__currencyInput__tokenLogoContainer">
              <TokenLogo type={`token-${selectedToken}`} size="small" />
            </div>
            {!isSingleToken && (
              <>
                <Typography className="raft__currencyInput__tokenLabel" variant="caption">
                  {selectedToken}
                </Typography>
                <Icon variant={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} />
              </>
            )}
          </ButtonWrapper>
          {!isSingleToken && (
            <Menu open={dropdownOpen} onClose={onCloseDropdown}>
              <div className="raft__currencyInput__dropdownContainer">
                {tokens.map(token => (
                  <ButtonWrapper
                    key={token}
                    className="raft__currencyInput__dropdownItem"
                    onClick={() => {
                      handleTokenUpdate(token);
                    }}
                  >
                    <div className="raft__currencyInput__dropdownTokenLogoContainer">
                      <TokenLogo type={`token-${token}`} size="small" />
                    </div>
                    <Typography variant="caption">{token}</Typography>
                  </ButtonWrapper>
                ))}
              </div>
            </Menu>
          )}
        </div>
      </div>
      <div className="raft__currencyInput__errorContainer">
        <Typography variant="caption" color="text-error">
          {errorMsg}
        </Typography>
      </div>
      {disabled && <div className="raft__currencyInput__disabledOverlay"></div>}
    </div>
  );
};

export default memo(CurrencyInput);
