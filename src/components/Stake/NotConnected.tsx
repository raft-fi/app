import { Decimal } from '@tempusfinance/decimal';
import { useConnectWallet } from '@web3-onboard/react';
import { addMilliseconds, startOfDay } from 'date-fns';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { ButtonWrapper, TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION, INPUT_PREVIEW_DIGITS } from '../../constants';
import { formatDecimal } from '../../utils';
import { BaseInput, Button, DateInput, Typography, ValueLabel } from '../shared';
import FAQ from './FAQ';
import HowToLock from './HowToLock';

// ethers 6.3.0 has bugs that cannot format large number
const MAX_INTEGRAL_DIGIT = 10;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const YEAR_IN_MS = 365 * DAY_IN_MS;

const NotConnected = () => {
  const [, connect] = useConnectWallet();
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState<boolean>(false);
  const [value, setValue] = useState<string>('');
  const [deadline, setDeadline] = useState<Date>();

  const bptAmount = useMemo(() => Decimal.parse(value, 0), [value]);
  const veRaftAmount = useMemo(() => {
    if (!deadline) {
      return Decimal.ZERO;
    }

    const today = startOfDay(new Date());
    const periodInMs = new Decimal(deadline.getTime()).sub(today.getTime());
    const period = periodInMs.div(YEAR_IN_MS);

    return bptAmount.mul(period);
  }, [bptAmount, deadline]);

  const veRaftAmountFormatted = useMemo(
    () => formatDecimal(veRaftAmount, COLLATERAL_TOKEN_UI_PRECISION),
    [veRaftAmount],
  );

  const previewValue = useMemo(() => {
    const bptAmount = Decimal.parse(value, 0);
    const original = bptAmount.toString();
    const truncated = bptAmount.toTruncated(INPUT_PREVIEW_DIGITS);

    return original === truncated ? original : `${truncated}...`;
  }, [value]);
  const displayValue = useMemo(() => (focused ? value : previewValue ?? value), [focused, previewValue, value]);

  const minDeadline = useMemo(() => addMilliseconds(startOfDay(new Date()), DAY_IN_MS), []);
  const maxDeadline = useMemo(() => addMilliseconds(startOfDay(new Date()), YEAR_IN_MS), []);

  const focusInput = useCallback(() => inputRef.current?.focus(), [inputRef]);
  const focusDateInput = useCallback(() => dateInputRef.current?.focus(), [dateInputRef]);

  const handleInputFocus = useCallback(() => setFocused(true), []);
  const handleInputBlur = useCallback(() => setFocused(false), []);

  const selectPeriod = useCallback(
    (year: number) => setDeadline(addMilliseconds(startOfDay(new Date()), year * YEAR_IN_MS)),
    [],
  );

  const onConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

  return (
    <div className="raft__stake raft__stake__not-connected">
      <div className="raft__stake__main">
        <div className="raft__stake__not-connected__container">
          <Typography className="raft__stake__not-connected__title" variant="heading1" weight="medium">
            Stake RAFT to get veRAFT
          </Typography>
          <Typography className="raft__stake__not-connected__subtitle" variant="body" color="text-secondary">
            veRAFT is at the centre of governance and growth of the Raft protocol. By locking your Raft Balancer LP
            tokens, veRAFT tokenholders will be able to vote on Raft governance proposals while earning more RAFT.
          </Typography>
          <Typography
            className="raft__stake__not-connected__label"
            variant="overline"
            weight="semi-bold"
            color="text-secondary"
          >
            YOU LOCK
          </Typography>
          <div className="raft__stake__not-connected__input-container">
            <div className="raft__stake__not-connected__input" onClick={focusInput}>
              <Typography
                className="raft__stake__not-connected__input-amount"
                variant="input-value"
                color="text-primary"
              >
                <BaseInput
                  ref={inputRef}
                  value={displayValue}
                  pattern={`(([1-9][0-9]{0,${MAX_INTEGRAL_DIGIT - 1}}|0)([.][0-9]{0,18})?)`}
                  debounce
                  onChange={setValue}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </Typography>
            </div>
            <TokenLogo type="token-B-80RAFT-20ETH" size="medium" />
          </div>
          <Typography
            className="raft__stake__not-connected__label"
            variant="overline"
            weight="semi-bold"
            color="text-secondary"
          >
            LOCK UNTIL
          </Typography>
          <div className="raft__stake__not-connected__input-container">
            <div className="raft__stake__not-connected__input" onClick={focusDateInput}>
              <Typography
                className="raft__stake__not-connected__input-amount"
                variant="input-value"
                color="text-primary"
              >
                <DateInput
                  ref={dateInputRef}
                  value={deadline}
                  min={minDeadline}
                  max={maxDeadline}
                  onChange={setDeadline}
                />
              </Typography>
            </div>
          </div>
          <div className="raft__stake__not-connected__period-container">
            <Typography variant="body" color="text-secondary">
              Lock periods
            </Typography>
            <ButtonWrapper className="raft__stake__not-connected__period-picker" onClick={() => selectPeriod(0.25)}>
              <Typography variant="body2">3 months</Typography>
            </ButtonWrapper>
            <ButtonWrapper className="raft__stake__not-connected__period-picker" onClick={() => selectPeriod(0.5)}>
              <Typography variant="body2">6 months</Typography>
            </ButtonWrapper>
            <ButtonWrapper className="raft__stake__not-connected__period-picker" onClick={() => selectPeriod(1)}>
              <Typography variant="body2">12 months</Typography>
            </ButtonWrapper>
          </div>
          <Typography
            className="raft__stake__not-connected__label"
            variant="overline"
            weight="semi-bold"
            color="text-secondary"
          >
            RESULTING STAKE
          </Typography>
          <Typography
            className="raft__stake__not-connected__value"
            variant="body"
            weight="medium"
            color="text-secondary"
          >
            {veRaftAmountFormatted ? (
              <>
                <TokenLogo type="token-veRAFT" size="medium" />
                <ValueLabel value={`${veRaftAmountFormatted} veRAFT`} valueSize="body" tickerSize="body2" />
              </>
            ) : (
              'N/A'
            )}
          </Typography>
          <Typography
            className="raft__stake__not-connected__label"
            variant="overline"
            weight="semi-bold"
            color="text-secondary"
          >
            WEEKLY RAFT REWARDS
          </Typography>
          <Typography
            className="raft__stake__not-connected__value"
            variant="body"
            weight="medium"
            color="text-secondary"
          >
            {/* https://docs.balancer.fi/reference/vebal-and-gauges/estimating-gauge-incentive-aprs.html
              The overall gauge vote percentage directs the weekly BAL emissions.
              If the weekly total amount is 145,000 BAL per week, a pool gauge with 1% of the vote will net in 1,450 BAL towards that gauge
          */}
            N/A
          </Typography>
          <div className="raft__stake__not-connected__btn-container">
            <Button variant="primary" size="large" onClick={onConnectWallet}>
              <Typography variant="button-label" color="text-primary-inverted">
                Connect wallet
              </Typography>
            </Button>
          </div>
        </div>
      </div>
      <div className="raft__stake__sidebar">
        <FAQ defaultOpen />
        <HowToLock defaultOpen />
      </div>
    </div>
  );
};

export default memo(NotConnected);
