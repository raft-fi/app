import { createRef, FC, memo, useCallback, useState } from 'react';
import BaseInput from '../BaseInput';
import Typography from '../Typography';
import Icon from '../Icon';
import LoadingPlaceholder from '../LoadingPlaceholder';

import './CurrencyInput.scss';
import { ButtonWrapper, TokenLogo } from 'tempus-ui';
import Menu from '../Menu';

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
  tokens: string[];
  selectedToken: string;
  onValueUpdate?: (value: string) => void;
  onValueDebounceUpdate?: (value: string) => void;
  onTokenUpdate?: (token: string) => void;
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
    selectedToken,
    tokens,
    onValueUpdate,
    onValueDebounceUpdate,
    onTokenUpdate,
  } = props;
  const inputRef = createRef<HTMLInputElement>();

  const [focused, setFocused] = useState<boolean>(false);
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

  const handleInputFocus = useCallback(() => {
    if (!disabled) {
      setFocused(true);
    }
  }, [disabled]);

  const handleInputBlur = useCallback(() => setFocused(false), []);

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

  return (
    <div className="raft__currencyInput">
      <div className="raft__currencyInput__header">
        <div className="raft__currencyInput__title">
          <Typography variant="body-primary" weight="semi-bold">
            {label}
          </Typography>
        </div>

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
        >
          <div className="raft__currencyInput__amountContainer" onClick={focusInput}>
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
            {(!value || !fiatValue) && <LoadingPlaceholder shape={{ width: 'small', height: 'small' }} />}
          </div>
          <div className="raft__currencyInput__tokenSelectorContainer">
            {value ? (
              <div className="raft__currencyInput__tokenSelector" onClick={onOpenDropdown}>
                <Icon variant="chevron-down" size={24} />
                <Typography className="raft__currencyInput__tokenLabel" variant="body-tertiary">
                  {selectedToken}
                </Typography>
                <div className="raft__currencyInput__tokenLogoContainer">
                  <TokenLogo type={`token-${selectedToken}`} size="small" />
                </div>
              </div>
            ) : (
              <LoadingPlaceholder shape={{ circle: 'medium' }} />
            )}
            <Menu open={dropdownOpen} onClose={onCloseDropdown}>
              <div className="raft__currencyInput__dropdownContainer">
                {tokens.map(token => {
                  return (
                    <div
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
          </div>
        </div>
      </div>
      {value && fiatValue && (
        <span className="raft__currencyInput__fiatAmount">
          <Typography variant="body-tertiary" color={!disabled ? 'text-primary' : 'text-tertiary'}>
            {fiatValue}
          </Typography>
        </span>
      )}
    </div>
  );
};

export default memo(CurrencyInput);
