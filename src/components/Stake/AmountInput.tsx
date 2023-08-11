import { Decimal } from '@tempusfinance/decimal';
import { FC, memo, useCallback, useMemo, useRef, useState } from 'react';
import { ButtonWrapper, TokenLogo } from 'tempus-ui';
import { INPUT_PREVIEW_DIGITS } from '../../constants';
import { BaseInput, Icon, Typography, ValueLabel } from '../shared';

// ethers 6.3.0 has bugs that cannot format large number
const MAX_INTEGRAL_DIGIT = 10;

interface AmountInputProps {
  value: string;
  balance?: string;
  token: string;
  onChange: (value: string) => void;
  onBalanceClick?: () => void;
}

const AmountInput: FC<AmountInputProps> = ({ value, balance, token, onChange, onBalanceClick }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState<boolean>(false);

  const amount = useMemo(() => Decimal.parse(value, 0), [value]);
  const previewValue = useMemo(() => {
    const original = amount.toString();
    const truncated = amount.toTruncated(INPUT_PREVIEW_DIGITS);

    return original === truncated ? original : `${truncated}...`;
  }, [amount]);
  const displayValue = useMemo(() => (focused ? value : previewValue), [value, focused, previewValue]);
  const focusInput = useCallback(() => inputRef.current?.focus(), [inputRef]);
  const handleInputFocus = useCallback(() => setFocused(true), []);
  const handleInputBlur = useCallback(() => setFocused(false), []);

  return (
    <div className="raft__stake__amount-input">
      <div className="raft__stake__label">
        <Typography variant="overline" weight="semi-bold" color="text-secondary">
          YOU LOCK
        </Typography>
        <div className="raft__stake__amount-input__balance">
          {balance && (
            <ButtonWrapper onClick={onBalanceClick} disabled={!onBalanceClick}>
              <Icon variant="wallet" size="tiny" />
              <div className="raft__stake__amount-input__balance-value">
                <ValueLabel
                  valueSize="caption"
                  tickerSize="caption"
                  color="text-secondary"
                  value={`${balance} ${token}`}
                />
              </div>
            </ButtonWrapper>
          )}
        </div>
      </div>
      <div className="raft__stake__input-container">
        <div className="raft__stake__input" onClick={focusInput}>
          <Typography className="raft__stake__input-amount" variant="input-value" color="text-primary">
            <BaseInput
              ref={inputRef}
              value={displayValue}
              pattern={`(([1-9][0-9]{0,${MAX_INTEGRAL_DIGIT - 1}}|0)([.][0-9]{0,18})?)`}
              debounce
              onChange={onChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </Typography>
        </div>
        <TokenLogo type={`token-${token}`} size="medium" />
      </div>
    </div>
  );
};

export default memo(AmountInput);
