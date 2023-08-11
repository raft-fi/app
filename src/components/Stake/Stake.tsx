import { addMilliseconds, startOfDay } from 'date-fns';
import { memo, useCallback, useState } from 'react';
import { YEAR_IN_MS } from '../../constants';
import { useWallet } from '../../hooks';
import Connected from './Connected';
import NotConnected from './NotConnected';

import './Stake.scss';

const Stake = () => {
  const wallet = useWallet();
  const [step, setStep] = useState<number>(1);
  const [amountToLock, setAmountToLock] = useState<string>('');
  const [deadline, setDeadline] = useState<Date>();
  const [period, setPeriod] = useState<number>();

  const onDeadlineChange = useCallback((value: Date) => {
    setDeadline(value);
    setPeriod(undefined);
  }, []);
  const onPeriodChange = useCallback((year: number) => {
    setDeadline(addMilliseconds(startOfDay(new Date()), year * YEAR_IN_MS));
    setPeriod(year);
  }, []);

  if (!wallet) {
    return (
      <NotConnected
        amountToLock={amountToLock}
        deadline={deadline}
        period={period}
        onAmountChange={setAmountToLock}
        onDeadlineChange={onDeadlineChange}
        onPeriodChange={onPeriodChange}
      />
    );
  }

  if (step === 1) {
    return (
      <Connected
        amountToLock={amountToLock}
        deadline={deadline}
        period={period}
        onAmountChange={setAmountToLock}
        onDeadlineChange={onDeadlineChange}
        onPeriodChange={onPeriodChange}
        onNextStep={() => setStep(2)}
      />
    );
  }

  return null;
};

export default memo(Stake);
