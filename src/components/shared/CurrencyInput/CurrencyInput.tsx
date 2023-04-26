import { createRef, FC, memo, useCallback, useState } from 'react';
import { TokenLogo } from 'tempus-ui';
import BaseInput, { BaseInputProps } from '../BaseInput';
import Typography from '../Typography';
import Icon from '../Icon';
import Menu from '../Menu';

import './CurrencyInput.scss';

export interface CurrencyInputProps extends BaseInputProps {
  label: string;
  value: string;
  precision: number;
  fiatValue: string;
  maxAmount?: string;
  maxAmountLabel?: string;
  disabled?: boolean;
  error?: boolean;
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
      </div>
      {fiatValue && (
        <span className="raft__currencyInput__fiatAmount">
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
