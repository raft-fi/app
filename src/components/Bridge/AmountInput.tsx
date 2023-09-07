import { Decimal } from '@tempusfinance/decimal';
import { FC, memo, useCallback, useMemo, useRef, useState } from 'react';
import { ButtonWrapper, TokenLogo } from 'tempus-ui';
import { INPUT_PREVIEW_DIGITS } from '../../constants';
import { BaseInput, Button, Icon, Typography, ValueLabel } from '../shared';

// ethers 6.3.0 has bugs that cannot format large number
const MAX_INTEGRAL_DIGIT = 10;

interface AmountInputProps {
  value: string;
  balance?: string;
  token: string;
  onChange: (value: string) => void;
  onMax: () => void;
}

const AmountInput: FC<AmountInputProps> = ({ value, balance, token, onChange, onMax }) => {
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
    <div className="raft__bridge__amount-input">
      <div className="raft__bridge__amount-input__label">
        <Typography variant="overline" weight="semi-bold" color="text-secondary">
          YOU SEND
        </Typography>
        <div className="raft__bridge__amount-input__balance">
          {balance && (
            <ButtonWrapper onClick={onMax}>
              <Icon variant="wallet" size="tiny" />
              <div className="raft__bridge__amount-input__balance-value">
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
      <div className="raft__bridge__amount-input__input-container">
        <TokenLogo type={`token-${token}`} size={20} />
        <div className="raft__bridge__amount-input__input" onClick={focusInput}>
          <Typography className="raft__bridge__amount-input__input-amount" variant="input-value" color="text-primary">
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
        <Button variant="secondary" onClick={onMax}>
          <Typography variant="button-label" color="text-secondary">
            Max
          </Typography>
        </Button>
      </div>
    </div>
  );
};

export default memo(AmountInput);
